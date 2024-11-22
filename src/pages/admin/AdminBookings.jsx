import React, { useState, useEffect } from "react";
import api from "../../services/api";

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all"); // all, active, pending, cancelled
  const [successMessage, setSuccessMessage] = useState("");

  const [loadingBookingId, setLoadingBookingId] = useState(null);
  const [loadingPaymentId, setLoadingPaymentId] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [filteredBookings, setFilteredBookings] = useState([]);

  useEffect(() => {
    fetchBookings();
  }, [filter]);

  useEffect(() => {
    // Filter bookings based on search query
    const filtered = bookings.filter((booking) =>
      booking.confirmation_number
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    );
    setFilteredBookings(filtered);
  }, [searchQuery, bookings]);

  const fetchBookings = async () => {
    try {
      const response = await api.get(`/admin/bookings?status=${filter}`);
      setBookings(response.data);
    } catch (error) {
      setError("Failed to fetch bookings");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentStatusChange = async (bookingId, newPaymentStatus) => {
    try {
      setLoadingPaymentId(bookingId);
      setError("");
      await api.patch(`/admin/bookings/${bookingId}/payment`, {
        payment_status: newPaymentStatus,
      });
      if (newPaymentStatus === "paid") {
        setSuccessMessage(
          "Payment status updated and confirmation email sent!"
        );
        setTimeout(() => setSuccessMessage(""), 5000);
      }
      fetchBookings();
    } catch (error) {
      setError("Failed to update payment status");
    } finally {
      setLoadingPaymentId(null);
    }
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      setLoadingBookingId(bookingId);
      setError("");
      await api.patch(`/admin/bookings/${bookingId}`, { status: newStatus });
      fetchBookings();
    } catch (error) {
      setError("Failed to update booking status");
    } finally {
      setLoadingBookingId(null);
    }
  };

  // Loading spinner component
  const LoadingSpinner = () => (
    <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
  );

  if (loading) return <div className="text-white">Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Manage Bookings</h1>
        <div className="flex space-x-2">
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Booking ID..."
              className="bg-[#2C3E50] border border-[#2F3336] text-white rounded px-3 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-[#2C3E50] border border-[#2F3336] text-white rounded px-3 py-2"
          >
            <option value="all">All Bookings</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded mb-4">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-500/10 border border-green-500/50 text-green-500 p-4 rounded mb-4">
          {successMessage}
        </div>
      )}

      <div className="bg-[#22303C] border border-[#2F3336] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-400 text-sm border-b border-[#2F3336]">
                <th className="p-4">Booking ID</th>
                <th className="p-4">User</th>
                <th className="p-4">Dorm</th>
                <th className="p-4">Dates</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length > 0 ? (
                filteredBookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="border-b border-[#2F3336] text-gray-300"
                  >
                    <td className="p-4">{booking.confirmation_number}</td>
                    <td className="p-4">{booking.user_name}</td>
                    <td className="p-4">{booking.dorm_name}</td>
                    <td className="p-4">
                      {new Date(booking.start_date).toLocaleDateString()} -
                      {new Date(booking.end_date).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          booking.status === "active"
                            ? "bg-green-500/10 text-green-400"
                            : booking.status === "pending"
                            ? "bg-yellow-500/10 text-yellow-400"
                            : "bg-red-500/10 text-red-400"
                        }`}
                      >
                        {booking.status}
                      </span>
                    </td>

                    <td className="p-4 space-x-2">
                      <div className="flex space-x-2">
                        <div className="relative inline-block">
                          {loadingBookingId === booking.id ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-[#2C3E50] rounded">
                              <LoadingSpinner />
                            </div>
                          ) : null}
                          <select
                            value={booking.status}
                            onChange={(e) =>
                              handleStatusChange(booking.id, e.target.value)
                            }
                            disabled={loadingBookingId === booking.id}
                            className="bg-[#2C3E50] border border-[#2F3336] text-white rounded px-2 py-1 min-w-[120px]"
                          >
                            <option value="active">Active</option>
                            <option value="pending">Pending</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>

                        <div className="relative inline-block">
                          {loadingPaymentId === booking.id ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-[#2C3E50] rounded">
                              <LoadingSpinner />
                            </div>
                          ) : null}
                          <select
                            value={booking.payment_status}
                            onChange={(e) =>
                              handlePaymentStatusChange(
                                booking.id,
                                e.target.value
                              )
                            }
                            disabled={loadingPaymentId === booking.id}
                            className="bg-[#2C3E50] border border-[#2F3336] text-white rounded px-2 py-1 min-w-[140px]"
                          >
                            <option value="pending">Payment Pending</option>
                            <option value="paid">Paid</option>
                            <option value="refunded">Refunded</option>
                            <option value="failed">Failed</option>
                          </select>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="p-4 text-center text-gray-400">
                    {searchQuery
                      ? "No bookings found matching your search"
                      : "No bookings available"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminBookings;
