const mongoose = require("mongoose");
const User = require("./models/User");
const dotenv = require("dotenv");

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB Connected...");

    const adminExists = await User.findOne({ email: "admin@fitfind.com" });
    if (adminExists) {
      console.log(
        "Admin already exists! You can log in with your existing admin credentials.",
      );
      process.exit();
    }

    await User.create({
      name: "Super Admin",
      email: "admin@fitfind.com",
      phone: "9999999999",
      location: {
        type: "Point",
        coordinates: [77.1009, 28.7042], // lng, lat
      },
      password: "adminpassword",
      role: "SUPER_ADMIN",
    });

    console.log("=================================");
    console.log("Super Admin Created Successfully!");
    console.log("Email: admin@fitfind.com");
    console.log("Password: adminpassword");
    console.log("=================================");

    process.exit();
  } catch (error) {
    console.error("Error creating admin:", error);
    process.exit(1);
  }
};

seedAdmin();
