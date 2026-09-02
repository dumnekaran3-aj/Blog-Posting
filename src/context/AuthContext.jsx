import { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";
import { connectSocket, disconnectSocket } from "../services/socket";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null); // consumers re-render when this changes (e.g. NotificationBell)

  useEffect(() => {
    // Page reload hone pe bhi login state bani rahe, isliye localStorage se restore karte hain
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      if (token) setSocket(connectSocket(token));
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
    setSocket(connectSocket(data.token)); // real-time notifications/likes/comments turant shuru
    return data;
  };

  const updateProfile = async (payload) => {
    const { data } = await api.put("/auth/profile", payload);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const changePassword = async ({ currentPassword, newPassword }) => {
    // Password kabhi user/localStorage state mein store nahi karte —
    // sirf server ko bhejte hain, response mein bhi kuch save karne
    // layak nahi (koi token/user field return nahi hota is route se)
    const { data } = await api.put("/auth/change-password", { currentPassword, newPassword });
    return data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    disconnectSocket();
    setSocket(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, socket, signup, verifyOtp, login, updateProfile, changePassword, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);