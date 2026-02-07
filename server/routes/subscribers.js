const express = require("express");
const { body } = require("express-validator");

const Subscriber = require("../models/Subscriber");
const validate = require("../middleware/validate");

const router = express.Router();
const memorySubscribers = new Set();

router.post(
  "/",
  [body("email").isEmail().withMessage("Valid email required")],
  validate,
  async (req, res) => {
    const email = req.body.email.toLowerCase();

    if (req.app.locals.useMemory) {
      if (memorySubscribers.has(email)) {
        return res.status(200).json({ email, message: "Already subscribed" });
      }
      memorySubscribers.add(email);
      return res.status(201).json({ email });
    }

    try {
      const existing = await Subscriber.findOne({ email }).exec();
      if (existing) {
        return res.status(200).json({ email: existing.email, message: "Already subscribed" });
      }
      const subscriber = await Subscriber.create({ email });
      return res.status(201).json({ email: subscriber.email });
    } catch (error) {
      return res.status(400).json({ message: "Failed to subscribe" });
    }
  }
);

module.exports = router;
