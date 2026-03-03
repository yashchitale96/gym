const Gym = require("../models/Gym");

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

module.exports = {
  getGyms,
  getGymById,
  createGym,
  getMyGym,
  updateGymStatus,
  getPendingGyms,
  uploadGymImages,
};
