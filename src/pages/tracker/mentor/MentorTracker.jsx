import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Loader from "@/components/common/Loader";
import { UserContext } from "@/layouts/DashboardLayout";
import { getMentorAssignedEntreprenuers } from "@/controllers/mentorEntreprenuerController";
import { getPrograms } from "@/controllers/program_controller";
import {
  createMentorWeeklyLog,
  deleteMentorEnterprise,
  listMentorEnterprises,
  createTrackerMilestone,
  getMentorWeeklyLogs,
  listTrackerMilestones,
  reviewTrackerMilestone,
  updateMentorEnterprise,
  upsertMentorEnterprise,
} from "@/controllers/trackerController";

const DISTRICTS = [
  "Kigoma Ujiji MC",
  "Kigoma DC",
  "Kasulu TC",
  "Kasulu DC",
  "Buhigwe",
  "Uvinza",
  "Kakonko",
  "Kibondo",
];

const CE_SECTORS = [
  "Metal scraps aggregation",
  "Agriculture",
  "Retail",
  "Manufacturing",
  "Technology",
  "Services",
  "Education",
  "Healthcare",
];

const FLAG_LABEL_MAP = {
  green: "On track",
  amber: "At risk",
  red: "Critical",
};

const FLAG_PILL_CLASS_MAP = {
  green: "bg-[#e1f0d8] text-[#2d6e1f]",
  amber: "bg-[#fdf1ce] text-[#8a6500]",
  red: "bg-[#fde0e0] text-[#a11111]",
};

const MILESTONE_STATUS_LABEL_MAP = {
  pending: "Pending",
  in_progress: "In progress",
  submitted: "Submitted",
  completed: "Completed",
  overdue: "Overdue",
  rejected: "Rejected",
};

const MILESTONE_STATUS_PILL_CLASS_MAP = {
  pending: "bg-[#eef2f8] text-[#475569]",
  in_progress: "bg-[#dbe8ff] text-[#163b8f]",
  submitted: "bg-[#dbe8ff] text-[#163b8f]",
  completed: "bg-[#e1f0d8] text-[#2d6e1f]",
  overdue: "bg-[#fde0e0] text-[#a11111]",
  rejected: "bg-[#fde0e0] text-[#a11111]",
};

const TRACKER_CATEGORIES_MARKER = "__TRACKER_CATEGORIES__:";

const formatDateForInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const formatDateDisplay = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-GB");
};

const formatHours = (value) => {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed.toFixed(1) : "0.0";
};

const getEnterpriseEntrepreneurUuid = (enterprise) =>
  enterprise?.Entreprenuer?.uuid || enterprise?.entreprenuer_uuid;

const getAssignedBusinessName = (assignment) => {
  const entrepreneur = assignment?.Entreprenuer;

  const directBusinessName =
    entrepreneur?.Business?.name || entrepreneur?.business?.name;
  if (directBusinessName) {
    return directBusinessName;
  }

  const businessList = Array.isArray(entrepreneur?.Businesses)
    ? entrepreneur.Businesses
    : Array.isArray(entrepreneur?.businesses)
      ? entrepreneur.businesses
      : [];

  const approvedBusiness = businessList.find(
    (item) => item?.status === "accepted" || item?.status === "approved",
  );

  return approvedBusiness?.name || businessList[0]?.name || entrepreneur?.name;
};

const normalizeCategories = (categories = []) => {
  return Array.from(
    new Set(
      categories
        .map((item) => String(item || "").trim())
        .filter((item) => item.length > 0),
    ),
  );
};

const getProgramCategories = (program) => {
  if (!program) return [];

  const rawDescription = String(program.description || "");
  const markerIndex = rawDescription.lastIndexOf(TRACKER_CATEGORIES_MARKER);

  if (markerIndex === -1) {
    return normalizeCategories([program.programCategory]);
  }

  const rawCategories = rawDescription
    .slice(markerIndex + TRACKER_CATEGORIES_MARKER.length)
    .trim();

  let parsedCategories = [];
  try {
    const parsedValue = JSON.parse(rawCategories);
    if (Array.isArray(parsedValue)) {
      parsedCategories = parsedValue;
    }
  } catch (error) {
    parsedCategories = [];
  }

  return normalizeCategories([...parsedCategories, program.programCategory]);
};

