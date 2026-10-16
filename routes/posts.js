const express = require("express");
const jwt = require("jsonwebtoken");

const Post = require("../models/Post");
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

// GET ALL POSTS
router.get("/", authenticateUser, async (req, res) => {
  try {
    const posts = await Post.find({
      isPublished: true,
      visibility: "everyone",
    })
      .populate(
        "creator",
        "name username profileImage isVerified"
      )
      .sort({ createdAt: -1 })
      .limit(30);

    res.json({
      posts,
    });
  } catch (error) {
    console.error("Get posts error:", error);

    res.status(500).json({
      message: "Unable to load posts.",
    });
  }
});

// CREATE POST
router.post("/", authenticateUser, async (req, res) => {
  try {
    const {
      type,
      media,
      caption,
      music,
      visibility,
    } = req.body;

    if (!type) {
      return res.status(400).json({
        message: "Post type is required.",
      });
    }

    if (!["photo", "video"].includes(type)) {
      return res.status(400).json({
        message: "Invalid post type.",
      });
    }

    if (!Array.isArray(media) || media.length === 0) {
      return res.status(400).json({
        message: "At least one media file is required.",
      });
    }

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    const post = await Post.create({
      creator: req.userId,
      type,
      media,
      caption: caption || "",
      music: music || "Original sound",
      visibility: visibility || "everyone",
    });

    await post.populate(
      "creator",
      "name username profileImage isVerified"
    );

    res.status(201).json({
      message: "Post created successfully.",
      post,
    });
  } catch (error) {
    console.error("Create post error:", error);

    res.status(500).json({
      message: "Unable to create post.",
    });
  }
});

// INCREMENT POST VIEW
router.post(
  "/:postId/view",
  authenticateUser,
  async (req, res) => {
    try {
      const post = await Post.findByIdAndUpdate(
        req.params.postId,
        {
          $inc: {
            viewsCount: 1,
          },
        },
        {
          new: true,
        }
      );

      if (!post) {
        return res.status(404).json({
          message: "Post not found.",
        });
      }

      res.json({
        message: "View recorded.",
        viewsCount: post.viewsCount,
      });
    } catch (error) {
      console.error("Post view error:", error);

      res.status(500).json({
        message: "Unable to record post view.",
      });
    }
  }
);

module.exports = router;