"use client";
import React, { useState, useEffect, useContext } from "react";
import dynamic from "next/dynamic";
import { getScoreData } from "@/app/controllers/crat_general_controller";
import { UserContext } from "@/app/(dashboard)/layout";

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

const BusinessDomainScores = ({ userDetails, initialScoreData }) => {
  const [scoreData, setScoreData] = useState(initialScoreData || {});
  const [loading, setLoading] = useState(
    !initialScoreData || Object.keys(initialScoreData).length === 0
  );
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Update scoreData when initialScoreData prop changes
  useEffect(() => {
    if (initialScoreData && Object.keys(initialScoreData).length > 0) {
      console.log("BusinessDomainScores received data:", initialScoreData);
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
          console.log("BusinessDomainScores fetched data:", res);
          setScoreData(res);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching score data:", error);
          setLoading(false);
        });
    }
  }, [initialScoreData]);

  // Calculate bar colors based on scores
  const getBarColors = () => {
    return [
      scoreData.commercial?.percentage >= 70 ? "#10B981" : "#EF4444",
      scoreData.financial?.percentage >= 70 ? "#10B981" : "#EF4444",
      scoreData.operations?.percentage >= 70 ? "#10B981" : "#EF4444",
      scoreData.legal?.percentage >= 70 ? "#10B981" : "#EF4444",
    ];
  };

  // Bar chart options and series
  const barChartOptions = {
    chart: {
      type: "bar",
      height: 350,
      toolbar: { show: false },
      fontFamily: "Inter, sans-serif",
      background: "transparent",
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: "55%",
        distributed: true,
        dataLabels: {
          position: "top",
          offsetY: -20,
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: function (val) {
        return Math.round(val) + "%";
      },
      style: {
        fontSize: "12px",
        fontWeight: 500,
        colors: ["#4B5563"],
      },
    },
    legend: {
      show: true,
      position: "bottom",
      fontSize: "12px",
      fontWeight: 500,
      markers: {
        radius: 2,
      },
    },
    xaxis: {
      categories: ["Commercial", "Financial", "Operations", "Legal"],
      labels: {
        style: {
          fontSize: "12px",
          fontWeight: 500,
          colors: "#4B5563",
        },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      max: 100,
      tickAmount: 5,
      labels: {
        formatter: function (val) {
          return Math.round(val) + "%";
        },
        style: {
          fontSize: "12px",
          fontWeight: 500,
          colors: "#4B5563",
        },
      },
    },
    grid: {
      borderColor: "#E5E7EB",
      strokeDashArray: 4,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return Math.round(val) + "%";
        },
      },
    },
    colors: getBarColors(),
  };

  const barChartSeries = [
    {
      name: "Score",
      data: [
        Math.round(scoreData.commercial?.percentage || 0),
        Math.round(scoreData.financial?.percentage || 0),
        Math.round(scoreData.operations?.percentage || 0),
        Math.round(scoreData.legal?.percentage || 0),
      ],
    },
  ];

  return (
    <div className="bg-white rounded-2xl border h-full border-stroke p-5 pt-7.5 pb-5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 mb-8">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-black dark:text-white">
          Capital Readiness Assessment Scores
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Your readiness across key business domains
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
            <span className="text-gray-400">Loading assessment data...</span>
          </div>
        </div>
      ) : !isClient ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <span className="text-gray-400">Initializing chart...</span>
          </div>
        </div>
      ) : (
        <ReactApexChart
          options={barChartOptions}
          series={barChartSeries}
          type="bar"
          height={350}
        />
      )}
    </div>
  );
};

export default BusinessDomainScores;
