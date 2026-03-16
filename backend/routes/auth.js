const express = require("express");
const router = express.Router();

const {
  signup,
  login,
  getMe,
  updateProfile,
  requestPasswordReset,
  verifyOtp,
  resetPasswordWithOtp
} = require("../controllers/authController");

const { protect } = require("../middleware/auth");


// AUTH
router.post("/signup", signup);
router.post("/login", login);

// USER
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);

// OTP PASSWORD RESET
router.post("/password", requestPasswordReset);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPasswordWithOtp);

module.exports = router;
