const mongoose = require('mongoose');

const otpTokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    otp: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    consumed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Automatically delete expired tokens
otpTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('OTPToken', otpTokenSchema);
