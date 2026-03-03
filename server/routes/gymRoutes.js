const express = require("express");
const router = express.Router();
const { upload } = require("../config/cloudinary");
const {
  getGyms,
  getGymById,
  createGym,
  updateGym,
  getMyGym,
  updateGymStatus,
  getPendingGyms,
  uploadGymImages,
} = require("../controllers/gymController");
const { protect, authorize } = require("../middlewares/authMiddleware");

router.route("/").get(getGyms).post(protect, authorize("GYM_OWNER"), createGym);

router.post(
  "/upload",
  protect,
  authorize("GYM_OWNER"),
  upload.array("images", 5),
  uploadGymImages,
);

router.route("/mygym").get(protect, authorize("GYM_OWNER"), getMyGym);
router
  .route("/admin/pending")
  .get(protect, authorize("SUPER_ADMIN"), getPendingGyms);

router
  .route("/:id")
  .get(getGymById)
  .put(protect, authorize("GYM_OWNER", "SUPER_ADMIN"), updateGym);

router
  .route("/:id/status")
  .put(protect, authorize("SUPER_ADMIN"), updateGymStatus);

module.exports = router;
