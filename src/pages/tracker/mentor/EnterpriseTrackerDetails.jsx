import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import Loader from "@/components/common/Loader";
import {
  createMentorEnterpriseMilestone,
  createMentorEnterpriseSession,
  createMentorEnterpriseWeeklyLog,
  getMentorEnterpriseDetails,
  reviewTrackerMilestone,
  updateMentorEnterpriseTrancheStages,
  updateMentorEnterpriseKpis,
} from "@/controllers/trackerController";

const FLAG_OPTIONS = [
  { value: "green", label: "Green - on track" },
  { value: "amber", label: "Amber - at risk" },
  { value: "red", label: "Red - critical" },
];

const ACTIVITY_OPTIONS = [
  "Weekly coaching call",
  "Financial advisory",
  "Milestone review",
  "Business model support",
  "Governance / compliance",
  "Market linkage support",
  "Investment readiness",
  "CE performance coaching",
  "Red flag follow-up",
];

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

const getFlagPillClass = (flag) => {
  if (flag === "green") {
    return "bg-[#e1f0d8] text-[#2d6e1f]";
  }
  if (flag === "amber") {
    return "bg-[#fdf1ce] text-[#8a6500]";
  }
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

const getLinkedTrancheDisplay = (milestone) => {
  if (milestone?.linkedTranche) {
    return milestone.linkedTranche;
  }

  const description = milestone?.description || "";
  const match = description.match(/Linked tranche:\s*(.+)$/i);
  return match ? match[1].trim() : "N/A";
};

const getMilestoneDescriptionDisplay = (milestone) => {
  const description = milestone?.description || "";
  return (
    description.replace(/\n?\n?Linked tranche:\s*.+$/i, "").trim() || "N/A"
  );
};

const normalizeTrancheStages = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => ({
        title: String(item?.title || "").trim(),
        date: item?.date ? String(item.date).slice(0, 10) : "",
        amount: Number(item?.amount || 0),
      }))
      .filter((item) => item.title && item.date);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return normalizeTrancheStages(parsed);
    } catch (error) {
      return [];
    }
  }

  return [];
};

const parseSubmissionAttachments = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
};

