// Defines what a "user" looks like in the database.
// We never store the plain-text password - only a bcrypt hash of it,
// so even if the database leaked, the actual passwords wouldn't be exposed.

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true, // no two accounts can share an email
    lowercase: true, // so "A@B.com" and "a@b.com" are treated as the same user
    trim: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("User", userSchema);
