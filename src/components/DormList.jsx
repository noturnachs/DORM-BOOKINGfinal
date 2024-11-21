import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const DormList = () => {
  const [dorms, setDorms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    minPrice: "",
    maxPrice: "",
    capacity: "",
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchDorms();
  }, [currentPage, filters]);

  const fetchDorms = async () => {
    try {
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: 10,
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
    setCurrentPage(1); // Reset to first page when filters change
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
      {/* Filters */}
      <div className="bg-[#22303C] rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-100 mb-4">Filters</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Min Price
            </label>
            <input
              type="number"
              name="minPrice"
              value={filters.minPrice}
              onChange={handleFilterChange}
              className="w-full px-2 py-2 rounded-lg bg-[#2C3E50] border-[#2F3336] text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter minimum price"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Max Price
            </label>
            <input
              type="number"
              name="maxPrice"
              value={filters.maxPrice}
              onChange={handleFilterChange}
              className="w-full px-2 py-2 rounded-lg bg-[#2C3E50] border-[#2F3336] text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter maximum price"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Minimum Capacity
            </label>
            <input
              type="number"
              name="capacity"
              value={filters.capacity}
              onChange={handleFilterChange}
              className="w-full px-2 py-2 rounded-lg bg-[#2C3E50] border-[#2F3336] text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter minimum capacity"
            />
          </div>
        </div>
      </div>

      {/* Dorm Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {dorms.map((dorm) => (
          <div
            key={dorm.id}
            onClick={() => navigate(`/dorms/${dorm.id}`)}
            className="bg-[#22303C] rounded-xl shadow-sm overflow-hidden hover:bg-[#2C3E50] transition-all cursor-pointer"
          >
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
