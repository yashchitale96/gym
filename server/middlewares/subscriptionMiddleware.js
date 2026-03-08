const Subscription = require("../models/Subscription");
const Membership = require("../models/Membership");
const User = require("../models/User");
const Gym = require("../models/Gym");

/**
 * Middleware: checkSubscription
 * Verifies the gym owner has an active, non-expired SaaS subscription.
 * Attach after protect + authorize("GYM_OWNER") middleware.
 */
const checkSubscription = async (req, res, next) => {
  try {
    // Only applies to GYM_OWNER role
    if (req.user.role !== "GYM_OWNER") {
      return next();
    }

    const subscription = await Subscription.findOne({
      ownerId: req.user._id,
      status: "ACTIVE",
      endDate: { $gt: new Date() },
    }).populate("saasPlanId");

    if (!subscription) {
      return res.status(403).json({
        message:
          "Active subscription required. Please subscribe to a plan to continue using this feature.",
        code: "SUBSCRIPTION_REQUIRED",
      });
    }

    // Attach subscription info to request for downstream use
    req.subscription = subscription;
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Middleware: checkMemberLimit
 * Checks if adding a new member would exceed the plan's maxMembers limit.
 * Must run after checkSubscription (needs req.subscription).
 */
const checkMemberLimit = async (req, res, next) => {
  try {
    // Only applies to GYM_OWNER role
    if (req.user.role !== "GYM_OWNER") {
      return next();
    }

    // If no subscription attached, skip (checkSubscription handles that)
    if (!req.subscription) {
      return next();
    }

    const plan = req.subscription.saasPlanId;
    if (!plan || plan.maxMembers === -1) {
      return next(); // Unlimited
    }

    const gym = await Gym.findOne({ ownerId: req.user._id });
    if (!gym) {
      return next();
    }

    const currentMembers = await Membership.countDocuments({
      gymId: gym._id,
      status: "ACTIVE",
      endDate: { $gt: new Date() },
    });

    if (currentMembers >= plan.maxMembers) {
      return res.status(403).json({
        message: `Member limit reached (${plan.maxMembers}). Upgrade your plan to add more members.`,
        code: "MEMBER_LIMIT_REACHED",
        currentCount: currentMembers,
        limit: plan.maxMembers,
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Middleware: checkTrainerLimit
 * Checks if adding a new trainer would exceed the plan's maxTrainers limit.
 * Must run after checkSubscription (needs req.subscription).
 */
const checkTrainerLimit = async (req, res, next) => {
  try {
    // Only applies to GYM_OWNER role
    if (req.user.role !== "GYM_OWNER") {
      return next();
    }

    if (!req.subscription) {
      return next();
    }

    const plan = req.subscription.saasPlanId;
    if (!plan || plan.maxTrainers === -1) {
      return next(); // Unlimited
    }

    const gym = await Gym.findOne({ ownerId: req.user._id });
    if (!gym) {
      return next();
    }

    const currentTrainers = await User.countDocuments({
      gymId: gym._id,
      role: "TRAINER",
    });

    if (currentTrainers >= plan.maxTrainers) {
      return res.status(403).json({
        message: `Trainer limit reached (${plan.maxTrainers}). Upgrade your plan to add more trainers.`,
        code: "TRAINER_LIMIT_REACHED",
        currentCount: currentTrainers,
        limit: plan.maxTrainers,
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { checkSubscription, checkMemberLimit, checkTrainerLimit };
