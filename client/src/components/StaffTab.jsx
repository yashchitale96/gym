import React, { useState, useEffect } from "react";
import api from "../utils/api";
import toast from "react-hot-toast";
import {
  UserPlus,
  Shield,
  Trash2,
  ChevronDown,
  ChevronUp,
  Check,
} from "lucide-react";

const PERMISSION_LABELS = {
  manage_members: { label: "Manage Members", desc: "View members, scan QR" },
  manage_trainers: {
    label: "Manage Trainers",
    desc: "Add/assign trainers",
  },
  manage_plans: { label: "Manage Plans", desc: "Create/edit gym plans" },
  view_payments: {
    label: "View Payments",
    desc: "View payment history & revenue",
  },
  view_analytics: {
    label: "View Analytics",
    desc: "Access analytics dashboard",
  },
  manage_gym: { label: "Manage Gym", desc: "Edit gym profile & settings" },
  manage_subscription: {
    label: "Manage Subscription",
    desc: "Handle SaaS subscription",
  },
};

const StaffTab = () => {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    permissions: [],
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/staff");
      setStaffList(data);
    } catch {
      toast.error("Failed to load staff");
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (perm) => {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter((p) => p !== perm)
        : [...prev.permissions, perm],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.password) {
      toast.error("Please fill all fields");
      return;
    }
    if (form.permissions.length === 0) {
      toast.error("Select at least one permission");
      return;
    }

    setSaving(true);
    try {
      await api.post("/staff", form);
      toast.success("Staff member added!");
      setForm({
        name: "",
        email: "",
        phone: "",
        password: "",
        permissions: [],
      });
      setShowForm(false);
      fetchStaff();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add staff");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (id) => {
    if (!window.confirm("Remove this staff member? They will lose access.")) {
      return;
    }
    try {
      await api.delete(`/staff/${id}`);
      toast.success("Staff removed");
      fetchStaff();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove");
    }
  };

  const handleUpdatePermissions = async (id, permissions) => {
    try {
      await api.put(`/staff/${id}/permissions`, { permissions });
      toast.success("Permissions updated");
      fetchStaff();
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed");
    }
  };

  const toggleStaffPermission = (staff, perm) => {
    const current = staff.permissions || [];
    const updated = current.includes(perm)
      ? current.filter((p) => p !== perm)
      : [...current, perm];
    handleUpdatePermissions(staff._id, updated);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" /> Staff Management
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-xl font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 text-sm"
        >
          <UserPlus className="h-4 w-4" />
          Add Staff
        </button>
      </div>

      {/* Add Staff Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-card border border-border rounded-xl p-6 space-y-4"
        >
          <h3 className="font-bold text-lg">New Staff Member</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Full Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="bg-background border border-border rounded-lg px-4 py-2.5 w-full focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="bg-background border border-border rounded-lg px-4 py-2.5 w-full focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <input
              type="text"
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="bg-background border border-border rounded-lg px-4 py-2.5 w-full focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="bg-background border border-border rounded-lg px-4 py-2.5 w-full focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <p className="text-sm font-medium mb-3 text-foreground/70">
              Permissions
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {Object.entries(PERMISSION_LABELS).map(
                ([key, { label, desc }]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => togglePermission(key)}
                    className={`text-left p-3 rounded-lg border transition-all text-sm ${
                      form.permissions.includes(key)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-foreground/20"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${
                          form.permissions.includes(key)
                            ? "bg-primary border-primary"
                            : "border-foreground/30"
                        }`}
                      >
                        {form.permissions.includes(key) && (
                          <Check className="h-3 w-3 text-white" />
                        )}
                      </div>
                      <span className="font-medium">{label}</span>
                    </div>
                    <p className="text-xs text-foreground/50 mt-1 ml-6">
                      {desc}
                    </p>
                  </button>
                ),
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? "Adding..." : "Add Staff"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-6 py-2.5 rounded-xl border border-border hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Staff List */}
      {staffList.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center text-foreground/60">
          No staff members yet. Add receptionists or sub-admins with specific
          permissions.
        </div>
      ) : (
        <div className="space-y-3">
          {staffList.map((staff) => (
            <div
              key={staff._id}
              className="bg-card border border-border rounded-xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {staff.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                  <div>
                    <h4 className="font-semibold">{staff.name}</h4>
                    <p className="text-xs text-foreground/50">
                      {staff.email} • {staff.phone}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-full px-2.5 py-0.5 font-medium hidden sm:inline-block">
                    {(staff.permissions || []).length} permissions
                  </span>
                  <button
                    onClick={() =>
                      setExpandedId(expandedId === staff._id ? null : staff._id)
                    }
                    className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    {expandedId === staff._id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleRemove(staff._id)}
                    className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Expanded Permissions */}
              {expandedId === staff._id && (
                <div className="px-4 pb-4 pt-2 border-t border-border">
                  <p className="text-xs text-foreground/50 mb-3">
                    Click to toggle permissions (changes save immediately)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {Object.entries(PERMISSION_LABELS).map(
                      ([key, { label, desc }]) => {
                        const has = (staff.permissions || []).includes(key);
                        return (
                          <button
                            key={key}
                            onClick={() => toggleStaffPermission(staff, key)}
                            className={`text-left p-3 rounded-lg border transition-all text-sm ${
                              has
                                ? "border-green-500/50 bg-green-500/10 text-green-400"
                                : "border-border text-foreground/50 hover:border-foreground/20"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${
                                  has
                                    ? "bg-green-500 border-green-500"
                                    : "border-foreground/30"
                                }`}
                              >
                                {has && (
                                  <Check className="h-3 w-3 text-white" />
                                )}
                              </div>
                              <span className="font-medium">{label}</span>
                            </div>
                            <p className="text-xs opacity-60 mt-1 ml-6">
                              {desc}
                            </p>
                          </button>
                        );
                      },
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StaffTab;
