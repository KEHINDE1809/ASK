const mongoose = require("mongoose");

const followSchema = new mongoose.Schema(
  {
    follower: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    following: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate follows
followSchema.index(
  { follower: 1, following: 1 },
  { unique: true }
);

// Prevent following yourself
followSchema.pre("validate", function (next) {
  if (
    this.follower &&
    this.following &&
    this.follower.equals(this.following)
  ) {
    return next(
      new Error("You cannot follow yourself.")
    );
  }

  next();
});

module.exports =
  mongoose.models.Follow ||
  mongoose.model("Follow", followSchema);