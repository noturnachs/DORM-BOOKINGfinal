import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import BookingModal from "./BookingModal";
import Swal from "sweetalert2";

const DormDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dorm, setDorm] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [review, setReview] = useState({ rating: 5, comment: "" });
  const [reviews, setReviews] = useState([]);
  const [confirmationNumber, setConfirmationNumber] = useState(null);
  const [imageLoading, setImageLoading] = useState(true);

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  //   booking form
  const [bookingData, setBookingData] = useState({
    semester: "1", // "1" or "2"
    academicYear: new Date().getFullYear(),
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState({
    startDate: "",
    endDate: "",
    general: "",
  });
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getSemesterDates = (semester, year) => {
    if (semester === "1") {
      return {
        start: `${year}-08-01`, // First semester typically starts in August
        end: `${year}-12-31`, // Ends in December
      };
    } else {
      return {
        start: `${year}-01-01`, // Second semester starts in January
        end: `${year}-05-31`, // Ends in May
      };
    }
  };

  const handleBooking = async (e) => {
    e.preventDefault();

    setBookingError({
      semester: "",
      academicYear: "",
      general: "",
    });

    // Get semester dates

    // If validation passes, show confirmation modal
    setIsModalOpen(true);
  };

  const handleConfirmBooking = async () => {
    setBookingLoading(true);
    try {
      const { start, end } = getSemesterDates(
        bookingData.semester,
        bookingData.academicYear
      );

      const response = await api.post(`/dorms/${id}/bookings`, {
        start_date: start,
        end_date: end,
        semester: bookingData.semester,
        academicYear: bookingData.academicYear,
        dorm_id: id,
        // Remove status and payment_status from here - let server handle these
      });

      // Make sure we have the confirmation number before showing the success message
      if (response.data && response.data.confirmation_number) {
        setConfirmationNumber(response.data.confirmation_number);

        Swal.fire({
          icon: "success",
          title: "Booking Successful!",
          html: `
              <div class="text-center">
                <p class="mb-4 text-gray-300">Your booking has been confirmed.</p>
                <div class="bg-[#2C3E50] p-4 rounded-lg inline-block border border-[#2F3336]">
                  <p class="text-sm text-gray-400">Confirmation Number:</p>
                  <p class="text-xl font-bold text-blue-400">${response.data.confirmation_number}</p>
                </div>
                <div class="mt-4">
                  <p class="text-sm text-gray-400">Please save this number for your reference.</p>
                  <p class="mt-2 text-sm text-gray-400">
                    Payment is required within 48 hours to secure your booking.
                  </p>
                  <div class="mt-4 text-left bg-[#22303C] p-4 rounded-lg border border-[#2F3336]">
                    <p class="text-sm font-medium text-gray-300">Next Steps:</p>
                    <ol class="mt-2 text-sm text-gray-400 list-decimal list-inside space-y-1">
                      <li>Make your payment within 48 hours</li>
                      <li>Send proof of payment with your confirmation number</li>
                      <li>Wait for payment verification</li>
                    </ol>
                  </div>
                </div>
              </div>
            `,
          confirmButtonText: "OK",
          confirmButtonColor: "#3B82F6",
          background: "#192734",
          color: "#E5E7EB",
          allowOutsideClick: false,
          customClass: {
            popup: "bg-[#192734] rounded-xl border border-[#2F3336]",
            title: "text-gray-100",
            htmlContainer: "text-gray-300",
            confirmButton:
              "bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md",
          },
        });

        setBookingSuccess(true);
        setIsModalOpen(false);
        setBookingData({
          semester: "1",
          academicYear: new Date().getFullYear(),
        });
      } else {
        throw new Error("No confirmation number received");
      }
    } catch (error) {
      console.error("Booking error:", error);
      setBookingError((prev) => ({
        ...prev,
        general: error.response?.data?.error || "Failed to process booking",
      }));
      setIsModalOpen(false);

      // Show error message
      Swal.fire({
        icon: "error",
        title: "Booking Failed",
        text:
          error.response?.data?.error ||
          "Failed to process booking. Please try again.",
        confirmButtonColor: "#3B82F6",
      });
    } finally {
      setBookingLoading(false);
    }
  };

  // Dummy images (replace with actual dorm images)
  // const images = [
  //   "https://images.unsplash.com/photo-1555854877-bab0e564b8d5",
  //   "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af",
  //   "https://images.unsplash.com/photo-1515552726023-7125c8d07fb3",
  // ];

  useEffect(() => {
    const fetchDormDetails = async () => {
      try {
        setLoading(true);
        const [dormResponse, reviewsResponse] = await Promise.all([
          api.get(`/dorms/${id}`),
          api.get(`/dorms/${id}/reviews`),
        ]);

        setDorm(dormResponse.data);
        setReviews(reviewsResponse.data);

        // If there are images, set the first one as active
        if (dormResponse.data.images && dormResponse.data.images.length > 0) {
          setActiveImage(0);
        }
      } catch (error) {
        setError(error.response?.data?.error || "Failed to fetch dorm details");
      } finally {
        setLoading(false);
      }
    };

    fetchDormDetails();
  }, [id]);

  const fetchReviews = async () => {
    try {
      const response = await api.get(`/dorms/${id}/reviews`);
      setReviews(response.data);
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/dorms/${id}/reviews`, review);
      setReview({ rating: 5, comment: "" });
      fetchReviews(); // Refresh reviews
    } catch (error) {
      console.error("Failed to submit review:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#192734]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#192734] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center text-blue-400 hover:text-blue-300 transition-colors"
        >
          <span>← Back to Dashboard</span>
        </button>

        <div className="bg-[#22303C] rounded-xl shadow-sm overflow-hidden border border-[#2F3336]">
          {/* Image Gallery */}
          <div className="relative aspect-w-16 aspect-h-9 mb-4 bg-[#22303C] rounded-lg overflow-hidden">
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#22303C]">
                <div className="animate-pulse flex space-x-4">
                  <div className="flex-1 space-y-4 py-1">
                    <div className="h-full w-full bg-[#2C3E50] rounded"></div>
                  </div>
                </div>
              </div>
            )}
            {dorm?.images && dorm.images.length > 0 && (
              <img
                src={dorm.images[activeImage]}
                alt={`Dorm view ${activeImage + 1}`}
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  imageLoading ? "opacity-0" : "opacity-100"
                }`}
                onLoad={handleImageLoad}
              />
            )}
          </div>
          {/* Optional: Add Thumbnail Strip */}
          {dorm?.images && dorm.images.length > 1 && (
            <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
              {dorm.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setActiveImage(index);
                    setImageLoading(true);
                  }}
                  className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden focus:outline-none ${
                    index === activeImage
                      ? "ring-2 ring-blue-500"
                      : "ring-1 ring-[#2F3336]"
                  }`}
                >
                  <div
                    className={`absolute inset-0 bg-[#22303C] ${
                      imageLoading ? "animate-pulse" : ""
                    }`}
                  />
                  <img
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                    onLoad={(e) => {
                      e.target.parentElement
                        .querySelector(".animate-pulse")
                        ?.remove();
                    }}
                  />
                </button>
              ))}
            </div>
          )}

          <div className="p-6 sm:p-8">
            {/* Dorm Header */}
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-100 mb-2">
                  {dorm.name}
                </h1>
                <p className="text-gray-400">{dorm.description}</p>
              </div>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  dorm.available
                    ? "bg-green-900/30 text-green-400"
                    : "bg-red-900/30 text-red-400"
                }`}
              >
                {dorm.available ? "Available" : "Booked"}
              </span>
            </div>

            {/* Dorm Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-100">
                  Dorm Features
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2 text-gray-300">
                    <svg
                      className="w-5 h-5 text-gray-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path
                        fillRule="evenodd"
                        d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Capacity: {dorm.capacity}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-300">
                    <svg
                      className="w-5 h-5 text-gray-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>₱{dorm.price_per_night}/night</span>
                  </div>
                </div>

                {/* Amenities */}
                <div>
                  <h2 className="text-lg font-semibold mb-4 text-gray-100">
                    Amenities
                  </h2>
                  <ul className="grid grid-cols-2 gap-2">
                    <li className="flex items-center space-x-2 text-gray-300">
                      <svg
                        className="w-5 h-5 text-blue-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Wi-Fi</span>
                    </li>
                    {/* ... other amenities ... */}
                  </ul>
                </div>
              </div>

              {/* Booking Section */}
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-100">
                  Book this dorm
                </h2>

                {bookingSuccess && (
                  <div className="mb-4 bg-green-900/30 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg">
                    Booking successful! We'll send you a confirmation email
                    shortly.
                  </div>
                )}

                {bookingError.general && (
                  <div className="mb-4 bg-red-900/30 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg">
                    {bookingError.general}
                  </div>
                )}

                <form onSubmit={handleBooking} className="space-y-6">
                  <div className="bg-[#2C3E50] rounded-lg p-6 space-y-4">
                    {/* Academic Year Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Academic Year
                      </label>
                      <select
                        value={bookingData.academicYear}
                        onChange={(e) =>
                          setBookingData((prev) => ({
                            ...prev,
                            academicYear: parseInt(e.target.value),
                          }))
                        }
                        className="w-full bg-[#192734] border border-[#2F3336] rounded-md shadow-sm py-2 px-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {[0, 1, 2].map((offset) => {
                          const year = new Date().getFullYear() + offset;
                          return (
                            <option key={year} value={year}>
                              {year} - {year + 1}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Semester Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Semester
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() =>
                            setBookingData((prev) => ({
                              ...prev,
                              semester: "1",
                            }))
                          }
                          className={`p-4 rounded-lg border ${
                            bookingData.semester === "1"
                              ? "border-blue-500 bg-blue-600/20 text-blue-400"
                              : "border-[#2F3336] text-gray-300 hover:border-blue-500/50"
                          } transition-colors`}
                        >
                          <div className="font-medium">First Semester</div>
                          <div className="text-sm opacity-75">
                            August - December
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setBookingData((prev) => ({
                              ...prev,
                              semester: "2",
                            }))
                          }
                          className={`p-4 rounded-lg border ${
                            bookingData.semester === "2"
                              ? "border-blue-500 bg-blue-600/20 text-blue-400"
                              : "border-[#2F3336] text-gray-300 hover:border-blue-500/50"
                          } transition-colors`}
                        >
                          <div className="font-medium">Second Semester</div>
                          <div className="text-sm opacity-75">
                            January - May
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Price Calculation */}
                    <div className="border-t border-[#2F3336] pt-4 mt-4">
                      <div className="flex justify-between items-center text-gray-300 mb-2">
                        <span>Price per semester</span>
                        <span>₱{dorm.price_per_night * 150}</span>
                      </div>
                      <div className="flex justify-between items-center text-gray-100 font-semibold">
                        <span>Total for semester</span>
                        <span>₱{dorm.price_per_night * 150}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={bookingLoading || !dorm.available}
                    className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all ${
                      bookingLoading || !dorm.available
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    {bookingLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                        Processing...
                      </div>
                    ) : !dorm.available ? (
                      "Not Available"
                    ) : (
                      "Book for Semester"
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Reviews Section */}
            <div className="mt-12">
              <h2 className="text-lg font-semibold mb-6 text-gray-100">
                Reviews
              </h2>

              {/* Review Form */}
              <form onSubmit={handleSubmitReview} className="mb-8">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300">
                      Rating
                    </label>
                    <select
                      value={review.rating}
                      onChange={(e) =>
                        setReview({ ...review, rating: e.target.value })
                      }
                      className="mt-1 p-2 block w-full bg-[#2C3E50] border border-[#2F3336] rounded-md shadow-sm text-gray-100 focus:border-blue-500 focus:ring-blue-500"
                    >
                      {[5, 4, 3, 2, 1].map((num) => (
                        <option key={num} value={num}>
                          {num} Star{num !== 1 ? "s" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300">
                      Your Review
                    </label>
                    <textarea
                      value={review.comment}
                      onChange={(e) =>
                        setReview({ ...review, comment: e.target.value })
                      }
                      rows={4}
                      className="mt-1 block w-full p-2 bg-[#2C3E50] border border-[#2F3336] rounded-md shadow-sm text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Share your experience..."
                    />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
                  >
                    Submit Review
                  </button>
                </div>
              </form>

              {/* Reviews List */}
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="border-b border-[#2F3336] pb-6"
                  >
                    <div className="flex items-center mb-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-5 h-5 ${
                              i < review.rating
                                ? "text-yellow-400"
                                : "text-gray-600"
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-400">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-300">{review.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <BookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmBooking}
        booking={bookingData}
        dorm={dorm}
        loading={bookingLoading}
      />
    </div>
  );
};

export default DormDetails;
