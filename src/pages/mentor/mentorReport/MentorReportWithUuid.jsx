"use client";
import { getSpecificReport } from "../../../controllers/mentorReportsController";
import Breadcrumb from "../../../components/Breadcrumbs/Breadcrumb";
import Loader from "../../../components/common/Loader";
import { useTranslation } from "../../../locales";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const Page = ({ params }) => {
  const { t } = useTranslation();
  const uuid = useParams().uuid;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSpecificReport(uuid).then((res) => {
      console.log(res);
      setLoading(false);
      setData(res);
    });
  }, []);

  const getEngagementLabel = (rating) => {
    const labels = {
      excellent: "Excellent",
      good: "Good",
      fair: "Fair",
      "needs-improvement": "Needs Improvement",
    };
    return labels[rating] || rating;
  };

  const getRatingStars = (rating) => {
    if (!rating) return null;
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-6 h-6 ${star <= rating ? "text-yellow-400" : "text-gray-300"}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="ml-2 text-gray-700 font-medium">({rating}/5)</span>
      </div>
    );
  };

  return loading ? (
    <Loader />
  ) : (
    <div className="">
      <Breadcrumb
        prevLink={"/dashboard/mentorReports"}
        pageName={data?.title || t("mentor.reports", "Report")}
        prevPage={t("mentor.mentorReports", "Mentor Reports")}
      />

      <div className="bg-white rounded-lg shadow-sm">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-6 rounded-t-lg">
          <h1 className="font-bold text-3xl mb-2">{data.title}</h1>
          <p className="text-white/90">
            {t(
              "mentor.sessionReportDetails",
              "Mentorship Session Report Details",
            )}
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Participant Information */}
          <div className="bg-gray-50 rounded-lg p-5 border-l-4 border-primary">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <svg
                className="w-6 h-6 mr-2 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              {t("mentor.participants", "Participants")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">
                  {t("mentor.mentorName", "Mentor")}
                </p>
                <p className="font-semibold text-gray-900">
                  {data.Mentor?.name}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">
                  {t("mentor.entrepreneurName", "Entrepreneur")}
                </p>
                <p className="font-semibold text-gray-900">
                  {data.Entreprenuer?.name}
                </p>
                <p className="text-sm text-gray-600">
                  {data.Entreprenuer?.Business?.name}
                </p>
              </div>
            </div>
          </div>

          {/* Session Overview */}
          {data.sessionOverview && (
            <div className="border-l-4 border-blue-500 pl-5">
              <h2 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">
                  1
                </span>
                {t("mentor.sessionOverview", "Session Overview")}
              </h2>
              <div className="bg-white border border-black/10 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {data.sessionOverview}
                </p>
              </div>
            </div>
          )}

          {/* Mentee Engagement */}
          {(data.menteeEngagementRating || data.menteeEngagementComments) && (
            <div className="border-l-4 border-green-500 pl-5">
              <h2 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                <span className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">
                  2
                </span>
                {t("mentor.menteeEngagement", "Mentee Engagement")}
              </h2>
              <div className="space-y-3">
                {data.menteeEngagementRating && (
                  <div className="bg-white border border-black/10 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-2">
                      {t("mentor.engagementRating", "Engagement Rating")}
                    </p>
                    <span
                      className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
                        data.menteeEngagementRating === "excellent"
                          ? "bg-green-100 text-green-800"
                          : data.menteeEngagementRating === "good"
                            ? "bg-blue-100 text-blue-800"
                            : data.menteeEngagementRating === "fair"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                      }`}
                    >
                      {getEngagementLabel(data.menteeEngagementRating)}
                    </span>
                  </div>
                )}
                {data.menteeEngagementComments && (
                  <div className="bg-white border border-black/10 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-2">
                      {t("mentor.comments", "Comments")}
                    </p>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {data.menteeEngagementComments}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mentee Progress */}
          {(data.significantProgress !== null || data.progressDetails) && (
            <div className="border-l-4 border-purple-500 pl-5">
              <h2 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                <span className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">
                  3
                </span>
                {t("mentor.menteeProgress", "Mentee Progress")}
              </h2>
              <div className="space-y-3">
                {data.significantProgress !== null && (
                  <div className="bg-white border border-black/10 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-2">
                      {t(
                        "mentor.significantImprovement",
                        "Significant Improvement/Challenges",
                      )}
                    </p>
                    <span
                      className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
                        data.significantProgress
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {data.significantProgress
                        ? t("common.yes", "Yes")
                        : t("common.no", "No")}
                    </span>
                  </div>
                )}
                {data.progressDetails && (
                  <div className="bg-white border border-black/10 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-2">
                      {t("mentor.progressDetails", "Details")}
                    </p>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {data.progressDetails}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Areas for Improvement */}
          {data.areasForImprovement && (
            <div className="border-l-4 border-orange-500 pl-5">
              <h2 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                <span className="bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">
                  4
                </span>
                {t("mentor.areasForImprovement", "Areas for Improvement")}
              </h2>
              <div className="bg-white border border-black/10 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {data.areasForImprovement}
                </p>
              </div>
            </div>
          )}

          {/* Next Steps */}
          {data.nextSteps && (
            <div className="border-l-4 border-indigo-500 pl-5">
              <h2 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                <span className="bg-indigo-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">
                  5
                </span>
                {t("mentor.nextSteps", "Next Steps")}
              </h2>
              <div className="bg-white border border-black/10 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {data.nextSteps}
                </p>
              </div>
            </div>
          )}

          {/* Support Needed */}
          {(data.supportNeeded !== null || data.supportDetails) && (
            <div className="border-l-4 border-pink-500 pl-5">
              <h2 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                <span className="bg-pink-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">
                  6
                </span>
                {t("mentor.supportNeeded", "Support Needed")}
              </h2>
              <div className="space-y-3">
                {data.supportNeeded !== null && (
                  <div className="bg-white border border-black/10 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-2">
                      {t(
                        "mentor.additionalSupport",
                        "Additional Support Required",
                      )}
                    </p>
                    <span
                      className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
                        data.supportNeeded
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {data.supportNeeded
                        ? t("common.yes", "Yes")
                        : t("common.no", "No")}
                    </span>
                  </div>
                )}
                {data.supportDetails && (
                  <div className="bg-white border border-black/10 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-2">
                      {t("mentor.supportDetails", "Details")}
                    </p>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {data.supportDetails}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Overall Feedback */}
          {data.overallFeedback && (
            <div className="border-l-4 border-teal-500 pl-5">
              <h2 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                <span className="bg-teal-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">
                  7
                </span>
                {t("mentor.overallFeedback", "Overall Feedback")}
              </h2>
              <div className="bg-white border border-black/10 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {data.overallFeedback}
                </p>
              </div>
            </div>
          )}

          {/* Session Rating */}
          {data.sessionRating && (
            <div className="border-l-4 border-yellow-500 pl-5">
              <h2 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                <span className="bg-yellow-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">
                  8
                </span>
                {t("mentor.sessionRating", "Session Rating")}
              </h2>
              <div className="bg-white border border-black/10 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-3">
                  {t(
                    "mentor.overallEffectiveness",
                    "Overall Session Effectiveness",
                  )}
                </p>
                {getRatingStars(data.sessionRating)}
              </div>
            </div>
          )}

          {/* Legacy Fields (if they exist) */}
          {(data.description || data.url) && (
            <div className="border-t pt-6 mt-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                {t("mentor.additionalInformation", "Additional Information")}
              </h2>
              <div className="space-y-3">
                {data.description && (
                  <div className="bg-white border border-black/10 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-2">
                      {t("mentor.description", "Description")}
                    </p>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {data.description}
                    </p>
                  </div>
                )}
                {data.url && (
                  <div className="bg-white border border-black/10 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-3">
                      {t("mentor.attachedDocument", "Attached Document")}
                    </p>
                    <button
                      onClick={() => window.open(data.url, "_blank")}
                      className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-opacity-90 transition-all duration-300"
                    >
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      {t("mentor.openDocument", "Open Document")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timestamp */}
          <div className="border-t pt-4 mt-6">
            <p className="text-sm text-gray-500">
              {t("mentor.reportSubmitted", "Report submitted on")}{" "}
              {new Date(data.createdAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
