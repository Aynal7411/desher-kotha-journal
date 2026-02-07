const express = require("express");
const { body } = require("express-validator");
const slugify = require("slugify");

const Article = require("../models/Article");
const sampleArticles = require("../data/sampleArticles");
const validate = require("../middleware/validate");
const { protect, requireRole, requireApproved } = require("../middleware/auth");

const router = express.Router();

const memoryProtect = (req, res, next) => {
  if (req.app.locals.useMemory) return next();
  return protect(req, res, next);
};

const memoryRole = (...roles) => (req, res, next) => {
  if (req.app.locals.useMemory) return next();
  return requireRole(...roles)(req, res, next);
};

const memoryApproved = (req, res, next) => {
  if (req.app.locals.useMemory) return next();
  return requireApproved(req, res, next);
};

const filterMemoryArticles = (articles, { q, category, tag, limit, page, from, to, sort, trending }) => {
  let result = [...articles];
  if (category) {
    result = result.filter((a) => a.category === category);
  }
  if (tag) {
    result = result.filter((a) => a.tags?.includes(tag));
  }
  if (from) {
    const fromDate = new Date(from);
    result = result.filter((a) => new Date(a.publishedAt) >= fromDate);
  }
  if (to) {
    const toDate = new Date(to);
    result = result.filter((a) => new Date(a.publishedAt) <= toDate);
  }
  if (q) {
    const qLower = q.toLowerCase();
    result = result.filter(
      (a) =>
        a.title.toLowerCase().includes(qLower) ||
        a.excerpt.toLowerCase().includes(qLower)
    );
  }
  if (trending) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    result = result.filter((a) => new Date(a.publishedAt) >= cutoff);
  }
  if (sort === "views") {
    result.sort((a, b) => (b.views || 0) - (a.views || 0));
  } else {
    result.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  }
  const pageNum = Math.max(Number(page) || 1, 1);
  const limitNum = Math.min(Number(limit) || 10, 50);
  const start = (pageNum - 1) * limitNum;
  return result.slice(start, start + limitNum);
};

router.get("/", async (req, res) => {
  const { q, category, tag, limit, page, from, to, sort, trending } = req.query;
  if (req.app.locals.useMemory) {
    return res.json(
      filterMemoryArticles(sampleArticles, { q, category, tag, limit, page, from, to, sort, trending })
    );
  }

  try {
    const filter = { status: "published" };
    if (category) filter.category = category;
    if (tag) filter.tags = tag;
    if (from || to) {
      filter.publishedAt = {};
      if (from) filter.publishedAt.$gte = new Date(from);
      if (to) filter.publishedAt.$lte = new Date(to);
    }
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { excerpt: { $regex: q, $options: "i" } }
      ];
    }

    if (trending) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7);
      filter.publishedAt = { ...(filter.publishedAt || {}), $gte: cutoff };
    }

    const pageNum = Math.max(Number(page) || 1, 1);
    const limitNum = Math.min(Number(limit) || 10, 50);
    const skip = (pageNum - 1) * limitNum;

    const sortQuery = sort === "views" ? { views: -1 } : { publishedAt: -1 };
    const articles = await Article.find(filter)
      .sort(sortQuery)
      .skip(skip)
      .limit(limitNum)
      .exec();

    return res.json(articles);
  } catch (error) {
    return res.status(500).json({ message: "Failed to load articles." });
  }
});

router.get("/admin/all", memoryProtect, memoryRole("editor", "admin"), async (req, res) => {
  const { q, category, tag, limit, page } = req.query;
  if (req.app.locals.useMemory) {
    return res.json(filterMemoryArticles(sampleArticles, { q, category, tag, limit, page }));
  }

  try {
    const filter = {};
    if (category) filter.category = category;
    if (tag) filter.tags = tag;
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { excerpt: { $regex: q, $options: "i" } }
      ];
    }

    const pageNum = Math.max(Number(page) || 1, 1);
    const limitNum = Math.min(Number(limit) || 50, 100);
    const skip = (pageNum - 1) * limitNum;

    const articles = await Article.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .exec();

    return res.json(articles);
  } catch (error) {
    return res.status(500).json({ message: "Failed to load articles." });
  }
});

