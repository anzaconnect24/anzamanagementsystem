"use client";
import { useState, useEffect } from "react";
import Link from "@/utils/link";
import axios from "axios";
import { server_url } from "@/utils/endpoint";
import { headers } from "@/utils/headers";
import { BsArrowLeft, BsUpload } from "react-icons/bs";
import Spinner from "@/components/spinner";
import { useRouter } from "../../../utils/navigation";
import { useParams } from "react-router-dom";

const EditProgram = () => {
  const router = useRouter();
  const { uuid } = useParams();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    url: "",
    image: "",
    expireDate: "",
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [errors, setErrors] = useState({});

  // Fetch program details
  useEffect(() => {
    const fetchProgram = async () => {
      try {
        const response = await axios.get(`${server_url}/programs/${uuid}`, {
          headers: headers,
        });

        if (response.data.status) {
          setFormData({
            title: response.data.body.title || "",
            description: response.data.body.description || "",
            url: response.data.body.url || "",
            image: response.data.body.image || "",
            expireDate: response.data.body.expireDate
              ? response.data.body.expireDate.split("T")[0]
              : "",
          });
        } else {
          alert("Failed to fetch program details");
          router.push("/programsApplications");
        }
      } catch (error) {
        console.error("Error fetching program:", error);
        alert("Error fetching program details");
        router.push("/programsApplications");
      } finally {
        setFetching(false);
      }
    };

    if (uuid) {
      fetchProgram();
    }
  }, [uuid, router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    try {
      setLoading(true);
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);

      const response = await axios.post(
        `${server_url}/upload-file`,
        uploadFormData,
        {
          headers: {
            Authorization: headers.Authorization,
          },
        }
      );

      if (response.data.status) {
        setFormData((prev) => ({
          ...prev,
          image: response.data.body,
        }));
      } else {
        alert("Failed to upload image");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Error uploading image");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (formData.url && !isValidUrl(formData.url)) {
      newErrors.url = "Please enter a valid URL";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const response = await axios.patch(
        `${server_url}/programs/${uuid}`,
        formData,
        { headers: headers }
      );

      if (response.data.status) {
        router.push("/programsApplications");
      } else {
        alert("Failed to update program");
      }
    } catch (error) {
      console.error("Error updating program:", error);
      alert("Error updating program");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/programsApplications"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
        >
          <BsArrowLeft />
          Back to Programs
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Edit Program</h1>
        <p className="mt-2 text-gray-600">Update the program details.</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Title */}
          <div className="mb-6">
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Title
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.title ? "border-red-500" : "border-black/20"
              }`}
              placeholder="Enter program title"
            />{" "}
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div className="mb-6">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Description
              <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              rows={6}
              value={formData.description}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.description ? "border-red-500" : "border-black/20"
              }`}
              placeholder="Describe the program"
            />{" "}
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          {/* URL */}
          <div className="mb-6">
            <label
              htmlFor="url"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Details URL (Optional)
            </label>
            <input
              type="url"
              id="url"
              name="url"
              value={formData.url}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.url ? "border-red-500" : "border-black/20"
              }`}
              placeholder="https://example.com/program-details"
            />{" "}
            {errors.url && (
              <p className="mt-1 text-sm text-red-600">{errors.url}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Link to external page with more details about this program
            </p>
          </div>

          {/* Expire Date */}
          <div className="mb-6">
            <label
              htmlFor="expireDate"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Expire Date (Optional)
            </label>
            <input
              type="date"
              id="expireDate"
              name="expireDate"
              value={formData.expireDate}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.expireDate ? "border-red-500" : "border-black/20"
              }`}
            />{" "}
            {errors.expireDate && (
              <p className="mt-1 text-sm text-red-600">{errors.expireDate}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              When this program expires and is no longer available for
              applications
            </p>
          </div>

          {/* Image Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image (Optional)
            </label>

            {formData.image ? (
              <div className="mb-4">
                <img
                  src={formData.image}
                  alt="Program"
                  className="w-full max-w-md h-48 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      image: "",
                    }))
                  }
                  className="mt-2 text-sm text-red-600 hover:text-red-800"
                >
                  Remove Image
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-black/20 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                  disabled={loading}
                />
                <label
                  htmlFor="image-upload"
                  className={`cursor-pointer ${loading ? "opacity-50" : ""}`}
                >
                  <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                    {loading ? <Spinner /> : <BsUpload className="h-12 w-12" />}
                  </div>
                  <p className="text-sm text-gray-600">
                    {loading ? "Uploading..." : "Click to upload an image"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    PNG, JPG, GIF up to 5MB
                  </p>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3">
          <Link
            href="/programsApplications"
            className="px-6 py-2 border border-black/20 text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && <Spinner />}
            {loading ? "Updating..." : "Update Program"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProgram;
