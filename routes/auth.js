const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

const SALT_ROUNDS = 10;
const TOKEN_LIFETIME = "7d"; 


function createToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: TOKEN_LIFETIME });
}


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

  
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({ email: normalizedEmail, passwordHash });

  const token = createToken(user._id);
  res.status(201).json({ token, email: user.email });
});


router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });

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
