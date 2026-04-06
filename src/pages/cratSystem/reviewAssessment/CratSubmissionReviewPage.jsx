import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useSearchParams } from "react-router-dom";

import { UserContext } from "@/layouts/DashboardLayout";
import {
  getCatalog,
  getCurrentAssessment,
  saveReviewerScores,
  submitReviewerAssessment,
} from "@/controllers/crat_controller";
import Breadcrumb from "../../../component/Breadcrumb";

const RATING_OPTIONS = [
  { value: 1, label: "1 - Very Weak" },
  { value: 2, label: "2 - Weak" },
  { value: 3, label: "3 - Moderate" },
  { value: 4, label: "4 - Strong" },
  { value: 5, label: "5 - Very Strong" },
];

const DOMAIN_LABELS = {
  commercial_marketing: "Commercial & Marketing",
  financial: "Financial",
  legal_compliance: "Legal & Compliance",
  operations: "Operations",
};

const DOMAIN_WEIGHTS = {
  financial: 35,
  commercial_marketing: 25,
  legal_compliance: 25,
  operations: 15,
};

const DOMAIN_ORDER = [
  "financial",
  "commercial_marketing",
  "legal_compliance",
  "operations",
];

const getFileNameFromUrl = (url = "") => {
  try {
    const clean = String(url).split("?")[0];
    return decodeURIComponent(clean.split("/").pop() || "Uploaded file");
  } catch {
    return "Uploaded file";
  }
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
  const [autoSaveState, setAutoSaveState] = useState("idle");
  const autoSaveTimerRef = useRef(null);
  const hasHydratedDraftsRef = useRef(false);

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
              normalizedScore >= 1 && normalizedScore <= 5
                ? normalizedScore
                : "",
            reviewerComment: answer.reviewerComment || "",
          };
        });
        setDrafts(nextDrafts);
        hasHydratedDraftsRef.current = false;
        setAutoSaveState("idle");
      } catch (error) {
        console.error(error);
        toast.error("Failed to load submission details.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [businessId]);

  const canEdit = useMemo(() => {
    const status = assessmentPayload?.assessment?.status;
    return (
      isReviewer && ["assigned", "in_review", "admin_rejected"].includes(status)
    );
  }, [assessmentPayload?.assessment?.status, isReviewer]);

  const rows = useMemo(() => {
    return (assessmentPayload?.answers || []).map((answer) => {
      const question = questionMap[answer.questionId] || null;
      const draft = drafts[answer.questionId] || {
        score:
          Number(answer.score) >= 1 && Number(answer.score) <= 5
            ? Number(answer.score)
            : "",
        reviewerComment: answer.reviewerComment || "",
      };

      return {
        ...answer,
        questionText: question?.questionTextEn || answer.questionCode || "-",
        requiredAttachment: question?.requiredAttachment || "-",
        draftScore: Number(draft.score || 0),
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
        domainLabel: DOMAIN_LABELS[key] || key,
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
      const ratedCount = domainRows.filter(
        (row) => Number(row.draftScore) >= 1 && Number(row.draftScore) <= 5,
      ).length;
      const earnedScore = domainRows.reduce(
        (sum, row) => sum + (Number(row.draftScore) || 0),
        0,
      );
      const totalQuestions = catalogDomainCounts[domainKey] || 0;
      const maxScore = totalQuestions * 5;
      const percent =
        maxScore > 0 ? Math.round((earnedScore / maxScore) * 100) : 0;
      const weight = DOMAIN_WEIGHTS[domainKey] || 0;
      const weightedPercent = Math.round((percent * weight) / 100);

      acc[domainKey] = {
        totalQuestions,
        ratedCount,
        percent,
        weight,
        weightedPercent,
      };

      return acc;
    }, {});
  }, [catalogDomainCounts, groupedDomainRows, questionMap, rows]);

  const summaryCardOrder = useMemo(() => {
    const extraDomains = Object.keys(domainSummaries).filter(
      (key) => !DOMAIN_ORDER.includes(key),
    );

    return [...DOMAIN_ORDER, ...extraDomains].filter(
      (key) => domainSummaries[key],
    );
  }, [domainSummaries]);

  const totalWeightPercent = useMemo(() => {
    return summaryCardOrder.reduce((sum, domainKey) => {
      return sum + (DOMAIN_WEIGHTS[domainKey] || 0);
    }, 0);
  }, [summaryCardOrder]);

  const totalWeightedPercent = useMemo(() => {
    return summaryCardOrder.reduce((sum, domainKey) => {
      const summary = domainSummaries[domainKey];
      return sum + (summary?.weightedPercent || 0);
    }, 0);
  }, [domainSummaries, summaryCardOrder]);

  const buildScoresPayload = (currentRows) => {
    return currentRows.map((row) => ({
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

  useEffect(() => {
    if (!canEdit || !assessmentPayload?.assessment?.id || loading) return;

    if (!hasHydratedDraftsRef.current) {
      hasHydratedDraftsRef.current = true;
      return;
    }

    setAutoSaveState("pending");

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        setAutoSaveState("saving");
        await persistScores(rows);
        setAutoSaveState("saved");
      } catch (error) {
        console.error(error);
        setAutoSaveState("error");
      }
    }, 1200);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [assessmentPayload?.assessment?.id, canEdit, loading, rows]);

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
      setAutoSaveState("saved");
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
      toast.success("Review submitted to admin.");

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
    <div className="mx-auto max-w-7xl p-4 md:p-6">
      <Breadcrumb
        prevLink={""}
        prevPage={"Back"}
        pageName="CRAT Submission Review"
      />

      <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm md:p-7">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Submission Assessment Table
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Same CRAT structure with reviewer fields for rating, score, and
              reviewer comments.
            </p>
          </div>

          <div className="rounded-lg border border-black/10 bg-slate-50 px-3 py-2 text-xs text-slate-700">
            Role:{" "}
            {isAdmin ? "Admin (Read Only)" : isReviewer ? "Reviewer" : "Viewer"}
            {assessmentPayload?.assessment?.status
              ? ` | Status: ${assessmentPayload.assessment.status}`
              : ""}
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-slate-600">Loading submission...</p>
        ) : (
          <>
            {groupedDomainRows.length > 0 && (
              <div className="mb-4 grid gap-3 md:grid-cols-5">
                {summaryCardOrder.map((domainKey) => {
                  const summary = domainSummaries[domainKey];
                  return (
                    <div
                      key={`summary-${domainKey}`}
                      className="rounded-xl border border-primary bg-primary p-3"
                    >
                      <p className="text-xs font-semibold uppercase tracking-wide text-white/80">
                        {(DOMAIN_LABELS[domainKey] || domainKey) + " Weighted"}
                      </p>
                      <p className="mt-1 text-2xl font-semibold text-white">
                        {summary?.weightedPercent || 0}%
                      </p>
                      <p className="mt-1 text-xs text-white">
                        Weight: {summary?.weight || 0}%
                      </p>
                      <p className="text-xs text-white">
                        Domain score: {summary?.percent || 0}%
                      </p>
                    </div>
                  );
                })}

                <div className="rounded-xl border border-primary bg-primary p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-white/80">
                    Total Weighted Score
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-white">
                    {totalWeightedPercent}%
                  </p>
                  <p className="mt-1 text-xs text-white">
                    Total weight: {totalWeightPercent}%
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-5">
              {groupedDomainRows.map((section) => {
                const summary = domainSummaries[section.domainKey];

                return (
                  <section
                    key={section.domainKey}
                    className="rounded-xl border border-black/10"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-primary/20 bg-primary/5 px-4 py-3">
                      <h2 className="text-sm font-semibold uppercase tracking-wide text-primary">
                        {section.domainLabel}
                      </h2>
                      <div className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">
                        {summary?.percent || 0}%
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="min-w-[1950px] w-full table-auto bg-white">
                        <thead className="bg-slate-100">
                          <tr>
                            <th className="w-12 border-b border-black/10 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                              #
                            </th>
                            <th className="w-[560px] border-b border-black/10 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                              Assessment Scope & Question
                            </th>
                            <th className="w-56 border-b border-black/10 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                              Required Attachment
                            </th>
                            <th className="w-72 border-b border-black/10 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                              Attachment
                            </th>
                            <th className="w-72 border-b border-black/10 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                              Entrepreneur Remarks
                            </th>
                            <th className="w-56 border-b border-black/10 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                              Rating
                            </th>
                            <th className="w-20 border-b border-black/10 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                              Score
                            </th>
                            <th className="w-72 border-b border-black/10 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                              Reviewer Comment
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {section.rows.map((row, index) => {
                            const hasAttachment = Boolean(row.attachment);
                            return (
                              <tr
                                key={row.id}
                                className={`align-top ${hasAttachment ? "bg-primary/5" : "bg-white"}`}
                              >
                                <td className="border-b border-black/10 px-3 py-3 text-sm text-slate-700">
                                  {index + 1}
                                </td>
                                <td className="w-[560px] border-b border-black/10 px-3 py-3 text-sm leading-7 text-slate-800">
                                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                    {row.questionCode || "-"}
                                  </div>
                                  {row.questionText}
                                </td>
                                <td className="border-b border-black/10 px-3 py-3 text-sm text-slate-700">
                                  {row.requiredAttachment}
                                </td>
                                <td className="border-b border-black/10 px-3 py-3 text-sm">
                                  {row.attachment ? (
                                    <a
                                      href={row.attachment}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="block truncate text-xs font-medium text-primary hover:underline"
                                      title={getFileNameFromUrl(row.attachment)}
                                    >
                                      View: {getFileNameFromUrl(row.attachment)}
                                    </a>
                                  ) : (
                                    <span className="text-xs text-slate-500">
                                      No attachment
                                    </span>
                                  )}
                                </td>
                                <td className="border-b border-black/10 px-3 py-3 text-sm text-slate-700">
                                  {row.entrepreneurComment || "-"}
                                </td>
                                <td className="border-b border-black/10 px-3 py-3">
                                  <select
                                    className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm"
                                    value={row.draftScore}
                                    onChange={(e) =>
                                      setDraftValue(
                                        row.questionId,
                                        "score",
                                        Number(e.target.value),
                                      )
                                    }
                                    disabled={!canEdit}
                                  >
                                    <option value="">Select rating</option>
                                    {RATING_OPTIONS.map((option) => (
                                      <option
                                        key={option.value}
                                        value={option.value}
                                      >
                                        {option.label}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td className="border-b border-black/10 px-3 py-3 text-sm font-semibold text-slate-800">
                                  {row.draftScore || "-"}
                                </td>
                                <td className="border-b border-black/10 px-3 py-3">
                                  <textarea
                                    rows={3}
                                    className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm"
                                    value={row.draftReviewerComment}
                                    onChange={(e) =>
                                      setDraftValue(
                                        row.questionId,
                                        "reviewerComment",
                                        e.target.value,
                                      )
                                    }
                                    disabled={!canEdit}
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </section>
                );
              })}
            </div>

            {groupedDomainRows.length === 0 && (
              <p className="mt-4 rounded-lg border border-primary/25 bg-primary/10 px-3 py-2 text-sm text-primary">
                No answers found for this submission.
              </p>
            )}

            {canEdit && (
              <div className="mt-5 flex flex-wrap gap-3">
                <div className="flex items-center rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-medium text-primary">
                  {autoSaveState === "saving" && "Auto-save: saving..."}
                  {autoSaveState === "pending" &&
                    "Auto-save: pending changes..."}
                  {autoSaveState === "saved" && "Auto-save: all changes saved"}
                  {autoSaveState === "error" &&
                    "Auto-save: failed (retry on next change)"}
                  {autoSaveState === "idle" && "Auto-save: ready"}
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving || submitting}
                  className="rounded-lg border border-primary/30 bg-white px-4 py-2 text-sm font-semibold text-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Scores"}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={saving || submitting}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit Review To Admin"}
                </button>
              </div>
            )}

            {!canEdit && isReviewer && (
              <p className="mt-4 text-sm text-slate-600">
                This review is no longer editable in the current status.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CratSubmissionReviewPage;
