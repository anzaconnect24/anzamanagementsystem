"use client";
import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { getScoreData } from "@/app/controllers/crat_general_controller";

// Import ReactApexChart dynamically with better error handling
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
  loading: () => (
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
        <span className="text-gray-400">Loading chart...</span>
      </div>
    </div>
  ),
});

const PerformanceDistribution = ({ userDetails, initialScoreData }) => {
  const [scoreData, setScoreData] = useState(initialScoreData || {});
  const [loading, setLoading] = useState(
    !initialScoreData || Object.keys(initialScoreData).length === 0
  );
  const [chartHeight, setChartHeight] = useState(350);
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle responsive chart height
  useEffect(() => {
    const handleResize = () => {
      setChartHeight(window.innerWidth < 768 ? 280 : 350);
    };

    // Set initial height
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Clean up
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Update scoreData when initialScoreData prop changes
  useEffect(() => {
    if (initialScoreData && Object.keys(initialScoreData).length > 0) {
      console.log("PerformanceDistribution received data:", initialScoreData);
      setScoreData(initialScoreData);
      setLoading(false);
    }
  }, [initialScoreData]);

  // Fetch data if not provided as prop
  useEffect(() => {
    if (!initialScoreData || Object.keys(initialScoreData).length === 0) {
      setLoading(true);
      getScoreData({ uuid: userDetails.uuid })
        .then((res) => {
          console.log("PerformanceDistribution fetched data:", res);
          setScoreData(res);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching score data:", error);
          setLoading(false);
        });
    }
  }, [initialScoreData]);

  // Calculate the overall average score
  const calculateOverallScore = () => {
    const scores = [
      scoreData.commercial?.percentage || 0,
      scoreData.financial?.percentage || 0,
      scoreData.operations?.percentage || 0,
      scoreData.legal?.percentage || 0,
    ];

    // Calculate the average and round to whole number
    return Math.round(
      scores.reduce((sum, score) => sum + score, 0) / scores.length
    );
  };

  const overallScore = calculateOverallScore();
  const remainingScore = 100 - overallScore;

  // Determine chart color based on score threshold
  const chartColor = overallScore >= 70 ? "#10B981" : "#EF4444";
  const scoreStatus = overallScore >= 70 ? "Good" : "Needs Improvement";

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
          size: "75%",
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
              label: "Total Score",
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
            Overall Readiness
          </h3>
          <div
            className={`px-2 py-1 rounded-md text-white text-sm font-medium self-start sm:self-auto ${
              overallScore >= 70 ? "bg-success" : "bg-danger"
            }`}
          >
            {scoreStatus}
          </div>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Overall assessment score across domains
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
            <span className="text-gray-400">Loading performance data...</span>
          </div>
        </div>
      ) : !isClient ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <span className="text-gray-400">Initializing chart...</span>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center">
          <div className="w-full max-w-md">
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
