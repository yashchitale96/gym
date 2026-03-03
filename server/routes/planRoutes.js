const express = require("express");
const router = express.Router();
const {
  createPlan,
  getGymPlans,
  updatePlan,
} = require("../controllers/planController");
const { protect, authorize } = require("../middlewares/authMiddleware");

router.route("/").post(protect, authorize("GYM_OWNER"), createPlan);

router.route("/gym/:gymId").get(getGymPlans);

router.route("/:id").put(protect, authorize("GYM_OWNER"), updatePlan);

module.exports = router;
