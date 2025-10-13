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
import { useTranslation } from "@/locales";
import {
  MdCheckCircle,
  MdPending,
  MdAssignment,
  MdRateReview,
} from "react-icons/md";

// Resubmit handler for rejected reviews

const CratReviewPage = () => {
  const { t } = useTranslation();
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
  }, [userDetails?.role, userDetails?.id]);

  const handleResubmitReview = async () => {
    try {
      setSubmitting(true);
      if (!cratReview?.uuid) {
        toast.error(
          t(
            "cratReviewPage.errors.noReviewToResubmit",
            "No CRAT review found to resubmit."
          )
        );
        setSubmitting(false);
        return;
      }
      const response = await axios.put(
        `${server_url}/crat_reviews/${cratReview.uuid}`,
        { status: "pending" },
        { headers }
      );
      if (response.data.status) {
        toast.success(
          t(
            "cratReviewPage.toasts.resubmitted",
            "CRAT review resubmitted successfully! You will be notified once it's assigned for review."
          )
        );
        fetchCratReviews();
      } else {
        toast.error(
          response.data.message ||
            t(
              "cratReviewPage.errors.failedToResubmit",
              "Failed to resubmit CRAT review"
            )
        );
      }
    } catch (error) {
      console.error("Error resubmitting CRAT review:", error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error(
          t(
            "cratReviewPage.errors.resubmitError",
            "Error resubmitting CRAT review"
          )
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const fetchCratReviews = useCallback(async () => {
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
      toast.error(
        t("cratReviewPage.errors.failedToFetch", "Failed to fetch CRAT reviews")
      );
    } finally {
      setLoading(false);
    }
  }, [userDetails.id, t]);
  const handleSubmitReview = async () => {
    // Check if there's already a review
    if (hasReview) {
      toast.error(
        t(
          "cratReviewPage.errors.alreadyHasReview",
          "You already have a CRAT review. Only one review per entrepreneur is allowed."
        )
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
          t(
            "cratReviewPage.toasts.submitted",
            "CRAT review submitted successfully! You will be notified once it's assigned for review."
          )
        );
        fetchCratReviews();
      } else {
        toast.error(
          response.data.message ||
            t(
              "cratReviewPage.errors.failedToSubmit",
              "Failed to submit CRAT review"
            )
        );
      }
    } catch (error) {
      console.error("Error submitting CRAT review:", error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error(
          t("cratReviewPage.errors.submitError", "Error submitting CRAT review")
        );
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
        return t(
          "cratReviewPage.status.pendingAssignment",
          "Pending Assignment"
        );
      case "assigned":
        return t(
          "cratReviewPage.status.assignedToReviewer",
          "Assigned to Reviewer"
        );
      case "in_review":
        return t("cratReviewPage.status.underReview", "Under Review");
      case "reviewed":
        return t(
          "cratReviewPage.status.reviewCompleted",
          "Review Completed - Awaiting Final Decision"
        );
      case "accepted":
        return t("cratReviewPage.status.accepted", "Accepted");
      case "rejected":
        return t("cratReviewPage.status.rejected", "Rejected");
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
            {t("cratReviewPage.title", "CRAT Review System")}
          </h4>
          <p className="mt-2 text-bodydark2">
            {t(
              "cratReviewPage.subtitle",
              "Submit your CRAT assessment for professional review and get expert feedback."
            )}
          </p>
        </div>

        <div className="p-6">
          {/* Submit New Review Section */}
          {!hasReview && (
            <div className="mb-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h5 className="text-lg font-semibold text-black dark:text-white mb-4">
                {t(
                  "cratReviewPage.submitSection.title",
                  "Submit CRAT for Review"
                )}
              </h5>
              <p className="text-bodydark2 mb-4">
                {t(
                  "cratReviewPage.submitSection.description",
                  "Ready to get your CRAT assessment reviewed by our experts? Submit for professional review and feedback."
                )}
              </p>

              <button
                onClick={handleSubmitReview}
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-center font-medium text-white hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Spinner />
                    {t("cratReviewPage.buttons.submitting", "Submitting...")}
                  </>
                ) : (
                  <>
                    <MdRateReview />
                    {t(
                      "cratReviewPage.buttons.submitForReview",
                      "Submit for Review"
                    )}
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
                  {t(
                    "cratReviewPage.errors.alreadyHasReview",
                    "You already have a CRAT review. Only one review per entrepreneur is allowed."
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Review History */}
          <div>
            <h5 className="text-lg font-semibold text-black dark:text-white mb-4">
              {t("cratReviewPage.yourReviewTitle", "Your CRAT Review")}
            </h5>

            {!cratReview ? (
              <div className="text-center py-12">
                <MdRateReview className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {t("cratReviewPage.empty.noReview", "No review yet")}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t(
                    "cratReviewPage.empty.description",
                    "Submit your CRAT review to get expert feedback on your business readiness."
                  )}
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
                          {t(
                            "cratReviewPage.yourReviewTitle",
                            "Your CRAT Review"
                          )}
                        </h6>
                        <p className="text-sm text-bodydark2">
                          {t(
                            "cratReviewPage.labels.submittedOn",
                            "Submitted on"
                          )}{" "}
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
                        {t(
                          "cratReviewPage.labels.assignedReviewer",
                          "Assigned Reviewer:"
                        )}
                      </h6>
                      <p className="text-bodydark2 text-sm">
                        {cratReview.reviewer.name}{" "}
                      </p>
                    </div>
                  )}

                  {/* Reviewer Comments */}
                  {cratReview.reviewer_comments && (
                    <div className="mb-4">
                      <h6 className="font-medium text-black dark:text-white mb-2">
                        {t(
                          "cratReviewPage.labels.reviewerFeedback",
                          "Reviewer Feedback:"
                        )}
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
                        {t(
                          "cratReviewPage.labels.finalDecision",
                          "Final Decision:"
                        )}
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

                  {/* Resubmit Button for Rejected Review */}
                  {cratReview.status === "rejected" && (
                    <div className="mb-4">
                      <button
                        onClick={handleResubmitReview}
                        disabled={submitting}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-center font-medium text-white hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? (
                          <>
                            <Spinner />
                            {t(
                              "cratReviewPage.buttons.resubmitting",
                              "Resubmitting..."
                            )}
                          </>
                        ) : (
                          <>
                            <MdRateReview />
                            {t(
                              "cratReviewPage.buttons.resubmitForReview",
                              "Resubmit for Review"
                            )}
                          </>
                        )}
                      </button>
                      <p className="text-xs text-gray-500 mt-2">
                        {t(
                          "cratReviewPage.hints.addressFeedbackBeforeResubmit",
                          "Please ensure you have addressed the feedback before resubmitting."
                        )}
                      </p>
                    </div>
                  )}

                  {/* Timeline */}
                  <div className="text-xs text-bodydark2 space-y-1">
                    <p>
                      {t("cratReviewPage.timeline.submitted", "Submitted:")}{" "}
                      {new Date(cratReview.submitted_at).toLocaleString()}
                    </p>
                    {cratReview.assigned_at && (
                      <p>
                        {t("cratReviewPage.timeline.assigned", "Assigned:")}{" "}
                        {new Date(cratReview.assigned_at).toLocaleString()}
                      </p>
                    )}
                    {cratReview.reviewed_at && (
                      <p>
                        {t("cratReviewPage.timeline.reviewed", "Reviewed:")}{" "}
                        {new Date(cratReview.reviewed_at).toLocaleString()}
                      </p>
                    )}
                    {cratReview.finalized_at && (
                      <p>
                        {t("cratReviewPage.timeline.finalized", "Finalized:")}{" "}
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
