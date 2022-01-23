const express = require("express");
const {
  createOrder,
  getOneOrder,
  getAllOrderOfTheUser,

  adminGetAllOrders,
  adminUpdateAOrder,
  adminDeleteAOrder,
} = require("../controllers/orderController");
const { isLoggedIn, customRole } = require("../middlewares/userMiddlewares");

const router = express.Router();

router.route("/order/create").post(isLoggedIn, createOrder);

router.route("/order/myorder").get(isLoggedIn, getAllOrderOfTheUser);

router.route("/order/:orderId").get(isLoggedIn, getOneOrder);

// ! Admin routes

router
  .route("/admin/orders")
  .get(isLoggedIn, customRole("admin"), adminGetAllOrders);

router
  .route("/admin/order/:orderId")
  .get(isLoggedIn, customRole("admin"), adminGetAllOrders)
  .put(isLoggedIn, customRole("admin"), adminUpdateAOrder)
  .delete(isLoggedIn, customRole("admin"), adminDeleteAOrder);

module.exports = router;
