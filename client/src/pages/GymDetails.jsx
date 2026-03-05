import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/api";
import toast from "react-hot-toast";
import {
  MapPin,
  CheckCircle2,
  AlertCircle,
  Star,
  StarHalf,
  MessageSquare,
  X,
  Phone,
  Mail,
  Globe,
  User as UserIcon,
  Calendar,
  Users,
  ArrowLeft,
  Heart,
  Share2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const GymDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [gym, setGym] = useState(null);
  const [plans, setPlans] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);

  // UI Tabs
  const [activeTab, setActiveTab] = useState("facilities");

  // Review states
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchGymData = async () => {
      try {
        const gymRes = await api.get(`/gyms/${id}`);
        setGym(gymRes.data);

        const plansRes = await api.get(`/plans/gym/${id}`);
        setPlans(plansRes.data);

        const reviewsRes = await api.get(`/reviews/gym/${id}`);
        setReviews(reviewsRes.data);
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to load details");
      } finally {
        setLoading(false);
      }
    };

    fetchGymData();
  }, [id]);

  const handleCheckout = async (planId) => {
    if (!user) {
      toast.error("Please login to purchase a membership");
      navigate("/login");
      return;
    }

    setProcessingPayment(true);
    try {
      const { data: order } = await api.post("/memberships/checkout", {
        planId,
        gymId: id,
      });

      if (order.isMock) {
        toast.success("Test Mode: Simulating payment...");
        await api.post("/memberships/verify", {
          razorpay_order_id: order.id,
          razorpay_payment_id: "mock_payment_id",
          razorpay_signature: "mock_signature",
          planId,
          gymId: id,
        });
        toast.success("Payment successful! Membership activated.");
        navigate("/dashboard");
        return;
      }

      const checkKey = import.meta.env.VITE_RAZORPAY_KEY_ID || "test_key";
      if (checkKey === "test_key") {
        toast.error("VITE_RAZORPAY_KEY_ID is missing. Cannot load checkout.");
        setProcessingPayment(false);
        return;
      }

      const options = {
        key: checkKey,
        amount: order.amount,
        currency: order.currency,
        name: gym.name,
        description: "Gym Membership Purchase",
        order_id: order.id,
        handler: async function (response) {
          try {
            const verifyData = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planId,
              gymId: id,
            };

            await api.post("/memberships/verify", verifyData);
            toast.success("Payment successful! Membership activated.");
            navigate("/dashboard");
          } catch (error) {
            toast.error(
              error.response?.data?.message || "Payment verification failed",
            );
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phone,
        },
        theme: { color: "#e11d48" },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
        toast.error(`Payment Failed: ${response.error.description}`);
      });
      rzp.open();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Payment initialization failed",
      );
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("You must be logged in to leave a review.");
      return;
    }

    setSubmittingReview(true);
    try {
      const { data } = await api.post("/reviews", {
        gymId: id,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      });

      toast.success("Review submitted successfully!");
      setReviews([data, ...reviews]);
      setShowReviewModal(false);

      setGym((prev) => ({
        ...prev,
        ratings: {
          count: prev.ratings.count + 1,
          average:
            prev.ratings.average === 0
              ? reviewForm.rating
              : (prev.ratings.average * prev.ratings.count +
                  parseInt(reviewForm.rating)) /
                (prev.ratings.count + 1),
        },
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit review.");
    } finally {
      setSubmittingReview(false);
      setReviewForm({ rating: 5, comment: "" });
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (rating >= i) {
        stars.push(
          <Star
            key={i}
            className="w-4 h-4 text-emerald-500 fill-emerald-500"
          />,
        );
      } else if (rating >= i - 0.5) {
        stars.push(
          <StarHalf
            key={i}
            className="w-4 h-4 text-emerald-500 fill-emerald-500"
          />,
        );
      } else {
        stars.push(<Star key={i} className="w-4 h-4 text-zinc-600" />);
      }
    }
    return stars;
  };

  if (loading)
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  if (!gym) return <div className="text-center p-12">Gym not found.</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* ---------- HERO SECTION ---------- */}
      <div className="h-80 sm:h-[450px] w-full relative sm:rounded-b-3xl sm:-mt-8 mb-8 overflow-hidden shadow-2xl group">
        {gym.images && gym.images[0] ? (
          <img
            src={gym.images[0]}
            alt={gym.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-800 text-zinc-500">
            No Image provided.
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20"></div>

        {/* Top Header Controls */}
        <div className="absolute top-6 left-6 right-6 flex justify-between items-start">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/90 hover:text-white transition-colors bg-black/20 hover:bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex gap-2">
            <button className="flex items-center gap-1.5 bg-white text-black hover:bg-zinc-200 transition-colors px-4 py-1.5 rounded-full text-sm font-bold shadow-lg">
              <Heart className="w-4 h-4" /> Save
            </button>
            <button className="flex items-center gap-1.5 bg-white text-black hover:bg-zinc-200 transition-colors px-4 py-1.5 rounded-full text-sm font-bold shadow-lg">
              <Share2 className="w-4 h-4" /> Share
            </button>
          </div>
        </div>

        {/* Bottom Details Anchored */}
        <div className="absolute bottom-10 left-8 right-8 flex flex-col items-start gap-4">
          <div className="flex gap-2">
            <span className="bg-emerald-500 text-white px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider relative overflow-hidden">
              <span className="relative z-10">Open Now</span>
              <span className="absolute inset-0 bg-white/20 animate-pulse"></span>
            </span>
            <span className="bg-white/20 text-white backdrop-blur-md px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">
              Premium Gym
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight drop-shadow-lg">
            {gym.name}
          </h1>

          <div className="flex items-center text-gray-200 text-lg">
            <MapPin className="h-5 w-5 mr-2 text-emerald-500" />
            <span>{gym.address}</span>
          </div>

          {gym.ratings && gym.ratings.count > 0 && (
            <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex items-center gap-3">
              <div className="flex gap-1">
                {renderStars(gym.ratings.average)}
              </div>
              <div className="text-white font-bold">
                {gym.ratings.average.toFixed(1)}
              </div>
              <div className="text-white/60 text-sm">({gym.ratings.count})</div>
            </div>
          )}
        </div>
      </div>

      {/* ---------- MAIN LAYOUT ---------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-4 sm:px-0">
        {/* LEFT COLUMN - CONTENT */}
        <div className="lg:col-span-2 space-y-8">
          {/* About Section */}
          <section className="bg-white rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-emerald-500 rounded-full inline-block"></span>
              About This Branch
            </h2>
            <p className="text-gray-600 leading-relaxed text-lg mb-8">
              {gym.description}
            </p>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-5 flex flex-col items-center justify-center text-center">
                <Calendar className="w-6 h-6 text-emerald-600 mb-2" />
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                  Established
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {gym.establishedYear || "N/A"}
                </p>
              </div>
              <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-5 flex flex-col items-center justify-center text-center">
                <Users className="w-6 h-6 text-emerald-600 mb-2" />
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                  Capacity
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {gym.capacity || "N/A"}
                </p>
              </div>
            </div>
          </section>

          {/* Navigation Tabs Container */}
          <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
            <div className="flex w-full border-b border-gray-100 text-sm font-bold bg-zinc-50/50 overflow-x-auto">
              {["facilities", "gallery", "plans", "reviews"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 min-w-[100px] py-4 px-2 tracking-wide uppercase transition-colors relative ${activeTab === tab ? "text-emerald-600" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}
                >
                  {tab}
                  {activeTab === tab && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-t-xl shadow-[0_-2px_8px_rgba(16,185,129,0.5)]"></div>
                  )}
                </button>
              ))}
            </div>

            <div className="p-8 min-h-[400px]">
              {/* Facilities Tab */}
              {activeTab === "facilities" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-gray-900">
                  <h3 className="text-xl font-bold mb-6">
                    Available Facilities
                  </h3>
                  {gym.amenities && gym.amenities.length > 0 ? (
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                      {gym.amenities.map((item, idx) => (
                        <li
                          key={idx}
                          className="flex items-center text-gray-600 font-medium bg-zinc-50 p-3 rounded-lg border border-zinc-100"
                        >
                          <CheckCircle2 className="h-5 w-5 text-emerald-500 mr-3 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 italic bg-gray-50 p-6 rounded-xl text-center">
                      No distinct facilities listed for this location.
                    </p>
                  )}
                </div>
              )}

              {/* Gallery Tab */}
              {activeTab === "gallery" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-gray-900">
                  <h3 className="text-xl font-bold mb-6 flex items-center justify-between">
                    Photo Gallery
                    <span className="text-sm font-medium text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                      {gym.images?.length || 0} Photos
                    </span>
                  </h3>
                  {gym.images && gym.images.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {gym.images.map((imgUrl, i) => (
                        <div
                          key={i}
                          className="aspect-square rounded-xl overflow-hidden bg-gray-100 group relative"
                        >
                          <img
                            src={imgUrl}
                            alt={`Gallery view ${i}`}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 bg-zinc-50 border border-zinc-100 rounded-2xl flex flex-col items-center">
                      <MapPin className="w-12 h-12 text-zinc-300 mb-3" />
                      <p className="text-gray-500 font-medium">
                        No gallery images available yet.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Plans Tab */}
              {activeTab === "plans" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-gray-900">
                  <h3 className="text-xl font-bold mb-6">Membership Plans</h3>
                  {plans.length === 0 ? (
                    <div className="bg-orange-50/50 p-6 rounded-2xl border border-orange-100 text-center text-orange-800 flex flex-col items-center gap-3">
                      <AlertCircle className="h-8 w-8 text-orange-400" />
                      <p className="font-medium">
                        No active membership plans available for this location
                        yet.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {plans.map((plan) => (
                        <div
                          key={plan._id}
                          className="border border-zinc-200 rounded-2xl p-6 hover:border-emerald-500/50 hover:shadow-lg transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-6 group bg-white"
                        >
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <h4 className="text-xl font-bold text-gray-900">
                                {plan.name}
                              </h4>
                              <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2 py-1 rounded-md border border-emerald-100">
                                {plan.durationInDays} DAYS
                              </span>
                            </div>
                            {plan.description && (
                              <p className="text-gray-500 text-sm mt-2 max-w-md">
                                {plan.description}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col sm:items-end shrink-0 pt-4 border-t sm:border-t-0 sm:pt-0 border-gray-100">
                            <div className="text-3xl font-extrabold text-emerald-600 mb-3">
                              ₹{plan.price}
                            </div>
                            <button
                              onClick={() => handleCheckout(plan._id)}
                              disabled={processingPayment}
                              className="w-full sm:w-auto bg-gray-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-600 transition-colors disabled:opacity-50"
                            >
                              {processingPayment
                                ? "Processing..."
                                : "Select Plan"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Reviews Tab */}
              {activeTab === "reviews" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-gray-900">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold">Member Feedback</h3>
                    {user && (
                      <button
                        onClick={() => setShowReviewModal(true)}
                        className="bg-zinc-100 text-zinc-900 hover:bg-emerald-50 hover:text-emerald-700 transition-colors px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Write Review
                      </button>
                    )}
                  </div>

                  {reviews.length === 0 ? (
                    <div className="text-center py-16 bg-zinc-50 border border-zinc-100 rounded-2xl">
                      <Star className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">
                        No reviews yet. Be the first to share your experience!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {reviews.map((review) => (
                        <div
                          key={review._id}
                          className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-lg border border-emerald-200">
                                {review.userId?.name?.charAt(0).toUpperCase() ||
                                  "U"}
                              </div>
                              <div>
                                <p className="font-bold text-gray-900">
                                  {review.userId?.name || "Anonymous User"}
                                </p>
                                <p className="text-xs text-gray-400 font-medium mt-0.5">
                                  {new Date(
                                    review.createdAt,
                                  ).toLocaleDateString(undefined, {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-0.5 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-100">
                              {renderStars(review.rating)}
                            </div>
                          </div>
                          <p className="text-gray-600 text-sm leading-relaxed pl-16">
                            {review.comment}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - STICKY SIDEBAR */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            {/* Contact Information Card */}
            <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 overflow-hidden">
              <div className="bg-gray-900 text-white p-5 flex items-center gap-3">
                <Phone className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-lg">Contact Information</h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600 shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wide mb-1">
                      Phone
                    </p>
                    <p className="font-medium text-gray-900">
                      {gym.contactPhone || "Not provided"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600 shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wide mb-1">
                      Email
                    </p>
                    <p className="font-medium text-gray-900">
                      {gym.contactEmail || "Not provided"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600 shrink-0">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wide mb-1">
                      Website
                    </p>
                    {gym.website ? (
                      <a
                        href={
                          gym.website.startsWith("http")
                            ? gym.website
                            : `https://${gym.website}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-emerald-600 hover:underline break-all"
                      >
                        {gym.website.replace(/^https?:\/\//, "")}
                      </a>
                    ) : (
                      <p className="font-medium text-gray-900">Not provided</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600 shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wide mb-1">
                      Address
                    </p>
                    <p className="font-medium text-gray-900 leading-snug">
                      {gym.address}
                    </p>
                  </div>
                </div>

                {gym.ownerId?.name && (
                  <div className="flex items-start gap-4 pt-4 border-t border-gray-100 mt-2">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wide mb-1">
                        Branch Manager
                      </p>
                      <p className="font-bold text-gray-900">
                        {gym.ownerId.name}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => {
                  setActiveTab("plans");
                  window.scrollTo({ top: 500, behavior: "smooth" });
                }}
                className="w-full bg-gray-900 text-white font-bold text-center py-4 rounded-xl shadow-[0_8px_20px_rgba(0,0,0,0.15)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.25)] hover:-translate-y-0.5 transition-all duration-300 border border-gray-800"
              >
                Join This Branch
              </button>
              <button className="w-full bg-white text-gray-900 font-bold text-center py-4 rounded-xl border-2 border-gray-200 hover:border-gray-900 hover:bg-gray-50 transition-colors duration-300">
                Book a Free Trial
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowReviewModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-2xl font-bold mb-1 text-gray-900">
              Write a Review
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              Share your experience at {gym.name}
            </p>

            <form onSubmit={handleReviewSubmit} className="space-y-6">
              <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100 flex flex-col items-center">
                <label className="block text-sm font-bold text-gray-600 mb-3 uppercase tracking-wider">
                  Tap to Rate
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() =>
                        setReviewForm({ ...reviewForm, rating: star })
                      }
                      className="focus:outline-none transition-transform hover:scale-110 p-1"
                    >
                      <Star
                        className={`w-10 h-10 ${reviewForm.rating >= star ? "text-yellow-400 fill-yellow-400 drop-shadow-sm" : "text-gray-300"}`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Your Experience
                </label>
                <textarea
                  required
                  rows={4}
                  value={reviewForm.comment}
                  onChange={(e) =>
                    setReviewForm({ ...reviewForm, comment: e.target.value })
                  }
                  className="w-full bg-white text-gray-900 border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none transition-shadow"
                  placeholder="What did you love? What could be improved?"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={submittingReview}
                className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 hover:shadow-emerald-600/40 transition-all disabled:opacity-50"
              >
                {submittingReview ? "Submitting..." : "Submit Review"}
              </button>
              <p className="text-xs text-gray-400 text-center mt-2 font-medium">
                Only verified members are allowed to leave reviews.
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GymDetails;
