import React, { useState, useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import api from "../utils/api";
import toast from "react-hot-toast";
import {
  Settings,
  Plus,
  Users,
  ScanLine,
  Activity,
  IndianRupee,
  Edit3,
  X,
  CheckCircle2,
} from "lucide-react";

const OwnerDashboard = () => {
  const [gym, setGym] = useState(null);
  const [plans, setPlans] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [members, setMembers] = useState([]);
  const [revenue, setRevenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [scannerInit, setScannerInit] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  // Form states
  const [gymForm, setGymForm] = useState({
    name: "",
    description: "",
    address: "",
    monthlySubscriptionFee: 0,
    images: [], // To track current images from backend or new uploads
  });
  const [selectedImages, setSelectedImages] = useState([]); // To hold File objects
  const [uploadingImages, setUploadingImages] = useState(false);
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
          images: gymData.images || [],
        });

        // Get Plans
        const { data: plansData } = await api.get(`/plans/gym/${gymData._id}`);
        setPlans(plansData);

        // Get Today's Attendance
        const { data: attendanceData } = await api.get(
          `/attendance/gym/${gymData._id}`,
        );
        setAttendances(attendanceData);

        // Get Members
        const { data: membersData } = await api.get(
          `/memberships/gym/${gymData._id}`,
        );
        setMembers(membersData);

        // Get Revenue
        const { data: revenueData } = await api.get(
          `/memberships/gym/${gymData._id}/revenue`,
        );
        setRevenue(revenueData);
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

  const handleImageChange = (e) => {
    if (e.target.files) {
      setSelectedImages(Array.from(e.target.files));
    }
  };

  const uploadImages = async () => {
    if (selectedImages.length === 0) return [];

    const formData = new FormData();
    selectedImages.forEach((image) => {
      formData.append("images", image);
    });

    try {
      setUploadingImages(true);
      const { data } = await api.post("/gyms/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data.urls;
    } catch (error) {
      toast.error("Failed to upload images");
      return null;
    } finally {
      setUploadingImages(false);
    }
  };

  const handleGymSubmit = async (e) => {
    e.preventDefault();
    try {
      if (gym) {
        toast.error(
          "Updating gym details not fully supported in MVP without specific endpoint.",
        );
      } else {
        let uploadedUrls = [];
        if (selectedImages.length > 0) {
          uploadedUrls = await uploadImages();
          if (!uploadedUrls) return; // Stop if upload failed
        }

        const submitData = {
          ...gymForm,
          images: [...gymForm.images, ...uploadedUrls],
        };

        const { data } = await api.post("/gyms", submitData);
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

  const handleEditPlan = async (planId) => {
    try {
      await api.put(`/plans/${planId}`, editingPlan);
      toast.success("Plan updated successfully!");
      setEditingPlan(null);
      // Refresh plans
      if (gym) {
        const { data } = await api.get(`/plans/gym/${gym._id}`);
        setPlans(data);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update plan");
    }
  };

  const handleTogglePlanActive = async (plan) => {
    try {
      await api.put(`/plans/${plan._id}`, { isActive: !plan.isActive });
      toast.success(
        `Plan ${plan.isActive ? "deactivated" : "activated"} successfully`,
      );
      if (gym) {
        const { data } = await api.get(`/plans/gym/${gym._id}`);
        setPlans(data);
      }
    } catch (error) {
      toast.error("Failed to toggle plan status");
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
        {["overview", "members", "scanner", "plans", "settings"].map((tab) => (
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
              <div className="text-3xl font-bold mb-1">{members.length}</div>
              <div className="text-sm text-foreground/60">Total Members</div>
            </div>
            <div className="bg-card border border-border p-6 rounded-xl flex flex-col items-center justify-center text-center">
              <IndianRupee className="h-8 w-8 text-green-400 mb-2" />
              <div className="text-3xl font-bold mb-1">
                ₹{revenue?.totalRevenue || 0}
              </div>
              <div className="text-sm text-foreground/60">Total Revenue</div>
            </div>
            <div className="bg-card border border-border p-6 rounded-xl flex flex-col items-center justify-center text-center">
              <IndianRupee className="h-8 w-8 text-yellow-400 mb-2" />
              <div className="text-3xl font-bold mb-1">
                ₹{revenue?.monthlyRevenue || 0}
              </div>
              <div className="text-sm text-foreground/60">This Month</div>
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

      {/* Members Tab */}
      {activeTab === "members" && gym && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users /> Member Management
          </h2>
          {members.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center text-foreground/60">
              No members yet.
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-zinc-800/50">
                    <th className="text-left p-4 font-semibold">Name</th>
                    <th className="text-left p-4 font-semibold">Email</th>
                    <th className="text-left p-4 font-semibold">Phone</th>
                    <th className="text-left p-4 font-semibold">Plan</th>
                    <th className="text-left p-4 font-semibold">Status</th>
                    <th className="text-left p-4 font-semibold">Expires</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr
                      key={m._id}
                      className="border-b border-border/50 hover:bg-zinc-800/30"
                    >
                      <td className="p-4 font-medium">
                        {m.userId?.name || "N/A"}
                      </td>
                      <td className="p-4 text-foreground/70">
                        {m.userId?.email || "N/A"}
                      </td>
                      <td className="p-4 text-foreground/70">
                        {m.userId?.phone || "N/A"}
                      </td>
                      <td className="p-4 text-foreground/70">
                        {m.planId?.name || "N/A"}
                      </td>
                      <td className="p-4">
                        <span
                          className={`text-xs px-2 py-1 rounded-md font-bold ${m.status === "ACTIVE" && new Date(m.endDate) > new Date() ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}
                        >
                          {m.status === "ACTIVE" &&
                          new Date(m.endDate) > new Date()
                            ? "Active"
                            : "Expired"}
                        </span>
                      </td>
                      <td className="p-4 text-foreground/70">
                        {new Date(m.endDate).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
                {editingPlan && editingPlan._id === plan._id ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editingPlan.name}
                      onChange={(e) =>
                        setEditingPlan({ ...editingPlan, name: e.target.value })
                      }
                      className="w-full bg-background border border-border rounded-md px-3 py-1 text-sm"
                    />
                    <input
                      type="number"
                      value={editingPlan.price}
                      onChange={(e) =>
                        setEditingPlan({
                          ...editingPlan,
                          price: e.target.value,
                        })
                      }
                      className="w-full bg-background border border-border rounded-md px-3 py-1 text-sm"
                    />
                    <input
                      type="number"
                      value={editingPlan.durationInDays}
                      onChange={(e) =>
                        setEditingPlan({
                          ...editingPlan,
                          durationInDays: e.target.value,
                        })
                      }
                      className="w-full bg-background border border-border rounded-md px-3 py-1 text-sm"
                    />
                    <textarea
                      value={editingPlan.description || ""}
                      onChange={(e) =>
                        setEditingPlan({
                          ...editingPlan,
                          description: e.target.value,
                        })
                      }
                      className="w-full bg-background border border-border rounded-md px-3 py-1 text-sm h-16"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditPlan(plan._id)}
                        className="bg-primary text-primary-foreground px-3 py-1 rounded-md text-sm flex items-center gap-1"
                      >
                        <CheckCircle2 className="h-3 w-3" /> Save
                      </button>
                      <button
                        onClick={() => setEditingPlan(null)}
                        className="bg-zinc-700 text-foreground px-3 py-1 rounded-md text-sm flex items-center gap-1"
                      >
                        <X className="h-3 w-3" /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
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
                    <div className="flex gap-2 mt-3 border-t border-border pt-3">
                      <button
                        onClick={() => setEditingPlan({ ...plan })}
                        className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-md hover:bg-blue-500/20 transition-colors flex items-center gap-1"
                      >
                        <Edit3 className="h-3 w-3" /> Edit
                      </button>
                      <button
                        onClick={() => handleTogglePlanActive(plan)}
                        className={`text-xs px-3 py-1 rounded-md border transition-colors ${plan.isActive ? "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20" : "bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20"}`}
                      >
                        {plan.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </>
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
              <label className="block text-sm font-medium mb-1 flex items-center justify-between">
                <span>
                  Location <span className="text-red-500">*</span>
                </span>
                {!gym && (
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                          (position) => {
                            setGymForm({
                              ...gymForm,
                              location: {
                                lat: position.coords.latitude,
                                lng: position.coords.longitude,
                              },
                            });
                            toast.success("Location captured successfully!");
                          },
                          (error) => {
                            toast.error(
                              "Failed to get location. Please allow location access.",
                            );
                          },
                        );
                      } else {
                        toast.error(
                          "Geolocation is not supported by this browser.",
                        );
                      }
                    }}
                    className="text-xs bg-primary/10 text-primary px-2 py-1 rounded hover:bg-primary/20 transition-colors"
                  >
                    Get Current Location
                  </button>
                )}
              </label>
              {gymForm.location ? (
                <div className="text-sm bg-background border border-border rounded-md px-3 py-2 text-foreground/80 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Lat: {gymForm.location.lat.toFixed(4)}, Lng:{" "}
                  {gymForm.location.lng.toFixed(4)}
                </div>
              ) : (
                <div className="text-sm bg-background/50 border border-border rounded-md px-3 py-2 text-foreground/50 border-dashed">
                  {gym
                    ? "Location not set"
                    : "Click 'Get Current Location' to pin your gym on the map."}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Gym Images (Max 5)
              </label>
              {!gym && (
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full bg-background border border-border rounded-md px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-colors"
                />
              )}
              {/* Preview Selected Local Images */}
              {selectedImages.length > 0 && !gym && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {selectedImages.map((img, i) => (
                    <div
                      key={i}
                      className="relative aspect-video bg-zinc-800 rounded-md overflow-hidden"
                    >
                      <img
                        src={URL.createObjectURL(img)}
                        alt={`Preview ${i}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
              {/* Show Existing Remote Images */}
              {gym && gymForm.images && gymForm.images.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {gymForm.images.map((url, i) => (
                    <div
                      key={i}
                      className="relative aspect-video bg-zinc-800 rounded-md overflow-hidden group"
                    >
                      <img
                        src={url}
                        alt={`Existing ${i}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
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
                disabled={uploadingImages}
                className="w-full bg-primary text-primary-foreground font-medium py-2 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {uploadingImages ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Uploading Images & Submitting...
                  </>
                ) : (
                  "Submit Gym Profile for Review"
                )}
              </button>
            )}
          </form>
        </div>
      )}
    </div>
  );
};

export default OwnerDashboard;
