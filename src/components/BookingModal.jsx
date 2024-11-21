import React from "react";

const BookingModal = ({
  isOpen,
  onClose,
  onConfirm,
  booking,
  dorm,
  loading,
}) => {
  if (!isOpen) return null;

  // Get semester dates
  const getSemesterDates = (semester, year) => {
    if (semester === "1") {
      return {
        start: `${year}-08-01`,
        end: `${year}-12-31`,
        label: "First Semester (August - December)",
      };
    } else {
      return {
        start: `${year}-01-01`,
        end: `${year}-05-31`,
        label: "Second Semester (January - May)",
      };
    }
  };

  const semesterDates = getSemesterDates(
    booking.semester,
    booking.academicYear
  );
  const totalPrice = dorm.price_per_night * 150; // Approximate days per semester

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75"
          onClick={onClose}
        />

        <div className="relative inline-block px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-[#22303C] rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="sm:flex sm:items-start">
            <div className="w-full mt-3 text-center sm:mt-0 sm:text-left">
              <h3 className="text-lg font-medium leading-6 text-gray-100">
                Confirm Booking
              </h3>

              <div className="mt-4 space-y-4">
                <div className="bg-[#2C3E50] p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-gray-300">
                    <span>Dorm:</span>
                    <span className="font-medium text-gray-100">
                      {dorm.name}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Academic Year:</span>
                    <span className="text-gray-100">
                      {booking.academicYear} - {booking.academicYear + 1}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Period:</span>
                    <span className="text-gray-100">{semesterDates.label}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Start Date:</span>
                    <span>
                      {new Date(semesterDates.start).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>End Date:</span>
                    <span>
                      {new Date(semesterDates.end).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-[#2F3336]">
                    <div className="flex justify-between font-medium">
                      <span className="text-gray-100">Total for Semester:</span>
                      <span className="text-blue-400">₱{totalPrice}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-900/30 border border-blue-500/30 text-blue-400 p-4 rounded-lg text-sm">
                  <p className="font-medium mb-1">Important Notes:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Payment must be made within 48 hours of booking</li>
                    <li>
                      Your booking will be confirmed only after payment
                      verification
                    </li>
                    <li>
                      Payment methods:
                      <ul className="ml-6 mt-1">
                        <li>Bank Transfer</li>
                        <li>GCash</li>
                        <li>In-person payment</li>
                      </ul>
                    </li>
                    <li>Room assignments are final</li>
                  </ul>
                </div>

                <p className="text-sm text-gray-400">
                  By confirming this booking, you agree to our terms and
                  conditions.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              disabled={loading}
              onClick={onConfirm}
              className={`inline-flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </div>
              ) : (
                "Confirm Booking"
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="inline-flex justify-center w-full px-4 py-2 mt-3 text-sm font-medium text-gray-300 bg-[#2C3E50] border border-[#2F3336] rounded-md shadow-sm hover:bg-[#354658] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
