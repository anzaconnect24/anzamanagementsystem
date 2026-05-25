import { useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import Loader from "@/components/common/Loader";
import { UserContext } from "@/layouts/DashboardLayout";
import { getMentorAssignedEntreprenuers } from "@/controllers/mentorEntreprenuerController";
import {
  createMentorWeeklyLog,
  createTrackerMilestone,
  getMentorOverview,
  getMentorWeeklyLogs,
  listTrackerMilestones,
  reviewTrackerMilestone,
} from "@/controllers/trackerController";

const MentorTracker = () => {
  const { userDetails } = useContext(UserContext);
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [weeklyLogs, setWeeklyLogs] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [entrepreneurs, setEntrepreneurs] = useState([]);
  const [form, setForm] = useState({
    entreprenuer_uuid: "",
    weekStart: "",
    hours: "",
    touchpoints: "",
    flag: "green",
  });
  const [milestoneForm, setMilestoneForm] = useState({
    entreprenuer_uuid: "",
    title: "",
    dueDate: "",
  });
  const [reviewState, setReviewState] = useState({});

  const loadData = async () => {
    setLoading(true);
    try {
      const [ov, wl, ms, ents] = await Promise.all([
        getMentorOverview(),
        getMentorWeeklyLogs(),
        listTrackerMilestones(),
        getMentorAssignedEntreprenuers(userDetails.uuid),
      ]);

      setOverview(ov || null);
      setWeeklyLogs(wl?.weeklyLogs || []);
      setMilestones(ms || []);
      setEntrepreneurs(ents || []);
    } catch (error) {
      toast.error("Failed to load tracker data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userDetails?.uuid) {
      loadData();
    }
  }, [userDetails?.uuid]);

  const onCreateWeeklyLog = async (e) => {
    e.preventDefault();
    try {
      await createMentorWeeklyLog(form);
      toast.success("Weekly log created");
      setForm({
        entreprenuer_uuid: "",
        weekStart: "",
        hours: "",
        touchpoints: "",
        flag: "green",
      });
      loadData();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to create weekly log",
      );
    }
  };

  const onCreateMilestone = async (e) => {
    e.preventDefault();
    try {
      await createTrackerMilestone(milestoneForm);
      toast.success("Milestone created");
      setMilestoneForm({
        entreprenuer_uuid: "",
        title: "",
        dueDate: "",
      });
      loadData();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to create milestone",
      );
    }
  };

  const onReviewMilestone = async (uuid) => {
    const payload = reviewState[uuid] || {};
    if (!payload.status) {
      toast.error("Select a review status");
      return;
    }

    try {
      await reviewTrackerMilestone(uuid, {
        status: payload.status,
        mentorReviewNotes: payload.mentorReviewNotes || "",
      });
      toast.success("Milestone updated");
      loadData();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to review milestone",
      );
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="space-y-6 px-6 py-6">
      <div>
        <h1 className="text-2xl font-bold text-black">Mentorship Tracker</h1>
        <p className="text-sm text-black/60">
          Log weekly mentorship activity and track entrepreneur milestones.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-black/10 bg-white p-4">
          <div className="text-sm text-black/60">Weekly logs</div>
          <div className="text-3xl font-semibold">
            {overview?.weeklyLogs || 0}
          </div>
        </div>
        <div className="rounded-lg border border-black/10 bg-white p-4">
          <div className="text-sm text-black/60">Red flags</div>
          <div className="text-3xl font-semibold text-red-600">
            {overview?.redFlags || 0}
          </div>
        </div>
        <div className="rounded-lg border border-black/10 bg-white p-4">
          <div className="text-sm text-black/60">Open milestones</div>
          <div className="text-3xl font-semibold">
            {overview?.openMilestones || 0}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <form
          onSubmit={onCreateWeeklyLog}
          className="rounded-lg border border-black/10 bg-white p-4"
        >
          <h2 className="mb-3 text-lg font-semibold">Create weekly log</h2>
          <div className="grid grid-cols-1 gap-3">
            <select
              className="rounded-md border border-black/10 p-2"
              value={form.entreprenuer_uuid}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  entreprenuer_uuid: e.target.value,
                }))
              }
              required
            >
              <option value="">Select entrepreneur</option>
              {entrepreneurs.map((item) => (
                <option key={item.uuid} value={item?.Entreprenuer?.uuid}>
                  {item?.Entreprenuer?.name}
                </option>
              ))}
            </select>
            <input
              className="rounded-md border border-black/10 p-2"
              type="date"
              value={form.weekStart}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, weekStart: e.target.value }))
              }
              required
            />
            <input
              className="rounded-md border border-black/10 p-2"
              type="number"
              step="0.5"
              min="0"
              placeholder="Hours"
              value={form.hours}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, hours: e.target.value }))
              }
            />
            <input
              className="rounded-md border border-black/10 p-2"
              type="number"
              min="0"
              placeholder="Touchpoints"
              value={form.touchpoints}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, touchpoints: e.target.value }))
              }
            />
            <select
              className="rounded-md border border-black/10 p-2"
              value={form.flag}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, flag: e.target.value }))
              }
            >
              <option value="green">Green</option>
              <option value="amber">Amber</option>
              <option value="red">Red</option>
            </select>
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 font-semibold text-white"
            >
              Save weekly log
            </button>
          </div>
        </form>

        <form
          onSubmit={onCreateMilestone}
          className="rounded-lg border border-black/10 bg-white p-4"
        >
          <h2 className="mb-3 text-lg font-semibold">Create milestone</h2>
          <div className="grid grid-cols-1 gap-3">
            <select
              className="rounded-md border border-black/10 p-2"
              value={milestoneForm.entreprenuer_uuid}
              onChange={(e) =>
                setMilestoneForm((prev) => ({
                  ...prev,
                  entreprenuer_uuid: e.target.value,
                }))
              }
              required
            >
              <option value="">Select entrepreneur</option>
              {entrepreneurs.map((item) => (
                <option key={item.uuid} value={item?.Entreprenuer?.uuid}>
                  {item?.Entreprenuer?.name}
                </option>
              ))}
            </select>
            <input
              className="rounded-md border border-black/10 p-2"
              placeholder="Milestone title"
              value={milestoneForm.title}
              onChange={(e) =>
                setMilestoneForm((prev) => ({ ...prev, title: e.target.value }))
              }
              required
            />
            <input
              className="rounded-md border border-black/10 p-2"
              type="date"
              value={milestoneForm.dueDate}
              onChange={(e) =>
                setMilestoneForm((prev) => ({
                  ...prev,
                  dueDate: e.target.value,
                }))
              }
            />
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 font-semibold text-white"
            >
              Save milestone
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-lg border border-black/10 bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold">Latest weekly logs</h2>
        <div className="space-y-2">
          {weeklyLogs.length === 0 && (
            <div className="text-sm text-black/60">No weekly logs yet.</div>
          )}
          {weeklyLogs.map((log) => (
            <div
              key={log.uuid}
              className="flex items-center justify-between rounded border border-black/10 px-3 py-2"
            >
              <div>
                <div className="font-medium">{log?.Entreprenuer?.name}</div>
                <div className="text-xs text-black/60">
                  Week: {log.weekStart}
                </div>
              </div>
              <div className="text-sm">
                {log.hours}h • {log.touchpoints} touchpoints • {log.flag}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-black/10 bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold">Milestones</h2>
        <div className="space-y-2">
          {milestones.length === 0 && (
            <div className="text-sm text-black/60">No milestones yet.</div>
          )}
          {milestones.map((item) => (
            <div
              key={item.uuid}
              className="flex items-center justify-between rounded border border-black/10 px-3 py-2"
            >
              <div>
                <div className="font-medium">{item.title}</div>
                <div className="text-xs text-black/60">
                  {item?.Entreprenuer?.name}{" "}
                  {item.dueDate ? `• Due ${item.dueDate.slice(0, 10)}` : ""}
                </div>
                {item.submissionNotes ? (
                  <div className="mt-1 text-xs text-black/70">
                    Submission: {item.submissionNotes}
                  </div>
                ) : null}
              </div>
              <div className="flex min-w-[280px] items-center justify-end gap-2">
                <span className="text-sm font-medium">{item.status}</span>
                <select
                  className="rounded-md border border-black/10 p-1 text-sm"
                  value={reviewState[item.uuid]?.status || ""}
                  onChange={(e) =>
                    setReviewState((prev) => ({
                      ...prev,
                      [item.uuid]: {
                        ...prev[item.uuid],
                        status: e.target.value,
                      },
                    }))
                  }
                >
                  <option value="">Review status</option>
                  <option value="in_progress">In progress</option>
                  <option value="completed">Completed</option>
                  <option value="overdue">Overdue</option>
                  <option value="rejected">Rejected</option>
                </select>
                <input
                  className="rounded-md border border-black/10 p-1 text-sm"
                  placeholder="Review note"
                  value={reviewState[item.uuid]?.mentorReviewNotes || ""}
                  onChange={(e) =>
                    setReviewState((prev) => ({
                      ...prev,
                      [item.uuid]: {
                        ...prev[item.uuid],
                        mentorReviewNotes: e.target.value,
                      },
                    }))
                  }
                />
                <button
                  onClick={() => onReviewMilestone(item.uuid)}
                  className="rounded-md bg-primary px-3 py-1 text-xs font-semibold text-white"
                >
                  Update
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MentorTracker;
