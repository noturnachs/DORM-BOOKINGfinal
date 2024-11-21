import React, { useState, useEffect } from "react";
import api from "../../services/api";

const AdminDorms = () => {
  const [dorms, setDorms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price_per_night: "",
    capacity: "",
    available: true,
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDorm, setEditingDorm] = useState(null);

  useEffect(() => {
    fetchDorms();
  }, []);

  const fetchDorms = async () => {
    try {
      const response = await api.get("/admin/dorms"); // Make sure endpoint is correct

      // Check if response.data is an array
      if (Array.isArray(response.data)) {
        setDorms(response.data);
      } else if (response.data.dorms && Array.isArray(response.data.dorms)) {
        setDorms(response.data.dorms);
      } else {
        console.error("Invalid data format:", response.data);
        setError("Invalid data format received from server");
        setDorms([]); // Set to empty array if invalid data
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setError("Failed to fetch dorms");
      setDorms([]); // Set to empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/dorms", formData);
      setShowAddModal(false);
      fetchDorms();
      setFormData({
        name: "",
        description: "",
        price_per_night: "",
        capacity: "",
        available: true,
      });
    } catch (error) {
      setError(error.response?.data?.error || "Failed to add dorm");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this dorm?")) {
      try {
        await api.delete(`/dorms/${id}`);
        fetchDorms();
      } catch (error) {
        setError("Failed to delete dorm");
      }
    }
  };

  const handleEdit = (dorm) => {
    setEditingDorm(dorm);
    setFormData({
      name: dorm.name,
      description: dorm.description,
      price_per_night: dorm.price_per_night,
      capacity: dorm.capacity,
      available: dorm.available,
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.put(`/admin/dorms/${editingDorm.id}`, formData);
      setShowEditModal(false);
      fetchDorms();
      setFormData({
        name: "",
        description: "",
        price_per_night: "",
        capacity: "",
        available: true,
      });
    } catch (error) {
      setError(error.response?.data?.error || "Failed to update dorm");
    }
  };

  // Form component to avoid duplication
  const DormForm = ({ onSubmit, submitText }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300">Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="mt-1 block w-full bg-[#2C3E50] border border-[#2F3336] rounded-md shadow-sm py-2 px-3 text-white"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          className="mt-1 block w-full bg-[#2C3E50] border border-[#2F3336] rounded-md shadow-sm py-2 px-3 text-white"
          rows="3"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300">
          Price per Night (₱)
        </label>
        <input
          type="number"
          value={formData.price_per_night}
          onChange={(e) =>
            setFormData({ ...formData, price_per_night: e.target.value })
          }
          className="mt-1 block w-full bg-[#2C3E50] border border-[#2F3336] rounded-md shadow-sm py-2 px-3 text-white"
          min="0"
          step="0.01"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300">
          Capacity
        </label>
        <input
          type="number"
          value={formData.capacity}
          onChange={(e) =>
            setFormData({ ...formData, capacity: e.target.value })
          }
          className="mt-1 block w-full bg-[#2C3E50] border border-[#2F3336] rounded-md shadow-sm py-2 px-3 text-white"
          min="1"
          required
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          checked={formData.available}
          onChange={(e) =>
            setFormData({ ...formData, available: e.target.checked })
          }
          className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
        />
        <label className="ml-2 block text-sm text-gray-300">Available</label>
      </div>

      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={() => {
            setShowAddModal(false);
            setShowEditModal(false);
          }}
          className="text-gray-400 hover:text-gray-300 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          {submitText}
        </button>
      </div>
    </form>
  );

  if (loading) return <div className="text-white">Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Manage Dorms</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Add New Dorm
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded mb-4">
          {error}
        </div>
      )}

      {/* Add check for empty dorms array */}
      {dorms.length === 0 && !loading && !error ? (
        <div className="text-gray-400 text-center py-8">
          No dorms found. Add your first dorm!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dorms.map((dorm) => (
            <div
              key={dorm.id}
              className="bg-[#22303C] border border-[#2F3336] rounded-lg p-4"
            >
              <h3 className="text-xl font-semibold text-white mb-2">
                {dorm.name}
              </h3>
              <p className="text-gray-400 mb-4">{dorm.description}</p>
              <div className="flex justify-between items-center text-sm text-gray-400">
                <span>₱{dorm.price_per_night}/night</span>
                <span>Capacity: {dorm.capacity}</span>
              </div>
              <div className="mt-2 flex items-center text-sm">
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    dorm.available
                      ? "bg-green-500/10 text-green-400"
                      : "bg-red-500/10 text-red-400"
                  }`}
                >
                  {dorm.available ? "Available" : "Not Available"}
                </span>
              </div>
              <div className="mt-4 flex justify-end space-x-2">
                <button
                  onClick={() => handleEdit(dorm)}
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(dorm.id)}
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  Delete
                </button>
              </div>

              {/* Add Dorm Modal */}
              {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
                  <div className="bg-[#22303C] border border-[#2F3336] rounded-lg p-6 w-full max-w-md">
                    <h2 className="text-xl font-bold text-white mb-4">
                      Add New Dorm
                    </h2>
                    <DormForm onSubmit={handleSubmit} submitText="Add Dorm" />
                  </div>
                </div>
              )}

              {/* Edit Dorm Modal */}
              {showEditModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
                  <div className="bg-[#22303C] border border-[#2F3336] rounded-lg p-6 w-full max-w-md">
                    <h2 className="text-xl font-bold text-white mb-4">
                      Edit Dorm
                    </h2>
                    <DormForm
                      onSubmit={handleUpdate}
                      submitText="Update Dorm"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Dorm Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-[#22303C] border border-[#2F3336] rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Add New Dorm</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="mt-1 block w-full bg-[#2C3E50] border border-[#2F3336] rounded-md shadow-sm py-2 px-3 text-white"
                  required
                />
              </div>
              {/* Add other form fields similarly */}
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                  Add Dorm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDorms;
