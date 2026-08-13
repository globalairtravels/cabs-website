const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

// Browser origins allowed to call the order endpoints. Webhooks are
// server-to-server (no Origin header) and are unaffected by CORS.
const ALLOWED_ORIGINS = [
  "https://globalairtravels.com",
  "https://www.globalairtravels.com",
  "http://localhost:3000",
];

function setCors(req, res) {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) res.set("Access-Control-Allow-Origin", origin);
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
}

// "sandbox" | "production", shared across gateways. PHONEPE_ENV kept as a fallback
// for back-compat with the earlier single-gateway setup.
function paymentsEnv() {
  return process.env.PAYMENTS_ENV || process.env.PHONEPE_ENV || "sandbox";
}

function redirectUrlFor(bookingId) {
  const base = process.env.SITE_URL || "https://globalairtravels.com";
  return `${base}/bookings/status?id=${encodeURIComponent(bookingId)}`;
}

// ----- Route handlers (gateway-agnostic; gateway specifics live in the adapter) -----

async function handleCreateOrder(req, res, gatewayName, adapter) {
  const { bookingId, amount, customerPhone, bookingDetails, uid } = req.body || {};

  if (!bookingId || !amount || !customerPhone || !bookingDetails) {
    return res.status(400).json({ error: "Missing required fields: bookingId, amount, customerPhone, bookingDetails" });
  }
  if (typeof amount !== "number" || !Number.isInteger(amount) || amount < 100) {
    return res.status(400).json({ error: "amount must be an integer in paise, minimum 100" });
  }
  // merchantOrderId rules (PhonePe): max 63 chars, alphanumerics plus "_" and "-".
  if (!/^[A-Za-z0-9_-]{1,63}$/.test(bookingId)) {
    return res.status(400).json({ error: "Invalid bookingId format" });
  }

  const db = admin.firestore();
  const normalizedUid = typeof uid === "string" && uid ? uid : null;

  // Idempotency: never re-initiate against an existing non-failed order. The client
  // mints a fresh bookingId per attempt, so retries get a new id and never hit this;
  // this only guards an id collision from clobbering a pending/confirmed booking.
  const existing = await db.collection("bookings").doc(bookingId).get();
  if (existing.exists && existing.data().paymentStatus !== "failed") {
    return res.status(409).json({ error: "Booking already exists", bookingId });
  }

  let order;
  try {
    order = await adapter.createOrder({
      bookingId,
      amount,
      customerPhone,
      uid: normalizedUid,
      env: paymentsEnv(),
      redirectUrl: redirectUrlFor(bookingId),
    });
  } catch (err) {
    console.error(`[${gatewayName}] createOrder failed:`, err);
    return res.status(err.status || 502).json({ error: err.message || "Payment initiation failed", details: err.details });
  }

  // Persist as pending before redirecting. `uid` links it to a signed-in user
  // (null for guests) for the rules-gated "My Bookings" query.
  await db.collection("bookings").doc(bookingId).set({
    bookingId,
    paymentStatus: "pending",
    paymentGateway: gatewayName,
    gatewayOrderId: order.orderId ?? null,
    amount,
    customerPhone,
    uid: normalizedUid,
    bookingDetails,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return res.status(200).json({ redirectUrl: order.redirectUrl, bookingId });
}

async function handleOrderStatus(req, res, gatewayName, adapter, orderId) {
  const db = admin.firestore();
  const ref = db.collection("bookings").doc(orderId);
  const snap = await ref.get();
  if (!snap.exists) return res.status(404).json({ error: "Order not found" });

  let paymentStatus = snap.data().paymentStatus;

  // Reconcile with the gateway's live status — covers a missed/late webhook so a
  // booking never gets stuck "pending" forever.
  if (typeof adapter.getOrderStatus === "function") {
    try {
      const live = await adapter.getOrderStatus({ orderId, env: paymentsEnv() });
      const next = live.paymentStatus;
      const downgrade = paymentStatus === "confirmed" && next !== "confirmed";
      if (next && next !== paymentStatus && !downgrade) {
        paymentStatus = next;
        await ref.update({
          paymentStatus,
          gatewayState: live.state ?? null,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    } catch (err) {
      console.error(`[${gatewayName}] getOrderStatus failed:`, err);
    }
  }

  // Deliberately minimal — this endpoint is unauthenticated, so it never returns
  // bookingDetails / customer info, only the payment state.
  return res.status(200).json({
    bookingId: orderId,
    paymentStatus,
    amount: snap.data().amount ?? null,
  });
}

async function handleWebhook(req, res, gatewayName, adapter) {
  const result = adapter.verifyWebhook(req);
  if (!result.valid) {
    console.error(`[${gatewayName}] webhook auth mismatch — possible spoofed request`);
    return res.status(401).send("Unauthorized");
  }
  if (result.ignore) return res.status(200).send("OK");

  const { merchantOrderId, paymentStatus, state, event, orderId, paymentDetails } = result;
  if (!merchantOrderId) {
    console.error(`[${gatewayName}] webhook payload missing merchantOrderId`);
    return res.status(400).send("Bad request");
  }

  const db = admin.firestore();
  const ref = db.collection("bookings").doc(merchantOrderId);
  const snap = await ref.get();
  if (!snap.exists) {
    console.warn(`[${gatewayName}] webhook for unknown booking: ${merchantOrderId}`);
    return res.status(200).send("OK"); // 200 so the gateway stops retrying
  }

  // Never downgrade a paid booking (webhooks can be re-sent / arrive out of order).
  if (snap.data().paymentStatus === "confirmed" && paymentStatus !== "confirmed") {
    return res.status(200).send("OK");
  }

  await ref.update({
    paymentStatus,
    paymentGateway: gatewayName,
    gatewayEvent: event ?? null,
    gatewayState: state ?? null,
    gatewayOrderId: orderId ?? snap.data().gatewayOrderId ?? null,
    gatewayPaymentDetails: paymentDetails ?? null,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log(`[${gatewayName}] booking ${merchantOrderId} → ${paymentStatus} (event: ${event}, state: ${state})`);
  return res.status(200).send("OK");
}

/**
 * Single HTTP function that routes across all registered gateways.
 * URL shape (function name = "payments"):
 *   POST /payments/<gateway>/orders/new        → { redirectUrl, bookingId }
 *   GET  /payments/<gateway>/orders/<orderId>  → { bookingId, paymentStatus, amount }
 *   POST /payments/<gateway>/webhook           → "OK"
 *
 * `adapters` is a map of { [gatewayName]: adapter }. Each adapter must provide:
 * createOrder(), verifyWebhook(), optional getOrderStatus(), and `secrets`.
 */
function createGatewayRouter(adapters) {
  const allSecrets = Object.values(adapters).flatMap((a) => a.secrets || []);

  return onRequest(
    { secrets: allSecrets, region: "asia-south1" },
    async (req, res) => {
      setCors(req, res);
      if (req.method === "OPTIONS") return res.status(204).send("");

      const segments = (req.path || "").split("/").filter(Boolean);
      const gatewayName = segments[0];
      const adapter = adapters[gatewayName];

      if (!adapter) return res.status(404).json({ error: "Unknown payment gateway" });

      const sub = segments.slice(1);

      if (sub[0] === "orders" && sub[1] === "new" && sub.length === 2) {
        if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
        return handleCreateOrder(req, res, gatewayName, adapter);
      }
      if (sub[0] === "orders" && sub.length === 2) {
        if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
        return handleOrderStatus(req, res, gatewayName, adapter, decodeURIComponent(sub[1]));
      }
      if (sub[0] === "webhook" && sub.length === 1) {
        if (req.method !== "POST") return res.status(405).send("Method not allowed");
        return handleWebhook(req, res, gatewayName, adapter);
      }

      return res.status(404).json({ error: "Not found" });
    }
  );
}

module.exports = { createGatewayRouter };
