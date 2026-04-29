"use client";
import { getBusiness, updateBusiness } from "@/controllers/business_controller";
import { useContext, useEffect, useState, lazy, Suspense } from "react";
import { useRouter } from "@/utils/navigation";
import { useParams } from "react-router-dom";
import Link from "@/utils/link";
import Loader from "@/components/common/Loader";
import { toast } from "react-hot-toast";
import { createConversation } from "@/controllers/conversation_controller";
import Image from "@/utils/image";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { createNotification } from "@/controllers/notification_controller";
import { assignEntreprenuerToMentor } from "@/controllers/mentorEntreprenuerController";
import Spinner from "@/components/spinner";
import { updateUser } from "@/controllers/user_controller";
import { getScoreData } from "@/controllers/crat_general_controller";
import { FaFilePdf } from "react-icons/fa";
import { useTranslation } from "@/locales";
import { UserContext } from "../../../layouts/DashboardLayout";
import { generateCapitalReadinessPDF } from "../../../services/capitalReadinessPDF";

// Lazy-load heavy chart and AI components so they don't block initial render
const BusinessDomainScores = lazy(
  () => import("@/components/Charts/BusinessDomainScores"),
);
const PerformanceDistribution = lazy(
  () => import("@/components/Charts/PerformanceDistribution"),
);
const AIAnalysisPanel = lazy(() => import("@/components/AI/AIAnalysisPanel"));

