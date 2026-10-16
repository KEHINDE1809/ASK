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
      trim: true,
      maxlength: 300,
      default: "",
    },

    music: {
      type: String,
      default: "Original sound",
      maxlength: 100,
    },

    likesCount: {
      type: Number,
      default: 0,
    },

    commentsCount: {
      type: Number,
      default: 0,
    },

    viewsCount: {
      type: Number,
      default: 0,
    },

    visibility: {
      type: String,
      enum: ["everyone", "followers", "private"],
      default: "everyone",
    },

    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.Video ||
  mongoose.model("Video", videoSchema);