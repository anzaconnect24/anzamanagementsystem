"use client";
import React, { useState, useEffect } from "react";
import dynamic from "@/utils/dynamic";
import { getScoreData } from "@/controllers/crat_general_controller";
import {
  getPublishedReport,
  getUserBusiness,
} from "@/controllers/crat_controller";
import { useTranslation } from "@/locales";

// Localized loading component for dynamic import
const LoadingChart = () => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="mb-4">
          <svg
            className="animate-spin h-8 w-8 text-primary mx-auto"
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
        </div>
        <span className="text-gray-400">
          {t("common.loadingChart", "Loading chart...")}
        </span>
      </div>
    </div>
  );
};

// Import ReactApexChart dynamically with better error handling
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
  loading: () => <LoadingChart />,
});

const mapPublishedReportToScoreData = (published, t) => {
  if (!published?.domainScores) return null;

  const domainMap = {
    commercial: "commercial_marketing",
    financial: "financial",
    operations: "operations",
    legal: "legal_compliance",
  };

  const toStatus = (pct) => {
    if (pct >= 75) return t("report.ready", "Ready");
    if (pct >= 60) return t("report.partiallyReady", "Partially Ready");
    return t("report.notReady", "Not Ready");
  };

  const result = {};
  Object.entries(domainMap).forEach(([chartKey, apiKey]) => {
    const domain = published.domainScores?.[apiKey] || {};
    const average = Number(domain.average || 0);
    const reviewedQuestions = Number(domain.reviewedQuestions || 0);
    const totalQuestions = Number(domain.totalQuestions || 0);
    const earnedScore = average * reviewedQuestions;
    const maxScore = totalQuestions * 5;
    const percentage =
      maxScore > 0 ? Math.round((earnedScore / maxScore) * 100) : 0;

    result[chartKey] = {
      percentage,
      status: toStatus(percentage),
    };
  });

  const overall = Math.round(
    [
      result.commercial?.percentage || 0,
      result.financial?.percentage || 0,
      result.operations?.percentage || 0,
      result.legal?.percentage || 0,
    ].reduce((sum, v) => sum + v, 0) / 4,
  );

  result.general_status = toStatus(overall);
  return result;
};

const normalizeScoreData = (data) =>
  data && typeof data === "object" ? data : {};

const PerformanceDistribution = ({
  userDetails,
  initialScoreData,
  chartHeight = 350,
}) => {
  const { t } = useTranslation();
  const [scoreData, setScoreData] = useState(
    normalizeScoreData(initialScoreData),
  );
  const [loading, setLoading] = useState(
    !initialScoreData || Object.keys(initialScoreData).length === 0,
  );
  // const [chartHeight, setChartHeight] = useState(350);
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle responsive chart height

  // Update scoreData when initialScoreData prop changes
  useEffect(() => {
    if (initialScoreData && Object.keys(initialScoreData).length > 0) {
      console.log("PerformanceDistribution received data:", initialScoreData);
      setScoreData(normalizeScoreData(initialScoreData));
      setLoading(false);
    }
  }, [initialScoreData]);

  // Fetch data if not provided as prop
  useEffect(() => {
    if (!initialScoreData || Object.keys(initialScoreData).length === 0) {
      const load = async () => {
        setLoading(true);

        try {
          if (userDetails?.uuid) {
            const business = await getUserBusiness(userDetails.uuid);
            if (business?.id) {
              const published = await getPublishedReport(business.id);
              const mapped = mapPublishedReportToScoreData(published, t);
              if (mapped && Object.keys(mapped).length > 0) {
                setScoreData(mapped);
                setLoading(false);
                return;
              }
            }
          }
        } catch (error) {
          console.log("Published report not available, using fallback:", error);
        }

        try {
          const res = await getScoreData({ uuid: userDetails.uuid });
          console.log("PerformanceDistribution fetched data:", res);
          setScoreData(normalizeScoreData(res));
        } catch (error) {
          console.error("Error fetching score data:", error);
        } finally {
          setLoading(false);
        }
      };

      load();
    }
  }, [initialScoreData, t, userDetails?.uuid]);

  // Calculate the overall average score
  const calculateOverallScore = () => {
    const safeScoreData = normalizeScoreData(scoreData);
    const scores = [
      safeScoreData.commercial?.percentage || 0,
      safeScoreData.financial?.percentage || 0,
      safeScoreData.operations?.percentage || 0,
      safeScoreData.legal?.percentage || 0,
    ];

    // Calculate the average and round to whole number
    return Math.round(
      scores.reduce((sum, score) => sum + score, 0) / scores.length,
    );
  };

  const overallScore = calculateOverallScore();
  const remainingScore = 100 - overallScore;

  // Determine chart color and status based on CRAT readiness levels
  const getChartColorAndStatus = (score) => {
    if (score >= 75)
      return { color: "#219654", status: t("report.ready", "Ready") };
    if (score >= 60)
      return {
        color: "#f4dc2c",
        status: t("report.partiallyReady", "Partially Ready"),
      };
    return { color: "#EF4444", status: t("report.notReady", "Not Ready") };
  };

  const { color: chartColor, status: scoreStatus } =
    getChartColorAndStatus(overallScore);

  // Donut chart options and series
  const donutChartOptions = {
    chart: {
      type: "donut",
      height: chartHeight,
      fontFamily: "Inter, sans-serif",
      background: "transparent",
    },
    plotOptions: {
      pie: {
        donut: {
          // size: "75%",
          labels: {
            show: true,
            name: {
              show: false,
            },
            value: {
              show: true,
              fontSize: "36px",
              fontWeight: 600,
              color: chartColor,
              formatter: function (val) {
                return overallScore + "%";
              },
            },
            total: {
              show: true,
              fontSize: "16px",
              fontWeight: 500,
              label: t("report.totalScore", "Total Score"),
              color: "#6B7280",
              formatter: function () {
                return overallScore + "%";
              },
            },
          },
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    legend: {
      show: false,
    },
    stroke: {
      width: 0,
    },
    colors: [chartColor, "#E5E7EB"],
    tooltip: {
      enabled: false,
    },
  };

  const donutChartSeries = [overallScore, remainingScore];

  return (
    <div className="bg-white rounded-2xl border h-full border-stroke p-5 pt-7.5 pb-5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 mb-8">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
          <h3 className="text-xl font-bold text-black dark:text-white mb-2 sm:mb-0">
            {t("report.overallReadinessTitle", "Overall Readiness")}
          </h3>
          <div
            className={`px-2 py-1 rounded-md text-white text-sm font-medium self-start sm:self-auto`}
            style={{ backgroundColor: chartColor }}
          >
            {scoreStatus}
          </div>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t(
            "report.overallAssessmentAcrossDomains",
            "Overall assessment score across domains",
          )}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="mb-4">
              <svg
                className="animate-spin h-8 w-8 text-primary mx-auto"
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
            </div>
            <span className="text-gray-400">
              {t(
                "common.loadingPerformanceData",
                "Loading performance data...",
              )}
            </span>
          </div>
        </div>
      ) : !isClient ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <span className="text-gray-400">
              {t("common.initializingChart", "Initializing chart...")}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center">
          <div className="w-full">
            <ReactApexChart
              options={donutChartOptions}
              series={donutChartSeries}
              type="donut"
              height={chartHeight}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceDistribution;
