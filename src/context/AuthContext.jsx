import { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";
import { connectSocket, disconnectSocket } from "../services/socket";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null); // consumers re-render when this changes (e.g. NotificationBell)

  // unreadCount YAHAN AuthContext mein rehta hai, NotificationBell ke andar
  // nahi — kyunki AuthProvider poori app ki lifetime mein sirf EK BAAR mount
  // hota hai (App.jsx mein Router ke bahar), jabki Navbar (aur andar
  // NotificationBell) HAR PAGE apna khud ka instance render karta hai, jo
  // har navigation pe unmount+remount hota hai. Pehle unreadCount fetch +
  // 30s polling NotificationBell ke andar tha, isliye har click/navigation
  // pe ek NAYA fetch + naya interval start ho raha tha — yehi "har click pe
  // API hit" wala bug tha. Ab ye sirf login hone par EK BAAR set hota hai.
  const [unreadCount, setUnreadCount] = useState(0);

  // On every app load, ASK THE SERVER if the session cookie is still
  // valid — never trust anything stored client-side. The JWT lives in an
  // httpOnly cookie now (JS can't read it to check), so this is the only
  // way to know whether the user is actually logged in.
  const checkSession = async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data.user);
      setSocket(connectSocket()); // cookie goes automatically with the socket handshake
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();

    // If any API call anywhere in the app gets a 401 mid-session (cookie
    // expired while browsing), snap back to logged-out immediately.
    const handleExpired = () => {
      setUser(null);
      disconnectSocket();
      setSocket(null);
    };
    window.addEventListener("user-session-expired", handleExpired);
    return () => window.removeEventListener("user-session-expired", handleExpired);
  }, []);

  // Unread-count fetch + 30s poll — sirf EK BAAR set hota hai jab user
  // login state badalta hai (login/logout), navigation pe NAHI (AuthProvider
  // khud kabhi remount nahi hota, isliye ye effect bhi baar-baar nahi chalta)
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    const fetchCount = async () => {
      try {
        const { data } = await api.get("/notifications/unread-count");
        setUnreadCount(data.count);
      } catch (err) {
        // fail silently — badge just won't update this cycle
      }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  // Real-time — naya follow/comment/reply/new-post turant badge update kar
  // deta hai, 30s polling ka wait nahi karna padta. Ye bhi yahan hai (socket
  // instance ki poori lifetime ke liye ek hi listener), Navbar ke baar-baar
  // remount hone se dobara register nahi hota.
  useEffect(() => {
    if (!socket) return;
    const handleUnreadCount = (count) => setUnreadCount(count);
    socket.on("notification:unread-count", handleUnreadCount);
    return () => socket.off("notification:unread-count", handleUnreadCount);
  }, [socket]);

  const signup = async ({ name, email, password }) => {
    const { data } = await api.post("/auth/signup", { name, email, password });
    return data; // OTP verify step frontend pe alag se hoga
  };

  const verifyOtp = async ({ email, otp }) => {
    const { data } = await api.post("/auth/verifyotp", { email, otp });
    return data;
  };

  const login = async ({ email, password }) => {
    // Server sets the httpOnly cookie via Set-Cookie — nothing to store here manually
    const { data } = await api.post("/auth/signin", { email, password });
    setUser(data.user);
    setSocket(connectSocket()); // real-time notifications/likes/comments turant shuru
    return data;
  };

  const updateProfile = async (payload) => {
    const { data } = await api.put("/auth/profile", payload);
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

  const forgotPassword = async ({ email }) => {
    const { data } = await api.post("/auth/forgot-password", { email });
    return data;
  };

  const resetPassword = async ({ email, otp, newPassword }) => {
    const { data } = await api.post("/auth/reset-password", { email, otp, newPassword });
    return data;
  };

  const logout = async () => {
    try {
      await api.post("/auth/signout"); // clears the httpOnly cookie server-side
    } catch (err) {
      // even if the network call fails, clear local state so the UI doesn't get stuck
    }
    disconnectSocket();
    setSocket(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        socket,
        unreadCount,
        setUnreadCount,
        signup,
        verifyOtp,
        login,
        updateProfile,
        changePassword,
        forgotPassword,
        resetPassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);