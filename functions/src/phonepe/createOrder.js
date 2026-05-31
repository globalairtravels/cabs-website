const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const { computeChecksum, getBaseUrl, PAY_PATH } = require("../utils/phonepe");

const PHONEPE_MERCHANT_ID = defineSecret("PHONEPE_MERCHANT_ID");
const PHONEPE_SALT_KEY = defineSecret("PHONEPE_SALT_KEY");
const PHONEPE_SALT_INDEX = defineSecret("PHONEPE_SALT_INDEX");

// Allowed origins — add your production domain here
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
    secrets: [PHONEPE_MERCHANT_ID, PHONEPE_SALT_KEY, PHONEPE_SALT_INDEX],
    region: "asia-south1",
  },
  async (req, res) => {
    setCors(req, res);
    if (req.method === "OPTIONS") return res.status(204).send("");
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { bookingId, amount, customerPhone, bookingDetails } = req.body;

    if (!bookingId || !amount || !customerPhone || !bookingDetails) {
      return res.status(400).json({ error: "Missing required fields: bookingId, amount, customerPhone, bookingDetails" });
    }
    if (typeof amount !== "number" || amount < 100) {
      return res.status(400).json({ error: "amount must be a number in paise, minimum 100" });
    }

    const merchantId = PHONEPE_MERCHANT_ID.value();
    const saltKey = PHONEPE_SALT_KEY.value();
    const saltIndex = PHONEPE_SALT_INDEX.value();
    const env = process.env.PHONEPE_ENV || "sandbox";

    const db = admin.firestore();

    // Idempotency check — don't create duplicate orders
    const existingDoc = await db.collection("bookings").doc(bookingId).get();
    if (existingDoc.exists && existingDoc.data().paymentStatus !== "failed") {
      return res.status(409).json({ error: "Booking already exists", bookingId });
    }

    const merchantTransactionId = bookingId;
    const redirectBase = process.env.SITE_URL || "https://globalairtravels.com";

    const payload = {
      merchantId,
      merchantTransactionId,
      merchantUserId: `USER-${customerPhone}`,
      amount, // in paise
      redirectUrl: `${redirectBase}/bookings/status?id=${bookingId}`,
      redirectMode: "REDIRECT",
      callbackUrl: `https://asia-south1-${process.env.GCLOUD_PROJECT}.cloudfunctions.net/phonePeWebhook`,
      mobileNumber: customerPhone,
      paymentInstrument: { type: "PAY_PAGE" },
    };

    const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64");
    const checksum = computeChecksum(base64Payload, PAY_PATH, saltKey, saltIndex);
    const baseUrl = getBaseUrl(env);

    let phonePeResponse;
    try {
      const response = await fetch(`${baseUrl}${PAY_PATH}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": checksum,
        },
        body: JSON.stringify({ request: base64Payload }),
      });
      phonePeResponse = await response.json();
    } catch (err) {
      console.error("PhonePe API error:", err);
      return res.status(502).json({ error: "Failed to reach PhonePe API" });
    }

    if (!phonePeResponse.success) {
      console.error("PhonePe rejected order:", phonePeResponse);
      return res.status(422).json({ error: "PhonePe order initiation failed", details: phonePeResponse });
    }

    // Persist booking with pending status before redirecting user
    await db.collection("bookings").doc(bookingId).set({
      bookingId,
      paymentStatus: "pending",
      paymentGateway: "phonepe",
      merchantTransactionId,
      amount,
      customerPhone,
      bookingDetails,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const redirectUrl = phonePeResponse.data.instrumentResponse.redirectInfo.url;
    return res.status(200).json({ redirectUrl });
  }
);
