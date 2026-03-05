import React, { useState, useEffect } from "react";
import api from "../utils/api";
import toast from "react-hot-toast";
import { Users, ClipboardList, Activity } from "lucide-react";

const TrainerDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    fetchAssignedMembers();
  }, []);

  const fetchAssignedMembers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/trainers/my-members");
      setMembers(data);
    } catch (error) {
      toast.error("Failed to load your assigned members.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center gap-3 border-b border-border pb-6">
        <div className="bg-primary/20 p-3 rounded-xl border border-primary/30">
          <ClipboardList className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Trainer Dashboard
          </h1>
          <p className="text-foreground/60 text-sm mt-1">
            Manage your personal training clients
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border p-6 rounded-xl flex items-center gap-4">
          <div className="bg-blue-500/10 p-4 rounded-full text-blue-500">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground/60">
              Active Clients
            </p>
            <h3 className="text-2xl font-bold">{members.length}</h3>
          </div>
        </div>
      </div>

      <section>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" /> My Assigned Members
        </h2>

        {members.length === 0 ? (
          <div className="bg-card border-2 border-dashed border-border p-12 rounded-xl text-center text-foreground/60">
            <p>No members have been assigned to you yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {members.map((member) => (
              <div
                key={member._id}
                className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-bold">{member.userId?.name}</h3>
                    <p className="text-sm text-foreground/60">
                      {member.userId?.email}
                    </p>
                    <p className="text-sm text-foreground/60">
                      {member.userId?.phone}
                    </p>
                  </div>
                  <span className="bg-green-500/10 text-green-500 border border-green-500/20 px-2 py-0.5 rounded text-xs font-bold uppercase">
                    Active
                  </span>
                </div>
                <div className="bg-background rounded-lg p-3 border border-border mt-4">
                  <p className="text-xs text-foreground/50 uppercase tracking-wider font-semibold mb-1">
                    Plan Enrolled
                  </p>
                  <p className="font-medium">
                    {member.planId?.name || "Unknown Plan"}
                  </p>
                  <p className="text-sm text-foreground/70 mt-1">
                    Ends: {new Date(member.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default TrainerDashboard;
