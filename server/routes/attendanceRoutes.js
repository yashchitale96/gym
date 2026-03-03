const express = require("express");
const router = express.Router();
const {
  markAttendance,
  getGymAttendance,
  getUserAttendance,
} = require("../controllers/attendanceController");
const { protect, authorize } = require("../middlewares/authMiddleware");

router.get("/my", protect, getUserAttendance);

router.post(
  "/scan",
  protect,
  authorize("GYM_OWNER", "SUPER_ADMIN"),
  markAttendance,
);
router.get(
  "/gym/:gymId",
  protect,
  authorize("GYM_OWNER", "SUPER_ADMIN"),
  getGymAttendance,
);

module.exports = router;
