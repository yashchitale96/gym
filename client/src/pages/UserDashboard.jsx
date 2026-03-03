import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import api from "../utils/api";
import toast from "react-hot-toast";
import {
  Calendar,
  CreditCard,
  Clock,
  CheckCircle2,
  IndianRupee,
} from "lucide-react";

const UserDashboard = () => {
  const [memberships, setMemberships] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("memberships");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [memRes, attRes, payRes] = await Promise.all([
          api.get("/memberships/my"),
          api.get("/attendance/my"),
          api.get("/memberships/payments"),
        ]);
        setMemberships(memRes.data);
        setAttendances(attRes.data);
        setPayments(payRes.data);
      } catch (error) {
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );

  const activeMemberships = memberships.filter(
    (m) => m.status === "ACTIVE" && new Date(m.endDate) > new Date(),
  );
  const pastMemberships = memberships.filter(
    (m) => m.status !== "ACTIVE" || new Date(m.endDate) <= new Date(),
  );

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">My Dashboard</h1>

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-border mb-6 overflow-x-auto pb-1">
        {["memberships", "attendance", "payments"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-t-lg transition-colors capitalize shrink-0 font-medium ${activeTab === tab ? "bg-zinc-800 text-primary border-b-2 border-primary" : "hover:bg-zinc-800/50 text-foreground/60"}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Memberships Tab */}
      {activeTab === "memberships" && (
        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <CreditCard className="text-primary" /> Active Memberships
            </h2>
            {activeMemberships.length === 0 ? (
              <div className="bg-card border border-border rounded-xl p-8 text-center text-foreground/60">
                You don't have any active memberships. Visit the Discover page
                to find a gym.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {activeMemberships.map((m) => (
                  <div
                    key={m._id}
                    className="bg-card border border-border rounded-xl p-6 flex flex-col md:flex-row gap-6 items-center md:items-start"
                  >
                    <div className="bg-white p-2 rounded-lg shrink-0">
                      <QRCodeSVG
                        value={m.qrCodeString}
                        size={150}
                        level={"H"}
                      />
                    </div>
                    <div className="flex-1 text-center md:text-left space-y-3">
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
                          {new Date(m.startDate).toLocaleDateString()}
                        </div>
                        <div className="flex items-center justify-center md:justify-start gap-1">
                          <Clock className="h-4 w-4 text-primary" /> Expires:{" "}
                          {new Date(m.endDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {pastMemberships.length > 0 && (
            <section className="mt-12">
              <h2 className="text-xl font-bold mb-4 opacity-80">
                Past Memberships
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {pastMemberships.map((m) => (
                  <div
                    key={m._id}
                    className="bg-card/50 border border-border/50 rounded-xl p-4 opacity-80"
                  >
                    <h3 className="font-bold">{m.gymId.name}</h3>
                    <p className="text-sm text-foreground/60 mb-2">
                      Plan: {m.planId.name}
                    </p>
                    <p className="text-xs text-red-400">
                      Expired: {new Date(m.endDate).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Attendance Tab */}
      {activeTab === "attendance" && (
        <section>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <CheckCircle2 className="text-primary" /> Attendance History
          </h2>
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
                        {new Date(a.date).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-foreground/70">
                        {new Date(a.date).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Payments Tab */}
      {activeTab === "payments" && (
        <section>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <IndianRupee className="text-primary" /> Payment History
          </h2>
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
                        {new Date(p.createdAt).toLocaleDateString()}
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
