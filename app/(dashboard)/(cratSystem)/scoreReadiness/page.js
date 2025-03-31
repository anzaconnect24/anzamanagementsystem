"use client";

import { useState, useEffect } from "react";
import { getScoreData } from "@/app/controllers/crat_general_controller"; // Import updated API functions

const Page = () => {
  const [scoreData, setScoreData] = useState({
    commercial: {},
    financial: {},
    operations: {},
    legal: {},
    total: {},
    general_status: ""
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getScoreData(); // Fetch data from server
        setScoreData(response); // Update state with server response
      } catch (error) {
        console.log('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  // Calculate the total row values based on fetched data
  const totalRow = {
    domain: "Total",
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
      return (
        <tr key={index}>
          <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">{capitalize(domain)}</td>
          <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">{data.actualScore || 0}</td>
          <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">{data.as_percentage ? `${data.as_percentage.toFixed(2)}%` : "0%"}</td>
          <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">{data.targetScore || 0}</td>
          <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">{data.ts_percentage ? `${data.ts_percentage.toFixed(2)}%` : "0%"}</td>
          <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">{data.percentage ? `${data.percentage.toFixed(2)}%` : "0%"}</td>
          <td className={`border-b border-[#eee] py-5 px-4 dark:border-strokedark font-bold ${data.status === "Ready" ? "text-green-600" : "text-red-600"}`}>
            {data.status}
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
            Scores & Readiness Test
          </h4>
          <h6 className="mt-2">
            <strong>AS</strong> - Actual Score |  <strong>TS</strong> - Target Score
          </h6>
        </div>
        <hr className="border-stroke dark:border-strokedark" />
      </div>

      {/* Readiness and Assessed Score */}
      <div className="mt-4 flex flex-col space-y-4">
        <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-4">
          <h5 className="text-lg font-semibold text-black dark:text-white flex">
            Readiness Score:
            <span className="ml-auto text-green-600">AS/TS 70%</span>
          </h5>
        </div>
        <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-4">
          <h5 className="text-lg font-semibold text-black dark:text-white flex">
            Assessed score:
            <span className="ml-auto text-red-600">{`${scoreData.total.percentage ? scoreData.total.percentage.toFixed(2) : "0"}%`}</span>
          </h5>
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-2 text-left dark:bg-meta-4">
                <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">Domain</th>
                <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">Actual Score</th>
                <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">AS% Contribution</th>
                <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">Target Score</th>
                <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">TS% Contribution</th>
                <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">(AS/TS) Readiness</th>
                <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">Status</th>
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
          Overall Readiness:{" "}
          <span className={scoreData.general_status === "Ready" ? "text-green-600" : "text-red-600"}>
            {scoreData.general_status || "Not Ready"}
          </span>
        </h5>
      </div>
    </div>
  );
};

export default Page;
