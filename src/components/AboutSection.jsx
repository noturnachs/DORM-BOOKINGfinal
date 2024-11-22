import React from "react";
import { Link } from "react-router-dom";

const AboutSection = () => {
  return (
    <div className="min-h-screen bg-[#192734] flex flex-col">
      {/* Navigation */}
      <nav className="bg-[#22303C] shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link
              to="/"
              className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent"
            >
              BookIt
            </Link>
            <Link
              to="/"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      {/* About Content */}
      <div className="flex-grow flex items-center justify-center py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#22303C] rounded-xl p-8 shadow-lg">
            <h1 className="text-3xl font-bold text-gray-100 mb-6 text-center">
              About BookIt
            </h1>
            <div className="space-y-6">
              <p className="text-gray-400">
                BookIt is a company dedicated to transforming the dormitory
                experience at the University of San Carlos (USC). Our mission is
                to deliver high-quality living spaces that inspire a sense of
                community and belonging. Recognizing that a dorm room is more
                than just a place to sleep—it's an extension of each student's
                personality and lifestyle—we provide a variety of features and
                amenities to help students create comfortable, personalized, and
                inviting spaces.
              </p>
              <p className="text-gray-400">
                As USC's dorm management system, we are committed to simplifying
                dorm life for students and staff alike. Our platform streamlines
                essential tasks such as room assignments, maintenance requests,
                and emergency responses, ensuring a hassle-free experience.
              </p>
              <p className="text-gray-400">
                We take pride in being an integral part of the USC community and
                are dedicated to meeting the needs of our students. By providing
                exceptional living conditions and an efficient dorm management
                system, we aim to enhance the overall student experience and
                make university life truly memorable.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutSection;
