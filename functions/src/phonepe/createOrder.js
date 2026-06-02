const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const { hostsFor, getAccessToken } = require("../utils/phonepe");

// PhonePe Standard Checkout v2 credentials (OAuth). Set via:
//   firebase functions:secrets:set PHONEPE_CLIENT_ID
//   firebase functions:secrets:set PHONEPE_CLIENT_SECRET
//   firebase functions:secrets:set PHONEPE_CLIENT_VERSION
const PHONEPE_CLIENT_ID = defineSecret("PHONEPE_CLIENT_ID");
const PHONEPE_CLIENT_SECRET = defineSecret("PHONEPE_CLIENT_SECRET");
const PHONEPE_CLIENT_VERSION = defineSecret("PHONEPE_CLIENT_VERSION");

// Allowed browser origins for the create-order call.
const ALLOWED_ORIGINS = [
  "https://globalairtravels.com",
  "https://www.globalairtravels.com",
  "http://localhost:3000",
];

function setCors(req, res) {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.set("Access-Control-Allow-Origin", origin);
  }
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
}

exports.createPhonePeOrder = onRequest(
  {
    secrets: [PHONEPE_CLIENT_ID, PHONEPE_CLIENT_SECRET, PHONEPE_CLIENT_VERSION],
    region: "asia-south1",
  },
  async (req, res) => {
    setCors(req, res);
    if (req.method === "OPTIONS") return res.status(204).send("");
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { bookingId, amount, customerPhone, bookingDetails, uid } = req.body || {};

    if (!bookingId || !amount || !customerPhone || !bookingDetails) {
      return res.status(400).json({ error: "Missing required fields: bookingId, amount, customerPhone, bookingDetails" });
    }
    if (typeof amount !== "number" || !Number.isInteger(amount) || amount < 100) {
      return res.status(400).json({ error: "amount must be an integer in paise, minimum 100" });
    }
    // merchantOrderId rules: max 63 chars, alphanumerics plus "_" and "-".
    if (!/^[A-Za-z0-9_-]{1,63}$/.test(bookingId)) {
      return res.status(400).json({ error: "Invalid bookingId format" });
    }

    const env = process.env.PHONEPE_ENV || "sandbox";
    const db = admin.firestore();

    // Idempotency: never re-initiate against an existing non-failed order. The
    // client mints a fresh bookingId per attempt, so legitimate retries get a new
    // id and never hit this; this only guards against an id collision clobbering
    // another booking's pending/confirmed doc.
    const existingDoc = await db.collection("bookings").doc(bookingId).get();
    if (existingDoc.exists && existingDoc.data().paymentStatus !== "failed") {
      return res.status(409).json({ error: "Booking already exists", bookingId });
    }

    const redirectBase = process.env.SITE_URL || "https://globalairtravels.com";

    let accessToken;
    try {
      accessToken = await getAccessToken({
        env,
        clientId: PHONEPE_CLIENT_ID.value(),
        clientSecret: PHONEPE_CLIENT_SECRET.value(),
        clientVersion: PHONEPE_CLIENT_VERSION.value(),
      });
    } catch (err) {
      console.error("PhonePe OAuth error:", err);
      return res.status(502).json({ error: "Failed to authenticate with PhonePe" });
    }

    const payload = {
      merchantOrderId: bookingId,
      amount, // paise
      expireAfter: 1200, // seconds (20 min) — within PhonePe's 300–3600 range
      paymentFlow: {
        type: "PG_CHECKOUT",
        message: "Global Air Travels cab booking",
        merchantUrls: {
          redirectUrl: `${redirectBase}/bookings/status?id=${encodeURIComponent(bookingId)}`,
        },
      },
      metaInfo: {
        udf1: String(customerPhone),
        udf2: typeof uid === "string" && uid ? uid : "guest",
      },
    };

    const { pg } = hostsFor(env);
    let phonePeResponse;
    try {
      const response = await fetch(`${pg}/checkout/v2/pay`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `O-Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });
      phonePeResponse = await response.json().catch(() => ({}));
      if (!response.ok || !phonePeResponse.redirectUrl) {
        console.error("PhonePe rejected order:", response.status, phonePeResponse);
        return res.status(422).json({ error: "PhonePe order initiation failed", details: phonePeResponse });
      }
    } catch (err) {
      console.error("PhonePe API error:", err);
      return res.status(502).json({ error: "Failed to reach PhonePe API" });
    }

    // Persist the booking as pending before redirecting. `uid` links it to a
    // signed-in user (null for guests) for the rules-gated "My Bookings" query.
    await db.collection("bookings").doc(bookingId).set({
      bookingId,
      paymentStatus: "pending",
      paymentGateway: "phonepe",
      phonePeOrderId: phonePeResponse.orderId ?? null,
      amount,
      customerPhone,
      uid: typeof uid === "string" && uid ? uid : null,
      bookingDetails,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({ redirectUrl: phonePeResponse.redirectUrl });
  }
);
