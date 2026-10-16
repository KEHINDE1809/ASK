const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // photo or video
    type: {
      type: String,
      enum: ["photo", "video"],
      required: true,
    },

    // Supports one or multiple media files
    media: [
      {
        url: {
          type: String,
          required: true,
        },

        publicId: {
          type: String,
          default: "",
        },

        resourceType: {
          type: String,
          enum: ["image", "video"],
          required: true,
        },
      },
    ],

    caption: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    music: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "Original sound",
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

    sharesCount: {
      type: Number,
      default: 0,
    },

    savesCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.Post ||
  mongoose.model("Post", postSchema);