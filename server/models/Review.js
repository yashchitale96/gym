const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    gymId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Gym",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true },
);

// Optional: Ensure a user can only leave one review per gym
reviewSchema.index({ userId: 1, gymId: 1 }, { unique: true });

const Review = mongoose.model("Review", reviewSchema);
module.exports = Review;
