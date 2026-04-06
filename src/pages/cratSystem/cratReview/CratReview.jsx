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
  MdRefresh,
} from "react-icons/md";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const CratReviewPage = () => {
  const { t } = useTranslation();
  const { userDetails, setUserDetails } = useContext(UserContext);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // All reviews for this entrepreneur (sorted newest-first)
  const [allReviews, setAllReviews] = useState([]);

  // Latest review convenience alias
  const latestReview = allReviews[0] || null;

  // True if ANY review is still active (in-progress)
  const hasActiveReview = allReviews.some((r) =>
    ["pending", "assigned", "in_review"].includes(r.status),
  );

  const isFirstSubmission = allReviews.length === 0;

  const isLatestTerminal =
    latestReview &&
    ["reviewed", "accepted", "rejected"].includes(latestReview.status);

  const terminalDate = latestReview?.finalized_at || latestReview?.reviewed_at;
  const elapsed = terminalDate
    ? Date.now() - new Date(terminalDate).getTime()
    : null;
  const canStartNewVersion =
    isLatestTerminal && elapsed !== null && elapsed >= THIRTY_DAYS_MS;
  const daysUntilNewVersion =
    isLatestTerminal && elapsed !== null && elapsed < THIRTY_DAYS_MS
      ? Math.ceil((THIRTY_DAYS_MS - elapsed) / (24 * 60 * 60 * 1000))
      : 0;

  useEffect(() => {
    if (userDetails?.role !== "Enterprenuer") {
      router.push("/");
      return;
    }
    fetchCratReviews();
  }, [userDetails?.role, userDetails?.id]);

  // Start a new version cycle (after 30-day cooldown)
  const handleStartNewVersion = async () => {
    if (!canStartNewVersion) return;
    try {
      setSubmitting(true);
      const response = await axios.post(
        `${server_url}/crat_reviews`,
        { entrepreneur_id: userDetails.id },
        { headers },
      );
      if (response.data.status) {
        toast.success(
          t(
            "cratReviewPage.toasts.newVersionStarted",
            "New version started! Your CRAT forms are now unlocked for editing.",
          ),
        );
        // Reset publishStatus locally so the user sees unlocked forms/report
        setUserDetails((prev) => ({ ...prev, publishStatus: "Draft" }));
        fetchCratReviews();
      } else {
        toast.error(
          response.data.message ||
            t(
              "cratReviewPage.errors.failedToStartNewVersion",
              "Failed to start new version",
            ),
        );
      }
    } catch (error) {
      console.error("Error starting new version:", error);
      toast.error(
        error.response?.data?.message ||
          t(
            "cratReviewPage.errors.newVersionError",
            "Error starting new version",
          ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleResubmitReview = async () => {
    try {
      setSubmitting(true);
      if (!latestReview?.uuid) {
        toast.error(
          t(
            "cratReviewPage.errors.noReviewToResubmit",
            "No CRAT review found to resubmit.",
          ),
        );
        setSubmitting(false);
        return;
      }
      const response = await axios.put(
        `${server_url}/crat_reviews/${latestReview.uuid}`,
        { status: "pending" },
        { headers },
      );
      if (response.data.status) {
        toast.success(
          t(
            "cratReviewPage.toasts.resubmitted",
            "CRAT review resubmitted successfully! You will be notified once it's assigned for review.",
          ),
        );
        fetchCratReviews();
      } else {
        toast.error(
          response.data.message ||
            t(
              "cratReviewPage.errors.failedToResubmit",
              "Failed to resubmit CRAT review",
            ),
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
            "Error resubmitting CRAT review",
          ),
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
        { headers },
      );

      if (response.data.status) {
        const reviews = response.data.body.data || [];
        setAllReviews(reviews);
      }
    } catch (error) {
      console.error("Error fetching CRAT reviews:", error);
      toast.error(
        t(
          "cratReviewPage.errors.failedToFetch",
          "Failed to fetch CRAT reviews",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [userDetails.id, t]);
  const handleSubmitReview = async () => {
    // Block if there's already an active review in progress
    if (hasActiveReview) {
      toast.error(
        t(
          "cratReviewPage.errors.activeReviewExists",
          "You already have an active review in progress. Please wait for it to complete.",
        ),
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
        { headers },
      );

      if (response.data.status) {
        toast.success(
          t(
            "cratReviewPage.toasts.submitted",
            "CRAT review submitted successfully! You will be notified once it's assigned for review.",
          ),
        );
        fetchCratReviews();
      } else {
        toast.error(
          response.data.message ||
            t(
              "cratReviewPage.errors.failedToSubmit",
              "Failed to submit CRAT review",
            ),
        );
      }
    } catch (error) {
      console.error("Error submitting CRAT review:", error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error(
          t(
            "cratReviewPage.errors.submitError",
            "Error submitting CRAT review",
          ),
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
          "Pending Assignment",
        );
      case "assigned":
        return t(
          "cratReviewPage.status.assignedToReviewer",
          "Assigned to Reviewer",
        );
      case "in_review":
        return t("cratReviewPage.status.underReview", "Under Review");
      case "reviewed":
        return t(
          "cratReviewPage.status.reviewCompleted",
          "Review Completed - Awaiting Final Decision",
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
        return "bg-gray-100 text-gray-800 border-black/10";
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
              "Submit your CRAT assessment for professional review and get expert feedback.",
            )}
          </p>
        </div>

        <div className="p-6">
          {/* ── First-time submit section (no reviews at all) ── */}
          {isFirstSubmission && (
            <div className="mb-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h5 className="text-lg font-semibold text-black dark:text-white mb-4">
                {t(
                  "cratReviewPage.submitSection.title",
                  "Submit CRAT for Review",
                )}
              </h5>
              <p className="text-bodydark2 mb-4">
                {t(
                  "cratReviewPage.submitSection.description",
                  "Ready to get your CRAT assessment reviewed by our experts? Submit for professional review and feedback.",
                )}
              </p>
              <button
                onClick={handleSubmitReview}
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-center font-medium text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
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
                      "Submit for Review",
                    )}
                  </>
                )}
              </button>
            </div>
          )}

          {/* ── Start New Version section (terminal review + 30-day cooldown) ── */}
          {!isFirstSubmission && !hasActiveReview && isLatestTerminal && (
            <div
              className={`mb-6 p-5 rounded-lg border ${
                canStartNewVersion
                  ? "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800"
                  : "bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700"
              }`}
            >
              <div className="flex items-start gap-3">
                <MdRefresh
                  className={`text-xl mt-0.5 flex-shrink-0 ${
                    canStartNewVersion ? "text-blue-600" : "text-gray-400"
                  }`}
                />
                <div className="flex-1">
                  <h5 className="font-semibold text-black dark:text-white mb-1">
                    {t(
                      "cratReviewPage.newVersion.title",
                      "Start New Version Cycle",
                    )}
                  </h5>
                  {canStartNewVersion ? (
                    <>
                      <p className="text-bodydark2 mb-3 text-sm">
                        {t(
                          "cratReviewPage.newVersion.description",
                          "Your previous review cycle is complete. You can now start a new version to update your CRAT and submit for a fresh review.",
                        )}
                      </p>
                      <button
                        onClick={handleStartNewVersion}
                        disabled={submitting}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? (
                          <>
                            <Spinner />
                            {t(
                              "cratReviewPage.buttons.starting",
                              "Starting...",
                            )}
                          </>
                        ) : (
                          <>
                            <MdRefresh />
                            {t(
                              "cratReviewPage.buttons.startNewVersion",
                              `Start Version ${allReviews.length + 1}`,
                            )}
                          </>
                        )}
                      </button>
                    </>
                  ) : (
                    <p className="text-bodydark2 text-sm">
                      {t(
                        "cratReviewPage.newVersion.cooldown",
                        `A new version cycle will be available in ${daysUntilNewVersion} day(s). The 30-day cooldown period applies between versions.`,
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Version history ── */}
          <div>
            <h5 className="text-lg font-semibold text-black dark:text-white mb-4">
              {allReviews.length > 1
                ? t(
                    "cratReviewPage.versionHistoryTitle",
                    "Review Version History",
                  )
                : t("cratReviewPage.yourReviewTitle", "Your CRAT Review")}
            </h5>

            {allReviews.length === 0 ? (
              <div className="text-center py-12">
                <MdRateReview className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {t("cratReviewPage.empty.noReview", "No review yet")}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t(
                    "cratReviewPage.empty.description",
                    "Submit your CRAT review to get expert feedback on your business readiness.",
                  )}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {allReviews.map((review, index) => {
                  const versionNumber =
                    review.version || allReviews.length - index;
                  const isLatest = index === 0;
                  return (
                    <div
                      key={review.uuid}
                      className={`p-6 border rounded-lg ${
                        isLatest
                          ? "border-primary/30 dark:border-primary/40 bg-primary/5 dark:bg-primary/10"
                          : "border-stroke dark:border-strokedark"
                      }`}
                    >
                      {/* Card header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(review.status)}
                          <div>
                            <div className="flex items-center gap-2">
                              <h6 className="font-semibold text-black dark:text-white">
                                {t("cratReviewPage.versionLabel", "Version")}{" "}
                                {versionNumber}
                              </h6>
                              {isLatest && (
                                <span className="px-2 py-0.5 bg-primary text-white text-xs rounded-full">
                                  {t("cratReviewPage.latest", "Latest")}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-bodydark2">
                              {t(
                                "cratReviewPage.labels.submittedOn",
                                "Submitted on",
                              )}{" "}
                              {new Date(
                                review.submitted_at,
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                            review.status,
                          )}`}
                        >
                          {getStatusText(review.status)}
                        </span>
                      </div>

                      {/* Reviewer feedback — reviewer name intentionally hidden from entrepreneur */}
                      {review.reviewer_comments && (
                        <div className="mb-4">
                          <h6 className="font-medium text-black dark:text-white mb-2">
                            {t(
                              "cratReviewPage.labels.reviewerFeedback",
                              "Reviewer Feedback:",
                            )}
                          </h6>
                          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                            <p className="text-bodydark2 text-sm">
                              {review.reviewer_comments}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Admin / final decision */}
                      {review.admin_comments && (
                        <div className="mb-4">
                          <h6 className="font-medium text-black dark:text-white mb-2">
                            {t(
                              "cratReviewPage.labels.finalDecision",
                              "Final Decision:",
                            )}
                          </h6>
                          <div
                            className={`p-4 rounded-lg ${
                              review.status === "accepted"
                                ? "bg-green-50 dark:bg-green-900/20"
                                : "bg-red-50 dark:bg-red-900/20"
                            }`}
                          >
                            <p className="text-bodydark2 text-sm">
                              {review.admin_comments}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Resubmit button — only on latest rejected review */}
                      {isLatest && review.status === "rejected" && (
                        <div className="mb-4">
                          <button
                            onClick={handleResubmitReview}
                            disabled={submitting}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-center font-medium text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {submitting ? (
                              <>
                                <Spinner />
                                {t(
                                  "cratReviewPage.buttons.resubmitting",
                                  "Resubmitting...",
                                )}
                              </>
                            ) : (
                              <>
                                <MdRateReview />
                                {t(
                                  "cratReviewPage.buttons.resubmitForReview",
                                  "Resubmit for Review",
                                )}
                              </>
                            )}
                          </button>
                          <p className="text-xs text-gray-500 mt-2">
                            {t(
                              "cratReviewPage.hints.addressFeedbackBeforeResubmit",
                              "Please ensure you have addressed the feedback before resubmitting.",
                            )}
                          </p>
                        </div>
                      )}

                      {/* Timeline */}
                      <div className="text-xs text-bodydark2 space-y-1 border-t border-stroke dark:border-strokedark pt-3 mt-3">
                        <p>
                          {t("cratReviewPage.timeline.submitted", "Submitted:")}{" "}
                          {new Date(review.submitted_at).toLocaleString()}
                        </p>
                        {review.assigned_at && (
                          <p>
                            {t("cratReviewPage.timeline.assigned", "Assigned:")}{" "}
                            {new Date(review.assigned_at).toLocaleString()}
                          </p>
                        )}
                        {review.reviewed_at && (
                          <p>
                            {t("cratReviewPage.timeline.reviewed", "Reviewed:")}{" "}
                            {new Date(review.reviewed_at).toLocaleString()}
                          </p>
                        )}
                        {review.finalized_at && (
                          <p>
                            {t(
                              "cratReviewPage.timeline.finalized",
                              "Finalized:",
                            )}{" "}
                            {new Date(review.finalized_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CratReviewPage;
