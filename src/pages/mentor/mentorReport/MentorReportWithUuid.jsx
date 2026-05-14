"use client";

import { getSpecificReport } from "../../../controllers/mentorReportsController";
import Loader from "../../../components/common/Loader";
import { useTranslation } from "../../../locales";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const Page = () => {
  const { t } = useTranslation();
  const uuid = useParams().uuid;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSpecificReport(uuid)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching report:", error);
        setLoading(false);
      });
  }, [uuid]);

  const getEngagementLabel = (rating) => {
    const labels = {
      excellent: "Excellent",
      good: "Good",
      fair: "Fair",
      "needs-improvement": "Needs Improvement",
    };

    return labels[rating] || rating;
  };

  const getEngagementStyle = (rating) => {
    const styles = {
      excellent: "bg-emerald-50 text-emerald-700",
      good: "bg-blue-50 text-blue-700",
      fair: "bg-amber-50 text-amber-700",
      "needs-improvement": "bg-red-50 text-red-700",
    };

    return styles[rating] || "bg-gray-50 text-gray-700";
  };

  const getRatingStars = (rating) => {
    if (!rating) return null;

    return (
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`h-5 w-5 ${
              star <= rating ? "text-yellow-400" : "text-gray-300"
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}

        <span className="ml-2 text-sm font-semibold text-gray-700">
          {rating}/5
        </span>
      </div>
    );
  };

  const InfoCard = ({ label, value, icon }) => (
    <div className="rounded-3xl bg-white/90 p-5 shadow-sm backdrop-blur-sm transition-all hover:shadow-md">
      <div className="flex h-full flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            {icon}
          </div>
        </div>

        <div className="mt-10">
          <p className="text-2xl font-semibold text-gray-900">
            {value || "N/A"}
          </p>

          <p className="mt-2 text-sm font-medium text-gray-500">
            {label}
          </p>
        </div>
      </div>
    </div>
  );

  const Section = ({ number, title, children }) => (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-sm font-bold text-primary">
          {number}
        </span>

        <h2 className="text-lg font-semibold text-gray-900">
          {title}
        </h2>
      </div>

      {children}
    </div>
  );

  const TextBlock = ({ label, value }) => (
    <div className="rounded-2xl bg-gray-50/80 p-5">
      {label && (
        <p className="mb-2 text-sm font-medium text-gray-500">
          {label}
        </p>
      )}

      <p className="whitespace-pre-wrap text-sm leading-7 text-gray-700">
        {value}
      </p>
    </div>
  );

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gray-950 shadow-xl">
        <img
          src="/images/mentor_hero.svg"
          alt="Mentor report"
          className="absolute inset-0 h-full w-full object-cover opacity-60"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/65 to-black/20" />

        <div className="relative z-10 px-6 py-10 md:px-10 md:py-12">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-medium text-white backdrop-blur-md">
              <span className="h-2.5 w-2.5 rounded-full bg-orange-400" />
              Mentor Report
            </div>

            <h1 className="text-3xl font-bold leading-tight text-white md:text-4xl">
              {data?.title || t("mentor.reports", "Report")}
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/85 md:text-base">
              Review session outcomes, mentee engagement, progress indicators,
              support needs, and mentor recommendations in one structured view.
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <InfoCard
          label="Mentor Name"
          value={data?.Mentor?.name}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5.121 17.804A9 9 0 1118.88 17.8M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          }
        />

        <InfoCard
          label="Entrepreneur Name"
          value={data?.Entreprenuer?.name}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 20h5V4H2v16h5m10 0v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4m10 0H7"
              />
            </svg>
          }
        />

        <InfoCard
          label="Report Submitted"
          value={
            data?.createdAt
              ? new Date(data.createdAt).toLocaleDateString(
                  undefined,
                  {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  },
                )
              : "N/A"
          }
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 7V3m8 4V3m-9 8h10m-13 9h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v11a2 2 0 002 2z"
              />
            </svg>
          }
        />
      </div>

      {/* Main Content */}
      <div className="space-y-5">
        {data?.sessionOverview && (
          <Section
            number="01"
            title={t(
              "mentor.sessionOverview",
              "Session Overview",
            )}
          >
            <TextBlock value={data.sessionOverview} />
          </Section>
        )}

        {(data?.menteeEngagementRating ||
          data?.menteeEngagementComments) && (
          <Section
            number="02"
            title={t(
              "mentor.menteeEngagement",
              "Mentee Engagement",
            )}
          >
            <div className="space-y-4">
              {data?.menteeEngagementRating && (
                <div>
                  <p className="mb-2 text-sm font-medium text-gray-500">
                    {t(
                      "mentor.engagementRating",
                      "Engagement Rating",
                    )}
                  </p>

                  <span
                    className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${getEngagementStyle(
                      data.menteeEngagementRating,
                    )}`}
                  >
                    {getEngagementLabel(
                      data.menteeEngagementRating,
                    )}
                  </span>
                </div>
              )}

              {data?.menteeEngagementComments && (
                <TextBlock
                  label={t("mentor.comments", "Comments")}
                  value={data.menteeEngagementComments}
                />
              )}
            </div>
          </Section>
        )}

        {(data?.significantProgress !== null ||
          data?.progressDetails) && (
          <Section
            number="03"
            title={t(
              "mentor.menteeProgress",
              "Mentee Progress",
            )}
          >
            <div className="space-y-4">
              {data?.significantProgress !== null && (
                <div>
                  <p className="mb-2 text-sm font-medium text-gray-500">
                    {t(
                      "mentor.significantImprovement",
                      "Significant Improvement / Challenges",
                    )}
                  </p>

                  <span
                    className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${
                      data.significantProgress
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-gray-50 text-gray-700"
                    }`}
                  >
                    {data.significantProgress
                      ? t("common.yes", "Yes")
                      : t("common.no", "No")}
                  </span>
                </div>
              )}

              {data?.progressDetails && (
                <TextBlock
                  label={t(
                    "mentor.progressDetails",
                    "Details",
                  )}
                  value={data.progressDetails}
                />
              )}
            </div>
          </Section>
        )}

        {data?.areasForImprovement && (
          <Section
            number="04"
            title={t(
              "mentor.areasForImprovement",
              "Areas for Improvement",
            )}
          >
            <TextBlock value={data.areasForImprovement} />
          </Section>
        )}

        {data?.nextSteps && (
          <Section
            number="05"
            title={t("mentor.nextSteps", "Next Steps")}
          >
            <TextBlock value={data.nextSteps} />
          </Section>
        )}

        {(data?.supportNeeded !== null ||
          data?.supportDetails) && (
          <Section
            number="06"
            title={t(
              "mentor.supportNeeded",
              "Support Needed",
            )}
          >
            <div className="space-y-4">
              {data?.supportNeeded !== null && (
                <div>
                  <p className="mb-2 text-sm font-medium text-gray-500">
                    {t(
                      "mentor.additionalSupport",
                      "Additional Support Required",
                    )}
                  </p>

                  <span
                    className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${
                      data.supportNeeded
                        ? "bg-amber-50 text-amber-700"
                        : "bg-gray-50 text-gray-700"
                    }`}
                  >
                    {data.supportNeeded
                      ? t("common.yes", "Yes")
                      : t("common.no", "No")}
                  </span>
                </div>
              )}

              {data?.supportDetails && (
                <TextBlock
                  label={t(
                    "mentor.supportDetails",
                    "Details",
                  )}
                  value={data.supportDetails}
                />
              )}
            </div>
          </Section>
        )}

        {data?.overallFeedback && (
          <Section
            number="07"
            title={t(
              "mentor.overallFeedback",
              "Overall Feedback",
            )}
          >
            <TextBlock value={data.overallFeedback} />
          </Section>
        )}

        {data?.sessionRating && (
          <Section
            number="08"
            title={t(
              "mentor.sessionRating",
              "Session Rating",
            )}
          >
            <div className="rounded-2xl bg-gray-50/80 p-5">
              <p className="mb-3 text-sm font-medium text-gray-500">
                {t(
                  "mentor.overallEffectiveness",
                  "Overall Session Effectiveness",
                )}
              </p>

              {getRatingStars(data.sessionRating)}
            </div>
          </Section>
        )}

        {(data?.description || data?.url) && (
          <Section
            number="09"
            title={t(
              "mentor.additionalInformation",
              "Additional Information",
            )}
          >
            <div className="space-y-4">
              {data?.description && (
                <TextBlock
                  label={t(
                    "mentor.description",
                    "Description",
                  )}
                  value={data.description}
                />
              )}

              {data?.url && (
                <div className="rounded-2xl bg-gray-50/80 p-5">
                  <p className="mb-3 text-sm font-medium text-gray-500">
                    {t(
                      "mentor.attachedDocument",
                      "Attached Document",
                    )}
                  </p>

                  <button
                    onClick={() =>
                      window.open(data.url, "_blank")
                    }
                    className="inline-flex items-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
                  >
                    Open Document
                  </button>
                </div>
              )}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
};

export default Page;