// Razorpay adapter stub. Standard Checkout is a modal + signature flow, not a
// hosted redirect, so a real adapter needs frontend Checkout.js (or Payment Links
// if we want to keep the PhonePe-style redirect). Not called while
// config.checkout.json has gateways.razorpay.enabled = false.

async function createOrder() {
  const err = new Error("Razorpay is not enabled");
  err.status = 501;
  throw err;
}

async function getOrderStatus() {
  const err = new Error("Razorpay is not enabled");
  err.status = 501;
  throw err;
}

function verifyWebhook() {
  return { valid: false };
}

module.exports = {
  createOrder,
  getOrderStatus,
  verifyWebhook,
  secrets: [],
};
