import React, { useState, useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import api from "../utils/api";
import toast from "react-hot-toast";
import { Settings, Plus, Users, ScanLine, Activity } from "lucide-react";

const OwnerDashboard = () => {
  const [gym, setGym] = useState(null);
  const [plans, setPlans] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview"); // overview, scanner, plans, settings
  const [scannerInit, setScannerInit] = useState(false);

  // Form states
  const [gymForm, setGymForm] = useState({
    name: "",
    description: "",
    address: "",
    monthlySubscriptionFee: 0,
  });
  const [planForm, setPlanForm] = useState({
    name: "",
    price: 0,
    durationInDays: 30,
    description: "",
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Get Gym Info
      try {
        const { data: gymData } = await api.get("/gyms/mygym");
        setGym(gymData);
        setGymForm({
          name: gymData.name,
          description: gymData.description,
          address: gymData.address,
          monthlySubscriptionFee: gymData.monthlySubscriptionFee,
        });

        // Get Plans
        const { data: plansData } = await api.get(`/plans/gym/${gymData._id}`);
        setPlans(plansData);

        // Get Today's Attendance
        const { data: attendanceData } = await api.get(
          `/attendance/gym/${gymData._id}`,
        );
        setAttendances(attendanceData);
      } catch (err) {
        // Gym might not exist yet for this owner
        if (err.response?.status === 404) {
          setGym(null);
          setActiveTab("settings");
        } else {
          toast.error("Failed to load dashboard data");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // QR Code Scanner Logic
  useEffect(() => {
    if (activeTab === "scanner" && gym && !scannerInit) {
      const scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false,
      );

      scanner.render(
        async (decodedText) => {
          // Pause scanning
          scanner.pause();
          try {
            const { data } = await api.post("/attendance/scan", {
              qrCodeString: decodedText,
            });
            toast.success(`Attendance marked for ${data.memberName}`);
            // Refresh attendance list
            const { data: attendanceData } = await api.get(
              `/attendance/gym/${gym._id}`,
            );
            setAttendances(attendanceData);

            // Resume after 3 seconds
            setTimeout(() => scanner.resume(), 3000);
          } catch (error) {
            toast.error(error.response?.data?.message || "Invalid QR Code");
            setTimeout(() => scanner.resume(), 2000);
          }
        },
        (error) => {
          // handle scan failure, usually better to ignore and keep scanning
        },
      );

      setScannerInit(true);

      return () => {
        scanner
          .clear()
          .catch((error) =>
            console.error("Failed to clear html5QrcodeScanner. ", error),
          );
      };
    }
  }, [activeTab, gym, scannerInit]);

  const handleGymSubmit = async (e) => {
    e.preventDefault();
    try {
      if (gym) {
        // Update Gym (MVP might skip full update logic, assume create-only for now or simple put if endpoint added)
        toast.error(
          "Updating gym details not fully supported in MVP without specific endpoint.",
        );
      } else {
        const { data } = await api.post("/gyms", gymForm);
        setGym(data);
        toast.success("Gym profile created successfully!");
        setActiveTab("overview");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to save gym profile",
      );
    }
  };

  const handlePlanSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post("/plans", {
        ...planForm,
        gymId: gym._id,
      });
      setPlans([...plans, data]);
      setPlanForm({ name: "", price: 0, durationInDays: 30, description: "" });
      toast.success("Plan created successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create plan");
    }
  };

  if (loading)
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Gym Owner Panel</h1>
        {gym && (
          <div
            className={`px-3 py-1 rounded-full text-xs font-bold border ${gym.status === "APPROVED" ? "bg-green-500/10 text-green-500 border-green-500/20" : gym.status === "REJECTED" ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"}`}
          >
            {gym.status}
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 border-b border-border mb-6 overflow-x-auto pb-1">
        {["overview", "scanner", "plans", "settings"].map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              if (tab !== "scanner") setScannerInit(false);
            }}
            disabled={!gym && tab !== "settings"}
            className={`px-4 py-2 rounded-t-lg transition-colors capitalize shrink-0 font-medium ${activeTab === tab ? "bg-zinc-800 text-primary border-b-2 border-primary" : "hover:bg-zinc-800/50 text-foreground/60"} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Contents */}

      {activeTab === "overview" && gym && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card border border-border p-6 rounded-xl flex flex-col items-center justify-center text-center">
              <Activity className="h-8 w-8 text-primary mb-2" />
              <div className="text-3xl font-bold mb-1">
                {attendances.length}
              </div>
              <div className="text-sm text-foreground/60">
                Today's Attendance
              </div>
            </div>
            <div className="bg-card border border-border p-6 rounded-xl flex flex-col items-center justify-center text-center">
              <Users className="h-8 w-8 text-blue-400 mb-2" />
              <div className="text-3xl font-bold mb-1">{plans.length}</div>
              <div className="text-sm text-foreground/60">Active Plans</div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border font-bold">
              Today's Check-ins
            </div>
            {attendances.length === 0 ? (
              <div className="p-8 text-center text-foreground/60">
                No attendances recorded today.
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {attendances.map((record) => (
                  <li
                    key={record._id}
                    className="p-4 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium">
                        {record.userId?.name || "Unknown User"}
                      </p>
                      <p className="text-xs text-foreground/60">
                        {new Date(record.date).toLocaleTimeString()}
                      </p>
                    </div>
                    <CheckCircle2 className="text-green-500 h-5 w-5" />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {activeTab === "scanner" && gym && (
        <div className="flex flex-col items-center space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ScanLine /> Scan Membership QR
          </h2>
          <p className="text-sm text-foreground/60 max-w-md text-center">
            Ask the user to open their dashboard and scan the QR code to mark
            their attendance for today.
          </p>

          <div className="w-full max-w-sm bg-black rounded-2xl overflow-hidden border-2 border-primary/50 relative">
            {/* The HTML5 QR component needs an empty div with this id */}
            <div id="reader" width="600px"></div>
          </div>
        </div>
      )}

      {activeTab === "plans" && gym && (
        <div className="space-y-6">
          <form
            onSubmit={handlePlanSubmit}
            className="bg-card p-6 border border-border rounded-xl space-y-4 max-w-2xl mx-auto"
          >
            <h2 className="text-xl font-bold border-b border-border pb-2 mb-4">
              Create New Plan
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Plan Name
                </label>
                <input
                  required
                  type="text"
                  value={planForm.name}
                  onChange={(e) =>
                    setPlanForm({ ...planForm, name: e.target.value })
                  }
                  className="w-full bg-background border border-border rounded-md px-3 py-2"
                  placeholder="e.g. Monthly Pro"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Price (₹)
                </label>
                <input
                  required
                  type="number"
                  min="0"
                  value={planForm.price}
                  onChange={(e) =>
                    setPlanForm({ ...planForm, price: e.target.value })
                  }
                  className="w-full bg-background border border-border rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Duration (Days)
                </label>
                <input
                  required
                  type="number"
                  min="1"
                  value={planForm.durationInDays}
                  onChange={(e) =>
                    setPlanForm({ ...planForm, durationInDays: e.target.value })
                  }
                  className="w-full bg-background border border-border rounded-md px-3 py-2"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <textarea
                  value={planForm.description}
                  onChange={(e) =>
                    setPlanForm({ ...planForm, description: e.target.value })
                  }
                  className="w-full bg-background border border-border rounded-md px-3 py-2 h-20"
                  placeholder="Optional details..."
                ></textarea>
              </div>
            </div>
            <button
              type="submit"
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 flex items-center gap-1"
            >
              <Plus className="h-4 w-4" /> Add Plan
            </button>
          </form>

          <h3 className="text-lg font-bold mt-8 mb-4">Existing Plans</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <div
                key={plan._id}
                className="bg-card border border-border p-4 rounded-xl"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-lg">{plan.name}</h4>
                  <span
                    className={`text-xs px-2 py-1 rounded-md ${plan.isActive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}
                  >
                    {plan.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="text-2xl font-bold text-primary mb-1">
                  ₹{plan.price}
                </div>
                <div className="text-sm text-foreground/60">
                  {plan.durationInDays} days
                </div>
                {plan.description && (
                  <div className="text-sm text-foreground/80 mt-2 truncate">
                    {plan.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "settings" && (
        <div className="max-w-2xl mx-auto">
          <form
            onSubmit={handleGymSubmit}
            className="bg-card border border-border rounded-xl p-6 space-y-5"
          >
            <h2 className="text-xl font-bold border-b border-border pb-2 flex items-center gap-2">
              <Settings className="h-5 w-5" /> Gym Profile Information
            </h2>

            {!gym && (
              <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 p-4 rounded-lg text-sm mb-4">
                Welcome! Please set up your gym profile below before accessing
                the rest of the dashboard. Once created, an Admin will need to
                approve it before it appears in public search.
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">
                Gym Name <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                value={gymForm.name}
                onChange={(e) =>
                  setGymForm({ ...gymForm, name: e.target.value })
                }
                className="w-full bg-background border border-border rounded-md px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                placeholder="e.g. Iron Forge Fitness"
                disabled={!!gym}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Address <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                value={gymForm.address}
                onChange={(e) =>
                  setGymForm({ ...gymForm, address: e.target.value })
                }
                className="w-full bg-background border border-border rounded-md px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                placeholder="e.g. 123 Main St, City, State"
                disabled={!!gym}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={gymForm.description}
                onChange={(e) =>
                  setGymForm({ ...gymForm, description: e.target.value })
                }
                className="w-full bg-background border border-border rounded-md px-3 py-2 h-32 focus:ring-2 focus:ring-primary focus:outline-none"
                placeholder="Describe your gym, equipment, rules, etc."
                disabled={!!gym}
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Monthly Subscription Fee to Platform (₹){" "}
                <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-foreground/60 mb-2">
                This is the flat monthly fee you pay to the FitFind platform (as
                per agreement).
              </p>
              <input
                required
                type="number"
                min="0"
                value={gymForm.monthlySubscriptionFee}
                onChange={(e) =>
                  setGymForm({
                    ...gymForm,
                    monthlySubscriptionFee: e.target.value,
                  })
                }
                className="w-full bg-background border border-border rounded-md px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                disabled={!!gym}
              />
            </div>

            {!gym && (
              <button
                type="submit"
                className="w-full bg-primary text-primary-foreground font-medium py-2 rounded-md hover:bg-primary/90 transition-colors"
              >
                Submit Gym Profile for Review
              </button>
            )}
          </form>
        </div>
      )}
    </div>
  );
};

export default OwnerDashboard;
