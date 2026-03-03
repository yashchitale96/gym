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

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("MongoDB Connection Error:", err));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/gyms", gymRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/memberships", membershipRoutes);
app.use("/api/attendance", attendanceRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Gym API is running" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
