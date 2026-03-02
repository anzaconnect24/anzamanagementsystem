"use client";
import React, { useState, useEffect } from "react";
import {
  analyzeCompleteReport,
  analyzeDomain,
  generateExecutiveSummary,
  testOpenAIConnection,
} from "../../services/openAi";
import { generateAIReport } from "../../services/aiReportService";
import {
  generateCapitalReadinessPDF,
  generateCapitalReadinessContent,
} from "../../services/capitalReadinessPDF";
import toast from "react-hot-toast";
import { useTranslation } from "../../locales";

const AIAnalysisPanel = ({
  reportData,
  scoreData,
  businessInfo,
  userDetails,
  isAdminEvaluation = false,
  targetEntrepreneur = null,
}) => {
  const { t } = useTranslation();
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("executive");
  const [domainAnalysis, setDomainAnalysis] = useState({});
  const [analysisType, setAnalysisType] = useState("complete"); // complete, executive, domain
  const [savedReport, setSavedReport] = useState(null);
  const [expandedDomains, setExpandedDomains] = useState({});
  const [pdfLoading, setPdfLoading] = useState(false);
  const [formalReport, setFormalReport] = useState(null);

  // Toggle domain expansion
  const toggleDomainExpansion = (domain) => {
    setExpandedDomains((prev) => ({
      ...prev,
      [domain]: !prev[domain],
    }));
  };

  // Check if AI analysis should be available (ADMIN ONLY for entrepreneur evaluation)
  const canAccessAI = () => {
    console.log("🔍 Checking AI access for user:", userDetails);
    console.log("👤 User role:", userDetails?.role);
    console.log("🎯 Is admin evaluation:", isAdminEvaluation);
    console.log("👤 Target entrepreneur:", targetEntrepreneur?.name);

    if (!userDetails?.role) {
      console.log("❌ No user role found");
      return false;
    }

    // STRICT ADMIN-ONLY ACCESS
    const isAdmin = userDetails.role === "Admin";

    if (!isAdmin) {
      console.log("❌ AI access denied: User is not an Admin");
      return false;
    }

    console.log("✅ AI access granted to Admin");
    return true;
  };

  const hasAIAccess = canAccessAI();

  useEffect(() => {
    // Auto-generate complete analysis for admins only
    if (
      hasAIAccess &&
      scoreData &&
      Object.keys(scoreData).length > 0 &&
      !aiAnalysis
    ) {
      generateCompleteAnalysisAuto();
    }
  }, [scoreData, hasAIAccess]);

  const generateCompleteAnalysisAuto = async () => {
    if (!reportData || !scoreData) {
      toast.error(
        t(
          "ai.reportDataNotAvailable",
          "Report data not available for analysis",
        ),
      );
      return;
    }

    try {
      setLoading(true);
      setAnalysisType("complete");

      console.log("🤖 Starting complete analysis generation...");
      console.log("📊 Input data validation:", {
        hasReportData: !!reportData,
        hasScoreData: !!scoreData,
        hasBusinessInfo: !!businessInfo,
        hasUserDetails: !!userDetails,
        reportDataKeys: reportData ? Object.keys(reportData) : [],
        scoreDataKeys: scoreData ? Object.keys(scoreData) : [],
        windowAvailable: typeof window !== "undefined",
      });

      // Generate and save complete report plus formal PDF-style content
      console.log("✅ Connection check skipped, generating report directly...");

      const pdfUserContext = {
        Business: {
          businessName: businessInfo?.name,
          name: businessInfo?.name,
          sector: businessInfo?.sector,
          businessSector: businessInfo?.sector,
          location: businessInfo?.location,
          businessLocation: businessInfo?.location,
        },
      };

      const [completeReport, formal] = await Promise.all([
        generateAIReport(reportData, scoreData, businessInfo, userDetails),
        generateCapitalReadinessContent(
          reportData,
          scoreData,
          pdfUserContext,
          // Avoid spamming toasts here; log to console instead
          (msg) => console.log("[FormalReportStatus]", msg),
        ),
      ]);

      console.log("✅ Complete report generated:", completeReport);
      setAiAnalysis(completeReport.aiAnalysis);
      setSavedReport(completeReport);
      setFormalReport(formal?.content || null);

      toast.success(
        t(
          "ai.completeAnalysisGenerated",
          "Complete AI analysis generated successfully!",
        ),
      );
    } catch (error) {
      console.error("❌ Error generating complete analysis:", error);
      console.error("❌ Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
        constructor: error.constructor.name,
      });

      if (
        error.message.includes("not properly initialized") ||
        error.message.includes("API key")
      ) {
        toast.error(
          t(
            "ai.apiKeyNotConfigured",
            "❌ API key not configured. Please add your API key and restart the server.",
          ),
          {
            duration: 8000,
          },
        );
      } else {
        toast.error(
          t(
            "ai.failedToGenerateAISummary",
            `Failed to generate AI analysis: ${error.message}`,
          ),
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (pdfLoading) return;

    if (!savedReport) {
      toast.error(
        t(
          "ai.noSavedReportAvailable",
          "No saved report available for download",
        ),
      );
      return;
    }

    try {
      if (!reportData || !scoreData || !businessInfo) {
        toast.error(
          t(
            "ai.missingDataForPdf",
            "Missing assessment data for PDF generation",
          ),
        );
        return;
      }

      setPdfLoading(true);

      const toastId = toast.loading(
        t("report.generatingPdf", "Generating AI report — please wait..."),
      );

      const pdfUserContext = {
        Business: {
          businessName: businessInfo?.name,
          name: businessInfo?.name,
          sector: businessInfo?.sector,
          businessSector: businessInfo?.sector,
          location: businessInfo?.location,
          businessLocation: businessInfo?.location,
        },
      };

      const { filename } = await generateCapitalReadinessPDF(
        reportData,
        scoreData,
        pdfUserContext,
        (msg) => {
          toast.loading(msg, { id: toastId });
        },
      );

      toast.success(
        t("report.pdfReady", "Report downloaded successfully!", {
          fileName: filename,
        }),
        { id: toastId },
      );
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error(
        t(
          "ai.failedToDownloadPDF",
          "Failed to download PDF. Please try again.",
        ),
      );
    } finally {
      setPdfLoading(false);
    }
  };

  const testAPIConnection = async () => {
    try {
      setLoading(true);
      const result = await testOpenAIConnection();

      if (result.success) {
        toast.success(
          t(
            "ai.openAIConnectionSuccessful",
            "✅ OpenAI connection successful!",
          ),
        );
        console.log("Connection test result:", result.message);
      } else {
        toast.error(
          t("ai.connectionFailed", "❌ Connection failed: {{error}}", {
            error: result.error,
          }),
        );
        console.error("API Connection Error:", result.error);

        // Show specific instructions for API key issues
        if (
          result.error.includes("API key") ||
          result.error.includes("not configured")
        ) {
          toast.error(
            t("ai.configureAPIKey", "Please configure your OpenAI API key"),
            {
              duration: 6000,
            },
          );
        }
      }
    } catch (error) {
      toast.error(
        t("ai.connectionTestFailed", "❌ Connection test failed: {{message}}", {
          message: error.message,
        }),
      );
      console.error("Connection test error:", error);

      // Show helpful error message for API key issues
      if (error.message.includes("not properly initialized")) {
        toast.error(
          t(
            "ai.apiKeyNotConfiguredRestart",
            "API key not configured. Check .env.local file and restart server.",
          ),
          {
            duration: 6000,
          },
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const generateDomainAnalysis = async (domain) => {
    if (!reportData?.[domain] || !scoreData?.[domain]) {
      toast.error(`${domain} data not available for analysis`);
      return;
    }

    try {
      setLoading(true);

      const analysis = await analyzeDomain(
        domain,
        reportData[domain],
        scoreData[domain],
      );
      setDomainAnalysis((prev) => ({ ...prev, [domain]: analysis }));
      toast.success(`${domain} domain analysis generated!`);
    } catch (error) {
      console.error(`Error generating ${domain} analysis:`, error);
      toast.error(`Failed to generate ${domain} analysis`);
    } finally {
      setLoading(false);
    }
  };

  if (!hasAIAccess) {
    return (
      <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="mb-3">
              <svg
                className="w-12 h-12 text-red-400 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
              🔒 Admin Access Required
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              AI Analysis for CRAT evaluation is restricted to Administrators
              only.
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              {isAdminEvaluation
                ? `Evaluating: ${targetEntrepreneur?.name || "Entrepreneur"}`
                : "This feature helps admins evaluate entrepreneur readiness."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      {/* Header */}
      <div className="border-b border-stroke py-4 px-6 dark:border-strokedark">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-black dark:text-white">
              🤖 {t("ai.aiAnalysisInsights", "AI Analysis & Insights")}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t(
                "ai.poweredByGemini",
                "Powered by OpenAI - Expert analysis of your CRAT assessment",
              )}
            </p>
          </div>

          <div className="flex gap-2">
            {savedReport && (
              <>
                <button
                  onClick={handleDownloadPDF}
                  disabled={pdfLoading}
                  className="inline-flex items-center px-3 py-2 bg-success text-white rounded-md hover:bg-success/80 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  title={t("ai.downloadPDFReport", "Download PDF Report")}
                >
                  {pdfLoading ? (
                    <>
                      <svg
                        className="w-4 h-4 mr-2 animate-spin"
                        fill="none"
                        stroke="currentColor"
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
                      {t("report.generatingPdf", "Generating PDF...")}
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      {t("common.pdf", "PDF")}
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-stroke dark:border-strokedark">
        <nav className="flex space-x-4 px-6 overflow-x-auto" aria-label="Tabs">
          {[
            {
              id: "executive",
              name: t("ai.executiveSummary", "Executive Summary"),
              icon: "📊",
            },
            {
              id: "recommendations",
              name: t("ai.recommendations", "Recommendations"),
              icon: "💡",
            },
            {
              id: "domains",
              name: t("ai.domainAnalysis", "Domain Analysis"),
              icon: "🔍",
            },
            {
              id: "risks",
              name: t("ai.riskAssessment", "Risk Assessment"),
              icon: "⚠️",
            },
            {
              id: "growth",
              name: t("ai.growthPotential", "Growth Potential"),
              icon: "📈",
            },
            {
              id: "investment",
              name: t("ai.investmentDecision", "Investment Decision"),
              icon: "💰",
            },
            {
              id: "scenarios",
              name: t("ai.scenarioAnalysis", "Scenario Analysis"),
              icon: "🎯",
            },
            {
              id: "formalReport",
              name: t("ai.formalReport", "Formal Report"),
              icon: "📄",
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-black/20"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <svg
                className="animate-spin h-8 w-8 text-primary mx-auto mb-4"
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
              <p className="text-gray-600 dark:text-gray-400">
                {t("ai.aiAnalyzingReport", "AI is analyzing your report...")}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {t("ai.mayTakeFewMoments", "This may take a few moments")}
              </p>
            </div>
          </div>
        )}

        {/* Executive Summary Tab */}
        {activeTab === "executive" && !loading && (
          <div className="space-y-8">
            {aiAnalysis?.executiveSummary ||
            aiAnalysis?.rawAnalysis ||
            (aiAnalysis?.predictions && Object.keys(aiAnalysis).length > 1) ? (
              <div className="space-y-6">
                {/* Professional Header */}
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-8 rounded-xl shadow-2xl">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">
                        {t(
                          "ai.executiveInvestmentBriefing",
                          "Executive Investment Briefing",
                        )}
                      </h2>
                      <p className="text-slate-300">
                        {t(
                          "ai.capitalReadinessAssessment",
                          "Capital Readiness Assessment & Strategic Analysis",
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    {[
                      {
                        domain: "commercial",
                        label: t("ai.domains.commercial", "Commercial"),
                        score: Math.round(
                          scoreData?.commercial?.percentage || 0,
                        ),
                      },
                      {
                        domain: "financial",
                        label: t("ai.domains.financial", "Financial"),
                        score: Math.round(
                          scoreData?.financial?.percentage || 0,
                        ),
                      },
                      {
                        domain: "operations",
                        label: t("ai.domains.operations", "Operations"),
                        score: Math.round(
                          scoreData?.operations?.percentage || 0,
                        ),
                      },
                      {
                        domain: "legal",
                        label: t("ai.domains.legal", "Legal"),
                        score: Math.round(scoreData?.legal?.percentage || 0),
                      },
                    ].map((item, index) => {
                      // Dynamic color based on CRAT readiness levels
                      const getScoreColor = (score) => {
                        if (score >= 75) return "text-green-400"; // Ready - 75-100% (closer to #219654)
                        if (score >= 60) return "text-yellow-300"; // Partially Ready - 60-74% (#f4dc2c)
                        return "text-red-300"; // Not Ready - 0-59%
                      };

                      return (
                        <div
                          key={index}
                          className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center"
                        >
                          <div
                            className={`text-2xl font-bold ${getScoreColor(
                              item.score,
                            )}`}
                          >
                            {item.score}%
                          </div>
                          <div className="text-xs text-slate-300">
                            {item.label}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Analysis Content */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-black/10 dark:border-gray-700 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      {t(
                        "ai.aiPoweredInvestmentAnalysis",
                        "AI-Powered Investment Analysis",
                      )}
                    </h3>
                    <p className="text-blue-100 text-sm mt-1">
                      {t(
                        "ai.generatedByAdvancedAI",
                        "Generated by advanced AI with African market expertise",
                      )}
                    </p>
                  </div>

                  <div className="p-8">
                    <div className="prose prose-lg dark:prose-invert max-w-none">
                      <div className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap font-serif text-lg">
                        {(() => {
                          // Check different possible locations for executive summary
                          const summary =
                            aiAnalysis?.executiveSummary ||
                            aiAnalysis?.analysis?.executiveSummary ||
                            aiAnalysis?.rawAnalysis;

                          console.log("📝 Executive Summary Debug:", {
                            hasAiAnalysis: !!aiAnalysis,
                            aiAnalysisKeys: aiAnalysis
                              ? Object.keys(aiAnalysis)
                              : [],
                            executiveSummary: aiAnalysis?.executiveSummary,
                            rawAnalysis: aiAnalysis?.rawAnalysis
                              ? aiAnalysis.rawAnalysis.substring(0, 100) + "..."
                              : null,
                          });

                          return (
                            summary ||
                            "Executive summary is being generated. Please check other tabs for detailed analysis."
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="mb-8">
                  <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-12 h-12 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                    {t("ai.aiInvestmentAnalysis", "AI Investment Analysis")}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
                    {t(
                      "ai.generateProfessionalBriefing",
                      "Generating professional executive briefing powered by advanced AI analysis...",
                    )}
                  </p>
                </div>
                {loading && (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Formal Report Tab - uses same content as the PDF */}
        {activeTab === "formalReport" && !loading && (
          <div className="space-y-8">
            {!formalReport ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">
                  {t(
                    "ai.formalReportGenerating",
                    "Generate AI analysis to view the formal capital readiness report.",
                  )}
                </p>
              </div>
            ) : (
              <>
                {/* Executive Summary */}
                <section className="bg-white dark:bg-gray-900 rounded-xl shadow border border-black/10 dark:border-gray-700 p-6">
                  <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white flex items-center gap-2">
                    <span>📊</span>
                    {t("ai.executiveSummary", "Executive Summary")}
                  </h3>
                  <p className="whitespace-pre-line text-gray-700 dark:text-gray-300 leading-relaxed">
                    {formalReport.executiveSummary}
                  </p>
                </section>

                {/* Background */}
                <section className="bg-white dark:bg-gray-900 rounded-xl shadow border border-black/10 dark:border-gray-700 p-6">
                  <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white flex items-center gap-2">
                    <span>📚</span>
                    {t("ai.background", "Background & Methodology")}
                  </h3>
                  <div className="space-y-3 text-gray-700 dark:text-gray-300 leading-relaxed">
                    <p className="whitespace-pre-line">
                      {formalReport.background?.purpose}
                    </p>
                    <p className="whitespace-pre-line">
                      {formalReport.background?.definition}
                    </p>
                    <p className="whitespace-pre-line">
                      {formalReport.background?.scopeAndMethodology}
                    </p>
                  </div>
                </section>

                {/* Company Overview */}
                <section className="bg-white dark:bg-gray-900 rounded-xl shadow border border-black/10 dark:border-gray-700 p-6">
                  <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white flex items-center gap-2">
                    <span>🏢</span>
                    {t("ai.companyOverview", "Company Overview")}
                  </h3>
                  <p className="whitespace-pre-line text-gray-700 dark:text-gray-300 leading-relaxed">
                    {formalReport.companyOverview}
                  </p>
                </section>

                {/* Assessment Outcome */}
                <section className="bg-white dark:bg-gray-900 rounded-xl shadow border border-black/10 dark:border-gray-700 p-6">
                  <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white flex items-center gap-2">
                    <span>📈</span>
                    {t("ai.assessmentOutcome", "Assessment Outcome")}
                  </h3>
                  <div className="space-y-3 text-gray-700 dark:text-gray-300 leading-relaxed">
                    <p className="whitespace-pre-line">
                      {formalReport.assessmentOutcome?.overallScore}
                    </p>
                    <p className="whitespace-pre-line">
                      {formalReport.assessmentOutcome?.domainScores}
                    </p>
                    <p className="whitespace-pre-line">
                      {formalReport.assessmentOutcome?.scoringMethodology}
                    </p>
                    <p className="whitespace-pre-line">
                      {formalReport.assessmentOutcome?.thresholdCriteria}
                    </p>
                  </div>
                </section>

                {/* Domain Assessments */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-gray-900 rounded-xl shadow border border-black/10 dark:border-gray-700 p-6">
                    <h4 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white flex items-center gap-2">
                      <span>🛒</span>
                      {t("ai.marketAssessment", "Market Assessment")}
                    </h4>
                    <p className="whitespace-pre-line text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                      {formalReport.marketAssessment}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-900 rounded-xl shadow border border-black/10 dark:border-gray-700 p-6">
                    <h4 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white flex items-center gap-2">
                      <span>💰</span>
                      {t("ai.financialAssessment", "Financial Assessment")}
                    </h4>
                    <p className="whitespace-pre-line text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                      {formalReport.financialAssessment}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-900 rounded-xl shadow border border-black/10 dark:border-gray-700 p-6">
                    <h4 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white flex items-center gap-2">
                      <span>⚙️</span>
                      {t("ai.operationsAssessment", "Operations Assessment")}
                    </h4>
                    <p className="whitespace-pre-line text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                      {formalReport.operationsAssessment}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-900 rounded-xl shadow border border-black/10 dark:border-gray-700 p-6">
                    <h4 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white flex items-center gap-2">
                      <span>⚖️</span>
                      {t("ai.legalAssessment", "Legal & Compliance Assessment")}
                    </h4>
                    <p className="whitespace-pre-line text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                      {formalReport.legalAssessment}
                    </p>
                  </div>
                </section>

                {/* Risk Analysis */}
                <section className="bg-white dark:bg-gray-900 rounded-xl shadow border border-black/10 dark:border-gray-700 p-6">
                  <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white flex items-center gap-2">
                    <span>⚠️</span>
                    {t("ai.riskAnalysis", "Risk Analysis")}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    <div>
                      <h4 className="font-semibold mb-1">
                        {t("ai.commercialRisks", "Commercial Risks")}
                      </h4>
                      <p className="whitespace-pre-line">
                        {formalReport.riskAnalysis?.commercialRisks}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">
                        {t("ai.financialRisks", "Financial Risks")}
                      </h4>
                      <p className="whitespace-pre-line">
                        {formalReport.riskAnalysis?.financialRisks}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">
                        {t("ai.operationalRisks", "Operational Risks")}
                      </h4>
                      <p className="whitespace-pre-line">
                        {formalReport.riskAnalysis?.operationalRisks}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">
                        {t(
                          "ai.legalRegulatoryRisks",
                          "Legal & Regulatory Risks",
                        )}
                      </h4>
                      <p className="whitespace-pre-line">
                        {formalReport.riskAnalysis?.legalRegulatoryRisks}
                      </p>
                    </div>
                  </div>
                </section>

                {/* Roadmap */}
                <section className="bg-white dark:bg-gray-900 rounded-xl shadow border border-black/10 dark:border-gray-700 p-6">
                  <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white flex items-center gap-2">
                    <span>🗺️</span>
                    {t("ai.roadmap", "Roadmap & Next Steps")}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    <div>
                      <h4 className="font-semibold mb-1">
                        {t("ai.immediateActions", "Immediate (0–3 months)")}
                      </h4>
                      <p className="whitespace-pre-line">
                        {formalReport.roadmap?.immediate}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">
                        {t("ai.shortTermActions", "Short Term (3–9 months)")}
                      </h4>
                      <p className="whitespace-pre-line">
                        {formalReport.roadmap?.shortTerm}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">
                        {t("ai.mediumTermActions", "Medium Term (9–18 months)")}
                      </h4>
                      <p className="whitespace-pre-line">
                        {formalReport.roadmap?.mediumTerm}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">
                        {t("ai.projectedImprovement", "Projected Improvement")}
                      </h4>
                      <p className="whitespace-pre-line">
                        {formalReport.roadmap?.projectedImprovement}
                      </p>
                    </div>
                  </div>
                </section>

                {/* Conclusion */}
                <section className="bg-white dark:bg-gray-900 rounded-xl shadow border border-black/10 dark:border-gray-700 p-6">
                  <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white flex items-center gap-2">
                    <span>✅</span>
                    {t("ai.conclusion", "Conclusion & Recommendation")}
                  </h3>
                  <p className="whitespace-pre-line text-gray-700 dark:text-gray-300 leading-relaxed">
                    {formalReport.conclusion}
                  </p>
                </section>
              </>
            )}
          </div>
        )}

        {/* Recommendations Tab */}
        {activeTab === "recommendations" && !loading && (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-blue-800 dark:text-blue-200">
                    {t(
                      "ai.strategicRecommendations",
                      "Strategic Recommendations",
                    )}
                  </h3>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    {t(
                      "ai.actionableInsights",
                      "Actionable insights to improve investment readiness",
                    )}
                  </p>
                </div>
              </div>
            </div>

            {(aiAnalysis?.recommendations ||
              aiAnalysis?.predictions?.recommendations) &&
            (
              aiAnalysis.recommendations ||
              aiAnalysis.predictions?.recommendations
            )?.length > 0 ? (
              <div className="grid grid-cols-1 gap-5">
                {(
                  aiAnalysis.recommendations ||
                  aiAnalysis.predictions.recommendations
                ).map((rec, index) => {
                  const priorityConfig = {
                    HIGH: {
                      border: "border-red-500",
                      bg: "bg-red-50 dark:bg-red-900/20",
                      badge: "bg-red-500",
                      icon: "🔥",
                    },
                    MEDIUM: {
                      border: "border-yellow-500",
                      bg: "bg-yellow-50 dark:bg-yellow-900/20",
                      badge: "bg-yellow-500",
                      icon: "⚠️",
                    },
                    LOW: {
                      border: "border-green-500",
                      bg: "bg-green-50 dark:bg-green-900/20",
                      badge: "bg-green-500",
                      icon: "✅",
                    },
                  };
                  const priority = (rec.priority || "MEDIUM").toUpperCase();
                  const config =
                    priorityConfig[priority] || priorityConfig.MEDIUM;

                  return (
                    <div
                      key={index}
                      className={`${config.bg} ${config.border} border-l-4 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden`}
                    >
                      <div className="p-6">
                        {/* Header with badges */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{config.icon}</span>
                            <div className="flex flex-wrap gap-2">
                              <span
                                className={`${config.badge} text-white px-3 py-1 text-xs font-bold rounded-full`}
                              >
                                {priority} {t("ai.priorityLabel", "PRIORITY")}
                              </span>
                              <span className="bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 px-3 py-1 text-xs font-semibold rounded-full">
                                {(rec.category || "GENERAL").toUpperCase()}
                              </span>
                              {rec.timeframe && (
                                <span className="bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-200 px-3 py-1 text-xs font-medium rounded-full">
                                  🕒 {rec.timeframe}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-2xl font-bold text-gray-300 dark:text-gray-600">
                            #{index + 1}
                          </span>
                        </div>

                        {/* Title */}
                        <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                          <svg
                            className="w-5 h-5 text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 10V3L4 14h7v7l9-11h-7z"
                            />
                          </svg>
                          {rec.title || rec.text || "Strategic Recommendation"}
                        </h4>

                        {/* Description */}
                        <div className="bg-white/70 dark:bg-gray-800/70 rounded-lg p-4 mb-4">
                          <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-base">
                            {rec.description ||
                              rec.text ||
                              "Implement strategic improvements to enhance business performance and investment readiness."}
                          </p>
                        </div>

                        {/* Impact Footer */}
                        {rec.expectedImpact && (
                          <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-2">
                              <svg
                                className="w-4 h-4 text-gray-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                                />
                              </svg>
                              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                {t("ai.expectedImpact", "Expected Impact")}:
                              </span>
                              <span
                                className={`text-sm font-bold px-2 py-1 rounded ${
                                  rec.expectedImpact === "High"
                                    ? "bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200"
                                    : rec.expectedImpact === "Medium"
                                      ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-800 dark:text-yellow-200"
                                      : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                                }`}
                              >
                                {rec.expectedImpact}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <svg
                  className="w-16 h-16 text-gray-400 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <p className="text-gray-500 dark:text-gray-400 text-lg">
                  {t(
                    "ai.generatingRecommendations",
                    "Generating strategic recommendations...",
                  )}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Domain Analysis Tab */}
        {activeTab === "domains" && !loading && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {["commercial", "financial", "operations", "legal"].map(
                (domain) => (
                  <div
                    key={domain}
                    className="border border-black/10 dark:border-gray-700 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-800 dark:text-gray-200 capitalize">
                        {t(`ai.domains.${domain}`, domain)}{" "}
                        {t("ai.domainCapitalized", "Domain")}
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {Math.round(scoreData?.[domain]?.percentage || 0)}%
                        </span>
                        <button
                          onClick={() => generateDomainAnalysis(domain)}
                          className="px-3 py-1 text-xs bg-primary text-white rounded hover:bg-primary/80 transition-colors"
                        >
                          {t("ai.domainAnalyzeButton", "Analyze")}
                        </button>
                      </div>
                    </div>

                    {domainAnalysis[domain] ? (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <div className="whitespace-pre-wrap">
                          {expandedDomains[domain]
                            ? domainAnalysis[domain].analysis
                            : `${domainAnalysis[domain].analysis.substring(0, 200)}...`}
                        </div>
                        {domainAnalysis[domain].analysis.length > 200 && (
                          <button
                            onClick={() => toggleDomainExpansion(domain)}
                            className="text-primary hover:underline ml-2 mt-2 inline-flex items-center gap-1 font-medium"
                          >
                            {expandedDomains[domain]
                              ? t("ai.domainShowLess", "Show Less")
                              : t("ai.domainReadMore", "Read More")}
                            <svg
                              className={`w-4 h-4 transition-transform ${expandedDomains[domain] ? "rotate-180" : ""}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t(
                          "ai.domainClickAnalyze",
                          'Click "Analyze" to generate AI insights for this domain',
                        )}
                      </p>
                    )}
                  </div>
                ),
              )}
            </div>
          </div>
        )}

        {/* Risk Assessment Tab */}
        {activeTab === "risks" && !loading && (
          <div className="space-y-6">
            {aiAnalysis?.predictions?.riskAssessment ? (
              <div className="space-y-6">
                {/* Risk Overview */}
                <div className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 p-6 rounded-xl border border-red-200 dark:border-red-700">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 15c-.77.833.192 2.5 1.732 2.5z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-red-800 dark:text-red-200">
                        {t("ai.riskAssessmentTitle", "Risk Assessment")}
                      </h3>
                      <p className="text-red-600 dark:text-red-400">
                        {t("ai.overallRiskScore", "Overall Risk Score")}:{" "}
                        {aiAnalysis.predictions.riskAssessment.overallRiskScore}
                        /100
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {t("ai.riskLevel", "Risk Level")}
                      </div>
                      <div
                        className={`text-lg font-bold ${
                          aiAnalysis.predictions.riskAssessment.riskLevel ===
                          "High"
                            ? "text-red-600"
                            : aiAnalysis.predictions.riskAssessment
                                  .riskLevel === "Medium"
                              ? "text-yellow-600"
                              : "text-green-600"
                        }`}
                      >
                        {aiAnalysis.predictions.riskAssessment.riskLevel}
                      </div>
                    </div>
                    <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {t("ai.monthTrend", "6 Month Trend")}
                      </div>
                      <div className="text-lg font-bold text-gray-800 dark:text-gray-200">
                        {aiAnalysis.predictions.riskAssessment.riskTrends
                          ?.next6Months || t("ai.stable", "Stable")}
                      </div>
                    </div>
                    <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {t("ai.monthOutlook", "24 Month Outlook")}
                      </div>
                      <div className="text-lg font-bold text-gray-800 dark:text-gray-200">
                        {aiAnalysis.predictions.riskAssessment.riskTrends
                          ?.next24Months || t("ai.decreasing", "Decreasing")}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Key Risks */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    {t("ai.keyRiskFactors", "Key Risk Factors")}
                  </h4>
                  {aiAnalysis.predictions.riskAssessment.keyRisks?.map(
                    (risk, index) => (
                      <div
                        key={index}
                        className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-black/10 dark:border-gray-700 shadow-sm"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-3 py-1 text-xs font-medium rounded-full ${
                                risk.impact === "High"
                                  ? "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100"
                                  : risk.impact === "Medium"
                                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100"
                                    : "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                              }`}
                            >
                              {risk.impact} {t("ai.impactLabel", "Impact")}
                            </span>
                            <span className="px-3 py-1 text-xs bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-full">
                              {risk.category}
                            </span>
                          </div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {risk.timeframe}
                          </span>
                        </div>
                        <h5 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                          {risk.risk}
                        </h5>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                          <strong>{t("ai.probability", "Probability")}:</strong>{" "}
                          {risk.probability}
                        </p>
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                          <p className="text-sm text-blue-800 dark:text-blue-200">
                            <strong>
                              {t(
                                "ai.mitigationStrategy",
                                "Mitigation Strategy",
                              )}
                              :
                            </strong>{" "}
                            {risk.mitigation}
                          </p>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            ) : aiAnalysis?.riskAssessment ? (
              <div className="prose dark:prose-invert max-w-none">
                <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg border-l-4 border-red-500">
                  <div className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">
                    {aiAnalysis.riskAssessment}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  {t(
                    "ai.generateCompleteAnalysisRisk",
                    "Generate complete analysis to see detailed risk assessment",
                  )}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Growth Potential Tab */}
        {activeTab === "growth" && !loading && (
          <div className="space-y-6">
            {aiAnalysis?.predictions?.growthPotential ? (
              <div className="space-y-6">
                {/* Growth Overview */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-xl border border-green-200 dark:border-green-700">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-green-800 dark:text-green-200">
                        {t("ai.growthPotential", "Growth Potential")}
                      </h3>
                      <p className="text-green-600 dark:text-green-400">
                        {t("ai.growthScore", "Growth Score")}:{" "}
                        {aiAnalysis.predictions.growthPotential.growthScore}/100
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {t("ai.growthCategory", "Growth Category")}
                      </div>
                      <div className="text-lg font-bold text-green-600 dark:text-green-400">
                        {aiAnalysis.predictions.growthPotential.growthCategory}
                      </div>
                    </div>
                    <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {t("ai.marketGrowthRate", "Market Growth Rate")}
                      </div>
                      <div className="text-lg font-bold text-gray-800 dark:text-gray-200">
                        {aiAnalysis.predictions.growthPotential.marketExpansion
                          ?.marketGrowthRate || "N/A"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Revenue Projections */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-black/10 dark:border-gray-700">
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                    {t("ai.revenueProjections", "Revenue Projections (USD)")}
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-black/10 dark:border-gray-700">
                          <th className="text-left py-2 text-gray-600 dark:text-gray-400">
                            {t("ai.timeframe", "Timeframe")}
                          </th>
                          <th className="text-right py-2 text-gray-600 dark:text-gray-400">
                            {t("ai.conservative", "Conservative")}
                          </th>
                          <th className="text-right py-2 text-gray-600 dark:text-gray-400">
                            {t("ai.realistic", "Realistic")}
                          </th>
                          <th className="text-right py-2 text-gray-600 dark:text-gray-400">
                            {t("ai.optimistic", "Optimistic")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(
                          aiAnalysis.predictions.growthPotential
                            .revenueProjections || {},
                        ).map(([year, projections]) => (
                          <tr
                            key={year}
                            className="border-b border-black/10 dark:border-gray-700"
                          >
                            <td className="py-3 font-medium text-gray-800 dark:text-gray-200 capitalize">
                              {year}
                            </td>
                            <td className="py-3 text-right text-gray-600 dark:text-gray-400">
                              $
                              {projections.conservative?.toLocaleString() ||
                                "N/A"}
                            </td>
                            <td className="py-3 text-right text-green-600 dark:text-green-400 font-medium">
                              $
                              {projections.realistic?.toLocaleString() || "N/A"}
                            </td>
                            <td className="py-3 text-right text-blue-600 dark:text-blue-400">
                              $
                              {projections.optimistic?.toLocaleString() ||
                                "N/A"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Market Analysis */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-black/10 dark:border-gray-700">
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                    {t(
                      "ai.marketExpansionAnalysis",
                      "Market Expansion Analysis",
                    )}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">
                            {t("ai.currentMarketSize", "Current Market Size")}
                          </span>
                          <span className="font-medium text-gray-800 dark:text-gray-200">
                            $
                            {aiAnalysis.predictions.growthPotential.marketExpansion?.currentMarketSize?.toLocaleString() ||
                              "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">
                            {t("ai.addressableMarket", "Addressable Market")}
                          </span>
                          <span className="font-medium text-gray-800 dark:text-gray-200">
                            $
                            {aiAnalysis.predictions.growthPotential.marketExpansion?.addressableMarket?.toLocaleString() ||
                              "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">
                            {t(
                              "ai.marketSharePotential",
                              "Market Share Potential",
                            )}
                          </span>
                          <span className="font-medium text-gray-800 dark:text-gray-200">
                            {aiAnalysis.predictions.growthPotential
                              .marketExpansion?.marketSharePotential || "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-3">
                        {t("ai.scalingFactors", "Scaling Factors")}
                      </h5>
                      <div className="space-y-2">
                        {aiAnalysis.predictions.growthPotential.scalingFactors?.map(
                          (factor, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2"
                            >
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  factor.impact === "High"
                                    ? "bg-green-500"
                                    : factor.impact === "Medium"
                                      ? "bg-yellow-500"
                                      : "bg-gray-400"
                                }`}
                              ></span>
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {factor.factor}
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  {t(
                    "ai.generateCompleteAnalysisGrowth",
                    "Generate complete analysis to see growth potential data",
                  )}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Investment Decision Tab */}
        {activeTab === "investment" && !loading && (
          <div className="space-y-6">
            {aiAnalysis?.predictions?.investmentDecision ? (
              <div className="space-y-6">
                {/* Investment Overview */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-700">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-blue-800 dark:text-blue-200">
                        {t("ai.investmentDecision", "Investment Decision")}
                      </h3>
                      <p className="text-blue-600 dark:text-blue-400">
                        {t("ai.readinessScore", "Readiness Score")}:{" "}
                        {
                          aiAnalysis.predictions.investmentDecision
                            .investmentReadinessScore
                        }
                        /100
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {t("ai.recommendation", "Recommendation")}
                      </div>
                      <div
                        className={`text-lg font-bold ${
                          aiAnalysis.predictions.investmentDecision
                            .recommendation === "Invest Now"
                            ? "text-green-600"
                            : aiAnalysis.predictions.investmentDecision
                                  .recommendation === "Conditional Investment"
                              ? "text-yellow-600"
                              : aiAnalysis.predictions.investmentDecision
                                    .recommendation === "Monitor"
                                ? "text-blue-600"
                                : "text-red-600"
                        }`}
                      >
                        {
                          aiAnalysis.predictions.investmentDecision
                            .recommendation
                        }
                      </div>
                    </div>
                    <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {t("ai.exitStrategy", "Exit Strategy")}
                      </div>
                      <div className="text-lg font-bold text-gray-800 dark:text-gray-200">
                        {aiAnalysis.predictions.investmentDecision.exitStrategy
                          ?.primaryOption || "N/A"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Investment Amounts */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-black/10 dark:border-gray-700">
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                    {t("ai.investmentFramework", "Investment Framework")}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-lg">
                      <h5 className="font-medium text-blue-800 dark:text-blue-200 mb-3">
                        {t("ai.expectedReturns", "Expected Returns")}
                      </h5>
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {aiAnalysis.predictions.investmentDecision
                          .expectedReturns || "N/A"}
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-lg">
                      <h5 className="font-medium text-green-800 dark:text-green-200 mb-3">
                        {t("ai.confidenceLevel", "Confidence Level")}
                      </h5>
                      <div
                        className={`text-2xl font-bold ${
                          aiAnalysis.predictions.investmentDecision
                            .confidenceLevel === "High"
                            ? "text-green-600 dark:text-green-400"
                            : aiAnalysis.predictions.investmentDecision
                                  .confidenceLevel === "Medium"
                              ? "text-yellow-600 dark:text-yellow-400"
                              : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {aiAnalysis.predictions.investmentDecision
                          .confidenceLevel || "Medium"}
                      </div>
                    </div>
                  </div>

                  {/* Investment Rationale */}
                  {aiAnalysis.predictions.investmentDecision
                    .investmentRationale && (
                    <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <h5 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                        {t("ai.investmentRationale", "Investment Rationale")}
                      </h5>
                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                        {
                          aiAnalysis.predictions.investmentDecision
                            .investmentRationale
                        }
                      </p>
                    </div>
                  )}
                </div>

                {/* Investment Conditions */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-black/10 dark:border-gray-700">
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                    {t(
                      "ai.investmentConditions",
                      "Key Conditions & Prerequisites",
                    )}
                  </h4>
                  <div className="space-y-3">
                    {(Array.isArray(
                      aiAnalysis.predictions.investmentDecision.conditions,
                    )
                      ? aiAnalysis.predictions.investmentDecision.conditions
                      : []
                    ).map((condition, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-4  dark:bg-gray-700 rounded-lg border border-black/10 dark:border-gray-600"
                      >
                        <div className="flex-shrink-0 mt-1">
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {index + 1}
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-800 dark:text-gray-200 font-medium leading-relaxed">
                            {typeof condition === "string"
                              ? condition
                              : condition.condition ||
                                condition.title ||
                                "No description"}
                          </p>
                          {condition.timeline &&
                            typeof condition !== "string" && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {t("ai.timeline", "Timeline")}:{" "}
                                {condition.timeline}
                              </p>
                            )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  {t(
                    "ai.generateCompleteAnalysisInvestment",
                    "Generate complete analysis to see investment decision framework",
                  )}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Scenario Analysis Tab */}
        {activeTab === "scenarios" && !loading && (
          <div className="space-y-6">
            {aiAnalysis?.predictions?.scenarioAnalysis ? (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                    {t("ai.scenarioAnalysis", "Scenario Analysis")}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t(
                      "ai.exploreOutcomes",
                      "Explore different potential outcomes for this investment opportunity",
                    )}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Best Case */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-xl border border-green-200 dark:border-green-700">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                          />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-bold text-green-800 dark:text-green-200">
                          {t("ai.bestCase", "Best Case")}
                        </h4>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          {aiAnalysis.predictions.scenarioAnalysis.bestCase
                            ?.probability || "N/A"}{" "}
                          {t("ai.probability", "Probability")}
                        </p>
                      </div>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 mb-4 text-sm">
                      {aiAnalysis.predictions.scenarioAnalysis.bestCase
                        ?.description ||
                        t(
                          "ai.noDescriptionAvailable",
                          "No description available",
                        )}
                    </p>
                    <div>
                      <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-2">
                        {t("ai.keyDrivers", "Key Drivers")}:
                      </h5>
                      <ul className="space-y-1">
                        {aiAnalysis.predictions.scenarioAnalysis.bestCase?.keyDrivers?.map(
                          (driver, index) => (
                            <li
                              key={index}
                              className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2"
                            >
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                              {driver}
                            </li>
                          ),
                        )}
                      </ul>
                    </div>
                  </div>

                  {/* Most Likely */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-700">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                          />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-bold text-blue-800 dark:text-blue-200">
                          {t("ai.mostLikely", "Most Likely")}
                        </h4>
                        <p className="text-sm text-blue-600 dark:text-blue-400">
                          {aiAnalysis.predictions.scenarioAnalysis.mostLikely
                            ?.probability || "N/A"}{" "}
                          {t("ai.probability", "Probability")}
                        </p>
                      </div>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 mb-4 text-sm">
                      {aiAnalysis.predictions.scenarioAnalysis.mostLikely
                        ?.description ||
                        t(
                          "ai.noDescriptionAvailable",
                          "No description available",
                        )}
                    </p>
                    <div>
                      <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-2">
                        {t("ai.keyDrivers", "Key Drivers")}:
                      </h5>
                      <ul className="space-y-1">
                        {aiAnalysis.predictions.scenarioAnalysis.mostLikely?.keyDrivers?.map(
                          (driver, index) => (
                            <li
                              key={index}
                              className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2"
                            >
                              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                              {driver}
                            </li>
                          ),
                        )}
                      </ul>
                    </div>
                  </div>

                  {/* Worst Case */}
                  <div className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 p-6 rounded-xl border border-red-200 dark:border-red-700">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                          />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-bold text-red-800 dark:text-red-200">
                          {t("ai.worstCase", "Worst Case")}
                        </h4>
                        <p className="text-sm text-red-600 dark:text-red-400">
                          {aiAnalysis.predictions.scenarioAnalysis.worstCase
                            ?.probability || "N/A"}{" "}
                          {t("ai.probability", "Probability")}
                        </p>
                      </div>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 mb-4 text-sm">
                      {aiAnalysis.predictions.scenarioAnalysis.worstCase
                        ?.description ||
                        t(
                          "ai.noDescriptionAvailable",
                          "No description available",
                        )}
                    </p>
                    <div>
                      <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-2">
                        {t("ai.keyDrivers", "Key Drivers")}:
                      </h5>
                      <ul className="space-y-1">
                        {aiAnalysis.predictions.scenarioAnalysis.worstCase?.keyDrivers?.map(
                          (driver, index) => (
                            <li
                              key={index}
                              className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2"
                            >
                              <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                              {driver}
                            </li>
                          ),
                        )}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Key Metrics Dashboard */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-black/10 dark:border-gray-700">
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                    {t("ai.keyPerformanceMetrics", "Key Performance Metrics")}
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {/* Commercial Readiness */}
                    <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-700">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {Math.round(scoreData?.commercial?.percentage || 0)}%
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 font-medium mt-1">
                        Commercial
                      </div>
                    </div>

                    {/* Financial Readiness */}
                    <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border border-green-200 dark:border-green-700">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {Math.round(scoreData?.financial?.percentage || 0)}%
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 font-medium mt-1">
                        Financial
                      </div>
                    </div>

                    {/* Operations Readiness */}
                    <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg border border-purple-200 dark:border-purple-700">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {Math.round(scoreData?.operations?.percentage || 0)}%
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 font-medium mt-1">
                        Operations
                      </div>
                    </div>

                    {/* Legal Readiness */}
                    <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg border border-orange-200 dark:border-orange-700">
                      <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {Math.round(scoreData?.legal?.percentage || 0)}%
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 font-medium mt-1">
                        Legal
                      </div>
                    </div>

                    {/* Overall Readiness */}
                    <div className="text-center p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 rounded-lg border border-indigo-200 dark:border-indigo-700">
                      <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                        {Math.round(
                          ((scoreData?.commercial?.percentage || 0) +
                            (scoreData?.financial?.percentage || 0) +
                            (scoreData?.operations?.percentage || 0) +
                            (scoreData?.legal?.percentage || 0)) /
                            4,
                        )}
                        %
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 font-medium mt-1">
                        Overall
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  {t(
                    "ai.generateCompleteAnalysisScenario",
                    "Generate complete analysis to see scenario analysis",
                  )}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      {aiAnalysis && (
        <div className="border-t border-stroke px-6 py-4 dark:border-strokedark">
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>
                {t(
                  "ai.aiAnalysisGenerated",
                  "AI analysis generated using Gemini AI",
                )}
              </span>
            </div>
            <div>
              {t("ai.lastUpdated", "Last updated")}:{" "}
              {new Date().toLocaleString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAnalysisPanel;
