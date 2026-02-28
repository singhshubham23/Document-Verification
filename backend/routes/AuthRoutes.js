const express = require("express");
const router  = express.Router();
const {
  register, verifyOTP, login, getMe,
  forgotPassword, resetPassword, updateFCMToken,
} = require("../controllers/AuthController");
const { protect } = require("../middleware/AuthMiddleware");
const {
  validateRegister, validateLogin, validateVerifyOTP,
  validateForgotPassword, validateResetPassword,
} = require("../middleware/ValidationMiddleware");

router.post("/register",       validateRegister,       register);
router.post("/verify-otp",     validateVerifyOTP,      verifyOTP);
router.post("/login",          validateLogin,          login);
router.post("/forgot-password",validateForgotPassword, forgotPassword);
router.post("/reset-password", validateResetPassword,  resetPassword);
router.get ("/me",             protect,                getMe);
router.patch("/fcm-token",     protect,                updateFCMToken);

module.exports = router;