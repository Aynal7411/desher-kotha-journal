const mongoose = require("mongoose");

const ArticleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    category: { type: String, required: true },
    tags: [{ type: String }],
    author: { type: String, required: true },
    publishedAt: { type: Date },
    excerpt: { type: String, required: true },
    body: { type: String, required: true },
    imageUrl: { type: String },
    source: { type: String },
    views: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "published"
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Article", ArticleSchema);
