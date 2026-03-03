const Plan = require("../models/Plan");

// @desc    Create new membership plan
// @route   POST /api/plans
// @access  Private/GymOwner
const createPlan = async (req, res) => {
  const { name, price, durationInDays, description } = req.body;

  // We need to know the gym ID this plan belongs to
  // Assume the owner already has a gym
  const gymId = req.body.gymId;

  if (!gymId) return res.status(400).json({ message: "Gym ID is required" });

  try {
    const plan = await Plan.create({
      gymId,
      name,
      price,
      durationInDays,
      description,
    });

    res.status(201).json(plan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get plans for a specific gym
// @route   GET /api/plans/gym/:gymId
// @access  Public
const getGymPlans = async (req, res) => {
  try {
    const plans = await Plan.find({ gymId: req.params.gymId, isActive: true });
    res.json(plans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a plan
// @route   PUT /api/plans/:id
// @access  Private/GymOwner
const updatePlan = async (req, res) => {
  const { name, price, durationInDays, description, isActive } = req.body;

  try {
    const plan = await Plan.findById(req.params.id);

    if (plan) {
      plan.name = name || plan.name;
      plan.price = price !== undefined ? price : plan.price;
      plan.durationInDays = durationInDays || plan.durationInDays;
      plan.description = description || plan.description;
      plan.isActive = isActive !== undefined ? isActive : plan.isActive;

      const updatedPlan = await plan.save();
      res.json(updatedPlan);
    } else {
      res.status(404).json({ message: "Plan not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createPlan,
  getGymPlans,
  updatePlan,
};