router.get(
  "/admin/by-author/:id",
  memoryProtect,
  memoryRole("admin"),
  async (req, res) => {
    if (req.app.locals.useMemory) {
      const items = sampleArticles.filter((a) => a.createdBy === req.params.id);
      return res.json(items);
    }

    try {
      const articles = await Article.find({ createdBy: req.params.id })
        .sort({ createdAt: -1 })
        .exec();
      return res.json(articles);
    } catch (error) {
      return res.status(500).json({ message: "Failed to load articles." });
    }
  }
);

router.get("/:slug", async (req, res) => {
  const { slug } = req.params;
  const { view } = req.query;

  if (req.app.locals.useMemory) {
    const article = sampleArticles.find((a) => a.slug === slug);
    if (!article) return res.status(404).json({ message: "Not found" });
    if (view === "1") article.views = (article.views || 0) + 1;
    return res.json(article);
  }

  try {
    const article = await Article.findOne({ slug }).exec();
    if (!article) return res.status(404).json({ message: "Not found" });
    if (view === "1") {
      article.views += 1;
      await article.save();
    }
    return res.json(article);
  } catch (error) {
    return res.status(500).json({ message: "Failed to load article." });
  }
});

router.post(
  "/",
  memoryProtect,
  memoryRole("editor", "admin"),
  memoryApproved,
  [
    body("title").trim().notEmpty().withMessage("Title required"),
    body("category").trim().notEmpty().withMessage("Category required"),
    body("author").trim().notEmpty().withMessage("Author required"),
    body("excerpt").trim().notEmpty().withMessage("Excerpt required"),
    body("body").trim().notEmpty().withMessage("Body required")
  ],
  validate,
  async (req, res) => {
    const payload = { ...req.body };
    payload.slug =
      payload.slug ||
      slugify(payload.title, { lower: true, strict: true }) + `-${Date.now()}`;
    if (!payload.publishedAt && payload.status === "published") {
      payload.publishedAt = new Date();
    }

    if (req.app.locals.useMemory) {
      sampleArticles.unshift(payload);
      return res.status(201).json(payload);
    }

    try {
      payload.createdBy = req.user.id;
      const article = await Article.create(payload);
      return res.status(201).json(article);
    } catch (error) {
      return res.status(400).json({ message: "Failed to create article." });
    }
  }
);

router.put(
  "/:id",
  memoryProtect,
  memoryRole("editor", "admin"),
  memoryApproved,
  [
    body("title").optional().trim().notEmpty(),
    body("excerpt").optional().trim().notEmpty(),
    body("body").optional().trim().notEmpty()
  ],
  validate,
  async (req, res) => {
    if (req.app.locals.useMemory) {
      const index = sampleArticles.findIndex((a) => a.slug === req.params.id || a._id === req.params.id);
      if (index === -1) return res.status(404).json({ message: "Not found" });
      const next = { ...sampleArticles[index], ...req.body };
      if (next.status === "published" && !next.publishedAt) {
        next.publishedAt = new Date().toISOString();
      }
      sampleArticles[index] = next;
      return res.json(sampleArticles[index]);
    }

    try {
      const update = { ...req.body };
      if (update.status === "published" && !update.publishedAt) {
        update.publishedAt = new Date();
      }
      const article = await Article.findByIdAndUpdate(req.params.id, update, {
        new: true,
        runValidators: true
      });
      if (!article) return res.status(404).json({ message: "Not found" });
      return res.json(article);
    } catch (error) {
      return res.status(400).json({ message: "Failed to update article." });
    }
  }
);

router.delete("/:id", memoryProtect, memoryRole("admin"), async (req, res) => {
  if (req.app.locals.useMemory) {
    const index = sampleArticles.findIndex((a) => a.slug === req.params.id || a._id === req.params.id);
    if (index === -1) return res.status(404).json({ message: "Not found" });
    const removed = sampleArticles.splice(index, 1);
    return res.json({ removed: removed[0] });
  }

  try {
    const article = await Article.findByIdAndDelete(req.params.id);
    if (!article) return res.status(404).json({ message: "Not found" });
    return res.json({ removed: article });
  } catch (error) {
    return res.status(400).json({ message: "Failed to delete article." });
  }
});

module.exports = router;
