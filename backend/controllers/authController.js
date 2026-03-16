const crypto = require("crypto");
const nodemailer = require("nodemailer");
const User = require("../models/User");
const OTPToken = require("../models/OTPToken");
const jwt = require("jsonwebtoken");
const { logActivity } = require("../services/activityLogger");
const { isInMemoryMode } = require("../config/db");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

const hashOTP = (value) =>
  crypto.createHash("sha256").update(value).digest("hex");


// 📧 EMAIL TRANSPORTER
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};


// 📧 SEND OTP EMAIL
const sendOtpEmail = async (email, otp, name) => {
  try {
    const transporter = createTransporter();

    console.log("📩 Sending OTP to:", email);
    console.log("🔢 OTP:", otp);

    await transporter.sendMail({
      from: `"CoreInventory Security" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "CoreInventory Password Reset OTP",
      html: `
      <div style="font-family:Arial;background:#f0fdf4;padding:30px;border-radius:16px">
        <h2 style="color:#065f46">CoreInventory Security Code</h2>
        <p>Hello ${name || "User"},</p>
        <p>Your OTP for password reset is:</p>

        <div style="
        font-size:36px;
        font-weight:bold;
        color:#059669;
        letter-spacing:8px;
        margin:20px 0;">
        ${otp}
        </div>

        <p>This code expires in <b>5 minutes</b>.</p>
        <p>If you did not request this email you can ignore it.</p>

        <hr/>

        <p style="font-size:12px;color:#6b7280">
        CoreInventory Security System
        </p>
      </div>
      `,
    });

    console.log("✅ OTP email sent successfully");
  } catch (error) {
    console.error("❌ EMAIL ERROR:", error);
  }
};


// DEMO USER (for memory mode)
const DEMO_USER = {
  _id: "demo-user-001",
  name: "Admin User",
  email: "admin@coreinventory.com",
  password: "admin123",
  role: "admin",
};



// SIGNUP
exports.signup = async (req, res) => {
  try {
    if (isInMemoryMode()) {
      const { name, email } = req.body;
      const token = generateToken("demo-" + Date.now());

      return res.status(201).json({
        success: true,
        token,
        user: { id: "demo", name, email, role: "staff" },
      });
    }

    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser)
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });

    const user = await User.create({ name, email, password, role: 'admin' });

    const token = generateToken(user._id);

    await logActivity(
      user._id,
      "user_signup",
      "User",
      user._id,
      `User registered`
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (isInMemoryMode()) {
      if (email === DEMO_USER.email && password === DEMO_USER.password) {
        const token = generateToken(DEMO_USER._id);

        return res.json({
          success: true,
          token,
          user: DEMO_USER,
        });
      }

      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const token = generateToken(user._id);

    await logActivity(user._id, "user_login", "User", user._id, "User login");

    res.json({
      success: true,
      token,
      user: user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



// REQUEST PASSWORD RESET
exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    console.log("🔐 Password reset requested for:", email);

    const user = await User.findOne({ email });

    if (!user) {
      return res.json({
        success: true,
        message: "OTP sent if account exists",
      });
    }

    await OTPToken.deleteMany({ user: user._id });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const expiresAt = Date.now() + 5 * 60 * 1000;

    await OTPToken.create({
      user: user._id,
      otp: hashOTP(otp),
      expiresAt,
    });

    await sendOtpEmail(user.email, otp, user.name);

    await logActivity(
      user._id,
      "otp_requested",
      "OTPToken",
      user._id,
      "Password reset OTP generated"
    );

    res.json({
      success: true,
      message: "OTP sent to email",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};



// VERIFY OTP
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    const token = await OTPToken.findOne({ user: user._id }).sort({
      createdAt: -1,
    });

    if (!token || token.expiresAt < Date.now())
      return res
        .status(400)
        .json({ success: false, message: "OTP expired" });

    if (hashOTP(otp) !== token.otp)
      return res
        .status(400)
        .json({ success: false, message: "Invalid OTP" });

    res.json({ success: true, message: "OTP verified" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



// RESET PASSWORD
exports.resetPasswordWithOtp = async (req, res) => {
  try {
    const { email, otp, password } = req.body;

    const user = await User.findOne({ email }).select("+password");

    const token = await OTPToken.findOne({ user: user._id }).sort({
      createdAt: -1,
    });

    if (!token || token.expiresAt < Date.now())
      return res.status(400).json({ success: false, message: "OTP expired" });

    if (hashOTP(otp) !== token.otp)
      return res.status(400).json({ success: false, message: "Invalid OTP" });

    user.password = password;

    await user.save();

    await OTPToken.deleteMany({ user: user._id });

    await logActivity(
      user._id,
      "password_reset",
      "User",
      user._id,
      "Password reset via OTP"
    );

    res.json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


exports.getMe = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "User not authenticated" });
  }

  res.json({ success: true, user: req.user });
};


exports.updateProfile = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "User not authenticated" });
  }

  const { name, email } = req.body;
  if (name) req.user.name = name;
  if (email) req.user.email = email;

  await req.user.save();

  res.json({ success: true, user: req.user });
};
