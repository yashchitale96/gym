const Razorpay = require("razorpay");
const crypto = require("crypto");
const SaaSPlan = require("../models/SaaSPlan");
const Subscription = require("../models/Subscription");
const Gym = require("../models/Gym");

// Initialize Razorpay (same pattern as membershipController)
const initRazorpay = () => {
  if (
    !process.env.RAZORPAY_KEY_ID ||
    process.env.RAZORPAY_KEY_ID === "test_key" ||
    !process.env.RAZORPAY_KEY_SECRET
  ) {
    return null;
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

// @desc    Get all active SaaS plans
// @route   GET /api/subscriptions/plans
// @access  Public
const getSaaSPlans = async (req, res) => {
  try {
    const plans = await SaaSPlan.find({ isActive: true }).sort({ price: 1 });
    res.json(plans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a Razorpay order for SaaS subscription
// @route   POST /api/subscriptions/checkout
// @access  Private/GymOwner
const createSubscriptionOrder = async (req, res) => {
  const { saasPlanId } = req.body;

  try {
    const saasPlan = await SaaSPlan.findById(saasPlanId);
    if (!saasPlan) {
      return res.status(404).json({ message: "SaaS plan not found" });
    }

    if (!saasPlan.isActive) {
      return res
        .status(400)
        .json({ message: "This plan is no longer available" });
    }

    // Check if owner has a gym
    const gym = await Gym.findOne({ ownerId: req.user._id });
    if (!gym) {
      return res
        .status(400)
        .json({ message: "You must create a gym profile first" });
    }

    // Check for existing active subscription
    const existingSubscription = await Subscription.findOne({
      ownerId: req.user._id,
      status: "ACTIVE",
      endDate: { $gt: new Date() },
    });

    if (existingSubscription) {
      return res.status(400).json({
        message:
          "You already have an active subscription. Cancel it first or wait for it to expire.",
      });
    }

    const amount = saasPlan.price * 100; // Razorpay expects paise

    const razorpay = initRazorpay();
    if (!razorpay) {
      // Mock payment flow for development
      const mockOrder = {
        id: `mock_saas_order_${Date.now()}`,
        amount,
        currency: "INR",
      };

      return res.json({ ...mockOrder, isMock: true, saasPlanId: saasPlan._id });
    }

    const options = {
      amount,
      currency: "INR",
      receipt: `saas_receipt_${Math.floor(Math.random() * 10000)}`,
      notes: {
        type: "saas_subscription",
        ownerId: req.user._id.toString(),
        saasPlanId: saasPlan._id.toString(),
      },
    };

    const order = await razorpay.orders.create(options);
    res.json({ ...order, saasPlanId: saasPlan._id });
  } catch (error) {
    console.error("Subscription Order Error:", error);
    res.status(500).json({
      message:
        error.error?.description ||
        error.message ||
        "Subscription payment initialization failed",
    });
  }
};

// @desc    Verify Razorpay payment and activate subscription
// @route   POST /api/subscriptions/verify
// @access  Private/GymOwner
const verifySubscriptionPayment = async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    saasPlanId,
  } = req.body;

  try {
    let isValid = false;

    if (razorpay_signature === "mock_signature") {
      isValid = true; // Auto-verify mock payments
    } else {
      const sign = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSign = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(sign.toString())
        .digest("hex");

      isValid = razorpay_signature === expectedSign;
    }

    if (!isValid) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    const saasPlan = await SaaSPlan.findById(saasPlanId);
    if (!saasPlan) {
      return res.status(404).json({ message: "SaaS plan not found" });
    }

    const gym = await Gym.findOne({ ownerId: req.user._id });
    if (!gym) {
      return res.status(400).json({ message: "No gym found for this owner" });
    }

    // Expire any old active subscriptions
    await Subscription.updateMany(
      { ownerId: req.user._id, status: "ACTIVE" },
      { status: "EXPIRED" },
    );

    // Create new subscription
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + (saasPlan.durationInDays || 30));

    const subscription = await Subscription.create({
      ownerId: req.user._id,
      gymId: gym._id,
      saasPlanId: saasPlan._id,
      startDate,
      endDate,
      status: "ACTIVE",
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      amount: saasPlan.price,
    });

    const populated = await subscription.populate("saasPlanId");

    res.status(200).json({
      message: "Subscription activated successfully",
      subscription: populated,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current owner's subscription
// @route   GET /api/subscriptions/my
// @access  Private/GymOwner
const getMySubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      ownerId: req.user._id,
      status: "ACTIVE",
    })
      .populate("saasPlanId")
      .populate("gymId", "name")
      .sort({ createdAt: -1 });

    if (!subscription) {
      return res.status(404).json({ message: "No active subscription found" });
    }

    // Check if expired
    if (new Date(subscription.endDate) < new Date()) {
      subscription.status = "EXPIRED";
      await subscription.save();
      return res
        .status(404)
        .json({ message: "Your subscription has expired", subscription });
    }

    res.json(subscription);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all subscriptions (admin)
// @route   GET /api/subscriptions/admin/all
// @access  Private/SuperAdmin
const getAllSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.find()
      .populate("ownerId", "name email phone")
      .populate("gymId", "name")
      .populate("saasPlanId", "name price")
      .sort({ createdAt: -1 });

    // Stats
    const activeCount = subscriptions.filter(
      (s) => s.status === "ACTIVE" && new Date(s.endDate) > new Date(),
    ).length;
    const totalRevenue = subscriptions.reduce((sum, s) => sum + s.amount, 0);

    // Monthly revenue
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyRevenue = subscriptions
      .filter((s) => new Date(s.createdAt) >= startOfMonth)
      .reduce((sum, s) => sum + s.amount, 0);

    res.json({
      subscriptions,
      stats: {
        total: subscriptions.length,
        active: activeCount,
        totalRevenue,
        monthlyRevenue,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel subscription
// @route   PUT /api/subscriptions/:id/cancel
// @access  Private/GymOwner
const cancelSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    if (subscription.ownerId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to cancel this subscription" });
    }

    if (subscription.status !== "ACTIVE") {
      return res.status(400).json({ message: "Subscription is not active" });
    }

    subscription.status = "CANCELLED";
    await subscription.save();

    res.json({ message: "Subscription cancelled successfully", subscription });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get admin subscription stats
// @route   GET /api/subscriptions/admin/stats
// @access  Private/SuperAdmin
const getSubscriptionStats = async (req, res) => {
  try {
    const totalSubscriptions = await Subscription.countDocuments();
    const activeSubscriptions = await Subscription.countDocuments({
      status: "ACTIVE",
      endDate: { $gt: new Date() },
    });

    const allSubs = await Subscription.find().populate("saasPlanId", "name");

    const totalRevenue = allSubs.reduce((sum, s) => sum + s.amount, 0);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyRevenue = allSubs
      .filter((s) => new Date(s.createdAt) >= startOfMonth)
      .reduce((sum, s) => sum + s.amount, 0);

    // By plan breakdown
    const byPlan = {};
    allSubs.forEach((s) => {
      const planName = s.saasPlanId?.name || "Unknown";
      if (!byPlan[planName]) {
        byPlan[planName] = { count: 0, revenue: 0 };
      }
      byPlan[planName].count++;
      byPlan[planName].revenue += s.amount;
    });

    res.json({
      totalSubscriptions,
      activeSubscriptions,
      totalRevenue,
      monthlyRevenue,
      byPlan,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getSaaSPlans,
  createSubscriptionOrder,
  verifySubscriptionPayment,
  getMySubscription,
  getAllSubscriptions,
  cancelSubscription,
  getSubscriptionStats,
};
