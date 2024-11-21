import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import DormList from "../components/DormList";
import api from "../services/api";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await api.get("/bookings/user");
      setBookings(response.data);
      setError(""); // Clear any previous errors
    } catch (error) {
      console.error("Booking fetch error:", error);
      setError(
        error.response?.data?.error ||
          "Failed to fetch bookings. Please try again."
      );
      if (error.response?.status === 401) {
        logout(); // Logout if unauthorized
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout(); // This will now handle navigation automatically
  };

  const formatDeadline = (deadline) => {
    if (!deadline) return "N/A";

    const date = new Date(deadline);
    const now = new Date();
    const isExpired = date < now;

    // Format the date
    const formattedDate = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    // Format the time
    const formattedTime = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    // Calculate time remaining
    const hoursRemaining = Math.round((date - now) / (1000 * 60 * 60));
    let timeRemaining = "";

    if (!isExpired) {
      if (hoursRemaining < 24) {
        timeRemaining = ` (${hoursRemaining} hours left)`;
      } else {
        const daysRemaining = Math.round(hoursRemaining / 24);
        timeRemaining = ` (${daysRemaining} days left)`;
      }
    }

    return (
      <span className={`${isExpired ? "text-red-400" : "text-gray-400"}`}>
        {formattedDate} at {formattedTime}
        <span className="text-sm font-medium">
          {isExpired ? " (Expired)" : timeRemaining}
        </span>
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#192734]">
      {/* Navigation */}
      <nav className="bg-[#22303C] shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                BookIt
              </span>
            </div>
            {user && user.role === "admin" && (
              <div className="fixed bottom-4 right-4">
                <Link
                  to="/admin/dashboard"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg transition-colors flex items-center space-x-2"
                >
                  <span>Admin Dashboard</span>
                </Link>
              </div>
            )}
            <div className="flex items-center gap-3">
              <span className="hidden sm:block text-gray-300">
                Welcome, <span className="font-bold">{user?.firstName}</span>
              </span>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 sm:px-6 lg:px-8 space-y-6">
        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="bg-[#22303C] rounded-xl shadow-sm p-6 hover:bg-[#2C3E50] transition-all">
            <dt className="text-sm font-medium text-gray-400 truncate">
              Total Bookings
            </dt>
            <dd className="mt-2 text-3xl font-semibold text-gray-100">
              {bookings.length}
            </dd>
          </div>

          <div className="bg-[#22303C] rounded-xl shadow-sm p-6 hover:bg-[#2C3E50] transition-all">
            <dt className="text-sm font-medium text-gray-400 truncate">
              Active Bookings
            </dt>
            <dd className="mt-2 text-3xl font-semibold text-gray-100">
              {bookings.filter((b) => b.status === "active").length}
            </dd>
          </div>

          <div className="bg-[#22303C] rounded-xl shadow-sm p-6 hover:bg-[#2C3E50] transition-all">
            <dt className="text-sm font-medium text-gray-400 truncate">
              Pending Payments
            </dt>
            <dd className="mt-2 text-3xl font-semibold text-gray-100">
              {bookings.filter((b) => b.payment_status === "unpaid").length}
            </dd>
          </div>

          <div className="bg-[#22303C] rounded-xl shadow-sm p-6 hover:bg-[#2C3E50] transition-all">
            <dt className="text-sm font-medium text-gray-400 truncate">
              Completed Payments
            </dt>
            <dd className="mt-2 text-3xl font-semibold text-gray-100">
              {bookings.filter((b) => b.payment_status === "paid").length}
            </dd>
          </div>
        </div>

        {/* Bookings Section */}
        <div className="bg-[#22303C] rounded-xl shadow-sm overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-100 mb-4">
              Your Bookings
            </h2>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : error ? (
              <div className="text-center text-red-400 py-8">{error}</div>
            ) : bookings.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                No bookings found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full divide-y divide-[#2F3336]">
                  <thead className="bg-[#2C3E50]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        <span className="hidden sm:inline">Confirmation #</span>
                        <span className="sm:hidden">Booking Details</span>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Payment
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-[#22303C] divide-y divide-[#2F3336]">
                    {bookings.map((booking) => (
                      <tr
                        key={booking.id}
                        className="hover:bg-[#2C3E50] transition-colors"
                      >
                        <td className="px-4 py-4 whitespace-normal">
                          <div className="flex flex-col">
                            <span className="text-blue-400 text-sm font-medium">
                              #{booking.confirmation_number}
                            </span>
                            <span className="text-gray-300 text-sm">
                              {booking.dorm_name}
                            </span>
                            <span className="text-gray-400 text-xs mt-1">
                              {booking.semester === "1"
                                ? "First (Aug-Dec)"
                                : "Second (Jan-May)"}
                              <span className="hidden sm:inline">
                                {" "}
                                Semester
                              </span>
                              <br className="sm:hidden" />
                              <span className="sm:ml-1">
                                AY {booking.academic_year}-
                                {parseInt(booking.academic_year) + 1}
                              </span>
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              booking.status === "active"
                                ? "bg-green-900/30 text-green-400"
                                : "bg-red-900/30 text-red-400"
                            }`}
                          >
                            <svg
                              className="w-3 h-3 mr-1"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              {booking.status === "active" ? (
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              ) : (
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                  clipRule="evenodd"
                                />
                              )}
                            </svg>
                            {booking.status === "active"
                              ? "Active"
                              : "Cancelled"}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col space-y-2">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium w-min ${
                                booking.payment_status === "paid"
                                  ? "bg-green-900/30 text-green-400"
                                  : "bg-red-900/30 text-red-400"
                              }`}
                            >
                              <svg
                                className="w-3 h-3 mr-1"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                {booking.payment_status === "paid" ? (
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                  />
                                ) : (
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z"
                                    clipRule="evenodd"
                                  />
                                )}
                              </svg>
                              {booking.payment_status === "paid"
                                ? "Paid"
                                : "Unpaid"}
                            </span>
                            <span className="text-xs text-gray-400">
                              {formatDeadline(booking.payment_deadline)}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Available Dorms Section */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-100 mb-6">
            Available Dorms
          </h1>
          <DormList />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
