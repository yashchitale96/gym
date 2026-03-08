const express = require("express");
const router = express.Router();
const {
  getSaaSPlans,
  createSubscriptionOrder,
  verifySubscriptionPayment,
  getMySubscription,
  getAllSubscriptions,
  cancelSubscription,
  getSubscriptionStats,
} = require("../controllers/subscriptionController");
const { protect, authorize } = require("../middlewares/authMiddleware");

// Public
router.get("/plans", getSaaSPlans);

// GYM_OWNER
router.post(
  "/checkout",
  protect,
  authorize("GYM_OWNER"),
  createSubscriptionOrder,
);
router.post(
  "/verify",
  protect,
  authorize("GYM_OWNER"),
  verifySubscriptionPayment,
);
router.get("/my", protect, authorize("GYM_OWNER"), getMySubscription);
router.put("/:id/cancel", protect, authorize("GYM_OWNER"), cancelSubscription);

// SUPER_ADMIN
router.get(
  "/admin/all",
  protect,
  authorize("SUPER_ADMIN"),
  getAllSubscriptions,
);
router.get(
  "/admin/stats",
  protect,
  authorize("SUPER_ADMIN"),
  getSubscriptionStats,
);

module.exports = router;
