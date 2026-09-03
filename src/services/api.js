import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true, // REQUIRED — sends the httpOnly auth cookie with every request
  headers: {
    // Required by the backend's CSRF protection (middleware/csrfProtection.js).
    // A plain HTML form can't set this, so it doubles as a check that the
    // request actually came from our own JS, not a forged cross-site form.
    "X-Requested-With": "XMLHttpRequest",
  },
});

// No Authorization header interceptor anymore — there is no token in JS
// memory or localStorage to attach. The browser sends the httpOnly cookie
// automatically on every request.

// Any 401 on an authenticated route means the session is invalid/expired —
// force the UI back to a clean logged-out state instead of showing stale
// data. Auth endpoints themselves are excluded since a 401 there (e.g. a
// stale /auth/me check on first load) is expected, not a "session died
// mid-use" event.
const AUTH_ENDPOINTS = ["/auth/signin", "/auth/signup", "/auth/verifyotp", "/auth/forgot-password", "/auth/reset-password", "/auth/me"];

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || "";
    if (error.response?.status === 401 && !AUTH_ENDPOINTS.some((path) => url.includes(path))) {
      window.dispatchEvent(new Event("user-session-expired"));
    }
    return Promise.reject(error);
  }
);

export default api;