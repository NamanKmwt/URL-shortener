// This defines the "shape" of a URL document stored in MongoDB.
// Mongoose uses this schema to validate data and give us a convenient
// JS model (Url) to create/find/update documents with.

const mongoose = require("mongoose");

const urlSchema = new mongoose.Schema({
  // Which user created this link. "ref: User" lets Mongoose look up the
  // full user document later if we ever need to (e.g. .populate("userId")),
  // but most of the time we just use it to filter "give me only my links".
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  shortCode: {
    type: String,
    required: true,
    unique: true, // no two documents can have the same short code
  },
  originalUrl: {
    type: String,
    required: true,
  },
  clicks: {
    type: Number,
    default: 0, // every new link starts with zero clicks
  },
  createdAt: {
    type: Date,
    default: Date.now, // automatically set when the document is created
  },
});

// "Url" here becomes the "urls" collection in MongoDB (Mongoose lowercases
// and pluralizes the model name for you).
module.exports = mongoose.model("Url", urlSchema);
