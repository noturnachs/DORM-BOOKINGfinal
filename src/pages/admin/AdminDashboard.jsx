import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { Link } from "react-router-dom"; // Add this import

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalDorms: 0,
    totalBookings: 0,
    totalUsers: 0,
    recentBookings: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get("/admin/dashboard-stats");
      setStats(response.data);
    } catch (error) {
      setError("Failed to fetch dashboard statistics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-white">Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
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
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Stats Cards */}
        <div className="bg-[#22303C] border border-[#2F3336] rounded-lg p-6">
          <h3 className="text-gray-400 text-sm font-medium">Total Dorms</h3>
          <p className="text-2xl font-bold text-white mt-2">
            {stats.totalDorms}
          </p>
        </div>
        <div className="bg-[#22303C] border border-[#2F3336] rounded-lg p-6">
          <h3 className="text-gray-400 text-sm font-medium">Total Bookings</h3>
          <p className="text-2xl font-bold text-white mt-2">
            {stats.totalBookings}
          </p>
        </div>
        <div className="bg-[#22303C] border border-[#2F3336] rounded-lg p-6">
          <h3 className="text-gray-400 text-sm font-medium">Total Users</h3>
          <p className="text-2xl font-bold text-white mt-2">
            {stats.totalUsers}
          </p>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="bg-[#22303C] border border-[#2F3336] rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">Recent Bookings</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-400 text-sm">
                <th className="pb-4">Booking ID</th>
                <th className="pb-4">User</th>
                <th className="pb-4">Dorm</th>
                <th className="pb-4">Status</th>
                <th className="pb-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentBookings.map((booking) => (
                <tr
                  key={booking.id}
                  className="text-gray-300 border-t border-[#2F3336]"
                >
                  <td className="py-4">{booking.confirmation_number}</td>
                  <td className="py-4">{booking.user_name}</td>
                  <td className="py-4">{booking.dorm_name}</td>
                  <td className="py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        booking.status === "active"
                          ? "bg-green-500/10 text-green-400"
                          : "bg-yellow-500/10 text-yellow-400"
                      }`}
                    >
                      {booking.status}
                    </span>
                  </td>
                  <td className="py-4">
                    {new Date(booking.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
