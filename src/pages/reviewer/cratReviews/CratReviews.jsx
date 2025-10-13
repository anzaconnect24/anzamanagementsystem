"use client";
import { useState, useEffect, useContext, useCallback } from "react";
import { useRouter } from "@/utils/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import { server_url } from "@/utils/endpoint";
import { headers } from "@/utils/headers";
import { UserContext } from "../../../layouts/DashboardLayout";

import Spinner from "@/components/spinner";
import Loader from "@/components/common/Loader";
import {
  MdRateReview,
  MdAssignment,
  MdCheckCircle,
  MdSearch,
} from "react-icons/md";

const CratReviewsPage = () => {
  const { userDetails } = useContext(UserContext);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReview, setSelectedReview] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reviewComments, setReviewComments] = useState("");

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${server_url}/crat_reviews/reviewer/${userDetails.id}`,
        {
          headers,
          params: {
            page: currentPage,
            limit,
            search: searchTerm || undefined,
          },
        }
      );

      if (response.data.status) {
        console.log(response.data.body.data);
        setReviews(response.data.body.data || []);
        setTotal(response.data.body.count || 0);
      }
    } catch (error) {
      console.error("Error fetching CRAT reviews:", error);
      toast.error("Failed to fetch CRAT reviews");
    } finally {
      setLoading(false);
    }
  }, [userDetails.id, currentPage, limit, searchTerm]);

  useEffect(() => {
    if (!["Staff"].includes(userDetails?.role)) {
      router.push("/");
      return;
    }
    fetchReviews();
  }, [userDetails?.role, fetchReviews]);

  const handleStartReview = async (review) => {
    try {
      const response = await axios.put(
        `${server_url}/crat_reviews/${review.uuid}`,
        { status: "in_review" },
        { headers }
      );

      if (response.data.status) {
        toast.success("Review started!");
        fetchReviews();
      }
    } catch (error) {
      console.error("Error starting review:", error);
      toast.error("Error starting review");
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewComments.trim()) {
      toast.error("Please provide review comments");
      return;
    }

    try {
      setSubmitting(true);
      const response = await axios.put(
        `${server_url}/crat_reviews/${selectedReview.uuid}/review`,
        {
          reviewer_comments: reviewComments.trim(),
        },
        { headers }
      );

      if (response.data.status) {
        toast.success("Review submitted successfully!");
        setShowReviewModal(false);
        setSelectedReview(null);
        setReviewComments("");
        fetchReviews();
      } else {
        toast.error(response.data.message || "Failed to submit review");
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Error submitting review");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "assigned":
        return <MdAssignment className="text-blue-500" />;
      case "in_review":
        return <MdRateReview className="text-purple-500" />;
      case "reviewed":
        return <MdCheckCircle className="text-green-500" />;
      default:
        return <MdAssignment className="text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "assigned":
        return "bg-blue-100 text-blue-800";
      case "in_review":
        return "bg-purple-100 text-purple-800";
      case "reviewed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const totalPages = Math.ceil(total / limit);

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="rounded-xl border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        {/* Header */}
        <div className="p-6 border-b border-stroke dark:border-strokedark">
          <h4 className="text-xl font-semibold text-black dark:text-white">
            My CRAT Review Assignments
          </h4>
          <p className="mt-2 text-bodydark2">
            Review CRAT assessments assigned to you and provide professional
            feedback.
          </p>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-stroke dark:border-strokedark">
          <div className="relative">
            <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by entrepreneur name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-black/20 rounded-lg focus:ring-primary focus:border-primary dark:border-strokedark dark:bg-form-input dark:text-white"
            />
          </div>
        </div>

        {/* Reviews List */}
        <div className="p-6">
          {reviews.length === 0 ? (
            <div className="text-center py-12">
              <MdRateReview className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                No CRAT reviews assigned
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                CRAT review assignments will appear here when admin assigns them
                to you.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviews.map((review) => (
                <div
                  key={review.uuid}
                  className="bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300"
                >
                  {/* Card Header */}
                  {/* <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(review.status)}
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          review.status
                        )}`}
                      >
                        {review.status.replace("_", " ").toUpperCase()}
                      </span>
                    </div>
                  </div> */}

                  {/* Entrepreneur Profile Image */}
                  <div className="mb-4">
                    <div className="w-full h-48 overflow-hidden bg-gray-200 rounded-lg">
                      <img
                        src={review.entrepreneur.image || "/user.png"}
                        alt={review.entrepreneur.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = "/user.png";
                        }}
                      />
                    </div>
                  </div>

                  {/* Entrepreneur Details */}
                  <div className="mb-1">
                    <h6 className="font-semibold text-black dark:text-white truncate mb-1">
                      {review.entrepreneur.Business?.name || "N/A"}
                    </h6>
                    <p className="text-sm text-bodydark2 truncate">
                      {review.entrepreneur.email}
                    </p>
                  </div>

                  {/* Assignment Date */}
                  <div className="mb-4">
                    <p className="text-xs text-bodydark2">
                      Assigned on{" "}
                      {new Date(review.assigned_at).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Entrepreneur Comments Preview */}
                  {/* <div className="mb-4">
                    <h6 className="font-medium text-black dark:text-white mb-2 text-sm">
                      Comments:
                    </h6>
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      <p className="text-bodydark2 text-sm line-clamp-3">
                        {review.comments}
                      </p>
                    </div>
                  </div> */}

                  {/* Review Comments (if already reviewed) */}
                  {review.reviewer_comments && (
                    <div className="mb-4">
                      <h6 className="font-medium text-black dark:text-white mb-2 text-sm">
                        Your Review:
                      </h6>
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                        <p className="text-bodydark2 text-sm line-clamp-2">
                          {review.reviewer_comments}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="space-y-2">
                    {/* View Business Details Button - Always visible */}
                    <button
                      onClick={() => {
                        router.push(
                          `/dashboard/report?user_uuid=${review.entrepreneur.uuid}`
                        );
                      }}
                      className="flex-1 px-3 py-2 bg-primary w-full text-white rounded-lg hover:bg-sky-700 text-sm mt-1"
                    >
                      View CRAT Report
                    </button>

                    <div className="flex gap-2">
                      {review.status === "assigned" && (
                        <>
                          <button
                            onClick={() => handleStartReview(review)}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                          >
                            <MdRateReview />
                            Start
                          </button>
                          <button
                            onClick={() => {
                              setSelectedReview(review);
                              setShowReviewModal(true);
                            }}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-colors text-sm"
                          >
                            <MdCheckCircle />
                            Submit
                          </button>
                        </>
                      )}

                      {review.status === "in_review" && (
                        <button
                          onClick={() => {
                            setSelectedReview(review);
                            setShowReviewModal(true);
                          }}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-colors text-sm"
                        >
                          <MdCheckCircle />
                          Submit Review
                        </button>
                      )}

                      {review.status === "reviewed" && (
                        <div className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-100 text-green-800 rounded-lg text-sm">
                          <MdCheckCircle />
                          Completed
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
            <div className="mt-6 flex justify-center">
              <nav className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage <= 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-black/20 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        currentPage === page
                          ? "bg-primary text-white"
                          : "text-gray-500 bg-white border border-black/20 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}

                <button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage >= totalPages}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-black/20 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            </div>
          )}
        </div>
      </div>

      {/* Submit Review Modal */}
      {showReviewModal && selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-boxdark rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h5 className="text-lg font-semibold text-black dark:text-white mb-4">
              Submit CRAT Review
            </h5>

            {/* Entrepreneur Info */}
            <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                  <img
                    src={selectedReview.entrepreneur.image || "/user.png"}
                    alt={
                      selectedReview.entrepreneur.Business?.name ||
                      selectedReview.entrepreneur.name
                    }
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = "/user.png";
                    }}
                  />
                </div>
                <div>
                  <h6 className="font-medium text-black dark:text-white">
                    {selectedReview.entrepreneur.Business?.name ||
                      selectedReview.entrepreneur.name}
                  </h6>
                  <p className="text-sm text-bodydark2">
                    Email: {selectedReview.entrepreneur.email}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-black dark:text-white">
                  Their Comments:
                </p>
                <p className="text-sm text-bodydark2">
                  {selectedReview.comments}
                </p>
              </div>
            </div>

            {/* Review Comments */}
            <div className="mb-6">
              <label className="block font-medium text-black dark:text-white mb-2">
                Review Comments <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={6}
                value={reviewComments}
                onChange={(e) => setReviewComments(e.target.value)}
                placeholder="Provide detailed feedback on the CRAT assessment. Include strengths, weaknesses, and recommendations..."
                className="w-full px-4 py-3 border border-black/20 rounded-lg focus:ring-primary focus:border-primary dark:border-strokedark dark:bg-form-input dark:text-white"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSubmitReview}
                disabled={submitting || !reviewComments.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Spinner />
                    Submitting...
                  </>
                ) : (
                  <>
                    <MdCheckCircle />
                    Submit Review
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setSelectedReview(null);
                  setReviewComments("");
                }}
                className="px-4 py-2 border border-black/20 text-gray-700 rounded-lg hover:bg-gray-50"
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

export default CratReviewsPage;
