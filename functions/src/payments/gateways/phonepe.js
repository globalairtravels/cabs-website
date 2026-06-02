const { defineSecret } = require("firebase-functions/params");
const { hostsFor, getAccessToken, verifyWebhookAuth } = require("../../utils/phonepe");

// PhonePe Standard Checkout v2 credentials (OAuth) + webhook basic creds.
const CLIENT_ID = defineSecret("PHONEPE_CLIENT_ID");
const CLIENT_SECRET = defineSecret("PHONEPE_CLIENT_SECRET");
const CLIENT_VERSION = defineSecret("PHONEPE_CLIENT_VERSION");
const WEBHOOK_USERNAME = defineSecret("PHONEPE_WEBHOOK_USERNAME");
const WEBHOOK_PASSWORD = defineSecret("PHONEPE_WEBHOOK_PASSWORD");

// PhonePe v2 order state → canonical booking paymentStatus.
const STATE_TO_STATUS = { COMPLETED: "confirmed", FAILED: "failed", PENDING: "pending" };

function credentials() {
  return {
    clientId: CLIENT_ID.value(),
    clientSecret: CLIENT_SECRET.value(),
    clientVersion: CLIENT_VERSION.value(),
  };
}

async function createOrder({ bookingId, amount, customerPhone, uid, env, redirectUrl }) {
  const token = await getAccessToken({ env, ...credentials() });
  const { pg } = hostsFor(env);

  const payload = {
    merchantOrderId: bookingId,
    amount, // paise
    expireAfter: 1200, // seconds (20 min) — within PhonePe's 300–3600 range
    paymentFlow: {
      type: "PG_CHECKOUT",
      message: "Global Air Travels cab booking",
      merchantUrls: { redirectUrl },
    },
    metaInfo: { udf1: String(customerPhone), udf2: uid || "guest" },
  };

  const res = await fetch(`${pg}/checkout/v2/pay`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `O-Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.redirectUrl) {
    const err = new Error("PhonePe order initiation failed");
    err.status = 422;
    err.details = data;
    throw err;
  }
  return { redirectUrl: data.redirectUrl, orderId: data.orderId ?? null };
}

async function getOrderStatus({ orderId, env }) {
  const token = await getAccessToken({ env, ...credentials() });
  const { pg } = hostsFor(env);

  const res = await fetch(`${pg}/checkout/v2/order/${encodeURIComponent(orderId)}/status`, {
    method: "GET",
    headers: { "Content-Type": "application/json", Authorization: `O-Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error("PhonePe status lookup failed");
    err.status = 502;
    err.details = data;
    throw err;
  }
  return {
    state: data.state ?? null,
    paymentStatus: STATE_TO_STATUS[data.state] ?? "pending",
    amount: data.amount ?? null,
    raw: data,
  };
}

// PhonePe v2 webhooks authenticate with a static Authorization header:
// SHA256(username:password). Body is plain JSON { event, payload }.
function verifyWebhook(req) {
  const ok = verifyWebhookAuth(req.headers["authorization"], WEBHOOK_USERNAME.value(), WEBHOOK_PASSWORD.value());
  if (!ok) return { valid: false };

  const { event, payload } = req.body || {};
  if (typeof event === "string" && event.startsWith("pg.refund")) {
    return { valid: true, ignore: true };
  }
  return {
    valid: true,
    merchantOrderId: payload?.merchantOrderId,
    paymentStatus: STATE_TO_STATUS[payload?.state] ?? "failed",
    state: payload?.state ?? null,
    event: event ?? null,
    orderId: payload?.orderId ?? null,
    paymentDetails: payload?.paymentDetails ?? null,
  };
}

module.exports = {
  createOrder,
  getOrderStatus,
  verifyWebhook,
  secrets: [CLIENT_ID, CLIENT_SECRET, CLIENT_VERSION, WEBHOOK_USERNAME, WEBHOOK_PASSWORD],
};
