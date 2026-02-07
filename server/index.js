const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const morgan = require("morgan");

const articlesRouter = require("./routes/articles");
const authRouter = require("./routes/auth");
const commentsRouter = require("./routes/comments");
const subscribersRouter = require("./routes/subscribers");
const statsRouter = require("./routes/stats");
const { notFound, errorHandler } = require("./middleware/error");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const useMemory = !process.env.MONGO_URI;

app.locals.useMemory = useMemory;

if (!process.env.JWT_SECRET) {
  console.warn("JWT_SECRET not set. Auth endpoints will fail.");
}

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    mode: useMemory ? "memory" : "mongo",
    message: "Bangla News API is running"
  });
});

app.use("/api/auth", authRouter);
app.use("/api/stats", statsRouter);
app.use("/api/subscribers", subscribersRouter);
app.use("/api/articles/:slug/comments", commentsRouter);
app.use("/api/articles", articlesRouter);

app.use(notFound);
app.use(errorHandler);

const startServer = () => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} (${useMemory ? "memory" : "mongo"})`);
  });
};

if (useMemory) {
  console.warn("MONGO_URI not set. Using in-memory sample data.");
  startServer();
} else {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
      console.log("MongoDB connected");
      startServer();
    })
    .catch((err) => {
      console.error("MongoDB connection error:", err.message);
      process.exit(1);
    });
}
