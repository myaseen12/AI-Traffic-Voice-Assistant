const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

/**
 * Centralized, robust API client for Next.js frontend to communicate with FastAPI backend.
 * Features:
 * - Environment-based API base URL configuration
 * - Automatic JWT bearer token injection from localStorage
 * - Multipart/FormData boundary preservation for camera & file upload scans
 * - Comprehensive HTTP and validation error extraction
 * - Automatic 401 session invalidation handling
 */
export async function fetchApi(endpoint, options = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("traffic_token") : null;

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  // If payload is FormData, delete Content-Type so browser sets multipart boundary
  if (options.body instanceof FormData) {
    delete headers["Content-Type"];
  }

  const url = endpoint.startsWith("http") ? endpoint : `${BASE_URL}${endpoint}`;

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (netErr) {
    throw new Error(
      `Unable to connect to Central Traffic Server at ${BASE_URL}. Please ensure the backend is running.`
    );
  }

  if (!response.ok) {
    let errorData = {};
    try {
      errorData = await response.json();
    } catch (e) {
      // Body was not JSON
    }

    let message = errorData.detail;
    if (Array.isArray(message)) {
      message = message.map((m) => m.msg || JSON.stringify(m)).join(", ");
    } else if (typeof message === "object" && message !== null) {
      message = message.msg || JSON.stringify(message);
    }

    if (!message && errorData.validation_errors) {
      message = errorData.validation_errors
        .map((e) => `${e.loc?.slice(-1)[0] || "field"}: ${e.msg}`)
        .join("; ");
    }

    const finalMessage = message || `HTTP Error ${response.status}: ${response.statusText}`;

    // Handle token invalidation / revocation
    if (response.status === 401 && typeof window !== "undefined") {
      if (token && !endpoint.includes("/auth/login") && !endpoint.includes("/auth/verify-otp")) {
        localStorage.removeItem("traffic_token");
        localStorage.removeItem("traffic_user");
      }
    }

    const err = new Error(finalMessage);
    err.status = response.status;
    err.data = errorData;
    throw err;
  }

  return response.json();
}
