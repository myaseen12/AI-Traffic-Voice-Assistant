import { fetchApi } from "./api";

export const adminService = {
  // Dashboard Overview Metrics
  getDashboard: () => fetchApi("/admin/dashboard"),

  // Master Challans List with search, status filter, and pagination
  getChallans: (params = {}) => {
    const query = new URLSearchParams();
    if (params.status && params.status !== "ALL") query.append("status", params.status);
    if (params.search) query.append("search", params.search);
    if (params.skip !== undefined) query.append("skip", params.skip);
    if (params.limit !== undefined) query.append("limit", params.limit);
    const qs = query.toString();
    return fetchApi(`/admin/challans${qs ? `?${qs}` : ""}`);
  },

  // Update Challan Status (PAID, CANCELLED, DISPUTED, PENDING)
  updateChallanStatus: (challanId, status, remarks = "") =>
    fetchApi(`/admin/challans/${challanId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, remarks }),
    }),

  // Manage Citizens
  getCitizens: (search = "") => {
    const qs = search ? `?search=${encodeURIComponent(search)}` : "";
    return fetchApi(`/admin/citizens${qs}`);
  },

  // Manage Traffic Rules (New Dedicated Statutory Endpoints)
  getTrafficRules: (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append("search", params.search);
    if (params.category && params.category !== "ALL") query.append("category", params.category);
    if (params.jurisdiction && params.jurisdiction !== "ALL") query.append("jurisdiction", params.jurisdiction);
    if (params.status && params.status !== "ALL") query.append("status", params.status);
    if (params.skip !== undefined) query.append("skip", params.skip);
    if (params.limit !== undefined) query.append("limit", params.limit);
    const qs = query.toString();
    return fetchApi(`/admin/traffic-rules${qs ? `?${qs}` : ""}`);
  },

  createTrafficRule: (ruleData) =>
    fetchApi("/admin/traffic-rules", {
      method: "POST",
      body: JSON.stringify(ruleData),
    }),

  updateTrafficRule: (id, ruleData) =>
    fetchApi(`/admin/traffic-rules/${id}`, {
      method: "PUT",
      body: JSON.stringify(ruleData),
    }),

  verifyTrafficRule: (id, verificationData) =>
    fetchApi(`/admin/traffic-rules/${id}/verify`, {
      method: "PATCH",
      body: JSON.stringify(verificationData),
    }),

  deleteTrafficRule: (id) =>
    fetchApi(`/admin/traffic-rules/${id}`, {
      method: "DELETE",
    }),

  // Legacy Violations Compatibility
  getViolations: () => fetchApi("/admin/violations"),

  createViolation: (ruleData) =>
    fetchApi("/admin/violations", {
      method: "POST",
      body: JSON.stringify(ruleData),
    }),

  updateViolation: (id, ruleData) =>
    fetchApi(`/admin/violations/${id}`, {
      method: "PUT",
      body: JSON.stringify(ruleData),
    }),

  deleteViolation: (id) =>
    fetchApi(`/admin/violations/${id}`, {
      method: "DELETE",
    }),

  // Assistant & AI Usage Analytics
  getAssistantStats: () => fetchApi("/admin/assistant-stats"),

  // Knowledge Base & ChromaDB RAG
  getKnowledgeBase: () => fetchApi("/admin/knowledge-base"),

  reindexKnowledgeBase: () =>
    fetchApi("/admin/knowledge-base/reindex", {
      method: "POST",
    }),

  // System Settings
  getSettings: () => fetchApi("/admin/settings"),

  updateSettings: (settingsData) =>
    fetchApi("/admin/settings", {
      method: "PUT",
      body: JSON.stringify(settingsData),
    }),
};
