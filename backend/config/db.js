const mongoose = require('mongoose');

let useInMemory = false;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // 5 second timeout
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`⚠️ MongoDB unavailable: ${error.message}`);
    console.log(`🔄 Running in DEMO MODE with in-memory storage`);
    useInMemory = true;
  }
};

const isInMemoryMode = () => useInMemory;

module.exports = connectDB;
module.exports.isInMemoryMode = isInMemoryMode;
