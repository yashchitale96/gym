const mongoose = require("mongoose");
const User = require("./models/User");
const SaaSPlan = require("./models/SaaSPlan");
const dotenv = require("dotenv");

dotenv.config();

const seedSaaSPlans = async () => {
  const plans = [
    {
      name: "Starter",
      price: 999,
      durationInDays: 30,
      maxMembers: 100,
      maxTrainers: 2,
      features: [
        "1 Gym Branch",
        "Up to 100 Members",
        "Up to 2 Trainers",
        "QR Check-in",
        "Basic Analytics",
        "Email Support",
      ],
    },
    {
      name: "Growth",
      price: 1999,
      durationInDays: 30,
      maxMembers: 500,
      maxTrainers: 10,
      features: [
        "1 Gym Branch",
        "Up to 500 Members",
        "Up to 10 Trainers",
        "QR Check-in",
        "Advanced Analytics",
        "Member Management",
        "Revenue Reports",
        "Priority Support",
      ],
    },
    {
      name: "Pro",
      price: 4999,
      durationInDays: 30,
      maxMembers: -1,
      maxTrainers: -1,
      features: [
        "Multi-Branch Support",
        "Unlimited Members",
        "Unlimited Trainers",
        "QR Check-in",
        "Advanced Analytics",
        "Member Management",
        "Revenue Reports",
        "Expense Tracking",
        "Dedicated Support",
        "Custom Branding",
      ],
    },
  ];

  for (const plan of plans) {
    const exists = await SaaSPlan.findOne({ name: plan.name });
    if (!exists) {
      await SaaSPlan.create(plan);
      console.log(`SaaS Plan created: ${plan.name} (₹${plan.price}/mo)`);
    } else {
      console.log(`SaaS Plan already exists: ${plan.name}`);
    }
  }
};

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB Connected...");

    const adminExists = await User.findOne({ email: "admin@fitfind.com" });
    if (adminExists) {
      console.log(
        "Admin already exists! You can log in with your existing admin credentials.",
      );
    } else {
      await User.create({
        name: "Super Admin",
        email: "admin@fitfind.com",
        phone: "9999999999",
        location: {
          type: "Point",
          coordinates: [77.1009, 28.7042],
        },
        password: "adminpassword",
        role: "SUPER_ADMIN",
      });

      console.log("=================================");
      console.log("Super Admin Created Successfully!");
      console.log("Email: admin@fitfind.com");
      console.log("Password: adminpassword");
      console.log("=================================");
    }

    // Seed SaaS Plans
    console.log("\nSeeding SaaS Plans...");
    await seedSaaSPlans();
    console.log("SaaS Plans seeding complete!\n");

    process.exit();
  } catch (error) {
    console.error("Error seeding:", error);
    process.exit(1);
  }
};

seedAdmin();
