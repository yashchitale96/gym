const User = require("../models/User");
const Membership = require("../models/Membership");
const Gym = require("../models/Gym");

// @desc    Add a new trainer to the gym (Gym Owner only)
// @route   POST /api/trainers
// @access  Private/GymOwner
const addTrainer = async (req, res) => {
  const { name, email, phone, password } = req.body;

  try {
    // Make sure the logged in gym owner has a gym
    const ownerGym = await Gym.findOne({ ownerId: req.user._id });
    if (!ownerGym) {
      return res
        .status(404)
        .json({ message: "You need to create a gym first" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      if (userExists.role === "TRAINER" && userExists.gymId === ownerGym._id) {
        return res
          .status(400)
          .json({ message: "This trainer is already added to your gym" });
      }
      return res
        .status(400)
        .json({ message: "A user with this email already exists" });
    }

    const trainer = await User.create({
      name,
      email,
      phone,
      password,
      role: "TRAINER",
      gymId: ownerGym._id, // Map the trainer to this owner's gym
    });

    res.status(201).json({
      _id: trainer._id,
      name: trainer.name,
      email: trainer.email,
      phone: trainer.phone,
      role: trainer.role,
      gymId: trainer.gymId,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all trainers for the logged in owner's gym
// @route   GET /api/trainers
// @access  Private/GymOwner
const getTrainersForGym = async (req, res) => {
  try {
    const ownerGym = await Gym.findOne({ ownerId: req.user._id });
    if (!ownerGym) {
      return res.json([]); // Return empty list if no gym
    }

    const trainers = await User.find({
      role: "TRAINER",
      gymId: ownerGym._id,
    }).select("-password");
    res.json(trainers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Assign a trainer to a member's active membership
// @route   PUT /api/trainers/assign/:membershipId
// @access  Private/GymOwner
const assignTrainerToMember = async (req, res) => {
  const { trainerId } = req.body;
  const { membershipId } = req.params;

  try {
    // Verify membership exists
    const membership = await Membership.findById(membershipId);
    if (!membership) {
      return res.status(404).json({ message: "Membership not found" });
    }

    // Verify owner gym matches membership gym
    const ownerGym = await Gym.findOne({ ownerId: req.user._id });
    if (ownerGym._id.toString() !== membership.gymId.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to manage this membership" });
    }

    // Assign the trainer (can be null to remove trainer)
    membership.trainerId = trainerId || null;
    const updatedMembership = await membership.save();

    res.json(updatedMembership);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get members assigned to the logged-in trainer
// @route   GET /api/trainers/my-members
// @access  Private/Trainer
const getAssignedMembers = async (req, res) => {
  try {
    if (req.user.role !== "TRAINER") {
      return res.status(403).json({ message: "Access denied" });
    }

    // Find all memberships assigned to this trainer
    // Populate user details and plan details
    const memberships = await Membership.find({
      trainerId: req.user._id,
      status: "ACTIVE",
    })
      .populate("userId", "name email phone")
      .populate("planId", "name duration price");

    res.json(memberships);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addTrainer,
  getTrainersForGym,
  assignTrainerToMember,
  getAssignedMembers,
};
