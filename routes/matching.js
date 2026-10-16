const express = require("express");
const jwt = require("jsonwebtoken");
const Like = require("../models/Like");
const Match = require("../models/Match");
const User = require("../models/User");

const router = express.Router();

const authenticateUser = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.userId = decoded.userId;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired login session.",
    });
  }
};


// LIKE USER
router.post("/like", authenticateUser, async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: "User ID is required.",
      });
    }

    if (userId === req.userId.toString()) {
      return res.status(400).json({
        message: "You cannot like yourself.",
      });
    }

    const targetUser = await User.findById(userId);

    if (!targetUser) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    const existingLike = await Like.findOne({
      fromUser: req.userId,
      toUser: userId,
    });

    if (existingLike) {
      return res.json({
        message: "Already interacted with this user.",
        matched: false,
      });
    }

    await Like.create({
      fromUser: req.userId,
      toUser: userId,
      type: "like",
    });

    const mutualLike = await Like.findOne({
      fromUser: userId,
      toUser: req.userId,
      type: "like",
    });

    if (mutualLike) {
      const existingMatch = await Match.findOne({
        $or: [
          {
            userOne: req.userId,
            userTwo: userId,
          },
          {
            userOne: userId,
            userTwo: req.userId,
          },
        ],
      });

      if (!existingMatch) {
        const match = await Match.create({
          users: [req.userId, userId],
          userOne: req.userId,
          userTwo: userId,
        });

        return res.json({
          message: "It's a match! 🎉",
          matched: true,
          match,
        });
      }

      return res.json({
        message: "You already matched with this person.",
        matched: true,
        match: existingMatch,
      });
    }

    res.json({
      message: "Like saved.",
      matched: false,
    });

  } catch (error) {
    console.error("Like error:", error);

    res.status(500).json({
      message: "Unable to process like.",
    });
  }
});


// PASS USER
router.post("/pass", authenticateUser, async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: "User ID is required.",
      });
    }

    if (userId === req.userId.toString()) {
      return res.status(400).json({
        message: "You cannot pass yourself.",
      });
    }

    const existingInteraction = await Like.findOne({
      fromUser: req.userId,
      toUser: userId,
    });

    if (!existingInteraction) {
      await Like.create({
        fromUser: req.userId,
        toUser: userId,
        type: "pass",
      });
    }

    res.json({
      message: "Passed.",
    });

  } catch (error) {
    console.error("Pass error:", error);

    res.status(500).json({
      message: "Unable to process pass.",
    });
  }
});


// GET MY MATCHES
router.get("/matches", authenticateUser, async (req, res) => {
  try {
    const matches = await Match.find({
      users: req.userId,
    })
      .populate(
        "userOne",
        "-password -email -dateOfBirth"
      )
      .populate(
        "userTwo",
        "-password -email -dateOfBirth"
      )
      .sort({
        createdAt: -1,
      });

    res.json({
      matches,
    });

  } catch (error) {
    console.error("Get matches error:", error);

    res.status(500).json({
      message: "Unable to load matches.",
    });
  }
});


module.exports = router;