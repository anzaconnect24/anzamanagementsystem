import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Loader from "@/components/common/Loader";
import {
  downloadAdminTrackerCsv,
  getAdminMilestones,
  getAdminTrackerOverview,
  getAdminWeeklyLogs,
} from "@/controllers/trackerController";

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

  const loadOverview = async () => {
    const data = await getAdminTrackerOverview();
    setOverview(data || null);
  };

  const loadWeeklyLogs = async (page = 1, currentFlag = flagFilter) => {
    const data = await getAdminWeeklyLogs({
      page,
      limit: 10,
      flag: currentFlag,
    });
    setWeeklyLogs(data?.weeklyLogs || []);
    setWeeklyPagination({
      page: data?.pagination?.page || 1,
      totalPages: data?.pagination?.totalPages || 1,
    });
  };

  const loadMilestones = async (page = 1, currentStatus = statusFilter) => {
    const data = await getAdminMilestones({
      page,
      limit: 10,
      status: currentStatus,
    });
    setMilestones(data?.milestones || []);
    setMilestonePagination({
      page: data?.pagination?.page || 1,
      totalPages: data?.pagination?.totalPages || 1,
    });
  };

  const load = async () => {
    setLoading(true);
    await Promise.all([loadOverview(), loadWeeklyLogs(1), loadMilestones(1)]);
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
            <select
              className="rounded-md border border-black/10 p-2 text-sm"
              value={flagFilter}
              onChange={(e) => {
                setFlagFilter(e.target.value);
                loadWeeklyLogs(1, e.target.value);
              }}
            >
              <option value="">All flags</option>
              <option value="green">Green</option>
              <option value="amber">Amber</option>
              <option value="red">Red</option>
            </select>
          </div>

          <div className="space-y-2">
            {weeklyLogs.length === 0 && (
              <div className="text-sm text-black/60">No weekly logs found.</div>
            )}
            {weeklyLogs.map((item) => (
              <div
                key={item.uuid}
                className="rounded border border-black/10 px-3 py-2"
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium">{item?.Entreprenuer?.name}</div>
                  <span className="text-xs font-semibold uppercase">
                    {item.flag}
                  </span>
                </div>
                <div className="text-xs text-black/60">
                  Mentor: {item?.Mentor?.name} • Week: {item.weekStart}
                </div>
                <div className="text-xs text-black/60">
                  {item.hours}h • {item.touchpoints} touchpoints
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between">
            <button
              className="rounded border border-black/10 px-3 py-1 text-sm disabled:opacity-40"
              disabled={weeklyPagination.page <= 1}
              onClick={() =>
                loadWeeklyLogs(weeklyPagination.page - 1, flagFilter)
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
                loadWeeklyLogs(weeklyPagination.page + 1, flagFilter)
              }
            >
              Next
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-black/10 bg-white p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Milestone submissions</h2>
            <select
              className="rounded-md border border-black/10 p-2 text-sm"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                loadMilestones(1, e.target.value);
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

          <div className="space-y-2">
            {milestones.length === 0 && (
              <div className="text-sm text-black/60">No milestones found.</div>
            )}
            {milestones.map((item) => (
              <div
                key={item.uuid}
                className="rounded border border-black/10 px-3 py-2"
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium">{item.title}</div>
                  <span className="text-xs font-semibold uppercase">
                    {item.status}
                  </span>
                </div>
                <div className="text-xs text-black/60">
                  Entrepreneur: {item?.Entreprenuer?.name} • Mentor:{" "}
                  {item?.Mentor?.name}
                </div>
                {item.submissionNotes ? (
                  <div className="text-xs text-black/70">
                    Submission: {item.submissionNotes}
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between">
            <button
              className="rounded border border-black/10 px-3 py-1 text-sm disabled:opacity-40"
              disabled={milestonePagination.page <= 1}
              onClick={() =>
                loadMilestones(milestonePagination.page - 1, statusFilter)
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
                loadMilestones(milestonePagination.page + 1, statusFilter)
              }
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminTrackerOverview;
