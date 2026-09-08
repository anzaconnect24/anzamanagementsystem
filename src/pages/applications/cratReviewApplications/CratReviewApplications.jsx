import React, { useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import Breadcrumb from "@/component/Breadcrumb";
import axios from "axios";
import { server_url } from "@/utils/endpoint";
import { headers } from "@/utils/headers";
import { UserContext } from "@/layouts/DashboardLayout";
import {
  approveAssessment,
  deleteAssessment,
  getAdminQueue,
  rejectAssessment,
  runAiReview,
} from "@/controllers/crat_controller";
import { useNavigate } from "react-router-dom";

const TAB_KEYS = {
  active: "active",
  previous: "previous",
};

// Assessments are scored by AI on submission; the reviewer statuses are here
// only for ones that were already with a reviewer under the old flow.
const TAB_STATUS_FILTER = {
  [TAB_KEYS.active]:
    "submitted|ai_scoring|ai_scored|ai_failed|assigned|in_review|review_submitted",
  [TAB_KEYS.previous]: "published",
};

const getRoleFromAuthHeader = () => {
  try {
    const auth = headers?.Authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!token) return null;

    const parts = token.split(".");
    if (parts.length < 2) return null;

    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const normalized = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const payload = JSON.parse(atob(normalized));
    return payload?.role || null;
  } catch {
    return null;
  }
};

