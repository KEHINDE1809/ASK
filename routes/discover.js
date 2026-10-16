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

// GET PEOPLE TO DISCOVER
router.get("/", authenticateUser, async (req, res) => {
  try {
    const currentUser = await User.findById(
      req.userId
    );

    if (!currentUser) {
      return res.status(404).json({
        message: "User account not found.",
      });
    }

    const users = await User.find({
      _id: {
        $ne: req.userId,
      },
      username: {
        $exists: true,
        $ne: "",
      },
    })
      .select(
        "-password -email -dateOfBirth"
      )
      .limit(20);

    res.json({
      users,
    });
  } catch (error) {
    console.error("Discover error:", error);

    res.status(500).json({
      message: "Unable to load people.",
    });
  }
});

module.exports = router;