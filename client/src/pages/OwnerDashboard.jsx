import React, { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
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
import AnalyticsDashboard from "../components/AnalyticsDashboard";

const OwnerDashboard = () => {
  const [gym, setGym] = useState(null);
  const [plans, setPlans] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [members, setMembers] = useState([]);
  const [revenue, setRevenue] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const scannerRef = useRef(null);
  const [editingPlan, setEditingPlan] = useState(null);
  const [isEditingGym, setIsEditingGym] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scannerError, setScannerError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

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
  const startScanner = () => {
    if (!scannerRef.current) {
      const html5QrCode = new Html5Qrcode("reader");
      scannerRef.current = html5QrCode;
    }

    setScannerError(null);

    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    scannerRef.current
      .start(
        { facingMode: "environment" },
        config,
        async (decodedText) => {
          if (scannerRef.current.getState() === 2) {
            scannerRef.current.pause(true);
          }
          try {
            const { data } = await api.post("/attendance/scan", {
              qrCodeString: decodedText,
            });
            toast.success(`Attendance marked for ${data.memberName}`);

            if (gym) {
              const { data: attendanceData } = await api.get(
                `/attendance/gym/${gym._id}`,
              );
              setAttendances(attendanceData);
            }

            setTimeout(() => {
              if (scannerRef.current && scannerRef.current.getState() === 3) {
                scannerRef.current.resume();
              }
            }, 3000);
          } catch (error) {
            toast.error(error.response?.data?.message || "Invalid QR Code");
            setTimeout(() => {
              if (scannerRef.current && scannerRef.current.getState() === 3) {
                scannerRef.current.resume();
              }
            }, 2000);
          }
        },
        (errorMessage) => {},
      )
      .then(() => {
        setIsScanning(true);
      })
      .catch((err) => {
        console.error("Camera start error: ", err);
        setScannerError("Camera access denied or device not found.");
        toast.error("Camera access denied or device not found.");
        setIsScanning(false);
      });
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current
        .stop()
        .then(() => {
          setIsScanning(false);
        })
        .catch((err) => {
          console.error("Error stopping scanner", err);
        });
    }
  };

  useEffect(() => {
    // Cleanup function strictly for unmounting or leaving the tab
    return () => {
      if ((activeTab !== "scanner" || !gym) && scannerRef.current) {
        scannerRef.current
          .stop()
          .then(() => {
            scannerRef.current.clear();
            scannerRef.current = null;
            setIsScanning(false);
            setScannerError(null);
          })
          .catch((error) => {
            console.error("Failed to clear html5Qrcode. ", error);
            scannerRef.current = null;
            setIsScanning(false);
          });
      }
    };
  }, [activeTab, gym]);

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
    setUploadingImages(true);
    try {
      // Upload images if any
      let uploadedImageUrls = [];
      if (selectedImages.length > 0) {
        const formData = new FormData();
        selectedImages.forEach((img) => formData.append("images", img));

        const uploadRes = await api.post("/gyms/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        uploadedImageUrls = uploadRes.data.urls;
      }

      const payload = {
        ...gymForm,
        images: [...(gymForm.images || []), ...uploadedImageUrls],
      };

      if (gym) {
        // Update existing gym
        const { data } = await api.put(`/gyms/${gym._id}`, payload);
        setGym(data);
        setGymForm({
          name: data.name,
          description: data.description,
          address: data.address,
          monthlySubscriptionFee: data.monthlySubscriptionFee,
          images: data.images || [],
          location: data.location?.coordinates
            ? {
                lat: data.location.coordinates[1],
                lng: data.location.coordinates[0],
              }
            : null,
        });
        setSelectedImages([]); // Clear selected images after successful upload/update
        setIsEditingGym(false);
        toast.success("Gym Profile updated successfully!");
      } else {
        // Create new gym
        const { data } = await api.post("/gyms", payload);
        setGym(data);
        toast.success(
          "Gym Profile created successfully! Awaiting Admin Approval.",
        );
        setActiveTab("overview");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to save gym profile",
      );
    } finally {
      setUploadingImages(false);
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
            onClick={() => setActiveTab(tab)}
            disabled={!gym && tab !== "settings"}
            className={`px-4 py-2 rounded-t-lg transition-colors capitalize shrink-0 font-medium ${activeTab === tab ? "bg-zinc-800 text-primary border-b-2 border-primary" : "hover:bg-zinc-800/50 text-foreground/60"} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Contents */}

      {activeTab === "overview" && gym && (
        <AnalyticsDashboard gymId={gym._id} />
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

          <div className="w-full max-w-sm bg-black rounded-2xl overflow-hidden border-2 border-primary/50 relative min-h-[250px] flex flex-col items-center justify-center">
            {scannerError ? (
              <div className="p-4 text-center text-red-400 text-sm">
                {scannerError}
              </div>
            ) : (
              <div id="reader" className="w-full h-full bg-black"></div>
            )}

            {!isScanning && !scannerError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
                <button
                  onClick={startScanner}
                  className="bg-primary text-primary-foreground px-6 py-3 rounded-full font-bold shadow-lg hover:bg-primary/90 transition"
                >
                  Start Scan
                </button>
              </div>
            )}

            {isScanning && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center z-10">
                <button
                  onClick={stopScanner}
                  className="bg-red-500 text-white px-6 py-2 rounded-full font-bold shadow-lg hover:bg-red-600 transition"
                >
                  Stop Scan
                </button>
              </div>
            )}
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
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Settings className="h-5 w-5" /> Gym Profile Information
              </h2>
              {gym && !isEditingGym && (
                <button
                  type="button"
                  onClick={() => setIsEditingGym(true)}
                  className="bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1 rounded-md text-sm transition-colors flex items-center gap-1"
                >
                  <Edit3 className="h-4 w-4" /> Edit Profile
                </button>
              )}
            </div>

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
                className="w-full bg-background border border-border rounded-md px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none disabled:opacity-50"
                placeholder="e.g. Iron Forge Fitness"
                disabled={!!gym && !isEditingGym}
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
                className="w-full bg-background border border-border rounded-md px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none disabled:opacity-50"
                placeholder="e.g. 123 Main St, City, State"
                disabled={!!gym && !isEditingGym}
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
                className="w-full bg-background border border-border rounded-md px-3 py-2 h-32 focus:ring-2 focus:ring-primary focus:outline-none disabled:opacity-50"
                placeholder="Describe your gym, equipment, rules, etc."
                disabled={!!gym && !isEditingGym}
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 flex items-center justify-between">
                <span>
                  Location <span className="text-red-500">*</span>
                </span>
                {(!gym || isEditingGym) && (
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
              {gymForm.location && gymForm.location.lat ? (
                <div className="text-sm bg-background border border-border rounded-md px-3 py-2 text-foreground/80 flex items-center gap-2 disabled:opacity-50">
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
              {(!gym || isEditingGym) && (
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full bg-background border border-border rounded-md px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-colors"
                />
              )}
              {/* Preview Selected Local Images */}
              {selectedImages.length > 0 && (!gym || isEditingGym) && (
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
              {gymForm.images && gymForm.images.length > 0 && (
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
                      {isEditingGym && (
                        <button
                          type="button"
                          onClick={() => {
                            setGymForm({
                              ...gymForm,
                              images: gymForm.images.filter(
                                (_, idx) => idx !== i,
                              ),
                            });
                          }}
                          className="absolute top-2 right-2 bg-red-500/80 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
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
                className="w-full bg-background border border-border rounded-md px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none disabled:opacity-50"
                disabled={!!gym && !isEditingGym}
              />
            </div>

            {(!gym || isEditingGym) && (
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={uploadingImages}
                  className="flex-1 bg-primary text-primary-foreground font-medium py-2 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {uploadingImages ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Uploading Images & Saving...
                    </>
                  ) : gym ? (
                    "Save Changes"
                  ) : (
                    "Submit Gym Profile for Review"
                  )}
                </button>
                {gym && isEditingGym && (
                  <button
                    type="button"
                    onClick={() => {
                      // reset to existing gym details
                      setGymForm({
                        name: gym.name || "",
                        description: gym.description || "",
                        address: gym.address || "",
                        monthlySubscriptionFee: gym.monthlySubscriptionFee || 0,
                        images: gym.images || [],
                        location: gym.location?.coordinates
                          ? {
                              lat: gym.location.coordinates[1],
                              lng: gym.location.coordinates[0],
                            }
                          : null,
                      });
                      setSelectedImages([]);
                      setIsEditingGym(false);
                    }}
                    className="px-6 bg-zinc-800 text-white rounded-md hover:bg-zinc-700 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                )}
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
};

export default OwnerDashboard;
