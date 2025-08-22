"use client";
import { useState, useEffect, useContext } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { server_url } from "@/app/utils/endpoint";
import { headers } from "@/app/utils/headers";
import { BsArrowLeft, BsPencil, BsTrash } from "react-icons/bs";
import Spinner from "@/components/spinner";
import Loader from "@/components/common/Loader";
import { UserContext } from "../../../layout";
import toast from "react-hot-toast";

const StoryDetails = () => {
  const { uuid } = useParams();
  const router = useRouter();
  const { userDetails } = useContext(UserContext);
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchStory = async () => {
      try {
        const response = await axios.get(
          `${server_url}/success-stories/${uuid}`,
          {
            headers: headers,
          }
        );

        if (response.data.status) {
          setStory(response.data.body);
        } else {
          toast.error("Failed to fetch success story details");
          router.push("/successStories");
        }
      } catch (error) {
        console.error("Error fetching success story:", error);
        toast.error("Error fetching success story details");
        router.push("/successStories");
      } finally {
        setLoading(false);
      }
    };

    if (uuid) {
      fetchStory();
    }
  }, [uuid, router]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this success story?")) {
      return;
    }

    try {
      setDeleting(true);
      const response = await axios.delete(
        `${server_url}/success-stories/${uuid}`,
        {
          headers: headers,
        }
      );

      if (response.status === 200 || response.status === 204) {
        toast.success("Success story deleted successfully");
        router.push("/successStories");
      } else {
        toast.error("Failed to delete success story");
      }
    } catch (error) {
      console.error("Error deleting success story:", error);
      toast.error("Error deleting success story");
    } finally {
      setDeleting(false);
    }
  };

  const extractYouTubeVideoId = (url) => {
    const regExp =
      /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url?.match(regExp);
    return match && match[7].length === 11 ? match[7] : null;
  };

  if (loading) {
    return <Loader />;
  }

  if (!story) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Success Story Not Found
          </h2>
          <Link
            href="/successStories"
            className="text-blue-600 hover:text-blue-800"
          >
            Back to Success Stories
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/successStories"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
        >
          <BsArrowLeft />
          Back to Success Stories
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{story.title}</h1>
            <p className="mt-2 text-gray-600">
              Published on {new Date(story.createdAt).toLocaleDateString()}
            </p>
          </div>
          {["Admin", "Enterprenuer"].includes(userDetails?.role) && (
            <div className="flex gap-3">
              <Link
                href={`/successStories/${story.uuid}/edit`}
                className="inline-flex items-center gap-2 px-4 py-2 border border-black/20 text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                <BsPencil />
                Edit
              </Link>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? (
                  <>
                    <Spinner />
                    Deleting...
                  </>
                ) : (
                  <>
                    <BsTrash />
                    Delete
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Video */}
        {story.videoLink && (
          <div className="aspect-video bg-gray-900">
            <iframe
              src={`https://www.youtube.com/embed/${extractYouTubeVideoId(
                story.videoLink
              )}`}
              className="w-full h-full"
              frameBorder="0"
              allowFullScreen
              title={story.title}
            />
          </div>
        )}

        <div className="p-6">
          {/* Description */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Story</h2>
            <div
              className="text-gray-700 leading-relaxed prose max-w-none"
              dangerouslySetInnerHTML={{ __html: story.description }}
            />
          </div>

          {/* External Video Link */}
          {story.videoLink && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Watch on YouTube
              </h2>
              <a
                href={story.videoLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-red-600 hover:text-red-800"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
                View on YouTube →
              </a>
            </div>
          )}

          {/* Metadata */}
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Story Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="font-medium text-gray-600">Published:</span>
                <p className="text-gray-900">
                  {new Date(story.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Last Updated:</span>
                <p className="text-gray-900">
                  {new Date(story.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex flex-col sm:flex-row gap-4">
        {story.videoLink && (
          <a
            href={story.videoLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
            Watch on YouTube
          </a>
        )}

        <Link
          href="/successStories"
          className="inline-flex items-center justify-center px-6 py-3 border border-black/20 text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
        >
          Back to Success Stories
        </Link>
      </div>
    </div>
  );
};

export default StoryDetails;
