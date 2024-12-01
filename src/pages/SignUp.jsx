import React, { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const SignUp = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [verificationStep, setVerificationStep] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...signupData } = formData;
      const response = await api.post("/signup", signupData);

      if (response.data.message === "Verification code sent to email") {
        setVerificationStep(true);
      }
    } catch (error) {
      setError(
        error.response?.data?.error ||
          "An error occurred during signup. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/verify-email", {
        email: formData.email,
        code: verificationCode,
      });

      setSuccess(true);

      setTimeout(() => {
        navigate("/login", {
          state: { message: "Account verified successfully. Please login." },
        });
      }, 5000);
    } catch (error) {
      setError(
        error.response?.data?.error ||
          "Invalid verification code. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };
  if (success) {
    return (
      <div className="min-h-screen bg-[#192734] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-[#22303C] py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-[#2F3336] text-center">
            <div className="text-green-400 mb-4">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 48 48"
              >
                <circle
                  className="opacity-25"
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M16.707 22.293a1 1 0 00-1.414 1.414l6 6a1 1 0 001.414 0l12-12a1 1 0 10-1.414-1.414L22 27.586l-5.293-5.293z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-100 mb-2">
              Account Successfully Created!
            </h2>
            <p className="text-gray-400">Redirecting you to login.</p>
            <div className="mt-4">
              <div className="w-full bg-[#2F3336] rounded-full h-1">
                <div
                  className="bg-green-400 h-1 rounded-full transition-all duration-5000 ease-linear"
                  style={{ width: "100%", transition: "width 5s linear" }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (verificationStep) {
    return (
      <div className="min-h-screen bg-[#192734] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="text-center text-3xl font-bold text-gray-100">
            Verify your email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            We've sent a verification code to {formData.email}
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-[#22303C] py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-[#2F3336]">
            {error && (
              <div className="mb-4 bg-red-900/30 border border-red-500/30 text-red-400 px-4 py-3 rounded relative">
                {error}
              </div>
            )}
            <form onSubmit={handleVerification} className="space-y-6">
              <div>
                <label
                  htmlFor="code"
                  className="block text-sm font-medium text-gray-300"
                >
                  Verification Code
                </label>
                <input
                  type="text"
                  id="code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="mt-1 block w-full bg-[#2C3E50] border border-[#2F3336] rounded-md shadow-sm py-2 px-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm transition-colors"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all ${
                  loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Verifying...
                  </div>
                ) : (
                  "Verify Email"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#192734] flex flex-col">
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
      <div className="min-h-screen bg-[#192734] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center"></div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-100">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-blue-400 hover:text-blue-300 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-[#22303C] py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-[#2F3336]">
            {error && (
              <div
                className="mb-4 bg-red-900/30 border border-red-500/30 text-red-400 px-4 py-3 rounded relative"
                role="alert"
              >
                {error}
              </div>
            )}
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-sm font-medium text-gray-300"
                  >
                    First name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    id="firstName"
                    required
                    className="mt-1 block w-full bg-[#2C3E50] border border-[#2F3336] rounded-md shadow-sm py-2 px-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm transition-colors"
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-sm font-medium text-gray-300"
                  >
                    Last name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    id="lastName"
                    required
                    className="mt-1 block w-full bg-[#2C3E50] border border-[#2F3336] rounded-md shadow-sm py-2 px-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm transition-colors"
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-300"
                >
                  Email address
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  autoComplete="email"
                  required
                  className="mt-1 block w-full bg-[#2C3E50] border border-[#2F3336] rounded-md shadow-sm py-2 px-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm transition-colors"
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-300"
                >
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  id="password"
                  required
                  className="mt-1 block w-full bg-[#2C3E50] border border-[#2F3336] rounded-md shadow-sm py-2 px-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm transition-colors"
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-300"
                >
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  id="confirmPassword"
                  required
                  className="mt-1 block w-full bg-[#2C3E50] border border-[#2F3336] rounded-md shadow-sm py-2 px-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm transition-colors"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all ${
                    loading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Creating account...
                    </div>
                  ) : (
                    "Create account"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
