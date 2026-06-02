const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const { verifyWebhookAuth } = require("../utils/phonepe");

// Webhook credentials configured in the PhonePe dashboard (Developer Settings →
// Webhooks). PhonePe sends Authorization = SHA256(username:password).
//   firebase functions:secrets:set PHONEPE_WEBHOOK_USERNAME
//   firebase functions:secrets:set PHONEPE_WEBHOOK_PASSWORD
const PHONEPE_WEBHOOK_USERNAME = defineSecret("PHONEPE_WEBHOOK_USERNAME");
const PHONEPE_WEBHOOK_PASSWORD = defineSecret("PHONEPE_WEBHOOK_PASSWORD");

// PhonePe v2 order state → our booking paymentStatus.
const STATE_TO_STATUS = {
  COMPLETED: "confirmed",
  FAILED: "failed",
  PENDING: "pending",
};

exports.phonePeWebhook = onRequest(
  {
    secrets: [PHONEPE_WEBHOOK_USERNAME, PHONEPE_WEBHOOK_PASSWORD],
    region: "asia-south1",
  },
  async (req, res) => {
    if (req.method !== "POST") return res.status(405).send("Method not allowed");

    if (!verifyWebhookAuth(req.headers["authorization"], PHONEPE_WEBHOOK_USERNAME.value(), PHONEPE_WEBHOOK_PASSWORD.value())) {
      console.error("Webhook auth mismatch — possible spoofed request");
      return res.status(401).send("Unauthorized");
    }

    const { event, payload } = req.body || {};
    const merchantOrderId = payload?.merchantOrderId;
    const state = payload?.state;

    if (!merchantOrderId) {
      console.error("Webhook payload missing merchantOrderId", req.body);
      return res.status(400).send("Bad request");
    }

    // Refund events don't change order payment status in this flow.
    if (typeof event === "string" && event.startsWith("pg.refund")) {
      return res.status(200).send("OK");
    }

    const paymentStatus = STATE_TO_STATUS[state] ?? "failed";
    const db = admin.firestore();
    const bookingRef = db.collection("bookings").doc(merchantOrderId);

    const snapshot = await bookingRef.get();
    if (!snapshot.exists) {
      console.warn(`Webhook received for unknown booking: ${merchantOrderId}`);
      // Still 200 so PhonePe stops retrying.
      return res.status(200).send("OK");
    }

    // Webhooks can be re-sent or arrive out of order — never downgrade a paid booking.
    if (snapshot.data().paymentStatus === "confirmed" && paymentStatus !== "confirmed") {
      return res.status(200).send("OK");
    }

    await bookingRef.update({
      paymentStatus,
      phonePeEvent: event ?? null,
      phonePeState: state ?? null,
      phonePeOrderId: payload?.orderId ?? null,
      phonePePaymentDetails: payload?.paymentDetails ?? null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`Booking ${merchantOrderId} → ${paymentStatus} (event: ${event}, state: ${state})`);

    // Return 200 — PhonePe retries if it doesn't get a 200.
    return res.status(200).send("OK");
  }
);
