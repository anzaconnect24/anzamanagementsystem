"use client";
import { UserContext } from "@/layouts/DashboardLayout";
import Spinner from "@/components/spinner";
import { addMentorReport } from "@/controllers/mentorReportsController";
import { useContext, useState } from "react";
import Breadcrumb from "@/component/Breadcrumb";
import toast from "react-hot-toast";
import { useRouter } from "@/utils/navigation";
import { useParams } from "react-router-dom";

const Page = ({ params }) => {
  const entreprenuer_uuid = useParams().uuid;
  const { userDetails } = useContext(UserContext);
  const [loading, setLoading] = useState(false);
  const [significantProgress, setSignificantProgress] = useState(false);
  const [supportNeeded, setSupportNeeded] = useState(false);
  const router = useRouter();

  const handleSubmit = (e) => {
    e.preventDefault();
    var formData = new FormData();
    setLoading(true);
    formData.append("mentor_uuid", userDetails.uuid);
    formData.append("entreprenuer_uuid", entreprenuer_uuid);
    formData.append("title", e.target.title.value);

    // New structured fields
    formData.append("sessionOverview", e.target.sessionOverview.value);
    formData.append(
      "menteeEngagementRating",
      e.target.menteeEngagementRating.value,
    );
    formData.append(
      "menteeEngagementComments",
      e.target.menteeEngagementComments.value,
    );
    formData.append("significantProgress", significantProgress);
    formData.append("progressDetails", e.target.progressDetails?.value || "");
    formData.append("areasForImprovement", e.target.areasForImprovement.value);
    formData.append("nextSteps", e.target.nextSteps.value);
    formData.append("supportNeeded", supportNeeded);
    formData.append("supportDetails", e.target.supportDetails?.value || "");
    formData.append("overallFeedback", e.target.overallFeedback.value);
    formData.append("sessionRating", e.target.sessionRating.value);

    // Optional file upload
    if (e.target.file.files[0]) {
      formData.append("file", e.target.file.files[0]);
    }

    addMentorReport(formData)
      .then((res) => {
        setLoading(false);
        toast.success("Report submitted successfully");
        router.back();
      })
      .catch((err) => {
        setLoading(false);
        toast.error("Failed to submit report");
      });
  };

  return (
    <div>
      <Breadcrumb
        prevLink={"/mentorEntreprenuers"}
        pageName={"Mentorship Session Report"}
        prevPage={"My Mentees"}
      />
      <div className="bg-white p-6 w-full rounded-lg shadow-sm">
        <div className="mb-6">
          <h1 className="font-bold text-2xl text-gray-800">
            Submit Mentorship Session Report
          </h1>
          <p className="text-gray-600 mt-2">
            Please complete all sections to provide comprehensive feedback on
            the mentorship session.
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Report Title */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Report Title <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full px-4 py-2 border border-black/10 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              required
              name="title"
              placeholder="e.g., Q1 2026 Mentorship Session - Marketing Strategy"
            />
          </div>

          {/* 1. Session Overview */}
          <div className="border-l-4 border-primary pl-4">
            <h2 className="font-semibold text-lg text-gray-800 mb-3">
              1. Session Overview
            </h2>
            <label className="block text-sm text-gray-700 mb-2">
              Please provide a brief summary of the topics discussed and key
              insights from the session: <span className="text-red-500">*</span>
            </label>
            <textarea
              className="w-full px-4 py-3 border border-black/10 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent min-h-[120px]"
              required
              name="sessionOverview"
              placeholder="Describe the main topics covered, key discussions, and important takeaways..."
            />
          </div>

          {/* 2. Mentee Engagement */}
          <div className="border-l-4 border-primary pl-4">
            <h2 className="font-semibold text-lg text-gray-800 mb-3">
              2. Mentee Engagement
            </h2>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              How would you rate the mentee(s) engagement during the session?{" "}
              <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2 mb-4">
              {[
                { value: "excellent", label: "Excellent" },
                { value: "good", label: "Good" },
                { value: "fair", label: "Fair" },
                { value: "needs-improvement", label: "Needs Improvement" },
              ].map((option) => (
                <label
                  key={option.value}
                  className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded"
                >
                  <input
                    type="radio"
                    name="menteeEngagementRating"
                    value={option.value}
                    required
                    className="w-4 h-4 text-primary focus:ring-primary"
                  />
                  <span className="text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>

            <label className="block text-sm text-gray-700 mb-2">
              Comments on Mentee Engagement:{" "}
              <span className="text-red-500">*</span>
              <span className="block text-xs text-gray-500 mt-1">
                (What went well? How did the mentee(s) respond to the content?)
              </span>
            </label>
            <textarea
              className="w-full px-4 py-3 border border-black/10 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent min-h-[100px]"
              required
              name="menteeEngagementComments"
              placeholder="Share observations about the mentee's participation, questions asked, and responsiveness..."
            />
          </div>

          {/* 3. Mentee Progress */}
          <div className="border-l-4 border-primary pl-4">
            <h2 className="font-semibold text-lg text-gray-800 mb-3">
              3. Mentee Progress
            </h2>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Did you observe any significant improvement or challenges in the
              mentee's knowledge or skills since the previous session?{" "}
              <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2 mb-4">
              <label className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                <input
                  type="radio"
                  name="significantProgressRadio"
                  value="yes"
                  required
                  onChange={() => setSignificantProgress(true)}
                  className="w-4 h-4 text-primary focus:ring-primary"
                />
                <span className="text-gray-700">Yes</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                <input
                  type="radio"
                  name="significantProgressRadio"
                  value="no"
                  onChange={() => setSignificantProgress(false)}
                  className="w-4 h-4 text-primary focus:ring-primary"
                />
                <span className="text-gray-700">No</span>
              </label>
            </div>

            {significantProgress && (
              <div className="mt-4 bg-blue-50 p-4 rounded-lg">
                <label className="block text-sm text-gray-700 mb-2">
                  If Yes, please elaborate:{" "}
                  <span className="text-red-500">*</span>
                  <span className="block text-xs text-gray-500 mt-1">
                    (What progress did you notice? Were there any notable
                    challenges?)
                  </span>
                </label>
                <textarea
                  className="w-full px-4 py-3 border border-black/10 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent min-h-[100px]"
                  required={significantProgress}
                  name="progressDetails"
                  placeholder="Describe the improvements observed and any challenges encountered..."
                />
              </div>
            )}
          </div>

          {/* 4. Areas for Improvement */}
          <div className="border-l-4 border-primary pl-4">
            <h2 className="font-semibold text-lg text-gray-800 mb-3">
              4. Areas for Improvement
            </h2>
            <label className="block text-sm text-gray-700 mb-2">
              What areas do you believe the mentee(s) should focus on for
              further development? <span className="text-red-500">*</span>
            </label>
            <textarea
              className="w-full px-4 py-3 border border-black/10 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent min-h-[100px]"
              required
              name="areasForImprovement"
              placeholder="Identify specific skills, knowledge areas, or competencies that need development..."
            />
          </div>

          {/* 5. Next Steps */}
          <div className="border-l-4 border-primary pl-4">
            <h2 className="font-semibold text-lg text-gray-800 mb-3">
              5. Next Steps
            </h2>
            <label className="block text-sm text-gray-700 mb-2">
              Outline any specific actions or goals that were set for the
              mentee(s) moving forward: <span className="text-red-500">*</span>
            </label>
            <textarea
              className="w-full px-4 py-3 border border-black/10 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent min-h-[100px]"
              required
              name="nextSteps"
              placeholder="List concrete action items, deadlines, and objectives for the next period..."
            />
          </div>

          {/* 6. Support Needed */}
          <div className="border-l-4 border-primary pl-4">
            <h2 className="font-semibold text-lg text-gray-800 mb-3">
              6. Support Needed
            </h2>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Are there any resources or additional support needed to enhance
              the mentoring process? <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2 mb-4">
              <label className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                <input
                  type="radio"
                  name="supportNeededRadio"
                  value="yes"
                  required
                  onChange={() => setSupportNeeded(true)}
                  className="w-4 h-4 text-primary focus:ring-primary"
                />
                <span className="text-gray-700">Yes</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                <input
                  type="radio"
                  name="supportNeededRadio"
                  value="no"
                  onChange={() => setSupportNeeded(false)}
                  className="w-4 h-4 text-primary focus:ring-primary"
                />
                <span className="text-gray-700">No</span>
              </label>
            </div>

            {supportNeeded && (
              <div className="mt-4 bg-blue-50 p-4 rounded-lg">
                <label className="block text-sm text-gray-700 mb-2">
                  If Yes, please describe:{" "}
                  <span className="text-red-500">*</span>
                  <span className="block text-xs text-gray-500 mt-1">
                    (Additional materials, resources, or any other support
                    needed to improve future sessions)
                  </span>
                </label>
                <textarea
                  className="w-full px-4 py-3 border border-black/10 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent min-h-[100px]"
                  required={supportNeeded}
                  name="supportDetails"
                  placeholder="Specify resources, tools, training, or administrative support needed..."
                />
              </div>
            )}
          </div>

          {/* 7. Overall Feedback */}
          <div className="border-l-4 border-primary pl-4">
            <h2 className="font-semibold text-lg text-gray-800 mb-3">
              7. Overall Feedback
            </h2>
            <label className="block text-sm text-gray-700 mb-2">
              Please provide any additional comments or suggestions regarding
              the mentoring session or the program:{" "}
              <span className="text-red-500">*</span>
            </label>
            <textarea
              className="w-full px-4 py-3 border border-black/10 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent min-h-[100px]"
              required
              name="overallFeedback"
              placeholder="Share general observations, suggestions for program improvement, or any other relevant feedback..."
            />
          </div>

          {/* 8. Rating */}
          <div className="border-l-4 border-primary pl-4">
            <h2 className="font-semibold text-lg text-gray-800 mb-3">
              8. Rating
            </h2>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              How would you rate the overall effectiveness of this session?{" "}
              <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {[
                { value: "5", label: "5 - Excellent" },
                { value: "4", label: "4 - Very Good" },
                { value: "3", label: "3 - Good" },
                { value: "2", label: "2 - Fair" },
                { value: "1", label: "1 - Poor" },
              ].map((option) => (
                <label
                  key={option.value}
                  className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded"
                >
                  <input
                    type="radio"
                    name="sessionRating"
                    value={option.value}
                    required
                    className="w-4 h-4 text-primary focus:ring-primary"
                  />
                  <span className="text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Optional Document Upload */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="font-semibold text-lg text-gray-800 mb-3">
              Supporting Documents (Optional)
            </h2>
            <label className="block text-sm text-gray-700 mb-2">
              Upload any supporting documents or materials from the session:
            </label>
            <input
              className="w-full px-4 py-2 border border-black/10 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              type="file"
              name="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx"
            />
            <p className="text-xs text-gray-500 mt-2">
              Accepted formats: PDF, DOC, DOCX, PPT, PPTX
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => router.back()}
              className="py-3 px-6 border border-black/10 rounded-md text-gray-700 hover:bg-gray-50 transition-all duration-300"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-3 px-8 bg-primary text-white hover:bg-primary/90 transition-all duration-300 rounded-md flex items-center justify-center min-w-[150px]"
              disabled={loading}
            >
              {loading ? <Spinner /> : "Submit Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Page;
