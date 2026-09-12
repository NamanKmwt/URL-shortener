// This file defines the "/api/auth" endpoints:
//   POST /api/auth/signup -> create a new account
//   POST /api/auth/login  -> verify credentials and hand back a JWT
//
// There's no "logout" route here - logging out just means the browser
// deletes its own copy of the token (see public/auth.js). The server
// doesn't need to keep track of who's logged in.

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

const SALT_ROUNDS = 10; // how much work bcrypt does when hashing - 10 is a common, safe default
const TOKEN_LIFETIME = "7d"; // how long a login stays valid before you have to log in again

// Builds a signed JWT that proves "this request came from userId X".
// Anyone with this token can act as that user until it expires.
function createToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: TOKEN_LIFETIME });
}

// POST /api/auth/signup
router.post("/signup", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }

  const normalizedEmail = email.toLowerCase().trim();

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    return res.status(400).json({ error: "An account with that email already exists." });
  }

  // Never save the plain password - only its bcrypt hash.
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({ email: normalizedEmail, passwordHash });

  const token = createToken(user._id);
  res.status(201).json({ token, email: user.email });
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });

  // We deliberately give the exact same error for "no such email" and
  // "wrong password" - this stops someone from using the error message
  // to figure out which emails have accounts on the site.
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  const token = createToken(user._id);
  res.json({ token, email: user.email });
});

module.exports = router;
