import React, { useState, useEffect } from "react";
import api from "../utils/api";
import toast from "react-hot-toast";
import {
  ShieldCheck,
  XCircle,
  CheckCircle,
  LayoutDashboard,
  Users,
  Dumbbell,
  Clock,
  Search,
  Activity,
  Building2,
  MoreVertical,
} from "lucide-react";

const StatCard = ({ title, value, icon: Icon, color, bg }) => (
  <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4 transition-transform hover:-translate-y-1 hover:shadow-lg duration-300">
    <div className={`${bg} ${color} p-3 rounded-xl shrink-0`}>
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <p className="text-sm text-foreground/60 font-medium mb-1">{title}</p>
      <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
    </div>
  </div>
);

const StatusBadge = ({ status }) => {
  const styles = {
    APPROVED: "bg-green-500/10 text-green-500 border-green-500/20",
    PENDING: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    REJECTED: "bg-red-500/10 text-red-500 border-red-500/20",
  };

  return (
    <span
      className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${styles[status] || "bg-gray-500/10 text-gray-500"}`}
    >
      {status}
    </span>
  );
};

const RoleBadge = ({ role }) => {
  const styles = {
    USER: "bg-blue-500/10 text-blue-500",
    GYM_OWNER: "bg-primary/20 text-primary",
    SUPER_ADMIN: "bg-purple-500/10 text-purple-500",
  };

  return (
    <span
      className={`px-2.5 py-1 text-xs font-semibold rounded-full border border-transparent ${styles[role] || "bg-gray-500/10 text-gray-500"}`}
    >
      {role?.replace("_", " ")}
    </span>
  );
};

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [pendingGyms, setPendingGyms] = useState([]);
  const [allGyms, setAllGyms] = useState([]);
  const [users, setUsers] = useState([]);

  // Search states
  const [gymSearch, setGymSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [statsRes, pendingRes, allRes, usersRes] = await Promise.all([
        api.get("/gyms/admin/stats"),
        api.get("/gyms/admin/pending"),
        api.get("/gyms/admin/all"),
        api.get("/auth/admin/users"),
      ]);
      setStats(statsRes.data);
      setPendingGyms(pendingRes.data);
      setAllGyms(allRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (gymId, status) => {
    try {
      await api.put(`/gyms/${gymId}/status`, { status });
      toast.success(`Gym ${status.toLowerCase()} successfully`);
      fetchAllData(); // refresh all data since stats might change
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const filteredGyms = allGyms.filter(
    (gym) =>
      gym.name.toLowerCase().includes(gymSearch.toLowerCase()) ||
      gym.address.toLowerCase().includes(gymSearch.toLowerCase()),
  );

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      user.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      user.role.toLowerCase().includes(userSearch.toLowerCase()),
  );

  if (loading && !stats) {
    return (
      <div className="flex justify-center items-center py-32">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const NavButton = ({ id, label, icon: Icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
        activeTab === id
          ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
          : "text-foreground/70 hover:bg-white/5 dark:hover:bg-white/5 hover:text-foreground"
      }`}
    >
      <Icon className="w-5 h-5" />
      {label}
      {id === "pending" && pendingGyms.length > 0 && (
        <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
          {pendingGyms.length}
        </span>
      )}
    </button>
  );

  return (
    <div className="flex flex-col md:flex-row gap-8 max-w-7xl mx-auto pb-12">
      {/* Sidebar */}
      <aside className="w-full md:w-64 shrink-0 flex flex-col gap-2 bg-card border border-border p-4 rounded-xl shadow-sm h-fit">
        <div className="flex items-center gap-3 mb-6 px-2 pt-2">
          <div className="bg-primary/20 p-2 rounded-lg">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Super Admin</h2>
        </div>

        <nav className="flex flex-col gap-1.5 flex-1">
          <NavButton id="overview" label="Overview" icon={LayoutDashboard} />
          <NavButton id="pending" label="Pending Approvals" icon={Clock} />
          <NavButton id="gyms" label="All Gyms" icon={Dumbbell} />
          <NavButton id="users" label="Users" icon={Users} />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && stats && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-2xl font-bold mb-6">Platform Overview</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Users"
                value={stats.totalUsers}
                icon={Users}
                color="text-blue-500"
                bg="bg-blue-500/10"
              />
              <StatCard
                title="Total Gyms"
                value={stats.totalGyms}
                icon={Building2}
                color="text-primary"
                bg="bg-primary/10"
              />
              <StatCard
                title="Pending Gyms"
                value={stats.pendingGyms}
                icon={Clock}
                color="text-yellow-500"
                bg="bg-yellow-500/10"
              />
              <StatCard
                title="Active Subs"
                value={stats.activeMemberships}
                icon={Activity}
                color="text-green-500"
                bg="bg-green-500/10"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-lg font-bold mb-5 flex items-center gap-2">
                  <Dumbbell className="w-5 h-5 text-primary" /> Gym Statistics
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-border pb-3">
                    <span className="text-foreground/70">
                      Approved & Active
                    </span>
                    <span className="font-semibold text-green-500">
                      {stats.approvedGyms}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-border pb-3">
                    <span className="text-foreground/70">Pending Review</span>
                    <span className="font-semibold text-yellow-500">
                      {stats.pendingGyms}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-1">
                    <span className="text-foreground/70">Total Registered</span>
                    <span className="font-semibold">{stats.totalGyms}</span>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-lg font-bold mb-5 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-500" /> User Distribution
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-border pb-3">
                    <span className="text-foreground/70">Regular Users</span>
                    <span className="font-semibold">{stats.regularUsers}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-border pb-3">
                    <span className="text-foreground/70">Gym Owners</span>
                    <span className="font-semibold text-primary">
                      {stats.gymOwners}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-1">
                    <span className="text-foreground/70">Total Accounts</span>
                    <span className="font-semibold">{stats.totalUsers}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PENDING TAB */}
        {activeTab === "pending" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-2xl font-bold mb-6">Pending Approvals</h1>
            {pendingGyms.length === 0 ? (
              <div className="text-center py-16 text-foreground/60 bg-card border-border rounded-xl border border-dashed flex flex-col items-center justify-center">
                <CheckCircle className="w-12 h-12 text-green-500 mb-4 opacity-50" />
                <h3 className="text-lg font-medium text-foreground">
                  All caught up!
                </h3>
                <p>No gyms are currently waiting for approval.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingGyms.map((gym) => (
                  <div
                    key={gym._id}
                    className="bg-card border border-border rounded-xl p-6 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center hover:border-primary/50 transition-colors"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold">{gym.name}</h3>
                        <StatusBadge status={gym.status} />
                      </div>
                      <p className="text-sm text-foreground/80 flex items-center gap-2">
                        {gym.address}
                      </p>
                      <div className="text-sm bg-background border border-border p-3 rounded-lg text-foreground/70 mt-3 line-clamp-2">
                        {gym.description}
                      </div>
                      <div className="text-sm font-medium pt-2 flex items-center gap-4">
                        <span>
                          Fee:{" "}
                          <span className="text-primary font-bold">
                            ₹{gym.monthlySubscriptionFee}/mo
                          </span>
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-row md:flex-col gap-3 shrink-0 w-full md:w-auto mt-4 md:mt-0">
                      <button
                        onClick={() => handleStatusUpdate(gym._id, "APPROVED")}
                        className="flex-1 md:flex-none flex justify-center items-center gap-2 bg-green-500/10 text-green-500 hover:bg-green-500/20 border border-transparent hover:border-green-500/20 px-5 py-2.5 rounded-lg transition-all font-medium"
                      >
                        <CheckCircle className="h-4 w-4" /> Approve
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(gym._id, "REJECTED")}
                        className="flex-1 md:flex-none flex justify-center items-center gap-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-transparent hover:border-red-500/20 px-5 py-2.5 rounded-lg transition-all font-medium"
                      >
                        <XCircle className="h-4 w-4" /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ALL GYMS TAB */}
        {activeTab === "gyms" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h1 className="text-2xl font-bold">All Gyms Directory</h1>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/50" />
                <input
                  type="text"
                  placeholder="Search gyms..."
                  value={gymSearch}
                  onChange={(e) => setGymSearch(e.target.value)}
                  className="w-full sm:w-64 bg-card border border-border rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
                />
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border">
                      <th className="px-6 py-4 font-semibold text-sm">
                        Gym Name
                      </th>
                      <th className="px-6 py-4 font-semibold text-sm hidden md:table-cell">
                        Address
                      </th>
                      <th className="px-6 py-4 font-semibold text-sm">Fee</th>
                      <th className="px-6 py-4 font-semibold text-sm">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredGyms.length > 0 ? (
                      filteredGyms.map((gym) => (
                        <tr
                          key={gym._id}
                          className="hover:bg-white/5 dark:hover:bg-white/5 transition-colors group"
                        >
                          <td className="px-6 py-4">
                            <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                              {gym.name}
                            </div>
                            <div className="font-normal text-xs text-foreground/60 md:hidden mt-1">
                              {gym.address}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground/70 hidden md:table-cell max-w-[200px] truncate">
                            {gym.address}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium">
                            ₹{gym.monthlySubscriptionFee}
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={gym.status} />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="4"
                          className="px-6 py-12 text-center text-foreground/60"
                        >
                          No gyms found matching your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === "users" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h1 className="text-2xl font-bold">User Management</h1>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/50" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full sm:w-64 bg-card border border-border rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
                />
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border">
                      <th className="px-6 py-4 font-semibold text-sm">Name</th>
                      <th className="px-6 py-4 font-semibold text-sm">Email</th>
                      <th className="px-6 py-4 font-semibold text-sm hidden sm:table-cell">
                        Phone
                      </th>
                      <th className="px-6 py-4 font-semibold text-sm text-right sm:text-left">
                        Role
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <tr
                          key={user._id}
                          className="hover:bg-white/5 dark:hover:bg-white/5 transition-colors group"
                        >
                          <td className="px-6 py-4 font-medium">{user.name}</td>
                          <td className="px-6 py-4 text-sm text-foreground/70">
                            {user.email}
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground/70 hidden sm:table-cell">
                            {user.phone || "-"}
                          </td>
                          <td className="px-6 py-4 text-right sm:text-left">
                            <RoleBadge role={user.role} />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="4"
                          className="px-6 py-12 text-center text-foreground/60"
                        >
                          No users found matching your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
