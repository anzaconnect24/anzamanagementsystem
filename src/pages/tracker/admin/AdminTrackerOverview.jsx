import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Loader from "@/components/common/Loader";
import {
  downloadAdminTrackerCsv,
  getAdminBusinesses,
  getAdminMilestones,
  getAdminTrackerOverview,
  getAdminWeeklyLogs,
} from "@/controllers/trackerController";

const getFlagPillClass = (flag) => {
  if (flag === "green") return "bg-[#e1f0d8] text-[#2d6e1f]";
  if (flag === "amber") return "bg-[#fdf1ce] text-[#8a6500]";
  return "bg-[#fde0e0] text-[#a11111]";
};

const getFlagLabel = (flag) => {
  if (flag === "green") return "On track";
  if (flag === "amber") return "At risk";
  if (flag === "red") return "Critical";
  return "Unknown";
};

const getMilestonePillClass = (status) => {
  if (status === "completed") return "bg-[#e1f0d8] text-[#2d6e1f]";
  if (status === "in_progress" || status === "submitted") {
    return "bg-[#dbe8ff] text-[#163b8f]";
  }
  if (status === "pending") return "bg-[#eef2f8] text-[#475569]";
  if (status === "overdue" || status === "rejected") {
    return "bg-[#fde0e0] text-[#a11111]";
  }
  return "bg-[#eef2f8] text-[#475569]";
};

const formatMilestoneStatus = (status) =>
  String(status || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const formatDateDisplay = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB");
};

