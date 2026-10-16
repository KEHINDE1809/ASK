const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema(
  {
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    videoUrl: {
      type: String,
      required: true,
    },

    thumbnailUrl: {
      type: String,
      default: "",
    },

    caption: {
      type: String,
      default: "",
      trim: true,
    },

    music: {
      type: String,
      default: "Original sound",
    },

    visibility: {
      type: String,
      enum: ["everyone", "matches", "private"],
      default: "everyone",
    },

    isPublished: {
      type: Boolean,
      default: true,
    },

    viewsCount: {
      type: Number,
      default: 0,
    },

    likesCount: {
      type: Number,
      default: 0,
    },

    commentsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.Video ||
  mongoose.model("Video", videoSchema);