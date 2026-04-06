import React, { useContext, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Breadcrumb from "@/component/Breadcrumb";
import { UserContext } from "@/layouts/DashboardLayout";
import {
  getInternalReport,
  getPublishedReport,
  getUserBusiness,
} from "@/controllers/crat_controller";
import BusinessDomainScores from "@/components/Charts/BusinessDomainScores";
import PerformanceDistribution from "@/components/Charts/PerformanceDistribution";
import { generateCapitalReadinessPDF } from "@/services/capitalReadinessPDF";

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
  if (percentage >= 60) return "Partially Ready";
  return "Not Ready";
};

const toPercentFromDomain = (domain = {}) => {
  const average = Number(domain.average || 0);
  const reviewedQuestions = Number(domain.reviewedQuestions || 0);
  const totalQuestions = Number(domain.totalQuestions || 0);
  const earnedScore = average * reviewedQuestions;
  const maxScore = totalQuestions * 5;

  if (maxScore <= 0) return 0;
  return Math.round((earnedScore / maxScore) * 100);
};

const toItemScore = (percentage) => Number(((percentage / 100) * 2).toFixed(2));

const buildFallbackDomainDataForPdf = (domainRows) => {
  const getRow = (chartKey) =>
    domainRows.find((row) => row.chartKey === chartKey);

  return {
    commercial: {
      summary: [
        {
          subDomain: "Commercial readiness overview",
          score: toItemScore(getRow("commercial")?.percentage || 0),
          reviewerComment:
            "Derived from CRAT report domain score normalized by all domain questions.",
        },
      ],
    },
    financial: {
      summary: [
        {
          subDomain: "Financial readiness overview",
          score: toItemScore(getRow("financial")?.percentage || 0),
          reviewerComment:
            "Derived from CRAT report domain score normalized by all domain questions.",
        },
      ],
    },
    operations: {
      summary: [
        {
          subDomain: "Operations readiness overview",
          score: toItemScore(getRow("operations")?.percentage || 0),
          reviewerComment:
            "Derived from CRAT report domain score normalized by all domain questions.",
        },
      ],
    },
    legal: {
      summary: [
        {
          subDomain: "Legal and compliance readiness overview",
          score: toItemScore(getRow("legal")?.percentage || 0),
          reviewerComment:
            "Derived from CRAT report domain score normalized by all domain questions.",
        },
      ],
    },
  };
};

const buildFallbackScoreDataForPdf = (domainRows) => {
  const getRow = (chartKey) =>
    domainRows.find((row) => row.chartKey === chartKey);

  const commercial = getRow("commercial");
  const financial = getRow("financial");
  const operations = getRow("operations");
  const legal = getRow("legal");

  const overallPercent = Math.round(
    [
      commercial?.percentage || 0,
      financial?.percentage || 0,
      operations?.percentage || 0,
      legal?.percentage || 0,
    ].reduce((sum, value) => sum + value, 0) / 4,
  );

  return {
    commercial: {
      percentage: commercial?.percentage || 0,
      status: commercial?.status || "Not Ready",
    },
    financial: {
      percentage: financial?.percentage || 0,
      status: financial?.status || "Not Ready",
    },
    operations: {
      percentage: operations?.percentage || 0,
      status: operations?.status || "Not Ready",
    },
    legal: {
      percentage: legal?.percentage || 0,
      status: legal?.status || "Not Ready",
    },
    general_status: getStatusLabel(overallPercent),
  };
};

const getPdfPayloadFromReport = (report, domainRows) => {
  const hasReportData =
    report?.reportData &&
    ["commercial", "financial", "operations", "legal"].every(
      (key) =>
        report.reportData?.[key] && typeof report.reportData[key] === "object",
    );

  const hasScoreData =
    report?.scoreData &&
    ["commercial", "financial", "operations", "legal"].every(
      (key) =>
        report.scoreData?.[key] && typeof report.scoreData[key] === "object",
    );

  return {
    domainDataForPdf: hasReportData
      ? report.reportData
      : buildFallbackDomainDataForPdf(domainRows),
    scoreDataForPdf: hasScoreData
      ? report.scoreData
      : buildFallbackScoreDataForPdf(domainRows),
  };
};

