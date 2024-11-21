import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AdminLayout = ({ children }) => {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => {
    return location.pathname === path ? "bg-blue-700" : "";
  };

  return (
    <div className="min-h-screen bg-[#192734] flex">
      {/* Sidebar */}
      <div className="w-64 bg-[#22303C] border-r border-[#2F3336]">
        <div className="h-16 flex items-center justify-center border-b border-[#2F3336]">
          <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
        </div>
        <nav className="mt-6">
          <div className="px-4 space-y-2">
            <Link
              to="/admin/dashboard"
              className={`flex items-center px-4 py-2 text-gray-100 rounded-lg hover:bg-blue-600 transition-colors ${isActive(
                "/admin/dashboard"
              )}`}
            >
              <span className="mx-4">Dashboard</span>
            </Link>
            <Link
              to="/admin/dorms"
              className={`flex items-center px-4 py-2 text-gray-100 rounded-lg hover:bg-blue-600 transition-colors ${isActive(
                "/admin/dorms"
              )}`}
            >
              <span className="mx-4">Manage Dorms</span>
            </Link>
            <Link
              to="/admin/bookings"
              className={`flex items-center px-4 py-2 text-gray-100 rounded-lg hover:bg-blue-600 transition-colors ${isActive(
                "/admin/bookings"
              )}`}
            >
              <span className="mx-4">Bookings</span>
            </Link>
            <Link
              to="/admin/users"
              className={`flex items-center px-4 py-2 text-gray-100 rounded-lg hover:bg-blue-600 transition-colors ${isActive(
                "/admin/users"
              )}`}
            >
              <span className="mx-4">Users</span>
            </Link>
          </div>
        </nav>
        <div className="absolute bottom-0 w-64 border-t border-[#2F3336]">
          <button
            onClick={handleLogout}
            className="flex items-center px-8 py-4 text-gray-100 hover:bg-red-600/10 hover:text-red-400 transition-colors w-full"
          >
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <header className="h-16 bg-[#22303C] border-b border-[#2F3336] flex items-center justify-between px-6">
          <h2 className="text-xl font-semibold text-gray-100">
            {location.pathname.split("/").pop().charAt(0).toUpperCase() +
              location.pathname.split("/").pop().slice(1)}
          </h2>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
