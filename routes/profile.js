const express = require("express");
const jwt = require("jsonwebtoken");
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

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.userId = decoded.userId;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired login session.",
    });
  }
};

// GET CURRENT USER
router.get("/me", authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User account not found.",
      });
    }

    res.json({
      user,
    });
  } catch (error) {
    console.error("Get profile error:", error);

    res.status(500).json({
      message: "Unable to load your profile.",
    });
  }
});

// UPDATE PROFILE
router.put("/", authenticateUser, async (req, res) => {
  try {
    const {
      username,
      bio,
      gender,
      interestedIn,
      location,
      interests,
    } = req.body;

    if (!username || !gender || !interestedIn || !location) {
      return res.status(400).json({
        message: "Please complete all required profile fields.",
      });
    }

    if (!Array.isArray(interests) || interests.length < 3) {
      return res.status(400).json({
        message: "Please select at least 3 interests.",
      });
    }

    const existingUsername = await User.findOne({
      username: username.toLowerCase(),
      _id: { $ne: req.userId },
    });

    if (existingUsername) {
      return res.status(409).json({
        message: "That username is already taken.",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        username: username.toLowerCase(),
        bio,
        gender,
        interestedIn,
        location,
        interests,
      },
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User account not found.",
      });
    }

    res.json({
      message: "Profile updated successfully.",
      user,
    });
  } catch (error) {
    console.error("Profile update error:", error);

    res.status(500).json({
      message: "Unable to update your profile.",
    });
  }
});

module.exports = router;
