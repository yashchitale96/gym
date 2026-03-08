import React, { useState, useEffect } from "react";
import api from "../utils/api";
import toast from "react-hot-toast";
import {
  CreditCard,
  Crown,
  AlertTriangle,
  CheckCircle2,
  Users,
  UserCheck,
  Zap,
  X,
  ArrowUpRight,
} from "lucide-react";

const SubscriptionTab = ({ gym }) => {
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [memberCount, setMemberCount] = useState(0);
  const [trainerCount, setTrainerCount] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch SaaS plans
      const { data: plansData } = await api.get("/subscriptions/plans");
      setPlans(plansData);

      // Fetch current subscription
      try {
        const { data: subData } = await api.get("/subscriptions/my");
        setSubscription(subData);
      } catch {
        setSubscription(null);
      }

      // Fetch usage counts
      if (gym) {
        try {
          const { data: members } = await api.get(
            `/memberships/gym/${gym._id}`,
          );
          const activeMembers = members.filter(
            (m) => m.status === "ACTIVE" && new Date(m.endDate) > new Date(),
          );
          setMemberCount(activeMembers.length);
        } catch {
          setMemberCount(0);
        }

        try {
          const { data: trainers } = await api.get("/trainers");
          setTrainerCount(trainers.length);
        } catch {
          setTrainerCount(0);
        }
      }
    } catch {
      toast.error("Failed to load subscription data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (saasPlanId) => {
    setProcessing(true);
    try {
      // Step 1: Create order
      const { data: order } = await api.post("/subscriptions/checkout", {
        saasPlanId,
      });

      if (order.isMock) {
        // Mock payment flow
        const { data: result } = await api.post("/subscriptions/verify", {
          razorpay_order_id: order.id,
          razorpay_payment_id: `mock_pay_${Date.now()}`,
          razorpay_signature: "mock_signature",
          saasPlanId,
        });
        toast.success(result.message);
        setSubscription(result.subscription);
        fetchData();
        return;
      }

      // Real Razorpay checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "FitFind SaaS",
        description: "Platform Subscription",
        order_id: order.id,
        handler: async (response) => {
          try {
            const { data: result } = await api.post("/subscriptions/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              saasPlanId,
            });
            toast.success(result.message);
            setSubscription(result.subscription);
            fetchData();
          } catch (error) {
            toast.error(
              error.response?.data?.message || "Payment verification failed",
            );
          }
        },
        theme: { color: "#e11d48" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      toast.error(error.response?.data?.message || "Payment failed");
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (
      !window.confirm(
        "Are you sure you want to cancel your subscription? Your features will remain active until the end date.",
      )
    ) {
      return;
    }

    try {
      await api.put(`/subscriptions/${subscription._id}/cancel`);
      toast.success("Subscription cancelled");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to cancel");
    }
  };

  const daysRemaining = subscription
    ? Math.max(
        0,
        Math.ceil(
          (new Date(subscription.endDate) - new Date()) / (1000 * 60 * 60 * 24),
        ),
      )
    : 0;

  const isExpiringSoon = daysRemaining > 0 && daysRemaining <= 5;
  const isExpired =
    subscription && new Date(subscription.endDate) <= new Date();

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Current Subscription Status */}
      {subscription && subscription.status === "ACTIVE" && !isExpired ? (
        <div
          className={`bg-card border rounded-xl p-6 ${isExpiringSoon ? "border-yellow-500/30" : "border-border"}`}
        >
          {isExpiringSoon && (
            <div className="flex items-center gap-2 text-yellow-500 text-sm font-medium mb-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-4 py-2">
              <AlertTriangle className="h-4 w-4" />
              Your subscription expires in {daysRemaining} day
              {daysRemaining !== 1 ? "s" : ""}. Renew now to avoid interruption.
            </div>
          )}

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Crown className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold">
                  {subscription.saasPlanId?.name || "Active"} Plan
                </h2>
                <span className="bg-green-500/10 text-green-500 border border-green-500/20 text-xs font-bold px-2.5 py-1 rounded-full">
                  ACTIVE
                </span>
              </div>
              <p className="text-foreground/60 text-sm">
                ₹{subscription.amount}/month • Renews on{" "}
                {new Date(subscription.endDate).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            <button
              onClick={handleCancel}
              className="text-red-400 hover:text-red-300 text-sm font-medium border border-red-500/20 px-4 py-2 rounded-lg hover:bg-red-500/10 transition-colors flex items-center gap-1.5"
            >
              <X className="h-3.5 w-3.5" />
              Cancel
            </button>
          </div>

          {/* Usage Bars */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-border">
            <UsageBar
              label="Members"
              icon={Users}
              current={memberCount}
              max={subscription.saasPlanId?.maxMembers}
            />
            <UsageBar
              label="Trainers"
              icon={UserCheck}
              current={trainerCount}
              max={subscription.saasPlanId?.maxTrainers}
            />
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <CreditCard className="h-12 w-12 mx-auto text-foreground/30 mb-4" />
          <h2 className="text-xl font-bold mb-2">No Active Subscription</h2>
          <p className="text-foreground/60 max-w-md mx-auto">
            Subscribe to a plan to unlock all gym management features including
            member management, analytics, and more.
          </p>
        </div>
      )}

      {/* Available Plans */}
      <div>
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          {subscription && subscription.status === "ACTIVE" && !isExpired
            ? "Upgrade Your Plan"
            : "Choose a Plan"}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrentPlan =
              subscription?.saasPlanId?._id === plan._id &&
              subscription?.status === "ACTIVE" &&
              !isExpired;

            return (
              <div
                key={plan._id}
                className={`relative bg-card border rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl
                  ${plan.name === "Growth" ? "border-primary/50 ring-1 ring-primary/20" : "border-border"}
                  ${isCurrentPlan ? "opacity-60" : ""}`}
              >
                {plan.name === "Growth" && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full">
                    POPULAR
                  </div>
                )}

                <h4 className="text-lg font-bold mb-1">{plan.name}</h4>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-extrabold text-primary">
                    ₹{plan.price}
                  </span>
                  <span className="text-foreground/50 text-sm">/month</span>
                </div>

                <div className="space-y-2 mb-6">
                  {plan.features?.map((feature, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-sm text-foreground/80"
                    >
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      {feature}
                    </div>
                  ))}
                </div>

                <div className="text-xs text-foreground/50 mb-4 space-y-1">
                  <div>
                    Members:{" "}
                    {plan.maxMembers === -1 ? "Unlimited" : plan.maxMembers}
                  </div>
                  <div>
                    Trainers:{" "}
                    {plan.maxTrainers === -1 ? "Unlimited" : plan.maxTrainers}
                  </div>
                </div>

                <button
                  onClick={() => handleSubscribe(plan._id)}
                  disabled={isCurrentPlan || processing}
                  className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2
                    ${
                      plan.name === "Growth"
                        ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
                        : "bg-zinc-800 text-foreground hover:bg-zinc-700 border border-border"
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isCurrentPlan ? (
                    "Current Plan"
                  ) : processing ? (
                    "Processing..."
                  ) : (
                    <>
                      {subscription?.status === "ACTIVE" && !isExpired
                        ? "Upgrade"
                        : "Subscribe"}
                      <ArrowUpRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const UsageBar = ({ label, icon: Icon, current, max }) => {
  const isUnlimited = max === -1;
  const percentage = isUnlimited ? 0 : Math.min(100, (current / max) * 100);
  const isNearLimit = !isUnlimited && percentage >= 80;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Icon className="h-4 w-4 text-foreground/60" />
          {label}
        </div>
        <span className="text-sm text-foreground/60">
          {current} / {isUnlimited ? "∞" : max}
        </span>
      </div>
      <div className="w-full bg-zinc-800 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full transition-all duration-500 ${
            isUnlimited
              ? "bg-green-500 w-[5%]"
              : isNearLimit
                ? "bg-yellow-500"
                : "bg-primary"
          }`}
          style={isUnlimited ? {} : { width: `${Math.max(2, percentage)}%` }}
        ></div>
      </div>
      {isNearLimit && (
        <p className="text-yellow-500 text-xs mt-1 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Nearing limit — consider upgrading
        </p>
      )}
    </div>
  );
};

export default SubscriptionTab;
