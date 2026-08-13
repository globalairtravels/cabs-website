const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const { createGatewayRouter } = require("./payments/handler");
const phonepeAdapter = require("./payments/gateways/phonepe");

// Single "payments" function routes all gateways by path prefix. Endpoints:
//   POST /payments/<gateway>/orders/new        — create order, returns { redirectUrl }
//   GET  /payments/<gateway>/orders/<orderId>  — reconcile + return { paymentStatus }
//   POST /payments/<gateway>/webhook           — gateway → booking status updates
//
// To add a gateway: drop an adapter in payments/gateways/ and add it to the map below.
// const razorpayAdapter = require("./payments/gateways/razorpay");
exports.payments = createGatewayRouter({
  phonepe: phonepeAdapter,
  // razorpay: razorpayAdapter,
});
