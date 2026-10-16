const express = require("express");
const jwt = require("jsonwebtoken");

const Comment = require("../models/Comment");
const Post = require("../models/Post");

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
// GET COMMENTS
// ============================================

router.get(
  "/:postId",
  authenticateUser,
  async (req, res) => {
    try {
      const comments = await Comment.find({
        post: req.params.postId,
      })
        .populate(
          "user",
          "name username profileImage isVerified"
        )
        .sort({ createdAt: -1 })
        .limit(100);

      res.json({
        comments,
      });
    } catch (error) {
      console.error(
        "Get comments error:",
        error
      );

      res.status(500).json({
        message: "Unable to load comments.",
      });
    }
  }
);

// ============================================
// CREATE COMMENT
// ============================================

router.post(
  "/:postId",
  authenticateUser,
  async (req, res) => {
    try {
      const { text } = req.body;

      if (!text || !text.trim()) {
        return res.status(400).json({
          message: "Comment cannot be empty.",
        });
      }

      if (text.trim().length > 500) {
        return res.status(400).json({
          message:
            "Comment cannot exceed 500 characters.",
        });
      }

      const post = await Post.findById(
        req.params.postId
      );

      if (!post) {
        return res.status(404).json({
          message: "Post not found.",
        });
      }

      const comment = await Comment.create({
        post: req.params.postId,
        user: req.userId,
        text: text.trim(),
      });

      // Increase comment count
      post.commentsCount += 1;

      await post.save();

      await comment.populate(
        "user",
        "name username profileImage isVerified"
      );

      res.status(201).json({
        message: "Comment added successfully.",
        comment,
        commentsCount:
          post.commentsCount,
      });
    } catch (error) {
      console.error(
        "Create comment error:",
        error
      );

      res.status(500).json({
        message: "Unable to add comment.",
      });
    }
  }
);

// ============================================
// DELETE COMMENT
// ============================================

router.delete(
  "/:commentId",
  authenticateUser,
  async (req, res) => {
    try {
      const comment =
        await Comment.findById(
          req.params.commentId
        );

      if (!comment) {
        return res.status(404).json({
          message: "Comment not found.",
        });
      }

      // Only the comment owner can delete it
      if (
        comment.user.toString() !==
        req.userId
      ) {
        return res.status(403).json({
          message:
            "You can only delete your own comment.",
        });
      }

      const post = await Post.findById(
        comment.post
      );

      await comment.deleteOne();

      if (post) {
        post.commentsCount = Math.max(
          0,
          post.commentsCount - 1
        );

        await post.save();
      }

      res.json({
        message: "Comment deleted.",
        commentsCount:
          post?.commentsCount || 0,
      });
    } catch (error) {
      console.error(
        "Delete comment error:",
        error
      );

      res.status(500).json({
        message: "Unable to delete comment.",
      });
    }
  }
);

module.exports = router;