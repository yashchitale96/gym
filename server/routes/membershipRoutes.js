const express = require("express");
const router = express.Router();
const {
  createOrder,
  verifyPayment,
  getMyMemberships,
} = require("../controllers/membershipController");
const { protect } = require("../middlewares/authMiddleware");

router.post("/checkout", protect, createOrder);
router.post("/verify", protect, verifyPayment);
router.get("/my", protect, getMyMemberships);

module.exports = router;
