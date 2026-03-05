const Gym = require("../models/Gym");
const User = require("../models/User");
const Membership = require("../models/Membership");

// @desc    Get all approved gyms (with search & filtering)
// @route   GET /api/gyms
// @access  Public
const getGyms = async (req, res) => {
  const { keyword, minPrice, maxPrice, lat, lng, maxDistance } = req.query;

  let query = { status: "APPROVED" };

  if (keyword) {
    query.name = { $regex: keyword, $options: "i" };
  }

  if (minPrice || maxPrice) {
    query.monthlySubscriptionFee = {};
    if (minPrice) query.monthlySubscriptionFee.$gte = Number(minPrice);
    if (maxPrice) query.monthlySubscriptionFee.$lte = Number(maxPrice);
  }

  try {
    let gyms;
    // If lat and lng are provided, use $geoNear aggregation for sorting by distance
    if (lat && lng) {
      const geoNearStage = {
        $geoNear: {
          near: { type: "Point", coordinates: [Number(lng), Number(lat)] },
          distanceField: "distance",
          spherical: true,
          query: query,
        },
      };

      // Set maxDistance if provided (convert km to meters)
      if (maxDistance) {
        geoNearStage.$geoNear.maxDistance = Number(maxDistance) * 1000;
      }

      gyms = await Gym.aggregate([geoNearStage]);
    } else {
      gyms = await Gym.find(query);
    }
    res.json(gyms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single gym by ID
// @route   GET /api/gyms/:id
// @access  Public
const getGymById = async (req, res) => {
  try {
    const gym = await Gym.findById(req.params.id);

    if (gym && gym.status === "APPROVED") {
      res.json(gym);
    } else {
      res.status(404).json({ message: "Gym not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a gym profile
// @route   POST /api/gyms
// @access  Private/GymOwner
const createGym = async (req, res) => {
  const {
    name,
    description,
    address,
    location, // expected to be { lat, lng } from frontend
    amenities,
    monthlySubscriptionFee,
  } = req.body;

  try {
    const existingGym = await Gym.findOne({ ownerId: req.user._id });
    if (existingGym) {
      return res
        .status(400)
        .json({ message: "You already have a gym profile registered" });
    }

    // Format location to GeoJSON
    let geoJsonLocation = undefined;
    if (location && location.lat && location.lng) {
      geoJsonLocation = {
        type: "Point",
        coordinates: [Number(location.lng), Number(location.lat)],
      };
    }

    const gym = await Gym.create({
      ownerId: req.user._id,
      name,
      description,
      address,
      location: geoJsonLocation,
      images: req.body.images || [], // Handle cloud proxy image urls if passed
      amenities,
      monthlySubscriptionFee,
    });

    res.status(201).json(gym);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a gym profile
// @route   PUT /api/gyms/:id
// @access  Private/GymOwner
const updateGym = async (req, res) => {
  try {
    const gym = await Gym.findById(req.params.id);

    if (!gym) {
      return res.status(404).json({ message: "Gym not found" });
    }

    // Ensure the user owns this gym OR is a SUPER_ADMIN
    if (
      gym.ownerId.toString() !== req.user._id.toString() &&
      req.user.role !== "SUPER_ADMIN"
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this gym" });
    }

    const {
      name,
      description,
      address,
      location, // expected to be { lat, lng } from frontend
      amenities,
      monthlySubscriptionFee,
      images,
    } = req.body;

    // Format location to GeoJSON if provided
    let geoJsonLocation = gym.location; // keep existing if not provided
    if (location && location.lat && location.lng) {
      geoJsonLocation = {
        type: "Point",
        coordinates: [Number(location.lng), Number(location.lat)],
      };
    }

    gym.name = name || gym.name;
    gym.description = description || gym.description;
    gym.address = address || gym.address;
    gym.location = geoJsonLocation;
    gym.amenities = amenities || gym.amenities;
    gym.monthlySubscriptionFee =
      monthlySubscriptionFee || gym.monthlySubscriptionFee;

    if (images) {
      gym.images = images;
    }

    const updatedGym = await gym.save();
    res.json(updatedGym);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Owner's Gym
// @route   GET /api/gyms/mygym
// @access  Private/GymOwner
const getMyGym = async (req, res) => {
  try {
    const gym = await Gym.findOne({ ownerId: req.user._id });
    if (gym) {
      res.json(gym);
    } else {
      res.status(404).json({ message: "No gym found for this owner" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve/Reject Gym
// @route   PUT /api/gyms/:id/status
// @access  Private/SuperAdmin
const updateGymStatus = async (req, res) => {
  const { status } = req.body;

  try {
    const gym = await Gym.findById(req.params.id);

    if (gym) {
      gym.status = status;
      const updatedGym = await gym.save();
      res.json(updatedGym);
    } else {
      res.status(404).json({ message: "Gym not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Get pending gyms
// @route   GET /api/gyms/admin/pending
// @access Private/SuperAdmin
const getPendingGyms = async (req, res) => {
  try {
    const gyms = await Gym.find({ status: "PENDING" });
    res.json(gyms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload Gym Images to Cloudinary
// @route   POST /api/gyms/upload
// @access  Private/GymOwner
const uploadGymImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No images provided" });
    }

    // Extract Cloudinary URLs from multer-storage-cloudinary
    const imageUrls = req.files.map((file) => file.path);

    res.status(200).json({ urls: imageUrls });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error uploading images", error: error.message });
  }
};

// @desc    Get all gyms
// @route   GET /api/gyms/admin/all
// @access  Private/SuperAdmin
const getAllGymsAdmin = async (req, res) => {
  try {
    const gyms = await Gym.find().sort({ createdAt: -1 });
    res.json(gyms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Dashboard Statistics
// @route   GET /api/gyms/admin/stats
// @access  Private/SuperAdmin
const getDashboardStats = async (req, res) => {
  try {
    const totalGyms = await Gym.countDocuments();
    const pendingGyms = await Gym.countDocuments({ status: "PENDING" });
    const approvedGyms = await Gym.countDocuments({ status: "APPROVED" });

    const totalUsers = await User.countDocuments();
    const gymOwners = await User.countDocuments({ role: "GYM_OWNER" });
    const regularUsers = await User.countDocuments({ role: "USER" });

    const activeMemberships = await Membership.countDocuments({
      status: "ACTIVE",
    });

    res.json({
      totalGyms,
      pendingGyms,
      approvedGyms,
      totalUsers,
      gymOwners,
      regularUsers,
      activeMemberships,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getGyms,
  getGymById,
  createGym,
  updateGym,
  getMyGym,
  updateGymStatus,
  getPendingGyms,
  uploadGymImages,
  getAllGymsAdmin,
  getDashboardStats,
};
