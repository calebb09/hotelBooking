const mongoose = require("mongoose");
const utils = require("../src/lib");
const config = require("./index");

const connectDB = async () => {
  try {
    await mongoose.connect(config.MONGODB.URL);
    console.log("✅ MongoDB connected successfully");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    setTimeout(connectDB, 5000); // Retry after 5 seconds
  }
};

// Handle disconnected event
mongoose.connection.on("disconnected", () => {
  console.warn("⚠️ MongoDB disconnected. Reconnecting...");
  connectDB();
});

// Optional: handle MongoDB errors
mongoose.connection.on("error", utils.mongoError);

module.exports = connectDB;
