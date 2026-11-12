import { fetchApi } from "./api";

export const citizenService = {
  // Get Citizen Dashboard payload
  getDashboard: () => fetchApi("/citizens/dashboard"),

  // Get user profile
  getProfile: () => fetchApi("/auth/me"),

  // Update preferred language
  updateLanguage: (language) =>
    fetchApi("/auth/preferred-language", {
      method: "PATCH",
      body: JSON.stringify({ language }),
    }),
};