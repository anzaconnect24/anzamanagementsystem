"use client";
import React, { useState, useEffect, useContext } from "react";
import { BsDownload } from "react-icons/bs";
import { useTranslation } from "@/locales";
import { useSearchParams } from "@/utils/navigation";
import { UserContext } from "@/layouts/DashboardLayout";
import {
  getReportData,
  getScoreData,
} from "@/controllers/crat_general_controller";
import { AIReportService } from "@/services/aiReportService";
import toast from "react-hot-toast";
import Loader from "@/components/common/Loader";

export default function FinalReportPreview() {
  const { t } = useTranslation();
  const { userDetails } = useContext(UserContext);
  const [searchParams] = useSearchParams();
  const user_uuid = searchParams.get("user_uuid");

  // State management
  const [loading, setLoading] = useState(true);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [scoreData, setScoreData] = useState(null);
  const [businessInfo, setBusinessInfo] = useState(null);
  const [error, setError] = useState(null);

  // Initialize AI Report Service
  const aiReportService = new AIReportService();

  // Fetch data on component mount
  useEffect(() => {
    fetchReportData();
  }, [user_uuid, userDetails?.uuid]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);

      const targetUserId = user_uuid || userDetails?.uuid;
      if (!targetUserId) {
        throw new Error(t("finalReport.errors.noUser", "User ID is required"));
      }

      // Fetch CRAT report data and scores in parallel
      const [reportResponse, scoreResponse] = await Promise.all([
        getReportData({ user_uuid: targetUserId }),
        getScoreData({ uuid: targetUserId }),
      ]);

      console.log("📊 Fetched report data:", reportResponse);
      console.log("📈 Fetched score data:", scoreResponse);

      // Set the fetched data
      setReportData(reportResponse);
      setScoreData(scoreResponse);

      // Create basic business info from available data
      const businessInfo = {
        name:
          userDetails?.name ||
          reportResponse?.User?.name ||
          t("finalReport.defaultBusiness", "Business Assessment"),
        sector:
          reportResponse?.businessSector ||
          t("finalReport.defaultSector", "Various Industries"),
        location:
          reportResponse?.location ||
          t("finalReport.defaultLocation", "East Africa"),
        stage: t("finalReport.defaultStage", "Assessment Stage"),
      };
      setBusinessInfo(businessInfo);
    } catch (error) {
      console.error("❌ Error fetching report data:", error);
      setError(error.message);
      toast.error(
        t("finalReport.errors.fetchFailed", "Failed to load report data"),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    if (!scoreData || !reportData) {
      toast.error(
        t("finalReport.errors.noData", "Report data is not available"),
      );
      return;
    }

    try {
      setDownloadLoading(true);

      // Show loading toast
      toast.loading(
        t("finalReport.generating", "Generating AI-powered report..."),
        {
          id: "report-generation",
        },
      );

      console.log("🤖 Generating AI report with data:", {
        scoreData,
        reportData: !!reportData,
        businessInfo,
      });

      // Generate comprehensive AI report
      const aiReport = await aiReportService.generateCompleteReport(
        reportData,
        scoreData,
        businessInfo,
        userDetails,
      );

      console.log("✅ AI report generated successfully:", !!aiReport);

      // Export the AI-generated report as PDF
      aiReportService.exportToPDF(aiReport);

      // Show success message
      toast.success(
        t(
          "finalReport.downloadSuccess",
          "AI-powered report downloaded successfully!",
        ),
        { id: "report-generation" },
      );
    } catch (error) {
      console.error("❌ Error generating/downloading report:", error);
      toast.error(
        t(
          "finalReport.errors.downloadFailed",
          "Failed to generate report. Please try again.",
        ),
        { id: "report-generation" },
      );
    } finally {
      setDownloadLoading(false);
    }
  };

  // Calculate overall score from score data
  const calculateOverallScore = () => {
    if (!scoreData) return 0;
    const scores = [
      scoreData.commercial?.percentage || 0,
      scoreData.financial?.percentage || 0,
      scoreData.operations?.percentage || 0,
      scoreData.legal?.percentage || 0,
    ];
    return Math.round(
      scores.reduce((sum, score) => sum + score, 0) / scores.length,
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center py-0 px-4">
        <Loader />
        <p className="mt-4 text-gray-600 dark:text-gray-300">
          {t("finalReport.loading", "Loading your assessment data...")}
        </p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center py-0 px-4">
        <div className="max-w-md w-full mx-auto text-center">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
            <div className="text-red-600 dark:text-red-400 mb-4">
              <svg
                className="w-12 h-12 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-red-800 dark:text-red-200 mb-2">
              {t("finalReport.errors.title", "Unable to Load Report")}
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300 mb-4">
              {error}
            </p>
            <button
              onClick={fetchReportData}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {t("finalReport.errors.retry", "Try Again")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const overallScore = calculateOverallScore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center py-0 px-4">
      <div className="max-w-2xl w-full mx-auto text-center">
        <div className="bg-white dark:bg-boxdark rounded-2xl shadow-xl p-8">
          <div className="mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-primary to-primary rounded-full flex items-center justify-center mx-auto mb-6">
              <BsDownload className="text-3xl text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
              {t("finalReport.pageTitle", "Download Final Report")}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              {t(
                "finalReport.pageSubtitle",
                "Get your comprehensive Capital Readiness Assessment Tool (CRAT) report in PDF format.",
              )}
            </p>

            {/* Display current scores dynamically */}
            {scoreData && (
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
                  {t("finalReport.currentScores", "Your Assessment Scores")}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {scoreData.commercial?.percentage || 0}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {t("finalReport.domains.commercial", "Commercial")}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {scoreData.financial?.percentage || 0}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {t("finalReport.domains.financial", "Financial")}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {scoreData.operations?.percentage || 0}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {t("finalReport.domains.operations", "Operations")}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {scoreData.legal?.percentage || 0}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {t("finalReport.domains.legal", "Legal")}
                    </div>
                  </div>
                </div>
                <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-600">
                  <div className="text-3xl font-bold text-primary mb-1">
                    {overallScore}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {t("finalReport.overallScore", "Overall Score")}
                  </div>
                </div>
              </div>
            )}

            {/* Business info display */}
            {businessInfo && (
              <div className="mb-6 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {t("finalReport.reportFor", "Report for:")}{" "}
                  <span className="font-semibold">{businessInfo.name}</span>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {businessInfo.sector} • {businessInfo.location}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={handleDownloadReport}
            disabled={downloadLoading || !scoreData || !reportData}
            className="inline-flex items-center gap-3 bg-gradient-to-r bg-primary hover:bg-primary/90 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
          >
            {downloadLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                {t("finalReport.generating", "Generating AI Report...")}
              </>
            ) : (
              <>
                <BsDownload className="text-xl" />
                {t("finalReport.downloadButton", "Download AI-Powered Report")}
              </>
            )}
          </button>

          <div className="mt-8 text-sm text-gray-500 dark:text-gray-400">
            <p className="mb-2">
              {t(
                "finalReport.includes",
                "AI-powered report includes: Executive Summary, Investment Analysis, Strategic Recommendations, and Growth Predictions",
              )}
            </p>
            <p className="text-xs">
              {t(
                "finalReport.aiPowered",
                "Powered by advanced AI analysis for comprehensive business insights",
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
