"use client";
import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import { server_url } from "@/app/utils/endpoint";
import { headers } from "@/app/utils/headers";
import { UserContext } from "../../layout";
import Spinner from "@/components/spinner";
import Loader from "@/components/common/Loader";
import {
  MdCheckCircle,
  MdPending,
  MdAssignment,
  MdRateReview,
} from "react-icons/md";

const CratReviewPage = () => {
  const { userDetails } = useContext(UserContext);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cratReview, setCratReview] = useState(null);
  const [hasReview, setHasReview] = useState(false);

  useEffect(() => {
    if (userDetails?.role !== "Enterprenuer") {
      router.push("/");
      return;
    }
    fetchCratReviews();
  }, [userDetails, router]);

  const fetchCratReviews = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${server_url}/crat_reviews/entrepreneur/${userDetails.id}`,
        { headers }
      );

      if (response.data.status) {
        const reviews = response.data.body.data || [];
        if (reviews.length > 0) {
          setCratReview(reviews[0]); // Only one review per entrepreneur
          setHasReview(true);
        } else {
          setCratReview(null);
          setHasReview(false);
        }
      }
    } catch (error) {
      console.error("Error fetching CRAT reviews:", error);
      toast.error("Failed to fetch CRAT reviews");
    } finally {
      setLoading(false);
    }
  };
  const handleSubmitReview = async () => {
    // Check if there's already a review
    if (hasReview) {
      toast.error(
        "You already have a CRAT review. Only one review per entrepreneur is allowed."
      );
      return;
    }

    try {
      setSubmitting(true);
      const response = await axios.post(
        `${server_url}/crat_reviews`,
        {
          entrepreneur_id: userDetails.id,
        },
        { headers }
      );

      if (response.data.status) {
        toast.success(
          "CRAT review submitted successfully! You will be notified once it's assigned for review."
        );
        fetchCratReviews();
      } else {
        toast.error(response.data.message || "Failed to submit CRAT review");
      }
    } catch (error) {
      console.error("Error submitting CRAT review:", error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Error submitting CRAT review");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <MdPending className="text-yellow-500" />;
      case "assigned":
        return <MdAssignment className="text-blue-500" />;
      case "in_review":
        return <MdRateReview className="text-purple-500" />;
      case "reviewed":
        return <MdRateReview className="text-orange-500" />;
      case "accepted":
        return <MdCheckCircle className="text-green-500" />;
      case "rejected":
        return <MdCheckCircle className="text-red-500" />;
      default:
        return <MdPending className="text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "pending":
        return "Pending Assignment";
      case "assigned":
        return "Assigned to Reviewer";
      case "in_review":
        return "Under Review";
      case "reviewed":
        return "Review Completed - Awaiting Final Decision";
      case "accepted":
        return "Accepted";
      case "rejected":
        return "Rejected";
      default:
        return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "assigned":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "in_review":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "reviewed":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "accepted":
        return "bg-green-100 text-green-800 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="rounded-xl border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        {/* Header */}
        <div className="p-6 border-b border-stroke dark:border-strokedark">
          <h4 className="text-xl font-semibold text-black dark:text-white">
            CRAT Review System
          </h4>
          <p className="mt-2 text-bodydark2">
            Submit your CRAT assessment for professional review and get expert
            feedback.
          </p>
        </div>

        <div className="p-6">
          {/* Submit New Review Section */}
          {!hasReview && (
            <div className="mb-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h5 className="text-lg font-semibold text-black dark:text-white mb-4">
                Submit CRAT for Review
              </h5>
              <p className="text-bodydark2 mb-4">
                Ready to get your CRAT assessment reviewed by our experts?
                Submit for professional review and feedback.
              </p>

              <button
                onClick={handleSubmitReview}
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-center font-medium text-white hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Spinner />
                    Submitting...
                  </>
                ) : (
                  <>
                    <MdRateReview />
                    Submit for Review
                  </>
                )}
              </button>
            </div>
          )}

          {/* Existing Review Alert */}
          {hasReview && (
            <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-2">
                <MdPending className="text-yellow-600 text-xl" />
                <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                  You already have a CRAT review. Only one review per
                  entrepreneur is allowed.
                </p>
              </div>
            </div>
          )}

          {/* Review History */}
          <div>
            <h5 className="text-lg font-semibold text-black dark:text-white mb-4">
              Your CRAT Review
            </h5>

            {!cratReview ? (
              <div className="text-center py-12">
                <MdRateReview className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No review yet
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Submit your CRAT review to get expert feedback on your
                  business readiness.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-6 border border-stroke dark:border-strokedark rounded-lg">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(cratReview.status)}
                      <div>
                        <h6 className="font-semibold text-black dark:text-white">
                          Your CRAT Review
                        </h6>
                        <p className="text-sm text-bodydark2">
                          Submitted on{" "}
                          {new Date(
                            cratReview.submitted_at
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                        cratReview.status
                      )}`}
                    >
                      {getStatusText(cratReview.status)}
                    </span>
                  </div>

                  {/* Reviewer Info */}
                  {cratReview.reviewer && (
                    <div className="mb-4">
                      <h6 className="font-medium text-black dark:text-white mb-2">
                        Assigned Reviewer:
                      </h6>
                      <p className="text-bodydark2 text-sm">
                        {cratReview.reviewer.firstName}{" "}
                        {cratReview.reviewer.lastName}
                      </p>
                    </div>
                  )}

                  {/* Reviewer Comments */}
                  {cratReview.reviewer_comments && (
                    <div className="mb-4">
                      <h6 className="font-medium text-black dark:text-white mb-2">
                        Reviewer Feedback:
                      </h6>
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                        <p className="text-bodydark2 text-sm">
                          {cratReview.reviewer_comments}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Admin Comments */}
                  {cratReview.admin_comments && (
                    <div className="mb-4">
                      <h6 className="font-medium text-black dark:text-white mb-2">
                        Final Decision:
                      </h6>
                      <div
                        className={`p-4 rounded-lg ${
                          cratReview.status === "accepted"
                            ? "bg-green-50 dark:bg-green-900/20"
                            : "bg-red-50 dark:bg-red-900/20"
                        }`}
                      >
                        <p className="text-bodydark2 text-sm">
                          {cratReview.admin_comments}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Timeline */}
                  <div className="text-xs text-bodydark2 space-y-1">
                    <p>
                      Submitted:{" "}
                      {new Date(cratReview.submitted_at).toLocaleString()}
                    </p>
                    {cratReview.assigned_at && (
                      <p>
                        Assigned:{" "}
                        {new Date(cratReview.assigned_at).toLocaleString()}
                      </p>
                    )}
                    {cratReview.reviewed_at && (
                      <p>
                        Reviewed:{" "}
                        {new Date(cratReview.reviewed_at).toLocaleString()}
                      </p>
                    )}
                    {cratReview.finalized_at && (
                      <p>
                        Finalized:{" "}
                        {new Date(cratReview.finalized_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CratReviewPage;
