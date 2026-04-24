const express = require("express");
const router = express.Router();
const {
  addTrainer,
  getTrainersForGym,
  assignTrainerToMember,
  getAssignedMembers,
} = require("../controllers/trainerController");
const {
  protect,
  authorize,
  checkPermission,
} = require("../middlewares/authMiddleware");
const {
  checkSubscription,
  checkTrainerLimit,
} = require("../middlewares/subscriptionMiddleware");

// Owner / Staff Routes
router
  .route("/")
  .post(
    protect,
    authorize("GYM_OWNER"),
    checkSubscription,
    checkTrainerLimit,
    addTrainer,
  )
  .get(
    protect,
    authorize("GYM_OWNER", "STAFF"),
    checkPermission("manage_trainers"),
    getTrainersForGym,
  );

router
  .route("/assign/:membershipId")
  .put(
    protect,
    authorize("GYM_OWNER", "STAFF"),
    checkPermission("manage_trainers"),
    assignTrainerToMember,
  );

// Trainer Routes
router
  .route("/my-members")
  .get(protect, authorize("TRAINER"), getAssignedMembers);

module.exports = router;
