const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      return res.status(401).json({ message: "Authorization required." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "User not found." });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token." });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Forbidden." });
  }
  return next();
};

const requireApproved = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized." });
  if (req.user.role === "admin") return next();
  if (req.user.status !== "approved") {
    return res.status(403).json({ message: "Approval required." });
  }
  return next();
};

module.exports = { protect, requireRole, requireApproved };
