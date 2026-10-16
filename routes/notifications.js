
const express = require("express");
const router = express.Router();

const Notification = require("../models/Notification");
const authMiddleware = require("../middleware/auth");

// GET all notifications for the logged-in user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;

    const notifications = await Notification.find({
      recipient: userId,
    })
      .populate("sender", "username name profilePicture")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    });

    res.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({
      message: "Failed to fetch notifications",
    });
  }
});

// MARK all notifications as read
router.patch("/read-all", authMiddleware, async (req, res) => {
  try {
    await Notification.updateMany(
      {
        recipient: req.userId,
        isRead: false,
      },
      {
        $set: { isRead: true },
      }
    );

    res.json({
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Mark notifications read error:", error);
    res.status(500).json({
      message: "Failed to update notifications",
    });
  }
});

// MARK one notification as read
router.patch("/:id/read", authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        recipient: req.userId,
      },
      {
        $set: { isRead: true },
      },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    res.json({
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    console.error("Mark notification read error:", error);
    res.status(500).json({
      message: "Failed to update notification",
    });
  }
});

module.exports = router;
