const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const { createPhonePeOrder } = require("./phonepe/createOrder");
const { phonePeWebhook } = require("./phonepe/webhook");

// PhonePe — active gateway
module.exports = { createPhonePeOrder, phonePeWebhook };

// Razorpay — future gateway (uncomment when ready)
// const { createRazorpayOrder } = require("./razorpay/createOrder");
// const { razorpayWebhook } = require("./razorpay/webhook");
// module.exports = { ...module.exports, createRazorpayOrder, razorpayWebhook };
