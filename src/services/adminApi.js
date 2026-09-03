import axios from "axios";

const adminApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true, // REQUIRED — sends the httpOnly cookie with every request
  headers: {
    // Required by the backend's CSRF protection (middleware/csrfProtection.js).
    "X-Requested-With": "XMLHttpRequest",
  },
});

// No Authorization header interceptor anymore — there is no token in JS
// memory or localStorage to attach. The browser sends the cookie automatically.

// Any 401 means the session is invalid/expired — force the UI back to a
// clean logged-out state instead of showing a stale dashboard with broken
// data (this is the exact bug we're fixing)
adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config.url.includes("/admin-auth/login") && !error.config.url.includes("/admin-auth/verify-2fa")) {
      window.dispatchEvent(new Event("admin-session-expired"));
    }
    return Promise.reject(error);
  }
);

export default adminApi;