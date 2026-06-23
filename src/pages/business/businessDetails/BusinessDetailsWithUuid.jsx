"use client";

import { getBusiness, updateBusiness } from "@/controllers/business_controller";
import { useContext, useEffect, useState, lazy, Suspense } from "react";
import { useRouter } from "@/utils/navigation";
import { useParams } from "react-router-dom";
import Link from "@/utils/link";
import Loader from "@/components/common/Loader";
import { toast } from "react-hot-toast";
import { createConversation } from "@/controllers/conversation_controller";
import { createNotification } from "@/controllers/notification_controller";
import { assignEntreprenuerToMentor } from "@/controllers/mentorEntreprenuerController";
import { assignEntreprenuerToStaff } from "@/controllers/staffEntreprenuerController";
import Spinner from "@/components/spinner";
import { updateUser, getReviewers } from "@/controllers/user_controller";
import { getScoreData } from "@/controllers/crat_general_controller";
import { FaFilePdf, FaUserTie } from "react-icons/fa";
import { useTranslation } from "@/locales";
import { UserContext } from "../../../layouts/DashboardLayout";
import { generateCapitalReadinessPDF } from "../../../services/capitalReadinessPDF";

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
  const { userDetails } = useContext(UserContext);
  const router = useRouter();

  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [approving, setApproving] = useState(false);
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [loadingCRAT, setLoadingCRAT] = useState(false);
  const [cratData, setCratData] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [cratDocs, setCratDocs] = useState([]);

  const [showBdaModal, setShowBdaModal] = useState(false);
  const [bdaList, setBdaList] = useState([]);
  const [selectedBdaUuid, setSelectedBdaUuid] = useState("");
  const [assigningBda, setAssigningBda] = useState(false);

  const openBdaModal = () => {
    setSelectedBdaUuid("");
    setShowBdaModal(true);
    // Staff-role users are the Business Development Advisors (BDAs).
    // "Staff" is displayed for users stored with role "Reviewer".
    getReviewers(1000, 1).then((body) => {
      const all = Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : [];
      const staffOnly = all.filter((user) => ["Staff", "Reviewer"].includes(user.role));
      setBdaList(staffOnly.length ? staffOnly : all);
    });
  };

  const onAssignToBda = async () => {
    if (!selectedBdaUuid) {
      toast.error("Select a Business Development Advisor");
      return;
    }
    setAssigningBda(true);
    try {
      await assignEntreprenuerToStaff({
        staff_uuid: selectedBdaUuid,
        entreprenuer_uuid: business?.User?.uuid,
      });
      toast.success("Entrepreneur assigned to BDA");
      setShowBdaModal(false);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to assign entrepreneur",
      );
    } finally {
      setAssigningBda(false);
    }
  };

  const toReadinessStatus = (percentage) => {
    if (percentage >= 75) return "Ready";
    if (percentage >= 60) return "Partially Ready";
    return "Not Ready";
  };

  const toSafeOverallPercent = (value, fallback = 0) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return Math.round(Number(fallback) || 0);
    }

    return Math.max(0, Math.min(100, Math.round(parsed)));
  };

  const normalizeScoreData = (rawData) => {
    if (!rawData || typeof rawData !== "object") return null;

    const looksLikeScoreData =
      typeof rawData?.commercial?.percentage === "number" &&
      typeof rawData?.financial?.percentage === "number" &&
      typeof rawData?.operations?.percentage === "number" &&
      typeof rawData?.legal?.percentage === "number";

    if (looksLikeScoreData) {
      const fallbackOverall = Math.round(
        (rawData.commercial.percentage +
          rawData.financial.percentage +
          rawData.operations.percentage +
          rawData.legal.percentage) /
          4,
      );

      return {
        ...rawData,
        overall_percent: toSafeOverallPercent(
          rawData?.overall_percent,
          fallbackOverall,
        ),
      };
    }

    if (rawData?.scoreData && typeof rawData.scoreData === "object") {
      const nested = rawData.scoreData;

      if (
        typeof nested?.commercial?.percentage === "number" &&
        typeof nested?.financial?.percentage === "number" &&
        typeof nested?.operations?.percentage === "number" &&
        typeof nested?.legal?.percentage === "number"
      ) {
        const fallbackOverall = Math.round(
          (nested.commercial.percentage +
            nested.financial.percentage +
            nested.operations.percentage +
            nested.legal.percentage) /
            4,
        );

        return {
          ...nested,
          overall_percent: toSafeOverallPercent(
            nested?.overall_percent,
            fallbackOverall,
          ),
        };
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
    const fallbackOverall = Math.round(
      (commercial + financial + operations + legal) / 4,
    );

    const overall = toSafeOverallPercent(
      rawData?.overallPercent,
      fallbackOverall,
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
      overall_percent: overall,
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
    } catch (error) {
      console.error("Error fetching business:", error);
      toast.error(
        t("business.errors.loadFailed", "Failed to load business details"),
      );
    } finally {
      setLoading(false);
    }
  };

  const buildDefaultScoreData = () => ({
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
    overall_percent: 0,
    general_status: t("ai.generalStatus.noAssessment", "No CRAT Assessment"),
  });

  const buildReportData = (scoreData) => ({
    commercial: {
      responses: [
        `${t("business.labels.businessDescription", "Business Description")}: ${
          business.description ||
          t(
            "business.placeholders.overviewMissing",
            "Comprehensive business overview needed",
          )
        }`,
        `${t("business.labels.targetMarket", "Target Market")}: ${
          business.market ||
          t("business.placeholders.marketMissing", "Market analysis required")
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
          t("business.placeholders.impactMissing", "Impact assessment required")
        }`,
        `${t("business.labels.currentTraction", "Current Traction")}: ${
          business.traction ||
          t("business.placeholders.tractionMissing", "Traction metrics needed")
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
          t("business.placeholders.stageMissing", "Stage classification needed")
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
            ? t("business.seekingInvestmentYes", "Actively seeking investment")
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
          t("business.placeholders.locationMissing", "Location not specified")
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
        `${t("business.labels.industryCompliance", "Industry Compliance")}: ${
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
  });

  const buildBusinessInfo = () => ({
    name: business.name || t("business.labels.businessName", "Business Name"),
    sector:
      business.BusinessSector?.name ||
      t("business.labels.sector", "Technology"),
    location: business.location || t("business.labels.location", "Tanzania"),
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
  });

  const loadCRATForAI = async () => {
    if (!business) {
      toast.error(
        t("business.errors.dataNotLoaded", "Business data not loaded yet"),
      );
      return;
    }

    try {
      setLoadingCRAT(true);
      setCratData(null);
      setShowAIAnalysis(false);

      toast.loading(t("ai.preparing", "Preparing AI analysis..."), {
        id: "ai-loading",
      });

      let scoreData = buildDefaultScoreData();

      try {
        const actualCRATData = await getScoreData({
          uuid: business.User?.uuid,
        });
        const normalizedCRATScoreData = normalizeScoreData(actualCRATData);

        if (normalizedCRATScoreData) {
          scoreData = normalizedCRATScoreData;

          toast.success(t("ai.cratLoaded", "CRAT assessment data loaded"), {
            id: "ai-loading",
          });
        } else {
          toast.success(
            t("ai.profilePrepared", "Business profile analysis prepared"),
            { id: "ai-loading" },
          );
        }
      } catch (cratError) {
        console.log("No CRAT assessment found:", cratError?.message);

        toast.success(
          t("ai.profilePrepared", "Business profile analysis prepared"),
          { id: "ai-loading" },
        );
      }

      setCratData({
        scoreData,
        reportData: buildReportData(scoreData),
        businessInfo: buildBusinessInfo(),
      });

      setShowAIAnalysis(true);

      const avgScore = toSafeOverallPercent(
        scoreData?.overall_percent,
        (scoreData.commercial.percentage +
          scoreData.financial.percentage +
          scoreData.operations.percentage +
          scoreData.legal.percentage) /
          4,
      );

      toast.success(
        `${t("ai.analysisComplete", "AI analysis complete!")} ${avgScore}%`,
        {
          id: "ai-loading",
          duration: 4000,
        },
      );

      setTimeout(() => {
        document.getElementById("ai-analysis-section")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 500);
    } catch (error) {
      console.error("Error preparing AI analysis:", error);

      toast.error(
        t(
          "ai.errors.prepareFailed",
          "Failed to prepare AI analysis. Please try again.",
        ),
        { id: "ai-loading" },
      );
    } finally {
      setLoadingCRAT(false);
    }
  };

  const handleDownloadAIReport = async () => {
    if (pdfLoading || !business) return;

    let toastId;

    try {
      setPdfLoading(true);

      toastId = toast.loading(
        t("report.generatingPdf", "Generating AI report — please wait..."),
      );

      let scoreDataForPdf = cratData?.scoreData;
      let reportPayloadForPdf = null;

      if (!scoreDataForPdf) {
        try {
          const actualCRATData = await getScoreData({
            uuid: business.User?.uuid,
          });
          reportPayloadForPdf = actualCRATData;

          const normalizedCRATScoreData = normalizeScoreData(actualCRATData);

          if (normalizedCRATScoreData) {
            scoreDataForPdf = normalizedCRATScoreData;
          }
        } catch (err) {
          console.log("No CRAT assessment found for PDF:", err);
        }

        if (!scoreDataForPdf) {
          scoreDataForPdf = buildDefaultScoreData();
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
      console.error("Error generating AI PDF:", error);

      toast.error(
        `${t("ai.failedToDownloadPDF", "Failed to generate AI PDF")}: ${
          error?.message || "Unknown error"
        }`,
        { id: toastId },
      );
    } finally {
      setPdfLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, [uuid]);

  useEffect(() => {
    if (!business?.User) return;

    const docs = [];

    const collect = (arr, type) => {
      if (!Array.isArray(arr)) return;

      arr.forEach((item) => {
        if (item?.attachment) {
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

  if (loading) return <Loader />;

  if (!business) return null;
  const businessProfileImage =
    business?.User?.image || business?.image || "/images/default-avatar.png";

  const heroCards = [
    {
      label: t("business.customers", "Customers"),
      value: business?.numberOfCustomers || t("common.notProvided", "N/A"),
    },
    {
      label: t("business.location", "Location"),
      value: business?.location || t("common.notProvided", "N/A"),
    },
    {
      label: t("business.industry", "Industry"),
      value:
        (isSwahili
          ? business?.BusinessSector?.swName
          : business?.BusinessSector?.name) || t("common.notProvided", "N/A"),
    },
    {
      label: t("business.stage", "Stage"),
      value: business?.stage || t("common.notProvided", "N/A"),
    },
    {
      label: t("business.revenue", "Revenue"),
      value: business?.revenue || t("common.notProvided", "N/A"),
    },
  ];

  return (
    <div>
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-black shadow-xl">
        <img
          src="/images/investment_readiness_classes.svg"
          alt={business?.name || "Business"}
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/65 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

        <div className="relative z-10 flex min-h-[280px] items-end">
          <div className="w-full p-6 sm:p-8 lg:p-12">
            <div className="max-w-4xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-orange-500"></span>
                Business Profile
              </div>
              <h1 className="mb-5 max-w-4xl text-3xl font-bold leading-tight tracking-tight text-white drop-shadow-2xl md:text-4xl">
                {business?.name ||
                  t("business.labels.businessName", "Business Name")}
              </h1>

              <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {heroCards.map((card, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-white/10 bg-white/10 p-5 text-white backdrop-blur-md"
                  >
                    <p className="text-sm font-medium text-white/70">
                      {card.label}
                    </p>

                    <p className="mt-2 line-clamp-2 text-lg font-bold leading-snug">
                      {card.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <div className="rounded-2xl bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-md dark:bg-boxdark">
            <h2 className="mb-6 flex items-center text-2xl font-bold capitalize text-gray-900 dark:text-white">
              <span className="mr-3 text-3xl">ℹ️</span>
              {t("business.overview", "Business Overview")}
            </h2>

            <div className="space-y-8">
              <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-300">
                {business?.description ||
                  t(
                    "business.placeholders.descriptionMissing",
                    "Description not available",
                  )}
              </p>

              <div>
                <h3 className="mb-3 text-xl font-semibold text-gray-800 dark:text-gray-200">
                  {t("business.problem", "Problem")}
                </h3>

                <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-300">
                  {business?.problem ||
                    t(
                      "business.placeholders.problemDescriptionMissing",
                      "No problem description available",
                    )}
                </p>
              </div>

              <div>
                <h3 className="mb-3 text-xl font-semibold text-gray-800 dark:text-gray-200">
                  {t("business.solution", "Solution")}
                </h3>

                <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-300">
                  {business?.solution ||
                    t(
                      "business.placeholders.solutionDescriptionMissing",
                      "No solution description available",
                    )}
                </p>
              </div>

              <div>
                <h3 className="mb-3 text-xl font-semibold text-gray-800 dark:text-gray-200">
                  {t("business.traction", "Traction")}
                </h3>

                <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-300">
                  {business?.traction ||
                    t(
                      "business.placeholders.tractionInfoMissing",
                      "No traction information available",
                    )}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-md dark:bg-boxdark">
            <h2 className="mb-6 flex items-center text-2xl font-bold text-gray-900 dark:text-white">
              <span className="mr-3 text-3xl">🎯</span>
              {t("business.marketPotential", "Market Potential")}
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="mb-3 text-xl font-semibold text-gray-800 dark:text-gray-200">
                  {t("business.targetMarket", "Target Market")}
                </h3>

                <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-300">
                  {business?.market ||
                    t(
                      "business.placeholders.targetMarketMissing",
                      "No target market description available",
                    )}
                </p>
              </div>

              <div>
                <h3 className="mb-3 text-xl font-semibold text-gray-800 dark:text-gray-200">
                  {t("business.currentImpact", "Current Impact")}
                </h3>

                <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-300">
                  {business?.impact ||
                    t(
                      "business.placeholders.impactDescriptionMissing",
                      "No impact description available",
                    )}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-md dark:bg-boxdark">
            <h2 className="mb-6 flex items-center text-2xl font-bold text-gray-900 dark:text-white">
              <span className="mr-3 text-3xl">📈</span>
              {t("business.growthAndFunding", "Growth & Funding")}
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="mb-3 text-xl font-semibold text-gray-800 dark:text-gray-200">
                  {t("business.growthPlans", "Growth Plans")}
                </h3>

                <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-300">
                  {business?.growthPlan ||
                    t(
                      "business.placeholders.growthPlansMissing",
                      "No growth plans available",
                    )}
                </p>
              </div>

              <div>
                <h3 className="mb-3 text-xl font-semibold text-gray-800 dark:text-gray-200">
                  {t("business.fundraisingNeeds", "Fundraising Needs")}
                </h3>

                <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-300">
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
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
              <div className="xl:col-span-7">
                <Suspense
                  fallback={
                    <div className="h-48 animate-pulse rounded-xl bg-gray-100" />
                  }
                >
                  <BusinessDomainScores
                    userDetails={business?.User}
                    initialScoreData={{}}
                  />
                </Suspense>
              </div>

              <div className="xl:col-span-5">
                <Suspense
                  fallback={
                    <div className="h-48 animate-pulse rounded-xl bg-gray-100" />
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

          {business.companyProfile && userDetails.role !== "Investor" && (
            <div className="rounded-2xl bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-md dark:bg-boxdark">
              <h2 className="mb-8 flex items-center text-2xl font-bold text-gray-900 dark:text-white">
                <span className="mr-3 text-3xl">📑</span>
                {t("business.documents", "Documents")}
              </h2>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                {[
                  {
                    title: t("business.companyProfileDoc", "Company Profile"),
                    url: business.companyProfile,
                    icon: <FaFilePdf className="text-red-600" />,
                  },
                  ...(business.businessPlan
                    ? [
                        {
                          title: t("business.businessPlanDoc", "Business Plan"),
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
                    className="group flex flex-col items-center rounded-xl bg-gray-50 p-6 transition-all duration-300 hover:shadow-lg dark:bg-boxdark-2"
                  >
                    <span className="mb-4 text-4xl text-red-600 transition-transform duration-300 group-hover:scale-110">
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

          {userDetails.role === "Admin" && business.status === "waiting" && (
            <button
              onClick={() => {
                setApproving(true);

                updateBusiness({ status: "accepted" }, business.uuid).then(
                  () => {
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
              className="inline-flex w-64 items-center justify-center rounded-xl bg-[#082d77] px-6 py-4 text-lg font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#082d77] hover:shadow-md"
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

        <div className="space-y-8">
          <div className="sticky top-8 rounded-2xl bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-md dark:bg-boxdark">
            <h2 className="mb-6 flex items-center text-2xl font-bold text-gray-900 dark:text-white">
              <span className="mr-3 text-3xl">ℹ️</span>
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
                  label: t("business.seekingInvestment", "Seeking Investment"),
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
                  className="flex items-center space-x-4 rounded-xl bg-gray-50 p-4 transition-colors duration-200 hover:bg-gray-100 dark:bg-boxdark-2 dark:hover:bg-boxdark-3"
                >
                  <span className="text-2xl">{item.icon}</span>

                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {item.label}
                    </p>

                    {item.label === t("common.email", "Email") && item.value ? (
                      <a
                        href={`mailto:${item.value}`}
                        className="break-all font-semibold text-blue-600 transition-colors duration-200 hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        {item.value}
                      </a>
                    ) : item.label === t("common.phone", "Phone") &&
                      item.value ? (
                      <a
                        href={`tel:${item.value}`}
                        className="font-semibold text-green-600 transition-colors duration-200 hover:text-green-800 hover:underline dark:text-green-400 dark:hover:text-green-300"
                      >
                        {item.value}
                      </a>
                    ) : item.label === t("business.website", "Website") &&
                      item.value ? (
                      <a
                        href={item.value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all font-semibold text-primary hover:underline"
                      >
                        {item.value}
                      </a>
                    ) : item.label ===
                        t("business.instagramLink", "Instagram Link") &&
                      item.value ? (
                      <a
                        href={item.value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all font-semibold text-primary hover:underline"
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

            {(business.facebook ||
              business.instagram ||
              business.linkedin ||
              business.twitter ||
              business.websiteLink ||
              business.instagramLink) && (
              <div className="mt-6">
                <h3 className="mb-3 text-lg font-semibold text-gray-800 dark:text-gray-200">
                  {t("business.socialMedia", "Social Media")}
                </h3>

                <div className="flex flex-wrap gap-4">
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

                  {business.websiteLink && (
                    <a
                      href={business.websiteLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-primary hover:underline"
                    >
                      {t("business.visitWebsite", "Visit Website")}
                    </a>
                  )}

                  {business.instagramLink && (
                    <a
                      href={business.instagramLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-primary hover:underline"
                    >
                      {t("business.instagramLink", "Instagram Link")}
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

            <div className="mt-4 flex flex-col gap-4">
              {["Admin", "Staff"].includes(userDetails.role) && (
                <button
                  onClick={handleDownloadAIReport}
                  disabled={pdfLoading}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-200 hover:from-blue-600 hover:to-cyan-600 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {pdfLoading ? (
                    t("report.generatingPdf", "Generating AI Report...")
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
                className="inline-flex w-full items-center justify-center rounded-xl bg-green-500 px-6 py-4 text-lg font-semibold text-white shadow-sm transition-all duration-200 hover:bg-green-600 hover:shadow-md"
              >
                <span className="mr-2 text-xl">💬</span>
                {t("common.message", "Message")}
              </button>

              {userDetails.role === "Investor" && (
                <Link
                  href={`/dashboard/investmentApplication/${uuid}`}
                  className="inline-flex items-center justify-center rounded-xl bg-[#082d77] px-6 py-4 text-lg font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#082d77] hover:shadow-md"
                >
                  <span className="mr-2 text-xl">💰</span>
                  {t("investment.expressInterest", "Express Interest")}
                </Link>
              )}

              {userDetails.role === "Finance" && (
                <button
                  onClick={openBdaModal}
                  className="inline-flex items-center justify-center rounded-xl bg-[#082d77] px-6 py-4 text-lg font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#061f54] hover:shadow-md"
                >
                  <FaUserTie className="mr-2 text-xl" />
                  Assign to BDA
                </button>
              )}

              {userDetails.role === "Mentor" && !business.linkedWithMentor && (
                <button
                  onClick={() => {
                    setRequesting(true);

                    const payload = {
                      mentor_uuid: userDetails.uuid,
                      entreprenuer_uuid: business.User.uuid,
                    };

                    assignEntreprenuerToMentor(payload).then(() => {
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
                  className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-4 text-lg font-semibold text-white shadow-sm transition-all duration-200 hover:bg-primary/90 hover:shadow-md disabled:opacity-50"
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
        </div>
      </div>

      {userDetails.role === "Admin" && showAIAnalysis && cratData && (
        <div id="ai-analysis-section" className="mt-12">
          <div className="mb-8 rounded-2xl border-2 border-purple-200 bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 p-8 shadow-xl dark:border-purple-700 dark:from-purple-900/20 dark:via-indigo-900/20 dark:to-blue-900/20">
            <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {t("ai.headerTitle", "AI-Powered Investment Analysis")}
                </h2>

                <p className="mt-2 text-lg text-purple-600 dark:text-purple-400">
                  {t("ai.headerSubtitle", "Comprehensive evaluation of")}{" "}
                  <span className="font-semibold">{business?.name}</span>
                </p>
              </div>

              <div className="rounded-full bg-gradient-to-r from-green-500 to-emerald-500 px-5 py-3 text-sm font-bold text-white shadow-md">
                {t("ai.overallScore", "Overall Score:")}{" "}
                {toSafeOverallPercent(
                  cratData?.scoreData?.overall_percent,
                  (cratData.scoreData.commercial.percentage +
                    cratData.scoreData.financial.percentage +
                    cratData.scoreData.operations.percentage +
                    cratData.scoreData.legal.percentage) /
                    4,
                )}
                %
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-xl dark:border-strokedark dark:bg-boxdark">
            <Suspense
              fallback={
                <div className="h-64 animate-pulse rounded-xl bg-gray-100" />
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

      {showBdaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl shadow-slate-950/20">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h3 className="text-xl font-black text-slate-950">Assign to BDA</h3>
                <p className="mt-1 text-sm text-slate-500">{business?.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowBdaModal(false)}
                className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <label className="mb-1.5 block text-xs font-bold tracking-wide text-slate-500">
                Business Development Advisor
              </label>
              <select
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#082d77] focus:ring-4 focus:ring-[#082d77]/20"
                value={selectedBdaUuid}
                onChange={(e) => setSelectedBdaUuid(e.target.value)}
              >
                <option value="">Select Business Development Advisor</option>
                {bdaList.map((staff) => (
                  <option key={staff.uuid} value={staff.uuid}>
                    {staff.name || staff.email || "Unnamed advisor"}
                  </option>
                ))}
              </select>
              {bdaList.length === 0 && (
                <p className="mt-2 text-xs text-slate-500">
                  No Business Development Advisors found.
                </p>
              )}
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-5">
              <button
                type="button"
                onClick={() => setShowBdaModal(false)}
                disabled={assigningBda}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onAssignToBda}
                disabled={assigningBda}
                className="rounded-xl bg-[#082d77] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#061f54] disabled:opacity-60"
              >
                {assigningBda ? "Assigning..." : "Assign"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Page;
