const express = require("express");
const jwt = require("jsonwebtoken");
const streamifier = require("streamifier");

const Video = require("../models/Video");
const User = require("../models/User");
const cloudinary = require("../config/cloudinary");
const upload = require("../middleware/upload");

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

// GET VIDEO FEED
router.get("/", authenticateUser, async (req, res) => {
  try {
    const videos = await Video.find({
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
      videos,
    });
  } catch (error) {
    console.error("Get videos error:", error);

    res.status(500).json({
      message: "Unable to load videos.",
    });
  }
});

// CREATE VIDEO + UPLOAD TO CLOUDINARY
router.post(
  "/",
  authenticateUser,
  upload.single("video"),
  async (req, res) => {
    try {
      console.log("Video upload request received.");

      if (!req.file) {
        return res.status(400).json({
          message: "Video file is required.",
        });
      }

      const user = await User.findById(req.userId);

      if (!user) {
        return res.status(404).json({
          message: "User not found.",
        });
      }

      const {
        caption,
        music,
        visibility,
      } = req.body;

      console.log(
        "Uploading video to Cloudinary:",
        req.file.originalname
      );

      const uploadToCloudinary = () => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: "ask/videos",
              resource_type: "video",
            },
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result);
              }
            }
          );

          streamifier
            .createReadStream(req.file.buffer)
            .pipe(stream);
        });
      };

      const cloudinaryResult =
        await uploadToCloudinary();

      console.log(
        "Cloudinary upload successful:",
        cloudinaryResult.secure_url
      );

      const video = await Video.create({
        creator: req.userId,
        videoUrl: cloudinaryResult.secure_url,
        thumbnailUrl:
          cloudinaryResult.secure_url
            ? cloudinaryResult.secure_url
                .replace(
                  "/upload/",
                  "/upload/so_1/"
                )
                .replace(/\.[^/.]+$/, ".jpg")
            : "",
        caption: caption || "",
        music: music || "Original sound",
        visibility: visibility || "everyone",
      });

      await video.populate(
        "creator",
        "name username profileImage isVerified"
      );

      res.status(201).json({
        message: "Video uploaded successfully.",
        video,
      });
    } catch (error) {
      console.error("Create video error:", error);

      res.status(500).json({
        message:
          error.message ||
          "Unable to create video.",
      });
    }
  }
);

// INCREMENT VIEW
router.post(
  "/:videoId/view",
  authenticateUser,
  async (req, res) => {
    try {
      const video = await Video.findByIdAndUpdate(
        req.params.videoId,
        {
          $inc: {
            viewsCount: 1,
          },
        },
        {
          new: true,
        }
      );

      if (!video) {
        return res.status(404).json({
          message: "Video not found.",
        });
      }

      res.json({
        message: "View recorded.",
        viewsCount: video.viewsCount,
      });
    } catch (error) {
      console.error("Video view error:", error);

      res.status(500).json({
        message: "Unable to record video view.",
      });
    }
  }
);

module.exports = router;