const MentorTracker = () => {
  const { userDetails } = useContext(UserContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [weeklyLogs, setWeeklyLogs] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [entrepreneurs, setEntrepreneurs] = useState([]);
  const [enterpriseFilter, setEnterpriseFilter] = useState("all");
  const [showAddEnterpriseModal, setShowAddEnterpriseModal] = useState(false);
  const [enterprises, setEnterprises] = useState([]);
  const [isSavingEnterprise, setIsSavingEnterprise] = useState(false);
  const [editingEnterpriseUuid, setEditingEnterpriseUuid] = useState(null);
  const [deletingEnterpriseUuid, setDeletingEnterpriseUuid] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [enterpriseForm, setEnterpriseForm] = useState({
    entreprenuer_uuid: "",
    program_uuid: "",
    category: "",
    ceSector: "",
    assignedBda: "",
    district: "",
    leadContact: "",
    grantUsd: "",
    awardDate: "",
    businessDescription: "",
  });
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
  const [expandedWeeklyLogUuid, setExpandedWeeklyLogUuid] = useState(null);
  const [expandedSessionLogUuid, setExpandedSessionLogUuid] = useState(null);
  const [expandedMilestoneUuid, setExpandedMilestoneUuid] = useState(null);

  const assignedEntrepreneurOptions = useMemo(
    () =>
      entrepreneurs
        .filter((item) => Boolean(item?.Entreprenuer?.uuid))
        .map((item) => ({
          uuid: item.Entreprenuer.uuid,
          name: getAssignedBusinessName(item),
          entrepreneurName: item.Entreprenuer.name,
          email: item.Entreprenuer.email,
        })),
    [entrepreneurs],
  );

  const selectedProgram = useMemo(
    () =>
      programs.find((item) => item.uuid === enterpriseForm.program_uuid) ||
      null,
    [programs, enterpriseForm.program_uuid],
  );

  const enterpriseCategoryOptions = useMemo(() => {
    return getProgramCategories(selectedProgram);
  }, [selectedProgram]);

  const filterCategories = useMemo(() => {
    const fromPrograms = normalizeCategories(
      programs.flatMap((program) => getProgramCategories(program)),
    );

    if (fromPrograms.length > 0) {
      return fromPrograms;
    }

    return Array.from(
      new Set(
        enterprises
          .map((item) => item.category)
          .filter((value) => Boolean(value && value.trim())),
      ),
    );
  }, [programs, enterprises]);

  const enterpriseStats = useMemo(() => {
    const all = enterprises.length;
    const onTrack = enterprises.filter((e) => e.flag === "green").length;
    const atRisk = enterprises.filter((e) => e.flag === "amber").length;
    const critical = enterprises.filter((e) => e.flag === "red").length;

    const sessions = weeklyLogs.reduce((sum, log) => {
      if (
        !enterprises.some(
          (e) => getEnterpriseEntrepreneurUuid(e) === log.Entreprenuer?.uuid,
        )
      ) {
        return sum;
      }
      return sum + 1;
    }, 0);

    const mentorshipHours = weeklyLogs.reduce((sum, log) => {
      if (
        !enterprises.some(
          (e) => getEnterpriseEntrepreneurUuid(e) === log.Entreprenuer?.uuid,
        )
      ) {
        return sum;
      }
      return sum + Number(log.hours || 0);
    }, 0);

    return {
      all,
      onTrack,
      atRisk,
      critical,
      sessions,
      mentorshipHours,
    };
  }, [enterprises, weeklyLogs]);

  const filteredEnterprises = useMemo(() => {
    return enterprises.filter((item) => {
      return enterpriseFilter === "all" || item.category === enterpriseFilter;
    });
  }, [enterprises, enterpriseFilter]);

  const resetEnterpriseForm = () => {
    setEnterpriseForm({
      entreprenuer_uuid: "",
      program_uuid: "",
      category: "",
      ceSector: "",
      assignedBda: "",
      district: "",
      leadContact: "",
      grantUsd: "",
      awardDate: "",
      businessDescription: "",
    });
  };

  const closeEnterpriseModal = () => {
    setShowAddEnterpriseModal(false);
    setEditingEnterpriseUuid(null);
    resetEnterpriseForm();
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [wl, ms, ents, enterpriseList, programsResponse] =
        await Promise.all([
          getMentorWeeklyLogs(),
          listTrackerMilestones(),
          getMentorAssignedEntreprenuers(userDetails.uuid),
          listMentorEnterprises(),
          getPrograms(1, 500),
        ]);

      setWeeklyLogs(wl?.weeklyLogs || []);
      setMilestones(ms || []);
      setEntrepreneurs(ents || []);
      setEnterprises(Array.isArray(enterpriseList) ? enterpriseList : []);
      setPrograms(
        Array.isArray(programsResponse?.data) ? programsResponse.data : [],
      );
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

  const onSaveEnterprise = async (e) => {
    e.preventDefault();

    if (isSavingEnterprise) {
      return;
    }

    if (!enterpriseForm.entreprenuer_uuid) {
      toast.error("Please select enterprise name");
      return;
    }

    if (!editingEnterpriseUuid && !enterpriseForm.program_uuid) {
      toast.error("Please select program");
      return;
    }

    if (!enterpriseForm.category) {
      toast.error("Please select category");
      return;
    }

    if (
      !enterpriseForm.ceSector ||
      !enterpriseForm.assignedBda ||
      !enterpriseForm.district ||
      !enterpriseForm.leadContact ||
      enterpriseForm.grantUsd === "" ||
      !enterpriseForm.awardDate ||
      !enterpriseForm.businessDescription
    ) {
      toast.error("Please fill all required enterprise fields");
      return;
    }

    try {
      setIsSavingEnterprise(true);
      if (editingEnterpriseUuid) {
        await updateMentorEnterprise(editingEnterpriseUuid, enterpriseForm);
      } else {
        await upsertMentorEnterprise(enterpriseForm);
      }
      toast.success("Enterprise saved");
      closeEnterpriseModal();
      loadData();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to save enterprise",
      );
    } finally {
      setIsSavingEnterprise(false);
    }
  };

  const onEditEnterprise = (enterprise) => {
    const entrepreneurUuid = getEnterpriseEntrepreneurUuid(enterprise) || "";
    const matchingProgram = programs.find((program) =>
      getProgramCategories(program).includes(enterprise.category),
    );

    setEditingEnterpriseUuid(enterprise.uuid);
    setEnterpriseForm({
      entreprenuer_uuid: entrepreneurUuid,
      program_uuid: matchingProgram?.uuid || "",
      category: enterprise.category || "",
      ceSector: enterprise.ceSector || "",
      assignedBda: enterprise.assignedBda || "",
      district: enterprise.district || "",
      leadContact: enterprise.leadContact || "",
      grantUsd: String(enterprise.grantUsd ?? ""),
      awardDate: formatDateForInput(enterprise.awardDate),
      businessDescription: enterprise.businessDescription || "",
    });
    setShowAddEnterpriseModal(true);
  };

  const onDeleteEnterprise = async (enterprise) => {
    const shouldDelete = window.confirm(
      `Delete enterprise \"${enterprise.name}\"?`,
    );

    if (!shouldDelete) return;

    try {
      setDeletingEnterpriseUuid(enterprise.uuid);
      await deleteMentorEnterprise(enterprise.uuid);
      toast.success("Enterprise deleted");
      loadData();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to delete enterprise",
      );
    } finally {
      setDeletingEnterpriseUuid(null);
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

  const renderEnterpriseTab = () => (
    <>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
        <div className="rounded-2xl border border-black/10 bg-white p-4">
          <div className="text-sm text-black/50">Enterprises</div>
          <div className="text-4xl font-semibold text-[#111827]">
            {enterpriseStats.all}
          </div>
          <div className="text-sm text-black/50">enrolled</div>
        </div>
        <div className="rounded-2xl border border-black/10 bg-white p-4">
          <div className="text-sm text-black/50">On track</div>
          <div className="text-4xl font-semibold text-[#2d6e1f]">
            {enterpriseStats.onTrack}
          </div>
          <div className="text-sm text-black/50">green flag</div>
        </div>
        <div className="rounded-2xl border border-black/10 bg-white p-4">
          <div className="text-sm text-black/50">At risk</div>
          <div className="text-4xl font-semibold text-[#8a6500]">
            {enterpriseStats.atRisk}
          </div>
          <div className="text-sm text-black/50">amber flag</div>
        </div>
        <div className="rounded-2xl border border-black/10 bg-white p-4">
          <div className="text-sm text-black/50">Critical</div>
          <div className="text-4xl font-semibold text-[#a11111]">
            {enterpriseStats.critical}
          </div>
          <div className="text-sm text-black/50">red flag</div>
        </div>
        <div className="rounded-2xl border border-black/10 bg-white p-4">
          <div className="text-sm text-black/50">Sessions</div>
          <div className="text-4xl font-semibold text-[#111827]">
            {enterpriseStats.sessions}
          </div>
          <div className="text-sm text-black/50">logged</div>
        </div>
        <div className="rounded-2xl border border-black/10 bg-white p-4">
          <div className="text-sm text-black/50">Mentorship hrs</div>
          <div className="text-4xl font-semibold text-[#111827]">
            {formatHours(enterpriseStats.mentorshipHours)}
          </div>
          <div className="text-sm text-black/50">weekly logs</div>
        </div>
      </div>

      <div className="rounded-2xl border border-black/10 bg-white p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setEnterpriseFilter("all")}
              className={`rounded-full border px-4 py-1.5 text-sm ${
                enterpriseFilter === "all"
                  ? "border-[#163b8f] bg-[#163b8f] text-white"
                  : "border-[#9eb0da] text-[#334155]"
              }`}
            >
              All
            </button>
            {filterCategories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setEnterpriseFilter(category)}
                className={`rounded-full border px-4 py-1.5 text-sm ${
                  enterpriseFilter === category
                    ? "border-[#163b8f] bg-[#163b8f] text-white"
                    : "border-[#9eb0da] text-[#334155]"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              setEditingEnterpriseUuid(null);
              resetEnterpriseForm();
              setShowAddEnterpriseModal(true);
            }}
            className="rounded-lg bg-[#f2dd1b] px-4 py-2 text-sm font-semibold text-[#111827]"
          >
            Add enterprise
          </button>
        </div>

        {filteredEnterprises.length === 0 ? (
          <div className="rounded-xl border border-dashed border-black/20 p-6 text-sm text-black/60">
            No enterprises yet. Use Add enterprise to create one from your
            assigned entrepreneurs.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {filteredEnterprises.map((item) => {
              const enterpriseSessions = Array.isArray(item.TrackerSessions)
                ? item.TrackerSessions
                : [];
              const progress = 0;
              const totalHours = 0;

              return (
                <div
                  key={item.id}
                  className="w-full rounded-2xl border border-black/10 bg-white p-4 text-left"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h3 className="text-2xl font-semibold text-[#111827]">
                      {item.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-[#dbe8ff] px-3 py-1 text-sm font-semibold text-[#163b8f]">
                        {item.category}
                      </span>
                      <button
                        type="button"
                        onClick={() => onEditEnterprise(item)}
                        className="rounded-md border border-[#d0d7e8] px-2.5 py-1 text-xs font-medium text-[#1f3b88]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteEnterprise(item)}
                        disabled={deletingEnterpriseUuid === item.uuid}
                        className="rounded-md bg-[#fee2e2] px-2.5 py-1 text-xs font-semibold text-[#b91c1c] disabled:opacity-60"
                      >
                        {deletingEnterpriseUuid === item.uuid
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1 text-sm text-[#374151]">
                    <div>
                      Sector:{" "}
                      <span className="font-medium">{item.ceSector}</span>
                    </div>
                    <div>
                      BDA:{" "}
                      <span className="font-medium">{item.assignedBda}</span>
                    </div>
                    <div>
                      Lead:{" "}
                      <span className="font-medium">{item.leadContact}</span>
                    </div>
                    <div>
                      Grant (USD):{" "}
                      <span className="font-medium">{item.grantUsd}</span>
                    </div>
                    <div>
                      Award date:{" "}
                      <span className="font-medium">
                        {formatDateDisplay(item.awardDate)}
                      </span>
                    </div>
                    <div className="line-clamp-2 text-black/70">
                      {item.businessDescription}
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-[#374151]">
                    <div>
                      <div className="text-black/60">Sessions</div>
                      <div className="font-medium">
                        {enterpriseSessions.length}
                      </div>
                    </div>
                    <div>
                      <div className="text-black/60">Week logs</div>
                      <div className="font-medium">
                        0 ({formatHours(totalHours)} hrs)
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-medium ${
                        item.flag === "green"
                          ? "bg-[#e1f0d8] text-[#2d6e1f]"
                          : item.flag === "amber"
                            ? "bg-[#fdf1ce] text-[#8a6500]"
                            : "bg-[#fde0e0] text-[#a11111]"
                      }`}
                    >
                      {FLAG_LABEL_MAP[item.flag]}
                    </span>
                    <span className="text-sm text-black/60">
                      Milestones: {progress}%
                    </span>
                  </div>

                  <div className="mt-2 h-2 rounded-full bg-[#e5e7eb]">
                    <div
                      className="h-2 rounded-full bg-[#163b8f]"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/dashboard/mentorTracker/enterprise/${item.uuid}`,
                        )
                      }
                      className="rounded-md border border-[#d0d7e8] px-3 py-1.5 text-xs font-semibold text-[#163b8f]"
                    >
                      Open details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );

  const renderWeeklyTab = () => (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <form
        onSubmit={onCreateWeeklyLog}
        className="rounded-lg border border-black/10 bg-white p-4"
      >
        <h2 className="mb-3 text-lg font-semibold">Create weekly log</h2>
        <div className="grid grid-cols-1 gap-3">
          <select
            className="rounded-md border border-black/10 p-2 pr-10"
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
            {assignedEntrepreneurOptions.map((item) => (
              <option key={item.uuid} value={item.uuid}>
                {item.name}
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
            className="rounded-md border border-black/10 p-2 pr-10"
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

      <div className="rounded-lg border border-black/10 bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold">Latest weekly logs</h2>
        <div className="space-y-2">
          {weeklyLogs.length === 0 && (
            <div className="text-sm text-black/60">No weekly logs yet.</div>
          )}
          {weeklyLogs.map((log) => (
            <div
              key={log.uuid}
              className="rounded border border-black/10 px-3 py-2"
            >
              <button
                type="button"
                onClick={() =>
                  setExpandedWeeklyLogUuid((prev) =>
                    prev === log.uuid ? null : log.uuid,
                  )
                }
                className="flex w-full items-center justify-between gap-2 text-left"
              >
                <div>
                  <div className="font-medium">{log?.Entreprenuer?.name}</div>
                  <div className="text-xs text-black/60">
                    Week: {formatDateDisplay(log.weekStart)}
                  </div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${FLAG_PILL_CLASS_MAP[log.flag] || "bg-[#eef2f8] text-[#475569]"}`}
                >
                  {FLAG_LABEL_MAP[log.flag] || "Unknown"}
                </span>
              </button>

              {expandedWeeklyLogUuid === log.uuid && (
                <div className="mt-2 space-y-1 text-sm text-[#334155]">
                  <div>
                    <span className="font-medium text-[#111827]">Hours:</span>{" "}
                    {log.hours || 0}
                  </div>
                  <div>
                    <span className="font-medium text-[#111827]">
                      Touchpoints:
                    </span>{" "}
                    {log.touchpoints || 0}
                  </div>
                  <div>
                    <span className="font-medium text-[#111827]">Focus:</span>{" "}
                    {log.focus || "N/A"}
                  </div>
                  <div>
                    <span className="font-medium text-[#111827]">
                      Outcomes:
                    </span>{" "}
                    {log.outcomes || "N/A"}
                  </div>
                  <div>
                    <span className="font-medium text-[#111827]">
                      Barriers:
                    </span>{" "}
                    {log.barriers || "N/A"}
                  </div>
                  <div>
                    <span className="font-medium text-[#111827]">
                      Next plan:
                    </span>{" "}
                    {log.nextPlan || "N/A"}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSessionLogTab = () => (
    <div className="rounded-lg border border-black/10 bg-white p-4">
      <h2 className="mb-3 text-lg font-semibold">Session log</h2>
      <div className="space-y-2">
        {weeklyLogs.length === 0 && (
          <div className="text-sm text-black/60">No sessions logged yet.</div>
        )}
        {weeklyLogs.map((log) => (
          <div key={log.uuid} className="rounded-lg border border-black/10 p-3">
            <button
              type="button"
              onClick={() =>
                setExpandedSessionLogUuid((prev) =>
                  prev === log.uuid ? null : log.uuid,
                )
              }
              className="flex w-full items-center justify-between gap-2 text-left"
            >
              <div>
                <div className="mb-1 text-sm font-semibold text-[#111827]">
                  {log?.Entreprenuer?.name}
                </div>
                <div className="text-sm text-black/70">
                  Week {formatDateDisplay(log.weekStart)} • {log.hours}h •{" "}
                  {log.touchpoints} touchpoints
                </div>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${FLAG_PILL_CLASS_MAP[log.flag] || "bg-[#eef2f8] text-[#475569]"}`}
              >
                {FLAG_LABEL_MAP[log.flag] || "Unknown"}
              </span>
            </button>

            {expandedSessionLogUuid === log.uuid && (
              <div className="mt-2 space-y-1 text-sm text-[#334155]">
                <div>
                  <span className="font-medium text-[#111827]">Focus:</span>{" "}
                  {log.focus || "N/A"}
                </div>
                <div>
                  <span className="font-medium text-[#111827]">Outcomes:</span>{" "}
                  {log.outcomes || "N/A"}
                </div>
                <div>
                  <span className="font-medium text-[#111827]">Barriers:</span>{" "}
                  {log.barriers || "N/A"}
                </div>
                <div>
                  <span className="font-medium text-[#111827]">Next plan:</span>{" "}
                  {log.nextPlan || "N/A"}
                </div>
                <div>
                  <span className="font-medium text-[#111827]">
                    Engagement:
                  </span>{" "}
                  {log.engagement || "N/A"}
                </div>
                <div>
                  <span className="font-medium text-[#111827]">
                    Activities:
                  </span>{" "}
                  {Array.isArray(log.activities) && log.activities.length > 0
                    ? log.activities.join(", ")
                    : "N/A"}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderMilestonesTab = () => (
    <>
      <form
        onSubmit={onCreateMilestone}
        className="rounded-lg border border-black/10 bg-white p-4"
      >
        <h2 className="mb-3 text-lg font-semibold">Create milestone</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
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
            {assignedEntrepreneurOptions.map((item) => (
              <option key={item.uuid} value={item.uuid}>
                {item.name}
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

      <div className="rounded-lg border border-black/10 bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold">Milestones</h2>
        <div className="space-y-2">
          {milestones.length === 0 && (
            <div className="text-sm text-black/60">No milestones yet.</div>
          )}
          {milestones.map((item) => (
            <div
              key={item.uuid}
              className="rounded border border-black/10 px-3 py-2"
            >
              <button
                type="button"
                onClick={() =>
                  setExpandedMilestoneUuid((prev) =>
                    prev === item.uuid ? null : item.uuid,
                  )
                }
                className="flex w-full items-center justify-between gap-2 text-left"
              >
                <div>
                  <div className="font-medium">{item.title}</div>
                  <div className="text-xs text-black/60">
                    {item?.Entreprenuer?.name}{" "}
                    {item.dueDate
                      ? `• Due ${formatDateDisplay(item.dueDate)}`
                      : ""}
                  </div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${MILESTONE_STATUS_PILL_CLASS_MAP[item.status] || "bg-[#eef2f8] text-[#475569]"}`}
                >
                  {MILESTONE_STATUS_LABEL_MAP[item.status] || item.status}
                </span>
              </button>

              {expandedMilestoneUuid === item.uuid && (
                <div className="mt-2 border-t border-black/10 pt-2">
                  <div className="mb-2 space-y-1 text-sm text-[#334155]">
                    <div>
                      <span className="font-medium text-[#111827]">
                        Status:
                      </span>{" "}
                      {MILESTONE_STATUS_LABEL_MAP[item.status] || item.status}
                    </div>
                    <div>
                      <span className="font-medium text-[#111827]">
                        Due date:
                      </span>{" "}
                      {item.dueDate ? formatDateDisplay(item.dueDate) : "N/A"}
                    </div>
                    <div>
                      <span className="font-medium text-[#111827]">
                        Submission:
                      </span>{" "}
                      {item.submissionNotes || "N/A"}
                    </div>
                    <div>
                      <span className="font-medium text-[#111827]">
                        Review notes:
                      </span>{" "}
                      {item.mentorReviewNotes || "N/A"}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <select
                      className="rounded-md border border-black/10 p-1 pr-8 text-sm"
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
                      type="button"
                      onClick={() => onReviewMilestone(item.uuid)}
                      className="rounded-md bg-primary px-3 py-1 text-xs font-semibold text-white"
                    >
                      Update
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <div className="space-y-6 bg-[#eef2f8] px-6 py-6">
      <div className="rounded-2xl bg-[#11358b] px-5 py-4 text-white">
        <h1 className="text-2xl font-bold">CECF Mentorship Tracker</h1>
        <p className="text-sm text-white/80">
          VOICES Project • Kigoma Region • BDS Consultancy
        </p>
      </div>

      {renderEnterpriseTab()}

      {showAddEnterpriseModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={onSaveEnterprise}
            className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6"
          >
            <h3 className="mb-4 text-3xl font-semibold text-[#111827]">
              Add enterprise
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-[#475569]">
                  Enterprise name *
                </label>
                <select
                  className="w-full rounded-lg border border-[#b7c5e5] px-3 py-2 pr-10"
                  value={enterpriseForm.entreprenuer_uuid}
                  onChange={(e) =>
                    setEnterpriseForm((prev) => ({
                      ...prev,
                      entreprenuer_uuid: e.target.value,
                    }))
                  }
                  required
                  disabled={Boolean(editingEnterpriseUuid)}
                >
                  <option value="">Select assigned entrepreneur</option>
                  {assignedEntrepreneurOptions.map((item) => (
                    <option key={item.uuid} value={item.uuid}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[#475569]">
                  Program *
                </label>
                <select
                  className="w-full rounded-lg border border-[#b7c5e5] px-3 py-2 pr-10"
                  value={enterpriseForm.program_uuid}
                  onChange={(e) => {
                    const nextProgramUuid = e.target.value;
                    const nextProgram =
                      programs.find((item) => item.uuid === nextProgramUuid) ||
                      null;
                    const nextProgramCategories =
                      getProgramCategories(nextProgram);

                    setEnterpriseForm((prev) => ({
                      ...prev,
                      program_uuid: nextProgramUuid,
                      category: nextProgramCategories[0] || "",
                    }));
                  }}
                  required={!editingEnterpriseUuid}
                >
                  <option value="">Select program</option>
                  {programs.map((item) => (
                    <option key={item.uuid} value={item.uuid}>
                      {item.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[#475569]">
                  Category *
                </label>
                <select
                  className="w-full rounded-lg border border-[#b7c5e5] px-3 py-2 pr-10"
                  value={enterpriseForm.category}
                  onChange={(e) =>
                    setEnterpriseForm((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                  required
                >
                  <option value="">Select category</option>
                  {enterpriseCategoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[#475569]">
                  CE sector *
                </label>
                <select
                  className="w-full rounded-lg border border-[#b7c5e5] px-3 py-2 pr-10"
                  value={enterpriseForm.ceSector}
                  onChange={(e) =>
                    setEnterpriseForm((prev) => ({
                      ...prev,
                      ceSector: e.target.value,
                    }))
                  }
                  required
                >
                  <option value="">Select sector</option>
                  {CE_SECTORS.map((sector) => (
                    <option key={sector} value={sector}>
                      {sector}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[#475569]">
                  Assigned BDA *
                </label>
                <input
                  className="w-full rounded-lg border border-[#b7c5e5] px-3 py-2"
                  value={enterpriseForm.assignedBda}
                  onChange={(e) =>
                    setEnterpriseForm((prev) => ({
                      ...prev,
                      assignedBda: e.target.value,
                    }))
                  }
                  placeholder="BDA"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[#475569]">
                  District *
                </label>
                <select
                  className="w-full rounded-lg border border-[#b7c5e5] px-3 py-2 pr-10"
                  value={enterpriseForm.district}
                  onChange={(e) =>
                    setEnterpriseForm((prev) => ({
                      ...prev,
                      district: e.target.value,
                    }))
                  }
                  required
                >
                  <option value="">Select district</option>
                  {DISTRICTS.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[#475569]">
                  Lead contact *
                </label>
                <input
                  className="w-full rounded-lg border border-[#b7c5e5] px-3 py-2"
                  value={enterpriseForm.leadContact}
                  onChange={(e) =>
                    setEnterpriseForm((prev) => ({
                      ...prev,
                      leadContact: e.target.value,
                    }))
                  }
                  placeholder="Lead contact"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[#475569]">
                  Grant (USD) *
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full rounded-lg border border-[#b7c5e5] px-3 py-2"
                  value={enterpriseForm.grantUsd}
                  onChange={(e) =>
                    setEnterpriseForm((prev) => ({
                      ...prev,
                      grantUsd: e.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[#475569]">
                  Award date *
                </label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-[#b7c5e5] px-3 py-2"
                  value={formatDateForInput(enterpriseForm.awardDate)}
                  onChange={(e) =>
                    setEnterpriseForm((prev) => ({
                      ...prev,
                      awardDate: e.target.value,
                    }))
                  }
                  required
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium text-[#475569]">
                Business description *
              </label>
              <textarea
                className="min-h-[120px] w-full rounded-lg border border-[#b7c5e5] px-3 py-2"
                value={enterpriseForm.businessDescription}
                onChange={(e) =>
                  setEnterpriseForm((prev) => ({
                    ...prev,
                    businessDescription: e.target.value,
                  }))
                }
                placeholder="Description"
                required
              />
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeEnterpriseModal}
                disabled={isSavingEnterprise}
                className="rounded-lg border border-black/15 px-5 py-2 font-medium text-[#334155]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingEnterprise}
                className="rounded-lg bg-[#163b8f] px-5 py-2 font-semibold text-white disabled:opacity-60"
              >
                {isSavingEnterprise
                  ? editingEnterpriseUuid
                    ? "Updating..."
                    : "Saving..."
                  : editingEnterpriseUuid
                    ? "Update enterprise"
                    : "Save enterprise"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default MentorTracker;
