import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { CheckCircle2, Zap, Crown, Star } from "lucide-react";
import api from "../utils/api";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { y: 30, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

const PricingPage = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data } = await api.get("/subscriptions/plans");
        setPlans(data);
      } catch {
        // Fallback static plans if API fails
        setPlans([
          {
            _id: "1",
            name: "Starter",
            price: 999,
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
            _id: "2",
            name: "Growth",
            price: 1999,
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
            _id: "3",
            name: "Pro",
            price: 4999,
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
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const planIcons = {
    Starter: Zap,
    Growth: Crown,
    Pro: Star,
  };

  const planAccents = {
    Starter: "from-blue-500/20 to-cyan-500/20",
    Growth: "from-primary/20 to-rose-500/20",
    Pro: "from-purple-500/20 to-violet-500/20",
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] py-20 px-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[150px] -z-10 pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px] -z-10 pointer-events-none"></div>

      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium tracking-wide inline-block mb-6">
            Simple, Transparent Pricing
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Grow Your Gym with <span className="text-gradient">FitFind</span>
          </h1>
          <p className="text-xl text-foreground/60 max-w-2xl mx-auto">
            Choose the plan that fits your gym. Start managing members, tracking
            revenue, and growing your business today.
          </p>
        </motion.div>

        {/* Plans Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {plans.map((plan) => {
              const Icon = planIcons[plan.name] || Zap;
              const accent = planAccents[plan.name] || planAccents.Starter;
              const isPopular = plan.name === "Growth";

              return (
                <motion.div
                  key={plan._id}
                  variants={itemVariants}
                  whileHover={{ y: -8, transition: { duration: 0.2 } }}
                  className={`relative bg-card/80 backdrop-blur-xl border rounded-3xl p-8 flex flex-col transition-shadow duration-300
                    ${isPopular ? "border-primary/50 ring-2 ring-primary/20 shadow-2xl shadow-primary/10" : "border-border hover:shadow-xl"}`}
                >
                  {/* Popular Badge */}
                  {isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-6 py-1.5 rounded-full shadow-lg shadow-primary/30">
                      MOST POPULAR
                    </div>
                  )}

                  {/* Gradient Glow */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${accent} rounded-3xl opacity-0 hover:opacity-100 transition-opacity duration-500 -z-10`}
                  ></div>

                  {/* Plan Header */}
                  <div className="flex items-center gap-3 mb-6">
                    <div
                      className={`h-12 w-12 rounded-2xl flex items-center justify-center ${isPopular ? "bg-primary/20 text-primary" : "bg-zinc-800 text-foreground/60"}`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{plan.name}</h3>
                      <p className="text-xs text-foreground/50">
                        {plan.maxMembers === -1
                          ? "Unlimited everything"
                          : `Up to ${plan.maxMembers} members`}
                      </p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-8">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold">
                        ₹{plan.price.toLocaleString("en-IN")}
                      </span>
                      <span className="text-foreground/50 text-sm">/month</span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-3 mb-8 flex-1">
                    {plan.features?.map((feature, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 text-sm text-foreground/80"
                      >
                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <Link
                    to="/register"
                    className={`w-full py-3.5 rounded-2xl font-semibold text-center transition-all duration-300 block
                      ${
                        isPopular
                          ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30"
                          : "bg-zinc-800 text-foreground hover:bg-zinc-700 border border-border"
                      }`}
                  >
                    Get Started
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center mt-16"
        >
          <p className="text-foreground/50 text-sm">
            All plans include a 7-day free trial. No credit card required to
            start.
          </p>
          <p className="text-foreground/50 text-sm mt-2">
            Need a custom plan?{" "}
            <a
              href="mailto:support@fitfind.com"
              className="text-primary hover:underline"
            >
              Contact us
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default PricingPage;
