const express = require("express");

const Article = require("../models/Article");
const User = require("../models/User");
const { protect, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/me", protect, async (req, res) => {
  if (req.app.locals.useMemory) {
    return res.json({ score: 0 });
  }

  const count = await Article.countDocuments({
    createdBy: req.user.id,
    status: "published"
  });
  return res.json({ score: count });
});

router.get("/journalists", protect, requireRole("admin"), async (req, res) => {
  if (req.app.locals.useMemory) {
    return res.json([]);
  }

  const journalists = await User.find({ role: "editor", status: "approved" }).select("_id name email");
  const ids = journalists.map((j) => j._id);

  const counts = await Article.aggregate([
    { $match: { createdBy: { $in: ids }, status: "published" } },
    { $group: { _id: "$createdBy", score: { $sum: 1 } } }
  ]);

  const scoreMap = new Map(counts.map((c) => [String(c._id), c.score]));
  const result = journalists.map((j) => ({
    id: j._id,
    name: j.name,
    email: j.email,
    score: scoreMap.get(String(j._id)) || 0
  }));

  return res.json(result);
});

module.exports = router;
