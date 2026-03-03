import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Dumbbell, MapPin, Zap, Star } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

const Home = () => {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="relative flex-1 flex flex-col items-center justify-center text-center px-4 py-20 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-4xl mx-auto space-y-8"
        >
          <motion.div variants={itemVariants} className="inline-block">
            <span className="px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium tracking-wide">
              Revolutionizing Fitness Discovery
            </span>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-5xl md:text-7xl font-extrabold tracking-tight"
          >
            Find Your <span className="text-gradient">Perfect Gym</span>{" "}
            Anywhere
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-xl md:text-2xl text-foreground/70 max-w-2xl mx-auto font-light leading-relaxed"
          >
            Connect with top-rated gyms, book sessions seamlessly, and track
            your fitness journey all in one place.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <Link
              to="/gyms"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-primary text-primary-foreground font-semibold text-lg hover:shadow-[0_0_30px_rgba(225,29,72,0.4)] hover:-translate-y-1 transition-all duration-300"
            >
              Discover Gyms
            </Link>
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-4 rounded-full glass border border-white/10 text-foreground font-semibold text-lg hover:bg-white/5 transition-all duration-300"
            >
              Join as a Partner
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 bg-black/40 relative">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose FitFind?
            </h2>
            <p className="text-foreground/60 max-w-2xl mx-auto">
              We provide the best tools to help you stay committed to your
              fitness goals, no matter where life takes you.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ y: -5 }}
              className="glass-card p-8 rounded-2xl flex flex-col items-center text-center space-y-4"
            >
              <div className="h-14 w-14 rounded-2xl bg-primary/20 flex items-center justify-center text-primary mb-2">
                <MapPin className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold">Location Based</h3>
              <p className="text-foreground/60">
                Find the best gyms near you instantly with our advanced search
                and filtering.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ y: -5 }}
              className="glass-card p-8 rounded-2xl flex flex-col items-center text-center space-y-4 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none"></div>
              <div className="h-14 w-14 rounded-2xl bg-primary/20 flex items-center justify-center text-primary mb-2 z-10">
                <Zap className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold z-10">Seamless Booking</h3>
              <p className="text-foreground/60 z-10">
                Book day passes or long-term memberships with just a few taps.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ y: -5 }}
              className="glass-card p-8 rounded-2xl flex flex-col items-center text-center space-y-4"
            >
              <div className="h-14 w-14 rounded-2xl bg-primary/20 flex items-center justify-center text-primary mb-2">
                <Star className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold">Verified Reviews</h3>
              <p className="text-foreground/60">
                Read honest reviews from real members before making a
                commitment.
              </p>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
