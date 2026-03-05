import api from "./api";

const AnalyticsApi = {
  getGymInfo: async () => {
    const response = await api.get("/gyms/mygym");
    return response.data;
  },
  getPlans: async (gymId) => {
    const response = await api.get(`/plans/gym/${gymId}`);
    return response.data;
  },
  getAttendances: async (gymId) => {
    const response = await api.get(`/attendance/gym/${gymId}`);
    return response.data;
  },
  getMemberships: async (gymId) => {
    const response = await api.get(`/memberships/gym/${gymId}`);
    return response.data;
  },
  getRevenue: async (gymId) => {
    const response = await api.get(`/memberships/gym/${gymId}/revenue`);
    return response.data;
  },

  // Data transformation methods for charts
  getAnalyticsData: async (gymId) => {
    try {
      const [attendances, members, revenueData] = await Promise.all([
        api.get(`/attendance/gym/${gymId}`),
        api.get(`/memberships/gym/${gymId}`),
        api.get(`/memberships/gym/${gymId}/revenue`),
      ]);

      return {
        attendances: attendances.data,
        members: members.data,
        revenueData: revenueData.data,
      };
    } catch (error) {
      console.error("Error fetching analytics data", error);
      throw error;
    }
  },
};

export default AnalyticsApi;
