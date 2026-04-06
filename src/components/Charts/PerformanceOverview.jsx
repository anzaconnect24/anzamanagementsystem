"use client";
import React, { useState, useEffect, useContext } from "react";
import dynamic from "@/utils/dynamic";
import Loader from "@/components/common/Loader";
import { useTranslation } from "@/locales";
import { getReportData } from "@/controllers/crat_general_controller";
import {
  getPublishedReport,
  getUserBusiness,
} from "@/controllers/crat_controller";
import { UserContext } from "@/layouts/DashboardLayout";

const BusinessDomainScores = dynamic(
  () => import("@/components/Charts/BusinessDomainScores"),
  { ssr: false, loading: () => <Loader /> },
);
const PerformanceDistribution = dynamic(
  () => import("@/components/Charts/PerformanceDistribution"),
  { ssr: false, loading: () => <Loader /> },
);

// ---------------------------------------------------------------------------
// Domain classifier – mirrors Report.jsx getDomainEndpoint
// ---------------------------------------------------------------------------
const getDomainForSubDomain = (subDomain = "") => {
  const d = String(subDomain).toLowerCase().trim();

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

  if (marketItems.includes(d)) return "commercial";
  if (financialItems.includes(d)) return "financial";
  if (operationsItems.includes(d)) return "operations";
  if (legalItems.includes(d)) return "legal";
  return null;
};

// ---------------------------------------------------------------------------
// Score calculator – mirrors Report.jsx calculateScoreDataFromReportData
// ---------------------------------------------------------------------------
const calculateScores = (reportData, t) => {
  if (!reportData) return null;

  const makeStatus = (pct) =>
    pct >= 70 ? t("report.ready", "Ready") : t("report.notReady", "Not Ready");

  // Structured object keyed by domain
  if (!Array.isArray(reportData)) {
    const domains = ["commercial", "financial", "operations", "legal"];
    const result = {};
    domains.forEach((domain) => {
      if (reportData[domain]) {
        let total = 0,
          count = 0;
        Object.values(reportData[domain]).forEach((subdomain) => {
          if (Array.isArray(subdomain)) {
            subdomain.forEach((item) => {
              if (typeof item.score === "number") {
                total += item.score;
                count += 1;
              }
            });
          }
        });
        const pct = Math.round(count > 0 ? (total / (count * 2)) * 100 : 0);
        result[domain] = { percentage: pct, status: makeStatus(pct) };
      }
    });
    const vals = Object.values(result).map((v) => v.percentage);
    const overall = vals.length
      ? vals.reduce((s, v) => s + v, 0) / vals.length
      : 0;
    result.general_status = makeStatus(Math.round(overall));
    return result;
  }

  // Flat array response
  const buckets = {
    commercial: { actual: 0, count: 0 },
    financial: { actual: 0, count: 0 },
    operations: { actual: 0, count: 0 },
    legal: { actual: 0, count: 0 },
  };
  reportData.forEach((row) => {
    const score = typeof row?.score === "number" ? row.score : null;
    if (!row?.subDomain || score === null) return;
    const key = getDomainForSubDomain(row.subDomain);
    if (key && buckets[key]) {
      buckets[key].actual += score;
      buckets[key].count += 1;
    }
  });
  const result = {};
  Object.entries(buckets).forEach(([key, { actual, count }]) => {
    const pct = count > 0 ? Math.round((actual / (count * 2)) * 100) : 0;
    result[key] = { percentage: pct, status: makeStatus(pct) };
  });
  const vals = Object.values(result).map((v) => v.percentage);
  const overall = vals.length
    ? vals.reduce((s, v) => s + v, 0) / vals.length
    : 0;
  result.general_status = makeStatus(Math.round(overall));
  return result;
};

const makeFallback = (t) => ({
  commercial: { percentage: 0, status: t("report.notReady", "Not Ready") },
  financial: { percentage: 0, status: t("report.notReady", "Not Ready") },
  operations: { percentage: 0, status: t("report.notReady", "Not Ready") },
  legal: { percentage: 0, status: t("report.notReady", "Not Ready") },
  general_status: t("report.notReady", "Not Ready"),
});