const Report = () => {
  const { userDetails } = useContext(UserContext);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [business, setBusiness] = useState(null);

  const isEntrepreneur = userDetails?.role === "Enterprenuer";

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const businessData = await getUserBusiness(userDetails?.uuid);
        if (!businessData?.id) return;
        setBusiness(businessData);

        const data = isEntrepreneur
          ? await getPublishedReport(businessData.id)
          : await getInternalReport(businessData.id);
        setReport(data || null);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load CRAT report.");
      } finally {
        setLoading(false);
      }
    };

    if (userDetails?.uuid) load();
  }, [isEntrepreneur, userDetails?.uuid]);

  const domainRows = useMemo(() => {
    return DOMAIN_CONFIG.map((item) => {
      const domain = report?.domainScores?.[item.apiKey] || {};
      const percentage = toPercentFromDomain(domain);
      const reviewedQuestions = Number(domain.reviewedQuestions || 0);
      const totalQuestions = Number(domain.totalQuestions || 0);
      const coverage =
        totalQuestions > 0
          ? Math.round((reviewedQuestions / totalQuestions) * 100)
          : 0;

      return {
        ...item,
        percentage,
        average: Number(domain.average || 0),
        weight: Math.round(Number(domain.weight || 0) * 100),
        weightedContribution: Number(domain.weightedContribution || 0),
        reviewedQuestions,
        totalQuestions,
        coverage,
        status: getStatusLabel(percentage),
      };
    });
  }, [report]);

  const chartScoreData = useMemo(() => {
    const base = {
      commercial: { percentage: 0, status: "Not Ready" },
      financial: { percentage: 0, status: "Not Ready" },
      operations: { percentage: 0, status: "Not Ready" },
      legal: { percentage: 0, status: "Not Ready" },
      general_status: "Not Ready",
    };

    if (!report) return base;

    domainRows.forEach((domain) => {
      base[domain.chartKey] = {
        percentage: domain.percentage,
        status: domain.status,
      };
    });

    const overallPercent = Math.round(
      domainRows.reduce((sum, domain) => sum + domain.percentage, 0) /
        domainRows.length,
    );
    base.general_status = getStatusLabel(overallPercent);

    return base;
  }, [domainRows, report]);

  const overallPercent = useMemo(() => {
    return Math.round(
      domainRows.reduce((sum, domain) => sum + domain.percentage, 0) /
        (domainRows.length || 1),
    );
  }, [domainRows]);

  const strongestDomain = useMemo(() => {
    return (
      [...domainRows].sort((a, b) => b.percentage - a.percentage)[0] || null
    );
  }, [domainRows]);

  const weakestDomain = useMemo(() => {
    return (
      [...domainRows].sort((a, b) => a.percentage - b.percentage)[0] || null
    );
  }, [domainRows]);

  const handleDownloadPdf = async () => {
    if (pdfLoading || !report) return;

    try {
      setPdfLoading(true);
      const toastId = toast.loading("Generating PDF report...");

      const { domainDataForPdf, scoreDataForPdf } = getPdfPayloadFromReport(
        report,
        domainRows,
      );

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

      const { filename } = await generateCapitalReadinessPDF(
        domainDataForPdf,
        scoreDataForPdf,
        pdfUserContext,
        (message) => {
          toast.loading(message, { id: toastId });
        },
      );

      toast.success(`Report downloaded: ${filename}`, { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Failed to download PDF report.");
    } finally {
      setPdfLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading report...</div>;
  }

  if (!report) {
    return (
      <div className="mx-auto max-w-6xl p-4 md:p-6">
        <Breadcrumb pageName="CRAT Report" />
        <div className="rounded-2xl border border-black/10 bg-white p-6 text-sm text-slate-600">
          No published report available yet.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-6">
      <Breadcrumb pageName="CRAT Report" />

      <div className="mb-4 flex justify-end">
        <button
          onClick={handleDownloadPdf}
          disabled={pdfLoading || !report}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pdfLoading ? "Generating PDF..." : "Download PDF Report"}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-black/10 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Overall Readiness
          </p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {overallPercent}%
          </p>
          <p className="mt-1 text-xs text-slate-600">
            {getStatusLabel(overallPercent)}
          </p>
        </div>

        <div className="rounded-xl border border-black/10 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Overall (0-5)
          </p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {Number(report.overallScore5 || 0).toFixed(2)}
          </p>
          <p className="mt-1 text-xs text-slate-600">
            Reviewer scoring average
          </p>
        </div>

        <div className="rounded-xl border border-black/10 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Completeness
          </p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {report.reviewedQuestionsTotal}/{report.totalQuestions}
          </p>
          <p className="mt-1 text-xs text-slate-600">
            {report.incomplete ? "Incomplete" : "Complete"}
          </p>
        </div>

        <div className="rounded-xl border border-black/10 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Best Domain
          </p>
          <p className="mt-2 text-xl font-semibold text-slate-900">
            {strongestDomain?.label || "-"}
          </p>
          <p className="mt-1 text-xs text-slate-600">
            {strongestDomain?.percentage || 0}%
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-black/10 bg-white p-2 sm:p-4">
        <div className="p-2 sm:p-3">
          <h3 className="text-lg font-semibold text-slate-900">
            Performance Overview
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Domain readiness and overall readiness using full domain question
            counts.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-5 md:gap-6 2xl:gap-7.5">
          <div className="col-span-1 md:col-span-3">
            <BusinessDomainScores
              initialScoreData={chartScoreData}
              userDetails={userDetails}
            />
          </div>
          <div className="col-span-1 md:col-span-2">
            <PerformanceDistribution
              initialScoreData={chartScoreData}
              userDetails={userDetails}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-black/10 bg-white p-4 md:p-5">
        <h3 className="text-base font-semibold text-slate-900">
          Domain Insights
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          Percentages below are normalized against all questions in each domain.
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[920px] w-full table-fixed">
            <thead className="bg-slate-100">
              <tr>
                <th className="w-40 border-b border-black/10 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                  Domain
                </th>
                <th className="w-24 border-b border-black/10 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                  Percent
                </th>
                <th className="w-28 border-b border-black/10 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                  Status
                </th>
                <th className="w-40 border-b border-black/10 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                  Questions
                </th>
                <th className="w-28 border-b border-black/10 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                  Coverage
                </th>
                <th className="w-24 border-b border-black/10 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                  Weight
                </th>
                <th className="w-44 border-b border-black/10 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                  Weighted Contribution
                </th>
              </tr>
            </thead>
            <tbody>
              {domainRows.map((domain) => (
                <tr key={domain.apiKey} className="bg-white">
                  <td className="border-b border-black/10 px-3 py-3 text-sm font-medium text-slate-900">
                    {domain.label}
                  </td>
                  <td className="border-b border-black/10 px-3 py-3 text-sm text-slate-700">
                    {domain.percentage}%
                  </td>
                  <td className="border-b border-black/10 px-3 py-3 text-sm text-slate-700">
                    {domain.status}
                  </td>
                  <td className="border-b border-black/10 px-3 py-3 text-sm text-slate-700">
                    {domain.reviewedQuestions}/{domain.totalQuestions}
                  </td>
                  <td className="border-b border-black/10 px-3 py-3 text-sm text-slate-700">
                    {domain.coverage}%
                  </td>
                  <td className="border-b border-black/10 px-3 py-3 text-sm text-slate-700">
                    {domain.weight}%
                  </td>
                  <td className="border-b border-black/10 px-3 py-3 text-sm text-slate-700">
                    {domain.weightedContribution.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-black/10 bg-white p-4 md:p-5">
        <h3 className="text-base font-semibold text-slate-900">
          Report Narrative
        </h3>
        <p className="mt-2 text-sm text-slate-700">
          Overall readiness is {overallPercent}%, with strongest performance in{" "}
          <span className="font-semibold">{strongestDomain?.label || "-"}</span>{" "}
          and the biggest improvement opportunity in{" "}
          <span className="font-semibold">{weakestDomain?.label || "-"}</span>.
        </p>
        <p className="mt-2 text-sm text-slate-700">
          Completion currently stands at {report.reviewedQuestionsTotal} of{" "}
          {report.totalQuestions} questions. Increasing coverage in low-answered
          domains will improve score accuracy and better reflect true readiness.
        </p>
      </div>
    </div>
  );
};

export default Report;
