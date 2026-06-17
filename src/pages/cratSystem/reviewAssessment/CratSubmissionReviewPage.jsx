import React, { useContext, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useSearchParams } from "react-router-dom";
import {
  MdOutlineAssessment,
  MdOutlinePublic,
  MdShowChart,
  MdOutlineWarningAmber,
  MdOutlineChecklist,
  MdOutlineTipsAndUpdates,
  MdOutlineFactCheck,
} from "react-icons/md";
import { RiFileChartLine, RiPieChartLine } from "react-icons/ri";

import { UserContext } from "@/layouts/DashboardLayout";
import {
  getCatalog,
  getCurrentAssessment,
  saveReviewerScores,
  submitReviewerAssessment,
} from "@/controllers/crat_controller";

const DOMAIN_LABELS = {
  commercial_marketing: "Commercial & Market",
  financial: "Financial",
  legal_compliance: "Legal & Compliance",
  operations: "Operations",
};

const SUMMARY_ICON_BY_DOMAIN = {
  commercial_marketing: MdOutlinePublic,
  financial: MdShowChart,
  legal_compliance: RiFileChartLine,
  operations: MdOutlineAssessment,
  total: RiPieChartLine,
};

const DOMAIN_WEIGHTS = {
  commercial_marketing: 25,
  financial: 35,
  legal_compliance: 25,
  operations: 15,
};

const DOMAIN_ORDER = [
  "commercial_marketing",
  "financial",
  "legal_compliance",
  "operations",
];

const DOMAIN_GUIDANCE = {
  commercial_marketing: {
    title: "Commercial & Market",
    objective:
      "Assess whether the fintech startup has a validated market need, credible customer traction, scalable revenue opportunities, and a defendable competitive position.",
    decisionPrompt:
      "Does the startup demonstrate strong customer demand, measurable traction, realistic market opportunity, and a scalable customer acquisition strategy?",
    reviewerChecks: [
      "Clarity of the fintech solution and customer pain point",
      "Strength of value proposition and differentiation",
      "Realistic market size assumptions and customer segmentation",
      "Revenue growth, active customer trends, and transaction activity",
      "Effectiveness of acquisition, onboarding, and retention channels",
      "Competitive positioning against banks, mobile money, fintechs, and informal alternatives",
      "Scalability of the business and go-to-market model",
    ],
    expectedEvidence: [
      "Product demo, screenshots, or platform walkthrough",
      "Customer metrics and active-user reports",
      "Revenue and transaction-volume reports",
      "Market research or TAM/SAM/SOM analysis",
      "Partnership agreements or distribution contracts",
      "Customer acquisition and retention analytics",
    ],
    redFlags: [
      "No clear customer problem being solved",
      "Weak or unsupported market-size assumptions",
      "Low customer retention or declining usage",
      "No evidence of repeat transactions or revenue consistency",
      "Overdependence on one partnership or sales channel",
      "No clear differentiation from competitors",
      "Customer acquisition channels are expensive or unscalable",
    ],
    reviewerTip:
      "Reviewers should prioritize evidence of product-market fit, traction quality, repeat customer behavior, and the startup’s ability to scale customer acquisition sustainably. Strong presentation quality alone should not result in high scoring without measurable market validation.",
  },
  financial: {
    title: "Financial",
    objective:
      "Assess financial discipline, reporting quality, cash-flow visibility, unit economics, and readiness to absorb external capital.",
    decisionPrompt:
      "Can the startup clearly explain how money enters, moves through, and leaves the business, and can the numbers support an investment decision?",
    reviewerChecks: [
      "Reliable financial records and management accounts",
      "Revenue trends and margin visibility",
      "Cash-flow discipline, burn rate, and runway clarity",
      "Realistic financial projections with clear assumptions",
      "Tax compliance and basic internal controls",
    ],
    expectedEvidence: [
      "Financial statements or management accounts",
      "Bank statements",
      "Tax clearance or tax filing evidence",
      "Revenue reports and invoices",
      "Cash-flow forecast or financial model",
    ],
    redFlags: [
      "No accounting records or unreliable financial data",
      "Unrealistic projections without assumptions",
      "No separation between personal and business expenses",
      "Missing tax filings or compliance evidence",
      "Unexplained revenue spikes or inconsistent figures",
    ],
    reviewerTip:
      "Financial is the highest-weighted domain. Prioritize reliability of evidence, quality of assumptions, and whether the startup can manage investor funds responsibly.",
  },
  legal_compliance: {
    title: "Legal & Compliance",
    objective:
      "Assess whether the startup has a sound legal foundation, proper governance records, regulatory compliance, and clear ownership structures.",
    decisionPrompt:
      "Is the business legally investable, compliant with core obligations, and free from unresolved ownership or regulatory risks?",
    reviewerChecks: [
      "Company registration and statutory documents",
      "Valid licenses, permits, and regulatory approvals",
      "Clear shareholding and governance arrangements",
      "Employment, supplier, and customer contracts",
      "Tax, sector, and reporting compliance",
    ],
    expectedEvidence: [
      "Certificate of incorporation or registration",
      "Business licenses and permits",
      "Tax compliance certificates",
      "Shareholder agreements or cap table",
      "Board minutes, contracts, or governance documents",
    ],
    redFlags: [
      "Unregistered entity",
      "Expired or missing licenses",
      "Ownership disputes or unclear shareholding",
      "Undisclosed litigation or regulatory exposure",
      "Missing tax or statutory compliance evidence",
    ],
    reviewerTip:
      "Legal gaps can block investment even where commercial traction is strong. Treat unresolved ownership, licensing, and tax issues as material risks.",
  },
  operations: {
    title: "Operations",
    objective:
      "Assess whether the startup has the people, systems, processes, and execution discipline required to scale sustainably.",
    decisionPrompt:
      "Can the business deliver consistently and scale without excessive dependency on the founder or informal processes?",
    reviewerChecks: [
      "Clear organizational structure and role ownership",
      "Documented SOPs and operational workflows",
      "Team capability and execution capacity",
      "Operational KPIs and reporting routines",
      "Technology, data, or quality-control systems",
    ],
    expectedEvidence: [
      "Organization chart",
      "SOPs or process manuals",
      "Team profiles or employment contracts",
      "Operational KPI dashboard",
      "MIS, CRM, inventory, or quality-control records",
    ],
    redFlags: [
      "High founder dependency",
      "No documented processes",
      "Manual records with weak controls",
      "No operational KPIs or reporting cadence",
      "Unclear accountability across the team",
    ],
    reviewerTip:
      "Operations should be assessed through execution discipline. A lean team can score well if roles, processes, and controls are clear and repeatable.",
  },
};

