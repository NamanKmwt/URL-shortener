// This is the entry point of the app. Running "npm start" runs this file.
// It's responsible for: loading config, connecting to the DB, setting up
// Express, and starting the server. The actual API logic lives in
// routes/urls.js so this file stays short and easy to read top to bottom.

require("dotenv").config();

const express = require("express");
const path = require("path");
const connectDB = require("./db");
const Url = require("./models/Url");
const urlsRouter = require("./routes/urls");
const authRouter = require("./routes/auth");

const app = express();
const PORT = process.env.PORT || 3000;

// Fail loudly at startup instead of letting every login/signup mysteriously
// break later if this was never set.
if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is missing. Did you add it to your .env file?");
  process.exit(1);
}

// Lets Express read JSON bodies (e.g. the { originalUrl } the form sends).
app.use(express.json());

// Serves the frontend files (index.html, style.css, script.js) as-is.
// Because of this, visiting "/" in the browser loads public/index.html.
app.use(express.static(path.join(__dirname, "public")));

// Every "/api/urls" request is handled by routes/urls.js.
app.use("/api/urls", urlsRouter);

// Every "/api/auth" request (signup/login) is handled by routes/auth.js.
app.use("/api/auth", authRouter);

// This is the redirect route: whenever someone visits a short link like
// "http://localhost:3000/abc123", we look up "abc123" in the database
// and send them on to the original long URL.
//
// It's defined AFTER express.static and the /api routes so that it only
// runs for paths that didn't match a real file or API route above.
app.get("/:shortCode", async (req, res) => {
  const { shortCode } = req.params;

  const url = await Url.findOne({ shortCode });

  if (!url) {
    return res.status(404).send("Short URL not found.");
  }

  // Every successful visit counts as a click.
  url.clicks += 1;
  await url.save();

  res.redirect(url.originalUrl);
});

// Connect to MongoDB first; only start accepting requests once that
// succeeds, so we never serve traffic without a working database.
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1);
  });
