const Attendance = require("../models/Attendance");
const Membership = require("../models/Membership");
const Payment = require("../models/Payment");

// @desc    Mark attendance via QR Scan
// @route   POST /api/attendance/scan
// @access  Private/GymOwner
const markAttendance = async (req, res) => {
  const { qrCodeString } = req.body;

  try {
    // 1. Find the membership by QR String
    const membership = await Membership.findOne({ qrCodeString }).populate(
      "userId",
      "name",
    );

    if (!membership) {
      return res.status(404).json({ message: "Invalid QR Code" });
    }

    // 2. Verify it belongs to the owner's gym
    // In MVP, we trust the GymOwner has access to their gym's members
    // Ideally we verify membership.gymId === gymOwner's gymId

    // 3. Verify membership is active
    if (
      membership.status !== "ACTIVE" ||
      new Date() > new Date(membership.endDate)
    ) {
      return res
        .status(400)
        .json({ message: "Membership is expired or inactive" });
    }

    // 4. Record attendance
    const attendance = await Attendance.create({
      membershipId: membership._id,
      userId: membership.userId._id, // User who owns the membership
      gymId: membership.gymId,
    });

    res.status(201).json({
      message: "Attendance marked successfully",
      attendance,
      memberName: membership.userId.name,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get attendance history for owner's gym
// @route   GET /api/attendance/gym/:gymId
// @access  Private/GymOwner
const getGymAttendance = async (req, res) => {
  try {
    // Find attendance for today
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const attendances = await Attendance.find({
      gymId: req.params.gymId,
      date: { $gte: start, $lt: end },
    }).populate("userId", "name");

    res.json(attendances);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's own attendance history
// @route   GET /api/attendance/my
// @access  Private/User
const getUserAttendance = async (req, res) => {
  try {
    const attendances = await Attendance.find({ userId: req.user._id })
      .populate("gymId", "name address")
      .sort({ date: -1 })
      .limit(50);
    res.json(attendances);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's dashboard stats
// @route   GET /api/attendance/stats
// @access  Private/User
const getUserStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Total check-ins
    const totalCheckIns = await Attendance.countDocuments({ userId });

    // Check-ins this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const checkInsThisMonth = await Attendance.countDocuments({
      userId,
      date: { $gte: startOfMonth },
    });

    // Total spent
    const payments = await Payment.find({ userId, status: "COMPLETED" });
    const totalSpent = payments.reduce((sum, p) => sum + p.amount, 0);

    // Active memberships count
    const activeMemberships = await Membership.countDocuments({
      userId,
      status: "ACTIVE",
      endDate: { $gt: now },
    });

    // Attendance by date (last 90 days for heatmap)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const recentAttendances = await Attendance.find({
      userId,
      date: { $gte: ninetyDaysAgo },
    }).sort({ date: 1 });

    const attendanceByDate = {};
    recentAttendances.forEach((a) => {
      const dateKey = new Date(a.date).toISOString().split("T")[0];
      attendanceByDate[dateKey] = (attendanceByDate[dateKey] || 0) + 1;
    });

    // Current streak (consecutive days ending today or yesterday)
    let currentStreak = 0;
    const checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);

    // Check if user checked in today
    const todayKey = checkDate.toISOString().split("T")[0];
    if (!attendanceByDate[todayKey]) {
      // Check yesterday — streak might still be active
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const key = checkDate.toISOString().split("T")[0];
      if (attendanceByDate[key]) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    res.json({
      totalCheckIns,
      checkInsThisMonth,
      totalSpent,
      activeMemberships,
      currentStreak,
      attendanceByDate,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  markAttendance,
  getGymAttendance,
  getUserAttendance,
  getUserStats,
};
