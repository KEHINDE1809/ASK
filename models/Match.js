const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema(
  {
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    userOne: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    userTwo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

matchSchema.index(
  {
    userOne: 1,
    userTwo: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model("Match", matchSchema);