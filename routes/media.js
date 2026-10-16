const express = require("express");
const jwt = require("jsonwebtoken");
const streamifier = require("streamifier");

const cloudinary = require("../config/cloudinary");
const upload = require("../middleware/upload");

const router = express.Router();

// AUTHENTICATION
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

// UPLOAD IMAGE OR VIDEO
router.post(
  "/upload",
  authenticateUser,
  upload.single("media"),
  async (req, res) => {
    try {
      console.log("Media upload request received.");

      if (!req.file) {
        return res.status(400).json({
          message: "Media file is required.",
        });
      }

      const isImage = req.file.mimetype.startsWith("image/");
      const isVideo = req.file.mimetype.startsWith("video/");

      if (!isImage && !isVideo) {
        return res.status(400).json({
          message: "Only image and video files are allowed.",
        });
      }

      const resourceType = isVideo ? "video" : "image";

      const folder = isVideo
        ? "ask/videos"
        : "ask/images";

      console.log(
        `Uploading ${resourceType} to Cloudinary:`,
        req.file.originalname
      );

      const uploadToCloudinary = () => {
        return new Promise((resolve, reject) => {
          const stream =
            cloudinary.uploader.upload_stream(
              {
                folder,
                resource_type: resourceType,
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

      res.status(201).json({
        message: "Media uploaded successfully.",

        media: {
          url: cloudinaryResult.secure_url,
          publicId: cloudinaryResult.public_id,
          resourceType,
          originalName: req.file.originalname,
        },
      });
    } catch (error) {
      console.error("Media upload error:", error);

      res.status(500).json({
        message:
          error.message ||
          "Unable to upload media.",
      });
    }
  }
);

module.exports = router;