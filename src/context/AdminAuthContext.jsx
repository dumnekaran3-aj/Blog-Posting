import { createContext, useContext, useState, useEffect } from "react";
import adminApi from "../services/adminApi";
import { ADMIN_PATH } from "../constants/adminPath";

const AdminAuthContext = createContext(null);

// Admin panel ke alawa kisi bhi public page (Home, BlogDetail, etc.) pe
// ye check chalne ki zaroorat nahi — normal reader kabhi admin route
// dekhega hi nahi. Path-check se unnecessary 401 aur ek extra network
// call har page load pe bach jati hai.
const isOnAdminRoute = () => window.location.pathname.startsWith(`/${ADMIN_PATH}`);

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(isOnAdminRoute());

  // On every app load, ASK THE SERVER if the session is still valid —
  // never trust anything stored client-side. This is what fixes "yesterday's
  // login still shows the dashboard" — a real check replaces a stale flag.
  const checkSession = async () => {
    try {
      const { data } = await adminApi.get("/admin-auth/me");
      setAdmin(data.admin);
    } catch (err) {
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOnAdminRoute()) {
      checkSession();
    }

    // If any API call anywhere in the admin panel gets a 401 mid-session
    // (cookie expired while browsing), snap back to logged-out immediately
    const handleExpired = () => setAdmin(null);
    window.addEventListener("admin-session-expired", handleExpired);
    return () => window.removeEventListener("admin-session-expired", handleExpired);
  }, []);

  const loginStep1 = async ({ email, password }) => {
    const { data } = await adminApi.post("/admin-auth/login", { email, password });
    return data;
  };

  const verify2FA = async ({ pendingToken, code }) => {
    // Server sets the httpOnly cookie via Set-Cookie — nothing to store here manually
    const { data } = await adminApi.post("/admin-auth/verify-2fa", { pendingToken, code });
    setAdmin(data.admin);
    return data;
  };

  const logout = async () => {
    try {
      await adminApi.post("/admin-auth/logout");
    } catch (err) {
      // even if the network call fails, clear local state so the UI doesn't get stuck
    }
    setAdmin(null);
  };

  return (
    <AdminAuthContext.Provider value={{ admin, loading, loginStep1, verify2FA, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export const useAdminAuth = () => useContext(AdminAuthContext);