const { BigPromise } = require("../middlewares/bigPromise");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.sendStripePublishableKey = (req, res) => {
  res.status(200).json({
    stripeKey: process.env.STRIPE_PUBLISHABLE_KEY,
  });
};

exports.captureStripePayment = BigPromise(async (req, res) => {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: req.body.amount,
    currency: "inr",
  });

  res.status(201).json({
    paymentIntent,
  });
});

exports.sendRazorpayPublishableKey = (req, res) => {
  res.status(200).json({
    stripeKey: process.env.RAZORPAY_KEY_ID,
  });
};

exports.captureRazorpayPayment = BigPromise(async (req, res) => {
  const instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  var options = {
    amount: req.amount, // amount in the smallest currency unit
    currency: "INR",
  };

  instance.orders.create(options, function (err, order) {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err,
      });
    }
    res.status(201).json({
      order,
    });
  });
});
