import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

const AdminLayout = ({ children }) => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const isActive = (path) => {
    return location.pathname === path ? "bg-blue-700" : "";
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-[#192734] flex">
      {/* Sidebar */}
      <div
        className={`${
          isSidebarOpen ? "w-64" : "w-16"
        } bg-[#22303C] border-r border-[#2F3336] transition-all duration-300 ease-in-out flex flex-col`}
      >
        <div className="h-16 flex items-center justify-between border-b border-[#2F3336] px-4">
          {isSidebarOpen && (
            <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
          )}
          <button
            onClick={toggleSidebar}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-6 w-6 transform transition-transform duration-300 ${
                isSidebarOpen ? "rotate-0" : "rotate-180"
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
              />
            </svg>
          </button>
        </div>
        <nav className="mt-6 flex-1">
          <div className="px-2 space-y-2">
            <Link
              to="/admin/dashboard"
              className={`flex items-center px-4 py-2 text-gray-100 rounded-lg hover:bg-blue-600 transition-colors ${isActive(
                "/admin/dashboard"
              )}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
              {isSidebarOpen && <span className="mx-4">Dashboard</span>}
            </Link>
            <Link
              to="/admin/dorms"
              className={`flex items-center px-4 py-2 text-gray-100 rounded-lg hover:bg-blue-600 transition-colors ${isActive(
                "/admin/dorms"
              )}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              {isSidebarOpen && <span className="mx-4">Manage Dorms</span>}
            </Link>
            <Link
              to="/admin/bookings"
              className={`flex items-center px-4 py-2 text-gray-100 rounded-lg hover:bg-blue-600 transition-colors ${isActive(
                "/admin/bookings"
              )}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {isSidebarOpen && <span className="mx-4">Bookings</span>}
            </Link>
            <Link
              to="/admin/users"
              className={`flex items-center px-4 py-2 text-gray-100 rounded-lg hover:bg-blue-600 transition-colors ${isActive(
                "/admin/users"
              )}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              {isSidebarOpen && <span className="mx-4">Users</span>}
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
