"use client";
import { useState, useContext, useEffect } from "react";
import {
  getReportData,
  getScoreData,
  initialData,
  publishReport,
} from "@/controllers/crat_general_controller"; // Import updated API functions
import Modal2 from "@/components/Model2";
import toast from "react-hot-toast";
import { useTranslation } from "@/locales";
import Loader from "@/components/common/Loader";
import dynamic from "@/utils/dynamic";
const BusinessDomainScores = dynamic(
  () => import("@/components/Charts/BusinessDomainScores"),
  { ssr: false, loading: () => <Loader /> }
);
const PerformanceDistribution = dynamic(
  () => import("@/components/Charts/PerformanceDistribution"),
  { ssr: false, loading: () => <Loader /> }
);
// import { useSearchParams } from "@/utils/navigation";
import Breadcrumb from "@/component/Breadcrumb";
import { UserContext } from "../../../layouts/DashboardLayout";
import { useRouter } from "../../../utils/navigation";
import { useSearchParams } from "react-router-dom";

// Define the table headers
const Report = () => {
  const { t } = useTranslation();
  const tableHeaders = [
    t("report.subDomain", "Sub Domain"),
    t("report.score", "Score"),
    t("report.reportNarrative", "Report Narrative"),
  ];
  const [data, setData] = useState(initialData);
  const [scoreData, setScoreData] = useState({}); // State to hold the score data
  const [deletemodalOpen, publishModalOpen] = useState(false);
  const [deletemodalMessage, publishModalMessage] = useState("");
  const [generalStatus, setGeneralStatus] = useState(
    t("report.notReady", "Not Ready")
  ); // Add this
  const { userDetails, setUserDetails } = useContext(UserContext);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const user_uuid = searchParams.get("user_uuid");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch both report and score data
      const responseData = await getReportData({
        user_uuid: user_uuid || userDetails?.uuid,
      });
      const responseData1 = await getScoreData({
        uuid: user_uuid || userDetails?.uuid,
      });

      console.log("Raw score data:", responseData1);

      // Ensure scoreData has the correct structure
      if (responseData1 && Object.keys(responseData1).length > 0) {
        setScoreData(responseData1);
        setGeneralStatus(
          responseData1?.general_status || t("report.notReady", "Not Ready")
        );
        console.log("Score data set successfully:", responseData1);
      } else {
        // If no data, create dummy data for testing
        const dummyData = {
          commercial: { percentage: 75, status: t("report.ready", "Ready") },
          financial: {
            percentage: 60,
            status: t("report.notReady", "Not Ready"),
          },
          operations: { percentage: 80, status: t("report.ready", "Ready") },
          legal: { percentage: 55, status: t("report.notReady", "Not Ready") },
          general_status: t("report.notReady", "Not Ready"),
        };
        setScoreData(dummyData);
        setGeneralStatus(t("report.notReady", "Not Ready"));
        console.log("Using dummy data for charts:", dummyData);
      }

      updateDataWithBackendResponse(responseData);
    } catch (error) {
      console.log("Error fetching data:", error);

      // Set fallback data if API fails
      const fallbackData = {
        commercial: {
          percentage: 65,
          status: t("report.notReady", "Not Ready"),
        },
        financial: { percentage: 70, status: t("report.ready", "Ready") },
        operations: {
          percentage: 55,
          status: t("report.notReady", "Not Ready"),
        },
        legal: { percentage: 60, status: t("report.notReady", "Not Ready") },
        general_status: t("report.notReady", "Not Ready"),
      };
      setScoreData(fallbackData);
      setGeneralStatus(t("report.notReady", "Not Ready"));
      console.log("Using fallback data due to error:", fallbackData);
    } finally {
      setLoading(false);
    }
  };

  const updateDataWithBackendResponse = (responseData) => {
    const updatedData = { ...data };

    responseData.forEach((responseItem) => {
      const { subDomain, score } = responseItem;

      Object.keys(updatedData).forEach((section) => {
        if (Array.isArray(updatedData[section])) {
          updatedData[section].forEach((subDomainGroup) => {
            if (subDomainGroup.subDomain === subDomain) {
              subDomainGroup.score = score;
            }
          });
        } else {
          Object.keys(updatedData[section]).forEach((subSection) => {
            if (Array.isArray(updatedData[section][subSection])) {
              updatedData[section][subSection].forEach((subDomainGroup) => {
                if (subDomainGroup.subDomain === subDomain) {
                  subDomainGroup.score = score;
                }
              });
            }
          });
        }
      });
    });

    setData(updatedData);
  };

  const publishChanges = async () => {
    try {
      await publishReport(
        userDetails.id,
        userDetails.versionCount,
        userDetails.publishStatus
      );

      setUserDetails((prevDetails) => ({
        ...prevDetails, // Copy existing properties
        publishStatus: t("report.onReview", "On review"), // Update the publishStatus property
      }));

      publishModalOpen(false);
      toast.success(
        t("report.publishedSuccessfully", "Published Successfully")
      );
      console.log("Changes successfully submitted");
    } catch (error) {
      // Handle errors
      toast.error(t("report.errorPublishingReport", "Error publishing report"));
      console.error("Error publishing report:", error);
    }
  };

  const openPublishDialog = (data) => {
    console.log(userDetails);
    publishModalOpen(true);
    publishModalMessage(
      t(
        "report.confirmPublishReport",
        "Are you sure you want to publish this report for review?"
      )
    );
  };

  const handleDeleteCancel = () => {
    publishModalOpen(false);
  };

  const handleDeleteFile = async () => {
    const [domain, id, attachment, section, index] = deleteCache;
    try {
      // Proceed with deletion directly
      await deleteAttachment(domain, id, attachment, section, index);
      handleRatingChange(section, index, "No");
      submitChanges();
      // Fetch updated data
      const responseData = await getOperationData();
      const updatedData = { ...initialDataTemplate };

      Object.keys(updatedData).forEach((section) => {
        updatedData[section] = updatedData[section].map((item) => {
          const fetchedItem = responseData.find(
            (dataItem) => dataItem.subDomain === item.subDomain
          );
          return fetchedItem
            ? {
                ...item,
                rating: fetchedItem.rating,
                userId: fetchedItem.userId,
                score: fetchedItem.score,
                attachment: fetchedItem.attachment,
              }
            : item;
        });
      });

      toast.success(t("report.deletedSuccessfully", "Deleted Successfully"));
      setData(updatedData);
      publishModalOpen(false); // Close modal
    } catch (error) {
      toast.error(t("report.errorDeletingFile", "Error deleting file"));
      console.error("Error deleting file:", error);
    }
  };

  const renderTableHeaders = () => (
    <div className="grid grid-cols-3 border-b border-stroke py-4 px-4 dark:border-strokedark">
      {tableHeaders.map((header, index) => (
        <div key={index} className="flex items-center px-2">
          <p className="text-sm text-black dark:text-white font-semibold">
            {header}
          </p>
        </div>
      ))}
    </div>
  );

  const renderTableRows = (sectionData) => {
    return sectionData.map((item, index) => {
      const narrative =
        item.narrative.find((n) => n.score === item.score)?.text ||
        t("report.narrativeNotFound", "Narrative not found");
      return (
        <div
          className="grid grid-cols-3 border-t border-stroke py-4 px-4 dark:border-strokedark"
          key={index}
        >
          <div className="flex items-center px-2">
            <p className="text-sm text-black dark:text-white">
              {item.subDomain}
            </p>
          </div>
          <div className="flex items-center px-2">
            <p className="text-sm text-black dark:text-white">{item.score}</p>
          </div>
          <div className="flex items-center px-2">
            <p className="text-sm text-black dark:text-white">{narrative}</p>
          </div>
        </div>
      );
    });
  };

  const cleanTitle = (title) => {
    return title
      .replace(/^\d+\.\s*/, "")
      .replace(new RegExp(`\\s*${t("report.report", "Report")}\\s*$`), "");
  };

  const renderSection = (title, sectionData) => {
    // Generate the key from the title
    const domainKey = title.toLowerCase().replace(/[^a-z]/g, "");

    // Get the score status and percentage from scoreData
    const sectionScore = scoreData[domainKey]?.percentage || 0;
    const sectionStatus =
      scoreData[domainKey]?.status || t("report.notReady", "Not Ready");

    // Determine the status color
    const overallStatusColor =
      sectionStatus === t("report.ready", "Ready")
        ? "text-green-500"
        : "text-red-500";

    return (
      <div className="mt-4 rounded-lg border border-stroke bg-white shadow-default  mb-4">
        <div className="py-6 px-4 md:px-6 xl:px-7.5 flex justify-between items-center">
          <h4 className="text-xl font-semibold text-sky-700 dark:text-white">
            {title}
          </h4>
        </div>
        <div className="grid grid-cols-2 border-t-2 border-b-2 border-black/10 border-stroke py-4 px-4 ">
          <div className="flex items-center px-2">
            <p className="text-sm text-black dark:text-white font-semibold">
              {t("report.overallReadiness", "Overall")} {cleanTitle(title)}{" "}
              {t("report.readiness", "Readiness")}
            </p>
          </div>
          <div className="flex items-center justify-end px-2">
            <p className={`text-sm font-semibold ${overallStatusColor}`}>
              {sectionStatus}
            </p>
          </div>
        </div>
        <div>
          {Object.keys(sectionData).map((subTitle, index) => (
            <div key={index}>
              <div className="bg-gray-100 p-4 dark:bg-gray-800">
                <h5 className="text-lg font-bold text-gray-700 dark:text-gray-300">
                  {subTitle}
                </h5>
                {renderTableHeaders()}
                {renderTableRows(sectionData[subTitle])}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return !loading ? (
    <div className="space-y-6">
      <Breadcrumb
        pageName={t(
          "report.capitalReadinessAssessmentReport",
          "Capital Readiness Assessment Report"
        )}
        prevPage={t("common.back", "Back")}
        prevLink={""}
      />
      <div className="bg-white rounded-lg shadow-sm">
        <div className=" border-b border-black/0">
          <div className="flex justify-between items-center">
            <div>
              {/* <h2 className="text-2xl font-bold text-gray-800">
                Capital Readiness Assessment Report
              </h2> */}
            </div>
            <div className="flex space-x-3">
              {userDetails.publishStatus === "Draft" ? (
                <>
                  {userDetails.reportPdf && (
                    <button
                      className="px-4 py-6 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      onClick={() =>
                        window.open(`http://${userDetails.reportPdf}`, "_blank")
                      }
                    >
                      {t("report.viewReport", "View Report")}
                    </button>
                  )}
                  <button
                    className={`px-4 py-2 text-white rounded-lg transition-colors ${
                      generalStatus === t("report.notReady", "Not Ready")
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                    onClick={openPublishDialog}
                    disabled={
                      generalStatus === t("report.notReady", "Not Ready")
                    }
                  >
                    {t("report.publish", "Publish")}
                  </button>
                </>
              ) : (
                <button
                  className="px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed"
                  disabled
                >
                  {userDetails.publishStatus === "On review"
                    ? t("report.onReview", "On review")
                    : userDetails.publishStatus}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="p-6 py-1">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {t("report.performanceOverview", "Performance Overview")}
          </h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-5 md:gap-6 2xl:gap-7.5">
            <div className="col-span-1 md:col-span-3">
              <BusinessDomainScores
                initialScoreData={scoreData}
                userDetails={userDetails}
              />
            </div>
            <div className="col-span-1 md:col-span-2">
              <PerformanceDistribution
                initialScoreData={scoreData}
                userDetails={userDetails}
              />
            </div>
          </div>
        </div>
      </div>

      {renderSection(t("report.commercial", "Commercial"), data.commercial)}
      {renderSection(t("report.financial", "Financial"), data.financial)}
      {renderSection(t("report.operations", "Operations"), data.operations)}
      {renderSection(t("report.legal", "Legal"), data.legal)}

      <Modal2
        isOpen={deletemodalOpen}
        onClose={() => publishModalOpen(false)}
        message={deletemodalMessage}
        onDelete={() => publishChanges()}
        onCancel={handleDeleteCancel}
        bgColor="yellow-200"
        closeButtonText={t("common.cancel", "Cancel")}
        deleteButtonText={t("report.publish", "Publish")}
        closeButtonColor="gray-500"
        deleteButtonColor="blue-500"
      />
    </div>
  ) : (
    <Loader />
  );
};

export default Report;