const SCORE_GUIDE = {
  0: {
    label: "Not assessed",
    description: "No rating has been assigned yet.",
    risk: "Unrated",
  },
  1: {
    label: "Very weak",
    description: "No credible evidence or major gaps that materially increase investor risk.",
    risk: "High risk",
  },
  2: {
    label: "Weak",
    description: "Limited evidence exists, but systems are incomplete or inconsistently applied.",
    risk: "High to moderate risk",
  },
  3: {
    label: "Moderate",
    description: "Basic structures exist, but maturity, consistency, or documentation still needs improvement.",
    risk: "Moderate risk",
  },
  4: {
    label: "Strong",
    description: "Evidence is credible, systems are structured, and gaps are manageable.",
    risk: "Low to moderate risk",
  },
  5: {
    label: "Investor-ready",
    description: "Evidence is comprehensive, governance is strong, and systems are scalable.",
    risk: "Low risk",
  },
};

const getRatingColor = (score) => {
  const value = Number(score);

  if (value <= 1) return "#dc2626";
  if (value === 2) return "#f97316";
  if (value === 3) return "#eab308";
  if (value === 4) return "#22c55e";
  return "#16a34a";
};

const getFileNameFromUrl = (url = "") => {
  try {
    const clean = String(url).split("?")[0];
    return decodeURIComponent(clean.split("/").pop() || "Uploaded file");
  } catch {
    return "Uploaded file";
  }
};

const toRequiredAttachmentList = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  const raw = String(value || "").trim();
  if (!raw) return [];

  if (raw.startsWith("[")) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item || "").trim()).filter(Boolean);
      }
    } catch (_) {
      return [raw];
    }
  }

  const splitItems = raw
    .split(/[\n;]+/)
    .map((item) => item.trim())
    .filter(Boolean);

  return splitItems.length > 0 ? splitItems : [raw];
};

const toTitle = (value = "") =>
  String(value)
    .split("_")
    .filter(Boolean)
    .map((piece) => piece[0]?.toUpperCase() + piece.slice(1))
    .join(" ");

