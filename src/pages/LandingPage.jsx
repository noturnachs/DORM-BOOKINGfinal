import React from "react";
import { Link } from "react-router-dom";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#192734]">
      {/* Navigation */}
      <nav className="bg-[#22303C] shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
              BookIt
            </div>
            <div className="flex items-center space-x-3 sm:space-x-8">
              <a
                href="#about"
                className="text-sm sm:text-base text-gray-300 hover:text-gray-100 transition-colors"
              >
                About
              </a>
              <a
                href="#contact"
                className="text-sm sm:text-base text-gray-300 hover:text-gray-100 transition-colors"
              >
                Contact
              </a>
              <Link
                to="/login"
                className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 border border-transparent text-sm sm:text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12 sm:py-20">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-100 mb-4 px-2">
            Find Your Perfect Dorm
          </h1>
          <p className="text-lg sm:text-xl text-gray-400 mb-8 px-4">
            Quick and easy dorm booking for students
          </p>
          <Link
            to="/login"
            className="inline-flex items-center px-6 py-2.5 sm:px-8 sm:py-3 border border-transparent text-base sm:text-lg font-semibold rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
          >
            Book Now
          </Link>
        </div>

        {/* Feature Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-12">
          <div className="bg-[#22303C] p-6 rounded-xl hover:bg-[#2C3E50] transition-all">
            <div className="text-blue-400 mb-4">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-100 mb-2">
              Easy Booking
            </h3>
            <p className="text-gray-400">
              Simple and quick process to book your perfect dorm
            </p>
          </div>

          <div className="bg-[#22303C] p-6 rounded-xl hover:bg-[#2C3E50] transition-all">
            <div className="text-blue-400 mb-4">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-100 mb-2">
              24/7 Support
            </h3>
            <p className="text-gray-400">
              Round-the-clock assistance for all your needs
            </p>
          </div>

          <div className="bg-[#22303C] p-6 rounded-xl hover:bg-[#2C3E50] transition-all">
            <div className="text-blue-400 mb-4">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-100 mb-2">
              Secure Booking
            </h3>
            <p className="text-gray-400">Safe and secure payment processing</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
