const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const { createBookingsRouter } = require("./bookings/handler");
const phonepeAdapter = require("./payments/gateways/phonepe");
const razorpayAdapter = require("./payments/gateways/razorpay");

// Single function. Frontend always POSTs /new — config decides sheet-only vs a gateway.
//   POST /bookings/new
//   GET  /bookings/:bookingId
//   POST /bookings/webhooks/phonepe
//   POST /bookings/webhooks/razorpay
const router = createBookingsRouter({
  phonepe: phonepeAdapter,
  razorpay: razorpayAdapter,
});

exports.bookings = router;
// Same router under the previous function name so an already-deployed `payments`
// URL keeps working after a redeploy.
exports.payments = router;