const calculateScoresFromPublishedCrat = (publishedData, t) => {
  if (!publishedData || !publishedData.domainScores) return null;

  const makeStatus = (pct) =>
    pct >= 70 ? t("report.ready", "Ready") : t("report.notReady", "Not Ready");

  const domainMap = {
    commercial: "commercial_marketing",
    financial: "financial",
    operations: "operations",
    legal: "legal_compliance",
  };

  const result = {};

  Object.entries(domainMap).forEach(([uiKey, apiKey]) => {
    const domain = publishedData.domainScores?.[apiKey];
    const average = Number(domain?.average || 0);
    const reviewedQuestions = Number(domain?.reviewedQuestions || 0);
    const totalQuestions = Number(domain?.totalQuestions || 0);

    // Normalize by full domain question count so partial completion does not
    // appear as full (e.g. 1 answered question scored 5/5 in a 6-question domain).
    const earnedScore = average * reviewedQuestions;
    const maxDomainScore = totalQuestions * 5;
    const percentage =
      maxDomainScore > 0 ? Math.round((earnedScore / maxDomainScore) * 100) : 0;

    result[uiKey] = {
      percentage,
      status: makeStatus(percentage),
    };
  });

  const domainValues = [
    result.commercial?.percentage || 0,
    result.financial?.percentage || 0,
    result.operations?.percentage || 0,
    result.legal?.percentage || 0,
  ];
  const overallPct = Math.round(
    domainValues.reduce((sum, value) => sum + value, 0) / domainValues.length,
  );
  result.general_status = makeStatus(overallPct);
  result.overallScore = overallPct;

  return result;
};

// ---------------------------------------------------------------------------
// PerformanceOverview
//
// Self-loads score data via getReportData (same source as Report.jsx).
// Props:
//   userDetails  {object}  User context – used for UUID
//   user_uuid    {string}  Optional override (e.g. admin viewing another user)
//   className    {string}  Extra wrapper classes
// ---------------------------------------------------------------------------
const PerformanceOverview = ({
  userDetails: userDetailsProp,
  user_uuid,
  refreshKey = 0,
  className = "",
}) => {
  const { t } = useTranslation();
  const ctx = useContext(UserContext);
  const userDetails = userDetailsProp || ctx?.userDetails;

  const [scoreData, setScoreData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uuid = user_uuid || userDetails?.uuid;
    if (!uuid) return;

    const loadScores = async () => {
      setLoading(true);

      try {
        // Prefer approved CRAT output (published report) when available.
        const business = await getUserBusiness(uuid);

        if (business?.id) {
          const published = await getPublishedReport(business.id);
          const publishedCalculated = calculateScoresFromPublishedCrat(
            published,
            t,
          );

          if (
            publishedCalculated &&
            Object.keys(publishedCalculated).length > 0
          ) {
            setScoreData(publishedCalculated);
            setLoading(false);
            return;
          }
        }
      } catch {
        // If published CRAT is not available yet, fall through to legacy source.
      }

      try {
        const responseData = await getReportData({ user_uuid: uuid });
        const calculated = calculateScores(responseData, t);
        setScoreData(
          calculated && Object.keys(calculated).length > 0
            ? calculated
            : makeFallback(t),
        );
      } catch {
        setScoreData(makeFallback(t));
      } finally {
        setLoading(false);
      }
    };

    loadScores();
  }, [user_uuid, userDetails?.uuid, refreshKey]);

  const initialScoreData =
    !loading && Object.keys(scoreData).length > 0 ? scoreData : null;

  return (
    <div className={`p-6 py-1 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        {t("report.performanceOverview", "Performance Overview")}
      </h3>

      {loading ? (
        <Loader />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5 md:gap-6 2xl:gap-7.5">
          <div className="col-span-1 md:col-span-3">
            <BusinessDomainScores
              initialScoreData={initialScoreData}
              userDetails={userDetails}
            />
          </div>
          <div className="col-span-1 md:col-span-2">
            <PerformanceDistribution
              initialScoreData={initialScoreData}
              userDetails={userDetails}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceOverview;
