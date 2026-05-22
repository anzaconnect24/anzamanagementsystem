"use client";

import { UserContext } from "@/layouts/DashboardLayout";
import Spinner from "@/components/spinner";
import { addMentorReport } from "@/controllers/mentorReportsController";
import { useContext, useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "@/utils/navigation";
import { useParams } from "react-router-dom";

const Page = () => {
  const entreprenuer_uuid = useParams().uuid;
  const { userDetails } = useContext(UserContext);
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [significantProgress, setSignificantProgress] =
    useState(false);
  const [supportNeeded, setSupportNeeded] =
    useState(false);
  const [sessionRating, setSessionRating] =
    useState(3);

  const handleSubmit = (e) => {
    e.preventDefault();

    const formData = new FormData();

    setLoading(true);

    formData.append("mentor_uuid", userDetails.uuid);
    formData.append(
      "entreprenuer_uuid",
      entreprenuer_uuid,
    );
    formData.append("title", e.target.title.value);
    formData.append(
      "sessionOverview",
      e.target.sessionOverview.value,
    );
    formData.append(
      "menteeEngagementRating",
      e.target.menteeEngagementRating.value,
    );
    formData.append(
      "menteeEngagementComments",
      e.target.menteeEngagementComments.value,
    );
    formData.append(
      "significantProgress",
      significantProgress,
    );
    formData.append(
      "progressDetails",
      e.target.progressDetails?.value || "",
    );
    formData.append(
      "areasForImprovement",
      e.target.areasForImprovement.value,
    );
    formData.append(
      "nextSteps",
      e.target.nextSteps.value,
    );
    formData.append(
      "supportNeeded",
      supportNeeded,
    );
    formData.append(
      "supportDetails",
      e.target.supportDetails?.value || "",
    );
    formData.append(
      "overallFeedback",
      e.target.overallFeedback.value,
    );
    formData.append(
      "sessionRating",
      sessionRating,
    );

    if (e.target.file.files[0]) {
      formData.append(
        "file",
        e.target.file.files[0],
      );
    }

    addMentorReport(formData)
      .then(() => {
        setLoading(false);
        toast.success(
          "Report submitted successfully",
        );
        router.back();
      })
      .catch(() => {
        setLoading(false);
        toast.error("Failed to submit report");
      });
  };

  const inputClass =
    "w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#172033] outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100";

  const textareaClass =
    "w-full min-h-[140px] rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#172033] outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100";

  const sectionClass =
    "rounded-[28px] bg-white p-7 shadow-sm";

  const ratingColor =
    sessionRating <= 2
      ? "#ef4444"
      : sessionRating === 3
        ? "#f59e0b"
        : "#16a34a";

  return (
    <div className="min-h-screen px-6 py-4">
      {/* Hero Section */}
      <div className="relative mb-8 min-h-[320px] overflow-hidden rounded-[32px] shadow-xl">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('/images/mentor_hero.svg')",
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-[#c9672b]/30" />

        <div className="relative z-10 max-w-3xl p-10 text-white">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur-md">
            <span className="h-2.5 w-2.5 rounded-full bg-[#f08a3c]" />
            Mentor Report
          </div>

          <h1 className="mb-4 text-4xl font-bold leading-tight">
            Submit Session Report
          </h1>

          <p className="max-w-2xl text-lg leading-8 text-white/85">
            Capture session outcomes, mentee
            engagement, progress evidence,
            development priorities, and next-step
            recommendations to support entrepreneur
            growth and mentoring effectiveness.
          </p>
        </div>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {/* Report Details */}
        <div className={sectionClass}>
          <SectionHeader
            title="Report Details"
            description="Give this report a clear title so it can be tracked easily in future reviews."
          />

          <label className="mb-2 block text-sm font-medium text-[#172033]">
            Report Title{" "}
            <span className="text-red-500">*</span>
          </label>

          <input
            className={inputClass}
            required
            name="title"
            placeholder="e.g., Q1 2026 Mentorship Session - Marketing Strategy"
          />
        </div>

        {/* Session Overview */}
        <div className={sectionClass}>
          <SectionHeader
            title="1. Session Overview"
            description="Summarize the topics discussed, key decisions, and main insights from the session."
          />

          <textarea
            className={textareaClass}
            required
            name="sessionOverview"
            placeholder="Describe the main topics covered, discussions held, and important outcomes from the session..."
          />
        </div>

        {/* Mentee Engagement */}
        <div className={sectionClass}>
          <SectionHeader
            title="2. Mentee Engagement"
            description="Assess how actively the mentee participated and responded during the mentoring session."
          />

          <RadioGroup
            name="menteeEngagementRating"
            options={[
              {
                value: "excellent",
                label: "Excellent",
              },
              {
                value: "good",
                label: "Good",
              },
              {
                value: "fair",
                label: "Fair",
              },
              {
                value: "needs-improvement",
                label:
                  "Needs Improvement",
              },
            ]}
          />

          <label className="mb-2 mt-6 block text-sm font-medium text-[#172033]">
            Comments on Mentee Engagement{" "}
            <span className="text-red-500">*</span>
          </label>

          <textarea
            className={textareaClass}
            required
            name="menteeEngagementComments"
            placeholder="Provide observations about participation, responsiveness, communication, and overall engagement..."
          />
        </div>

        {/* Mentee Progress */}
        <div className={sectionClass}>
          <SectionHeader
            title="3. Mentee Progress"
            description="Record whether there has been visible progress, improvement, or challenges since the last session."
          />

          <RadioGroup
            name="significantProgressRadio"
            options={[
              {
                value: "yes",
                label: "Yes",
                onChange: () =>
                  setSignificantProgress(
                    true,
                  ),
              },
              {
                value: "no",
                label: "No",
                onChange: () =>
                  setSignificantProgress(
                    false,
                  ),
              },
            ]}
          />

          {significantProgress && (
            <div className="mt-6 rounded-2xl bg-green-50 p-5">
              <label className="mb-2 block text-sm font-medium text-[#172033]">
                Progress Details{" "}
                <span className="text-red-500">
                  *
                </span>
              </label>

              <textarea
                className={textareaClass}
                required={
                  significantProgress
                }
                name="progressDetails"
                placeholder="Describe the improvements achieved and challenges encountered..."
              />
            </div>
          )}
        </div>

        {/* Areas for Improvement */}
        <div className={sectionClass}>
          <SectionHeader
            title="4. Areas for Improvement"
            description="Identify the capabilities, skills, or operational areas that need additional focus and development."
          />

          <textarea
            className={textareaClass}
            required
            name="areasForImprovement"
            placeholder="Identify skills, business areas, or competencies that require improvement..."
          />
        </div>

        {/* Next Steps */}
        <div className={sectionClass}>
          <SectionHeader
            title="5. Next Steps"
            description="Define agreed action items, deliverables, goals, or follow-up priorities."
          />

          <textarea
            className={textareaClass}
            required
            name="nextSteps"
            placeholder="List action items, goals, deadlines, and planned next steps..."
          />
        </div>

        {/* Support Needed */}
        <div className={sectionClass}>
          <SectionHeader
            title="6. Support Needed"
            description="Indicate whether additional resources, technical guidance, or program support are required."
          />

          <RadioGroup
            name="supportNeededRadio"
            options={[
              {
                value: "yes",
                label: "Yes",
                onChange: () =>
                  setSupportNeeded(true),
              },
              {
                value: "no",
                label: "No",
                onChange: () =>
                  setSupportNeeded(
                    false,
                  ),
              },
            ]}
          />

          {supportNeeded && (
            <div className="mt-6 rounded-2xl bg-amber-50 p-5">
              <label className="mb-2 block text-sm font-medium text-[#172033]">
                Support Details{" "}
                <span className="text-red-500">
                  *
                </span>
              </label>

              <textarea
                className={textareaClass}
                required={supportNeeded}
                name="supportDetails"
                placeholder="Specify the additional support, resources, or interventions required..."
              />
            </div>
          )}
        </div>

        {/* Overall Feedback */}
        <div className={sectionClass}>
          <SectionHeader
            title="7. Overall Feedback"
            description="Add additional comments, reflections, or observations about the mentoring session."
          />

          <textarea
            className={textareaClass}
            required
            name="overallFeedback"
            placeholder="Provide general feedback, recommendations, or observations..."
          />
        </div>

        {/* Session Rating */}
        <div className={sectionClass}>
          <SectionHeader
            title="8. Session Rating"
            description="Rate the overall effectiveness and impact of the mentoring session."
          />

          <div className="mt-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              {[1, 2, 3, 4, 5].map(
                (number) => (
                  <span
                    key={number}
                    className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold transition ${
                      sessionRating >=
                      number
                        ? "text-white"
                        : "bg-[#f8f8f6] text-[#6f6f72]"
                    }`}
                    style={{
                      backgroundColor:
                        sessionRating >=
                        number
                          ? ratingColor
                          : undefined,
                    }}
                  >
                    {number}
                  </span>
                ),
              )}
            </div>

            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={sessionRating}
              onChange={(e) =>
                setSessionRating(
                  Number(
                    e.target.value,
                  ),
                )
              }
              className="h-3 w-full cursor-pointer appearance-none rounded-full outline-none"
              style={{
                background: `linear-gradient(to right, ${ratingColor} ${
                  ((sessionRating - 1) /
                    4) *
                  100
                }%, #e5e7eb ${
                  ((sessionRating - 1) /
                    4) *
                  100
                }%)`,
              }}
            />

            <div className="mt-3 flex justify-between text-xs font-medium text-[#8a8f98]">
              <span>Poor</span>
              <span>Excellent</span>
            </div>

            <input
              type="hidden"
              name="sessionRating"
              value={sessionRating}
            />
          </div>
        </div>

        {/* Supporting Documents */}
        <div className={sectionClass}>
          <SectionHeader
            title="Supporting Documents"
            description="Upload optional supporting files or reference materials from the mentoring session."
          />

          <input
            className={inputClass}
            type="file"
            name="file"
            accept=".pdf,.doc,.docx,.ppt,.pptx"
          />

          <p className="mt-3 text-xs text-[#8a8f98]">
            Accepted formats: PDF, DOC, DOCX,
            PPT, PPTX
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap justify-start gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-xl bg-white px-6 py-3 text-sm font-medium text-[#6f6f72] shadow-sm transition hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="inline-flex min-w-[180px] items-center justify-center rounded-xl bg-green-600 px-8 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            disabled={loading}
          >
            {loading ? (
              <Spinner />
            ) : (
              "Submit Report"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

const SectionHeader = ({
  title,
  description,
}) => {
  const match = title.match(
    /^(\d+)\.\s(.*)$/,
  );

  const number = match
    ? match[1].padStart(2, "0")
    : null;

  const cleanTitle = match
    ? match[2]
    : title;

  return (
    <div className="mb-5">
      <div className="flex items-center gap-3">
        {number && (
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eef2ff] text-sm font-bold text-[#4f6ef7]">
            {number}
          </div>
        )}

        <h2 className="text-[22px] font-bold text-[#172033]">
          {cleanTitle}
        </h2>
      </div>

      {description && (
        <p className="mt-4 text-sm leading-7 text-[#6f6f72]">
          {description}
        </p>
      )}
    </div>
  );
};

const RadioGroup = ({
  name,
  options,
}) => (
  <div className="grid gap-3 sm:grid-cols-2">
    {options.map((option) => (
      <label
        key={option.value}
        className="flex cursor-pointer items-center gap-3 rounded-2xl border border-gray-200 bg-[#fafafa] px-4 py-4 text-sm text-[#172033] transition hover:border-green-600 hover:bg-green-50"
      >
        <input
          type="radio"
          name={name}
          value={option.value}
          required
          onChange={option.onChange}
          className="h-4 w-4 text-green-600 focus:ring-green-600"
        />

        <span>{option.label}</span>
      </label>
    ))}
  </div>
);

export default Page;