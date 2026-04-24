const express = require("express");
const router = express.Router();
const {
  createOrder,
  verifyPayment,
  getMyMemberships,
  getMyPayments,
  getGymMembers,
  getGymRevenue,
} = require("../controllers/membershipController");
const {
  protect,
  authorize,
  checkPermission,
} = require("../middlewares/authMiddleware");

router.post("/checkout", protect, createOrder);
router.post("/verify", protect, verifyPayment);
router.get("/my", protect, getMyMemberships);
router.get("/payments", protect, getMyPayments);
router.get(
  "/gym/:gymId",
  protect,
  authorize("GYM_OWNER", "SUPER_ADMIN", "STAFF"),
  checkPermission("manage_members"),
  getGymMembers,
);
router.get(
  "/gym/:gymId/revenue",
  protect,
  authorize("GYM_OWNER", "SUPER_ADMIN", "STAFF"),
  checkPermission("view_payments"),
  getGymRevenue,
);

module.exports = router;
