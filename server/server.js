const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

// Route Imports
const authRoutes = require("./routes/authRoutes");
const gymRoutes = require("./routes/gymRoutes");
const planRoutes = require("./routes/planRoutes");
const membershipRoutes = require("./routes/membershipRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const trainerRoutes = require("./routes/trainerRoutes");

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection module
const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB Connected");
  } catch (error) {
    console.log("MongoDB Connection Error:", error);
    throw error;
  }
};

// Database connection middleware
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    res
      .status(500)
      .json({ status: "Error", message: "Database connection failed" });
  }
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/gyms", gymRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/memberships", membershipRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/trainers", trainerRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    mongooseReadyState: mongoose.connection.readyState,
    message: "Gym API is running",
  });
});

// Start server (only required for local dev, Vercel will export 'app')
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
