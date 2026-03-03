const express = require("express");
const router = express.Router();
const {
  getGyms,
  getGymById,
  createGym,
  getMyGym,
  updateGymStatus,
  getPendingGyms,
} = require("../controllers/gymController");
const { protect, authorize } = require("../middlewares/authMiddleware");

router.route("/").get(getGyms).post(protect, authorize("GYM_OWNER"), createGym);

router.route("/mygym").get(protect, authorize("GYM_OWNER"), getMyGym);
router
  .route("/admin/pending")
  .get(protect, authorize("SUPER_ADMIN"), getPendingGyms);

router.route("/:id").get(getGymById);

router
  .route("/:id/status")
  .put(protect, authorize("SUPER_ADMIN"), updateGymStatus);

module.exports = router;
