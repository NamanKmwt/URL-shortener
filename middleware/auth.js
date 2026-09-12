const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "You must be logged in to do that." });
  }

  const token = authHeader.slice("Bearer ".length);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;
    next(); 
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired login. Please log in again." });
  }
}

module.exports = requireAuth;
