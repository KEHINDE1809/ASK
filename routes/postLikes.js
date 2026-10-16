const express = require("express");
const jwt = require("jsonwebtoken");

const Post = require("../models/Post");
const PostLike = require("../models/PostLikes");

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


// LIKE A POST
router.post(
  "/:postId/like",
  authenticateUser,
  async (req, res) => {
    try {
      const { postId } = req.params;

      const post = await Post.findById(postId);

      if (!post) {
        return res.status(404).json({
          message: "Post not found.",
        });
      }

      const existingLike = await PostLike.findOne({
        post: postId,
        user: req.userId,
      });

      if (existingLike) {
        return res.status(400).json({
          message: "You already liked this post.",
          liked: true,
          likesCount: post.likesCount,
        });
      }

      await PostLike.create({
        post: postId,
        user: req.userId,
      });

      post.likesCount += 1;

      await post.save();

      res.status(201).json({
        message: "Post liked successfully.",
        liked: true,
        likesCount: post.likesCount,
      });
    } catch (error) {
      console.error("Like post error:", error);

      res.status(500).json({
        message: "Unable to like post.",
      });
    }
  }
);


// UNLIKE A POST
router.delete(
  "/:postId/like",
  authenticateUser,
  async (req, res) => {
    try {
      const { postId } = req.params;

      const like = await PostLike.findOne({
        post: postId,
        user: req.userId,
      });

      if (!like) {
        return res.status(400).json({
          message: "You have not liked this post.",
          liked: false,
        });
      }

      await PostLike.findByIdAndDelete(like._id);

      const post = await Post.findByIdAndUpdate(
        postId,
        {
          $inc: {
            likesCount: -1,
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

      // Prevent negative like count
      if (post.likesCount < 0) {
        post.likesCount = 0;
        await post.save();
      }

      res.json({
        message: "Post unliked successfully.",
        liked: false,
        likesCount: post.likesCount,
      });
    } catch (error) {
      console.error("Unlike post error:", error);

      res.status(500).json({
        message: "Unable to unlike post.",
      });
    }
  }
);


// CHECK LIKE STATUS
router.get(
  "/:postId/status",
  authenticateUser,
  async (req, res) => {
    try {
      const { postId } = req.params;

      const like = await PostLike.findOne({
        post: postId,
        user: req.userId,
      });

      const post = await Post.findById(postId).select(
        "likesCount"
      );

      if (!post) {
        return res.status(404).json({
          message: "Post not found.",
        });
      }

      res.json({
        liked: !!like,
        likesCount: post.likesCount,
      });
    } catch (error) {
      console.error("Like status error:", error);

      res.status(500).json({
        message: "Unable to check like status.",
      });
    }
  }
);

module.exports = router;