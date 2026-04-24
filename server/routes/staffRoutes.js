const express = require("express");
const router = express.Router();
const {
  addStaff,
  getStaff,
  updateStaffPermissions,
  removeStaff,
  getPermissionsList,
} = require("../controllers/staffController");
const { protect, authorize } = require("../middlewares/authMiddleware");

// All routes require GYM_OWNER role
router.get("/permissions", protect, authorize("GYM_OWNER"), getPermissionsList);
router
  .route("/")
  .post(protect, authorize("GYM_OWNER"), addStaff)
  .get(protect, authorize("GYM_OWNER"), getStaff);

router.put(
  "/:id/permissions",
  protect,
  authorize("GYM_OWNER"),
  updateStaffPermissions,
);
router.delete("/:id", protect, authorize("GYM_OWNER"), removeStaff);

module.exports = router;
