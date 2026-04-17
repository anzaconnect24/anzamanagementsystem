import React, { useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import Breadcrumb from "@/component/Breadcrumb";
import axios from "axios";
import { server_url } from "@/utils/endpoint";
import { headers } from "@/utils/headers";
import { UserContext } from "@/layouts/DashboardLayout";
import {
  approveAssessment,
  assignReviewer,
  getAdminQueue,
  rejectAssessment,
} from "@/controllers/crat_controller";
import { useNavigate } from "react-router-dom";

const TAB_KEYS = {
  active: "active",
  previous: "previous",
};

const TAB_STATUS_FILTER = {
  [TAB_KEYS.active]: "submitted|assigned|review_submitted",
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
  const [reviewers, setReviewers] = useState([]);
  const [notes, setNotes] = useState({});
  const [selectedReviewerByAssessment, setSelectedReviewerByAssessment] =
    useState({});
  const [activeTab, setActiveTab] = useState(TAB_KEYS.active);
  const [currentPage, setCurrentPage] = useState(1);
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
      const [rows, reviewerResponse] = await Promise.all([
        getAdminQueue(statusFilter),
        axios.get(`${server_url}/user/reviewers`, { headers }),
      ]);
      setQueue(rows || []);
      setReviewers(reviewerResponse?.data?.body?.data || []);

      const nextSelected = {};
      (rows || []).forEach((item) => {
        if (item?.assignedReviewer?.id) {
          nextSelected[item.id] = String(item.assignedReviewer.id);
        }
      });
      setSelectedReviewerByAssessment((prev) => ({ ...prev, ...nextSelected }));
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

  const onAssign = async (assessmentId, reviewerId) => {
    if (!reviewerId) return;
    try {
      await assignReviewer(assessmentId, Number(reviewerId));
      toast.success("Reviewer assigned.");
      await load(activeTab);
    } catch (error) {
      console.error(error);
      toast.error("Failed to assign reviewer.");
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

  const statusTone = (status = "") => {
    const value = String(status).toLowerCase();
    if (value === "submitted") {
      return "bg-sky-100 text-sky-700 border-sky-200";
    }
    if (value === "assigned") {
      return "bg-violet-100 text-violet-700 border-violet-200";
    }
    if (value === "review_submitted") {
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    }
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  const formatStatus = (status = "") =>
    String(status)
      .split("_")
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase() + part.slice(1))
      .join(" ");

  const submittedCount = queue.filter(
    (item) => item.status === "submitted",
  ).length;
  const assignedCount = queue.filter(
    (item) => item.status === "assigned",
  ).length;
  const reviewSubmittedCount = queue.filter(
    (item) => item.status === "review_submitted",
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

  return (
    <div className="w-full p-4 md:p-6">
      <Breadcrumb pageName="CRAT Assignment & Approval Queue" />
      <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm md:p-7">
        <h1 className="text-xl font-semibold text-slate-900 md:text-2xl">
          Admin Review Queue
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Assign reviewers, track progress, and finalize CRAT outcomes.
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
                  Submitted
                </p>
                <p className="mt-2 text-2xl font-semibold text-primary">
                  {submittedCount}
                </p>
              </div>
              <div className="rounded-xl border border-black/10 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Assigned
                </p>
                <p className="mt-2 text-2xl font-semibold text-primary">
                  {assignedCount}
                </p>
              </div>
              <div className="rounded-xl border border-black/10 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Review Submitted
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
                        <th className="w-56 border-b border-black/10 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                          Assigned Reviewer
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
                        <th className="w-56 border-b border-black/10 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                          Assign Reviewer
                        </th>
                        <th className="w-52 border-b border-black/10 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                          Decision
                        </th>
                        <th className="w-72 border-b border-black/10 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                          Admin Notes
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedQueue.map((item, index) => {
                        const selectedReviewerId =
                          selectedReviewerByAssessment[item.id] ||
                          (item.assignedReviewer?.id
                            ? String(item.assignedReviewer.id)
                            : "");
                        const assignedReviewerId = item.assignedReviewer?.id
                          ? String(item.assignedReviewer.id)
                          : "";
                        const showSaveAssignment =
                          Boolean(selectedReviewerId) &&
                          selectedReviewerId !== assignedReviewerId;
                        const canFinalizeReview =
                          item.status === "review_submitted";
                        const isHistoryTab = activeTab === TAB_KEYS.previous;

                        return (
                          <tr key={item.id} className="align-top bg-white">
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
                              {item.assignedReviewer ? (
                                <>
                                  <p className="text-sm font-medium text-slate-900">
                                    {item.assignedReviewer.name}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-600">
                                    {item.assignedReviewer.email}
                                  </p>
                                </>
                              ) : (
                                <p className="text-sm text-slate-600">
                                  Not assigned yet.
                                </p>
                              )}
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
                            <td className="border-b border-black/10 px-3 py-3">
                              <div className="flex items-center gap-2">
                                <select
                                  className="w-36 rounded-lg border border-black/10 bg-white px-2.5 py-1.5 text-xs focus:border-primary/40 focus:outline-none"
                                  value={selectedReviewerId}
                                  onChange={(e) =>
                                    setSelectedReviewerByAssessment((prev) => ({
                                      ...prev,
                                      [item.id]: e.target.value,
                                    }))
                                  }
                                  disabled={isHistoryTab}
                                >
                                  <option value="">Reviewer</option>
                                  {reviewers.map((reviewer) => (
                                    <option
                                      key={reviewer.id}
                                      value={reviewer.id}
                                    >
                                      {reviewer.name}
                                    </option>
                                  ))}
                                </select>

                                {showSaveAssignment && !isHistoryTab && (
                                  <button
                                    onClick={() =>
                                      onAssign(item.id, selectedReviewerId)
                                    }
                                    className="rounded-lg border border-black/15 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-primary/40 hover:text-primary"
                                  >
                                    Save
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="border-b border-black/10 px-3 py-3">
                              {canFinalizeReview && !isHistoryTab ? (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => onApprove(item.id)}
                                    className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => onReject(item.id)}
                                    className="rounded-lg border border-black/15 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-primary/40 hover:text-primary"
                                  >
                                    Reject
                                  </button>
                                </div>
                              ) : (
                                <p className="text-[11px] text-slate-500">
                                  {isHistoryTab
                                    ? "Finalized"
                                    : "Available after review submission."}
                                </p>
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
