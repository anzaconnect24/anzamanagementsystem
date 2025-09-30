"use client";
import { useState, useContext, useEffect } from "react";
import {
  getReportData,
  getScoreData,
  getInitialData,
  publishReport,
} from "@/controllers/crat_general_controller"; // Import updated API functions
import Modal2 from "@/components/Model2";
import toast from "react-hot-toast";
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
import { useTranslation } from "../../../locales";

// Define the table headers
const Report = () => {
  const { t, switchLanguage, language, translations } = useTranslation();
  const tableHeaders = [
    t("report.subDomain", "Sub Domain"),
    t("report.score", "Score"),
    t("report.reportNarrative", "Report Narrative"),
  ];
  const [data, setData] = useState({});
  // Store incoming scores from backend so we can merge them once translations are ready
  const [incomingScores, setIncomingScores] = useState(null);

  // Map backend subDomain labels to our canonical item keys
  const labelToKey = (labelRaw = "") => {
    const label = String(labelRaw).trim().toLowerCase();
    const map = {
      // Market/Commercial
      demand: "demand",
      "market share": "marketShare",
      sales: "sales",
      "customer segments": "customerSegments",
      "payment terms": "paymentTerms",
      "sales strategy": "salesStrategy",
      "product development": "productDevelopment",
      "product distribution": "productDistribution",
      "product pricing": "productPricing",
      "product pricing basis": "productPricing",
      "level of competition": "competitionLevel",
      "competitive advantage": "competitiveAdvantage",
      "marketing strategy": "marketingStrategy",
      "branding and packaging": "branding",
      "packaging & branding": "branding",
      "product promotion": "promotionStrategy",
      "promotion strategy": "promotionStrategy",

      // Financial
      revenue: "revenueGrowth",
      "revenue growth": "revenueGrowth",
      cost: "cost",
      "cost management": "cost",
      "working capital management": "workingCapital",
      "assets management": "assetsManagement",
      "debt manageability": "debtManagement",
      "debt management": "debtManagement",
      "obs items": "obsItems",
      "operating cash flow": "operatingCashFlows",
      "operating cash flows": "operatingCashFlows",
      capex: "capex",
      "capital expenses": "capex",
      assumptions: "assumptions",
      "quality of financial records": "financialRecords",
      "financial reporting": "financialReporting",
      "internal controls": "internalControls",
      "tax liability": "taxLiabilities",
      "tax liabilities": "taxLiabilities",

      // Operations
      "vision clarity": "visionClarity",
      "management structure": "managementStructure",
      "team capacity": "teamCapacity",
      "professional development": "professionalDevelopment",
      "track record": "trackRecord",
      "performance measurement": "performanceMeasurement",
      "management commitment": "managementCommitment",
      "data management": "dataManagement",
      "system used": "systemUsed",
      "system effectiveness": "systemEffectiveness",
      "quality control": "qualityControl",
      "quality management team": "qualityManagementTeam",
      "platform utilization": "platformUtilization",
      "customer relations": "crm",
      crm: "crm",
      "business strategy": "businessStrategy",
      "organizational planning": "organizationalPlanning",
      "organization planning": "organizationalPlanning",

      // Legal
      "business incorporation": "businessIncorporation",
      "tax identification": "taxIdentification",
      "tax compliance": "taxCompliance",
      "business licence": "businessLicense",
      "business license": "businessLicense",
      "sector specific compliance": "sectorSpecificLicense",
      "sector specific license": "sectorSpecificLicense",
      "lease agreements": "leaseAgreements",
      "customer contracts": "customerAgreements",
      "customer agreements": "customerAgreements",
      "supplier contracts": "supplierAgreements",
      "supplier agreements": "supplierAgreements",
      "employees contracts": "employeeAgreements",
      "employee agreements": "employeeAgreements",
      "ip ownership": "ipOwnership",
      "entrepreneurial character": "character",
      character: "character",
      "personal legal liability": "personalLegalLiability",
      "succession plan": "successionPlan",
      "board of directors": "bod",
      bod: "bod",
    };
    return map[label] || null;
  };

  // Function to translate sections
  const translateSection = (sectionData, sectionKey) => {
    if (!sectionData || typeof sectionData !== "object") {
      return {};
    }

    // Some domain keys differ between data and locales (e.g., commercial -> market)
    const localeDomainKey = sectionKey === "commercial" ? "market" : sectionKey;
    const translatedSection = {};

    // Map item.key -> locale subdomain keys for sections that store labels under assessments
    const getSubdomainLocaleKey = (domainKey, itemKey) => {
      if (!domainKey || !itemKey) return null;
      // Currently needed for financial where subdomain labels live in assessments.*SubDomain
      if (domainKey === "financial") {
        const map = {
          revenueGrowth: "revenueSubDomain",
          cost: "costManagementSubDomain",
          workingCapital: "workingCapitalManagementSubDomain",
          assetsManagement: "assetsManagementSubDomain",
          debtManagement: "debtManageabilitySubDomain",
          obsItems: "obsItemsSubDomain",
          operatingCashFlows: "operatingCashFlowSubDomain",
          capex: "capitalExpensesSubDomain",
          assumptions: "assumptionsSubDomain",
          financialRecords: "qualityOfFinancialRecordsSubDomain",
          financialReporting: "financialReportingSubDomain",
          internalControls: "internalControlsSubDomain",
          taxLiabilities: "taxLiabilitySubDomain",
        };
        return map[itemKey]
          ? `crat.${domainKey}.assessments.${map[itemKey]}`
          : null;
      }
      if (domainKey === "operations") {
        const map = {
          visionClarity: "visionClaritySubDomain",
          managementStructure: "managementStructureSubDomain",
          trackRecord: "trackRecordSubDomain",
          managementCommitment: "managementCommitmentSubDomain",
          teamCapacity: "teamCapacitySubDomain",
          performanceMeasurement: "performanceMeasurementSubDomain",
          professionalDevelopment: "professionalDevelopmentSubDomain",
          dataManagement: "dataManagementSubDomain",
          systemUsed: "systemUsedSubDomain",
          systemEffectiveness: "systemEffectivenessSubDomain",
          qualityControl: "qualityControlSubDomain",
          qualityManagementTeam: "qualityManagementTeamSubDomain",
          platformUtilization: "platformUtilizationSubDomain",
          crm: "customerRelationsSubDomain",
          businessStrategy: "businessStrategySubDomain",
          organizationalPlanning: "organizationPlanningSubDomain",
        };
        return map[itemKey]
          ? `crat.${domainKey}.assessments.${map[itemKey]}`
          : null;
      }
      if (domainKey === "legal") {
        const map = {
          businessIncorporation: "businessIncorporationSubDomain",
          taxIdentification: "taxIdentificationSubDomain",
          taxCompliance: "taxComplianceSubDomain",
          businessLicense: "businessLicenceSubDomain", // British spelling in locale
          sectorSpecificLicense: "sectorSpecificComplianceSubDomain",
          leaseAgreements: "leaseAgreementsSubDomain",
          customerAgreements: "customerContractsSubDomain",
          supplierAgreements: "supplierContractsSubDomain",
          employeeAgreements: "employeesContractsSubDomain",
          ipOwnership: "ipOwnershipSubDomain",
          character: "entrepreneurialCharacterSubDomain",
          personalLegalLiability: "personalLegalLiabilitySubDomain",
          successionPlan: "successionPlanSubDomain",
          bod: "boardOfDirectorsSubDomain",
        };
        return map[itemKey]
          ? `crat.${domainKey}.assessments.${map[itemKey]}`
          : null;
      }
      if (domainKey === "market") {
        const map = {
          demand: "demandSubDomain",
          marketShare: "marketShareSubDomain",
          sales: "salesSubDomain",
          customerSegments: "customerSegmentsSubDomain",
          paymentTerms: "paymentTermsSubDomain",
          salesStrategy: "salesStrategySubDomain",
          productDevelopment: "productDevelopmentSubDomain",
          productDistribution: "productDistributionSubDomain",
          productPricing: "productPricingBasisSubDomain",
          competitionLevel: "levelOfCompetitionSubDomain",
          competitiveAdvantage: "competitiveAdvantageSubDomain",
          marketingStrategy: "marketingStrategySubDomain",
          branding: "packagingBrandingSubDomain",
          promotionStrategy: "productPromotionSubDomain",
        };
        return map[itemKey]
          ? `crat.${domainKey}.assessments.${map[itemKey]}`
          : null;
      }
      return null;
    };

    // Safe nested lookup in current translations without defaulting to key strings
    const getRawTranslation = (path) => {
      if (!path) return undefined;
      const parts = path.split(".");
      let cur = translations;
      for (const p of parts) {
        if (cur && Object.prototype.hasOwnProperty.call(cur, p)) {
          cur = cur[p];
        } else {
          return undefined;
        }
      }
      return typeof cur === "string" ? cur : undefined;
    };

    Object.keys(sectionData).forEach((subsectionKey) => {
      // Some subsection keys differ between data and locales
      const subsectionKeyAliasMap = {
        salesAndTraction: "salesTraction",
        product: "productDevelopment",
        competitionAnalysis: "competition",
      };
      const subsectionKeyForLocale =
        subsectionKeyAliasMap[subsectionKey] || subsectionKey;
      // Translate the section title (like "marketDemandShare" -> "Mahitaji ya Soko na Mgao")
      const translatedSubsectionTitle = t(
        `crat.${localeDomainKey}.sections.${subsectionKeyForLocale}`,
        subsectionKey
      );

      console.log(
        `Translating section: ${sectionKey}.sections.${subsectionKey} -> ${translatedSubsectionTitle}`
      );

      translatedSection[translatedSubsectionTitle] = sectionData[
        subsectionKey
      ].map((item) => {
        // Prefer domain-specific subdomain key mapping when available
        const subdomainKeyFromMap = getSubdomainLocaleKey(
          localeDomainKey,
          item.key
        );
        const translatedSubDomain = subdomainKeyFromMap
          ? t(subdomainKeyFromMap, item.subDomain)
          : item.key
          ? t(`crat.${localeDomainKey}.${item.key}.title`, item.subDomain)
          : item.subDomain;

        return {
          ...item,
          subDomain: translatedSubDomain,
          narrative: item.narrative.map((n) => {
            // Try a few narrative key patterns. If none exist, keep original text.
            const candidates = [
              `crat.${localeDomainKey}.narratives.${item.key}.score${n.score}`,
              `crat.${localeDomainKey}.${item.key}.score${n.score}`,
            ];
            let translatedText;
            for (const cand of candidates) {
              const val = getRawTranslation(cand);
              if (typeof val === "string") {
                translatedText = val;
                break;
              }
            }
            if (!translatedText) translatedText = n.text;
            return { ...n, text: translatedText };
          }),
        };
      });
    });

    return translatedSection;
  };

  // Merge incoming scores into translated data when language or scores change
  useEffect(() => {
    const initialData = getInitialData();

    // Build translated data snapshot
    let translatedData = {
      commercial: translateSection(initialData.commercial, "commercial"),
      financial: translateSection(initialData.financial, "financial"),
      operations: translateSection(initialData.operations, "operations"),
      legal: translateSection(initialData.legal, "legal"),
    };

    // Apply incoming scores (if any) by matching backend labels to item keys
    if (Array.isArray(incomingScores) && incomingScores.length > 0) {
      const applyScores = (draft) => {
        const domains = ["commercial", "financial", "operations", "legal"];
        const next = { ...draft };
        incomingScores.forEach(({ subDomain, score }) => {
          const key = labelToKey(subDomain);
          if (!key) {
            console.warn("No key mapping for backend subDomain:", subDomain);
            return;
          }
          domains.forEach((domain) => {
            const sectionObj = next[domain];
            if (!sectionObj || typeof sectionObj !== "object") return;
            Object.keys(sectionObj).forEach((sectionTitle) => {
              const arr = sectionObj[sectionTitle];
              if (!Array.isArray(arr)) return;
              sectionObj[sectionTitle] = arr.map((item) =>
                item?.key === key ? { ...item, score } : item
              );
            });
          });
        });
        return next;
      };
      translatedData = applyScores(translatedData);
    }

    setData(translatedData);
  }, [language, t, incomingScores]);
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

      console.log("Raw response data:", responseData);

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

      // Store scores to be merged into translated data by the effect above
      setIncomingScores(responseData);
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

  // Note: legacy update method removed in favor of score-merging effect above

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
    console.log("Rendering section:", title, sectionData);
    console.log("Rendering section:", title, Object.keys(sectionData));
    // Return null if sectionData is not available
    if (!sectionData || typeof sectionData !== "object") {
      return null;
    }

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

      {data.commercial &&
        renderSection(t("report.commercial", "Commercial"), data.commercial)}
      {data.financial &&
        renderSection(t("report.financial", "Financial"), data.financial)}
      {data.operations &&
        renderSection(t("report.operations", "Operations"), data.operations)}
      {data.legal && renderSection(t("report.legal", "Legal"), data.legal)}

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
