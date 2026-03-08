const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    gymId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Gym",
      required: true,
    },
    saasPlanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SaaSPlan",
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "EXPIRED", "CANCELLED"],
      default: "ACTIVE",
    },
    razorpayOrderId: {
      type: String,
    },
    razorpayPaymentId: {
      type: String,
    },
    amount: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true },
);

// Index for quick lookups
subscriptionSchema.index({ ownerId: 1, status: 1 });
subscriptionSchema.index({ gymId: 1, status: 1 });

const Subscription = mongoose.model("Subscription", subscriptionSchema);
module.exports = Subscription;
