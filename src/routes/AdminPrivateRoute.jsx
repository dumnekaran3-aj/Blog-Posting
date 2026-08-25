import { Navigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";

export default function AdminPrivateRoute({ children }) {
  const { admin, loading } = useAdminAuth();

  if (loading) return null;
  if (!admin) return <Navigate to="/admin/login" replace />;

  return children;
}