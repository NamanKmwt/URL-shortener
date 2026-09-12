const express = require("express");
const rateLimit = require("express-rate-limit");
const { nanoid } = require("nanoid");
const Url = require("../models/Url");
const requireAuth = require("../middleware/auth");

const router = express.Router();

const createUrlLimiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 10, 
  standardHeaders: true, 
  legacyHeaders: false, 
  message: { error: "Too many links created from this IP. Please wait a minute and try again." },
});

function isValidUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}


router.get("/", async (req, res) => {
  const urls = await Url.find().sort({ createdAt: -1 });
  res.json(urls);
});


router.get("/mine", requireAuth, async (req, res) => {
  const urls = await Url.find({ userId: req.userId }).sort({ createdAt: -1 });
  res.json(urls);
});


router.post("/", createUrlLimiter, requireAuth, async (req, res) => {
  const { originalUrl } = req.body;


  if (!originalUrl || typeof originalUrl !== "string" || !originalUrl.trim()) {
    return res.status(400).json({ error: "Please enter a URL." });
  }

  if (!isValidUrl(originalUrl.trim())) {
    return res
      .status(400)
      .json({ error: "That doesn't look like a valid URL (include http:// or https://)." });
  }

  let shortCode;
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = nanoid(6);
    const existing = await Url.findOne({ shortCode: candidate });
    if (!existing) {
      shortCode = candidate;
      break;
    }
  }

  if (!shortCode) {
    return res.status(500).json({ error: "Could not generate a unique short code. Try again." });
  }

  const url = await Url.create({
    shortCode,
    originalUrl: originalUrl.trim(),
    userId: req.userId,
  });

  res.status(201).json(url);
});

module.exports = router;
