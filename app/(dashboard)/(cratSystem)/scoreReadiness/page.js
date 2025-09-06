"use client";

import { useState, useEffect, useContext } from "react";
import dynamic from "next/dynamic";
import { getScoreData } from "@/app/controllers/crat_general_controller"; // Import updated API functions

// Lazy load heavy chart components
const BusinessDomainScores = dynamic(
  () => import("@/components/Charts/BusinessDomainScores"),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse bg-gray-200 h-64 rounded"></div>
    ),
  }
);

const PerformanceDistribution = dynamic(
  () => import("@/components/Charts/PerformanceDistribution"),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse bg-gray-200 h-64 rounded"></div>
    ),
  }
);

import { UserContext } from "../../layout";
import { useTranslation } from "@/app/locales";

const Page = () => {
  const { t } = useTranslation();
  const [scoreData, setScoreData] = useState({
    commercial: {},
    financial: {},
    operations: {},
    legal: {},
    total: {},
    general_status: "",
  });
  const { userDetails, setUserDetails } = useContext(UserContext);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await getScoreData({ uuid: userDetails.uuid }); // Fetch data from server
        setScoreData(response); // Update state with server response
      } catch (error) {
        console.log("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate the total row values based on fetched data
  const totalRow = {
    domain: t("crat.total", "Total"),
    actualScore: scoreData.total.actualScore || 0,
    contribution: "100%", // Placeholder for now
    targetScore: scoreData.total.targetScore || 0,
    tsContribution: "100%",
    readiness: `${scoreData.total.as_percentage || 0}%`,
    status: scoreData.general_status || "",
  };

  // Render table rows based on server data
  const renderTableRows = () => {
    const domains = ["commercial", "financial", "operations", "legal"];
    return domains.map((domain, index) => {
      const data = scoreData[domain] || {};
      const domainLabel =
        domain === "commercial"
          ? t("dashboard.commercial", "Commercial")
          : domain === "financial"
          ? t("dashboard.financial", "Financial")
          : domain === "operations"
          ? t("dashboard.operations", "Operations")
          : domain === "legal"
          ? t("dashboard.legal", "Legal")
          : domain;
      const statusLabel =
        data.status === "Ready"
          ? t("report.ready", "Ready")
          : data.status === "Not Ready"
          ? t("report.notReady", "Not Ready")
          : data.status === "On review"
          ? t("report.onReview", "On review")
          : data.status;
      return (
        <tr key={index}>
          <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
            {domainLabel}
          </td>
          <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
            {data.actualScore || 0}
          </td>
          <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
            {data.as_percentage ? `${data.as_percentage.toFixed(2)}%` : "0%"}
          </td>
          <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
            {data.targetScore || 0}
          </td>
          <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
            {data.ts_percentage ? `${data.ts_percentage.toFixed(2)}%` : "0%"}
          </td>
          <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
            {data.percentage ? `${data.percentage.toFixed(2)}%` : "0%"}
          </td>
          <td
            className={`border-b border-[#eee] py-5 px-4 dark:border-strokedark font-bold ${
              data.status === "Ready" ? "text-green-600" : "text-red-600"
            }`}
          >
            {statusLabel}
          </td>
        </tr>
      );
    });
  };

  const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

  return (
    <div>
      <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="py-6 px-4 md:px-6 xl:px-7.5">
          <h4 className="text-xl font-semibold text-black dark:text-white">
            {t("crat.pageTitle", "Scores & Readiness Test")}
          </h4>
          <h6 className="mt-2">
            <strong>AS</strong> - {t("crat.actualScore", "Actual Score")} |{" "}
            <strong>TS</strong> - {t("crat.targetScore", "Target Score")}
          </h6>
        </div>
        <hr className="border-stroke dark:border-strokedark" />
      </div>

      {/* Readiness and Assessed Score */}
      <div className="mt-4 flex flex-col space-y-4">
        <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-4">
          <h5 className="text-lg font-semibold text-black dark:text-white flex">
            {t("crat.readinessScore", "Readiness Score")}:
            <span className="ml-auto text-green-600">AS/TS 70%</span>
          </h5>
        </div>
        <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-4">
          <h5 className="text-lg font-semibold text-black dark:text-white flex">
            {t("crat.assessedScore", "Assessed score")}:
            <span className="ml-auto text-red-600">{`${
              scoreData.total.percentage
                ? scoreData.total.percentage.toFixed(2)
                : "0"
            }%`}</span>
          </h5>
        </div>
      </div>

      {/* Business Domain Scores Chart */}
      {loading ? (
        <div className="mt-8 flex items-center justify-center h-64 bg-white rounded-lg border border-stroke shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="text-center">
            <svg
              className="animate-spin h-8 w-8 text-primary mx-auto mb-2"
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
            <span className="text-gray-400">
              {t("actions.loadingChart", "Loading charts...")}
            </span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5 md:gap-6 2xl:gap-7.5 mt-8">
          <div className="col-span-1 md:col-span-3">
            <BusinessDomainScores initialScoreData={scoreData} />
          </div>
          <div className="col-span-1 md:col-span-2">
            <PerformanceDistribution initialScoreData={scoreData} />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="mt-4 rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-2 text-left dark:bg-meta-4">
                <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">
                  {t("crat.domain", "Domain")}
                </th>
                <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">
                  {t("crat.actualScore", "Actual Score")}
                </th>
                <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">
                  {t("crat.asContribution", "AS% Contribution")}
                </th>
                <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">
                  {t("crat.targetScore", "Target Score")}
                </th>
                <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">
                  {t("crat.tsContribution", "TS% Contribution")}
                </th>
                <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">
                  {t("crat.readinessRatio", "(AS/TS) Readiness")}
                </th>
                <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">
                  {t("crat.status", "Status")}
                </th>
              </tr>
            </thead>
            <tbody>
              {renderTableRows()}
              <tr className="font-bold">
                <td className="py-5 px-4">{totalRow.domain}</td>
                <td className="py-5 px-4">{totalRow.actualScore}</td>
                <td className="py-5 px-4">{totalRow.contribution}</td>
                <td className="py-5 px-4">{totalRow.targetScore}</td>
                <td className="py-5 px-4">{totalRow.tsContribution}</td>
                <td className="py-5 px-4">{totalRow.readiness}</td>
                <td className="py-5 px-4"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Overall Readiness */}
      <div className="mt-4 rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-4">
        <h5 className="text-lg font-semibold text-black dark:text-white">
          {t("crat.overallReadiness", "Overall Readiness")}:{" "}
          <span
            className={
              scoreData.general_status === "Ready"
                ? "text-green-600"
                : "text-red-600"
            }
          >
            {scoreData.general_status
              ? scoreData.general_status === "Ready"
                ? t("report.ready", "Ready")
                : scoreData.general_status === "On review"
                ? t("report.onReview", "On review")
                : t("report.notReady", "Not Ready")
              : t("report.notReady", "Not Ready")}
          </span>
        </h5>
      </div>
    </div>
  );
};

export default Page;