const CratReviewApplicationsPage = () => {
  const navigate = useNavigate();
  const { userDetails } = useContext(UserContext);
  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState([]);
  const [notes, setNotes] = useState({});
  const [activeTab, setActiveTab] = useState(TAB_KEYS.active);
  const [currentPage, setCurrentPage] = useState(1);
  // The assessment currently being re-scored, so only its button spins.
  const [rescoring, setRescoring] = useState(null);
  // Which AI analysis panels the admin has opened.
  const [openAnalysis, setOpenAnalysis] = useState({});
  const ITEMS_PER_PAGE = 6;

  const isAdmin = userDetails?.role === "Admin";
  const tokenRole = getRoleFromAuthHeader();
  const isAdminToken = tokenRole === "Admin";
  const canAccessAdminQueue = isAdmin && isAdminToken;

  const load = async (tab = activeTab) => {
    if (!canAccessAdminQueue) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const statusFilter = TAB_STATUS_FILTER[tab] || TAB_STATUS_FILTER.active;
      const rows = await getAdminQueue(statusFilter);
      setQueue(rows || []);
    } catch (error) {
      console.error(error);
      if (error?.response?.status === 403) {
        toast.error("You are not allowed to access the admin CRAT queue.");
      } else {
        toast.error("Failed to load admin CRAT queue.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userDetails) return;
    if (!canAccessAdminQueue) {
      setLoading(false);
      return;
    }

    load(activeTab);
  }, [activeTab, canAccessAdminQueue, userDetails]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const onRescore = async (assessmentId) => {
    setRescoring(assessmentId);
    try {
      const result = await runAiReview(assessmentId);
      toast.success(result?.message || "Scoring complete");
      await load();
    } catch (error) {
      console.error(error);
      toast.error(
        error?.response?.data?.message || "Scoring failed. Try again.",
      );
      // Refresh anyway: the server records why it failed.
      await load();
    } finally {
      setRescoring(null);
    }
  };

  const onApprove = async (assessmentId) => {
    try {
      await approveAssessment(assessmentId, notes[assessmentId] || "");
      toast.success("Assessment approved and published.");
      await load(activeTab);
    } catch (error) {
      console.error(error);
      toast.error("Failed to approve assessment.");
    }
  };

  const onReject = async (assessmentId) => {
    try {
      await rejectAssessment(assessmentId, notes[assessmentId] || "");
      toast.success("Assessment sent back to reviewer.");
      await load(activeTab);
    } catch (error) {
      console.error(error);
      toast.error("Failed to reject assessment.");
    }
  };

  const onDelete = async (assessmentId) => {
    const shouldDelete = window.confirm(
      "Delete this CRAT review application? This action cannot be undone.",
    );
    if (!shouldDelete) return;

    try {
      await deleteAssessment(assessmentId);
      toast.success("Assessment deleted.");
      await load(activeTab);
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete assessment.");
    }
  };

  const statusTone = (status = "") => {
    const value = String(status).toLowerCase();
    if (value === "submitted" || value === "ai_scoring") {
      return "bg-sky-100 text-sky-700 border-sky-200";
    }
    if (value === "assigned" || value === "in_review") {
      return "bg-violet-100 text-violet-700 border-violet-200";
    }
    if (value === "ai_scored" || value === "review_submitted") {
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    }
    if (value === "ai_failed") {
      return "bg-rose-100 text-rose-700 border-rose-200";
    }
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  const STATUS_LABELS = {
    ai_scoring: "Scoring...",
    ai_scored: "Scored - ready to publish",
    ai_failed: "Scoring failed",
  };

  const formatStatus = (status = "") =>
    STATUS_LABELS[status] ||
    String(status)
      .split("_")
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase() + part.slice(1))
      .join(" ");

  const submittedCount = queue.filter((item) =>
    ["submitted", "ai_scoring"].includes(item.status),
  ).length;
  const assignedCount = queue.filter((item) =>
    ["ai_failed"].includes(item.status),
  ).length;
  const reviewSubmittedCount = queue.filter((item) =>
    ["ai_scored", "review_submitted"].includes(item.status),
  ).length;

  const totalPages = Math.max(1, Math.ceil(queue.length / ITEMS_PER_PAGE));
  const paginatedQueue = queue.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Close reviewer dropdown when clicking outside

  return (
    <div className="w-full p-4 md:p-6">
      <Breadcrumb pageName="CRAT Assignment & Approval Queue" />
      <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm md:p-7">
        <h1 className="text-xl font-semibold text-slate-900 md:text-2xl">
          Admin Review Queue
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Review AI scoring and publish CRAT outcomes.
        </p>

        <div className="mt-4 rounded-xl bg-primary/10 p-4 text-sm text-slate-700">
          Keep assignments moving by selecting a reviewer, then finalize only
          after review submission.
        </div>

        {canAccessAdminQueue && !loading && (
          <div className="mt-4 inline-flex rounded-lg border border-black/10 bg-slate-100 p-1">
            <button
              onClick={() => setActiveTab(TAB_KEYS.active)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === TAB_KEYS.active
                  ? "bg-primary text-white"
                  : "text-slate-700 hover:bg-white"
              }`}
            >
              Active Queue
            </button>
            <button
              onClick={() => setActiveTab(TAB_KEYS.previous)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === TAB_KEYS.previous
                  ? "bg-primary text-white"
                  : "text-slate-700 hover:bg-white"
              }`}
            >
              Previous Submissions
            </button>
          </div>
        )}

        <div className="mt-5">
          {canAccessAdminQueue && !loading && activeTab === TAB_KEYS.active && (
            <div className="mb-5 grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-black/10 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Being scored
                </p>
                <p className="mt-2 text-2xl font-semibold text-primary">
                  {submittedCount}
                </p>
              </div>
              <div className="rounded-xl border border-black/10 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Scoring failed
                </p>
                <p className="mt-2 text-2xl font-semibold text-primary">
                  {assignedCount}
                </p>
              </div>
              <div className="rounded-xl border border-black/10 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Ready to publish
                </p>
                <p className="mt-2 text-2xl font-semibold text-primary">
                  {reviewSubmittedCount}
                </p>
              </div>
            </div>
          )}

          {!canAccessAdminQueue && !loading && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              This page is restricted to admin users.
            </div>
          )}

          {canAccessAdminQueue && loading ? (
            <p className="mt-4 text-sm text-slate-600">Loading queue...</p>
          ) : canAccessAdminQueue ? (
            <>
              <div className="mt-4 overflow-hidden rounded-xl border border-black/10 bg-white">
                <div className="overflow-x-auto">
                  <table className="min-w-[1480px] w-full table-fixed">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="w-14 border-b border-black/10 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                          #
                        </th>
                        <th className="w-64 border-b border-black/10 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                          Entrepreneur
                        </th>
                        <th className="w-40 border-b border-black/10 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                          Status
                        </th>
                        <th className="w-44 border-b border-black/10 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                          Updated
                        </th>
                        <th className="w-28 border-b border-black/10 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                          Open
                        </th>
                        <th className="w-64 border-b border-black/10 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                          Actions
                        </th>
                        <th className="w-72 border-b border-black/10 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                          Admin Notes
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedQueue.map((item, index) => {
                        // Compute currently assigned reviewer IDs from join table or fallback
                        // Scored by AI is the normal route to publishing;
                        // review_submitted covers assessments that were
                        // already with a reviewer under the old flow.
                        const canFinalizeReview = [
                          "ai_scored",
                          "review_submitted",
                        ].includes(item.status);
                        const isHistoryTab = activeTab === TAB_KEYS.previous;

                        const isScoring = item.status === "ai_scoring";
                        const scoringFailed = item.status === "ai_failed";
                        const analysisOpen = !!openAnalysis[item.id];

                        return (
                          <React.Fragment key={item.id}>
                            <tr className="align-top bg-white">
                              <td className="border-b border-black/10 px-3 py-3 text-sm text-slate-700">
                                {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                              </td>
                              <td className="border-b border-black/10 px-3 py-3">
                                <p className="text-sm font-semibold text-slate-900">
                                  {item.entrepreneur?.name || "Entrepreneur"}
                                </p>
                                <p className="mt-1 text-xs text-slate-600">
                                  {item.entrepreneur?.email || "No email"}
                                </p>
                              </td>
                              <td className="border-b border-black/10 px-3 py-3">
                                <span
                                  className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone(
                                    item.status,
                                  )}`}
                                >
                                  {formatStatus(item.status)}
                                </span>
                              </td>
                              <td className="border-b border-black/10 px-3 py-3 text-xs text-slate-700">
                                {item.updatedAt
                                  ? new Date(item.updatedAt).toLocaleString()
                                  : "-"}
                              </td>
                              <td className="border-b border-black/10 px-3 py-3">
                                <button
                                  onClick={() =>
                                    item.business_id &&
                                    navigate(
                                      `/dashboard/cratReviewAssessment?businessId=${item.business_id}`,
                                    )
                                  }
                                  disabled={!item.business_id}
                                  className="rounded-lg border border-black/15 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  Open
                                </button>
                              </td>
                              {/* Multi-reviewer assignment column */}
                              <td className="border-b border-black/10 px-3 py-3">
                                {canFinalizeReview && !isHistoryTab ? (
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => onApprove(item.id)}
                                      className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white"
                                    >
                                      Approve
                                    </button>

                                    {/* Publishing makes the scores official, so
                                      the AI's reasoning is one click away
                                      rather than hidden. */}
                                    {item.ai_analysis && (
                                      <button
                                        onClick={() =>
                                          setOpenAnalysis((prev) => ({
                                            ...prev,
                                            [item.id]: !prev[item.id],
                                          }))
                                        }
                                        className="rounded-lg border border-black/15 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-primary/40 hover:text-primary"
                                      >
                                        {analysisOpen ? "Hide" : "AI analysis"}
                                      </button>
                                    )}

                                    <button
                                      onClick={() => onRescore(item.id)}
                                      disabled={rescoring === item.id}
                                      className="rounded-lg border border-black/15 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-primary/40 hover:text-primary disabled:opacity-60"
                                    >
                                      {rescoring === item.id
                                        ? "Scoring..."
                                        : "Re-score"}
                                    </button>
                                    <button
                                      onClick={() => onReject(item.id)}
                                      className="rounded-lg border border-black/15 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-primary/40 hover:text-primary"
                                    >
                                      Reject
                                    </button>
                                    <button
                                      onClick={() => onDelete(item.id)}
                                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <p className="text-[11px] text-slate-500">
                                      {isHistoryTab
                                        ? "Finalized"
                                        : isScoring
                                          ? "Being scored. Publishing opens when it finishes."
                                          : scoringFailed
                                            ? "Scoring failed. Re-run it to publish."
                                            : "Available once the assessment has been scored."}
                                    </p>

                                    {scoringFailed && (
                                      <button
                                        onClick={() => onRescore(item.id)}
                                        disabled={rescoring === item.id}
                                        className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                                      >
                                        {rescoring === item.id
                                          ? "Scoring..."
                                          : "Re-run scoring"}
                                      </button>
                                    )}

                                    <button
                                      onClick={() => onDelete(item.id)}
                                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </td>
                              <td className="border-b border-black/10 px-3 py-3">
                                {isHistoryTab ? (
                                  <p className="text-xs text-slate-600">
                                    {item.admin_decision_notes || "-"}
                                  </p>
                                ) : (
                                  <textarea
                                    className="w-full rounded-lg border border-black/10 bg-white px-2.5 py-2 text-xs focus:border-primary/40 focus:outline-none"
                                    rows={2}
                                    placeholder="Admin decision notes"
                                    value={notes[item.id] || ""}
                                    onChange={(e) =>
                                      setNotes((prev) => ({
                                        ...prev,
                                        [item.id]: e.target.value,
                                      }))
                                    }
                                  />
                                )}
                              </td>
                            </tr>

                            {/* The AI's reasoning, opened underneath the row
                                it belongs to. */}
                            {analysisOpen && (
                              <tr className="bg-slate-50">
                                <td
                                  colSpan={12}
                                  className="border-b border-black/10 px-4 py-4"
                                >
                                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                                    AI analysis
                                    {item.ai_model ? ` · ${item.ai_model}` : ""}
                                  </p>

                                  <pre className="whitespace-pre-wrap font-sans text-xs leading-6 text-slate-700">
                                    {item.ai_analysis}
                                  </pre>

                                  {item.ai_error && (
                                    <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                                      {item.ai_error}
                                    </p>
                                  )}
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}

                      {queue.length === 0 && (
                        <tr>
                          <td
                            colSpan={9}
                            className="px-3 py-4 text-sm text-slate-600"
                          >
                            {activeTab === TAB_KEYS.previous
                              ? "No previous submissions available."
                              : "No CRAT assessments in queue."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {queue.length > 0 && (
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-black/10 pt-4">
                  <p className="text-xs text-slate-600">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="rounded-lg border border-black/15 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="rounded-lg border border-black/15 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default CratReviewApplicationsPage;
