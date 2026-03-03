const Razorpay = require("razorpay");
const crypto = require("crypto");
const Membership = require("../models/Membership");
const Payment = require("../models/Payment");
const Plan = require("../models/Plan");

// Initialize Razorpay
// NOTE: Make sure to handle env variables gracefully, if missing it might crash
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

// @desc    Create a Razorpay order
// @route   POST /api/memberships/checkout
// @access  Private/User
const createOrder = async (req, res) => {
  const { planId, gymId } = req.body;

  try {
    const plan = await Plan.findById(planId);
    if (!plan) return res.status(404).json({ message: "Plan not found" });

    const amount = plan.price * 100; // Razorpay expects amount in paise

    const razorpay = initRazorpay();
    if (!razorpay) {
      // Mock payment flow for testing without keys
      const mockOrder = {
        id: `mock_order_${Date.now()}`,
        amount,
        currency: "INR",
      };

      await Payment.create({
        userId: req.user._id,
        gymId,
        planId,
        amount: plan.price,
        razorpayOrderId: mockOrder.id,
        status: "PENDING",
      });
      return res.json({ ...mockOrder, isMock: true });
    }

    const options = {
      amount,
      currency: "INR",
      receipt: `receipt_order_${Math.floor(Math.random() * 10000)}`,
    };

    const order = await razorpay.orders.create(options);

    // Create a pending payment record
    await Payment.create({
      userId: req.user._id,
      gymId,
      planId,
      amount: plan.price,
      razorpayOrderId: order.id,
      status: "PENDING",
    });

    res.json(order);
  } catch (error) {
    console.error("Razorpay Error:", error);
    res.status(500).json({
      message:
        error.error?.description ||
        error.message ||
        "Payment initialization failed on server",
    });
  }
};

// @desc    Verify Razorpay payment and activate membership
// @route   POST /api/memberships/verify
// @access  Private/User
const verifyPayment = async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    planId,
    gymId,
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

    if (isValid) {
      // Payment is verified
      const payment = await Payment.findOne({
        razorpayOrderId: razorpay_order_id,
      });
      if (payment) {
        payment.status = "COMPLETED";
        payment.razorpayPaymentId = razorpay_payment_id;
        await payment.save();
      }

      // Create Membership
      const plan = await Plan.findById(planId);
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + (plan.durationInDays || 30));

      // Generate a simple unique QR Code String (In production, use UUID or similar)
      const qrCodeString = `GYM_MVP_${req.user._id}_${Date.now()}`;

      const membership = await Membership.create({
        userId: req.user._id,
        gymId,
        planId,
        startDate,
        endDate,
        status: "ACTIVE",
        qrCodeString,
      });

      res
        .status(200)
        .json({ message: "Payment verified successfully", membership });
    } else {
      // Invalid signature
      res.status(400).json({ message: "Invalid signature sent!" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's active membership
// @route   GET /api/memberships/my
// @access  Private/User
const getMyMemberships = async (req, res) => {
  try {
    const memberships = await Membership.find({ userId: req.user._id })
      .populate("gymId", "name address")
      .populate("planId", "name");
    res.json(memberships);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's payment history
// @route   GET /api/memberships/payments
// @access  Private/User
const getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user._id })
      .populate("gymId", "name")
      .populate("planId", "name durationInDays")
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get members for a gym (owner view)
// @route   GET /api/memberships/gym/:gymId
// @access  Private/GymOwner
const getGymMembers = async (req, res) => {
  try {
    const memberships = await Membership.find({ gymId: req.params.gymId })
      .populate("userId", "name email phone")
      .populate("planId", "name price durationInDays")
      .sort({ createdAt: -1 });
    res.json(memberships);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get revenue summary for gym owner
// @route   GET /api/memberships/gym/:gymId/revenue
// @access  Private/GymOwner
const getGymRevenue = async (req, res) => {
  try {
    const payments = await Payment.find({
      gymId: req.params.gymId,
      status: "COMPLETED",
    });
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalTransactions = payments.length;

    // This month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyPayments = payments.filter(
      (p) => new Date(p.createdAt) >= startOfMonth,
    );
    const monthlyRevenue = monthlyPayments.reduce(
      (sum, p) => sum + p.amount,
      0,
    );

    res.json({
      totalRevenue,
      totalTransactions,
      monthlyRevenue,
      monthlyTransactions: monthlyPayments.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  getMyMemberships,
  getMyPayments,
  getGymMembers,
  getGymRevenue,
};
