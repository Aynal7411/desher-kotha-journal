const express = require("express");
const jwt = require("jsonwebtoken");
const { body } = require("express-validator");

const User = require("../models/User");
const validate = require("../middleware/validate");
const { protect, requireRole } = require("../middleware/auth");

const router = express.Router();
const ALLOWED_ROLES = ["reader", "editor", "admin"];

const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES || "7d"
  });

router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email required"),
    body("password").isLength({ min: 6 }).withMessage("Password too short")
  ],
  validate,
  async (req, res) => {
    const { name, email, password } = req.body;
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Email already registered" });
    }

    let role = "reader";
    let status = "approved";
    if (process.env.ALLOW_ROLE_REGISTRATION === "true" && req.body.role) {
      if (!ALLOWED_ROLES.includes(req.body.role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      role = req.body.role;
    }

    if (role === "editor") status = "pending";
    if (role === "admin") status = "approved";

    const user = await User.create({ name, email, password, role, status });
    const token = signToken(user._id);
    return res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  }
);

router.post(
  "/journalist/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email required"),
    body("password").isLength({ min: 6 }).withMessage("Password too short")
  ],
  validate,
  async (req, res) => {
    const { name, email, password } = req.body;
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const user = await User.create({ name, email, password, role: "editor", status: "pending" });
    const token = signToken(user._id);
    return res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  }
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email required"),
    body("password").notEmpty().withMessage("Password required")
  ],
  validate,
  async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const match = await user.comparePassword(password);
    if (!match) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = signToken(user._id);
    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  }
);

router.post(
  "/journalist/login",
  [
    body("email").isEmail().withMessage("Valid email required"),
    body("password").notEmpty().withMessage("Password required")
  ],
  validate,
  async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const match = await user.comparePassword(password);
    if (!match) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!["editor", "admin"].includes(user.role)) {
      return res.status(403).json({ message: "Journalist access required" });
    }

    const token = signToken(user._id);
    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  }
);

router.post("/facebook/mock", async (req, res) => {
  const { accountType } = req.body || {};
  const role =
    accountType === "admin"
      ? "admin"
      : accountType === "journalist"
        ? "editor"
        : "reader";
  const status = role === "editor" ? "pending" : "approved";

  const email = req.body?.email || `fb_${role}_${Date.now()}@mock.local`;
  const name = req.body?.name || `Facebook ${role}`;

  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      name,
      email,
      password: "facebook_mock_password",
      role,
      status
    });
  }

  const token = signToken(user._id);
  return res.json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status
    }
  });
});

router.get("/journalists", protect, requireRole("admin"), async (req, res) => {
  const { status } = req.query;
  const filter = { role: "editor" };
  if (status) filter.status = status;
  const users = await User.find(filter).sort({ createdAt: -1 }).select("-password");
  return res.json(users);
});

router.patch("/journalists/:id/approve", protect, requireRole("admin"), async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { status: "approved" },
    { new: true }
  ).select("-password");
  if (!user) return res.status(404).json({ message: "Not found" });
  return res.json(user);
});

router.patch("/journalists/:id/reject", protect, requireRole("admin"), async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { status: "rejected" },
    { new: true }
  ).select("-password");
  if (!user) return res.status(404).json({ message: "Not found" });
  return res.json(user);
});

router.get("/me", protect, async (req, res) => {
  return res.json(req.user);
});

module.exports = router;
