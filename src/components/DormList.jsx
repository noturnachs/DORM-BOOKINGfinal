import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const DormList = () => {
  const initialFilters = JSON.parse(localStorage.getItem("dormFilters")) || {
    minPrice: "",
    maxPrice: "",
    capacity: "",
  };
  const [dorms, setDorms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState(initialFilters);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDorms();
  }, [currentPage, filters]);

  useEffect(() => {
    localStorage.setItem("dormFilters", JSON.stringify(filters));
  }, [filters]);

  const fetchDorms = async () => {
    try {
      const queryParams = new URLSearchParams({
        ...(filters.minPrice && { minPrice: filters.minPrice }),
        ...(filters.maxPrice && { maxPrice: filters.maxPrice }),
        ...(filters.capacity && { capacity: filters.capacity }),
      });

      const response = await api.get(`/dorms?${queryParams}`);
      setDorms(response.data.dorms);
      setError("");
    } catch (error) {
      setError("Failed to fetch dorms");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      minPrice: "",
      maxPrice: "",
      capacity: "",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#22303C] rounded-xl shadow-sm">
        <div
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="p-4  border-[#2F3336] flex justify-between items-center cursor-pointer hover:bg-[#2C3E50] transition-colors"
        >
          {" "}
          <div className="flex items-center space-x-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z"
                clipRule="evenodd"
              />
            </svg>
            <h2 className="text-lg font-semibold text-gray-100">Filters</h2>
          </div>
          <div
            className="flex items-center space-x-4"
            onClick={(e) => e.stopPropagation()}
          >
            {Object.values(filters).some((value) => value !== "") && (
              <button
                onClick={clearFilters}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Clear filters
              </button>
            )}
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="text-blue-500 hover:text-blue-400 transition-colors"
            >
              {isFilterOpen ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div
          className={`overflow-hidden transition-all duration-300 ${
            isFilterOpen ? "max-h-96" : "max-h-0"
          }`}
        >
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-400">
                  Minimum Price (₱)
                </label>
                <input
                  type="number"
                  name="minPrice"
                  value={filters.minPrice}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 rounded-lg bg-[#2C3E50] border border-[#2F3336] text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  placeholder="Enter amount"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-400">
                  Maximum Price (₱)
                </label>
                <input
                  type="number"
                  name="maxPrice"
                  value={filters.maxPrice}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 rounded-lg bg-[#2C3E50] border border-[#2F3336] text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  placeholder="Enter amount"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-400">
                  Minimum Capacity
                </label>
                <input
                  type="number"
                  name="capacity"
                  value={filters.capacity}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 rounded-lg bg-[#2C3E50] border border-[#2F3336] text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  placeholder="Enter persons"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {dorms.map((dorm) => (
          <div
            key={dorm.id}
            onClick={() => navigate(`/dorms/${dorm.id}`)}
            className="bg-[#22303C] rounded-xl shadow-sm overflow-hidden hover:bg-[#2C3E50] transition-all cursor-pointer"
          >
            <div className="aspect-w-16 aspect-h-9 w-full">
              <img
                src={dorm.images?.[0] || "/placeholder-dorm.jpg"}
                alt={dorm.name}
                className="w-full h-48 object-cover"
              />
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-gray-100">
                  {dorm.name}
                </h3>
                <p className="text-sm text-gray-400">{dorm.description}</p>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="space-y-1">
                  <p className="text-sm text-gray-300">
                    <span className="font-medium">Capacity:</span>{" "}
                    {dorm.capacity} persons
                  </p>
                  <p className="text-sm text-gray-300">
                    <span className="font-medium">Price:</span> ₱
                    {dorm.price_per_night}/night
                  </p>
                </div>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    dorm.available
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {dorm.available ? "Available" : "Booked"}
                </span>
              </div>

              <button className="w-full  bg-blue-600 text-white hover:bg-blue-700 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all">
                Book Now
              </button>
            </div>
          </div>
        ))}
      </div>

      {dorms.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-sm">
            No dorms found matching your criteria.
          </p>
        </div>
      )}
    </div>
  );
};

export default DormList;