const AdminTrackerOverview = () => {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [weeklyLogs, setWeeklyLogs] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [weeklyPagination, setWeeklyPagination] = useState({
    page: 1,
    totalPages: 1,
  });
  const [milestonePagination, setMilestonePagination] = useState({
    page: 1,
    totalPages: 1,
  });
  const [flagFilter, setFlagFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [businesses, setBusinesses] = useState([]);
  const [weeklyBusinessFilter, setWeeklyBusinessFilter] = useState("");
  const [milestoneBusinessFilter, setMilestoneBusinessFilter] = useState("");
  const [selectedWeeklyLog, setSelectedWeeklyLog] = useState(null);
  const [selectedMilestone, setSelectedMilestone] = useState(null);

  const loadOverview = async () => {
    const data = await getAdminTrackerOverview();
    setOverview(data || null);
  };

  const loadBusinesses = async () => {
    const data = await getAdminBusinesses();
    setBusinesses(Array.isArray(data) ? data : []);
  };

  const loadWeeklyLogs = async (
    page = 1,
    currentFlag = flagFilter,
    currentBusinessUuid = weeklyBusinessFilter,
  ) => {
    const data = await getAdminWeeklyLogs({
      page,
      limit: 10,
      flag: currentFlag,
      businessUuid: currentBusinessUuid,
    });
    setWeeklyLogs(data?.weeklyLogs || []);
    setWeeklyPagination({
      page: data?.pagination?.page || 1,
      totalPages: data?.pagination?.totalPages || 1,
    });
  };

  const loadMilestones = async (
    page = 1,
    currentStatus = statusFilter,
    currentBusinessUuid = milestoneBusinessFilter,
  ) => {
    const data = await getAdminMilestones({
      page,
      limit: 10,
      status: currentStatus,
      businessUuid: currentBusinessUuid,
    });
    setMilestones(data?.milestones || []);
    setMilestonePagination({
      page: data?.pagination?.page || 1,
      totalPages: data?.pagination?.totalPages || 1,
    });
  };

  const load = async () => {
    setLoading(true);
    await Promise.all([
      loadOverview(),
      loadBusinesses(),
      loadWeeklyLogs(1),
      loadMilestones(1),
    ]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const onExportCsv = async () => {
    try {
      await downloadAdminTrackerCsv();
      toast.success("CSV downloaded");
    } catch (error) {
      toast.error("Failed to export CSV");
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="space-y-6 px-6 py-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-black">
            Tracker Admin Overview
          </h1>
          <p className="text-sm text-black/60">
            Platform-level mentorship risk and milestone monitoring snapshot.
          </p>
        </div>
        <button
          onClick={onExportCsv}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white"
        >
          Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-black/10 bg-white p-4">
          <div className="text-sm text-black/60">Weekly logs</div>
          <div className="text-3xl font-semibold">
            {overview?.totalWeeklyLogs || 0}
          </div>
        </div>
        <div className="rounded-lg border border-black/10 bg-white p-4">
          <div className="text-sm text-black/60">Red flags</div>
          <div className="text-3xl font-semibold text-red-600">
            {overview?.redFlags || 0}
          </div>
        </div>
        <div className="rounded-lg border border-black/10 bg-white p-4">
          <div className="text-sm text-black/60">Milestones</div>
          <div className="text-3xl font-semibold">
            {overview?.totalMilestones || 0}
          </div>
        </div>
        <div className="rounded-lg border border-black/10 bg-white p-4">
          <div className="text-sm text-black/60">Submitted milestones</div>
          <div className="text-3xl font-semibold">
            {overview?.submittedMilestones || 0}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-lg border border-black/10 bg-white p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Weekly risk logs</h2>
            <div className="flex items-center gap-2">
              <select
                className="rounded-md border border-black/10 p-2 pr-10 text-sm"
                value={weeklyBusinessFilter}
                onChange={(e) => {
                  setWeeklyBusinessFilter(e.target.value);
                  loadWeeklyLogs(1, flagFilter, e.target.value);
                }}
              >
                <option value="">All businesses</option>
                {businesses.map((business) => (
                  <option key={business.uuid} value={business.uuid}>
                    {business.name}
                  </option>
                ))}
              </select>
              <select
                className="rounded-md border border-black/10 p-2 pr-10 text-sm"
                value={flagFilter}
                onChange={(e) => {
                  setFlagFilter(e.target.value);
                  loadWeeklyLogs(1, e.target.value, weeklyBusinessFilter);
                }}
              >
                <option value="">All flags</option>
                <option value="green">Green</option>
                <option value="amber">Amber</option>
                <option value="red">Red</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            {weeklyLogs.length === 0 && (
              <div className="text-sm text-black/60">No weekly logs found.</div>
            )}
            {weeklyLogs.map((item) => (
              <button
                type="button"
                onClick={() => setSelectedWeeklyLog(item)}
                key={item.uuid}
                className="w-full rounded border border-black/10 px-3 py-2 text-left transition hover:bg-black/5"
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium">
                    {item?.Business?.name || item?.Entreprenuer?.name}
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getFlagPillClass(item.flag)}`}
                  >
                    {getFlagLabel(item.flag)}
                  </span>
                </div>
                <div className="text-xs text-black/60">
                  Mentor: {item?.Mentor?.name} • Week: {item.weekStart}
                </div>
                <div className="text-xs text-black/60">
                  {item.hours}h • {item.touchpoints} touchpoints
                </div>
              </button>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between">
            <button
              className="rounded border border-black/10 px-3 py-1 text-sm disabled:opacity-40"
              disabled={weeklyPagination.page <= 1}
              onClick={() =>
                loadWeeklyLogs(
                  weeklyPagination.page - 1,
                  flagFilter,
                  weeklyBusinessFilter,
                )
              }
            >
              Previous
            </button>
            <span className="text-xs text-black/60">
              Page {weeklyPagination.page} / {weeklyPagination.totalPages}
            </span>
            <button
              className="rounded border border-black/10 px-3 py-1 text-sm disabled:opacity-40"
              disabled={weeklyPagination.page >= weeklyPagination.totalPages}
              onClick={() =>
                loadWeeklyLogs(
                  weeklyPagination.page + 1,
                  flagFilter,
                  weeklyBusinessFilter,
                )
              }
            >
              Next
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-black/10 bg-white p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Milestone submissions</h2>
            <div className="flex items-center gap-2">
              <select
                className="rounded-md border border-black/10 p-2 pr-10 text-sm"
                value={milestoneBusinessFilter}
                onChange={(e) => {
                  setMilestoneBusinessFilter(e.target.value);
                  loadMilestones(1, statusFilter, e.target.value);
                }}
              >
                <option value="">All businesses</option>
                {businesses.map((business) => (
                  <option key={business.uuid} value={business.uuid}>
                    {business.name}
                  </option>
                ))}
              </select>
              <select
                className="rounded-md border border-black/10 p-2 pr-10 text-sm"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  loadMilestones(1, e.target.value, milestoneBusinessFilter);
                }}
              >
                <option value="">All statuses</option>
                <option value="submitted">Submitted</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In progress</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            {milestones.length === 0 && (
              <div className="text-sm text-black/60">No milestones found.</div>
            )}
            {milestones.map((item) => (
              <button
                type="button"
                onClick={() => setSelectedMilestone(item)}
                key={item.uuid}
                className="w-full rounded border border-black/10 px-3 py-2 text-left transition hover:bg-black/5"
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium">{item.title}</div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getMilestonePillClass(item.status)}`}
                  >
                    {formatMilestoneStatus(item.status)}
                  </span>
                </div>
                <div className="text-xs text-black/60">
                  Business: {item?.Business?.name || item?.Entreprenuer?.name} •
                  Mentor: {item?.Mentor?.name}
                </div>
                {item.submissionNotes ? (
                  <div className="text-xs text-black/70">
                    Submission: {item.submissionNotes}
                  </div>
                ) : null}
              </button>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between">
            <button
              className="rounded border border-black/10 px-3 py-1 text-sm disabled:opacity-40"
              disabled={milestonePagination.page <= 1}
              onClick={() =>
                loadMilestones(
                  milestonePagination.page - 1,
                  statusFilter,
                  milestoneBusinessFilter,
                )
              }
            >
              Previous
            </button>
            <span className="text-xs text-black/60">
              Page {milestonePagination.page} / {milestonePagination.totalPages}
            </span>
            <button
              className="rounded border border-black/10 px-3 py-1 text-sm disabled:opacity-40"
              disabled={
                milestonePagination.page >= milestonePagination.totalPages
              }
              onClick={() =>
                loadMilestones(
                  milestonePagination.page + 1,
                  statusFilter,
                  milestoneBusinessFilter,
                )
              }
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {selectedWeeklyLog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSelectedWeeklyLog(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-xl font-semibold text-[#111827]">
                Weekly Log Details
              </h3>
              <button
                type="button"
                onClick={() => setSelectedWeeklyLog(null)}
                className="rounded-md border border-black/10 px-3 py-1 text-sm"
              >
                Close
              </button>
            </div>

            <div className="space-y-2 text-sm text-[#374151]">
              <div>
                <span className="font-semibold text-[#111827]">Business:</span>{" "}
                {selectedWeeklyLog?.Business?.name || "N/A"}
              </div>
              <div>
                <span className="font-semibold text-[#111827]">
                  Entrepreneur:
                </span>{" "}
                {selectedWeeklyLog?.Entreprenuer?.name || "N/A"}
              </div>
              <div>
                <span className="font-semibold text-[#111827]">Mentor:</span>{" "}
                {selectedWeeklyLog?.Mentor?.name || "N/A"}
              </div>
              <div>
                <span className="font-semibold text-[#111827]">
                  Week start:
                </span>{" "}
                {formatDateDisplay(selectedWeeklyLog?.weekStart)}
              </div>
              <div>
                <span className="font-semibold text-[#111827]">Hours:</span>{" "}
                {selectedWeeklyLog?.hours ?? "N/A"}
              </div>
              <div>
                <span className="font-semibold text-[#111827]">
                  Touchpoints:
                </span>{" "}
                {selectedWeeklyLog?.touchpoints ?? "N/A"}
              </div>
              <div>
                <span className="font-semibold text-[#111827]">
                  Engagement:
                </span>{" "}
                {selectedWeeklyLog?.engagement || "N/A"}
              </div>
              <div>
                <span className="font-semibold text-[#111827]">Flag:</span>{" "}
                {getFlagLabel(selectedWeeklyLog?.flag)}
              </div>
              <div>
                <span className="font-semibold text-[#111827]">
                  Activities:
                </span>{" "}
                {Array.isArray(selectedWeeklyLog?.activities) &&
                selectedWeeklyLog.activities.length > 0
                  ? selectedWeeklyLog.activities.join(", ")
                  : "N/A"}
              </div>
              <div>
                <span className="font-semibold text-[#111827]">Focus:</span>{" "}
                {selectedWeeklyLog?.focus || "N/A"}
              </div>
              <div>
                <span className="font-semibold text-[#111827]">Outcomes:</span>{" "}
                {selectedWeeklyLog?.outcomes || "N/A"}
              </div>
              <div>
                <span className="font-semibold text-[#111827]">Barriers:</span>{" "}
                {selectedWeeklyLog?.barriers || "N/A"}
              </div>
              <div>
                <span className="font-semibold text-[#111827]">Next plan:</span>{" "}
                {selectedWeeklyLog?.nextPlan || "N/A"}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedMilestone && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSelectedMilestone(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-xl font-semibold text-[#111827]">
                Milestone Details
              </h3>
              <button
                type="button"
                onClick={() => setSelectedMilestone(null)}
                className="rounded-md border border-black/10 px-3 py-1 text-sm"
              >
                Close
              </button>
            </div>

            <div className="space-y-2 text-sm text-[#374151]">
              <div>
                <span className="font-semibold text-[#111827]">Title:</span>{" "}
                {selectedMilestone?.title || "N/A"}
              </div>
              <div>
                <span className="font-semibold text-[#111827]">Status:</span>{" "}
                {formatMilestoneStatus(selectedMilestone?.status)}
              </div>
              <div>
                <span className="font-semibold text-[#111827]">Business:</span>{" "}
                {selectedMilestone?.Business?.name || "N/A"}
              </div>
              <div>
                <span className="font-semibold text-[#111827]">
                  Entrepreneur:
                </span>{" "}
                {selectedMilestone?.Entreprenuer?.name || "N/A"}
              </div>
              <div>
                <span className="font-semibold text-[#111827]">Mentor:</span>{" "}
                {selectedMilestone?.Mentor?.name || "N/A"}
              </div>
              <div>
                <span className="font-semibold text-[#111827]">Due date:</span>{" "}
                {formatDateDisplay(selectedMilestone?.dueDate)}
              </div>
              <div>
                <span className="font-semibold text-[#111827]">
                  Submitted on:
                </span>{" "}
                {formatDateDisplay(selectedMilestone?.submissionDate)}
              </div>
              <div>
                <span className="font-semibold text-[#111827]">
                  Description:
                </span>{" "}
                {selectedMilestone?.description || "N/A"}
              </div>
              <div>
                <span className="font-semibold text-[#111827]">
                  Submission notes:
                </span>{" "}
                {selectedMilestone?.submissionNotes || "N/A"}
              </div>
              <div>
                <span className="font-semibold text-[#111827]">
                  Review notes:
                </span>{" "}
                {selectedMilestone?.mentorReviewNotes || "N/A"}
              </div>
              <div>
                <span className="font-semibold text-[#111827]">
                  Reviewed at:
                </span>{" "}
                {formatDateDisplay(selectedMilestone?.reviewedAt)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTrackerOverview;
