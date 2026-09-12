// This middleware protects routes that require a logged-in user.
// It expects the request to carry a header like:
//   Authorization: Bearer <token>
//
// If the token is missing or invalid, the request is rejected before it
// ever reaches the route handler. If it's valid, we attach the user's id
// to req.userId so the route handler knows who is making the request.

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
    next(); // token is valid - let the request continue to the route handler
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired login. Please log in again." });
  }
}

module.exports = requireAuth;
