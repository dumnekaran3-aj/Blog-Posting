import { createContext, useContext, useState, useEffect } from "react";
import adminApi from "../services/adminApi";

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("adminUser");
    if (stored) setAdmin(JSON.parse(stored));
    setLoading(false);
  }, []);

  // Step 1 — email + password. Returns setupRequired/qrCodeDataUrl/pendingToken,
  // does NOT log the admin in yet.
  const loginStep1 = async ({ email, password }) => {
    const { data } = await adminApi.post("/admin-auth/login", { email, password });
    return data;
  };

  // Step 2 — 6-digit TOTP code. Only this call actually establishes a session.
  const verify2FA = async ({ pendingToken, code }) => {
    const { data } = await adminApi.post("/admin-auth/verify-2fa", { pendingToken, code });
    localStorage.setItem("adminToken", data.token);
    localStorage.setItem("adminUser", JSON.stringify(data.admin));
    setAdmin(data.admin);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    setAdmin(null);
  };

  return (
    <AdminAuthContext.Provider value={{ admin, loading, loginStep1, verify2FA, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export const useAdminAuth = () => useContext(AdminAuthContext);