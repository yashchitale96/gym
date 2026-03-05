const Review = require("../models/Review");
const Gym = require("../models/Gym");
const Membership = require("../models/Membership");

// @desc    Add a review for a gym
// @route   POST /api/reviews
// @access  Private (User/Trainer/Owner)
exports.addReview = async (req, res) => {
  try {
    const { gymId, rating, comment } = req.body;
    const userId = req.user._id;

    // 1. Validate if user has an active or past membership with this gym
    const membership = await Membership.findOne({ userId, gymId });
    if (!membership) {
      return res.status(403).json({
        message: "You can only review gyms where you have/had a membership.",
      });
    }

    // 2. Check if a review already exists
    const existingReview = await Review.findOne({ userId, gymId });
    if (existingReview) {
      // Could also allow updating an existing review here, but let's restrict to one
      return res.status(400).json({
        message: "You have already reviewed this gym.",
      });
    }

    // 3. Create the review
    const review = await Review.create({
      userId,
      gymId,
      rating: Number(rating),
      comment,
    });

    // 4. Recalculate average rating for the Gym
    const reviews = await Review.find({ gymId });
    const count = reviews.length;
    const sum = reviews.reduce((acc, curr) => acc + curr.rating, 0);
    const average = count === 0 ? 0 : Number((sum / count).toFixed(1));

    // Update gym
    await Gym.findByIdAndUpdate(gymId, {
      ratings: {
        average,
        count,
      },
    });

    res.status(201).json(review);
  } catch (error) {
    console.error("Error adding review:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Get all reviews for a specific gym
// @route   GET /api/reviews/gym/:gymId
// @access  Public
exports.getGymReviews = async (req, res) => {
  try {
    const { gymId } = req.params;
    const reviews = await Review.find({ gymId })
      .populate("userId", "name avatar") // Assuming you might have avatars, or just 'name'
      .sort("-createdAt");

    res.json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
