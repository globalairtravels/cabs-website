const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const { verifyWebhookChecksum } = require("../utils/phonepe");

const PHONEPE_SALT_KEY = defineSecret("PHONEPE_SALT_KEY");

const PAYMENT_CODE_TO_STATUS = {
  PAYMENT_SUCCESS: "confirmed",
  PAYMENT_DECLINED: "failed",
  PAYMENT_PENDING: "pending",
  TIMED_OUT: "failed",
};

exports.phonePeWebhook = onRequest(
  {
    secrets: [PHONEPE_SALT_KEY],
    region: "asia-south1",
  },
  async (req, res) => {
    if (req.method !== "POST") return res.status(405).send("Method not allowed");

    const xVerify = req.headers["x-verify"];
    const { response: responseBase64 } = req.body;

    if (!xVerify || !responseBase64) {
      console.warn("Webhook missing x-verify or response body");
      return res.status(400).send("Bad request");
    }

    const saltKey = PHONEPE_SALT_KEY.value();

    if (!verifyWebhookChecksum(responseBase64, xVerify, saltKey)) {
      console.error("Webhook signature mismatch — possible spoofed request");
      return res.status(401).send("Unauthorized");
    }

    let decoded;
    try {
      decoded = JSON.parse(Buffer.from(responseBase64, "base64").toString("utf8"));
    } catch {
      console.error("Failed to decode PhonePe response payload");
      return res.status(400).send("Bad request");
    }

    const { code, data } = decoded;
    const merchantTransactionId = data?.merchantTransactionId;

    if (!merchantTransactionId) {
      console.error("Webhook payload missing merchantTransactionId", decoded);
      return res.status(400).send("Bad request");
    }

    const paymentStatus = PAYMENT_CODE_TO_STATUS[code] ?? "failed";
    const db = admin.firestore();
    const bookingRef = db.collection("bookings").doc(merchantTransactionId);

    const snapshot = await bookingRef.get();
    if (!snapshot.exists) {
      console.warn(`Webhook received for unknown booking: ${merchantTransactionId}`);
      // Still return 200 so PhonePe doesn't keep retrying
      return res.status(200).send("OK");
    }

    await bookingRef.update({
      paymentStatus,
      phonePeCode: code,
      phonePeTransactionId: data?.transactionId ?? null,
      phonePePaymentInstrument: data?.paymentInstrument ?? null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`Booking ${merchantTransactionId} updated to ${paymentStatus} (PhonePe code: ${code})`);

    // Return 200 — PhonePe retries if it doesn't get a 200
    return res.status(200).send("OK");
  }
);
