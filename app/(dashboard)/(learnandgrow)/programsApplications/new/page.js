"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { server_url } from "@/app/utils/endpoint";
import { headers } from "@/app/utils/headers";
import { BsArrowLeft, BsUpload } from "react-icons/bs";
import Spinner from "@/components/spinner";

const NewProgram = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    url: "",
    image: "",
    expireDate: "",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

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

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    console.log("Selected file:", file);

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

    // Store the file for later upload
    setSelectedFile(file);

    // Create a preview URL
    const previewUrl = URL.createObjectURL(file);
    setFormData((prev) => ({
      ...prev,
      image: previewUrl,
    }));
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
      let imageUrl = "";

      // Upload image first if one is selected
      if (selectedFile) {
        console.log("Uploading image during form submission...");
        const uploadFormData = new FormData();
        uploadFormData.append("file", selectedFile);

        const uploadResponse = await axios.post(
          `${server_url}/upload-file`,
          uploadFormData,
          {
            headers: {
              Authorization: headers.Authorization,
            },
          }
        );

        console.log("Upload response:", uploadResponse.data);

        if (uploadResponse.data.status) {
          imageUrl = uploadResponse.data.body;
          console.log("Image uploaded successfully:", imageUrl);
        } else {
          console.error("Upload failed:", uploadResponse.data);
          alert(
            "Failed to upload image: " +
              (uploadResponse.data.message || "Unknown error")
          );
          return;
        }
      }

      // Prepare the final form data with the uploaded image URL
      const finalFormData = {
        ...formData,
        image: imageUrl,
      };

      console.log("Submitting form data:", finalFormData);

      const response = await axios.post(
        `${server_url}/programs`,
        finalFormData,
        {
          headers: headers,
        }
      );

      if (response.data.status) {
        // Clean up the preview URL
        if (formData.image && formData.image.startsWith("blob:")) {
          URL.revokeObjectURL(formData.image);
        }
        router.push("/programsApplications");
      } else {
        alert(
          "Failed to create program: " +
            (response.data.message || "Unknown error")
        );
      }
    } catch (error) {
      console.error("Error creating program:", error);
      alert("Error creating program: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4">
      <div className="rounded-xl border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        {/* Header */}
        <div className="p-6 border-b border-stroke dark:border-strokedark">
          <Link
            href="/programsApplications"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-4"
          >
            <BsArrowLeft />
            Back to Programs
          </Link>
          <h4 className="text-xl font-semibold text-black dark:text-white">
            Add New Program
          </h4>
          <p className="mt-2 text-bodydark2">
            Create a new program to share with participants.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="mb-2.5 block font-medium text-black dark:text-white">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={`form-style ${errors.title ? "border-red-500" : ""}`}
                placeholder="Enter program title"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="mb-2.5 block font-medium text-black dark:text-white">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                rows={6}
                value={formData.description}
                onChange={handleInputChange}
                className={`form-style ${
                  errors.description ? "border-red-500" : ""
                }`}
                placeholder="Describe the program"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.description}
                </p>
              )}
            </div>

            {/* URL */}
            <div>
              <label className="mb-2.5 block font-medium text-black dark:text-white">
                Related URL (Optional)
              </label>
              <input
                type="url"
                name="url"
                value={formData.url}
                onChange={handleInputChange}
                className={`form-style ${errors.url ? "border-red-500" : ""}`}
                placeholder="https://example.com"
              />
              {errors.url && (
                <p className="mt-1 text-sm text-red-600">{errors.url}</p>
              )}
              <p className="mt-1 text-sm text-bodydark2">
                Link to external page with more details about this program
              </p>
            </div>

            {/* Expire Date */}
            <div>
              <label className="mb-2.5 block font-medium text-black dark:text-white">
                Expire Date
              </label>
              <input
                type="date"
                name="expireDate"
                value={formData.expireDate}
                onChange={handleInputChange}
                className={`form-style ${
                  errors.expireDate ? "border-red-500" : ""
                }`}
              />
              {errors.expireDate && (
                <p className="mt-1 text-sm text-red-600">{errors.expireDate}</p>
              )}
              <p className="mt-1 text-sm text-bodydark2">
                When this program expires and is no longer available for
                applications
              </p>
            </div>

            {/* Image Upload */}
            <div>
              <label className="mb-2.5 block font-medium text-black dark:text-white">
                Image (Optional)
              </label>

              {formData.image ? (
                <div className="mb-4">
                  <img
                    src={formData.image}
                    alt="Program"
                    className="w-full max-w-md h-48 object-cover rounded-lg border border-stroke dark:border-strokedark"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      // Clean up the preview URL if it's a blob URL
                      if (
                        formData.image &&
                        formData.image.startsWith("blob:")
                      ) {
                        URL.revokeObjectURL(formData.image);
                      }
                      setFormData((prev) => ({ ...prev, image: "" }));
                      setSelectedFile(null);
                    }}
                    className="mt-2 text-sm text-danger hover:text-danger/80"
                  >
                    Remove Image
                  </button>
                </div>
              ) : (
                <div className="mb-4">
                  <div className="flex items-center justify-center w-full">
                    <label
                      htmlFor="image-upload"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-stroke dark:border-strokedark border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-meta-4 hover:bg-gray-100 dark:hover:bg-meta-4/50"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <BsUpload className="w-8 h-8 mb-4 text-bodydark2" />
                        <p className="mb-2 text-sm text-bodydark2">
                          <span className="font-semibold">Click to upload</span>{" "}
                          or drag and drop
                        </p>
                        <p className="text-xs text-bodydark2">
                          PNG, JPG, JPEG (Max 5MB)
                        </p>
                      </div>
                    </label>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                      disabled={loading}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Spinner />
                    Creating...
                  </div>
                ) : (
                  "Create Program"
                )}
              </button>
              <Link
                href="/programsApplications"
                className="px-6 py-2 border border-stroke dark:border-strokedark text-black dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-strokedark focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
              >
                Cancel
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewProgram;
