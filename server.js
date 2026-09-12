require("dotenv").config();

const express = require("express");
const path = require("path");
const connectDB = require("./db");
const Url = require("./models/Url");
const urlsRouter = require("./routes/urls");
const authRouter = require("./routes/auth");

const app = express();
const PORT = process.env.PORT || 3000;


if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is missing. Did you add it to your .env file?");
  process.exit(1);
}

app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));


app.use("/api/urls", urlsRouter);


app.use("/api/auth", authRouter);


app.get("/:shortCode", async (req, res) => {
  const { shortCode } = req.params;

  const url = await Url.findOne({ shortCode });

  if (!url) {
    return res.status(404).send("Short URL not found.");
  }

  
  url.clicks += 1;
  await url.save();

  res.redirect(url.originalUrl);
});


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
