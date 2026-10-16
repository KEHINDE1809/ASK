const express = require("express");
const jwt = require("jsonwebtoken");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");

const router = express.Router();

// ===============================
// AUTHENTICATION
// ===============================

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

// ===============================
// CREATE OR GET CONVERSATION
// ===============================

router.post("/conversation", authenticateUser, async (req, res) => {
  try {
    const { otherUserId } = req.body;

    if (!otherUserId) {
      return res.status(400).json({
        message: "Other user ID is required.",
      });
    }

    if (otherUserId === req.userId) {
      return res.status(400).json({
        message: "You cannot start a conversation with yourself.",
      });
    }

    const otherUser = await User.findById(otherUserId);

    if (!otherUser) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    let conversation = await Conversation.findOne({
      participants: {
        $all: [req.userId, otherUserId],
      },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.userId, otherUserId],
      });
    }

    await conversation.populate(
      "participants",
      "name username profileImage"
    );

    res.json({
      message: "Conversation ready.",
      conversation,
    });
  } catch (error) {
    console.error("Conversation error:", error);

    res.status(500).json({
      message: "Unable to create conversation.",
    });
  }
});

// ===============================
// SEND MESSAGE
// ===============================

router.post("/message", authenticateUser, async (req, res) => {
  try {
    const {
      conversationId,
      text,
    } = req.body;

    if (!conversationId || !text || !text.trim()) {
      return res.status(400).json({
        message: "Conversation and message text are required.",
      });
    }

    const conversation = await Conversation.findById(
      conversationId
    );

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found.",
      });
    }

    const isParticipant = conversation.participants.some(
      (participant) =>
        participant.toString() === req.userId
    );

    if (!isParticipant) {
      return res.status(403).json({
        message: "You are not part of this conversation.",
      });
    }

    const message = await Message.create({
      conversation: conversationId,
      sender: req.userId,
      text: text.trim(),
    });

    conversation.lastMessage = message._id;
    conversation.lastMessageAt = new Date();

    await conversation.save();

    await message.populate(
      "sender",
      "name username profileImage"
    );

    res.status(201).json({
      message: "Message sent.",
      data: message,
    });
  } catch (error) {
    console.error("Send message error:", error);

    res.status(500).json({
      message: "Unable to send message.",
    });
  }
});

// ===============================
// GET CONVERSATION MESSAGES
// ===============================

router.get(
  "/conversation/:conversationId",
  authenticateUser,
  async (req, res) => {
    try {
      const { conversationId } = req.params;

      const conversation = await Conversation.findById(
        conversationId
      );

      if (!conversation) {
        return res.status(404).json({
          message: "Conversation not found.",
        });
      }

      const isParticipant = conversation.participants.some(
        (participant) =>
          participant.toString() === req.userId
      );

      if (!isParticipant) {
        return res.status(403).json({
          message: "Access denied.",
        });
      }

      const messages = await Message.find({
        conversation: conversationId,
      })
        .populate(
          "sender",
          "name username profileImage"
        )
        .sort({ createdAt: 1 });

      res.json({
        messages,
      });
    } catch (error) {
      console.error("Get messages error:", error);

      res.status(500).json({
        message: "Unable to load messages.",
      });
    }
  }
);

// ===============================
// GET MY CONVERSATIONS
// ===============================

router.get(
  "/conversations",
  authenticateUser,
  async (req, res) => {
    try {
      const conversations =
        await Conversation.find({
          participants: req.userId,
        })
          .populate(
            "participants",
            "name username profileImage"
          )
          .populate("lastMessage")
          .sort({ lastMessageAt: -1 });

      res.json({
        conversations,
      });
    } catch (error) {
      console.error(
        "Get conversations error:",
        error
      );

      res.status(500).json({
        message: "Unable to load conversations.",
      });
    }
  }
);

module.exports = router;