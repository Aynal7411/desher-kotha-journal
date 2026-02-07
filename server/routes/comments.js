const express = require("express");
const { body } = require("express-validator");

const Comment = require("../models/Comment");
const Article = require("../models/Article");
const validate = require("../middleware/validate");
const { protect } = require("../middleware/auth");

const router = express.Router({ mergeParams: true });
const memoryComments = {};

const getMemoryList = (slug) => {
  if (!memoryComments[slug]) memoryComments[slug] = [];
  return memoryComments[slug];
};

router.get("/", async (req, res) => {
  const { slug } = req.params;

  if (req.app.locals.useMemory) {
    return res.json(getMemoryList(slug));
  }

  try {
    const article = await Article.findOne({ slug }).exec();
    if (!article) return res.status(404).json({ message: "Article not found" });

    const comments = await Comment.find({ article: article._id })
      .sort({ createdAt: -1 })
      .exec();

    return res.json(
      comments.map((comment) => ({
        _id: comment._id,
        authorName: comment.authorName,
        text: comment.text,
        createdAt: comment.createdAt
      }))
    );
  } catch (error) {
    return res.status(500).json({ message: "Failed to load comments" });
  }
});

router.post(
  "/",
  protect,
  [body("text").trim().notEmpty().withMessage("Comment required")],
  validate,
  async (req, res) => {
    const { slug } = req.params;

    if (req.app.locals.useMemory) {
      const newComment = {
        _id: `mem-${Date.now()}`,
        authorName: req.user.name,
        text: req.body.text,
        createdAt: new Date().toISOString(),
        userId: req.user.id
      };
      getMemoryList(slug).unshift(newComment);
      return res.status(201).json(newComment);
    }

    try {
      const article = await Article.findOne({ slug }).exec();
      if (!article) return res.status(404).json({ message: "Article not found" });

      const comment = await Comment.create({
        article: article._id,
        user: req.user.id,
        authorName: req.user.name,
        text: req.body.text
      });

      return res.status(201).json({
        _id: comment._id,
        authorName: comment.authorName,
        text: comment.text,
        createdAt: comment.createdAt
      });
    } catch (error) {
      return res.status(400).json({ message: "Failed to add comment" });
    }
  }
);

router.delete("/:commentId", protect, async (req, res) => {
  const { slug, commentId } = req.params;

  if (req.app.locals.useMemory) {
    const list = getMemoryList(slug);
    const index = list.findIndex((item) => item._id === commentId);
    if (index === -1) return res.status(404).json({ message: "Not found" });
    const comment = list[index];
    if (req.user.role !== "admin" && comment.userId !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }
    list.splice(index, 1);
    return res.json({ removed: comment });
  }

  try {
    const comment = await Comment.findById(commentId).exec();
    if (!comment) return res.status(404).json({ message: "Not found" });
    if (req.user.role !== "admin" && comment.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }
    await comment.deleteOne();
    return res.json({ removed: comment });
  } catch (error) {
    return res.status(400).json({ message: "Failed to delete comment" });
  }
});

module.exports = router;
