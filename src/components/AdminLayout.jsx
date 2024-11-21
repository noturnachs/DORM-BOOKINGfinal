import React from "react";
import { Link, useLocation } from "react-router-dom";

const AdminLayout = ({ children }) => {
  const location = useLocation();

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
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <header className="h-16 bg-[#22303C] border-b border-[#2F3336] flex items-center justify-between px-6">
          <h2 className="text-xl font-semibold text-gray-100">
            {location.pathname.split("/").pop().charAt(0).toUpperCase() +
              location.pathname.split("/").pop().slice(1)}
          </h2>
          <Link
            to="/dashboard"
            className="bg-[#2C3E50] hover:bg-[#34495E] text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            <span>Back to Home</span>
          </Link>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
