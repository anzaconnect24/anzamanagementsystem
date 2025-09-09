"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "@/utils/navigation";
import Link from "@/utils/link";
import { server_url } from "@/utils/endpoint";
import { headers } from "@/utils/headers";
import {
  BsArrowLeft,
  BsPencil,
  BsTrash,
  BsCalendar,
  BsLink45deg,
} from "react-icons/bs";
import Spinner from "@/components/spinner";

const ViewInvestmentOpportunity = () => {
  const { uuid } = useParams();
  const router = useRouter();
  const [opportunity, setOpportunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const fetchOpportunity = async () => {
      try {
        const response = await fetch(
          `${server_url}/investment-opportunities/${uuid}`,
          {
            headers: headers,
          }
        );
        const data = await response.json();

        if (data.success) {
          setOpportunity(data.body);
        } else {
          alert("Failed to fetch opportunity details");
          router.push("/opportunities");
        }
      } catch (error) {
        console.error("Error fetching opportunity:", error);
        alert("Error fetching opportunity details");
        router.push("/opportunities");
      } finally {
        setLoading(false);
      }
    };

    if (uuid) {
      fetchOpportunity();
    }
  }, [uuid, router]);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const response = await fetch(
        `${server_url}/investment-opportunities/${uuid}`,
        {
          method: "DELETE",
          headers: headers,
        }
      );

      const data = await response.json();

      if (data.success) {
        router.push("/opportunities");
      } else {
        alert("Failed to delete opportunity");
      }
    } catch (error) {
      console.error("Error deleting opportunity:", error);
      alert("Error deleting opportunity");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  if (!opportunity) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Opportunity Not Found
          </h1>
          <Link
            href="/opportunities"
            className="text-blue-600 hover:text-blue-800"
          >
            ← Back to Opportunities
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
          href="/opportunities"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
        >
          <BsArrowLeft />
          Back to Opportunities
        </Link>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {opportunity.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <BsCalendar />
                Created: {new Date(opportunity.createdAt).toLocaleDateString()}
              </div>
              {opportunity.updatedAt !== opportunity.createdAt && (
                <div className="flex items-center gap-1">
                  <BsCalendar />
                  Updated:{" "}
                  {new Date(opportunity.updatedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <Link
              href={`/opportunities/${uuid}/edit`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <BsPencil />
              Edit
            </Link>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <BsTrash />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Image */}
        {opportunity.image && (
          <div className="w-full h-64 md:h-80">
            <img
              src={opportunity.image}
              alt={opportunity.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-6">
          {/* Description */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Description
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {opportunity.description}
              </p>
            </div>
          </div>

          {/* URL */}
          {opportunity.url && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Related Link
              </h2>
              <a
                href={opportunity.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 hover:underline"
              >
                <BsLink45deg />
                {opportunity.url}
              </a>
            </div>
          )}

          {/* Metadata */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Opportunity ID
                </label>
                <p className="text-gray-900 dark:text-white font-mono text-sm">
                  {opportunity.uuid}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Created Date
                </label>
                <p className="text-gray-900 dark:text-white">
                  {new Date(opportunity.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              {opportunity.updatedAt !== opportunity.createdAt && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Last Updated
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {new Date(opportunity.updatedAt).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Confirm Delete
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete "{opportunity.title}"? This action
              cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4">
                      <Spinner />
                    </div>
                    Deleting...
                  </div>
                ) : (
                  "Delete"
                )}
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewInvestmentOpportunity;