const Page = () => {
  const { t, isSwahili } = useTranslation();
  const { uuid } = useParams();
  const [business, setBusiness] = useState(null);
  const { userDetails } = useContext(UserContext);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [approving, setApproving] = useState(false);
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [loadingCRAT, setLoadingCRAT] = useState(false);
  const [cratData, setCratData] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  // CRAT documents state
  const [cratDocs, setCratDocs] = useState([]);

  // Calculate intelligent scores based on business data completeness
  const calculateIntelligentScore = (category) => {
    if (!business) return 50;

    let score = 50; // Base score

    switch (category) {
      case "commercial": {
        if (business.market) score += 15;
        if (business.numberOfCustomers && business.numberOfCustomers > 0)
          score += 15;
        if (business.impact) score += 10;
        if (business.traction) score += 10;
        break;
      }
      case "financial": {
        if (business.fundraisingNeeds) score += 15;
        if (business.lookingForInvestment) score += 15;
        if (business.stage && business.stage !== "Idea") score += 10;
        if (business.companyProfile) score += 10;
        break;
      }
      case "operations": {
        if (business.team && parseInt(business.team) > 1) score += 15;
        if (business.growthPlan) score += 15;
        if (business.location) score += 5;
        if (business.description) score += 10;
        if (business.solution) score += 5;
        break;
      }
      case "legal": {
        if (business.registration) score += 20;
        if (business.BusinessSector?.name) score += 15;
        if (business.status === "accepted") score += 10;
        if (business.sdg) score += 5;
        break;
      }
      default:
        break;
    }

    return Math.min(score, 95); // Cap at 95%
  };

  const toReadinessStatus = (percentage) => {
    if (percentage >= 75) return "Ready";
    if (percentage >= 60) return "Partially Ready";
    return "Not Ready";
  };

  const normalizeScoreData = (rawData) => {
    if (!rawData || typeof rawData !== "object") return null;

    const looksLikeScoreData =
      typeof rawData?.commercial?.percentage === "number" &&
      typeof rawData?.financial?.percentage === "number" &&
      typeof rawData?.operations?.percentage === "number" &&
      typeof rawData?.legal?.percentage === "number";

    if (looksLikeScoreData) return rawData;

    if (rawData?.scoreData && typeof rawData.scoreData === "object") {
      const nested = rawData.scoreData;
      if (
        typeof nested?.commercial?.percentage === "number" &&
        typeof nested?.financial?.percentage === "number" &&
        typeof nested?.operations?.percentage === "number" &&
        typeof nested?.legal?.percentage === "number"
      ) {
        return nested;
      }
    }

    const domainScores = rawData?.domainScores;
    if (!domainScores || typeof domainScores !== "object") return null;

    const toPercentFromDomain = (domain = {}) => {
      const average = Number(domain.average || 0);
      const reviewedQuestions = Number(domain.reviewedQuestions || 0);
      const totalQuestions = Number(domain.totalQuestions || 0);
      const earnedScore = average * reviewedQuestions;
      const maxScore = totalQuestions * 5;
      return maxScore > 0 ? Math.round((earnedScore / maxScore) * 100) : 0;
    };

    const commercial = toPercentFromDomain(domainScores.commercial_marketing);
    const financial = toPercentFromDomain(domainScores.financial);
    const operations = toPercentFromDomain(domainScores.operations);
    const legal = toPercentFromDomain(domainScores.legal_compliance);
    const overall = Math.round(
      (commercial + financial + operations + legal) / 4,
    );

    return {
      commercial: {
        percentage: commercial,
        status: toReadinessStatus(commercial),
      },
      financial: {
        percentage: financial,
        status: toReadinessStatus(financial),
      },
      operations: {
        percentage: operations,
        status: toReadinessStatus(operations),
      },
      legal: {
        percentage: legal,
        status: toReadinessStatus(legal),
      },
      general_status: toReadinessStatus(overall),
    };
  };

  const buildDomainDataForPdfFromScores = (scoreData) => {
    const toItemScore = (percentage) =>
      Number(((Number(percentage || 0) / 100) * 2).toFixed(2));

    return {
      commercial: {
        summary: [
          {
            subDomain: "Commercial readiness overview",
            score: toItemScore(scoreData?.commercial?.percentage),
            reviewerComment:
              "Derived from CRAT report domain score normalized by all domain questions.",
          },
        ],
      },
      financial: {
        summary: [
          {
            subDomain: "Financial readiness overview",
            score: toItemScore(scoreData?.financial?.percentage),
            reviewerComment:
              "Derived from CRAT report domain score normalized by all domain questions.",
          },
        ],
      },
      operations: {
        summary: [
          {
            subDomain: "Operations readiness overview",
            score: toItemScore(scoreData?.operations?.percentage),
            reviewerComment:
              "Derived from CRAT report domain score normalized by all domain questions.",
          },
        ],
      },
      legal: {
        summary: [
          {
            subDomain: "Legal and compliance readiness overview",
            score: toItemScore(scoreData?.legal?.percentage),
            reviewerComment:
              "Derived from CRAT report domain score normalized by all domain questions.",
          },
        ],
      },
    };
  };

  const getData = async () => {
    try {
      const data = await getBusiness(uuid);
      setBusiness(data);
      console.log("business", data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching business:", error);
      setLoading(false);
    }
  };

  const loadCRATForAI = async () => {
    if (!business) {
      toast.error(
        t("business.errors.dataNotLoaded", "Business data not loaded yet"),
      );
      return;
    }

    try {
      setLoadingCRAT(true);

      // Clear existing AI analysis data to force fresh load
      setCratData(null);
      setShowAIAnalysis(false);

      console.log("🔍 Preparing comprehensive AI analysis for:", business.name);
      console.log("👤 User UUID:", business.User?.uuid);

      // Show immediate feedback
      toast.loading(t("ai.preparing", "Preparing AI analysis..."), {
        id: "ai-loading",
      });

      // Try to get actual CRAT data first
      let actualCRATData = null;
      let hasCRATData = false;
      let normalizedCRATScoreData = null;
      try {
        // Pass the user's uuid to get their CRAT assessment scores
        actualCRATData = await getScoreData({ uuid: business.User?.uuid });
        console.log("📊 Raw CRAT data received:", actualCRATData);

        normalizedCRATScoreData = normalizeScoreData(actualCRATData);

        // Check if we have valid CRAT data with actual percentage values
        if (normalizedCRATScoreData) {
          hasCRATData = true;
          console.log(
            "✅ Valid CRAT assessment data found - using actual scores:",
            {
              commercial: normalizedCRATScoreData.commercial?.percentage,
              financial: normalizedCRATScoreData.financial?.percentage,
              operations: normalizedCRATScoreData.operations?.percentage,
              legal: normalizedCRATScoreData.legal?.percentage,
            },
          );
          toast.success(t("ai.cratLoaded", "CRAT assessment data loaded"), {
            id: "ai-loading",
          });
        } else {
          console.log(
            "⚠️ CRAT data structure invalid or incomplete, using business profile analysis",
            actualCRATData,
          );
          toast.success(
            t("ai.profilePrepared", "Business profile analysis prepared"),
            {
              id: "ai-loading",
            },
          );
        }
      } catch (cratError) {
        console.log(
          "ℹ️ No CRAT assessment found, using business profile analysis",
          cratError.message,
        );
        toast.success(
          t("ai.profilePrepared", "Business profile analysis prepared"),
          {
            id: "ai-loading",
          },
        );
      }

      // Create comprehensive score data - ALWAYS use actual CRAT data if available, even if scores are 0%
      const scoreData = hasCRATData
        ? normalizedCRATScoreData
        : {
            // When no CRAT assessment exists, show 0% to indicate no readiness data
            commercial: {
              percentage: 0,
              status: t("ai.status.notAssessed", "Not Assessed"),
            },
            financial: {
              percentage: 0,
              status: t("ai.status.notAssessed", "Not Assessed"),
            },
            operations: {
              percentage: 0,
              status: t("ai.status.notAssessed", "Not Assessed"),
            },
            legal: {
              percentage: 0,
              status: t("ai.status.notAssessed", "Not Assessed"),
            },
            general_status: t(
              "ai.generalStatus.noAssessment",
              "No CRAT Assessment",
            ),
          };

      // Log final scoreData to verify what's being used
      console.log("📈 Final scoreData being used for AI analysis:", {
        source: hasCRATData
          ? "CRAT Assessment"
          : "Business Profile (Generated)",
        commercial: scoreData.commercial?.percentage,
        financial: scoreData.financial?.percentage,
        operations: scoreData.operations?.percentage,
        legal: scoreData.legal?.percentage,
        general_status: scoreData.general_status,
      });

      // Create detailed report data with rich context
      const reportData = {
        commercial: {
          responses: [
            `${t(
              "business.labels.businessDescription",
              "Business Description",
            )}: ${
              business.description ||
              t(
                "business.placeholders.overviewMissing",
                "Comprehensive business overview needed",
              )
            }`,
            `${t("business.labels.targetMarket", "Target Market")}: ${
              business.market ||
              t(
                "business.placeholders.marketMissing",
                "Market analysis required",
              )
            }`,
            `${t("business.labels.customerBase", "Customer Base")}: ${
              business.numberOfCustomers
                ? `${business.numberOfCustomers} ${t(
                    "business.customers",
                    "customers",
                  )}`
                : t(
                    "business.placeholders.customerMetricsMissing",
                    "Customer metrics needed",
                  )
            }`,
            `${t("business.labels.marketImpact", "Market Impact")}: ${
              business.impact ||
              t(
                "business.placeholders.impactMissing",
                "Impact assessment required",
              )
            }`,
            `${t("business.labels.currentTraction", "Current Traction")}: ${
              business.traction ||
              t(
                "business.placeholders.tractionMissing",
                "Traction metrics needed",
              )
            }`,
            `${t("business.labels.problemStatement", "Problem Statement")}: ${
              business.problem ||
              t(
                "business.placeholders.problemMissing",
                "Problem definition required",
              )
            }`,
            `${t("business.labels.solutionOffered", "Solution Offered")}: ${
              business.solution ||
              t(
                "business.placeholders.solutionMissing",
                "Solution description required",
              )
            }`,
          ],
          score: scoreData.commercial.percentage,
        },
        financial: {
          responses: [
            `${t("business.labels.businessStage", "Business Stage")}: ${
              business.stage ||
              t(
                "business.placeholders.stageMissing",
                "Stage classification needed",
              )
            }`,
            `${t("business.labels.fundraisingNeeds", "Fundraising Needs")}: ${
              business.fundraisingNeeds ||
              t(
                "business.placeholders.fundraisingMissing",
                "Funding requirements not specified",
              )
            }`,
            `${t("business.labels.investmentSeeking", "Investment Seeking")}: ${
              business.lookingForInvestment
                ? t(
                    "business.seekingInvestmentYes",
                    "Actively seeking investment",
                  )
                : t(
                    "business.seekingInvestmentNo",
                    "Not currently seeking investment",
                  )
            }`,
            `${t("business.labels.revenueModel", "Revenue Model")}: ${
              business.businessPlan
                ? t(
                    "business.placeholders.businessPlanAvailable",
                    "Business plan available",
                  )
                : t(
                    "business.placeholders.revenueModelMissing",
                    "Revenue model documentation needed",
                  )
            }`,
            `${t(
              "business.labels.financialDocumentation",
              "Financial Documentation",
            )}: ${
              business.companyProfile
                ? t(
                    "business.placeholders.companyProfileAvailable",
                    "Company profile available",
                  )
                : t(
                    "business.placeholders.financialDocsMissing",
                    "Financial documents needed",
                  )
            }`,
            `${t("business.labels.growthPlans", "Growth Plans")}: ${
              business.growthPlan ||
              t(
                "business.placeholders.growthStrategyMissing",
                "Growth strategy required",
              )
            }`,
          ],
          score: scoreData.financial.percentage,
        },
        operations: {
          responses: [
            `${t("business.labels.teamStructure", "Team Structure")}: ${
              business.team
                ? `${t("business.teamSize", "Team Size")} ${business.team}`
                : t(
                    "business.placeholders.teamSizeMissing",
                    "Team size not specified",
                  )
            }`,
            `${t("business.labels.businessLocation", "Business Location")}: ${
              business.location ||
              t(
                "business.placeholders.locationMissing",
                "Location not specified",
              )
            }`,
            `${t("business.labels.growthStrategy", "Growth Strategy")}: ${
              business.growthPlan ||
              t(
                "business.placeholders.strategyMissing",
                "Strategic planning required",
              )
            }`,
            `${t("business.labels.operationalStatus", "Operational Status")}: ${
              business.status === "accepted"
                ? t(
                    "business.placeholders.approvedOperations",
                    "Approved operations",
                  )
                : t("business.placeholders.pendingApproval", "Pending approval")
            }`,
            `${t("business.labels.industrySector", "Industry Sector")}: ${
              business.BusinessSector?.name ||
              t(
                "business.placeholders.sectorMissing",
                "Sector classification needed",
              )
            }`,
            `${t("business.labels.programCompletion", "Program Completion")}: ${
              business.completedProgram ||
              t(
                "business.placeholders.noProgramCompletion",
                "No program completion recorded",
              )
            }`,
            `${t("business.labels.alumniStatus", "Alumni Status")}: ${
              business.isAlumni
                ? t("business.alumni", "Anza Alumni")
                : t("business.nonAlumni", "Non-alumni")
            }`,
          ],
          score: scoreData.operations.percentage,
        },
        legal: {
          responses: [
            `${t(
              "business.labels.businessRegistration",
              "Business Registration",
            )}: ${
              business.registration ||
              t(
                "business.placeholders.registrationMissing",
                "Registration documentation needed",
              )
            }`,
            `${t("business.labels.legalStructure", "Legal Structure")}: ${
              business.BusinessSector?.name ||
              t(
                "business.placeholders.legalStructureMissing",
                "Legal structure classification required",
              )
            }`,
            `${t("business.labels.complianceStatus", "Compliance Status")}: ${
              business.status === "accepted"
                ? t(
                    "business.placeholders.compliantApproved",
                    "Compliant and approved",
                  )
                : t(
                    "business.placeholders.pendingCompliance",
                    "Pending compliance review",
                  )
            }`,
            `${t("business.labels.sdgAlignment", "SDG Alignment")}: ${
              business.sdg ||
              t(
                "business.placeholders.sdgMissing",
                "SDG alignment assessment needed",
              )
            }`,
            `${t("business.labels.documentation", "Documentation")}: ${
              business.companyProfile
                ? t(
                    "business.placeholders.legalDocsAvailable",
                    "Legal documents available",
                  )
                : t(
                    "business.placeholders.legalDocsMissing",
                    "Legal documentation required",
                  )
            }`,
            `${t(
              "business.labels.industryCompliance",
              "Industry Compliance",
            )}: ${
              business.BusinessSector?.name
                ? t(
                    "business.placeholders.industryComplianceAddressed",
                    "Industry-specific compliance addressed",
                  )
                : t(
                    "business.placeholders.industryComplianceMissing",
                    "Industry compliance assessment needed",
                  )
            }`,
          ],
          score: scoreData.legal.percentage,
        },
      };

      // Create comprehensive business info for AI
      const businessInfo = {
        name:
          business.name || t("business.labels.businessName", "Business Name"),
        sector:
          business.BusinessSector?.name ||
          t("business.labels.sector", "Technology"),
        location:
          business.location || t("business.labels.location", "Tanzania"),
        stage: business.stage || t("business.labels.stage", "Growth Stage"),
        description: business.description,
        problem: business.problem,
        solution: business.solution,
        traction: business.traction,
        market: business.market,
        impact: business.impact,
        growthPlan: business.growthPlan,
        fundraisingNeeds: business.fundraisingNeeds,
        entrepreneur: business.User?.name,
        email: business.email,
        phone: business.phone,
        team: business.team,
        registration: business.registration,
        sdg: business.sdg,
        lookingForInvestment: business.lookingForInvestment,
        isAlumni: business.isAlumni,
        completedProgram: business.completedProgram,
        numberOfCustomers: business.numberOfCustomers,
      };

      // Log the data being passed to AI Analysis to ensure correctness
      console.log("🔍 AI Analysis Data:", {
        hasCRATData,
        scoreData,
        message: hasCRATData
          ? "Using actual CRAT assessment scores"
          : "Using generated business profile scores",
      });

      setCratData({
        scoreData,
        reportData,
        businessInfo,
      });

      setShowAIAnalysis(true);

      // Success message with context
      const avgScore = Math.round(
        (scoreData.commercial.percentage +
          scoreData.financial.percentage +
          scoreData.operations.percentage +
          scoreData.legal.percentage) /
          4,
      );

      // Determine score category for better messaging
      let scoreCategory = t("ai.scoreCategories.excellent", "Excellent");
      let scoreEmoji = "🎯";
      if (avgScore < 50) {
        scoreCategory = t(
          "ai.scoreCategories.needsImprovement",
          "Needs Improvement",
        );
        scoreEmoji = "📈";
      } else if (avgScore < 70) {
        scoreCategory = t("ai.scoreCategories.goodPotential", "Good Potential");
        scoreEmoji = "⭐";
      } else if (avgScore < 85) {
        scoreCategory = t(
          "ai.scoreCategories.strongPerformance",
          "Strong Performance",
        );
        scoreEmoji = "🚀";
      }

      toast.success(
        `${scoreEmoji} ${t(
          "ai.analysisComplete",
          "AI analysis complete!",
        )} ${scoreCategory} - ${avgScore}%`,
        {
          id: "ai-loading",
          duration: 4000,
        },
      );

      // Smooth scroll to AI section with slight delay for better UX
      setTimeout(() => {
        document.getElementById("ai-analysis-section")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 800);
    } catch (error) {
      console.error("❌ Error preparing AI analysis:", error);
      toast.error(
        t(
          "ai.errors.prepareFailed",
          "Failed to prepare AI analysis. Please try again.",
        ),
        {
          id: "ai-loading",
        },
      );
    } finally {
      setLoadingCRAT(false);
    }
  };

  const handleDownloadAIReport = async () => {
    if (pdfLoading) return;

    let toastId;
    try {
      setPdfLoading(true);

      toastId = toast.loading(
        t("report.generatingPdf", "Generating AI report — please wait..."),
      );

      // Reuse existing CRAT/AI data if available, otherwise build fresh score data
      let scoreDataForPdf = cratData?.scoreData;
      let reportPayloadForPdf = null;

      console.log("📄 PDF Generation - Initial cratData check:", {
        hasCratData: !!cratData,
        hasScoreData: !!cratData?.scoreData,
        scoreData: cratData?.scoreData,
      });

      if (!scoreDataForPdf) {
        let hasCRATData = false;
        let actualCRATData = null;

        try {
          actualCRATData = await getScoreData({ uuid: business.User?.uuid });
          reportPayloadForPdf = actualCRATData;

          console.log(
            "📄 PDF Generation - Raw CRAT data fetched:",
            actualCRATData,
          );

          const normalizedCRATScoreData = normalizeScoreData(actualCRATData);

          console.log("📄 PDF Generation - Normalized CRAT data:", {
            normalized: normalizedCRATScoreData,
            isValid: !!normalizedCRATScoreData,
          });

          if (normalizedCRATScoreData) {
            hasCRATData = true;
            scoreDataForPdf = normalizedCRATScoreData;
            console.log("✅ PDF using actual CRAT scores:", scoreDataForPdf);
          }
        } catch (err) {
          console.log("ℹ️ No CRAT assessment found for PDF generation", err);
        }

        if (!hasCRATData) {
          console.log("⚠️ No CRAT assessment data - using 0% for all domains");

          // When there's no CRAT assessment data, use 0% to indicate no readiness data
          scoreDataForPdf = {
            commercial: {
              percentage: 0,
              status: t("ai.status.notAssessed", "Not Assessed"),
            },
            financial: {
              percentage: 0,
              status: t("ai.status.notAssessed", "Not Assessed"),
            },
            operations: {
              percentage: 0,
              status: t("ai.status.notAssessed", "Not Assessed"),
            },
            legal: {
              percentage: 0,
              status: t("ai.status.notAssessed", "Not Assessed"),
            },
          };
        }
      }

      const pdfUserContext = {
        Business: {
          businessName: business?.name,
          name: business?.name,
          sector: business?.BusinessSector?.name,
          businessSector: business?.BusinessSector?.name,
          location: business?.location,
          businessLocation: business?.location,
        },
      };

      const domainDataForPdf =
        cratData?.reportData ||
        reportPayloadForPdf?.reportData ||
        buildDomainDataForPdfFromScores(scoreDataForPdf);

      console.log(
        "📄 PDF Generation - Final data being passed to generateCapitalReadinessPDF:",
        {
          scoreDataForPdf,
          domainDataForPdf: domainDataForPdf ? "exists" : "null",
          pdfUserContext,
        },
      );

      await generateCapitalReadinessPDF(
        domainDataForPdf,
        scoreDataForPdf,
        pdfUserContext,
        (msg) => {
          toast.loading(msg, { id: toastId });
        },
      );

      toast.success(t("report.pdfReady", "Report downloaded successfully!"), {
        id: toastId,
      });
    } catch (error) {
      console.error("❌ Error generating AI PDF:", error);
      const errorMessage = error?.message || "Unknown error";
      toast.error(
        `${t("ai.failedToDownloadPDF", "Failed to generate AI PDF")}: ${errorMessage}`,
        { id: toastId },
      );
    } finally {
      setPdfLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, [uuid]);

  // Collect CRAT documents once business is loaded
  useEffect(() => {
    if (!business?.User) return;
    const docs = [];
    const collect = (arr, type) => {
      if (!Array.isArray(arr)) return;
      arr.forEach((item) => {
        if (item && item.attachment) {
          docs.push({
            url: item.attachment,
            name: item.attachment.split("/").pop(),
            type,
            subDomain: item.subDomain,
            updatedAt: item.updatedAt,
          });
        }
      });
    };

    collect(business.User.CratMarkets, "Market");
    collect(business.User.CratFinancials, "Financial");
    collect(business.User.CratOperations, "Operations");
    collect(business.User.CratLegals, "Legal");

    setCratDocs(docs);
  }, [business]);

  return loading ? (
    <Loader />
  ) : (
    business && (
      <div>
        <Breadcrumb
          prevLink=""
          prevPage={t("navigation.businesses", "Businesses")}
          pageName={`${business?.name}`}
        />
        {/* Stats Section - Full Width */}
        <div className="bg-primary/5 rounded-2xl border border-black/10 dark:bg-boxdark backdrop-blur-sm dark:border-strokedark">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Business Profile Header */}

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="p-6 rounded-2xl bg-white dark:bg-boxdark-2 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="text-4xl mb-3">👥</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  {business?.numberOfCustomers ||
                    t("common.notProvided", "N/A")}{" "}
                  {/* Updated to use numberOfCustomers */}
                </h3>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t("business.customers", "Customers")}
                </p>
              </div>
              <div className="p-6 rounded-2xl bg-white dark:bg-boxdark-2 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="text-4xl mb-3">📍</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  {business?.location || t("common.notProvided", "N/A")}{" "}
                  {/* Updated to use location */}
                </h3>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t("business.location", "Location")}
                </p>
              </div>
              <div className="p-6 rounded-2xl bg-white dark:bg-boxdark-2 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="text-4xl mb-3">🏢</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  {isSwahili
                    ? business?.BusinessSector?.swName
                    : business?.BusinessSector?.name ||
                      t("common.notProvided", "N/A")}{" "}
                  {/* Updated to use BusinessSector.name */}
                </h3>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t("business.industry", "Industry")}
                </p>
              </div>
              <div className="p-6 rounded-2xl bg-white dark:bg-boxdark-2 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="text-4xl mb-3">💡</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  {business?.stage || t("common.notProvided", "N/A")}
                </h3>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t("business.stage", "Stage")}
                </p>
              </div>
              <div className="p-6 rounded-2xl bg-white dark:bg-boxdark-2 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="text-4xl mb-3">💵</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  {business?.revenue || t("common.notProvided", "N/A")}
                </h3>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t("business.revenue", "Revenue")}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white dark:bg-boxdark rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300">
              <h2 className="text-2xl font-bold mb-6 capitalize flex items-center text-gray-900 dark:text-white">
                <span className="text-3xl mr-3">ℹ️</span>
                {t("business.overview", "Business Overview")}
              </h2>
              <div className="space-y-8">
                {/* Business/Entrepreneur Image */}
                <div>
                  <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                    {business?.description ||
                      t(
                        "business.placeholders.descriptionMissing",
                        "Description not available",
                      )}
                  </p>
                </div>
                {/* Added Problem, Solution, and Traction */}
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">
                    {t("business.problem", "Problem")}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                    {business?.problem ||
                      t(
                        "business.placeholders.problemDescriptionMissing",
                        "No problem description available",
                      )}
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">
                    {t("business.solution", "Solution")}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                    {business?.solution ||
                      t(
                        "business.placeholders.solutionDescriptionMissing",
                        "No solution description available",
                      )}
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">
                    {t("business.traction", "Traction")}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                    {business?.traction ||
                      t(
                        "business.placeholders.tractionInfoMissing",
                        "No traction information available",
                      )}
                  </p>
                </div>
              </div>
            </div>

            {/* Market & Impact */}
            <div className="bg-white dark:bg-boxdark rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300">
              <h2 className="text-2xl font-bold mb-6 flex items-center text-gray-900 dark:text-white">
                <span className="text-3xl mr-3">🎯</span>
                {t("business.marketPotential", "Market Potential")}
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">
                    {t("business.targetMarket", "Target Market")}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                    {business?.market ||
                      t(
                        "business.placeholders.targetMarketMissing",
                        "No target market description available",
                      )}{" "}
                    {/* Updated to use market */}
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">
                    {t("business.currentImpact", "Current Impact")}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                    {business?.impact ||
                      t(
                        "business.placeholders.impactDescriptionMissing",
                        "No impact description available",
                      )}{" "}
                    {/* Updated to use impact */}
                  </p>
                </div>
              </div>
            </div>

            {/* Growth & Funding */}
            <div className="bg-white dark:bg-boxdark rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300">
              <h2 className="text-2xl font-bold mb-6 flex items-center text-gray-900 dark:text-white">
                <span className="text-3xl mr-3">📈</span>
                {t("business.growthAndFunding", "Growth & Funding")}
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">
                    {t("business.growthPlans", "Growth Plans")}
                  </h3>
                  <p className="text-gray-600  text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                    {business?.growthPlan ||
                      t(
                        "business.placeholders.growthPlansMissing",
                        "No growth plans available",
                      )}{" "}
                    {/* Updated to use growthPlan */}
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">
                    {t("business.fundraisingNeeds", "Fundraising Needs")}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                    {business?.fundraisingNeeds ||
                      t(
                        "business.placeholders.fundraisingNeedsMissing",
                        "No fundraising needs specified",
                      )}
                  </p>
                </div>
              </div>
            </div>
            {["Admin", "Mentor", "Investor", "Staff"].includes(
              userDetails.role,
            ) && (
              <div className="grid grid-cols-12 gap-6 items-stretch">
                <div className=" col-span-7">
                  <Suspense
                    fallback={
                      <div className="h-48 bg-gray-100 animate-pulse rounded-xl" />
                    }
                  >
                    <BusinessDomainScores
                      userDetails={business?.User}
                      initialScoreData={{}}
                    />
                  </Suspense>
                </div>
                <div className="col-span-5">
                  <Suspense
                    fallback={
                      <div className="h-48 bg-gray-100 animate-pulse rounded-xl" />
                    }
                  >
                    <PerformanceDistribution
                      userDetails={business?.User}
                      chartHeight={250}
                      initialScoreData={{}}
                    />
                  </Suspense>
                </div>
              </div>
            )}

            {/* Documents Section */}
            {business.companyProfile && (
              <div className="bg-white dark:bg-boxdark rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300">
                <h2 className="text-2xl font-bold mb-8 flex items-center text-gray-900 dark:text-white">
                  <span className="text-3xl mr-3">📑</span>
                  {t("business.documents", "Documents")}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {[
                    {
                      title: t("business.companyProfileDoc", "Company Profile"),
                      url: business.companyProfile,
                      // use PDF icon for documents
                      icon: <FaFilePdf className="text-red-600" />,
                    },
                    // Only include businessPlan and marketResearch if they exist
                    ...(business.businessPlan
                      ? [
                          {
                            title: t(
                              "business.businessPlanDoc",
                              "Business Plan",
                            ),
                            url: business.businessPlan,
                            icon: <FaFilePdf className="text-red-600" />,
                          },
                        ]
                      : []),
                    ...(business.marketResearch
                      ? [
                          {
                            title: t(
                              "business.marketResearchDoc",
                              "Market Research",
                            ),
                            url: business.marketResearch,
                            icon: <FaFilePdf className="text-red-600" />,
                          },
                        ]
                      : []),
                  ].map((doc, idx) => (
                    <a
                      key={idx}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex flex-col items-center p-6 bg-gray-50 dark:bg-boxdark-2 rounded-xl hover:shadow-lg transition-all duration-300"
                    >
                      <span className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300 text-red-600">
                        {doc.icon}
                      </span>
                      <span className="text-base font-semibold text-gray-900 dark:text-white">
                        {doc.title}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {userDetails.role === "Admin" && business.status == "waiting" && (
              <button
                onClick={() => {
                  setApproving(true);
                  updateBusiness({ status: "accepted" }, business.uuid).then(
                    (res) => {
                      updateUser({ activated: true }, business.User.uuid).then(
                        () => {
                          toast.success(
                            t(
                              "business.success.approved",
                              "Approved successfully",
                            ),
                          );
                          setApproving(false);
                          router.back();
                        },
                      );
                    },
                  );
                }}
                className="inline-flex items-center w-64 justify-center px-6 py-4 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-200 font-semibold text-lg shadow-sm hover:shadow-md"
              >
                {approving ? (
                  <Spinner />
                ) : (
                  t(
                    "business.actions.approveEntrepreneur",
                    "Approve Entrepreneur",
                  )
                )}
              </button>
            )}
          </div>

          {/* Right Column - Business Info */}
          <div className="space-y-8">
            <div className="bg-white dark:bg-boxdark rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300 sticky top-8">
              <h2 className="text-2xl font-bold mb-6 flex items-center text-gray-900 dark:text-white">
                <span className="text-3xl mr-3">ℹ️</span>
                {t("business.businessInformation", "Business Information")}
              </h2>
              <div className="space-y-4">
                {[
                  {
                    label: t("business.entrepreneur", "Entrepreneur"),
                    value: business?.User?.name,
                    icon: "👤",
                  },
                  {
                    label: t("common.email", "Email"),
                    value: business?.email,
                    icon: "📧",
                  },
                  {
                    label: t("common.phone", "Phone"),
                    value: business?.phone,
                    icon: "📱",
                  },
                  {
                    label: t("business.registration", "Registration"),
                    value: business?.registration,
                    icon: "📄",
                  },
                  {
                    label: t("business.sdg", "SDG"),
                    value: business?.sdg,
                    icon: "🎯",
                  },
                  {
                    label: t("business.industry", "Industry"),
                    value: business?.BusinessSector?.name,
                    icon: "🏢",
                  },
                  {
                    label: t("business.location", "Location"),
                    value: business?.location,
                    icon: "📍",
                  },
                  {
                    label: t("business.teamSize", "Team Size"),
                    value: business?.team,
                    icon: "👥",
                  },
                  {
                    label: t("business.program", "Program"),
                    value: business?.completedProgram,
                    icon: "📚",
                  },
                  {
                    label: t("business.anzaAlumni", "Anza Alumni"),
                    value: business?.isAlumni
                      ? t("common.yes", "Yes")
                      : t("common.no", "No"),
                    icon: "🎓",
                  },
                  {
                    label: t("business.status", "Status"),
                    value: business?.status,
                    icon: "📊",
                  },
                  {
                    label: t(
                      "business.seekingInvestment",
                      "Seeking Investment",
                    ),
                    value: business?.lookingForInvestment
                      ? t("common.yes", "Yes")
                      : t("common.no", "No"),
                    icon: "💰",
                  },
                  {
                    label: t("business.website", "Website"),
                    value: business?.websiteLink,
                    icon: "🌐",
                  },
                  {
                    label: t("business.instagramLink", "Instagram Link"),
                    value: business?.instagramLink,
                    icon: "🔗",
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-boxdark-2 rounded-xl hover:bg-gray-100 dark:hover:bg-boxdark-3 transition-colors duration-200"
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {item.label}
                      </p>
                      {item.label === t("common.email", "Email") &&
                      item.value ? (
                        <a
                          href={`mailto:${item.value}`}
                          className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline transition-colors duration-200"
                        >
                          {item.value}
                        </a>
                      ) : item.label === t("common.phone", "Phone") &&
                        item.value ? (
                        <a
                          href={`tel:${item.value}`}
                          className="font-semibold text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 hover:underline transition-colors duration-200"
                        >
                          {item.value}
                        </a>
                      ) : (
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {item.value || t("common.notProvided", "N/A")}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Added Social Media Links */}
              {(business.facebook ||
                business.instagram ||
                business.linkedin ||
                business.twitter) && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
                    {t("business.socialMedia", "Social Media")}
                  </h3>
                  <div className="flex space-x-4">
                    {business.facebook && (
                      <a
                        href={business.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <span className="text-2xl">📘</span>
                      </a>
                    )}
                    {/* {business.instagram && (
                    <a
                      href={business.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-pink-600 hover:text-pink-800"
                    >
                      <span className="text-2xl">📷</span>
                    </a>
                  )} */}
                    {business.websiteLink && (
                      <a
                        href={business.websiteLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary"
                      >
                        <span className="text-2xl">
                          {" "}
                          {t("business.visitWebsite", "Visit Website")}
                        </span>
                      </a>
                    )}
                    {business.instagramLink && (
                      <a
                        href={business.instagramLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary"
                      >
                        <span className="text-2xl">
                          {" "}
                          {t("business.visitWebsite", "Visit Website")}
                        </span>
                      </a>
                    )}

                    {business.linkedin && (
                      <a
                        href={business.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-700 hover:text-blue-900"
                      >
                        <span className="text-2xl">💼</span>
                      </a>
                    )}
                    {business.twitter && (
                      <a
                        href={business.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <span className="text-2xl">🐦</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* CRAT Documents Folder - visible to Admin and Staff only */}
              {["Admin", "Staff"].includes(userDetails.role) && (
                <div className="mt-2">
                  <div>
                    <button
                      onClick={() =>
                        router.push(
                          `/dashboard/businessDetails/${business.uuid}/crat-documents`,
                        )
                      }
                      className="w-full flex justify-center text-center font-bold p-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white border border-black/10 rounded-xl hover:shadow-md transition-all duration-200"
                    >
                      <div>
                        📂 {t("business.cratAttachments", "Crat Attachments")}
                      </div>
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-4 flex flex-col gap-4">
                {/* AI Evaluation Button - Admin Only */}

                {/* Download AI Report (PDF) - Admin Only */}
                {userDetails.role === "Admin" && (
                  <button
                    onClick={handleDownloadAIReport}
                    disabled={pdfLoading}
                    className="inline-flex items-center justify-center w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {pdfLoading ? (
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
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        {t("report.generatingPdf", "Generating AI Report...")}
                      </>
                    ) : (
                      <>
                        <span className="mr-2 text-xl">
                          <FaFilePdf />
                        </span>
                        {t("report.downloadAiPdf", "Download Report (PDF)")}
                      </>
                    )}
                  </button>
                )}

                <button
                  onClick={() => {
                    const data = {
                      to: business.User.uuid,
                      type: "userToUser",
                      lastMessage: "",
                    };
                    toast.success(
                      t(
                        "chat.enablingEncryptionWait",
                        "Enabling end-to-end encryption. Please wait...",
                      ),
                    );
                    createNotification({
                      user_uuid: business.User.uuid,
                      to: "User",
                      message: `${t(
                        "notifications.newMessage",
                        "You have a new message",
                      )}`,
                    });
                    createConversation(data).then((data) => {
                      router.push(`/dashboard/messages/${data.uuid}`);
                    });
                  }}
                  className="inline-flex items-center justify-center w-full px-6 py-4 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all duration-200 font-semibold text-lg shadow-sm hover:shadow-md"
                >
                  <span className="mr-2 text-xl">💬</span>
                  {t("common.message", "Message")}
                </button>

                {userDetails.role === "Investor" && (
                  <Link
                    href={`/dashboard/investmentApplication/${uuid}`}
                    className="inline-flex items-center justify-center px-6 py-4 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-200 font-semibold text-lg shadow-sm hover:shadow-md"
                  >
                    <span className="mr-2 text-xl">💰</span>
                    {t("investment.expressInterest", "Express Interest")}
                  </Link>
                )}

                {["Mentor"].includes(userDetails.role) &&
                  !business.linkedWithMentor && (
                    <button
                      onClick={() => {
                        setRequesting(true);
                        const payload = {
                          mentor_uuid: userDetails.uuid,
                          entreprenuer_uuid: business.User.uuid,
                        };
                        assignEntreprenuerToMentor(payload).then((res) => {
                          getData();
                          toast.success(
                            t(
                              "mentorship.requestSent",
                              "Request sent successfully",
                            ),
                          );
                          setRequesting(false);
                        });
                      }}
                      disabled={requesting}
                      className="inline-flex items-center justify-center px-6 py-4 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all duration-200 font-semibold text-lg shadow-sm hover:shadow-md disabled:opacity-50"
                    >
                      <span className="mr-2 text-xl">🤝</span>
                      {requesting
                        ? t("mentorship.requesting", "Requesting...")
                        : t(
                            "mentorship.requestToBeMentor",
                            "Request to be a mentor",
                          )}
                    </button>
                  )}
              </div>
            </div>

            {/* View User Activity Logs Button - Admin Only */}
          </div>
        </div>

        {/* AI Analysis Section - Admin Only */}
        {["Admin"].includes(userDetails.role) && showAIAnalysis && cratData && (
          <div id="ai-analysis-section" className="mt-12 animate-fadeIn">
            {/* Analysis Header */}
            <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 dark:from-purple-900/20 dark:via-indigo-900/20 dark:to-blue-900/20 p-8 rounded-2xl border-2 border-purple-200 dark:border-purple-700 mb-8 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-3xl">🤖</span>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
                      {t("ai.headerTitle", "AI-Powered Investment Analysis")}
                    </h2>
                    <p className="text-purple-600 dark:text-purple-400 mt-2 text-lg">
                      {t("ai.headerSubtitle", "Comprehensive evaluation of")}{" "}
                      <span className="font-semibold">{business?.name}</span>{" "}
                      {t(
                        "ai.headerSubtitleSuffix",
                        "using advanced AI analysis",
                      )}
                    </p>
                  </div>
                </div>

                {/* Analysis Metrics */}
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-white dark:bg-gray-800 rounded-full shadow-md border border-purple-200 dark:border-purple-700">
                      <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                        {cratData.scoreData.general_status}
                      </span>
                    </div>
                    <div className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full shadow-md">
                      <span className="text-sm font-bold">
                        {t("ai.overallScore", "Overall Score:")}{" "}
                        {Math.round(
                          (cratData.scoreData.commercial.percentage +
                            cratData.scoreData.financial.percentage +
                            cratData.scoreData.operations.percentage +
                            cratData.scoreData.legal.percentage) /
                            4,
                        )}
                        %
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {t("ai.generatedOn", "Analysis generated on")}{" "}
                    {new Date().toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Quick Score Overview */}
              <div className="mt-6 grid grid-cols-4 gap-4">
                {[
                  {
                    label: t("ai.domains.commercial", "Commercial"),
                    score: Math.round(cratData.scoreData.commercial.percentage),
                  },
                  {
                    label: t("ai.domains.financial", "Financial"),
                    score: Math.round(cratData.scoreData.financial.percentage),
                  },
                  {
                    label: t("ai.domains.operations", "Operations"),
                    score: Math.round(cratData.scoreData.operations.percentage),
                  },
                  {
                    label: t("ai.domains.legal", "Legal"),
                    score: Math.round(cratData.scoreData.legal.percentage),
                  },
                ].map((item, index) => {
                  // Dynamic color based on CRAT readiness levels
                  const getScoreColor = (score) => {
                    if (score >= 75) return "bg-green-600"; // Ready - 75-100% (#219654)
                    if (score >= 60) return "bg-yellow-400"; // Partially Ready - 60-74% (#f4dc2c)
                    return "bg-red-500"; // Not Ready - 0-59%
                  };

                  return (
                    <div
                      key={index}
                      className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-black/10 dark:border-gray-700"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {item.label}
                        </span>
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          {item.score}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`${getScoreColor(
                            item.score,
                          )} h-2 rounded-full transition-all duration-500`}
                          style={{ width: `${item.score}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Analysis Panel */}
            <div className="bg-white dark:bg-boxdark rounded-2xl shadow-xl border border-black/10 dark:border-strokedark overflow-hidden">
              <Suspense
                fallback={
                  <div className="h-64 bg-gray-100 animate-pulse rounded-xl" />
                }
              >
                <AIAnalysisPanel
                  reportData={cratData.reportData}
                  scoreData={cratData.scoreData}
                  businessInfo={cratData.businessInfo}
                  userDetails={userDetails}
                  isAdminEvaluation={true}
                  targetEntrepreneur={{
                    name: business?.User?.name,
                    business: business?.name,
                    uuid: business?.User?.uuid,
                  }}
                />
              </Suspense>
            </div>
          </div>
        )}

        {/* CRAT documents are now viewed on a dedicated page: /businessDetails/:uuid/crat-documents */}
      </div>
    )
  );
};

export default Page;
