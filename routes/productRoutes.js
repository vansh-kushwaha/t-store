const express = require("express");
const {
  adminAddProduct,
  getAllProducts,
  deleteProduct,
  adminGetAllProducts,
  getSingleProduct,
  adminUpdateProduct,
} = require("../controllers/productController");
const { isLoggedIn, customRole } = require("../middlewares/userMiddlewares");

const router = express.Router();
// ! User routes
router.route("/products").get(getAllProducts);

router.route("/products/:productId").get(getSingleProduct);

// ! Admin Only routes
router
  .route("/admin/product/create")
  .post(isLoggedIn, customRole("admin"), adminAddProduct);

router
  .route("/admin/products")
  .get(isLoggedIn, customRole("admin"), adminGetAllProducts);

router
  .route("/admin/product/:productId")
  .get(isLoggedIn, customRole("admin"), getSingleProduct)
  .put(isLoggedIn, customRole("admin"), adminUpdateProduct)
  .delete(isLoggedIn, customRole("admin"), deleteProduct);

module.exports = router;