const getStatusBadgeClass = (status = "") => {
  const map = {
    assigned: "bg-indigo-50 text-indigo-700 border-indigo-200",
    in_review: "bg-violet-50 text-violet-700 border-violet-200",
    admin_rejected: "bg-rose-50 text-rose-700 border-rose-200",
    review_submitted: "bg-blue-50 text-blue-700 border-blue-200",
    published: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };

  return map[status] || "bg-slate-50 text-slate-700 border-slate-200";
};

const getCompletionStats = (rows = []) => {
  const ratedRows = rows.filter((row) => row.draftScore !== "");
  const commentedRows = rows.filter((row) =>
    String(row.draftReviewerComment || "").trim(),
  );
  const attachedRows = rows.filter((row) => row.attachment);
  const requiredRows = rows.filter((row) => {
    const requiredAttachment = String(row.requiredAttachment || "").trim();
    return requiredAttachment && requiredAttachment !== "-";
  });

  const averageScore = ratedRows.length
    ? (
        ratedRows.reduce((sum, row) => sum + Number(row.draftScore || 0), 0) /
        ratedRows.length
      ).toFixed(1)
    : "0.0";

  return {
    totalQuestions: rows.length,
    ratedCount: ratedRows.length,
    commentedCount: commentedRows.length,
    requiredDocumentCount: requiredRows.length,
    attachedDocumentCount: attachedRows.length,
    averageScore,
  };
};

