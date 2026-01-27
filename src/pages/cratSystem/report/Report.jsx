"use client";
import { useState, useContext, useEffect } from "react";
import {
  getReportData,
  getInitialData,
  publishReport,
} from "@/controllers/crat_general_controller"; // Import updated API functions
import axios from "axios";
import { server_url } from "@/utils/endpoint";
import { headers } from "@/utils/headers";
import Modal2 from "@/components/Model2";
import toast from "react-hot-toast";
import Loader from "@/components/common/Loader";
import dynamic from "@/utils/dynamic";
const BusinessDomainScores = dynamic(
  () => import("@/components/Charts/BusinessDomainScores"),
  { ssr: false, loading: () => <Loader /> },
);
const PerformanceDistribution = dynamic(
  () => import("@/components/Charts/PerformanceDistribution"),
  { ssr: false, loading: () => <Loader /> },
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
    t("crat.tableHeaders.entrepreneurComment", "Entrepreneur Comment"),
    t("crat.tableHeaders.reviewerComment", "Reviewer Comment"),
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

  // Function to determine which CRAT domain and endpoint to use for a given subDomain
  const getDomainEndpoint = (subDomain) => {
    console.log("🔧 DEBUG: getDomainEndpoint called with:", subDomain);
    const domain = subDomain.toLowerCase().trim();
    console.log("🔧 DEBUG: Normalized domain:", domain);

    // Commercial/Market domain items
    const marketItems = [
      "demand",
      "market share",
      "sales",
      "customer segments",
      "payment terms",
      "sales strategy",
      "product development",
      "product distribution",
      "product pricing",
      "product pricing basis",
      "level of competition",
      "competitive advantage",
      "marketing strategy",
      "branding",
      "branding and packaging",
      "packaging & branding",
      "product promotion",
      "promotion strategy",
    ];

    // Financial domain items
    const financialItems = [
      "revenue",
      "revenue growth",
      "cost",
      "cost management",
      "working capital",
      "working capital management",
      "assets management",
      "operating cash flow",
      "operating cash flows",
      "capital expenses",
      "capex",
      "obs items",
      "debt management",
      "debt manageability",
      "assumptions",
      "quality of financial records",
      "financial records",
      "financial reporting",
      "internal controls",
      "tax liability",
      "tax liabilities",
    ];

    // Operations domain items
    const operationsItems = [
      "vision clarity",
      "management structure",
      "team capacity",
      "professional development",
      "track record",
      "performance measurement",
      "management commitment",
      "data management",
      "system used",
      "system effectiveness",
      "quality control",
      "quality management team",
      "platform utilization",
      "customer relations",
      "business strategy",
      "organization planning",
    ];

    // Legal domain items
    const legalItems = [
      "business incorporation",
      "tax identification",
      "tax compliance",
      "business licence",
      "business license",
      "sector specific compliance",
      "lease agreements",
      "customer contracts",
      "supplier contracts",
      "employees contracts",
      "employee contracts",
      "ip ownership",
      "entrepreneurial character",
      "personal legal liability",
      "succession plan",
      "board of directors",
    ];

    if (marketItems.includes(domain)) {
      console.log("🔧 DEBUG: Matched market domain");
      return { endpoint: "crat_market", domain: "market" };
    } else if (financialItems.includes(domain)) {
      console.log("🔧 DEBUG: Matched financial domain");
      return { endpoint: "crat_financial", domain: "financial" };
    } else if (operationsItems.includes(domain)) {
      console.log("🔧 DEBUG: Matched operations domain");
      return { endpoint: "crat_operation", domain: "operations" };
    } else if (legalItems.includes(domain)) {
      console.log("🔧 DEBUG: Matched legal domain");
      return { endpoint: "crat_legal", domain: "legal" };
    }

    // Default fallback
    console.log("🔧 DEBUG: No domain match found, using fallback");
    return { endpoint: "crat_general", domain: "general" };
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
        subsectionKey,
      );

      console.log(
        `Translating section: ${sectionKey}.sections.${subsectionKey} -> ${translatedSubsectionTitle}`,
      );

      translatedSection[translatedSubsectionTitle] = sectionData[
        subsectionKey
      ].map((item) => {
        // Prefer domain-specific subdomain key mapping when available
        const subdomainKeyFromMap = getSubdomainLocaleKey(
          localeDomainKey,
          item.key,
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

    // Apply incoming scores and comments (if any) by matching backend labels to item keys
    if (Array.isArray(incomingScores) && incomingScores.length > 0) {
      // First, deduplicate incoming scores - prefer records with higher scores or most recent updates
      const deduplicatedScores = {};
      incomingScores.forEach((record) => {
        const key = labelToKey(record.subDomain);
        if (!key) return;

        const existing = deduplicatedScores[key];
        if (!existing) {
          deduplicatedScores[key] = record;
        } else {
          // Prefer higher score, or if equal, prefer one with attachment or more recent update
          const shouldReplace =
            record.score > existing.score ||
            (record.score === existing.score &&
              record.attachment &&
              !existing.attachment) ||
            (record.score === existing.score &&
              new Date(record.updatedAt) > new Date(existing.updatedAt));

          if (shouldReplace) {
            deduplicatedScores[key] = record;
          }
        }
      });

      const applyScoresAndComments = (draft) => {
        const domains = ["commercial", "financial", "operations", "legal"];
        const next = { ...draft };
        Object.values(deduplicatedScores).forEach(
          ({ subDomain, score, uuid, customerComment, reviewerComment }) => {
            const key = labelToKey(subDomain);
            if (!key) {
              console.warn("No key mapping for backend subDomain:", subDomain);
              return;
            }
            // Determine the endpoint for this subdomain
            const { endpoint, domain: domainType } =
              getDomainEndpoint(subDomain);

            domains.forEach((domain) => {
              const sectionObj = next[domain];
              if (!sectionObj || typeof sectionObj !== "object") return;
              Object.keys(sectionObj).forEach((sectionTitle) => {
                const arr = sectionObj[sectionTitle];
                if (!Array.isArray(arr)) return;
                sectionObj[sectionTitle] = arr.map((item) =>
                  item?.key === key
                    ? {
                        ...item,
                        score,
                        uuid,
                        customerComment,
                        reviewerComment,
                        originalSubDomain: subDomain, // Store original subdomain from backend
                        endpoint, // Store the correct endpoint
                      }
                    : item,
                );
              });
            });
          },
        );
        return next;
      };
      translatedData = applyScoresAndComments(translatedData);
    }

    setData(translatedData);
  }, [language, t, incomingScores]);
  const [scoreData, setScoreData] = useState({}); // State to hold the score data
  const [deletemodalOpen, publishModalOpen] = useState(false);
  const [deletemodalMessage, publishModalMessage] = useState("");
  const [generalStatus, setGeneralStatus] = useState(
    t("report.notReady", "Not Ready"),
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

      // Fetch report data
      const responseData = await getReportData({
        user_uuid: user_uuid || userDetails?.uuid,
      });

      console.log("Raw response data:", responseData);

      // Calculate score data from actual report data
      const calculatedScoreData =
        calculateScoreDataFromReportData(responseData);

      if (calculatedScoreData && Object.keys(calculatedScoreData).length > 0) {
        setScoreData(calculatedScoreData);
        setGeneralStatus(
          calculatedScoreData?.general_status ||
            t("report.notReady", "Not Ready"),
        );
        console.log("Calculated score data from report:", calculatedScoreData);
      } else {
        // If no data, create fallback data
        const fallbackData = {
          commercial: {
            percentage: 0,
            status: t("report.notReady", "Not Ready"),
          },
          financial: {
            percentage: 0,
            status: t("report.notReady", "Not Ready"),
          },
          operations: {
            percentage: 0,
            status: t("report.notReady", "Not Ready"),
          },
          legal: { percentage: 0, status: t("report.notReady", "Not Ready") },
          general_status: t("report.notReady", "Not Ready"),
        };
        setScoreData(fallbackData);
        setGeneralStatus(t("report.notReady", "Not Ready"));
        console.log("Using fallback data for charts:", fallbackData);
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

  // Function to calculate domain scores from actual report data
  const calculateScoreDataFromReportData = (reportData) => {
    if (!reportData) return {};

    // If backend returns structured object by domains
    if (!Array.isArray(reportData)) {
      const domains = ["commercial", "financial", "operations", "legal"];
      const calculatedScores = {};
      domains.forEach((domain) => {
        if (reportData[domain]) {
          const domainData = reportData[domain];
          let totalScore = 0;
          let totalQuestions = 0;
          Object.values(domainData).forEach((subdomain) => {
            if (Array.isArray(subdomain)) {
              subdomain.forEach((item) => {
                if (typeof item.score === "number") {
                  totalScore += item.score;
                  totalQuestions += 1;
                }
              });
            }
          });
          const percentage = Math.round(
            totalQuestions > 0 ? (totalScore / (totalQuestions * 2)) * 100 : 0,
          );
          calculatedScores[domain] = {
            percentage,
            status:
              percentage >= 70
                ? t("report.ready", "Ready")
                : t("report.notReady", "Not Ready"),
          };
        }
      });
      const percentages = Object.values(calculatedScores).map(
        (item) => item.percentage,
      );
      const overall =
        percentages.length > 0
          ? percentages.reduce((s, v) => s + v, 0) / percentages.length
          : 0;
      calculatedScores.general_status =
        overall >= 70
          ? t("report.ready", "Ready")
          : t("report.notReady", "Not Ready");
      return calculatedScores;
    }

    // When backend returns a flat array of items across all domains
    const buckets = {
      commercial: { actual: 0, count: 0 },
      financial: { actual: 0, count: 0 },
      operations: { actual: 0, count: 0 },
      legal: { actual: 0, count: 0 },
    };
    reportData.forEach((row) => {
      const sub = row?.subDomain;
      const score = typeof row?.score === "number" ? row.score : null;
      if (!sub || score === null) return;
      const { domain } = getDomainEndpoint(String(sub));
      const key = domain === "market" ? "commercial" : domain; // map market->commercial
      if (!buckets[key]) return;
      buckets[key].actual += score;
      buckets[key].count += 1;
    });
    const result = {};
    Object.entries(buckets).forEach(([key, { actual, count }]) => {
      const target = count * 2; // each question max score 2
      const percentage = target > 0 ? Math.round((actual / target) * 100) : 0;
      result[key] = {
        percentage,
        status:
          percentage >= 70
            ? t("report.ready", "Ready")
            : t("report.notReady", "Not Ready"),
      };
    });
    const vals = Object.values(result).map((v) => v.percentage);
    const overall = vals.length
      ? vals.reduce((s, v) => s + v, 0) / vals.length
      : 0;
    result.general_status =
      overall >= 70
        ? t("report.ready", "Ready")
        : t("report.notReady", "Not Ready");
    return result;
  };

  const publishChanges = async () => {
    try {
      await publishReport(
        userDetails.id,
        userDetails.versionCount,
        userDetails.publishStatus,
      );

      setUserDetails((prevDetails) => ({
        ...prevDetails, // Copy existing properties
        publishStatus: t("report.onReview", "On review"), // Update the publishStatus property
      }));

      publishModalOpen(false);
      toast.success(
        t("report.publishedSuccessfully", "Published Successfully"),
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
        "Are you sure you want to publish this report for review?",
      ),
    );
  };

  const handleCustomerCommentBlur = async (uuid, comment, item) => {
    console.log("🔧 DEBUG: handleCustomerCommentBlur called");
    console.log("🔧 DEBUG: User role:", userDetails?.role);
    console.log("🔧 DEBUG: UUID:", uuid);
    console.log("🔧 DEBUG: Comment:", comment);
    console.log("🔧 DEBUG: Item:", item);

    // Check if user is Entrepreneur - only they can edit customer comments
    if (userDetails?.role !== "Enterprenuer") {
      console.log("🔧 DEBUG: Permission denied - user is not Entrepreneur");
      toast.warning(
        t(
          "report.noPermissionCustomer",
          "Only entrepreneurs can edit customer comments",
        ),
      );
      return;
    }

    try {
      // Use the stored endpoint from the item, fallback to getDomainEndpoint
      const endpoint =
        item.endpoint ||
        getDomainEndpoint(item.originalSubDomain || item.subDomain).endpoint;
      console.log("🔧 DEBUG: Using endpoint:", endpoint);
      console.log("🔧 DEBUG: Original subdomain:", item.originalSubDomain);
      console.log(
        "🔧 DEBUG: Making PATCH request to:",
        `${server_url}/${endpoint}/${uuid}`,
      );

      const response = await axios.patch(
        `${server_url}/${endpoint}/${uuid}`,
        {
          customerComment: comment,
        },
        { headers },
      );

      console.log("🔧 DEBUG: API Response:", response.data);

      if (response.data.status) {
        console.log("🔧 DEBUG: Comment saved successfully");
        toast.success(
          t("report.commentSavedAutomatically", "Comment saved automatically"),
        );
        // Update the local data to reflect the change
        updateLocalComment(uuid, "customerComment", comment);
      } else {
        console.log("🔧 DEBUG: API returned error status:", response.data);
        toast.error(t("report.errorSavingComment", "Error saving comment"));
      }
    } catch (error) {
      console.log("🔧 DEBUG: Exception occurred:", error);
      toast.error(t("report.errorSavingComment", "Error saving comment"));
      console.error("Error saving customer comment:", error);
    }
  };

  const handleReviewerCommentBlur = async (uuid, comment, item) => {
    console.log("🔧 DEBUG: handleReviewerCommentBlur called");
    console.log("🔧 DEBUG: User role:", userDetails?.role);
    console.log("🔧 DEBUG: UUID:", uuid);
    console.log("🔧 DEBUG: Comment:", comment);
    console.log("🔧 DEBUG: Item:", item);

    // Check if user is Staff - only they can edit reviewer comments
    if (userDetails?.role !== "Staff") {
      console.log("🔧 DEBUG: Permission denied - user is not Staff");
      toast.warning(
        t(
          "report.noPermissionReviewer",
          "Only reviewers can edit reviewer comments",
        ),
      );
      return;
    }

    try {
      // Use the stored endpoint from the item, fallback to getDomainEndpoint
      const endpoint =
        item.endpoint ||
        getDomainEndpoint(item.originalSubDomain || item.subDomain).endpoint;
      console.log("🔧 DEBUG: Using endpoint:", endpoint);
      console.log("🔧 DEBUG: Original subdomain:", item.originalSubDomain);
      console.log(
        "🔧 DEBUG: Making PATCH request to:",
        `${server_url}/${endpoint}/${uuid}`,
      );

      const response = await axios.patch(
        `${server_url}/${endpoint}/${uuid}`,
        {
          reviewerComment: comment,
        },
        { headers },
      );

      console.log("🔧 DEBUG: API Response:", response.data);

      if (response.data.status) {
        console.log("🔧 DEBUG: Reviewer comment saved successfully");
        toast.success(
          t("report.reviewerCommentSaved", "Reviewer comment saved"),
        );
        // Update the local data to reflect the change
        updateLocalComment(uuid, "reviewerComment", comment);
      } else {
        console.log("🔧 DEBUG: API returned error status:", response.data);
        toast.error(t("report.errorSavingComment", "Error saving comment"));
      }
    } catch (error) {
      console.log("🔧 DEBUG: Exception occurred:", error);
      toast.error(t("report.errorSavingComment", "Error saving comment"));
      console.error("Error saving reviewer comment:", error);
    }
  };

  const updateLocalComment = (uuid, commentType, comment) => {
    console.log("🔧 DEBUG: updateLocalComment called");
    console.log("🔧 DEBUG: UUID:", uuid);
    console.log("🔧 DEBUG: Comment Type:", commentType);
    console.log("🔧 DEBUG: Comment:", comment);

    setData((prevData) => {
      console.log("🔧 DEBUG: Previous data structure:", Object.keys(prevData));
      const newData = { ...prevData };

      // Update the comment in the nested data structure
      Object.keys(newData).forEach((sectionKey) => {
        if (Array.isArray(newData[sectionKey])) {
          newData[sectionKey].forEach((subsection) => {
            if (Array.isArray(subsection)) {
              subsection.forEach((item) => {
                if (item.uuid === uuid) {
                  item[commentType] = comment;
                }
              });
            }
          });
        } else if (typeof newData[sectionKey] === "object") {
          Object.keys(newData[sectionKey]).forEach((subKey) => {
            if (Array.isArray(newData[sectionKey][subKey])) {
              newData[sectionKey][subKey].forEach((item) => {
                if (item.uuid === uuid) {
                  console.log(
                    "🔧 DEBUG: Found matching item, updating comment",
                  );
                  console.log("🔧 DEBUG: Before update:", item[commentType]);
                  item[commentType] = comment;
                  console.log("🔧 DEBUG: After update:", item[commentType]);
                }
              });
            }
          });
        }
      });

      console.log("🔧 DEBUG: Local data update completed");
      return newData;
    });
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
            (dataItem) => dataItem.subDomain === item.subDomain,
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

  const renderTableHeaders = () => {
    // Show reviewer comment column to Admin and Staff roles
    const showReviewerComment = ["Admin", "Staff"].includes(userDetails?.role);

    return (
      <div
        className={`grid ${
          showReviewerComment ? "grid-cols-5" : "grid-cols-4"
        } border-b border-stroke py-4 px-4 dark:border-strokedark`}
      >
        <div className="flex items-center px-2">
          <p className="text-sm text-black dark:text-white font-semibold">
            {tableHeaders[0]}
          </p>
        </div>
        <div className="flex items-center px-2">
          <p className="text-sm text-black dark:text-white font-semibold">
            {tableHeaders[1]}
          </p>
        </div>
        <div className="flex items-center px-2">
          <p className="text-sm text-black dark:text-white font-semibold">
            {tableHeaders[2]}
          </p>
        </div>
        <div className="flex items-center px-2">
          <p className="text-sm text-black dark:text-white font-semibold">
            {tableHeaders[3]}
          </p>
        </div>
        {showReviewerComment && (
          <div className="flex items-center px-2">
            <p className="text-sm text-black dark:text-white font-semibold">
              {tableHeaders[4]}
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderTableRows = (sectionData) => {
    return sectionData.map((item, index) => {
      const narrative =
        item.narrative.find((n) => n.score === item.score)?.text ||
        t("report.narrativeNotFound", "Narrative not found");

      // Check user permissions
      const canEditCustomerComment = userDetails?.role === "Enterprenuer";
      const canEditReviewerComment = userDetails?.role === "Staff"; // Only Staff/Reviewers can edit reviewer comments
      const showReviewerComment = ["Admin", "Staff"].includes(
        userDetails?.role,
      ); // Show reviewer comment column to Admin and Staff

      return (
        <div
          className={`grid ${
            showReviewerComment ? "grid-cols-5" : "grid-cols-4"
          } border-t border-stroke py-4 px-4 dark:border-strokedark`}
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
          <div className="flex items-center px-2">
            <p className="w-full px-2 py-1 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-md  dark:border-gray-600 min-h-[2rem] flex items-center">
              {item.customerComment ||
                t("crat.noEntrepreneurComment", "No entrepreneur comment")}
            </p>
          </div>
          {showReviewerComment && (
            <div className="flex items-center px-2">
              {canEditReviewerComment ? (
                <textarea
                  defaultValue={item.reviewerComment || ""}
                  onBlur={(e) =>
                    handleReviewerCommentBlur(item.uuid, e.target.value, item)
                  }
                  placeholder={t(
                    "crat.enterReviewerComment",
                    "Enter reviewer comment...",
                  )}
                  className="w-full px-2 py-1 text-sm border border-black/20 rounded-md resize-none bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  rows={2}
                />
              ) : (
                <p className="w-full px-2 py-1 text-sm text-gray-500 dark:text-gray-400  dark:bg-gray-700 rounded-md  min-h-[2rem] flex items-center">
                  {item.reviewerComment ||
                    t("crat.noReviewerComment", "No reviewer comment")}
                </p>
              )}
            </div>
          )}
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
          "Capital Readiness Assessment Report",
        )}
        prevPage={t("common.back", "Back")}
        prevLink={""}
      />
      {/* {userDetails.role} */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className=" border-b border-black/0">
          <div className="flex justify-between items-center">
            <div>
              {/* <h2 className="text-2xl font-bold text-gray-800">
                Capital Readiness Assessment Report
              </h2> */}
            </div>
            <div className="flex space-x-3 pt-4 pr-4">
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
                  {/* <button
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
                  </button> */}
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
