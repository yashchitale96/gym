import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Link } from "react-router-dom";
import api from "../utils/api";
import toast from "react-hot-toast";
import {
  Calendar,
  CreditCard,
  Clock,
  CheckCircle2,
  IndianRupee,
  Flame,
  TrendingUp,
  Dumbbell,
  RotateCcw,
  Activity,
  ArrowRight,
} from "lucide-react";

// ── Stat Card ──
const StatCard = ({ title, value, icon: Icon, color, bg, subtitle }) => (
  <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4 transition-transform hover:-translate-y-1 hover:shadow-lg duration-300">
    <div className={`${bg} ${color} p-3 rounded-xl shrink-0`}>
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <p className="text-sm text-foreground/60 font-medium">{title}</p>
      <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
      {subtitle && (
        <p className="text-xs text-foreground/40 mt-0.5">{subtitle}</p>
      )}
    </div>
  </div>
);

// ── Days Remaining Bar ──
const DaysBar = ({ startDate, endDate }) => {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const now = Date.now();
  const total = end - start;
  const elapsed = now - start;
  const remaining = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
  const percentage = Math.min(100, Math.max(0, (elapsed / total) * 100));
  const isLow = remaining <= 5;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-foreground/60">Time remaining</span>
        <span
          className={`text-xs font-bold ${isLow ? "text-red-400" : "text-foreground/70"}`}
        >
          {remaining} day{remaining !== 1 ? "s" : ""} left
        </span>
      </div>
      <div className="w-full bg-zinc-800 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-700 ${isLow ? "bg-red-500" : percentage > 60 ? "bg-yellow-500" : "bg-green-500"}`}
          style={{ width: `${100 - percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

// ── Attendance Heatmap ──
const AttendanceHeatmap = ({ attendanceByDate }) => {
  const weeks = 13; // ~3 months
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = [];
  for (let i = weeks * 7 - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const key = date.toISOString().split("T")[0];
    days.push({ date: key, count: attendanceByDate[key] || 0 });
  }

  // Group into weeks (columns)
  const weekColumns = [];
  for (let i = 0; i < days.length; i += 7) {
    weekColumns.push(days.slice(i, i + 7));
  }

  const getColor = (count) => {
    if (count === 0) return "bg-zinc-800";
    if (count === 1) return "bg-green-900";
    if (count === 2) return "bg-green-700";
    return "bg-green-500";
  };

  const dayLabels = ["", "Mon", "", "Wed", "", "Fri", ""];

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Activity className="h-5 w-5 text-primary" /> Check-in Activity
      </h3>
      <div className="flex gap-1.5 overflow-x-auto pb-2">
        {/* Day labels */}
        <div className="flex flex-col gap-1.5 mr-1 shrink-0">
          {dayLabels.map((label, i) => (
            <div
              key={i}
              className="h-3.5 w-6 text-[10px] text-foreground/40 flex items-center"
            >
              {label}
            </div>
          ))}
        </div>
        {/* Grid */}
        {weekColumns.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1.5">
            {week.map((day) => (
              <div
                key={day.date}
                className={`h-3.5 w-3.5 rounded-sm ${getColor(day.count)} transition-colors`}
                title={`${day.date}: ${day.count} check-in${day.count !== 1 ? "s" : ""}`}
              ></div>
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-3 text-[10px] text-foreground/40">
        <span>Less</span>
        <div className="h-3 w-3 rounded-sm bg-zinc-800"></div>
        <div className="h-3 w-3 rounded-sm bg-green-900"></div>
        <div className="h-3 w-3 rounded-sm bg-green-700"></div>
        <div className="h-3 w-3 rounded-sm bg-green-500"></div>
        <span>More</span>
      </div>
    </div>
  );
};

// ── Main Dashboard ──
const UserDashboard = () => {
  const [memberships, setMemberships] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [renewingId, setRenewingId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [memRes, attRes, payRes, statsRes] = await Promise.all([
          api.get("/memberships/my"),
          api.get("/attendance/my"),
          api.get("/memberships/payments"),
          api.get("/attendance/stats"),
        ]);
        setMemberships(memRes.data);
        setAttendances(attRes.data);
        setPayments(payRes.data);
        setStats(statsRes.data);
      } catch (error) {
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const activeMemberships = memberships.filter(
    (m) => m.status === "ACTIVE" && new Date(m.endDate) > new Date(),
  );
  const expiredMemberships = memberships.filter(
    (m) => m.status !== "ACTIVE" || new Date(m.endDate) <= new Date(),
  );

  // Days remaining for first active membership
  const primaryMembership = activeMemberships[0];
  const daysRemaining = primaryMembership
    ? Math.max(
        0,
        Math.ceil(
          (new Date(primaryMembership.endDate) - new Date()) /
            (1000 * 60 * 60 * 24),
        ),
      )
    : 0;

  // ── Renew Handler ──
  const handleRenew = async (membership) => {
    setRenewingId(membership._id);
    try {
      const { data: order } = await api.post("/memberships/checkout", {
        planId: membership.planId._id || membership.planId,
        gymId: membership.gymId._id || membership.gymId,
      });

      if (order.isMock) {
        const { data: result } = await api.post("/memberships/verify", {
          razorpay_order_id: order.id,
          razorpay_payment_id: `mock_pay_${Date.now()}`,
          razorpay_signature: "mock_signature",
          planId: membership.planId._id || membership.planId,
          gymId: membership.gymId._id || membership.gymId,
        });
        toast.success("Membership renewed successfully!");
        // Refresh
        const { data } = await api.get("/memberships/my");
        setMemberships(data);
        return;
      }

      // Real Razorpay
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "FitFind",
        description: "Membership Renewal",
        order_id: order.id,
        handler: async (response) => {
          try {
            await api.post("/memberships/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planId: membership.planId._id || membership.planId,
              gymId: membership.gymId._id || membership.gymId,
            });
            toast.success("Membership renewed successfully!");
            const { data } = await api.get("/memberships/my");
            setMemberships(data);
          } catch {
            toast.error("Payment verification failed");
          }
        },
        theme: { color: "#e11d48" },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      toast.error(error.response?.data?.message || "Renewal failed");
    } finally {
      setRenewingId(null);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Dashboard</h1>
          <p className="text-foreground/50 text-sm mt-1">
            Track your fitness journey, manage memberships, and stay consistent.
          </p>
        </div>
        {activeMemberships.length === 0 && (
          <Link
            to="/gyms"
            className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <Dumbbell className="h-4 w-4" /> Find a Gym
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-border mb-6 overflow-x-auto pb-1">
        {["overview", "memberships", "attendance", "payments"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-t-lg transition-colors capitalize shrink-0 font-medium ${activeTab === tab ? "bg-zinc-800 text-primary border-b-2 border-primary" : "hover:bg-zinc-800/50 text-foreground/60"}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ══════════════════ OVERVIEW ══════════════════ */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Days Remaining"
              value={activeMemberships.length > 0 ? daysRemaining : "—"}
              icon={Clock}
              color="text-blue-500"
              bg="bg-blue-500/10"
              subtitle={
                primaryMembership
                  ? `Expires ${new Date(primaryMembership.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
                  : "No active membership"
              }
            />
            <StatCard
              title="This Month"
              value={stats?.checkInsThisMonth || 0}
              icon={CheckCircle2}
              color="text-green-500"
              bg="bg-green-500/10"
              subtitle="Check-ins"
            />
            <StatCard
              title="Total Spent"
              value={`₹${(stats?.totalSpent || 0).toLocaleString("en-IN")}`}
              icon={IndianRupee}
              color="text-emerald-500"
              bg="bg-emerald-500/10"
              subtitle={`${payments.length} payments`}
            />
            <StatCard
              title="Current Streak"
              value={`${stats?.currentStreak || 0} 🔥`}
              icon={Flame}
              color="text-orange-500"
              bg="bg-orange-500/10"
              subtitle="Consecutive days"
            />
          </div>

          {/* Active Membership Quick View */}
          {primaryMembership && (
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Dumbbell className="h-5 w-5 text-primary" />
                    {primaryMembership.gymId.name}
                  </h3>
                  <p className="text-sm text-foreground/60 mt-0.5">
                    {primaryMembership.planId.name} plan •{" "}
                    {primaryMembership.gymId.address}
                  </p>
                </div>
                <span className="bg-green-500/10 text-green-500 border border-green-500/20 text-xs font-bold px-3 py-1 rounded-full">
                  ACTIVE
                </span>
              </div>
              <DaysBar
                startDate={primaryMembership.startDate}
                endDate={primaryMembership.endDate}
              />
            </div>
          )}

          {/* Heatmap */}
          {stats?.attendanceByDate && (
            <AttendanceHeatmap attendanceByDate={stats.attendanceByDate} />
          )}

          {/* Recent Activity */}
          {attendances.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" /> Recent
                  Check-ins
                </h3>
                <button
                  onClick={() => setActiveTab("attendance")}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  View all <ArrowRight className="h-3 w-3" />
                </button>
              </div>
              <div className="space-y-2">
                {attendances.slice(0, 5).map((a) => (
                  <div
                    key={a._id}
                    className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      <span className="text-sm font-medium">
                        {a.gymId?.name || "Gym"}
                      </span>
                    </div>
                    <span className="text-xs text-foreground/50">
                      {new Date(a.date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}{" "}
                      •{" "}
                      {new Date(a.date).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════ MEMBERSHIPS ══════════════════ */}
      {activeTab === "memberships" && (
        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <CreditCard className="text-primary" /> Active Memberships
            </h2>
            {activeMemberships.length === 0 ? (
              <div className="bg-card border border-border rounded-xl p-8 text-center">
                <Dumbbell className="h-12 w-12 mx-auto text-foreground/20 mb-4" />
                <p className="text-foreground/60 mb-4">
                  You don't have any active memberships.
                </p>
                <Link
                  to="/gyms"
                  className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-semibold hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
                >
                  Discover Gyms <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {activeMemberships.map((m) => (
                  <div
                    key={m._id}
                    className="bg-card border border-border rounded-xl p-6 flex flex-col md:flex-row gap-6 items-center md:items-start hover:border-primary/30 transition-colors"
                  >
                    <div className="bg-white p-2 rounded-lg shrink-0">
                      <QRCodeSVG
                        value={m.qrCodeString}
                        size={130}
                        level={"H"}
                      />
                    </div>
                    <div className="flex-1 text-center md:text-left space-y-3 w-full">
                      <div>
                        <h3 className="text-xl font-bold text-primary">
                          {m.gymId.name}
                        </h3>
                        <p className="text-sm text-foreground/60">
                          {m.gymId.address}
                        </p>
                      </div>
                      <div className="bg-background rounded-lg p-3 inline-block">
                        <p className="text-sm font-medium">
                          Plan: {m.planId.name}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1 text-sm text-foreground/80">
                        <div className="flex items-center justify-center md:justify-start gap-1">
                          <Calendar className="h-4 w-4" /> Start:{" "}
                          {new Date(m.startDate).toLocaleDateString("en-IN")}
                        </div>
                        <div className="flex items-center justify-center md:justify-start gap-1">
                          <Clock className="h-4 w-4 text-primary" /> Expires:{" "}
                          {new Date(m.endDate).toLocaleDateString("en-IN")}
                        </div>
                      </div>
                      <DaysBar startDate={m.startDate} endDate={m.endDate} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Expired with Renew */}
          {expiredMemberships.length > 0 && (
            <section className="mt-8">
              <h2 className="text-xl font-bold mb-4 opacity-80">
                Past Memberships
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {expiredMemberships.map((m) => (
                  <div
                    key={m._id}
                    className="bg-card/50 border border-border/50 rounded-xl p-5"
                  >
                    <h3 className="font-bold text-lg">
                      {m.gymId?.name || "Gym"}
                    </h3>
                    <p className="text-sm text-foreground/60 mb-1">
                      Plan: {m.planId?.name || "N/A"}
                    </p>
                    <p className="text-xs text-red-400 mb-4">
                      Expired: {new Date(m.endDate).toLocaleDateString("en-IN")}
                    </p>
                    <button
                      onClick={() => handleRenew(m)}
                      disabled={renewingId === m._id}
                      className="w-full bg-primary/10 text-primary border border-primary/20 px-4 py-2 rounded-lg font-medium hover:bg-primary/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <RotateCcw className="h-4 w-4" />
                      {renewingId === m._id ? "Processing..." : "Renew"}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* ══════════════════ ATTENDANCE ══════════════════ */}
      {activeTab === "attendance" && (
        <section className="space-y-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <CheckCircle2 className="text-primary" /> Attendance History
          </h2>

          {/* Heatmap */}
          {stats?.attendanceByDate && (
            <AttendanceHeatmap attendanceByDate={stats.attendanceByDate} />
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-2xl font-bold">{stats?.totalCheckIns || 0}</p>
              <p className="text-xs text-foreground/50">Total Check-ins</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-2xl font-bold">
                {stats?.checkInsThisMonth || 0}
              </p>
              <p className="text-xs text-foreground/50">This Month</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-2xl font-bold">
                {stats?.currentStreak || 0} 🔥
              </p>
              <p className="text-xs text-foreground/50">Current Streak</p>
            </div>
          </div>

          {/* Table */}
          {attendances.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center text-foreground/60">
              No attendance records yet. Visit a gym and scan your QR code!
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-zinc-800/50">
                    <th className="text-left p-4 font-semibold">Gym</th>
                    <th className="text-left p-4 font-semibold">Date</th>
                    <th className="text-left p-4 font-semibold">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {attendances.map((a) => (
                    <tr
                      key={a._id}
                      className="border-b border-border/50 hover:bg-zinc-800/30"
                    >
                      <td className="p-4 font-medium">
                        {a.gymId?.name || "N/A"}
                      </td>
                      <td className="p-4 text-foreground/70">
                        {new Date(a.date).toLocaleDateString("en-IN", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="p-4 text-foreground/70">
                        {new Date(a.date).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ══════════════════ PAYMENTS ══════════════════ */}
      {activeTab === "payments" && (
        <section className="space-y-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <IndianRupee className="text-primary" /> Payment History
          </h2>

          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <p className="text-sm text-foreground/60">Total Spent</p>
              <p className="text-2xl font-bold text-primary">
                ₹{(stats?.totalSpent || 0).toLocaleString("en-IN")}
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <p className="text-sm text-foreground/60">Transactions</p>
              <p className="text-2xl font-bold">{payments.length}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <p className="text-sm text-foreground/60">Completed</p>
              <p className="text-2xl font-bold text-green-500">
                {payments.filter((p) => p.status === "COMPLETED").length}
              </p>
            </div>
          </div>

          {/* Table */}
          {payments.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center text-foreground/60">
              No payment records found.
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-zinc-800/50">
                    <th className="text-left p-4 font-semibold">Gym</th>
                    <th className="text-left p-4 font-semibold">Plan</th>
                    <th className="text-left p-4 font-semibold">Amount</th>
                    <th className="text-left p-4 font-semibold">Status</th>
                    <th className="text-left p-4 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr
                      key={p._id}
                      className="border-b border-border/50 hover:bg-zinc-800/30"
                    >
                      <td className="p-4 font-medium">
                        {p.gymId?.name || "N/A"}
                      </td>
                      <td className="p-4 text-foreground/70">
                        {p.planId?.name || "N/A"}
                      </td>
                      <td className="p-4 font-semibold text-primary">
                        ₹{p.amount}
                      </td>
                      <td className="p-4">
                        <span
                          className={`text-xs px-2 py-1 rounded-md font-bold ${p.status === "COMPLETED" ? "bg-green-500/20 text-green-400" : p.status === "PENDING" ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"}`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="p-4 text-foreground/70">
                        {new Date(p.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default UserDashboard;
