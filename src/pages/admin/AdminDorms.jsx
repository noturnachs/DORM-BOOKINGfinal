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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [tempImages, setTempImages] = useState([]);
  const [deletingImages, setDeletingImages] = useState({});

  const Modal = ({ title, isOpen, onClose, children }) => {
    if (!isOpen) return null;

    const handleModalClick = (e) => {
      e.stopPropagation(); // Prevent click from bubbling up
    };

    return (
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <div
          className="bg-[#22303C] border border-[#2F3336] rounded-lg p-6 w-full max-w-md"
          onClick={handleModalClick}
        >
          <h2 className="text-xl font-bold text-white mb-4">{title}</h2>
          {children}
        </div>
      </div>
    );
  };

  const handleDeleteImage = async (dormId, imageUrl) => {
    setDeletingImages((prev) => ({ ...prev, [imageUrl]: true }));

    try {
      const response = await api.delete(`/admin/dorms/${dormId}/images`, {
        data: { imageUrl },
      });

      if (response.status === 200) {
        // Update both dorms list and editing dorm if it's the same dorm
        setDorms(
          dorms.map((dorm) => {
            if (dorm.id === dormId) {
              return {
                ...dorm,
                images: dorm.images.filter((img) => img !== imageUrl),
              };
            }
            return dorm;
          })
        );

        // Update editingDorm if the deleted image was from the currently edited dorm
        if (editingDorm && editingDorm.id === dormId) {
          setEditingDorm((prev) => ({
            ...prev,
            images: prev.images.filter((img) => img !== imageUrl),
          }));
        }

        setError("");
      }
    } catch (error) {
      console.error("Error deleting image:", error);
      setError(error.response?.data?.error || "Failed to delete image");
    } finally {
      setDeletingImages((prev) => {
        const newState = { ...prev };
        delete newState[imageUrl];
        return newState;
      });
    }
  };

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

  const handleSubmit = async (e, formData, images) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const formDataToSubmit = new FormData();

      // Check if values exist before appending
      if (!formData.name?.trim()) throw new Error("Name is required");
      if (!formData.description?.trim())
        throw new Error("Description is required");
      if (!formData.price_per_night) throw new Error("Price is required");
      if (!formData.capacity) throw new Error("Capacity is required");

      // Append form data
      formDataToSubmit.append("name", formData.name.trim());
      formDataToSubmit.append("description", formData.description.trim());
      formDataToSubmit.append("price_per_night", formData.price_per_night);
      formDataToSubmit.append("capacity", formData.capacity);
      formDataToSubmit.append("available", formData.available);

      // Append images if they exist
      if (images && images.length > 0) {
        images.forEach((image) => {
          formDataToSubmit.append("images", image);
        });
      }

      const response = await api.post("/admin/dorms", formDataToSubmit, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data) {
        setShowAddModal(false);
        fetchDorms();
      }
    } catch (error) {
      console.error("Submit error:", error);
      setError(
        error.message || error.response?.data?.error || "Failed to add dorm"
      );
    } finally {
      setIsSubmitting(false);
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
    setIsUpdating(true);
    try {
      const formDataToSubmit = new FormData();
      formDataToSubmit.append("name", formData.name);
      formDataToSubmit.append("description", formData.description);
      formDataToSubmit.append("price_per_night", formData.price_per_night);
      formDataToSubmit.append("capacity", formData.capacity);
      formDataToSubmit.append("available", formData.available);

      tempImages.forEach((image) => {
        formDataToSubmit.append("images", image);
      });

      await api.put(`/admin/dorms/${editingDorm.id}`, formDataToSubmit, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setShowEditModal(false);
      setTempImages([]);
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
    } finally {
      setIsUpdating(false);
    }
  };

  // Form component to avoid duplication
  const DormForm = ({ onSubmit, submitText, dorm }) => {
    const [localFormData, setLocalFormData] = useState({
      name: dorm?.name || "",
      description: dorm?.description || "",
      price_per_night: dorm?.price_per_night || "",
      capacity: dorm?.capacity || "",
      available: dorm?.available ?? true,
    });

    const [localTempImages, setLocalTempImages] = useState([]);

    const handleLocalSubmit = (e) => {
      e.preventDefault();
      // Validate form data
      if (!localFormData.name?.trim()) {
        setError("Name is required");
        return;
      }
      if (!localFormData.description?.trim()) {
        setError("Description is required");
        return;
      }
      if (!localFormData.price_per_night) {
        setError("Price is required");
        return;
      }
      if (!localFormData.capacity) {
        setError("Capacity is required");
        return;
      }

      onSubmit(e, localFormData, localTempImages);
    };

    const handleImageSelect = (e) => {
      const files = Array.from(e.target.files);
      setLocalTempImages((prev) => [...prev, ...files]); // Use local state
    };

    const handleRemoveTempImage = (index) => {
      setLocalTempImages((prev) => prev.filter((_, i) => i !== index)); // Use local state
    };

    return (
      <form onSubmit={handleLocalSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300">
            Name
          </label>
          <input
            type="text"
            value={localFormData.name}
            onChange={(e) =>
              setLocalFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            className="mt-1 block w-full bg-[#2C3E50] border border-[#2F3336] rounded-md shadow-sm py-2 px-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300">
            Description
          </label>
          <textarea
            value={localFormData.description}
            onChange={(e) =>
              setLocalFormData((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
            className="mt-1 block w-full bg-[#2C3E50] border border-[#2F3336] rounded-md shadow-sm py-2 px-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
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
            value={localFormData.price_per_night}
            onChange={(e) =>
              setLocalFormData((prev) => ({
                ...prev,
                price_per_night: e.target.value,
              }))
            }
            className="mt-1 block w-full bg-[#2C3E50] border border-[#2F3336] rounded-md shadow-sm py-2 px-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
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
            value={localFormData.capacity}
            onChange={(e) =>
              setLocalFormData((prev) => ({
                ...prev,
                capacity: e.target.value,
              }))
            }
            className="mt-1 block w-full bg-[#2C3E50] border border-[#2F3336] rounded-md shadow-sm py-2 px-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            min="1"
            required
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            checked={localFormData.available}
            onChange={(e) =>
              setLocalFormData((prev) => ({
                ...prev,
                available: e.target.checked,
              }))
            }
            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
          <label className="ml-2 block text-sm text-gray-300">Available</label>
        </div>

        {/* Image Upload Section */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-300">
            Dorm Images
          </label>
          <div className="mt-1 flex items-center space-x-4">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageSelect}
              className="block w-full text-sm text-gray-400
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-600 file:text-white
              hover:file:bg-blue-700
              file:cursor-pointer file:transition-colors"
            />
          </div>

          {/* Image Preview Grid */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {/* Show existing images when editing */}
            {dorm?.images?.map((imageUrl, index) => (
              <div key={`existing-${index}`} className="relative group">
                <img
                  src={imageUrl}
                  alt={`Dorm ${index + 1}`}
                  className="h-32 w-full object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => handleDeleteImage(dorm.id, imageUrl)}
                  className="absolute top-2 right-2 p-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg
                    className="h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}

            {/* Show newly selected images */}
            {localTempImages.map((file, index) => (
              <div key={`temp-${index}`} className="relative group">
                <img
                  src={URL.createObjectURL(file)}
                  alt={`New upload ${index + 1}`}
                  className="h-32 w-full object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveTempImage(index)}
                  className="absolute top-2 right-2 p-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg
                    className="h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={() => {
              setShowAddModal(false);
              setShowEditModal(false);
              setTempImages([]);
            }}
            className="text-gray-400 hover:text-gray-300 transition-colors"
            disabled={isSubmitting || isUpdating}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isUpdating}
            className={`bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors flex items-center ${
              isSubmitting || isUpdating ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isSubmitting || isUpdating ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                {isSubmitting ? "Adding..." : "Updating..."}
              </>
            ) : (
              submitText
            )}
          </button>
        </div>
      </form>
    );
  };

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
              {dorm.images && dorm.images.length > 0 && (
                <div className="mb-4">
                  <div className="grid grid-cols-2 gap-2">
                    {dorm.images.map((imageUrl, index) => (
                      <div
                        key={index}
                        className="relative group aspect-w-16 aspect-h-9"
                      >
                        <img
                          src={imageUrl}
                          alt={`${dorm.name} view ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <button
                          onClick={() => handleDeleteImage(dorm.id, imageUrl)}
                          disabled={deletingImages[imageUrl]}
                          className={`absolute top-2 right-2 p-1.5 ${
                            deletingImages[imageUrl]
                              ? "bg-gray-500"
                              : "bg-red-500"
                          } rounded-full opacity-0 group-hover:opacity-100 transition-opacity`}
                        >
                          {deletingImages[imageUrl] ? (
                            <svg
                              className="animate-spin h-4 w-4 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="h-4 w-4 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      <Modal
        title="Add New Dorm"
        isOpen={showAddModal}
        onClose={() => {
          if (!isSubmitting) {
            setShowAddModal(false);
            setTempImages([]);
          }
        }}
      >
        <DormForm onSubmit={handleSubmit} submitText="Add Dorm" />
      </Modal>

      <Modal
        title="Edit Dorm"
        isOpen={showEditModal}
        onClose={() => {
          if (!isUpdating) {
            setShowEditModal(false);
            setTempImages([]);
          }
        }}
      >
        <DormForm
          onSubmit={handleUpdate}
          submitText="Update Dorm"
          dorm={editingDorm}
        />
      </Modal>
    </div>
  );
};

export default AdminDorms;
