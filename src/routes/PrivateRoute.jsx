import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Wraps any page that requires login. Usage in App.jsx:
// <Route path="/create" element={<PrivateRoute><CreatePost /></PrivateRoute>} />
export default function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return null; // avoid flashing a redirect while auth state is still loading from localStorage

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}