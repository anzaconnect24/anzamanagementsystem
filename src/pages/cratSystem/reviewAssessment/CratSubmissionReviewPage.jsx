import React, { useContext, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useSearchParams } from "react-router-dom";
import {
  MdOutlineAssessment,
  MdOutlinePublic,
  MdShowChart,
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
        requiredAttachment: question?.requiredAttachment || "-",
        draftScore:
          draft.score === "" ||
          draft.score === null ||
          draft.score === undefined
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
    return Array.from(
      new Map(
        (activeDomainSection?.rows || [])
          .filter((row) => {
            const requiredAttachment = String(
              row.requiredAttachment || "",
            ).trim();

            return requiredAttachment && requiredAttachment !== "-";
          })
          .map((row) => [String(row.requiredAttachment).trim(), row]),
      ).values(),
    );
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

                <div className="relative z-10 flex min-h-[210px] flex-col justify-end gap-5 p-7 text-white md:flex-row md:items-end md:justify-between">
                  <div>
                    <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-semibold backdrop-blur-sm">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
                      CRAT Assessment Domain
                    </span>

                    <h1 className="text-3xl font-bold md:text-4xl">
                      {activeDomainSection.domainLabel} Domain
                    </h1>

                    <p className="mt-3 max-w-2xl text-sm leading-6 text-white/85">
                      Review submitted evidence, assign scores, and add concise
                      reviewer comments for this domain.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-sm backdrop-blur-md">
                    <div className="flex items-center justify-between gap-6">
                      <span className="text-white/70">Role</span>

                      <span className="font-semibold">
                        {isAdmin ? "Admin" : isReviewer ? "Reviewer" : "Viewer"}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-6">
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
                      onClick={() => setActiveDomainKey(domainKey)}
                      className={`rounded-2xl border p-4 text-left shadow-sm transition ${
                        isActive
                          ? "border-blue-300 bg-blue-600 text-white"
                          : "border-slate-200 bg-white text-slate-800 hover:bg-blue-50"
                      }`}
                    >
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                          isActive
                            ? "bg-white/15 text-white"
                            : "bg-blue-50 text-blue-600"
                        }`}
                      >
                        <SummaryIcon className="text-lg" />
                      </div>

                      <p
                        className={`mt-3 text-2xl font-bold ${
                          isActive ? "text-white" : "text-slate-900"
                        }`}
                      >
                        {summary?.weightedPercent || 0}
                      </p>

                      <p className="mt-1 text-sm font-semibold">
                        {section.domainLabel} Domain
                      </p>
                    </button>
                  );
                })}
              </section>

              <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
                <div className="space-y-5">
                  {(activeDomainSection.rows || []).map((row, index) => (
                    <section
                      key={row.id}
                      className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm"
                    >
                      <div className="mb-3 flex items-start gap-2">
                        <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
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
                            placeholder="Add concise reviewer feedback..."
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
                              {row.draftScore === ""
                                ? "Not rated"
                                : row.draftScore}
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
                              const isSelected =
                                Number(row.draftScore) === score;

                              return (
                                <button
                                  key={score}
                                  type="button"
                                  onClick={() =>
                                    setDraftValue(
                                      row.questionId,
                                      "score",
                                      score,
                                    )
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
                        </div>
                      </div>
                    </section>
                  ))}

                  {canEdit && (
                    <div className="flex flex-col gap-3 pt-2 md:flex-row">
                      <button
                        onClick={handleSave}
                        disabled={saving || submitting}
                        className="rounded-xl border border-blue-200 bg-white px-5 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {saving ? "Saving..." : "Save Scores"}
                      </button>

                      <button
                        onClick={handleSubmit}
                        disabled={saving || submitting}
                        className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {submitting ? "Submitting..." : "Submit for Review"}
                      </button>
                    </div>
                  )}
                </div>

                <aside className="h-fit rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-4">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Required Documents
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Review the supporting evidence requested by admin for this
                    domain.
                  </p>

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