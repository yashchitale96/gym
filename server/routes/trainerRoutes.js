const express = require("express");
const router = express.Router();
const {
  addTrainer,
  getTrainersForGym,
  assignTrainerToMember,
  getAssignedMembers,
} = require("../controllers/trainerController");
const { protect, authorize } = require("../middlewares/authMiddleware");
const {
  checkSubscription,
  checkTrainerLimit,
} = require("../middlewares/subscriptionMiddleware");

// Owner Routes
router
  .route("/")
  .post(
    protect,
    authorize("GYM_OWNER"),
    checkSubscription,
    checkTrainerLimit,
    addTrainer,
  )
  .get(protect, authorize("GYM_OWNER"), getTrainersForGym);

router
  .route("/assign/:membershipId")
  .put(protect, authorize("GYM_OWNER"), assignTrainerToMember);

// Trainer Routes
router
  .route("/my-members")
  .get(protect, authorize("TRAINER"), getAssignedMembers);

module.exports = router;
