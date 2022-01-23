const { BigPromise } = require("../middlewares/bigPromise");
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");

exports.createOrder = BigPromise(async (req, res) => {
  const {
    shippingInfo,
    paymentInfo,
    taxAmount,
    shippingAmount,
    totalAmount,
    orderItems,
  } = req.body;

  Order.create({
    shippingInfo,
    paymentInfo,
    taxAmount,
    shippingAmount,
    totalAmount,
    orderItems,
    user: req.user._id,
  })
    .then((order) => {
      res.status(201).json({
        success: true,
        order,
      });
    })
    .catch((err) => {
      res.status(400).json({
        error: err,
        message: "unable to create order",
      });
    });
});

exports.getOneOrder = (req, res) => {
  const orderId = req.params.orderId;
  Order.findById(orderId)
    .populate("user", "name email")
    .populate({
      path: "orderItems",
      populate: {
        path: "product",
        select: "name price",
      },
    })
    .then((order) => {
      res.status(200).json({
        success: true,
        order,
      });
    })
    .catch((err) => {
      res.status(404).json({
        success: false,
        error: err,
        message: "unable to find order",
      });
    });
};

exports.getAllOrderOfTheUser = (req, res) => {
  const userId = req.user._id;
  Order.find({ user: userId })
    .populate("user", "name email")
    .populate({
      path: "orderItems",
      populate: {
        path: "product",
        select: "name price",
      },
    })
    .then((order) => {
      res.status(200).json({
        success: true,
        noOfOrders: order.length,
        order,
      });
    })
    .catch((err) => {
      res.status(404).json({
        success: false,
        error: err,
        message: "unable to find order",
      });
    });
};

exports.adminGetAllOrders = (req, res) => {
  Order.find()
    .then((orders) => {
      res.status(200).json({
        success: true,
        noOfOrders: orders.length,
        orders,
      });
    })
    .catch((err) => {
      res.status(404).json({
        error: err,
        message: "Order not found",
      });
    });
};

exports.adminUpdateAOrder = BigPromise(async (req, res) => {
  const order = await Order.findById(req.params.orderId);
  if (!order) {
    return res.status(404).json({
      success: false,
      message: "Order not found",
    });
  }

  if (order.orderStatus === "delivered") {
    return res.status(404).json({
      success: false,
      message: "Order is already delivered",
    });
  }
  if (!req.body.orderStatus) {
    return res.status(404).json({
      success: false,
      message: "Please enter valid order Status",
    });
  }
  order.orderStatus = req.body.orderStatus;

  order.orderItems.forEach(async (product) => {
    await updateProductStock(product.product, product.quantity);
  });

  await order.save();

  res.status(200).json({
    success: true,
    order,
  });
});

exports.adminDeleteAOrder = BigPromise(async (req, res) => {
  const order = await Order.findById(req.params.orderId);
  if (!order) {
    return res.status(404).json({
      success: false,
      message: "Order not found",
    });
  }

  const deletedOrder = await order.deleteOne();

  res.status(200).json({
    success: true,
    deletedOrder,
  });
});

async function updateProductStock(productId, quantity) {
  const product = await Product.findById(productId);

  product.stock = product.stock - quantity;

  await product.save();
}