const EnterpriseTrackerDetails = () => {
  const { enterpriseUuid } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState(null);
  const [activeSection, setActiveSection] = useState("sessions");

  const [showKpiModal, setShowKpiModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showWeekLogModal, setShowWeekLogModal] = useState(false);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [expandedSessionUuid, setExpandedSessionUuid] = useState(null);
  const [expandedWeeklyUuid, setExpandedWeeklyUuid] = useState(null);
  const [expandedMilestoneUuid, setExpandedMilestoneUuid] = useState(null);
  const [isSavingTrancheStages, setIsSavingTrancheStages] = useState(false);

  const [kpiForm, setKpiForm] = useState({
    monthlyRevenue: "0",
    employees: "0",
    wasteDiverted: "0",
    ceReadinessScore: "",
    capitalMobilised: "0",
    activeCustomers: "0",
  });

  const [sessionForm, setSessionForm] = useState({
    sessionDate: "",
    facilitator: "",
    sessionType: "Weekly coaching",
    issuesDiscussed: "",
    recommendationsGiven: "",
    actionsAgreed: "",
    nextSessionDate: "",
    flag: "green",
  });

  const [weekLogForm, setWeekLogForm] = useState({
    weekStart: "",
    facilitator: "",
    hours: "",
    touchpoints: "",
    activities: [],
    focus: "",
    outcomes: "",
    barriers: "",
    nextPlan: "",
    engagement: "high",
    flag: "green",
  });

  const [milestoneForm, setMilestoneForm] = useState({
    title: "",
    dueDate: "",
    status: "pending",
    linkedTranche: "None",
    description: "",
  });

  const [trancheForm, setTrancheForm] = useState({
    title: "",
    date: "",
    amount: "",
  });
  const [reviewState, setReviewState] = useState({});
  const [reviewingById, setReviewingById] = useState({});

  const enterprise = details?.enterprise;
  const sessions = details?.sessions || [];
  const weeklyLogs = details?.weeklyLogs || [];
  const milestones = details?.milestones || [];
  const stats = details?.stats || {};
  const trancheStages = useMemo(() => {
    const fromResponse = details?.trancheStages;
    if (Array.isArray(fromResponse)) {
      return normalizeTrancheStages(fromResponse);
    }

    return normalizeTrancheStages(enterprise?.trancheStages);
  }, [details?.trancheStages, enterprise?.trancheStages]);

  const metricCards = useMemo(
    () => [
      {
        label: "Revenue/month",
        value: `$${Number(enterprise?.monthlyRevenue || 0)}`,
        sub: "USD",
      },
      {
        label: "Employees",
        value: Number(enterprise?.employees || 0),
        sub: "FTE",
      },
      {
        label: "Waste diverted",
        value: Number(enterprise?.wasteDiverted || 0),
        sub: "kg/mo",
      },
      {
        label: "CE readiness",
        value:
          enterprise?.ceReadinessScore === null ||
          enterprise?.ceReadinessScore === undefined
            ? "-"
            : Number(enterprise.ceReadinessScore),
        sub: "/ 5.0",
      },
      {
        label: "Mentorship hrs",
        value: Number(stats.mentorshipHours || 0).toFixed(1),
        sub: `${stats.weeklyLogsCount || 0} weeks`,
      },
      {
        label: "Capital mobilised",
        value: `$${Number(enterprise?.capitalMobilised || 0)}`,
        sub: "USD",
      },
    ],
    [enterprise, stats],
  );

  const loadDetails = async () => {
    if (!enterpriseUuid) return;

    setLoading(true);
    try {
      const response = await getMentorEnterpriseDetails(enterpriseUuid);
      setDetails(response);

      const currentEnterprise = response?.enterprise;
      setKpiForm({
        monthlyRevenue: String(Number(currentEnterprise?.monthlyRevenue || 0)),
        employees: String(Number(currentEnterprise?.employees || 0)),
        wasteDiverted: String(Number(currentEnterprise?.wasteDiverted || 0)),
        ceReadinessScore:
          currentEnterprise?.ceReadinessScore === null ||
          currentEnterprise?.ceReadinessScore === undefined
            ? ""
            : String(Number(currentEnterprise?.ceReadinessScore || 0)),
        capitalMobilised: String(
          Number(currentEnterprise?.capitalMobilised || 0),
        ),
        activeCustomers: String(
          Number(currentEnterprise?.activeCustomers || 0),
        ),
      });
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to load enterprise",
      );
      navigate("/dashboard/mentorTracker");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [enterpriseUuid]);

  const onToggleActivity = (activity) => {
    setWeekLogForm((prev) => {
      const exists = prev.activities.includes(activity);
      return {
        ...prev,
        activities: exists
          ? prev.activities.filter((item) => item !== activity)
          : [...prev.activities, activity],
      };
    });
  };

  const onSubmitKpis = async (e) => {
    e.preventDefault();
    try {
      await updateMentorEnterpriseKpis(enterpriseUuid, kpiForm);
      toast.success("KPIs updated");
      setShowKpiModal(false);
      loadDetails();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update KPIs");
    }
  };

  const onSubmitSession = async (e) => {
    e.preventDefault();
    try {
      await createMentorEnterpriseSession(enterpriseUuid, sessionForm);
      toast.success("Session saved");
      setShowSessionModal(false);
      setSessionForm({
        sessionDate: "",
        facilitator: "",
        sessionType: "Weekly coaching",
        issuesDiscussed: "",
        recommendationsGiven: "",
        actionsAgreed: "",
        nextSessionDate: "",
        flag: "green",
      });
      loadDetails();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save session");
    }
  };

  const onSubmitWeekLog = async (e) => {
    e.preventDefault();
    try {
      await createMentorEnterpriseWeeklyLog(enterpriseUuid, weekLogForm);
      toast.success("Weekly log saved");
      setShowWeekLogModal(false);
      setWeekLogForm({
        weekStart: "",
        facilitator: "",
        hours: "",
        touchpoints: "",
        activities: [],
        focus: "",
        outcomes: "",
        barriers: "",
        nextPlan: "",
        engagement: "high",
        flag: "green",
      });
      loadDetails();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to save weekly log",
      );
    }
  };

  const onSubmitMilestone = async (e) => {
    e.preventDefault();
    try {
      await createMentorEnterpriseMilestone(enterpriseUuid, milestoneForm);
      toast.success("Milestone saved");
      setShowMilestoneModal(false);
      setMilestoneForm({
        title: "",
        dueDate: "",
        status: "pending",
        linkedTranche: "None",
        description: "",
      });
      loadDetails();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save milestone");
    }
  };

  const onReviewMilestone = async (uuid) => {
    const payload = reviewState[uuid] || {};
    if (!payload.status) {
      toast.error("Select a review status");
      return;
    }

    setReviewingById((prev) => ({ ...prev, [uuid]: true }));
    try {
      await reviewTrackerMilestone(uuid, {
        status: payload.status,
        mentorReviewNotes: payload.mentorReviewNotes || "",
      });
      toast.success("Milestone reviewed");
      setReviewState((prev) => ({ ...prev, [uuid]: {} }));
      loadDetails();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to review milestone",
      );
    } finally {
      setReviewingById((prev) => ({ ...prev, [uuid]: false }));
    }
  };

  const persistTrancheStages = async (nextTrancheStages) => {
    setIsSavingTrancheStages(true);
    try {
      const response = await updateMentorEnterpriseTrancheStages(
        enterpriseUuid,
        {
          trancheStages: nextTrancheStages,
        },
      );

      const savedStages = normalizeTrancheStages(
        response?.trancheStages || nextTrancheStages,
      );

      setDetails((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          trancheStages: savedStages,
          enterprise: {
            ...prev.enterprise,
            trancheStages: JSON.stringify(savedStages),
          },
        };
      });

      return savedStages;
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to update tranche stages",
      );
      return null;
    } finally {
      setIsSavingTrancheStages(false);
    }
  };

  const onAddTrancheStage = async (e) => {
    e.preventDefault();

    const title = trancheForm.title.trim();
    const date = trancheForm.date;
    const amount = Number(trancheForm.amount);

    if (!title || !date) {
      toast.error("Tranche title and date are required");
      return;
    }

    if (!Number.isFinite(amount) || amount < 0) {
      toast.error("Tranche amount must be a valid number");
      return;
    }

    const nextTrancheStages = [
      ...trancheStages,
      {
        title,
        date,
        amount,
      },
    ];

    const savedStages = await persistTrancheStages(nextTrancheStages);
    if (!savedStages) {
      return;
    }

    setTrancheForm({ title: "", date: "", amount: "" });
    toast.success("Tranche stage added");
  };

  const onRemoveTrancheStage = async (indexToRemove) => {
    const nextTrancheStages = trancheStages.filter(
      (_, index) => index !== indexToRemove,
    );

    const savedStages = await persistTrancheStages(nextTrancheStages);
    if (!savedStages) {
      return;
    }

    setMilestoneForm((prev) => {
      if (prev.linkedTranche === "None") {
        return prev;
      }

      const exists = savedStages.some(
        (item) => item.title === prev.linkedTranche,
      );
      return exists ? prev : { ...prev, linkedTranche: "None" };
    });

    toast.success("Tranche stage removed");
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="space-y-5 bg-[#eef2f8] px-6 py-6">
      <button
        type="button"
        onClick={() => navigate("/dashboard/mentorTracker")}
        className="text-sm font-medium text-[#163b8f]"
      >
        Back to enterprises
      </button>

      <div className="rounded-2xl border border-[#cad5ea] bg-white p-5">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-4xl font-semibold text-[#111827]">
              {enterprise?.name || "Enterprise"}
            </h1>
            <p className="text-sm text-[#374151]">
              {enterprise?.ceSector || "-"} · {enterprise?.district || "-"} ·
              Grant: ${Number(enterprise?.grantUsd || 0)}
            </p>
            <p className="text-sm text-[#374151]">
              Contact: {enterprise?.leadContact || "N/A"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowKpiModal(true)}
              className="rounded-xl border border-[#b7c5e5] px-4 py-2 text-sm text-[#111827]"
            >
              KPIs
            </button>
            <button
              type="button"
              onClick={() => setShowSessionModal(true)}
              className="rounded-xl border border-[#b7c5e5] px-4 py-2 text-sm text-[#111827]"
            >
              Session
            </button>
            <button
              type="button"
              onClick={() => setShowWeekLogModal(true)}
              className="rounded-xl border border-[#b7c5e5] px-4 py-2 text-sm text-[#111827]"
            >
              Week log
            </button>
            <button
              type="button"
              onClick={() => setShowMilestoneModal(true)}
              className="rounded-xl border border-[#b7c5e5] px-4 py-2 text-sm text-[#111827]"
            >
              Milestone
            </button>
          </div>
        </div>

        <div className="mb-4 rounded-xl bg-[#eef2f8] px-4 py-3 text-sm text-[#374151]">
          {enterprise?.businessDescription || "No description provided."}
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
          {metricCards.map((item) => (
            <div key={item.label} className="rounded-xl bg-[#eef2f8] p-3">
              <div className="text-sm text-[#64748b]">{item.label}</div>
              <div className="text-4xl font-semibold text-[#111827]">
                {item.value}
              </div>
              <div className="text-sm text-[#64748b]">{item.sub}</div>
            </div>
          ))}
        </div>

        <div className="mt-5 border-b border-[#d4dbe8]">
          <div className="flex flex-wrap gap-4">
            <button
              type="button"
              onClick={() => setActiveSection("sessions")}
              className={`border-b-2 pb-2 text-sm font-medium ${
                activeSection === "sessions"
                  ? "border-[#163b8f] text-[#163b8f]"
                  : "border-transparent text-[#475569]"
              }`}
            >
              Sessions ({sessions.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveSection("weekly")}
              className={`border-b-2 pb-2 text-sm font-medium ${
                activeSection === "weekly"
                  ? "border-[#163b8f] text-[#163b8f]"
                  : "border-transparent text-[#475569]"
              }`}
            >
              Weekly logs ({weeklyLogs.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveSection("milestones")}
              className={`border-b-2 pb-2 text-sm font-medium ${
                activeSection === "milestones"
                  ? "border-[#163b8f] text-[#163b8f]"
                  : "border-transparent text-[#475569]"
              }`}
            >
              Milestones ({milestones.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveSection("tranches")}
              className={`border-b-2 pb-2 text-sm font-medium ${
                activeSection === "tranches"
                  ? "border-[#163b8f] text-[#163b8f]"
                  : "border-transparent text-[#475569]"
              }`}
            >
              Tranche stages ({trancheStages.length})
            </button>
          </div>
        </div>

        <div className="mt-4 min-h-[220px]">
          {activeSection === "sessions" && (
            <div className="space-y-3">
              {sessions.length === 0 && (
                <div className="py-10 text-center text-[#6b7280]">
                  No sessions logged yet.
                </div>
              )}
              {sessions.map((item) => (
                <button
                  type="button"
                  onClick={() =>
                    setExpandedSessionUuid((prev) =>
                      prev === item.uuid ? null : item.uuid,
                    )
                  }
                  key={item.uuid}
                  className="w-full rounded-xl border border-black/10 p-3 text-left"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-[#111827]">
                      {formatDateDisplay(item.sessionDate)} ·{" "}
                      {item.sessionType || "Session"}
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getFlagPillClass(item.flag)}`}
                    >
                      {getFlagLabel(item.flag)}
                    </span>
                  </div>

                  {expandedSessionUuid === item.uuid ? (
                    <div className="mt-3 space-y-2 text-sm text-[#475569]">
                      <div>
                        <span className="font-medium text-[#111827]">
                          Session date:
                        </span>{" "}
                        {item.sessionDate
                          ? formatDateDisplay(item.sessionDate)
                          : "N/A"}
                      </div>
                      <div>
                        <span className="font-medium text-[#111827]">
                          Session type:
                        </span>{" "}
                        {item.sessionType || "N/A"}
                      </div>
                      <div>
                        <span className="font-medium text-[#111827]">
                          Status:
                        </span>{" "}
                        {getFlagLabel(item.flag)}
                      </div>
                      <div>
                        <span className="font-medium text-[#111827]">
                          Facilitator:
                        </span>{" "}
                        {item.facilitator || "N/A"}
                      </div>
                      <div>
                        <span className="font-medium text-[#111827]">
                          Issues discussed:
                        </span>{" "}
                        {item.issuesDiscussed || "N/A"}
                      </div>
                      <div>
                        <span className="font-medium text-[#111827]">
                          Recommendations:
                        </span>{" "}
                        {item.recommendationsGiven || "N/A"}
                      </div>
                      <div>
                        <span className="font-medium text-[#111827]">
                          Actions agreed:
                        </span>{" "}
                        {item.actionsAgreed || "N/A"}
                      </div>
                      <div>
                        <span className="font-medium text-[#111827]">
                          Next session:
                        </span>{" "}
                        {item.nextSessionDate
                          ? formatDateDisplay(item.nextSessionDate)
                          : "N/A"}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1 text-sm text-[#475569] line-clamp-1">
                      {item.issuesDiscussed || "No issues recorded"}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {activeSection === "weekly" && (
            <div className="space-y-3">
              {weeklyLogs.length === 0 && (
                <div className="py-10 text-center text-[#6b7280]">
                  No weekly logs yet.
                </div>
              )}
              {weeklyLogs.map((item) => (
                <button
                  type="button"
                  onClick={() =>
                    setExpandedWeeklyUuid((prev) =>
                      prev === item.uuid ? null : item.uuid,
                    )
                  }
                  key={item.uuid}
                  className="w-full rounded-xl border border-black/10 p-3 text-left"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-[#111827]">
                      Week {formatDateDisplay(item.weekStart)} · {item.hours}h ·{" "}
                      {item.touchpoints} touchpoints
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getFlagPillClass(item.flag)}`}
                    >
                      {getFlagLabel(item.flag)}
                    </span>
                  </div>

                  {expandedWeeklyUuid === item.uuid ? (
                    <div className="mt-3 space-y-2 text-sm text-[#475569]">
                      <div>
                        <span className="font-medium text-[#111827]">
                          Facilitator:
                        </span>{" "}
                        {item.facilitator || "N/A"}
                      </div>
                      <div>
                        <span className="font-medium text-[#111827]">
                          Status:
                        </span>{" "}
                        {getFlagLabel(item.flag)}
                      </div>
                      <div>
                        <span className="font-medium text-[#111827]">
                          Focus:
                        </span>{" "}
                        {item.focus || "N/A"}
                      </div>
                      <div>
                        <span className="font-medium text-[#111827]">
                          Outcomes:
                        </span>{" "}
                        {item.outcomes || "N/A"}
                      </div>
                      <div>
                        <span className="font-medium text-[#111827]">
                          Barriers:
                        </span>{" "}
                        {item.barriers || "N/A"}
                      </div>
                      <div>
                        <span className="font-medium text-[#111827]">
                          Next plan:
                        </span>{" "}
                        {item.nextPlan || "N/A"}
                      </div>
                      <div>
                        <span className="font-medium text-[#111827]">
                          Engagement:
                        </span>{" "}
                        {item.engagement || "N/A"}
                      </div>
                      {Array.isArray(item.activities) &&
                        item.activities.length > 0 && (
                          <div>
                            <span className="font-medium text-[#111827]">
                              Activities:
                            </span>{" "}
                            {item.activities.join(", ")}
                          </div>
                        )}
                    </div>
                  ) : (
                    <div className="mt-1 text-sm text-[#475569] line-clamp-1">
                      {item.focus || "No focus recorded"}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {activeSection === "milestones" && (
            <div className="space-y-3">
              {milestones.length === 0 && (
                <div className="py-10 text-center text-[#6b7280]">
                  No milestones yet.
                </div>
              )}
              {milestones.map((item) => (
                <div
                  key={item.uuid}
                  className="w-full rounded-xl border border-black/10 p-3 text-left"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedMilestoneUuid((prev) =>
                        prev === item.uuid ? null : item.uuid,
                      )
                    }
                    className="w-full text-left"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-[#111827]">
                        {item.title}
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getMilestonePillClass(item.status)}`}
                      >
                        {formatMilestoneStatus(item.status)}
                      </span>
                    </div>

                    {expandedMilestoneUuid !== item.uuid && (
                      <div className="mt-1 text-sm text-[#475569]">
                        Due:{" "}
                        {item.dueDate ? formatDateDisplay(item.dueDate) : "N/A"}
                      </div>
                    )}
                  </button>

                  {expandedMilestoneUuid === item.uuid && (
                    <div className="mt-3 space-y-2 text-sm text-[#475569]">
                      <div>
                        <span className="font-medium text-[#111827]">
                          Due date:
                        </span>{" "}
                        {item.dueDate ? formatDateDisplay(item.dueDate) : "N/A"}
                      </div>
                      <div>
                        <span className="font-medium text-[#111827]">
                          Linked tranche:
                        </span>{" "}
                        {getLinkedTrancheDisplay(item)}
                      </div>
                      <div>
                        <span className="font-medium text-[#111827]">
                          Description:
                        </span>{" "}
                        {getMilestoneDescriptionDisplay(item)}
                      </div>
                      <div>
                        <span className="font-medium text-[#111827]">
                          Submission notes:
                        </span>{" "}
                        {item.submissionNotes || "N/A"}
                      </div>
                      {parseSubmissionAttachments(item.submissionAttachments)
                        .length > 0 && (
                        <div>
                          <span className="font-medium text-[#111827]">
                            Attachments:
                          </span>
                          <div className="mt-1 flex flex-wrap gap-2">
                            {parseSubmissionAttachments(
                              item.submissionAttachments,
                            ).map((url, idx) => (
                              <a
                                key={`${item.uuid}-attachment-${idx}`}
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded bg-[#dbe8ff] px-2 py-1 text-xs font-semibold text-[#163b8f] underline"
                              >
                                Attachment {idx + 1}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      <div>
                        <span className="font-medium text-[#111827]">
                          Review notes:
                        </span>{" "}
                        {item.mentorReviewNotes || "N/A"}
                      </div>

                      <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
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
                          value={
                            reviewState[item.uuid]?.mentorReviewNotes || ""
                          }
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
                          disabled={reviewingById[item.uuid]}
                          className="rounded-md bg-[#163b8f] px-3 py-1 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {reviewingById[item.uuid] ? "Updating..." : "Update"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeSection === "tranches" && (
            <div className="space-y-4">
              <form
                onSubmit={onAddTrancheStage}
                className="rounded-xl border border-black/10 p-4"
              >
                <h3 className="mb-3 text-base font-semibold text-[#111827]">
                  Add tranche stage
                </h3>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#334155]">
                      Tranche title
                    </label>
                    <input
                      className="w-full rounded-lg border border-[#b7c5e5] px-3 py-2"
                      placeholder="Tranche title"
                      value={trancheForm.title}
                      onChange={(e) =>
                        setTrancheForm((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#334155]">
                      Tranche date
                    </label>
                    <input
                      className="w-full rounded-lg border border-[#b7c5e5] px-3 py-2"
                      type="date"
                      value={trancheForm.date}
                      onChange={(e) =>
                        setTrancheForm((prev) => ({
                          ...prev,
                          date: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#334155]">
                      Amount (USD)
                    </label>
                    <input
                      className="w-full rounded-lg border border-[#b7c5e5] px-3 py-2"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Amount (USD)"
                      value={trancheForm.amount}
                      onChange={(e) =>
                        setTrancheForm((prev) => ({
                          ...prev,
                          amount: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingTrancheStages}
                    className="rounded-lg bg-[#163b8f] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSavingTrancheStages ? "Saving..." : "Add tranche"}
                  </button>
                </div>
              </form>

              <div className="space-y-3">
                {trancheStages.length === 0 && (
                  <div className="py-10 text-center text-[#6b7280]">
                    No tranche stages added yet.
                  </div>
                )}

                {trancheStages.map((item, index) => (
                  <div
                    key={`${item.title}-${item.date}-${index}`}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/10 p-3"
                  >
                    <div>
                      <div className="text-sm font-semibold text-[#111827]">
                        {item.title}
                      </div>
                      <div className="text-sm text-[#475569]">
                        {formatDateDisplay(item.date)} · $
                        {Number(item.amount || 0)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveTrancheStage(index)}
                      disabled={isSavingTrancheStages}
                      className="rounded-lg border border-black/15 px-3 py-1.5 text-sm text-[#111827] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showKpiModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={onSubmitKpis}
            className="w-full max-w-4xl rounded-2xl bg-white p-6"
          >
            <h3 className="mb-4 text-3xl font-semibold text-[#111827]">
              KPIs - {enterprise?.name}
            </h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#334155]">
                  Monthly revenue (USD)
                </label>
                <input
                  className="w-full rounded-lg border border-[#b7c5e5] px-3 py-2"
                  type="number"
                  min="0"
                  value={kpiForm.monthlyRevenue}
                  onChange={(e) =>
                    setKpiForm((prev) => ({
                      ...prev,
                      monthlyRevenue: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#334155]">
                  Employees (FTE)
                </label>
                <input
                  className="w-full rounded-lg border border-[#b7c5e5] px-3 py-2"
                  type="number"
                  min="0"
                  value={kpiForm.employees}
                  onChange={(e) =>
                    setKpiForm((prev) => ({
                      ...prev,
                      employees: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#334155]">
                  Waste diverted (kg/month)
                </label>
                <input
                  className="w-full rounded-lg border border-[#b7c5e5] px-3 py-2"
                  type="number"
                  min="0"
                  value={kpiForm.wasteDiverted}
                  onChange={(e) =>
                    setKpiForm((prev) => ({
                      ...prev,
                      wasteDiverted: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#334155]">
                  CE readiness score (1-5)
                </label>
                <input
                  className="w-full rounded-lg border border-[#b7c5e5] px-3 py-2"
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  value={kpiForm.ceReadinessScore}
                  onChange={(e) =>
                    setKpiForm((prev) => ({
                      ...prev,
                      ceReadinessScore: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#334155]">
                  Capital mobilised (USD)
                </label>
                <input
                  className="w-full rounded-lg border border-[#b7c5e5] px-3 py-2"
                  type="number"
                  min="0"
                  value={kpiForm.capitalMobilised}
                  onChange={(e) =>
                    setKpiForm((prev) => ({
                      ...prev,
                      capitalMobilised: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#334155]">
                  Active customers
                </label>
                <input
                  className="w-full rounded-lg border border-[#b7c5e5] px-3 py-2"
                  type="number"
                  min="0"
                  value={kpiForm.activeCustomers}
                  onChange={(e) =>
                    setKpiForm((prev) => ({
                      ...prev,
                      activeCustomers: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowKpiModal(false)}
                className="rounded-lg border border-black/15 px-5 py-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-[#163b8f] px-5 py-2 font-semibold text-white"
              >
                Update KPIs
              </button>
            </div>
          </form>
        </div>
      )}

      {showSessionModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={onSubmitSession}
            className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-6"
          >
            <h3 className="mb-4 text-3xl font-semibold text-[#111827]">
              Log coaching session
            </h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#334155]">
                  Enterprise
                </label>
                <select
                  className="w-full rounded-lg border border-[#b7c5e5] px-3 py-2 pr-10"
                  value={enterprise?.name || ""}
                  disabled
                >
                  <option>{enterprise?.name || "Enterprise"}</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#334155]">
                  Session date
                </label>
                <input
                  className="w-full rounded-lg border border-[#b7c5e5] px-3 py-2"
                  type="date"
                  value={sessionForm.sessionDate}
                  onChange={(e) =>
                    setSessionForm((prev) => ({
                      ...prev,
                      sessionDate: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#334155]">
                  BDA / Facilitator
                </label>
                <input
                  className="w-full rounded-lg border border-[#b7c5e5] px-3 py-2"
                  placeholder="BDA / Facilitator"
                  value={sessionForm.facilitator}
                  onChange={(e) =>
                    setSessionForm((prev) => ({
                      ...prev,
                      facilitator: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#334155]">
                  Session type
                </label>
                <select
                  className="w-full rounded-lg border border-[#b7c5e5] px-3 py-2 pr-10"
                  value={sessionForm.sessionType}
                  onChange={(e) =>
                    setSessionForm((prev) => ({
                      ...prev,
                      sessionType: e.target.value,
                    }))
                  }
                >
                  <option value="Weekly coaching">Weekly coaching</option>
                  <option value="Financial advisory">Financial advisory</option>
                  <option value="Milestone review">Milestone review</option>
                </select>
              </div>
            </div>

            <div className="mt-3">
              <label className="mb-1 block text-xs font-semibold text-[#334155]">
                Issues discussed
              </label>
              <textarea
                className="min-h-[90px] w-full rounded-lg border border-[#b7c5e5] px-3 py-2"
                placeholder="Issues discussed"
                value={sessionForm.issuesDiscussed}
                onChange={(e) =>
                  setSessionForm((prev) => ({
                    ...prev,
                    issuesDiscussed: e.target.value,
                  }))
                }
              />
            </div>
            <div className="mt-3">
              <label className="mb-1 block text-xs font-semibold text-[#334155]">
                Recommendations given
              </label>
              <textarea
                className="min-h-[90px] w-full rounded-lg border border-[#b7c5e5] px-3 py-2"
                placeholder="Recommendations given"
                value={sessionForm.recommendationsGiven}
                onChange={(e) =>
                  setSessionForm((prev) => ({
                    ...prev,
                    recommendationsGiven: e.target.value,
                  }))
                }
              />
            </div>
            <div className="mt-3">
              <label className="mb-1 block text-xs font-semibold text-[#334155]">
                Actions agreed
              </label>
              <textarea
                className="min-h-[90px] w-full rounded-lg border border-[#b7c5e5] px-3 py-2"
                placeholder="Actions agreed"
                value={sessionForm.actionsAgreed}
                onChange={(e) =>
                  setSessionForm((prev) => ({
                    ...prev,
                    actionsAgreed: e.target.value,
                  }))
                }
              />
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#334155]">
                  Session status
                </label>
                <select
                  className="w-full rounded-lg border border-[#b7c5e5] px-3 py-2 pr-10"
                  value={sessionForm.flag}
                  onChange={(e) =>
                    setSessionForm((prev) => ({
                      ...prev,
                      flag: e.target.value,
                    }))
                  }
                >
                  {FLAG_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#334155]">
                  Next session date
                </label>
                <input
                  className="w-full rounded-lg border border-[#b7c5e5] px-3 py-2"
                  type="date"
                  value={sessionForm.nextSessionDate}
                  onChange={(e) =>
                    setSessionForm((prev) => ({
                      ...prev,
                      nextSessionDate: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowSessionModal(false)}
                className="rounded-lg border border-black/15 px-5 py-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-[#163b8f] px-5 py-2 font-semibold text-white"
              >
                Save session
              </button>
            </div>
          </form>
        </div>
      )}

      {showWeekLogModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={onSubmitWeekLog}
            className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-6"
          >
            <h3 className="mb-4 text-3xl font-semibold text-[#111827]">
              Log weekly mentorship
            </h3>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#334155]">
                  Enterprise
                </label>
                <select
                  className="w-full rounded-lg border border-[#b7c5e5] px-3 py-2 pr-10"
                  value={enterprise?.name || ""}
                  disabled
                >
                  <option>{enterprise?.name || "Enterprise"}</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#334155]">
                  Week start date
                </label>
                <input
                  className="w-full rounded-lg border border-[#b7c5e5] px-3 py-2"
                  type="date"
                  value={weekLogForm.weekStart}
                  onChange={(e) =>
                    setWeekLogForm((prev) => ({
                      ...prev,
                      weekStart: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#334155]">
                  BDA / Mentor
                </label>
                <input
                  className="w-full rounded-lg border border-[#b7c5e5] px-3 py-2"
                  placeholder="BDA / Mentor"
                  value={weekLogForm.facilitator}
                  onChange={(e) =>
                    setWeekLogForm((prev) => ({
                      ...prev,
                      facilitator: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#334155]">
                  Total hours this week
                </label>
                <input
                  className="w-full rounded-lg border border-[#b7c5e5] px-3 py-2"
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="Total hours this week"
                  value={weekLogForm.hours}
                  onChange={(e) =>
                    setWeekLogForm((prev) => ({
                      ...prev,
                      hours: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#334155]">
                  Number of touchpoints
                </label>
                <input
                  className="w-full rounded-lg border border-[#b7c5e5] px-3 py-2"
                  type="number"
                  min="0"
                  placeholder="No. of touchpoints"
                  value={weekLogForm.touchpoints}
                  onChange={(e) =>
                    setWeekLogForm((prev) => ({
                      ...prev,
                      touchpoints: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-2 text-sm font-medium text-[#334155]">
                Mentorship activities this week
              </div>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {ACTIVITY_OPTIONS.map((activity) => (
                  <label
                    key={activity}
                    className="flex items-center gap-2 text-sm text-[#334155]"
                  >
                    <input
                      type="checkbox"
                      checked={weekLogForm.activities.includes(activity)}
                      onChange={() => onToggleActivity(activity)}
                    />
                    {activity}
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-3">
              <label className="mb-1 block text-xs font-semibold text-[#334155]">
                Key focus / issues this week
              </label>
              <textarea
                className="min-h-[90px] w-full rounded-lg border border-[#b7c5e5] px-3 py-2"
                placeholder="Key focus / issues this week"
                value={weekLogForm.focus}
                onChange={(e) =>
                  setWeekLogForm((prev) => ({
                    ...prev,
                    focus: e.target.value,
                  }))
                }
              />
            </div>
            <div className="mt-3">
              <label className="mb-1 block text-xs font-semibold text-[#334155]">
                Progress / outcomes observed
              </label>
              <textarea
                className="min-h-[90px] w-full rounded-lg border border-[#b7c5e5] px-3 py-2"
                placeholder="Progress / outcomes observed"
                value={weekLogForm.outcomes}
                onChange={(e) =>
                  setWeekLogForm((prev) => ({
                    ...prev,
                    outcomes: e.target.value,
                  }))
                }
              />
            </div>
            <div className="mt-3">
              <label className="mb-1 block text-xs font-semibold text-[#334155]">
                Barriers / challenges encountered
              </label>
              <textarea
                className="min-h-[90px] w-full rounded-lg border border-[#b7c5e5] px-3 py-2"
                placeholder="Barriers / challenges encountered"
                value={weekLogForm.barriers}
                onChange={(e) =>
                  setWeekLogForm((prev) => ({
                    ...prev,
                    barriers: e.target.value,
                  }))
                }
              />
            </div>
            <div className="mt-3">
              <label className="mb-1 block text-xs font-semibold text-[#334155]">
                Action plan for next week
              </label>
              <textarea
                className="min-h-[90px] w-full rounded-lg border border-[#b7c5e5] px-3 py-2"
                placeholder="Action plan for next week"
                value={weekLogForm.nextPlan}
                onChange={(e) =>
                  setWeekLogForm((prev) => ({
                    ...prev,
                    nextPlan: e.target.value,
                  }))
                }
              />
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#334155]">
                  Engagement level
                </label>
                <select
                  className="w-full rounded-lg border border-[#b7c5e5] px-3 py-2 pr-10"
                  value={weekLogForm.engagement}
                  onChange={(e) =>
                    setWeekLogForm((prev) => ({
                      ...prev,
                      engagement: e.target.value,
                    }))
                  }
                >
                  <option value="high">High - proactive, well-prepared</option>
                  <option value="medium">Medium - partially engaged</option>
                  <option value="low">Low - inconsistent engagement</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#334155]">
                  Weekly status flag
                </label>
                <select
                  className="w-full rounded-lg border border-[#b7c5e5] px-3 py-2 pr-10"
                  value={weekLogForm.flag}
                  onChange={(e) =>
                    setWeekLogForm((prev) => ({
                      ...prev,
                      flag: e.target.value,
                    }))
                  }
                >
                  {FLAG_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowWeekLogModal(false)}
                className="rounded-lg border border-black/15 px-5 py-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-[#163b8f] px-5 py-2 font-semibold text-white"
              >
                Save weekly log
              </button>
            </div>
          </form>
        </div>
      )}

      {showMilestoneModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={onSubmitMilestone}
            className="w-full max-w-4xl rounded-2xl bg-white p-6"
          >
            <h3 className="mb-4 text-3xl font-semibold text-[#111827]">
              Add milestone
            </h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#334155]">
                  Enterprise
                </label>
                <select
                  className="w-full rounded-lg border border-[#b7c5e5] px-3 py-2 pr-10"
                  value={enterprise?.name || ""}
                  disabled
                >
                  <option>{enterprise?.name || "Enterprise"}</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#334155]">
                  Due date
                </label>
                <input
                  className="w-full rounded-lg border border-[#b7c5e5] px-3 py-2"
                  type="date"
                  value={milestoneForm.dueDate}
                  onChange={(e) =>
                    setMilestoneForm((prev) => ({
                      ...prev,
                      dueDate: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-[#334155]">
                  Milestone title
                </label>
                <input
                  className="w-full rounded-lg border border-[#b7c5e5] px-3 py-2"
                  placeholder="Milestone title"
                  value={milestoneForm.title}
                  onChange={(e) =>
                    setMilestoneForm((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#334155]">
                  Initial status
                </label>
                <select
                  className="w-full rounded-lg border border-[#b7c5e5] px-3 py-2 pr-10"
                  value={milestoneForm.status}
                  onChange={(e) =>
                    setMilestoneForm((prev) => ({
                      ...prev,
                      status: e.target.value,
                    }))
                  }
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#334155]">
                  Linked tranche
                </label>
                <select
                  className="w-full rounded-lg border border-[#b7c5e5] px-3 py-2 pr-10"
                  value={milestoneForm.linkedTranche}
                  onChange={(e) =>
                    setMilestoneForm((prev) => ({
                      ...prev,
                      linkedTranche: e.target.value,
                    }))
                  }
                >
                  <option value="None">None</option>
                  {trancheStages.map((item, index) => (
                    <option
                      key={`${item.title}-${item.date}-${index}`}
                      value={item.title}
                    >
                      {item.title} ({formatDateDisplay(item.date)} · $
                      {Number(item.amount || 0)})
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-[#334155]">
                  Description
                </label>
                <textarea
                  className="min-h-[90px] w-full rounded-lg border border-[#b7c5e5] px-3 py-2"
                  placeholder="Description"
                  value={milestoneForm.description}
                  onChange={(e) =>
                    setMilestoneForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowMilestoneModal(false)}
                className="rounded-lg border border-black/15 px-5 py-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-[#163b8f] px-5 py-2 font-semibold text-white"
              >
                Save milestone
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default EnterpriseTrackerDetails;
