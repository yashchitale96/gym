const express = require("express");
const router = express.Router();
const {
  markAttendance,
  getGymAttendance,
  getUserAttendance,
  getUserStats,
} = require("../controllers/attendanceController");
const {
  protect,
  authorize,
  checkPermission,
} = require("../middlewares/authMiddleware");

router.get("/my", protect, getUserAttendance);
router.get("/stats", protect, getUserStats);

router.post(
  "/scan",
  protect,
  authorize("GYM_OWNER", "SUPER_ADMIN", "STAFF"),
  checkPermission("manage_members"),
  markAttendance,
);
router.get(
  "/gym/:gymId",
  protect,
  authorize("GYM_OWNER", "SUPER_ADMIN", "STAFF"),
  checkPermission("manage_members"),
  getGymAttendance,
);

module.exports = router;
