import React, { useState, useEffect } from "react";
import {
  Search,
  MapPin,
  IndianRupee,
  Navigation,
  Star,
  Users,
  Calendar,
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "../utils/api";
import toast from "react-hot-toast";

const GymList = () => {
  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [maxDistance, setMaxDistance] = useState("all"); // 'all', 5, 10, 20
  const [gettingLocation, setGettingLocation] = useState(false);

  const fetchGyms = async () => {
    setLoading(true);
    try {
      let url = "/gyms";
      const params = new URLSearchParams();

      if (userLocation && maxDistance !== "all") {
        params.append("lat", userLocation.lat);
        params.append("lng", userLocation.lng);
        params.append("maxDistance", maxDistance);
      }

      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }

      const { data } = await api.get(url);
      setGyms(data);
    } catch (error) {
      toast.error("Failed to load gyms");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGyms();
  }, [userLocation, maxDistance]);

  const handleGetLocation = () => {
    setGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setGettingLocation(false);
          toast.success("Location found. Viewing nearby gyms.");
        },
        (error) => {
          setGettingLocation(false);
          toast.error(
            "Failed to get location. Please allow location access in your browser.",
          );
        },
        { timeout: 10000 },
      );
    } else {
      setGettingLocation(false);
      toast.error("Geolocation is not supported by this browser.");
    }
  };

  const filteredGyms = gyms.filter(
    (gym) =>
      gym.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gym.address.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading)
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2">
            Discover <span className="text-gradient">Gyms</span>
          </h1>
          <p className="text-lg text-foreground/60">
            Find the perfect fitness center near you.
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-80 group">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/40 group-focus-within:text-primary transition-colors z-10" />
            <input
              type="text"
              placeholder="Search by name or address..."
              className="relative w-full pl-12 pr-4 py-3 bg-black/40 border border-white/10 rounded-full focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 backdrop-blur-md transition-all z-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            {!userLocation && maxDistance !== "all" ? (
              <button
                onClick={handleGetLocation}
                disabled={gettingLocation}
                className="bg-primary/20 text-primary hover:bg-primary/30 px-4 py-3 rounded-full flex items-center justify-center gap-2 font-medium transition-colors disabled:opacity-50 min-w-[140px]"
              >
                {gettingLocation ? (
                  <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                ) : (
                  <>
                    <Navigation className="h-4 w-4" /> Locate Me
                  </>
                )}
              </button>
            ) : null}

            <select
              value={maxDistance}
              onChange={(e) => {
                const val = e.target.value;
                setMaxDistance(val);
                if (val !== "all" && !userLocation) {
                  // If changing to a distance and don't have location yet, trigger it
                  handleGetLocation();
                }
              }}
              className="bg-black/40 border border-white/10 rounded-full px-4 py-3 text-sm focus:outline-none focus:border-primary/50 backdrop-blur-md appearance-none"
            >
              <option value="all">Everywhere</option>
              <option value="5">Within 5 km</option>
              <option value="10">Within 10 km</option>
              <option value="25">Within 25 km</option>
            </select>
          </div>
        </div>
      </div>

      {filteredGyms.length === 0 ? (
        <div className="text-center py-12 text-foreground/60">
          No gyms found matching your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 text-foreground/60 lg:grid-cols-3 gap-6">
          {filteredGyms.map((gym) => (
            <Link
              to={`/gyms/${gym._id}`}
              key={gym._id}
              className="group block h-full"
            >
              <div className="glass-card rounded-2xl overflow-hidden hover:border-primary/50 hover:shadow-[0_0_20px_rgba(225,29,72,0.15)] hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
                <div className="h-48 bg-zinc-800 relative">
                  {gym.images && gym.images[0] ? (
                    <img
                      src={gym.images[0]}
                      alt={gym.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-zinc-600">
                      No Image provided.
                    </div>
                  )}
                  {/* Rating Badge Overlay */}
                  {gym.ratings && gym.ratings.count > 0 && (
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/20 flex items-center gap-1.5 shadow-lg z-10">
                      <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                      <span className="text-white text-xs font-bold">
                        {gym.ratings.average.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors line-clamp-1">
                    {gym.name}
                  </h3>
                  <div className="flex items-start text-foreground/60 text-sm mb-3 line-clamp-2">
                    <MapPin className="h-4 w-4 mr-1 mt-0.5 shrink-0" />
                    <span>{gym.address}</span>
                  </div>

                  {/* Quick Stats Row */}
                  <div className="flex items-center gap-4 mb-4 text-xs text-foreground/50 font-medium">
                    {gym.establishedYear && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-primary/70" />
                        <span>Est. {gym.establishedYear}</span>
                      </div>
                    )}
                    {gym.capacity && (
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-primary/70" />
                        <span>Up to {gym.capacity}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center text-primary font-medium">
                      <IndianRupee className="h-4 w-4 mr-1" />
                      <span>{gym.monthlySubscriptionFee} / mo</span>
                    </div>
                    <span className="text-sm font-medium bg-primary/10 text-primary border border-primary/20 px-4 py-2 rounded-lg group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                      View Details
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default GymList;
