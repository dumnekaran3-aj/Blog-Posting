import { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Page reload hone pe bhi login state bani rahe, isliye localStorage se restore karte hain
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const signup = async ({ name, email, password }) => {
    const { data } = await api.post("/auth/signup", { name, email, password });
    return data; // OTP verify step frontend pe alag se hoga
  };

  const verifyOtp = async ({ email, otp }) => {
    const { data } = await api.post("/auth/verifyotp", { email, otp });
    return data;
  };

  const login = async ({ email, password }) => {
    const { data } = await api.post("/auth/signin", { email, password });
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signup, verifyOtp, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);