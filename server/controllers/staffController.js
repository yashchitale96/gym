const User = require("../models/User");
const Gym = require("../models/Gym");

const ALL_PERMISSIONS = [
  "manage_members",
  "manage_trainers",
  "manage_plans",
  "view_payments",
  "view_analytics",
  "manage_gym",
  "manage_subscription",
];

// @desc    Add a staff member to the gym
// @route   POST /api/staff
// @access  Private/GymOwner
const addStaff = async (req, res) => {
  const { name, email, phone, password, permissions } = req.body;

  try {
    const ownerGym = await Gym.findOne({ ownerId: req.user._id });
    if (!ownerGym) {
      return res
        .status(404)
        .json({ message: "You need to create a gym first" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res
        .status(400)
        .json({ message: "A user with this email already exists" });
    }

    // Validate permissions
    const validPermissions = (permissions || []).filter((p) =>
      ALL_PERMISSIONS.includes(p),
    );

    const staff = await User.create({
      name,
      email,
      phone,
      password,
      role: "STAFF",
      gymId: ownerGym._id,
      permissions: validPermissions,
    });

    res.status(201).json({
      _id: staff._id,
      name: staff.name,
      email: staff.email,
      phone: staff.phone,
      role: staff.role,
      gymId: staff.gymId,
      permissions: staff.permissions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all staff for the gym owner's gym
// @route   GET /api/staff
// @access  Private/GymOwner
const getStaff = async (req, res) => {
  try {
    const ownerGym = await Gym.findOne({ ownerId: req.user._id });
    if (!ownerGym) {
      return res.json([]);
    }

    const staff = await User.find({
      role: "STAFF",
      gymId: ownerGym._id,
    }).select("-password");

    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a staff member's permissions
// @route   PUT /api/staff/:id/permissions
// @access  Private/GymOwner
const updateStaffPermissions = async (req, res) => {
  const { permissions } = req.body;

  try {
    const staff = await User.findById(req.params.id);

    if (!staff || staff.role !== "STAFF") {
      return res.status(404).json({ message: "Staff member not found" });
    }

    // Verify staff belongs to owner's gym
    const ownerGym = await Gym.findOne({ ownerId: req.user._id });
    if (!ownerGym || staff.gymId?.toString() !== ownerGym._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to manage this staff" });
    }

    const validPermissions = (permissions || []).filter((p) =>
      ALL_PERMISSIONS.includes(p),
    );

    staff.permissions = validPermissions;
    await staff.save();

    res.json({
      _id: staff._id,
      name: staff.name,
      email: staff.email,
      permissions: staff.permissions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove a staff member
// @route   DELETE /api/staff/:id
// @access  Private/GymOwner
const removeStaff = async (req, res) => {
  try {
    const staff = await User.findById(req.params.id);

    if (!staff || staff.role !== "STAFF") {
      return res.status(404).json({ message: "Staff member not found" });
    }

    const ownerGym = await Gym.findOne({ ownerId: req.user._id });
    if (!ownerGym || staff.gymId?.toString() !== ownerGym._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to manage this staff" });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "Staff member removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get available permissions list
// @route   GET /api/staff/permissions
// @access  Private/GymOwner
const getPermissionsList = async (req, res) => {
  res.json(ALL_PERMISSIONS);
};

module.exports = {
  addStaff,
  getStaff,
  updateStaffPermissions,
  removeStaff,
  getPermissionsList,
};
