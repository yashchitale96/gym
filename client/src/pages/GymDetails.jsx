import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/api";
import toast from "react-hot-toast";
import { MapPin, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const GymDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [gym, setGym] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    const fetchGymData = async () => {
      try {
        const gymRes = await api.get(`/gyms/${id}`);
        setGym(gymRes.data);

        const plansRes = await api.get(`/plans/gym/${id}`);
        setPlans(plansRes.data);
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to load details");
      } finally {
        setLoading(false);
      }
    };

    fetchGymData();
  }, [id]);

  const handleCheckout = async (planId) => {
    if (!user) {
      toast.error("Please login to purchase a membership");
      navigate("/login");
      return;
    }

    setProcessingPayment(true);
    try {
      // 1. Create Order
      const { data: order } = await api.post("/memberships/checkout", {
        planId,
        gymId: id,
      });

      if (order.isMock) {
        // Bypass Razorpay UI for testing without keys
        toast.success("Test Mode: Simulating payment...");
        await api.post("/memberships/verify", {
          razorpay_order_id: order.id,
          razorpay_payment_id: "mock_payment_id",
          razorpay_signature: "mock_signature",
          planId,
          gymId: id,
        });
        toast.success("Payment successful! Membership activated.");
        navigate("/dashboard");
        return;
      }

      // If we reach here, we must have valid keys. Let's make sure the client key isn't 'test_key'
      const checkKey = import.meta.env.VITE_RAZORPAY_KEY_ID || "test_key";
      if (checkKey === "test_key") {
        toast.error(
          "VITE_RAZORPAY_KEY_ID is missing from frontend .env. Cannot load checkout.",
        );
        setProcessingPayment(false);
        return;
      }

      // 2. Initialize Razorpay
      const options = {
        key: checkKey,
        amount: order.amount,
        currency: order.currency,
        name: gym.name,
        description: "Gym Membership Purchase",
        order_id: order.id,
        handler: async function (response) {
          try {
            const verifyData = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planId,
              gymId: id,
            };

            await api.post("/memberships/verify", verifyData);
            toast.success("Payment successful! Membership activated.");
            navigate("/dashboard");
          } catch (error) {
            toast.error(
              error.response?.data?.message || "Payment verification failed",
            );
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phone,
        },
        theme: { color: "#e11d48" },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
        toast.error(`Payment Failed: ${response.error.description}`);
      });
      rzp.open();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Payment initialization failed",
      );
    } finally {
      setProcessingPayment(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  if (!gym) return <div className="text-center p-12">Gym not found.</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="h-64 sm:h-96 w-full rounded-3xl overflow-hidden bg-zinc-800 relative shadow-2xl">
        {gym.images && gym.images[0] ? (
          <img
            src={gym.images[0]}
            alt={gym.name}
            className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-600">
            No Image provided.
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent"></div>
        <div className="absolute bottom-8 left-8 right-8">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-3 tracking-tight drop-shadow-lg">
            {gym.name}
          </h1>
          <div className="flex items-center text-gray-200 text-lg">
            <MapPin className="h-5 w-5 mr-2 text-primary" />
            <span>{gym.address}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <section className="glass-card p-8 rounded-2xl border border-white/5 shadow-lg">
            <h2 className="text-3xl font-bold mb-4 border-b border-white/5 pb-4">
              About <span className="text-primary">{gym.name}</span>
            </h2>
            <p className="text-foreground/80 leading-relaxed text-lg">
              {gym.description}
            </p>
          </section>

          <section className="glass-card p-8 rounded-2xl border border-white/5 shadow-lg">
            <h2 className="text-3xl font-bold mb-4 border-b border-white/5 pb-4">
              Amenities
            </h2>
            {gym.amenities && gym.amenities.length > 0 ? (
              <ul className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {gym.amenities.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-center text-foreground/80"
                  >
                    <CheckCircle2 className="h-4 w-4 text-primary mr-2" />
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-foreground/60 italic">No amenities listed.</p>
            )}
          </section>
        </div>

        <div className="space-y-6 relative">
          <div className="absolute inset-0 bg-primary/5 blur-[100px] rounded-full -z-10 pointer-events-none"></div>
          <h3 className="text-3xl font-bold tracking-tight">
            Membership <span className="text-gradient">Plans</span>
          </h3>
          {plans.length === 0 ? (
            <div className="glass-card p-6 rounded-2xl border border-white/5 text-center text-foreground/60 flex items-center justify-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" /> No active plans
              available yet.
            </div>
          ) : (
            plans.map((plan) => (
              <div
                key={plan._id}
                className="glass-card p-8 rounded-2xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center"
              >
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <h4 className="text-2xl font-bold mb-2">{plan.name}</h4>
                <div className="text-4xl font-extrabold text-primary mb-2 drop-shadow-sm">
                  ₹{plan.price}
                </div>
                <p className="text-sm font-medium text-foreground/60 mb-6 px-4 py-1 bg-white/5 rounded-full">
                  {plan.durationInDays} days access
                </p>
                {plan.description && (
                  <p className="text-base text-foreground/80 mb-8 max-w-xs mx-auto">
                    {plan.description}
                  </p>
                )}
                <button
                  onClick={() => handleCheckout(plan._id)}
                  disabled={processingPayment}
                  className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold text-lg hover:shadow-[0_0_20px_rgba(225,29,72,0.4)] disabled:hover:shadow-none hover:bg-primary/90 transition-all duration-300 disabled:opacity-50 mt-auto"
                >
                  {processingPayment ? "Processing..." : "Buy Now"}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default GymDetails;
