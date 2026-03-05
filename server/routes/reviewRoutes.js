const express = require("express");
const router = express.Router();
const { addReview, getGymReviews } = require("../controllers/reviewController");
const { protect } = require("../middlewares/authMiddleware");

// Add a review (requires authentication and previous membership)
router.post("/", protect, addReview);

// Get all reviews for a gym (public)
router.get("/gym/:gymId", getGymReviews);

module.exports = router;
