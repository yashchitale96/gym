import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import api from "../utils/api";
import toast from "react-hot-toast";
import { Calendar, CreditCard, Clock } from "lucide-react";

const UserDashboard = () => {
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMemberships = async () => {
      try {
        const { data } = await api.get("/memberships/my");
        setMemberships(data);
      } catch (error) {
        toast.error("Failed to load memberships");
      } finally {
        setLoading(false);
      }
    };

    fetchMemberships();
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

      <section>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <CreditCard className="text-primary" /> Active Memberships
        </h2>
        {activeMemberships.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center text-foreground/60">
            You don't have any active memberships. Visit the Discover page to
            find a gym.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {activeMemberships.map((m) => (
              <div
                key={m._id}
                className="bg-card border border-border rounded-xl p-6 flex flex-col md:flex-row gap-6 items-center md:items-start"
              >
                <div className="bg-white p-2 rounded-lg shrink-0">
                  <QRCodeSVG value={m.qrCodeString} size={150} level={"H"} />
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
                    <p className="text-sm font-medium">Plan: {m.planId.name}</p>
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
  );
};

export default UserDashboard;
