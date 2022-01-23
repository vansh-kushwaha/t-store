const express = require("express");
const {
  sendRazorpayPublishableKey,
  sendStripePublishableKey,
  captureRazorpayPayment,
  captureStripePayment,
} = require("../controllers/paymentController");
const { isLoggedIn } = require("../middlewares/userMiddlewares");
const router = express.Router();

router.route("/razorpaykey").get(isLoggedIn, sendRazorpayPublishableKey);
router.route("/stripekey").get(isLoggedIn, sendStripePublishableKey);

router.route("/capturestripepayment").put(isLoggedIn, captureStripePayment);
router.route("/capturerazorpaypayment").put(isLoggedIn, captureRazorpayPayment);

module.exports = router;
