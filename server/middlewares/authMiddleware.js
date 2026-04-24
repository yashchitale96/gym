const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select("-password");
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Role ${req.user?.role} is not authorized to access this route`,
      });
    }
    next();
  };
};

/**
 * checkPermission - Fine-grained permission middleware.
 * GYM_OWNER and SUPER_ADMIN bypass all checks (full access).
 * STAFF users are checked against their permissions array.
 * Other roles pass through (their access is controlled by authorize).
 */
const checkPermission = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    // Owners and super admins have all permissions
    if (["GYM_OWNER", "SUPER_ADMIN"].includes(req.user.role)) {
      return next();
    }

    // STAFF must have at least one of the required permissions
    if (req.user.role === "STAFF") {
      const userPerms = req.user.permissions || [];
      const hasPermission = requiredPermissions.some((perm) =>
        userPerms.includes(perm),
      );

      if (!hasPermission) {
        return res.status(403).json({
          message: "You do not have permission to perform this action",
          code: "PERMISSION_DENIED",
          required: requiredPermissions,
        });
      }
    }

    next();
  };
};

module.exports = { protect, authorize, checkPermission };
