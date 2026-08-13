const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { getCheckoutConfig, paymentOptionsFor } = require("../config/checkout");
const { sheetsSecrets, spreadsheetId, appendBookingRow, updateBookingRow } = require("../utils/sheets");

const ALLOWED_ORIGINS = [
  "https://globalairtravels.com",
  "https://www.globalairtravels.com",
  "https://globalairtravels-9651f.web.app",
  "https://globalairtravels-9651f.firebaseapp.com",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

const TRIP_TYPE_TO_BOOKING_TYPE = {
  airport: "airport",
  city: "city",
  daily: "intercity",
  intercity: "intercity",
  tempo: "tempo",
};

function setCors(req, res) {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) res.set("Access-Control-Allow-Origin", origin);
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
}

function paymentsEnv() {
  return process.env.PAYMENTS_ENV || process.env.PHONEPE_ENV || "sandbox";
}

function redirectUrlFor(bookingId) {
  const base = process.env.SITE_URL || "https://globalairtravels.com";
  return `${base.replace(/\/+$/, "")}/bookings/status?id=${encodeURIComponent(bookingId)}`;
}

function mintBookingId() {
  return `GAT-${Math.floor(100000 + Math.random() * 900000)}`;
}

function normalizePhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  if (digits.length === 11 && digits.startsWith("0")) return `+91${digits.slice(1)}`;
  if (String(value || "").startsWith("+") && digits.length >= 10) return `+${digits}`;
  return null;
}

function asPositiveInt(value, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.floor(n);
}

function rupeesToPaise(rupees) {
  const n = Number(rupees);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}

function pathSegments(req) {
  let segments = String(req.path || "").split("/").filter(Boolean);
  if (segments[0] === "bookings" || segments[0] === "payments") {
    segments = segments.slice(1);
  }
  return segments;
}

function bookingTypeOf(details) {
  return TRIP_TYPE_TO_BOOKING_TYPE[details?.tripType] || details?.bookingType || null;
}

function advanceDaysOf(details) {
  if (details?.tripType === "city") return asPositiveInt(details.cityDays, 1);
  if (details?.tripType === "tempo") return asPositiveInt(details.tempoDays, 1);
  return 1;
}

async function writeSheetOrThrow(record) {
  try {
    await appendBookingRow(record);
  } catch (err) {
    console.error("[sheets] append failed:", err);
    const wrapped = new Error("Could not save the booking request. Please try again or contact support.");
    wrapped.status = 503;
    throw wrapped;
  }
}

async function syncSheetStatus(bookingId, { paymentStatus, paymentGateway, amountPaise, bookingDetails }) {
  try {
    const amountPaid = paymentStatus === "confirmed" ? Math.round((amountPaise || 0) / 100) : 0;
    await updateBookingRow(bookingId, {
      paymentStatus,
      paymentGateway,
      amountPaid,
      bookingDetails,
    });
  } catch (err) {
    console.error(`[sheets] update failed for ${bookingId}:`, err);
  }
}

