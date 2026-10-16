const express = require("express");
const jwt = require("jsonwebtoken");

const Follow = require("../models/Follow");
const User = require("../models/User");

const router = express.Router();


// ============================================
// AUTHENTICATION
// ============================================

const authenticateUser = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
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


// ============================================
// FOLLOW USER
// POST /api/follow/:userId
// ============================================

router.post(
  "/:userId",
  authenticateUser,
  async (req, res) => {
    try {
      const targetUserId = req.params.userId;

      // Prevent following yourself
      if (targetUserId === req.userId) {
        return res.status(400).json({
          message: "You cannot follow yourself.",
        });
      }

      // Check target user
      const targetUser = await User.findById(
        targetUserId
      );

      if (!targetUser) {
        return res.status(404).json({
          message: "User not found.",
        });
      }

      // Check existing follow
      const existingFollow =
        await Follow.findOne({
          follower: req.userId,
          following: targetUserId,
        });

      if (existingFollow) {
        return res.status(400).json({
          message: "You are already following this user.",
          following: true,
        });
      }

      // Create follow
      await Follow.create({
        follower: req.userId,
        following: targetUserId,
      });

      res.status(201).json({
        message: "User followed successfully.",
        following: true,
      });
    } catch (error) {
      console.error("Follow user error:", error);

      res.status(500).json({
        message: "Unable to follow user.",
      });
    }
  }
);


// ============================================
// UNFOLLOW USER
// DELETE /api/follow/:userId
// ============================================

router.delete(
  "/:userId",
  authenticateUser,
  async (req, res) => {
    try {
      const targetUserId = req.params.userId;

      const deletedFollow =
        await Follow.findOneAndDelete({
          follower: req.userId,
          following: targetUserId,
        });

      if (!deletedFollow) {
        return res.status(400).json({
          message: "You are not following this user.",
          following: false,
        });
      }

      res.json({
        message: "User unfollowed successfully.",
        following: false,
      });
    } catch (error) {
      console.error("Unfollow user error:", error);

      res.status(500).json({
        message: "Unable to unfollow user.",
      });
    }
  }
);


// ============================================
// CHECK FOLLOW STATUS
// GET /api/follow/:userId/status
// ============================================

router.get(
  "/:userId/status",
  authenticateUser,
  async (req, res) => {
    try {
      const targetUserId = req.params.userId;

      const follow = await Follow.findOne({
        follower: req.userId,
        following: targetUserId,
      });

      res.json({
        following: !!follow,
      });
    } catch (error) {
      console.error(
        "Follow status error:",
        error
      );

      res.status(500).json({
        message: "Unable to check follow status.",
      });
    }
  }
);


// ============================================
// GET FOLLOWERS
// GET /api/follow/:userId/followers
// ============================================

router.get(
  "/:userId/followers",
  authenticateUser,
  async (req, res) => {
    try {
      const followers = await Follow.find({
        following: req.params.userId,
      })
        .populate(
          "follower",
          "name username profileImage isVerified"
        )
        .sort({ createdAt: -1 });

      res.json({
        count: followers.length,
        followers,
      });
    } catch (error) {
      console.error(
        "Get followers error:",
        error
      );

      res.status(500).json({
        message: "Unable to load followers.",
      });
    }
  }
);


// ============================================
// GET FOLLOWING
// GET /api/follow/:userId/following
// ============================================

router.get(
  "/:userId/following",
  authenticateUser,
  async (req, res) => {
    try {
      const following = await Follow.find({
        follower: req.params.userId,
      })
        .populate(
          "following",
          "name username profileImage isVerified"
        )
        .sort({ createdAt: -1 });

      res.json({
        count: following.length,
        following,
      });
    } catch (error) {
      console.error(
        "Get following error:",
        error
      );

      res.status(500).json({
        message: "Unable to load following list.",
      });
    }
  }
);


// ============================================
// GET FOLLOW COUNTS
// GET /api/follow/:userId/counts
// ============================================

router.get(
  "/:userId/counts",
  authenticateUser,
  async (req, res) => {
    try {
      const userId = req.params.userId;

      const followersCount =
        await Follow.countDocuments({
          following: userId,
        });

      const followingCount =
        await Follow.countDocuments({
          follower: userId,
        });

      res.json({
        followersCount,
        followingCount,
      });
    } catch (error) {
      console.error(
        "Follow counts error:",
        error
      );

      res.status(500).json({
        message: "Unable to load follow counts.",
      });
    }
  }
);


module.exports = router;