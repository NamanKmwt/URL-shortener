// This file's only job is to connect to MongoDB.
// Keeping it separate from server.js means the connection logic
// doesn't get tangled up with the routes/API logic.

const mongoose = require("mongoose");

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    // Fail loudly and immediately if there's no connection string,
    // instead of letting the app start and mysteriously fail later.
    throw new Error("MONGODB_URI is missing. Did you create a .env file?");
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB");
}

module.exports = connectDB;
