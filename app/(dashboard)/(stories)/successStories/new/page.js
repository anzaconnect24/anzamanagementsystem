"use client";
import { useState, useContext } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import toast from "react-hot-toast";
import { server_url } from "@/app/utils/endpoint";
import { headers } from "@/app/utils/headers";
import { UserContext } from "../../../layout";
import Spinner from "@/components/spinner";
import { BsArrowLeft, BsYoutube } from "react-icons/bs";

const CreateStory = () => {
  const router = useRouter();
  const { userDetails } = useContext(UserContext);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    videoLink: "",
  });
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
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

    if (!formData.videoLink.trim()) {
      newErrors.videoLink = "YouTube link is required";
    } else if (!isValidYouTubeUrl(formData.videoLink)) {
      newErrors.videoLink = "Please enter a valid YouTube URL";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidYouTubeUrl = (url) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)[\w\-]+(&[\w=]*)?$/;
    return youtubeRegex.test(url);
  };

  const extractYouTubeVideoId = (url) => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url?.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  };

  const getYouTubeThumbnail = (url) => {
    const videoId = extractYouTubeVideoId(url);
    return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      const response = await axios.post(
        `${server_url}/success-stories`,
        formData,
        { headers: headers }
      );

      if (response.data.status) {
        toast.success("Success story created successfully!");
        router.push("/successStories");
      } else {
        toast.error(response.data.message || "Failed to create success story");
      }
    } catch (error) {
      console.error("Error creating success story:", error);
      toast.error("Error creating success story");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4">
      <div className="rounded-xl border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        {/* Header */}
        <div className="p-6 border-b border-stroke dark:border-strokedark">
          <Link
            href="/successStories"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-4"
          >
            <BsArrowLeft />
            Back to Success Stories
          </Link>
          <h4 className="text-xl font-semibold text-black dark:text-white">
            Create New Success Story
          </h4>
          <p className="mt-2 text-bodydark2">
            Add a new success story with YouTube video integration.
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
                placeholder="Enter success story title"
                className={`w-full rounded-lg border-[1.5px] bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary ${
                  errors.title
                    ? "border-red-500 focus:border-red-500 active:border-red-500"
                    : "border-stroke"
                }`}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-500">{errors.title}</p>
              )}
            </div>

            {/* YouTube Link */}
            <div>
              <label className="mb-2.5 block font-medium text-black dark:text-white">
                YouTube Video Link <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="url"
                  name="videoLink"
                  value={formData.videoLink}
                  onChange={handleInputChange}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className={`w-full rounded-lg border-[1.5px] bg-transparent px-5 py-3 pl-12 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary ${
                    errors.videoLink
                      ? "border-red-500 focus:border-red-500 active:border-red-500"
                      : "border-stroke"
                  }`}
                />
                <BsYoutube className="absolute left-4 top-1/2 transform -translate-y-1/2 text-red-600 text-xl" />
              </div>
              {errors.videoLink && (
                <p className="mt-1 text-sm text-red-500">{errors.videoLink}</p>
              )}
              
              {/* Video Preview */}
              {formData.videoLink && isValidYouTubeUrl(formData.videoLink) && (
                <div className="mt-4">
                  <p className="text-sm text-bodydark2 mb-2">Preview:</p>
                  <div className="relative w-full max-w-md">
                    <img
                      src={getYouTubeThumbnail(formData.videoLink)}
                      alt="Video thumbnail"
                      className="w-full h-auto rounded-lg border border-stroke"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8 5v10l8-5z"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
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
                placeholder="Enter success story description"
                className={`w-full rounded-lg border-[1.5px] bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary ${
                  errors.description
                    ? "border-red-500 focus:border-red-500 active:border-red-500"
                    : "border-stroke"
                }`}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-500">{errors.description}</p>
              )}
              <p className="mt-1 text-sm text-bodydark2">
                You can use HTML tags for formatting
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6 border-t border-stroke dark:border-strokedark">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-center font-medium text-white hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed lg:px-8 xl:px-10"
              >
                {submitting ? (
                  <>
                    <Spinner />
                    Creating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Success Story
                  </>
                )}
              </button>
              
              <Link
                href="/successStories"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-stroke bg-gray px-6 py-3 text-center font-medium text-dark hover:border-primary hover:bg-primary hover:text-white dark:border-strokedark dark:bg-meta-4 dark:text-white dark:hover:border-primary dark:hover:bg-primary lg:px-8 xl:px-10"
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

export default CreateStory;