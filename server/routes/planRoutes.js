const express = require("express");
const router = express.Router();
const {
  createPlan,
  getGymPlans,
  updatePlan,
} = require("../controllers/planController");
const {
  protect,
  authorize,
  checkPermission,
} = require("../middlewares/authMiddleware");

router
  .route("/")
  .post(
    protect,
    authorize("GYM_OWNER", "STAFF"),
    checkPermission("manage_plans"),
    createPlan,
  );

router.route("/gym/:gymId").get(getGymPlans);

router
  .route("/:id")
  .put(
    protect,
    authorize("GYM_OWNER", "STAFF"),
    checkPermission("manage_plans"),
    updatePlan,
  );

module.exports = router;
