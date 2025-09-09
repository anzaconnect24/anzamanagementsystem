"use client";
import { useContext, useEffect, useState } from "react";
import { timeAgo } from "../../../utils/time_ago";
import Link from "@/utils/link";
import Loader from "@/components/common/Loader";
import axios from "axios";
import toast from "react-hot-toast";
import NoData from "@/component/noData";
import Spinner from "@/components/spinner";
import { UserContext } from "../../../layouts/DashboardLayout";

import { server_url } from "@/utils/endpoint";
import { headers } from "@/utils/headers";
import { BsEye, BsPencil, BsTrash, BsSearch } from "react-icons/bs";
import { useTranslation } from "../../../locales";

const Page = () => {
  const { t } = useTranslation();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(8);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStory, setSelectedStory] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { userDetails } = useContext(UserContext);

  const totalPages = Math.ceil(total / limit);

  // Debounce search
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchTerm !== "") {
        setCurrentPage(1);
      }
      fetchStories();
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm, currentPage]);

  const fetchStories = async () => {
    try {
      if (searchTerm) {
        setSearchLoading(true);
      } else {
        setLoading(true);
      }

      const response = await axios.get(`${server_url}/success-stories`, {
        headers: headers,
        params: {
          page: currentPage,
          limit: limit,
          search: searchTerm || undefined,
        },
      });

      if (response.data.status) {
        setStories(response.data.body.data || []);
        setTotal(response.data.body.count || 0);
        setCurrentPage(response.data.body.page || 1);
      }
    } catch (error) {
      console.error("Error fetching success stories:", error);
      toast.error("Failed to fetch success stories");
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  };

  const openModal = (story) => {
    setSelectedStory(story);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedStory(null);
    setIsModalOpen(false);
  };

  const handleDelete = async (uuid) => {
    if (
      !confirm(
        t(
          "stories.confirmDelete",
          "Are you sure you want to delete this success story?"
        )
      )
    ) {
      return;
    }

    try {
      setDeleteLoading(true);
      const response = await axios.delete(
        `${server_url}/success-stories/${uuid}`,
        {
          headers: headers,
        }
      );

      if (response.status === 200 || response.status === 204) {
        toast.success(
          t("stories.deletedSuccessfully", "Success story deleted successfully")
        );
        fetchStories();
        closeModal();
      } else {
        toast.error(
          t("stories.failedToDelete", "Failed to delete success story")
        );
      }
    } catch (error) {
      console.error("Error deleting success story:", error);
      toast.error(t("stories.errorDeleting", "Error deleting success story"));
    } finally {
      setDeleteLoading(false);
    }
  };

  // Function to get YouTube thumbnail
  const getYouTubeThumbnail = (url) => {
    const videoId = extractYouTubeVideoId(url);
    return videoId
      ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
      : "/no data.jpg";
  };

  // Function to extract YouTube video ID
  const extractYouTubeVideoId = (url) => {
    const regExp =
      /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url?.match(regExp);
    return match && match[7].length === 11 ? match[7] : null;
  };

  return loading ? (
    <div className="flex justify-center items-center min-h-screen">
      <Spinner />
    </div>
  ) : (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {t("stories.successStories", "Success Stories")}
            </h1>
            <p className="mt-2 text-gray-600">
              {t(
                "stories.subtitle",
                "Inspiring stories of entrepreneurial success"
              )}
            </p>
          </div>
          {userDetails.role === "Admin" && (
            <Link
              href="/successStories/new"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Story
            </Link>
          )}
        </div>
      </div>

      {/* Search and Results Count */}
      <div className="flex justify-between items-center mb-6">
        <div className="text-gray-600">
          {t(
            "stories.showingResults",
            "Showing {{showing}} of {{total}} stories",
            { showing: stories.length, total: total }
          )}
        </div>
        <div className="flex-1 relative max-w-md">
          {searchLoading ? (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <BsSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          )}
          <input
            type="text"
            placeholder={t(
              "stories.searchPlaceholder",
              "Search success stories..."
            )}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-black/20 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Stories Grid */}
      {stories.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No success stories found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new success story.
          </p>
          {userDetails.role === "Admin" && (
            <div className="mt-6">
              <Link
                href="/successStories/new"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Story
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {stories.map((story) => (
            <div
              key={story.uuid}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => openModal(story)}
            >
              {/* Video Thumbnail */}
              <div className="h-48 bg-gray-200 overflow-hidden relative">
                <img
                  src={getYouTubeThumbnail(story.videoLink)}
                  alt={story.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = "/no data.jpg";
                  }}
                />
                {/* Play button overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 hover:bg-opacity-30 transition-all">
                  <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
                    <svg
                      className="w-6 h-6 text-white ml-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M8 5v10l8-5z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                  {story.title}
                </h3>
                <div
                  className="text-gray-600 text-sm mb-4 line-clamp-3"
                  dangerouslySetInnerHTML={{ __html: story.description }}
                />

                {/* Actions */}
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    {new Date(story.createdAt).toLocaleDateString()}
                  </span>
                  {userDetails.role === "Admin" && (
                    <div className="flex gap-2">
                      <Link
                        href={`/successStories/${story.uuid}/edit`}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <BsPencil className="text-sm" />
                      </Link>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(story.uuid);
                        }}
                        disabled={deleteLoading}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {deleteLoading ? (
                          <div className="w-4 h-4">
                            <Spinner />
                          </div>
                        ) : (
                          <BsTrash className="text-sm" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <nav className="flex items-center gap-2">
            <button
              onClick={() => {
                if (currentPage > 1) {
                  setCurrentPage(currentPage - 1);
                }
              }}
              disabled={currentPage <= 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-black/20 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  currentPage === page
                    ? "bg-blue-600 text-white"
                    : "text-gray-500 bg-white border border-black/20 hover:bg-gray-50"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => {
                if (currentPage < totalPages) {
                  setCurrentPage(currentPage + 1);
                }
              }}
              disabled={currentPage >= totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-black/20 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </nav>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && selectedStory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex-1 pr-4">
                  {selectedStory.title}
                </h2>
                <button
                  onClick={closeModal}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
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

              {/* Video */}
              {selectedStory.videoLink && (
                <div className="mb-6">
                  <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
                    <iframe
                      src={`https://www.youtube.com/embed/${extractYouTubeVideoId(
                        selectedStory.videoLink
                      )}`}
                      className="w-full h-full"
                      frameBorder="0"
                      allowFullScreen
                      title={selectedStory.title}
                    />
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-900">
                  Story
                </h3>
                <div
                  className="text-gray-700 leading-relaxed prose max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: selectedStory.description,
                  }}
                />
              </div>

              {/* Metadata */}
              <div className="border-t border-black/20 pt-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Published:</span>{" "}
                    {new Date(selectedStory.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                {selectedStory.videoLink && (
                  <a
                    href={selectedStory.videoLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                    Watch on YouTube
                  </a>
                )}

                {userDetails.role === "Admin" && (
                  <>
                    <Link
                      href={`/successStories/${selectedStory.uuid}/edit`}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <BsPencil />
                      Edit Story
                    </Link>
                    <button
                      onClick={() => handleDelete(selectedStory.uuid)}
                      disabled={deleteLoading}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                      {deleteLoading ? <Spinner /> : <BsTrash />}
                      Delete Story
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Page;
