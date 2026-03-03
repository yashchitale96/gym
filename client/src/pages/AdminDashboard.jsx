import React, { useState, useEffect } from "react";
import api from "../utils/api";
import toast from "react-hot-toast";
import { ShieldCheck, XCircle, CheckCircle } from "lucide-react";

const AdminDashboard = () => {
  const [pendingGyms, setPendingGyms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingGyms();
  }, []);

  const fetchPendingGyms = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/gyms/admin/pending");
      setPendingGyms(data);
    } catch (error) {
      toast.error("Failed to load pending gyms");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (gymId, status) => {
    try {
      await api.put(`/gyms/${gymId}/status`, { status });
      toast.success(`Gym ${status.toLowerCase()} successfully`);
      fetchPendingGyms(); // Refresh list
    } catch (error) {
      toast.error("Failed to update status");
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
      <div className="flex items-center gap-3 mb-8">
        <ShieldCheck className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">
          Super Admin Control
        </h1>
      </div>

      <section className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          Pending Gym Approvals{" "}
          <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-full text-sm">
            {pendingGyms.length}
          </span>
        </h2>

        {pendingGyms.length === 0 ? (
          <div className="text-center py-12 text-foreground/60 border-2 border-dashed border-border rounded-xl">
            No pending gyms to review at the moment.
          </div>
        ) : (
          <div className="space-y-4">
            {pendingGyms.map((gym) => (
              <div
                key={gym._id}
                className="bg-background border border-border rounded-lg p-5 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center"
              >
                <div className="space-y-2 flex-1">
                  <h3 className="text-lg font-bold">{gym.name}</h3>
                  <p className="text-sm text-foreground/80">{gym.address}</p>
                  <div className="text-sm bg-zinc-800 p-3 rounded text-foreground/60 mt-2">
                    {gym.description}
                  </div>
                  <div className="text-sm font-medium pt-2">
                    Platform Fee:{" "}
                    <span className="text-primary">
                      ₹{gym.monthlySubscriptionFee}/mo
                    </span>
                  </div>
                </div>
                <div className="flex flex-row md:flex-col gap-3 shrink-0 w-full md:w-auto mt-4 md:mt-0">
                  <button
                    onClick={() => handleStatusUpdate(gym._id, "APPROVED")}
                    className="flex-1 md:flex-none flex justify-center items-center gap-2 bg-green-500/10 text-green-500 hover:bg-green-500/20 border border-green-500/20 px-4 py-2 rounded-md transition-colors font-medium"
                  >
                    <CheckCircle className="h-4 w-4" /> Approve
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(gym._id, "REJECTED")}
                    className="flex-1 md:flex-none flex justify-center items-center gap-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 px-4 py-2 rounded-md transition-colors font-medium"
                  >
                    <XCircle className="h-4 w-4" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminDashboard;
