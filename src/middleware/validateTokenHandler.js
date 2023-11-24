const jwt = require("jsonwebtoken");

const validateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Unauthorized - No token provided" });
  }

  const [bearer, token] = authHeader.split(" ");

  if (!token || bearer.toLowerCase() !== "bearer") {
    return res.status(401).json({ error: "Invalid token format" });
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET_JWT);
    req.user = decoded.user;
    next();
  } catch (error) {
    console.error("Token verification failed:", error.message);
    res.status(401).json({ error: "Unauthorized - Token verification failed" });
  }
};

module.exports = validateToken;
