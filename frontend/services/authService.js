import { fetchApi } from "./api";

export const authService = {
  // Request 6-digit OTP for citizen phone
  sendOtp: async (phoneNumber) => {
    const cleanPhone = phoneNumber.replace(/[\s-]/g, "");
    return fetchApi("/auth/send-otp", {
      method: "POST",
      body: JSON.stringify({ phone_number: cleanPhone }),
    });
  },

  // Verify OTP and retrieve access JWT + user profile
  verifyOtp: async (phoneNumber, otpCode) => {
    const cleanPhone = phoneNumber.replace(/[\s-]/g, "");
    return fetchApi("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({
        phone_number: cleanPhone,
        otp: otpCode.trim(),
      }),
    });
  },

  // Password-based login for officers / admins
  loginWithPassword: async (identifier, password) => {
    const cleanId = identifier.trim();
    return fetchApi("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        phone_number: cleanId.includes("@") || cleanId.startsWith("TP-") ? null : cleanId,
        email: cleanId.includes("@") || cleanId.startsWith("TP-") ? cleanId : null,
        password: password,
      }),
    });
  },

  // Dedicated admin login
  adminLogin: async (emailOrBadge, password) => {
    return fetchApi("/auth/admin/login", {
      method: "POST",
      body: JSON.stringify({
        email_or_badge: emailOrBadge.trim(),
        password: password,
      }),
    });
  },

  // Securely revoke current JWT token on backend
  logout: async () => {
    try {
      return await fetchApi("/auth/logout", {
        method: "POST",
      });
    } catch (e) {
      // Even if token was already revoked/expired, allow client cleanup
      return { status: "success", message: "Client session cleared" };
    }
  },

  // Get current authenticated user profile
  getMe: async () => {
    return fetchApi("/auth/me", {
      method: "GET",
    });
  },

  // Update preferred language for authenticated user
  updatePreferredLanguage: async (language) => {
    return fetchApi("/auth/preferred-language", {
      method: "PATCH",
      body: JSON.stringify({ language }),
    });
  },
};