async function handleCreateBooking(req, res, adapters) {
  const config = getCheckoutConfig();
  const body = req.body || {};
  const details = body.bookingDetails;
  const customerPhone = normalizePhone(body.customerPhone || details?.phone);

  if (!details || typeof details !== "object") {
    return res.status(400).json({ error: "Missing required field: bookingDetails" });
  }
  if (!customerPhone) {
    return res.status(400).json({ error: "A valid 10-digit Indian mobile number is required" });
  }

  const bookingType = bookingTypeOf(details);
  if (!bookingType) {
    return res.status(400).json({ error: "bookingDetails.tripType is invalid" });
  }

  const allowed = paymentOptionsFor(bookingType, config);
  const paymentMethod = body.paymentMethod || details.paymentMethod;
  if (!allowed.includes(paymentMethod)) {
    return res.status(400).json({
      error: `paymentMethod must be one of: ${allowed.join(", ")}`,
      allowed,
    });
  }

  const finalTotalRupees = asPositiveInt(details.finalTotal ?? details.totalPrice, 0);
  const advanceRupees = config.advanceRupeesPerDay * advanceDaysOf(details);
  const onlineRupees = paymentMethod === "full" ? finalTotalRupees : advanceRupees;
  const onlinePaise = rupeesToPaise(onlineRupees);
  const payToDriverRupees = Math.max(0, finalTotalRupees - onlineRupees);

  const bookingDetails = {
    ...details,
    paymentMethod,
    onlinePaymentAmount: onlineRupees,
    payToDriverAmount: payToDriverRupees,
    phone: customerPhone,
  };

  let bookingId = typeof body.bookingId === "string" ? body.bookingId.trim() : "";
  if (bookingId && !/^[A-Za-z0-9_-]{1,63}$/.test(bookingId)) {
    return res.status(400).json({ error: "Invalid bookingId format" });
  }
  if (!bookingId) bookingId = mintBookingId();

  const db = admin.firestore();
  const ref = db.collection("bookings").doc(bookingId);
  const existing = await ref.get();
  if (existing.exists && existing.data().paymentStatus !== "failed") {
    return res.status(409).json({ error: "Booking already exists", bookingId });
  }

  const normalizedUid = typeof body.uid === "string" && body.uid ? body.uid : null;
  const gatewayName = config.sheetOnly ? null : config.defaultGateway;
  const adapter = gatewayName ? adapters[gatewayName] : null;

  if (gatewayName && !adapter) {
    return res.status(500).json({ error: `Payment gateway "${gatewayName}" is not available` });
  }
  if (adapter && onlinePaise < 100) {
    return res.status(400).json({ error: "Online payment amount must be at least ₹1" });
  }

  let order = { redirectUrl: null, orderId: null };
  if (adapter) {
    try {
      order = await adapter.createOrder({
        bookingId,
        amount: onlinePaise,
        customerPhone,
        uid: normalizedUid,
        env: paymentsEnv(),
        redirectUrl: redirectUrlFor(bookingId),
      });
    } catch (err) {
      console.error(`[${gatewayName}] createOrder failed:`, err);
      return res.status(err.status || 502).json({
        error: err.message || "Payment initiation failed",
        details: err.details,
      });
    }
  }

  const record = {
    bookingId,
    mode: adapter ? "payment" : "request",
    paymentStatus: adapter ? "pending" : "requested",
    paymentGateway: gatewayName || "none",
    gatewayOrderId: order.orderId ?? null,
    amount: onlinePaise,
    customerPhone,
    uid: normalizedUid,
    bookingDetails,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await ref.set(record);

  if (config.sheetEnabled) {
    try {
      await writeSheetOrThrow({
        ...record,
        bookingDetails,
      });
    } catch (err) {
      try {
        await ref.delete();
      } catch (cleanupErr) {
        console.error("[bookings] failed to roll back booking after sheet error:", cleanupErr);
      }
      return res.status(err.status || 503).json({ error: err.message });
    }
  }

  if (adapter) {
    return res.status(200).json({
      mode: "redirect",
      bookingId,
      redirectUrl: order.redirectUrl,
    });
  }

  return res.status(200).json({
    mode: "request",
    bookingId,
  });
}

async function handleBookingStatus(req, res, adapters, bookingId) {
  const db = admin.firestore();
  const ref = db.collection("bookings").doc(bookingId);
  const snap = await ref.get();
  if (!snap.exists) return res.status(404).json({ error: "Order not found" });

  const data = snap.data();
  let paymentStatus = data.paymentStatus;
  const gatewayName = data.paymentGateway;
  const adapter = gatewayName && adapters[gatewayName] ? adapters[gatewayName] : null;
  const config = getCheckoutConfig();

  if (paymentStatus === "pending" && adapter && typeof adapter.getOrderStatus === "function") {
    try {
      const live = await adapter.getOrderStatus({ orderId: bookingId, env: paymentsEnv() });
      const next = live.paymentStatus;
      const downgrade = paymentStatus === "confirmed" && next !== "confirmed";
      if (next && next !== paymentStatus && !downgrade) {
        paymentStatus = next;
        await ref.update({
          paymentStatus,
          gatewayState: live.state ?? null,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        if (config.sheetEnabled) {
          await syncSheetStatus(bookingId, {
            paymentStatus,
            paymentGateway: gatewayName,
            amountPaise: data.amount,
            bookingDetails: data.bookingDetails,
          });
        }
      }
    } catch (err) {
      console.error(`[${gatewayName}] getOrderStatus failed:`, err);
    }
  }

  return res.status(200).json({
    bookingId,
    mode: data.mode || (paymentStatus === "requested" ? "request" : "payment"),
    paymentStatus,
    amount: data.amount ?? null,
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
    return res.status(200).send("OK");
  }

  const current = snap.data();
  if (current.paymentStatus === "confirmed" && paymentStatus !== "confirmed") {
    return res.status(200).send("OK");
  }

  await ref.update({
    paymentStatus,
    paymentGateway: gatewayName,
    gatewayEvent: event ?? null,
    gatewayState: state ?? null,
    gatewayOrderId: orderId ?? current.gatewayOrderId ?? null,
    gatewayPaymentDetails: paymentDetails ?? null,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  const config = getCheckoutConfig();
  if (config.sheetEnabled) {
    await syncSheetStatus(merchantOrderId, {
      paymentStatus,
      paymentGateway: gatewayName,
      amountPaise: current.amount,
      bookingDetails: current.bookingDetails,
    });
  }

  console.log(`[${gatewayName}] booking ${merchantOrderId} → ${paymentStatus} (event: ${event}, state: ${state})`);
  return res.status(200).send("OK");
}

function collectSecrets(adapters) {
  const config = getCheckoutConfig();
  const secrets = [];
  if (config.sheetEnabled) secrets.push(...sheetsSecrets());
  for (const name of config.enabledGateways) {
    const adapter = adapters[name];
    if (adapter?.secrets) secrets.push(...adapter.secrets);
  }
  return secrets;
}

/**
 * Single HTTP function.
 *   POST /new                         → create booking (sheet and/or payment)
 *   GET  /:bookingId                  → { bookingId, paymentStatus, amount, mode }
 *   POST /webhooks/<gateway>          → gateway callback
 *
 * Legacy paths still accepted:
 *   POST /<gateway>/orders/new
 *   GET  /<gateway>/orders/:id
 *   POST /<gateway>/webhook
 */
function createBookingsRouter(adapters) {
  return onRequest(
    { secrets: collectSecrets(adapters), region: "asia-south1", invoker: "public" },
    async (req, res) => {
      setCors(req, res);
      if (req.method === "OPTIONS") return res.status(204).send("");

      const segments = pathSegments(req);

      if ((segments.length === 0 || (segments.length === 1 && segments[0] === "new")) && req.method === "POST") {
        return handleCreateBooking(req, res, adapters);
      }

      if (segments[0] === "webhooks" && segments.length === 2) {
        if (req.method !== "POST") return res.status(405).send("Method not allowed");
        const gatewayName = segments[1];
        const adapter = adapters[gatewayName];
        if (!adapter) return res.status(404).json({ error: "Unknown payment gateway" });
        return handleWebhook(req, res, gatewayName, adapter);
      }

      if (segments.length === 3 && segments[1] === "orders" && segments[2] === "new") {
        if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
        return handleCreateBooking(req, res, adapters);
      }

      if (segments.length === 3 && segments[1] === "orders") {
        if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
        return handleBookingStatus(req, res, adapters, decodeURIComponent(segments[2]));
      }

      if (segments.length === 2 && segments[1] === "webhook") {
        if (req.method !== "POST") return res.status(405).send("Method not allowed");
        const gatewayName = segments[0];
        const adapter = adapters[gatewayName];
        if (!adapter) return res.status(404).json({ error: "Unknown payment gateway" });
        return handleWebhook(req, res, gatewayName, adapter);
      }

      if (segments.length === 1 && req.method === "GET") {
        return handleBookingStatus(req, res, adapters, decodeURIComponent(segments[0]));
      }

      return res.status(404).json({ error: "Not found" });
    }
  );
}

module.exports = { createBookingsRouter };
