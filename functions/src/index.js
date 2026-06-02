const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const { createGatewayFunction } = require("./payments/handler");
const phonepeAdapter = require("./payments/gateways/phonepe");

// One HTTP function per gateway, mounted at the gateway name. Endpoints:
//   POST /<gateway>/orders/new        — create order, returns { redirectUrl }
//   GET  /<gateway>/orders/<orderId>  — reconcile + return { paymentStatus }
//   POST /<gateway>/webhook           — gateway → booking status updates
exports.phonepe = createGatewayFunction("phonepe", phonepeAdapter);

// Future gateways — drop an adapter in payments/gateways/ and export it here:
// const razorpayAdapter = require("./payments/gateways/razorpay");
// exports.razorpay = createGatewayFunction("razorpay", razorpayAdapter);
