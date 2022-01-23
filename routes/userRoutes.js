const express = require("express");
const router = express.Router();
const {
  signup,
  login,
  logout,
  forgotPassword,
  forgotPasswordReset,
  getLoggedInUserDetail,
  updatePassword,
  updateUserDetails,
  adminGetAllUser,
  managerGetAllUser,
  adminGetSingleUser,
  adminUpdateUserDetails,
  adminDeletAUser,
} = require("../controllers/userController");
const { isLoggedIn, customRole } = require("../middlewares/userMiddlewares");

router.post("/signup", signup);

router.post("/login", login);
router.get("/logout", logout);

router.route("/userdashboard").get(isLoggedIn, getLoggedInUserDetail);

router.post("/forgotpassword", forgotPassword);
router.post("/password/reset/:token", forgotPasswordReset);

router.route("/password/update").post(isLoggedIn, updatePassword);
router.route("/userdashboard/update").put(isLoggedIn, updateUserDetails);

// ! Admin Only routes

router
  .route("/admin/users")
  .get(isLoggedIn, customRole("admin"), adminGetAllUser);

router
  .route("/admin/users/:id")
  .get(isLoggedIn, customRole("admin"), adminGetSingleUser)
  .put(isLoggedIn, customRole("admin"), adminUpdateUserDetails)
  .delete(isLoggedIn, customRole("admin"), adminDeletAUser);

// ! Manager Only routes
router
  .route("/manager/users")
  .get(isLoggedIn, customRole("manager"), managerGetAllUser);

module.exports = router;
