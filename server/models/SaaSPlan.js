const mongoose = require("mongoose");

const saasPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    price: {
      type: Number,
      required: true,
    },
    durationInDays: {
      type: Number,
      required: true,
      default: 30,
    },
    maxMembers: {
      type: Number,
      required: true,
      default: -1, // -1 means unlimited
    },
    maxTrainers: {
      type: Number,
      required: true,
      default: -1,
    },
    features: [
      {
        type: String,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

const SaaSPlan = mongoose.model("SaaSPlan", saasPlanSchema);
module.exports = SaaSPlan;
