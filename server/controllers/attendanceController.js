const Attendance = require("../models/Attendance");
const Membership = require("../models/Membership");

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

module.exports = {
  markAttendance,
  getGymAttendance,
};