const DomainGuidancePanel = ({ domainKey }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const guidance = DOMAIN_GUIDANCE[domainKey];

  if (!guidance) return null;

  const tabs = [
    { key: "overview", label: "Overview", icon: MdOutlineAssessment },
    { key: "checks", label: "Reviewer Checks", icon: MdOutlineChecklist },
    { key: "evidence", label: "Evidence", icon: MdOutlineFactCheck },
    { key: "risks", label: "Risks", icon: MdOutlineWarningAmber },
    { key: "tips", label: "Tips", icon: MdOutlineTipsAndUpdates },
  ];

  return (
    <section className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wide text-blue-600">
            Reviewer guidance tool
          </p>
          <h2 className="mt-1 text-lg font-bold text-slate-900">
            {guidance.title} Review Guide
          </h2>
        </div>

        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                  isActive
                    ? "border-blue-200 bg-[#082d77] text-white"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                }`}
              >
                <Icon className="text-base" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        {activeTab === "overview" && (
          <div>
            <p className="text-sm leading-6 text-slate-700">
              {guidance.objective}
            </p>
            <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-xs font-semibold tracking-wide text-blue-700">
                Decision Prompt
              </p>
              <p className="mt-2 text-sm font-medium leading-6 text-blue-900">
                {guidance.decisionPrompt}
              </p>
            </div>
          </div>
        )}

        {activeTab === "checks" && (
          <GuidanceList items={guidance.reviewerChecks} tone="blue" />
        )}

        {activeTab === "evidence" && (
          <GuidanceList items={guidance.expectedEvidence} tone="emerald" />
        )}

        {activeTab === "risks" && (
          <GuidanceList items={guidance.redFlags} tone="rose" />
        )}

        {activeTab === "tips" && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-medium leading-6 text-amber-900">
              {guidance.reviewerTip}
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

const GuidanceList = ({ items = [], tone = "blue" }) => {
  const toneClasses = {
    blue: "border-blue-100 bg-blue-50 text-blue-800",
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-800",
    rose: "border-rose-100 bg-rose-50 text-rose-800",
  };

  return (
    <div className="grid gap-2 md:grid-cols-2">
      {items.map((item) => (
        <div
          key={item}
          className={`rounded-xl border px-3 py-2 text-sm font-medium leading-5 ${
            toneClasses[tone] || toneClasses.blue
          }`}
        >
          {item}
        </div>
      ))}
    </div>
  );
};

const ScoreInterpretation = ({ score }) => {
  const normalizedScore = score === "" ? 0 : Number(score);
  const guide = SCORE_GUIDE[normalizedScore] || SCORE_GUIDE[0];

  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold tracking-wide text-slate-500">
          Score interpretation
        </p>
        <span
          className="rounded-full px-3 py-1 text-xs font-bold text-white"
          style={{ backgroundColor: getRatingColor(normalizedScore) }}
        >
          {guide.risk}
        </span>
      </div>

      <p className="mt-2 text-sm font-bold text-slate-900">{guide.label}</p>
      <p className="mt-1 text-sm leading-6 text-slate-600">
        {guide.description}
      </p>
    </div>
  );
};







const CratSubmissionReviewPage = () => {
  const { userDetails } = useContext(UserContext);
  const [searchParams] = useSearchParams();
  const businessId = Number(searchParams.get("businessId"));

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [assessmentPayload, setAssessmentPayload] = useState(null);
  const [catalogDomainCounts, setCatalogDomainCounts] = useState({});
  const [questionMap, setQuestionMap] = useState({});
  const [drafts, setDrafts] = useState({});
  const [activeDomainKey, setActiveDomainKey] = useState("");

  const isReviewer = userDetails?.role === "Staff";
  const isAdmin = userDetails?.role === "Admin";

  useEffect(() => {
    const load = async () => {
      if (!businessId) {
        toast.error("Missing businessId.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const [catalog, current] = await Promise.all([
          getCatalog(businessId),
          getCurrentAssessment(businessId),
        ]);

        setAssessmentPayload(current || null);

        const map = {};
        const nextCatalogDomainCounts = {};

        Object.values(catalog?.domains || {}).forEach((domainRows) => {
          (domainRows || []).forEach((question) => {
            map[question.id] = question;
          });
        });

        Object.entries(catalog?.domains || {}).forEach(
          ([domainKey, domainRows]) => {
            nextCatalogDomainCounts[domainKey] = (domainRows || []).length;
          },
        );

        setCatalogDomainCounts(nextCatalogDomainCounts);
        setQuestionMap(map);

        const nextDrafts = {};

        (current?.answers || []).forEach((answer) => {
          const normalizedScore = Number(answer.score);

          nextDrafts[answer.questionId] = {
            score:
              normalizedScore >= 0 && normalizedScore <= 5
                ? normalizedScore
                : "",
            reviewerComment: answer.reviewerComment || "",
          };
        });

        setDrafts(nextDrafts);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load submission details.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [businessId]);

  const currentStatus = assessmentPayload?.assessment?.status || "unknown";

  const canEdit = useMemo(() => {
    return (
      isReviewer &&
      ["assigned", "in_review", "admin_rejected"].includes(currentStatus)
    );
  }, [currentStatus, isReviewer]);

  const rows = useMemo(() => {
    return (assessmentPayload?.answers || []).map((answer) => {
      const question = questionMap[answer.questionId] || null;
      const draft = drafts[answer.questionId] || {
        score:
          Number(answer.score) >= 0 && Number(answer.score) <= 5
            ? Number(answer.score)
            : "",
        reviewerComment: answer.reviewerComment || "",
      };

      return {
        ...answer,
        questionText: question?.questionTextEn || answer.questionCode || "-",
        requiredAttachments: toRequiredAttachmentList(
          question?.requiredAttachments || question?.requiredAttachment,
        ),
        draftScore:
          draft.score === "" || draft.score === null || draft.score === undefined
            ? ""
            : Number(draft.score),
        draftReviewerComment: draft.reviewerComment || "",
      };
    });
  }, [assessmentPayload?.answers, drafts, questionMap]);

  const groupedDomainRows = useMemo(() => {
    const buckets = {};

    rows.forEach((row) => {
      const fallbackDomain = questionMap[row.questionId]?.domain;
      const domainKey = row.domain || fallbackDomain || "other";

      if (!buckets[domainKey]) {
        buckets[domainKey] = [];
      }

      buckets[domainKey].push(row);
    });

    const ordered = DOMAIN_ORDER.filter((key) => buckets[key]).map((key) => ({
      domainKey: key,
      domainLabel: DOMAIN_LABELS[key] || key,
      rows: buckets[key],
    }));

    const extras = Object.keys(buckets)
      .filter((key) => !DOMAIN_ORDER.includes(key))
      .map((key) => ({
        domainKey: key,
        domainLabel: DOMAIN_LABELS[key] || toTitle(key),
        rows: buckets[key],
      }));

    return [...ordered, ...extras];
  }, [questionMap, rows]);

  const domainSummaries = useMemo(() => {
    const rowsByDomain = rows.reduce((acc, row) => {
      const fallbackDomain = questionMap[row.questionId]?.domain;
      const domainKey = row.domain || fallbackDomain || "other";

      if (!acc[domainKey]) {
        acc[domainKey] = [];
      }

      acc[domainKey].push(row);
      return acc;
    }, {});

    const domainsToSummarize = Array.from(
      new Set([
        ...DOMAIN_ORDER,
        ...Object.keys(catalogDomainCounts || {}),
        ...Object.keys(rowsByDomain),
      ]),
    );

    return domainsToSummarize.reduce((acc, domainKey) => {
      const domainRows = rowsByDomain[domainKey] || [];

      const earnedScore = domainRows.reduce(
        (sum, row) =>
          sum +
          (row.draftScore !== "" && Number(row.draftScore) >= 0
            ? Number(row.draftScore)
            : 0),
        0,
      );

      const totalQuestions = catalogDomainCounts[domainKey] || 0;
      const maxScore = totalQuestions * 5;

      const percent =
        maxScore > 0 ? Math.round((earnedScore / maxScore) * 100) : 0;

      const fallbackWeight = Math.round(100 / (domainsToSummarize.length || 1));
      const weight = DOMAIN_WEIGHTS[domainKey] || fallbackWeight;

      const weightedPercent = Math.round((percent * weight) / 100);

      acc[domainKey] = {
        totalQuestions,
        percent,
        weight,
        weightedPercent,
      };

      return acc;
    }, {});
  }, [catalogDomainCounts, questionMap, rows]);

  useEffect(() => {
    if (!activeDomainKey && groupedDomainRows.length > 0) {
      setActiveDomainKey(groupedDomainRows[0].domainKey);
      return;
    }

    const activeStillExists = groupedDomainRows.some(
      (section) => section.domainKey === activeDomainKey,
    );

    if (activeDomainKey && !activeStillExists && groupedDomainRows.length > 0) {
      setActiveDomainKey(groupedDomainRows[0].domainKey);
    }
  }, [activeDomainKey, groupedDomainRows]);

  const activeDomainSection = useMemo(() => {
    return groupedDomainRows.find(
      (section) => section.domainKey === activeDomainKey,
    );
  }, [activeDomainKey, groupedDomainRows]);

  const requiredAttachments = useMemo(() => {
<<<<<<< HEAD
    return Array.from(
      new Map(
        (activeDomainSection?.rows || [])
          .filter((row) => {
            const requiredAttachment = String(row.requiredAttachment || "").trim();

            return requiredAttachment && requiredAttachment !== "-";
          })
          .map((row) => [String(row.requiredAttachment).trim(), row]),
      ).values(),
=======
    const rowsWithRequiredAttachments = (activeDomainSection?.rows || []).filter(
      (row) => (row.requiredAttachments || []).length > 0,
>>>>>>> 36fb9c74721059773c8e5d53b46aa6c206d8ad35
    );

    return rowsWithRequiredAttachments.map((row) => ({
      ...row,
      requiredAttachmentLabel: row.requiredAttachments.join(", "),
    }));
  }, [activeDomainSection?.rows]);

  const buildScoresPayload = (currentRows) => {
    return currentRows
      .filter((row) => row.draftScore !== "")
      .map((row) => ({
        questionId: row.questionId,
        score: Number(row.draftScore || 0),
        reviewerComment: row.draftReviewerComment || "",
      }));
  };

  const persistScores = async (currentRows) => {
    if (!assessmentPayload?.assessment?.id) return;

    const scores = buildScoresPayload(currentRows);

    await saveReviewerScores(assessmentPayload.assessment.id, scores);
  };

  const setDraftValue = (questionId, field, value) => {
    setDrafts((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    try {
      if (!assessmentPayload?.assessment?.id) return;

      setSaving(true);
      await persistScores(rows);
      toast.success("Reviewer scores saved.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save reviewer scores.");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (!assessmentPayload?.assessment?.id) return;

      setSubmitting(true);

      await submitReviewerAssessment(assessmentPayload.assessment.id);

      toast.success("Review submitted.");

      const refreshed = await getCurrentAssessment(businessId);

      setAssessmentPayload(refreshed || null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-slate-100 p-4 md:px-6 md:pb-6">
      {loading ? (
        <div className="space-y-4">
          <div className="h-[210px] animate-pulse rounded-[28px] bg-slate-200" />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-24 animate-pulse rounded-2xl bg-slate-200"
              />
            ))}
          </div>

          <div className="h-96 animate-pulse rounded-[26px] bg-slate-200" />
        </div>
      ) : groupedDomainRows.length === 0 ? (
        <section className="rounded-[26px] border border-blue-200 bg-blue-50 p-6 text-sm text-blue-700">
          No answers found for this submission.
        </section>
      ) : (
        <div className="space-y-5">
          {activeDomainSection && (
            <>
              <section className="relative overflow-hidden rounded-[28px] bg-black shadow-sm">
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage: "url('/images/business_tools_hero.svg')",
                  }}
                />

                <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/25" />

                <div className="relative z-10 flex min-h-[230px] flex-col justify-end gap-5 p-7 text-white md:flex-row md:items-end md:justify-between">
                  <div>
                    <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-semibold backdrop-blur-sm">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
                      CRAT Assessment Domain
                    </span>

                    <h1 className="text-3xl font-bold md:text-4xl">
                      {activeDomainSection.domainLabel} Domain
                    </h1>

                    <p className="mt-3 max-w-2xl text-sm leading-6 text-white/85">
                      Review submitted evidence, apply the domain guidance tool,
                      assign calibrated scores, and add evidence-based comments.
                    </p>
                  </div>

                  <div className="grid gap-3 rounded-2xl border border-white/15 bg-white/10 p-4 text-sm backdrop-blur-md sm:min-w-[260px]">
                    <div className="flex items-center justify-between gap-6">
                      <span className="text-white/70">Role</span>
                      <span className="font-semibold">
                        {isAdmin ? "Admin" : isReviewer ? "Reviewer" : "Viewer"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-6">
                      <span className="text-white/70">Status</span>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(
                          currentStatus,
                        )}`}
                      >
                        {toTitle(currentStatus)}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              <section className="grid gap-3 md:grid-cols-4">
                {DOMAIN_ORDER.map((domainKey) => {
                  const section = groupedDomainRows.find(
                    (item) => item.domainKey === domainKey,
                  );

                  if (!section) return null;

                  const summary = domainSummaries[domainKey];

                  const SummaryIcon =
                    SUMMARY_ICON_BY_DOMAIN[domainKey] || MdOutlineAssessment;

                  const isActive = activeDomainKey === domainKey;

                  return (
                    <button
                      key={domainKey}
                      type="button"
                      onClick={() => setActiveDomainKey(domainKey)}
                      className={`relative rounded-2xl border p-4 text-left shadow-sm transition ${
                        isActive
                          ? "border-blue-300 bg-[#082d77] text-white"
                          : "border-slate-200 bg-white text-slate-800 hover:bg-blue-50"
                      }`}
                    >
                      <div
                        className={`absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl ${
                          isActive
                            ? "bg-white/15 text-white"
                            : "bg-blue-50 text-blue-600"
                        }`}
                      >
                        <SummaryIcon className="text-lg" />
                      </div>

                      <div className="mt-3 flex items-end justify-between gap-3">
                        <p
                          className={`text-2xl font-bold ${
                            isActive ? "text-white" : "text-slate-900"
                          }`}
                        >
                          {summary?.weightedPercent || 0}
                        </p>
                      </div>

                      <p className="mt-1 text-sm font-semibold">
                        {section.domainLabel} Domain
                      </p>
                    </button>
                  );
                })}
              </section>

              <DomainGuidancePanel domainKey={activeDomainKey} />

              <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
                <div className="space-y-5">
                  {(activeDomainSection.rows || []).map((row, index) => (
                    <section
                      key={row.id}
                      className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm"
                    >
                      <div className="mb-3 flex items-start gap-2">
                        <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#082d77] text-[10px] font-bold text-white">
                          {index + 1}
                        </span>

                        <div className="flex-1">
                          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                            {row.questionCode || "-"}
                          </p>

                          <p className="text-sm leading-6 text-slate-800">
                            {row.questionText}
                          </p>
                        </div>
                      </div>

                      {row.entrepreneurComment && (
                        <div className="mb-4 ml-8 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="mb-2 text-xs font-semibold text-slate-500">
                            Entrepreneur Notes
                          </p>

                          <p className="text-sm leading-6 text-slate-700">
                            {row.entrepreneurComment}
                          </p>
                        </div>
                      )}

                      

                      <div className="ml-8 space-y-4">
                        <div>
                          <label className="mb-2 block text-xs font-semibold text-slate-600">
                            Reviewer Comment
                          </label>

                          <textarea
                            rows={5}
                            className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:bg-slate-100"
                            value={row.draftReviewerComment}
                            onChange={(e) =>
                              setDraftValue(
                                row.questionId,
                                "reviewerComment",
                                e.target.value,
                              )
                            }
                            disabled={!canEdit}
                            placeholder="Add evidence-based reviewer feedback. Example: score limited due to missing tax evidence or unsupported financial assumptions."
                          />
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <div className="mb-3 flex items-center justify-between">
                            <label className="text-xs font-semibold text-slate-600">
                              Rating
                            </label>

                            <span
                              className="rounded-full px-3 py-1 text-xs font-bold text-white"
                              style={{
                                backgroundColor:
                                  row.draftScore === ""
                                    ? "#64748b"
                                    : getRatingColor(row.draftScore),
                              }}
                            >
                              {row.draftScore === "" ? "Not rated" : row.draftScore}
                            </span>
                          </div>

                          <input
                            type="range"
                            min="0"
                            max="5"
                            step="1"
                            value={row.draftScore === "" ? 0 : row.draftScore}
                            onChange={(e) =>
                              setDraftValue(
                                row.questionId,
                                "score",
                                Number(e.target.value),
                              )
                            }
                            disabled={!canEdit}
                            className="w-full"
                            style={{
                              accentColor:
                                row.draftScore === ""
                                  ? "#2563eb"
                                  : getRatingColor(row.draftScore),
                            }}
                          />

                          <div className="mt-3 flex justify-between text-xs font-semibold">
                            {[0, 1, 2, 3, 4, 5].map((score) => {
                              const isSelected = Number(row.draftScore) === score;

                              return (
                                <button
                                  key={score}
                                  type="button"
                                  onClick={() =>
                                    setDraftValue(row.questionId, "score", score)
                                  }
                                  disabled={!canEdit}
                                  className="flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold transition hover:scale-110 disabled:cursor-not-allowed disabled:opacity-60"
                                  style={{
                                    backgroundColor: isSelected
                                      ? getRatingColor(score)
                                      : "#ffffff",
                                    borderColor: getRatingColor(score),
                                    color: isSelected
                                      ? "#ffffff"
                                      : getRatingColor(score),
                                  }}
                                >
                                  {score}
                                </button>
                              );
                            })}
                          </div>

                          <ScoreInterpretation score={row.draftScore} />
                        </div>
                      </div>
                    </section>
                  ))}

                  {canEdit && (
                    <div className="flex flex-col gap-3 pt-2 md:flex-row">
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving || submitting}
                        className="rounded-xl border border-blue-200 bg-white px-5 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {saving ? "Saving..." : "Save Scores"}
                      </button>

                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={saving || submitting}
                        className="rounded-xl bg-[#082d77] px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {submitting ? "Submitting..." : "Submit for Review"}
                      </button>
                    </div>
                  )}
                </div>

                <aside className="space-y-5 lg:sticky lg:top-4 lg:h-fit">

                  <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900">
                      Required Documents
                    </h2>

