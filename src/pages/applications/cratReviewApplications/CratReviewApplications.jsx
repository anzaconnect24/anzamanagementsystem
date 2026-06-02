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
  deleteAssessment,
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
  // Multi-reviewer selection: { assessmentId: Set<reviewerId (string)> }
  const [selectedReviewersByAssessment, setSelectedReviewersByAssessment] =
    useState({});
  // Track which dropdowns are open
  const [openReviewerDropdown, setOpenReviewerDropdown] = useState(null);
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
        // Prefer assignedReviewers (join table) if present, fallback to assignedReviewer
        const reviewerList = item?.assignedReviewers?.length
          ? item.assignedReviewers.map((ar) =>
              String(ar.reviewer_id || ar.reviewer?.id),
            )
          : item?.assignedReviewer?.id
            ? [String(item.assignedReviewer.id)]
            : [];
        if (reviewerList.length > 0) {
          nextSelected[item.id] = new Set(reviewerList.filter(Boolean));
        }
      });
      setSelectedReviewersByAssessment((prev) => ({
        ...prev,
        ...nextSelected,
      }));
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

  const onAssign = async (assessmentId, reviewerIds) => {
    if (!reviewerIds || reviewerIds.length === 0) return;
    try {
      await assignReviewer(assessmentId, reviewerIds);
      toast.success(`${reviewerIds.length} reviewer(s) assigned.`);
      await load(activeTab);
    } catch (error) {
      console.error(error);
      toast.error("Failed to assign reviewer(s).");
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

  // Close reviewer dropdown when clicking outside
  useEffect(() => {
    if (!openReviewerDropdown) return;
    const handler = (e) => {
      if (!e.target.closest("[data-reviewer-dropdown]")) {
        setOpenReviewerDropdown(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openReviewerDropdown]);

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
                          Assigned Reviewers
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
                        const assignedReviewerIds = new Set(
                          item?.assignedReviewers?.length
                            ? item.assignedReviewers.map((ar) =>
                                String(ar.reviewer_id || ar.reviewer?.id),
                              )
                            : item?.assignedReviewer?.id
                              ? [String(item.assignedReviewer.id)]
                              : [],
                        );

                        const selectedIds =
                          selectedReviewersByAssessment[item.id] || new Set();

                        // Show save if selection differs from currently assigned
                        const selArray = [...selectedIds].sort();
                        const assignedArray = [...assignedReviewerIds].sort();
                        const showSaveAssignment =
                          selArray.length > 0 &&
                          JSON.stringify(selArray) !==
                            JSON.stringify(assignedArray);

                        const canFinalizeReview =
                          item.status === "review_submitted";
                        const isHistoryTab = activeTab === TAB_KEYS.previous;

                        // List of reviewer names for assigned display
                        const assignedNames = item?.assignedReviewers
                          ?.map((ar) => ar.reviewer?.name)
                          .filter(Boolean);

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
                              {assignedNames && assignedNames.length > 0 ? (
                                <ul className="space-y-1">
                                  {assignedNames.map((name, i) => (
                                    <li
                                      key={i}
                                      className="flex items-center gap-1"
                                    >
                                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-violet-400" />
                                      <span className="text-xs font-medium text-slate-800">
                                        {name}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              ) : item.assignedReviewer ? (
                                <>
                                  <p className="text-sm font-medium text-slate-900">
                                    {item.assignedReviewer.name}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-600">
                                    {item.assignedReviewer.email}
                                  </p>
                                </>
                              ) : (
                                <p className="text-sm text-slate-400 italic">
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
                            {/* Multi-reviewer assignment column */}
                            <td className="border-b border-black/10 px-3 py-3">
                              {isHistoryTab ? (
                                <p className="text-xs text-slate-500 italic">
                                  Finalized
                                </p>
                              ) : (
                                <div
                                  className="relative"
                                  data-reviewer-dropdown
                                >
                                  {/* Trigger button */}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setOpenReviewerDropdown((prev) =>
                                        prev === item.id ? null : item.id,
                                      )
                                    }
                                    className="w-40 rounded-lg border border-black/10 bg-white px-2.5 py-1.5 text-left text-xs focus:border-primary/40 focus:outline-none"
                                  >
                                    {selectedIds.size === 0
                                      ? "Select reviewers"
                                      : `${selectedIds.size} selected`}
                                  </button>

                                  {/* Dropdown */}
                                  {openReviewerDropdown === item.id && (
                                    <div className="absolute left-0 top-full z-30 mt-1 w-52 rounded-lg border border-black/10 bg-white shadow-lg">
                                      {reviewers.length === 0 ? (
                                        <p className="px-3 py-2 text-xs text-slate-500">
                                          No reviewers available.
                                        </p>
                                      ) : (
                                        reviewers.map((reviewer) => {
                                          const rid = String(reviewer.id);
                                          const checked = selectedIds.has(rid);
                                          return (
                                            <label
                                              key={reviewer.id}
                                              className="flex cursor-pointer items-center gap-2 px-3 py-2 text-xs hover:bg-slate-50"
                                            >
                                              <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => {
                                                  setSelectedReviewersByAssessment(
                                                    (prev) => {
                                                      const next = new Set(
                                                        prev[item.id] || [],
                                                      );
                                                      if (checked)
                                                        next.delete(rid);
                                                      else next.add(rid);
                                                      return {
                                                        ...prev,
                                                        [item.id]: next,
                                                      };
                                                    },
                                                  );
                                                }}
                                                className="accent-primary"
                                              />
                                              <span className="text-slate-800">
                                                {reviewer.name}
                                              </span>
                                            </label>
                                          );
                                        })
                                      )}
                                      {showSaveAssignment && (
                                        <div className="border-t border-black/10 px-3 py-2">
                                          <button
                                            onClick={() => {
                                              setOpenReviewerDropdown(null);
                                              onAssign(
                                                item.id,
                                                [...selectedIds].map(Number),
                                              );
                                            }}
                                            className="w-full rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white"
                                          >
                                            Assign ({selectedIds.size})
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
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
                                      : "Available after review submission."}
                                  </p>
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
