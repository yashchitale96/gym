const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
  getAllUsers,
} = require("../controllers/authController");
const { protect, authorize } = require("../middlewares/authMiddleware");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.route("/profile").get(protect, getUserProfile);
router
  .route("/admin/users")
  .get(protect, authorize("SUPER_ADMIN"), getAllUsers);

module.exports = router;