<<<<<<< HEAD
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Review the supporting evidence requested by admin for this
                      domain.
                    </p>
=======
                  <div className="mt-5 space-y-3">
                    {requiredAttachments.length > 0 ? (
                      requiredAttachments.map((row) => (
                        <div
                          key={`doc-${row.questionId}`}
                          className="rounded-2xl border border-slate-200 bg-white p-4"
                        >
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {row.requiredAttachmentLabel}
                          </p>
>>>>>>> 36fb9c74721059773c8e5d53b46aa6c206d8ad35

                    <div className="mt-5 space-y-3">
                      {requiredAttachments.length > 0 ? (
                        requiredAttachments.map((row) => (
                          <div
                            key={`doc-${row.requiredAttachment}`}
                            className="rounded-2xl border border-slate-200 bg-white p-4"
                          >
                            <p className="truncate text-sm font-semibold text-slate-800">
                              {row.requiredAttachment}
                            </p>

                            {row.attachment ? (
                              <a
                                href={row.attachment}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-2 block truncate text-xs font-semibold text-emerald-600 hover:underline"
                                title={getFileNameFromUrl(row.attachment)}
                              >
                                Attached: {getFileNameFromUrl(row.attachment)}
                              </a>
                            ) : (
                              <p className="mt-2 text-xs font-semibold text-amber-600">
                                Missing
                              </p>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-sm font-semibold text-slate-700">
                            No required attachments requested for this domain.
                          </p>
                        </div>
                      )}
                    </div>
                  </section>
                </aside>
              </div>
            </>
          )}

          {!canEdit && isReviewer && (
            <section className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
              This review is no longer editable in the current status.
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export default CratSubmissionReviewPage;
