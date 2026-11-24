/**
 * Dynamically resolves the active API base URL.
 * In production browser environments (such as *.vercel.app), automatically defaults
 * to the live production gateway (https://traffic-voice-api.vercel.app/api/v1) unless
 * an explicit remote NEXT_PUBLIC_API_URL is configured, preventing unintended localhost calls.
 */
export function getBaseUrl() {
  let url = "http://localhost:8000/api/v1";
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    const isLocal = hostname === "localhost" || hostname === "127.0.0.1";
    if (!isLocal) {
      if (process.env.NEXT_PUBLIC_RENDER_API_URL) {
        url = process.env.NEXT_PUBLIC_RENDER_API_URL;
      } else if (
        process.env.NEXT_PUBLIC_API_URL &&
        !process.env.NEXT_PUBLIC_API_URL.includes("localhost") &&
        !process.env.NEXT_PUBLIC_API_URL.includes("127.0.0.1")
      ) {
        url = process.env.NEXT_PUBLIC_API_URL;
      } else {
        url = "https://traffic-voice-api.vercel.app/api/v1";
      }
    }
  } else if (process.env.NEXT_PUBLIC_API_URL) {
    url = process.env.NEXT_PUBLIC_API_URL;
  }

  // Sanitize: remove trailing slash and ensure /api/v1 suffix without duplication
  url = url.replace(/\/+$/, "");
  if (!url.endsWith("/api/v1")) {
    url = `${url}/api/v1`;
  }
  return url;
}

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
  const baseUrl = getBaseUrl();

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  // If payload is FormData, delete Content-Type so browser sets multipart boundary
  if (options.body instanceof FormData) {
    delete headers["Content-Type"];
  }

  const url = endpoint.startsWith("http") ? endpoint : `${baseUrl}${endpoint}`;

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (netErr) {
    const isLocal = baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1");
    const connectionTip = isLocal
      ? "Please ensure your local FastAPI backend daemon is running on port 8000."
      : "The backend server is unreachable or CORS connection was blocked. The backend service may be offline, waking from sleep, or restarting.";
    const err = new Error(
      `Unable to connect to Central Traffic Server (${baseUrl}). ${connectionTip}`
    );
    err.isNetworkError = true;
    err.status = 0;
    throw err;
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

    // Specific HTTP status messaging according to statutory system specs
    if (!message) {
      if (response.status === 404) {
        message = "Citation record or endpoint not found in the verified registry (HTTP 404).";
      } else if (response.status === 401) {
        message = "Authentication required or session expired (HTTP 401). Please log in again.";
      } else if (response.status === 403) {
        message = "Access forbidden (HTTP 403). You do not have permission to access this citation record.";
      } else if (response.status === 500) {
        message = "Central Traffic Server Internal Error (HTTP 500). The backend service encountered an internal exception.";
      } else if (response.status === 502 || response.status === 503 || response.status === 504) {
        message = `Traffic service temporarily unavailable (HTTP ${response.status}). The server is starting up or overloaded.`;
      } else {
        message = `HTTP Error ${response.status}: ${response.statusText}`;
      }
    }

    const err = new Error(message);
    err.status = response.status;
    err.errorData = errorData;

    // Handle token invalidation / revocation
    if (response.status === 401 && typeof window !== "undefined") {
      if (token && !endpoint.includes("/auth/login") && !endpoint.includes("/auth/verify-otp")) {
        localStorage.removeItem("traffic_token");
        localStorage.removeItem("traffic_user");
      }
    }

    throw err;
  }

  return response.json();
}
