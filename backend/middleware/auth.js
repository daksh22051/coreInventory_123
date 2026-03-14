const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { isInMemoryMode } = require('../config/db');

const DEMO_USER = {
  _id: 'demo-user-001',
  id: 'demo-user-001',
  name: 'Admin User',
  email: 'admin@coreinventory.com',
  role: 'admin'
};

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // In-memory mode - use demo user
    if (isInMemoryMode()) {
      req.user = DEMO_USER;
      return next();
    }

    req.user = await User.findById(decoded.id);
    if (!req.user) {
      // Fallback to demo user if user not found
      if (isInMemoryMode()) {
        req.user = DEMO_USER;
        return next();
      }
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    next();
  } catch (error) {
    // In demo mode, allow any token
    if (isInMemoryMode()) {
      req.user = DEMO_USER;
      return next();
    }
    return res.status(401).json({ success: false, message: 'Token invalid' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized for this action' });
    }
    next();
  };
};

module.exports = { protect, authorize };
