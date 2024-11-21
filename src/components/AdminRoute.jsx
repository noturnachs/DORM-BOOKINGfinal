import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AdminLayout from "./AdminLayout";

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!user || user.role !== "admin") {
    return <Navigate to="/login" />;
  }

  return <AdminLayout>{children}</AdminLayout>;
};

export default AdminRoute;
