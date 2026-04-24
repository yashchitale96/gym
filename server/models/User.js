const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["USER", "GYM_OWNER", "SUPER_ADMIN", "TRAINER", "STAFF"],
      default: "USER",
    },
    gymId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Gym",
      default: null, // Used for TRAINER and STAFF roles
    },
    permissions: [
      {
        type: String,
        enum: [
          "manage_members",
          "manage_trainers",
          "manage_plans",
          "view_payments",
          "view_analytics",
          "manage_gym",
          "manage_subscription",
        ],
      },
    ],
  },
  { timestamps: true },
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
module.exports = User;
