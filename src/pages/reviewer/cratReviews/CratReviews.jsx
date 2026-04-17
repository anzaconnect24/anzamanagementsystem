import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Breadcrumb from "@/component/Breadcrumb";
import { useNavigate } from "react-router-dom";
import { getReviewerAssignments } from "@/controllers/crat_controller";

const TAB_KEYS = {
  active: "active",
  submitted: "submitted",
};

const ACTIVE_STATUSES = ["assigned", "in_review", "admin_rejected"];
const SUBMITTED_STATUSES = ["review_submitted", "published"];

const CratReviewsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState([]);
  const [activeTab, setActiveTab] = useState(TAB_KEYS.active);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const data = await getReviewerAssignments();
      setAssignments(data || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load reviewer assignments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, []);

  const formatStatus = (status = "") =>
    String(status)
      .split("_")
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase() + part.slice(1))
      .join(" ");

  const statusTone = (status = "") => {
    const value = String(status).toLowerCase();
    if (value === "assigned") {
      return "bg-violet-100 text-violet-700 border-violet-200";
    }
    if (value === "in_review") {
      return "bg-sky-100 text-sky-700 border-sky-200";
    }
    if (value === "admin_rejected") {
      return "bg-amber-100 text-amber-700 border-amber-200";
    }
    if (value === "review_submitted") {
      return "bg-primary/10 text-primary border-primary/20";
    }
    if (value === "published") {
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    }
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  const filteredAssignments = useMemo(() => {
    if (activeTab === TAB_KEYS.submitted) {
      return assignments.filter((assignment) =>
        SUBMITTED_STATUSES.includes(String(assignment.status || "")),
      );
    }

    return assignments.filter((assignment) =>
      ACTIVE_STATUSES.includes(String(assignment.status || "")),
    );
  }, [activeTab, assignments]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAssignments.length / ITEMS_PER_PAGE),
  );
  const rows = useMemo(
    () =>
      filteredAssignments.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE,
      ),
    [filteredAssignments, currentPage],
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  return (
    <div className="w-full p-4 md:p-6">
      <Breadcrumb pageName="My CRAT Assignments" />
      <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm md:p-7">
        <h1 className="text-xl font-semibold text-slate-900">Reviewer Queue</h1>

        <div className="mt-4 inline-flex rounded-lg border border-black/10 bg-slate-100 p-1">
          <button
            onClick={() => setActiveTab(TAB_KEYS.active)}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === TAB_KEYS.active
                ? "bg-primary text-white"
                : "text-slate-700 hover:bg-white"
            }`}
          >
            Active Assignments
          </button>
          <button
            onClick={() => setActiveTab(TAB_KEYS.submitted)}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === TAB_KEYS.submitted
                ? "bg-primary text-white"
                : "text-slate-700 hover:bg-white"
            }`}
          >
            Submitted Reviews
          </button>
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-slate-600">Loading assignments...</p>
        ) : (
          <div className="mt-4 rounded-xl border border-black/10">
            <div className="overflow-x-auto">
              <table className="min-w-[920px] w-full table-fixed bg-white">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="w-14 border-b border-black/10 px-3 py-3 text-left text-xs font-semibold text-slate-700">
                      #
                    </th>
                    <th className="border-b border-black/10 px-3 py-3 text-left text-xs font-semibold text-slate-700">
                      Entrepreneur
                    </th>
                    <th className="w-56 border-b border-black/10 px-3 py-3 text-left text-xs font-semibold text-slate-700">
                      Email
                    </th>
                    <th className="w-40 border-b border-black/10 px-3 py-3 text-left text-xs font-semibold text-slate-700">
                      Status
                    </th>
                    <th className="w-48 border-b border-black/10 px-3 py-3 text-left text-xs font-semibold text-slate-700">
                      Last Updated
                    </th>
                    <th className="w-44 border-b border-black/10 px-3 py-3 text-left text-xs font-semibold text-slate-700">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((assignment, index) => (
                    <tr key={assignment.id} className="align-top bg-white">
                      <td className="border-b border-black/10 px-3 py-3 text-sm text-slate-700">
                        {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                      </td>
                      <td className="border-b border-black/10 px-3 py-3 text-sm font-medium text-slate-900">
                        {assignment.entrepreneur?.name || "Entrepreneur"}
                      </td>
                      <td className="border-b border-black/10 px-3 py-3 text-sm text-slate-700">
                        {assignment.entrepreneur?.email || "-"}
                      </td>
                      <td className="border-b border-black/10 px-3 py-3 text-sm">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone(
                            assignment.status,
                          )}`}
                        >
                          {formatStatus(assignment.status)}
                        </span>
                      </td>
                      <td className="border-b border-black/10 px-3 py-3 text-sm text-slate-700">
                        {assignment.updatedAt
                          ? new Date(assignment.updatedAt).toLocaleString()
                          : "-"}
                      </td>
                      <td className="border-b border-black/10 px-3 py-3">
                        <button
                          onClick={() =>
                            navigate(
                              `/dashboard/cratReviewAssessment?businessId=${assignment.business_id}`,
                            )
                          }
                          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white"
                        >
                          {activeTab === TAB_KEYS.submitted ? "View" : "Open"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredAssignments.length === 0 && (
              <p className="px-3 py-4 text-sm text-slate-600">
                {activeTab === TAB_KEYS.submitted
                  ? "No submitted reviews yet."
                  : "No active assignments available."}
              </p>
            )}

            {filteredAssignments.length > 0 && (
              <div className="flex items-center justify-between gap-3 border-t border-black/10 px-3 py-3">
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
          </div>
        )}
      </div>
    </div>
  );
};

export default CratReviewsPage;
