import React, { useContext, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { UserContext } from "@/layouts/DashboardLayout";

import {
  getInternalReport,
  getPublishedReport,
  getUserBusiness,
} from "@/controllers/crat_controller";

import BusinessDomainScores from "@/components/Charts/BusinessDomainScores";
import PerformanceDistribution from "@/components/Charts/PerformanceDistribution";

import { generateCapitalReadinessPDF } from "@/services/capitalReadinessPDF";

import { FaDownload, FaChartLine } from "react-icons/fa";

const DOMAIN_CONFIG = [
  {
    apiKey: "commercial_marketing",
    chartKey: "commercial",
    label: "Commercial",
  },

  {
    apiKey: "financial",
    chartKey: "financial",
    label: "Financial",
  },

  {
    apiKey: "operations",
    chartKey: "operations",
    label: "Operations",
  },

  {
    apiKey: "legal_compliance",
    chartKey: "legal",
    label: "Legal",
  },
];

const getStatusLabel = (percentage) => {
  if (percentage >= 75) return "Ready";

  if (percentage >= 60)
    return "Partially Ready";

  return "Not Ready";
};

const getPercentageColor = (
  percentage,
) => {
  if (percentage >= 75)
    return "text-green-600";

  if (percentage >= 60)
    return "text-yellow-500";

  return "text-red-500";
};

const toPercentFromDomain = (
  domain = {},
) => {
  const average = Number(
    domain.average || 0,
  );

  const reviewedQuestions = Number(
    domain.reviewedQuestions || 0,
  );

  const totalQuestions = Number(
    domain.totalQuestions || 0,
  );

  const earnedScore =
    average * reviewedQuestions;

  const maxScore = totalQuestions * 5;

  if (maxScore <= 0) return 0;

  return Math.round(
    (earnedScore / maxScore) * 100,
  );
};

const toItemScore = (percentage) =>
  Number(
    ((percentage / 100) * 2).toFixed(2),
  );

const buildFallbackDomainDataForPdf = (
  domainRows,
) => {
  const getRow = (chartKey) =>
    domainRows.find(
      (row) =>
        row.chartKey === chartKey,
    );

  return {
    commercial: {
      summary: [
        {
          subDomain:
            "Commercial readiness overview",

          score: toItemScore(
            getRow("commercial")
              ?.percentage || 0,
          ),

          reviewerComment:
            "Derived from CRAT report domain score normalized by all domain questions.",
        },
      ],
    },

    financial: {
      summary: [
        {
          subDomain:
            "Financial readiness overview",

          score: toItemScore(
            getRow("financial")
              ?.percentage || 0,
          ),

          reviewerComment:
            "Derived from CRAT report domain score normalized by all domain questions.",
        },
      ],
    },

    operations: {
      summary: [
        {
          subDomain:
            "Operations readiness overview",

          score: toItemScore(
            getRow("operations")
              ?.percentage || 0,
          ),

          reviewerComment:
            "Derived from CRAT report domain score normalized by all domain questions.",
        },
      ],
    },

    legal: {
      summary: [
        {
          subDomain:
            "Legal and compliance readiness overview",

          score: toItemScore(
            getRow("legal")
              ?.percentage || 0,
          ),

          reviewerComment:
            "Derived from CRAT report domain score normalized by all domain questions.",
        },
      ],
    },
  };
};

const buildFallbackScoreDataForPdf = (
  domainRows,
) => {
  const getRow = (chartKey) =>
    domainRows.find(
      (row) =>
        row.chartKey === chartKey,
    );

  const commercial =
    getRow("commercial");

  const financial =
    getRow("financial");

  const operations =
    getRow("operations");

  const legal = getRow("legal");

  const overallPercent =
    Math.round(
      [
        commercial?.percentage || 0,
        financial?.percentage || 0,
        operations?.percentage || 0,
        legal?.percentage || 0,
      ].reduce(
        (sum, value) => sum + value,
        0,
      ) / 4,
    );

  return {
    commercial: {
      percentage:
        commercial?.percentage || 0,

      status:
        commercial?.status ||
        "Not Ready",
    },

    financial: {
      percentage:
        financial?.percentage || 0,

      status:
        financial?.status ||
        "Not Ready",
    },

    operations: {
      percentage:
        operations?.percentage || 0,

      status:
        operations?.status ||
        "Not Ready",
    },

    legal: {
      percentage:
        legal?.percentage || 0,

      status:
        legal?.status ||
        "Not Ready",
    },

    general_status:
      getStatusLabel(overallPercent),
  };
};

const getPdfPayloadFromReport = (
  report,
  domainRows,
) => {
  const hasReportData =
    report?.reportData &&
    [
      "commercial",
      "financial",
      "operations",
      "legal",
    ].every(
      (key) =>
        report.reportData?.[key] &&
        typeof report.reportData[
          key
        ] === "object",
    );

  const hasScoreData =
    report?.scoreData &&
    [
      "commercial",
      "financial",
      "operations",
      "legal",
    ].every(
      (key) =>
        report.scoreData?.[key] &&
        typeof report.scoreData[
          key
        ] === "object",
    );

  return {
    domainDataForPdf:
      hasReportData
        ? report.reportData
        : buildFallbackDomainDataForPdf(
            domainRows,
          ),

    scoreDataForPdf:
      hasScoreData
        ? report.scoreData
        : buildFallbackScoreDataForPdf(
            domainRows,
          ),
  };
};

const Report = () => {
  const { userDetails } =
    useContext(UserContext);

  const [loading, setLoading] =
    useState(true);

  const [pdfLoading, setPdfLoading] =
    useState(false);

  const [report, setReport] =
    useState(null);

  const [business, setBusiness] =
    useState(null);

  const isEntrepreneur =
    userDetails?.role ===
    "Enterprenuer";

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        const businessData =
          await getUserBusiness(
            userDetails?.uuid,
          );

        if (!businessData?.id) return;

        setBusiness(businessData);

        const data = isEntrepreneur
          ? await getPublishedReport(
              businessData.id,
            )
          : await getInternalReport(
              businessData.id,
            );

        setReport(data || null);
      } catch (error) {
        console.error(error);

        toast.error(
          "Failed to load CRAT report.",
        );
      } finally {
        setLoading(false);
      }
    };

    if (userDetails?.uuid) {
      load();
    }
  }, [
    isEntrepreneur,
    userDetails?.uuid,
  ]);

  const domainRows = useMemo(() => {
    return DOMAIN_CONFIG.map(
      (item) => {
        const domain =
          report?.domainScores?.[
            item.apiKey
          ] || {};

        const percentage =
          toPercentFromDomain(domain);

        const reviewedQuestions =
          Number(
            domain.reviewedQuestions ||
              0,
          );

        const totalQuestions =
          Number(
            domain.totalQuestions || 0,
          );

        const coverage =
          totalQuestions > 0
            ? Math.round(
                (reviewedQuestions /
                  totalQuestions) *
                  100,
              )
            : 0;

        return {
          ...item,

          percentage,

          average: Number(
            domain.average || 0,
          ),

          weight: Math.round(
            Number(domain.weight || 0) *
              100,
          ),

          weightedContribution:
            Number(
              domain.weightedContribution ||
                0,
            ),

          coverage,

          status:
            getStatusLabel(
              percentage,
            ),
        };
      },
    );
  }, [report]);

  const chartScoreData =
    useMemo(() => {
      const base = {
        commercial: {
          percentage: 0,
          status: "Not Ready",
        },

        financial: {
          percentage: 0,
          status: "Not Ready",
        },

        operations: {
          percentage: 0,
          status: "Not Ready",
        },

        legal: {
          percentage: 0,
          status: "Not Ready",
        },

        general_status:
          "Not Ready",
      };

      if (!report) return base;

      domainRows.forEach((domain) => {
        base[domain.chartKey] = {
          percentage:
            domain.percentage,

          status: domain.status,
        };
      });

      const overallPercent =
        Math.round(
          domainRows.reduce(
            (sum, domain) =>
              sum +
              domain.percentage,
            0,
          ) / domainRows.length,
        );

      base.general_status =
        getStatusLabel(
          overallPercent,
        );

      return base;
    }, [domainRows, report]);

  const overallPercent =
    useMemo(() => {
      return Math.round(
        domainRows.reduce(
          (sum, domain) =>
            sum + domain.percentage,
          0,
        ) /
          (domainRows.length || 1),
      );
    }, [domainRows]);

  const handleDownloadPdf =
    async () => {
      if (
        pdfLoading ||
        !report
      )
        return;

      try {
        setPdfLoading(true);

        const toastId =
          toast.loading(
            "Generating PDF report...",
          );

        const {
          domainDataForPdf,
          scoreDataForPdf,
        } = getPdfPayloadFromReport(
          report,
          domainRows,
        );

        const pdfUserContext = {
          Business: {
            businessName:
              business?.name,

            name: business?.name,

            sector:
              business
                ?.BusinessSector
                ?.name,

            businessSector:
              business
                ?.BusinessSector
                ?.name,

            location:
              business?.location,

            businessLocation:
              business?.location,
          },
        };

        const { filename } =
          await generateCapitalReadinessPDF(
            domainDataForPdf,
            scoreDataForPdf,
            pdfUserContext,
            (message) => {
              toast.loading(
                message,
                {
                  id: toastId,
                },
              );
            },
          );

        toast.success(
          `Report downloaded: ${filename}`,
          {
            id: toastId,
          },
        );
      } catch (error) {
        console.error(error);

        toast.error(
          "Failed to download PDF report.",
        );
      } finally {
        setPdfLoading(false);
      }
    };

  if (loading) {
    return (
      <div className="w-full p-4 md:px-6 md:pb-6">
        <div className="h-72 animate-pulse rounded-3xl bg-slate-200" />
      </div>
    );
  }

  return (
    <div className="w-full p-4 md:px-6 md:pb-6">
      <div className="space-y-5">
        {/* HERO */}
        <section className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-black shadow-sm">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                "url('/images/business_tools_hero.svg')",
            }}
          />

          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/20" />

          <div className="relative z-10 flex min-h-[260px] flex-col justify-end gap-6 p-8 text-white md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
                <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
                CRAT Analytics
              </span>

              <h1 className="mb-3 text-3xl font-bold leading-tight drop-shadow-lg md:text-5xl">
                Capital Readiness Report
              </h1>

              <p className="max-w-2xl text-sm leading-6 text-white/85 md:text-base">
                Review your investment
                readiness score, domain
                performance, assessment
                coverage, and improvement
                priorities.
              </p>
            </div>

            <button
              onClick={
                handleDownloadPdf
              }
              disabled={
                pdfLoading || !report
              }
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FaDownload />

              {pdfLoading
                ? "Generating PDF..."
                : "Download PDF"}
            </button>
          </div>
        </section>

        {/* KPI CARDS */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {/* OVERALL */}
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
              <FaChartLine className="text-2xl text-blue-600" />
            </div>

            <p
              className={`text-3xl font-black tracking-tight ${getPercentageColor(
                overallPercent,
              )}`}
            >
              {overallPercent}%
            </p>

            <p className="mt-4 text-xl font-bold text-slate-500">
              Overall Readiness
            </p>
          </div>

          {/* DOMAINS */}
          {domainRows.map((domain) => (
            <div
              key={domain.apiKey}
              className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
                <FaChartLine className="text-2xl text-blue-600" />
              </div>

              <p
                className={`text-3xl font-black tracking-tight ${getPercentageColor(
                  domain.percentage,
                )}`}
              >
                {domain.percentage}%
              </p>

              <p className="mt-4 text-xl font-bold text-slate-500">
                {domain.label} Domain
              </p>
            </div>
          ))}
        </section>

        {/* CHARTS */}
        <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div>
            <p className="text-xs font-semibold tracking-wide text-blue-600">
              Performance Overview
            </p>

            <h2 className="mt-1 text-xl font-semibold text-slate-900">
              Domain readiness and
              performance distribution
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Scores are normalized
              against the full question
              count in each domain to
              provide a consistent view
              of investment readiness.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-5">
            <div className="col-span-1 rounded-2xl border border-slate-200 bg-slate-50/60 p-3 md:col-span-3">
              <BusinessDomainScores
                initialScoreData={
                  chartScoreData
                }
                userDetails={
                  userDetails
                }
              />
            </div>

            <div className="col-span-1 rounded-2xl border border-slate-200 bg-slate-50/60 p-3 md:col-span-2">
              <PerformanceDistribution
                initialScoreData={
                  chartScoreData
                }
                userDetails={
                  userDetails
                }
              />
            </div>
          </div>
        </section>

        {/* TABLE */}
        <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div>
            <p className="text-xs font-semibold tracking-wide text-blue-600">
              Domain Insights
            </p>

            <h2 className="mt-1 text-xl font-semibold text-slate-900">
              Normalized domain
              performance
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Percentages below are
              calculated against all
              questions assigned to
              each domain.
            </p>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[920px] table-fixed overflow-hidden rounded-2xl">
              <thead>
                <tr className="bg-slate-100">
                  <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700">
                    Domain
                  </th>

                  <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700">
                    Percent
                  </th>

                  <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700">
                    Status
                  </th>

                  <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700">
                    Coverage
                  </th>

                  <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700">
                    Weight
                  </th>

                  <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700">
                    Contribution
                  </th>
                </tr>
              </thead>

              <tbody>
                {domainRows.map(
                  (domain) => (
                    <tr
                      key={
                        domain.apiKey
                      }
                      className="border-b border-slate-200"
                    >
                      <td className="px-3 py-4 text-sm font-semibold text-slate-900">
                        {domain.label}
                      </td>

                      <td
                        className={`px-3 py-4 text-sm font-semibold ${getPercentageColor(
                          domain.percentage,
                        )}`}
                      >
                        {
                          domain.percentage
                        }
                        %
                      </td>

                      <td className="px-3 py-4 text-sm">
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                          {
                            domain.status
                          }
                        </span>
                      </td>

                      <td className="px-3 py-4 text-sm text-slate-700">
                        {
                          domain.coverage
                        }
                        %
                      </td>

                      <td className="px-3 py-4 text-sm text-slate-700">
                        {domain.weight}
                        %
                      </td>

                      <td className="px-3 py-4 text-sm text-slate-700">
                        {domain.weightedContribution.toFixed(
                          2,
                        )}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Report;