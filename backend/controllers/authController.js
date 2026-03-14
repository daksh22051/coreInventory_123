const User = require('../models/User');
const OTPToken = require('../models/OTPToken');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { logActivity } = require('../services/activityLogger');
const { isInMemoryMode } = require('../config/db');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
};

// Demo user for in-memory mode
const DEMO_USER = {
  _id: 'demo-user-001',
  id: 'demo-user-001',
  name: 'Admin User',
  email: 'admin@coreinventory.com',
  password: 'admin123',
  role: 'admin',
  avatar: null
};

exports.signup = async (req, res) => {
  try {
    // In-memory mode fallback
    if (isInMemoryMode()) {
      const { name, email } = req.body;
      const token = generateToken('demo-' + Date.now());
      return res.status(201).json({
        success: true,
        token,
        user: { id: 'demo-' + Date.now(), name, email, role: 'staff' }
      });
    }

    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({ name, email, password, role: role || 'staff' });
    const token = generateToken(user._id);

    await logActivity(user._id, 'user_signup', 'User', user._id, `New user registered: ${name}`);

    res.status(201).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // In-memory mode fallback
    if (isInMemoryMode()) {
      if (email === DEMO_USER.email && password === DEMO_USER.password) {
        const token = generateToken(DEMO_USER._id);
        return res.json({
          success: true,
          token,
          user: { id: DEMO_USER._id, name: DEMO_USER.name, email: DEMO_USER.email, role: DEMO_USER.role }
        });
      }
      // Also accept demo credentials
      if (email === 'demo@coreinventory.com' && password === 'demo123') {
        const token = generateToken('demo-user');
        return res.json({
          success: true,
          token,
          user: { id: 'demo-user', name: 'Demo User', email: 'demo@coreinventory.com', role: 'admin' }
        });
      }
      return res.status(401).json({ success: false, message: 'Invalid credentials. Use admin@coreinventory.com / admin123' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    await logActivity(user._id, 'user_login', 'User', user._id, `User logged in: ${user.name}`);

    res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOTPEmail = async (email, otp) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Email credentials are not configured');
  }

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your CoreInventory OTP',
    text: `Your verification code is ${otp}. It expires in 5 minutes.`,
  });
};

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

exports.requestOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const otp = generateOTP();

    await OTPToken.findOneAndUpdate(
      { email },
      { code: otp, expiresAt: new Date(Date.now() + 5 * 60 * 1000), purpose: 'RESET_PASSWORD' },
      { upsert: true, new: true }
    );

    await sendOTPEmail(email, otp);

    await logActivity(null, 'otp_sent', 'User', null, `OTP sent to ${email}`);

    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error('OTP send error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const token = await OTPToken.findOne({ email, code: otp });

    if (!token || token.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP is invalid or has expired' });
    }

    await OTPToken.deleteOne({ _id: token._id });
    res.json({ success: true, message: 'OTP verified' });
  } catch (error) {
    console.error('OTP verify error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to verify OTP' });
  }
};

exports.getMe = async (req, res) => {
  try {
    if (isInMemoryMode()) {
      return res.json({ success: true, user: DEMO_USER });
    }
    const user = await User.findById(req.user._id);
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    if (isInMemoryMode()) {
      const { name, email, avatar } = req.body;
      return res.json({ success: true, user: { ...DEMO_USER, name, email, avatar } });
    }
    const { name, email, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, email, avatar },
      { new: true, runValidators: true }
    );
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
