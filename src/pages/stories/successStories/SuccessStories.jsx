"use client";

import { useContext, useEffect, useState } from "react";
import Link from "../../../utils/link";
import axios from "axios";
import toast from "react-hot-toast";
import Spinner from "../../../components/spinner";
import { UserContext } from "../../../layouts/DashboardLayout";
import { server_url } from "../../../utils/endpoint";
import { headers } from "../../../utils/headers";
import {
  BsPencil,
  BsTrash,
  BsPlayFill,
  BsPlus,
} from "react-icons/bs";
import {
  FaLayerGroup,
  FaClock,
  FaStar,
  FaVideo,
} from "react-icons/fa";
import { useTranslation } from "../../../locales";

const SuccessStories = () => {
  const { t } = useTranslation();
  const { userDetails } = useContext(UserContext);

  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [limit] = useState(8);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStory, setSelectedStory] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchStories();
  }, [currentPage]);

  const fetchStories = async () => {
    try {
      setLoading(true);

      const response = await axios.get(`${server_url}/success-stories`, {
        headers,
        params: {
          page: currentPage,
          limit,
        },
      });

      if (response.data.status) {
        setStories(response.data.body.data || []);
        setTotal(response.data.body.count || 0);
        setCurrentPage(response.data.body.page || 1);
      }
    } catch (error) {
      console.error("Error fetching success stories:", error);

      toast.error(
        t("stories.failedToFetch", "Failed to fetch success stories")
      );
    } finally {
      setLoading(false);
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
    const confirmed = confirm(
      t(
        "stories.confirmDelete",
        "Are you sure you want to delete this success story?"
      )
    );

    if (!confirmed) return;

    try {
      setDeleteLoading(true);

      const response = await axios.delete(
        `${server_url}/success-stories/${uuid}`,
        { headers }
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

      toast.error(
        t("stories.errorDeleting", "Error deleting success story")
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const extractYouTubeVideoId = (url) => {
    if (!url) return null;

    const patterns = [
      /youtube\.com\/watch\?v=([^&]+)/,
      /youtube\.com\/embed\/([^?&]+)/,
      /youtu\.be\/([^?&]+)/,
      /youtube\.com\/shorts\/([^?&]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);

      if (match?.[1]) return match[1];
    }

    return null;
  };

  const isDirectVideo = (url) => {
    if (!url) return false;

    return /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);
  };

  const getVideoEmbedUrl = (url) => {
    const youtubeId = extractYouTubeVideoId(url);

    if (youtubeId) {
      return `https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`;
    }

    return null;
  };

  const getThumbnail = (url) => {
    const youtubeId = extractYouTubeVideoId(url);

    if (youtubeId) {
      return `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
    }

    return "/images/business-tools-hero.jpg";
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-4">
      {/* HERO */}
      <div className="relative mb-10 min-h-[320px] overflow-hidden rounded-2xl bg-black shadow-sm">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('${
              stories[0]?.videoLink
                ? getThumbnail(stories[0].videoLink)
                : "/images/business-tools-hero.jpg"
            }')`,
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-[#c9672b]/30" />

        <div className="relative z-10 max-w-3xl p-10 text-white">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-sm font-medium shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#f08a3c]" />
            Founder Stories
          </span>

          <h2 className="mb-3 text-4xl font-bold leading-tight drop-shadow-lg">
            {t("stories.successStories", "Success Stories")}
          </h2>

          <p className="mb-6 text-lg text-white/85 drop-shadow-md">
            {t(
              "stories.heroMessage",
              "Explore real entrepreneurial journeys, lessons learned, and practical insights from founders building and growing their ventures."
            )}
          </p>

          <div className="flex flex-wrap items-center gap-6 text-sm text-white/85">
            <span className="flex items-center gap-2">
              <FaLayerGroup />
              {total} Stories
            </span>

            <span className="flex items-center gap-2">
              <FaVideo />
              Video Stories
            </span>

            <span className="flex items-center gap-2">
              <FaClock />
              Flexible Learning
            </span>
          </div>
        </div>
      </div>

      {/* HEADER */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-[#172033]">
          {t("stories.availableStories", "Available Stories")}
        </h2>

        {userDetails.role === "Admin" && (
          <Link
            href="/dashboard/successStories/new"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md active:scale-[0.98]"
          >
            <BsPlus className="text-lg text-blue-200" />
            Add Success Story
          </Link>
        )}
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {stories.map((story) => (
          <div
            key={story.uuid}
            onClick={() => openModal(story)}
            className="group cursor-pointer overflow-hidden rounded-xl bg-white shadow-md transition duration-200 hover:scale-[1.02] hover:shadow-lg"
          >
            <div className="relative h-48 overflow-hidden bg-black">
              <img
                src={getThumbnail(story.videoLink)}
                alt={story.title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-lg">
                  <BsPlayFill className="ml-1 text-2xl text-[#c9672b]" />
                </div>
              </div>
            </div>

            <div className="p-4">
              <h3 className="mb-2 line-clamp-2 text-base font-bold text-[#111827]">
                {story.title}
              </h3>

              <div
                className="mb-6 line-clamp-3 text-sm text-[#6f6f72]"
                dangerouslySetInnerHTML={{ __html: story.description }}
              />

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/10 pt-4 text-xs text-[#8a8f98]">
                <span className="flex items-center gap-1">
                  <FaVideo />
                  Video
                </span>

                <span className="flex items-center gap-1">
                  <FaClock />
                  Flexible Learning
                </span>

                {userDetails.role === "Admin" ? (
                  <>
                    <Link
                      href={`/dashboard/successStories/${story.uuid}/edit`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 text-green-600 hover:text-green-700"
                    >
                      <BsPencil />
                      Edit
                    </Link>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(story.uuid);
                      }}
                      disabled={deleteLoading}
                      className="flex items-center gap-1 text-red-600 hover:text-red-700 disabled:opacity-50"
                    >
                      {deleteLoading ? <Spinner /> : <BsTrash />}
                      Delete
                    </button>
                  </>
                ) : (
                  <span className="flex items-center gap-1 text-[#f6b800]">
                    <FaStar />
                    0.0
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL */}
      {isModalOpen && selectedStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4">
          <div className="relative w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <button
              type="button"
              onClick={closeModal}
              className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-xl font-bold text-white hover:bg-black"
            >
              ×
            </button>

            <div className="aspect-video w-full bg-black">
              {getVideoEmbedUrl(selectedStory.videoLink) ? (
                <iframe
                  src={getVideoEmbedUrl(selectedStory.videoLink)}
                  title={selectedStory.title}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : isDirectVideo(selectedStory.videoLink) ? (
                <video
                  src={selectedStory.videoLink}
                  className="h-full w-full"
                  controls
                  autoPlay
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center px-6 text-center text-white">
                  This video format is not supported. Please upload a YouTube
                  link or a direct MP4/WebM/Ogg video URL.
                </div>
              )}
            </div>

            <div className="p-5">
              <h3 className="mb-2 text-xl font-bold text-[#172033]">
                {selectedStory.title}
              </h3>

              <div
                className="text-sm leading-relaxed text-[#6f6f72]"
                dangerouslySetInnerHTML={{
                  __html: selectedStory.description,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuccessStories;