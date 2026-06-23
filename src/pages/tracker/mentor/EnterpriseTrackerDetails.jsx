import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
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
import {
  UploadCloud,
  Building2,
  BarChart3,
  Flag,
  CalendarDays,
  Layers,
  FileText,
  ShieldCheck,
} from "lucide-react";
import {
  PLAN_STATUS,
  parseKpiPlan,
  planStatusLabel,
  planStatusPill,
  canReviewPlan,
  VERIFICATION_OPTIONS,
  verificationLabel,
  verificationPill,
} from "@/utils/trancheWorkflow";

const HERO_IMAGE_URL = "/images/mentor_hero.svg";

const baseInputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#082d77] focus:ring-4 focus:ring-[#082d77]/20 disabled:bg-slate-50 disabled:text-slate-400";

const formatCurrency = (value, currency = "USD") => {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount)) return `${currency} 0`;
  return `${currency} ${amount.toLocaleString()}`;
};

const getBusinessRiskLabel = (flag) => {
  if (flag === "red") return "Critical";
  if (flag === "amber") return "Medium";
  return "Low";
};

const PortalCard = ({ icon, title, subtitle, action, children, className = "" }) => (
  <section className={`rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/70 ${className}`}>
    {(title || subtitle || action || icon) && (
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {icon && (
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#082d77]/5 text-[#082d77]">
              {icon}
            </div>
          )}
          <div>
            {title && <h2 className="text-lg font-black tracking-tight text-slate-950">{title}</h2>}
            {subtitle && <p className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
    )}
    <div className={title || subtitle || action || icon ? "mt-6" : ""}>{children}</div>
  </section>
);

const FieldLabel = ({ children }) => (
  <label className="mb-1.5 block text-xs font-bold tracking-wide text-slate-500">
    {children}
  </label>
);

const DataTile = ({ label, value, helper }) => (
  <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
    <p className="text-xs font-bold tracking-wide text-slate-400">{label}</p>
    <p className="mt-1 text-base font-black text-slate-950">{value}</p>
    {helper && <p className="mt-1 text-xs text-slate-500">{helper}</p>}
  </div>
);

const StatusText = ({ children }) => (
  <span className="text-sm font-semibold text-slate-700">{children}</span>
);

const modalOverlayClass =
  "fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm";
const modalCardClass =
  "max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl shadow-slate-950/20";
const modalHeaderClass =
  "sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5";
const modalCancelClass =
  "rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50";
const modalSubmitClass =
  "rounded-xl bg-[#082d77] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#061f54] disabled:cursor-not-allowed disabled:opacity-60";

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

const formatDateDisplay = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-GB");
};

const getFlagLabel = (flag) => {
  if (flag === "green") return "On track";
  if (flag === "amber") return "At risk";
  if (flag === "red") return "Critical";
  return "Unknown";
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
  const [searchParams] = useSearchParams();
  // Read-only mode (e.g. admin viewing from the tracker overview).
  const readOnly = searchParams.get("view") === "1";

  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState(null);

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
        label: "Mentorship hrs",
        value: Number(stats.mentorshipHours || 0).toFixed(1),
        sub: `${stats.weeklyLogsCount || 0} weeks`,
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

  // Phase 3: BDA approves / requests revision / rejects the proposed plan.
  const onReviewPlan = async (uuid, planStatus) => {
    setReviewingById((prev) => ({ ...prev, [uuid]: true }));
    try {
      await reviewTrackerMilestone(uuid, {
        planStatus,
        mentorReviewNotes: reviewState[uuid]?.mentorReviewNotes || "",
      });
      toast.success(
        planStatus === PLAN_STATUS.APPROVED
          ? "Plan approved — ready for disbursement"
          : planStatus === PLAN_STATUS.REVISION_REQUESTED
            ? "Revision requested"
            : "Plan rejected",
      );
      setReviewState((prev) => ({ ...prev, [uuid]: {} }));
      loadDetails();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update plan");
    } finally {
      setReviewingById((prev) => ({ ...prev, [uuid]: false }));
    }
  };

  // Phase 7: BDA verifies milestone achievement.
  const onVerifyMilestone = async (uuid, verificationStatus) => {
    setReviewingById((prev) => ({ ...prev, [uuid]: true }));
    try {
      await reviewTrackerMilestone(uuid, {
        verificationStatus,
        mentorReviewNotes: reviewState[uuid]?.mentorReviewNotes || "",
      });
      toast.success("Milestone verification recorded");
      setReviewState((prev) => ({ ...prev, [uuid]: {} }));
      loadDetails();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to verify milestone");
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

  const completedMilestones = milestones.filter(
    (item) => String(item.status || "").toLowerCase() === "completed",
  ).length;
  const milestoneProgress = milestones.length
    ? Math.round((completedMilestones / milestones.length) * 100)
    : 0;
  const submittedMilestones = milestones.filter(
    (item) => String(item.status || "").toLowerCase() === "submitted",
  ).length;
  const overdueMilestones = milestones.filter(
    (item) => String(item.status || "").toLowerCase() === "overdue",
  ).length;
  const totalTrancheAmount = trancheStages.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0,
  );
  const submittedDocuments = milestones.flatMap((milestone) =>
    parseSubmissionAttachments(milestone.submissionAttachments).map((url, index) => ({
      id: `${milestone.uuid || milestone.title}-${index}`,
      title: `${milestone.title || "Milestone"} evidence ${index + 1}`,
      url,
    })),
  );

  return (
    <div className="min-h-screen bg-[#f3f6fb] px-4 py-6 text-slate-950 md:px-8 xl:px-12">
      <main className="mx-auto max-w-[1480px] space-y-8">
        <button
          type="button"
          onClick={() => navigate("/dashboard/mentorTracker")}
          className="inline-flex items-center gap-2 text-sm font-bold text-[#082d77] transition hover:text-[#061f54]"
        >
          <span aria-hidden>&larr;</span> Back to startups
        </button>

        <section
          className="relative overflow-hidden rounded-2xl bg-slate-950 px-7 py-6 text-white shadow-sm shadow-slate-300/70 md:px-10 md:py-7"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.6) 50%, rgba(0, 0, 0, 0.2) 100%), url(${HERO_IMAGE_URL})`,
            backgroundPosition: "center",
            backgroundSize: "cover",
          }}
        >
          <div className="relative z-10 flex min-h-[220px] flex-col justify-between gap-6">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-sm font-bold text-white shadow-sm backdrop-blur">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
                  Startup Dashboard
                </div>
                <h1 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">
                  {enterprise?.name || "Enterprise"}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/85 md:text-base">
                  {enterprise?.businessDescription ||
                    "Track milestones, mentorship activity, KPI progress, and milestone-linked funding tranches from one governance workspace."}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => navigate(`/dashboard/mentorTracker/enterprise-kyc/${enterpriseUuid}?view=1`)}
                  className="rounded-xl bg-white/15 px-4 py-2.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/25"
                >
                  View KYC
                </button>
                {!readOnly && (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowSessionModal(true)}
                      className="rounded-xl bg-white/15 px-4 py-2.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/25"
                    >
                      + Coaching Session
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowMilestoneModal(true)}
                      className="rounded-xl bg-white px-4 py-2.5 text-sm font-black text-[#082d77] shadow-sm transition hover:bg-white/90"
                    >
                      + Milestone
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-sm font-bold text-white/90">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-white/15 text-white backdrop-blur">&#9737;</span>
                {enterprise?.district || "Region not set"}
              </div>
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-white/15 text-white backdrop-blur">$</span>
                {formatCurrency(enterprise?.grantUsd)} grant
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.45fr_0.75fr]">
          <div className="space-y-8">
            <PortalCard icon={<Building2 className="h-5 w-5" />} title="Startup Information" subtitle="Core startup profile and program details.">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <DataTile label="Business name" value={enterprise?.name || "N/A"} />
                <DataTile label="Sector" value={enterprise?.ceSector || "N/A"} />
                <DataTile label="Region" value={enterprise?.district || "N/A"} />
                <DataTile label="Lead contact" value={enterprise?.leadContact || "N/A"} />
                <DataTile label="Grant" value={formatCurrency(enterprise?.grantUsd)} />
                <DataTile
                  label="Mentorship hours"
                  value={Number(stats.mentorshipHours || 0).toFixed(1)}
                  helper={`${stats.weeklyLogsCount || 0} weeks`}
                />
              </div>
              <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
                <p className="text-xs font-bold tracking-wide text-slate-400">Business Description</p>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  {enterprise?.businessDescription || "No business description provided."}
                </p>
              </div>
            </PortalCard>

            <PortalCard
              icon={<BarChart3 className="h-5 w-5" />}
              title="KPI Tracking"
              subtitle="Operational indicators for enterprise growth and reporting."
              action={
                readOnly ? undefined : (
                  <button
                    type="button"
                    onClick={() => setShowKpiModal(true)}
                    className="rounded-xl border border-[#082d77]/20 bg-[#082d77]/5 px-4 py-2.5 text-sm font-bold text-[#082d77] transition hover:bg-[#082d77]/10"
                  >
                    Edit KPIs
                  </button>
                )
              }
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6">
                {metricCards.map((item) => (
                  <DataTile key={item.label} label={item.label} value={item.value} helper={item.sub} />
                ))}
              </div>
            </PortalCard>

            <PortalCard
              icon={<Flag className="h-5 w-5" />}
              title="Milestones"
              subtitle="Create milestones, review entrepreneur reports and evidence, and drive tranche eligibility."
              action={
                readOnly ? undefined : (
                  <button
                    type="button"
                    onClick={() => setShowMilestoneModal(true)}
                    className="rounded-xl border border-[#082d77]/20 bg-[#082d77]/5 px-4 py-2.5 text-sm font-bold text-[#082d77] transition hover:bg-[#082d77]/10"
                  >
                    + New Milestone
                  </button>
                )
              }
            >
              <div className="space-y-4">
                {milestones.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                    No milestones yet.
                  </div>
                )}

                {milestones.map((item) => {
                  const attachments = parseSubmissionAttachments(item.submissionAttachments);
                  const expanded = expandedMilestoneUuid === item.uuid;
                  const kpiPlan = parseKpiPlan(item.kpiPlan);
                  const ps = item.planStatus || "";
                  const vs = item.verificationStatus || "";
                  const verificationRequested = Boolean(item.verificationRequested);

                  return (
                    <div key={item.uuid} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedMilestoneUuid((prev) => (prev === item.uuid ? null : item.uuid))
                        }
                        className="flex w-full flex-wrap items-start justify-between gap-3 text-left"
                      >
                        <div>
                          <p className="font-black text-slate-950">{item.title}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            Due {item.dueDate ? formatDateDisplay(item.dueDate) : "N/A"}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Linked tranche: {getLinkedTrancheDisplay(item)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {ps && (
                            <span className={`rounded-full px-3 py-1 text-[10px] font-bold ${planStatusPill(ps)}`}>
                              {planStatusLabel(ps)}
                            </span>
                          )}
                          <StatusText>{formatMilestoneStatus(item.status)}</StatusText>
                        </div>
                      </button>

                      {expanded && (
                        <div className="mt-4 space-y-3">
                          <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                            <p>
                              <span className="font-bold text-slate-950">Description:</span>{" "}
                              {getMilestoneDescriptionDisplay(item)}
                            </p>
                            <p>
                              <span className="font-bold text-slate-950">Submission notes:</span>{" "}
                              {item.submissionNotes || "N/A"}
                            </p>
                            <p>
                              <span className="font-bold text-slate-950">Review notes:</span>{" "}
                              {item.mentorReviewNotes || "N/A"}
                            </p>
                            {attachments.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {attachments.map((url, idx) => (
                                  <a
                                    key={`${item.uuid}-attachment-${idx}`}
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded-xl bg-[#082d77]/5 px-3 py-1.5 text-xs font-bold text-[#082d77] underline"
                                  >
                                    Attachment {idx + 1}
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="rounded-2xl border border-slate-100 p-4">
                            <p className="text-xs font-black uppercase tracking-wide text-[#082d77]">KPI plan</p>
                            {kpiPlan.length === 0 ? (
                              <p className="mt-2 text-sm text-slate-500">No KPI plan submitted.</p>
                            ) : (
                              <div className="mt-3 space-y-2">
                                {kpiPlan.map((kpi, idx) => (
                                  <div key={idx} className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                                    <p className="font-bold text-slate-950">{kpi.name}</p>
                                    <p className="mt-0.5 text-xs text-slate-500">
                                      Target: {kpi.target || "—"} • Evidence: {kpi.evidenceSource || "—"}
                                      {kpi.currentValue ? ` • Current: ${kpi.currentValue}` : ""}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}

                            {!readOnly && canReviewPlan(ps) && (
                              <div className="mt-4 space-y-2">
                                <input
                                  className={baseInputClass}
                                  placeholder="Review note (optional for approve, recommended for revision/reject)"
                                  value={reviewState[item.uuid]?.mentorReviewNotes || ""}
                                  onChange={(e) =>
                                    setReviewState((prev) => ({
                                      ...prev,
                                      [item.uuid]: { ...prev[item.uuid], mentorReviewNotes: e.target.value },
                                    }))
                                  }
                                />
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() => onReviewPlan(item.uuid, PLAN_STATUS.APPROVED)}
                                    disabled={reviewingById[item.uuid]}
                                    className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                                  >
                                    Approve plan
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onReviewPlan(item.uuid, PLAN_STATUS.REVISION_REQUESTED)}
                                    disabled={reviewingById[item.uuid]}
                                    className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-amber-600 disabled:opacity-60"
                                  >
                                    Request revision
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onReviewPlan(item.uuid, PLAN_STATUS.REJECTED)}
                                    disabled={reviewingById[item.uuid]}
                                    className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-rose-700 disabled:opacity-60"
                                  >
                                    Reject
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                          {(verificationRequested || vs) && (
                            <div className="rounded-2xl border border-slate-100 p-4">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs font-black uppercase tracking-wide text-[#082d77]">Milestone verification</p>
                                <span className={`rounded-full px-3 py-1 text-xs font-bold ${verificationPill(vs)}`}>
                                  {verificationLabel(vs)}
                                </span>
                              </div>
                              {verificationRequested && (
                                <p className="mt-2 text-xs font-semibold text-amber-600">
                                  Entrepreneur has requested verification.
                                </p>
                              )}
                              {!readOnly && verificationRequested && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {VERIFICATION_OPTIONS.map((opt) => (
                                    <button
                                      key={opt.value}
                                      type="button"
                                      onClick={() => onVerifyMilestone(item.uuid, opt.value)}
                                      disabled={reviewingById[item.uuid]}
                                      className="rounded-xl border border-[#082d77]/20 bg-[#082d77]/5 px-4 py-2.5 text-sm font-bold text-[#082d77] transition hover:bg-[#082d77]/10 disabled:opacity-60"
                                    >
                                      {opt.label}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {!readOnly && (
                          <div className="grid gap-2 md:grid-cols-[210px_1fr_auto]">
                            <select
                              className={baseInputClass}
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
                              className={baseInputClass}
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
                              disabled={reviewingById[item.uuid]}
                              className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              {reviewingById[item.uuid] ? "Updating..." : "Update"}
                            </button>
                          </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </PortalCard>

            <PortalCard
              icon={<CalendarDays className="h-5 w-5" />}
              title="Coaching Sessions"
              subtitle="Coaching sessions and engagement records for this entrepreneur."
              action={
                readOnly ? undefined : (
                  <button
                    type="button"
                    onClick={() => setShowSessionModal(true)}
                    className="rounded-xl border border-[#082d77]/20 bg-[#082d77]/5 px-4 py-2.5 text-sm font-bold text-[#082d77] transition hover:bg-[#082d77]/10"
                  >
                    + Coaching Session
                  </button>
                )
              }
            >
              <div className="space-y-3">
                {sessions.length === 0 && <p className="text-sm text-slate-500">No sessions logged yet.</p>}
                {sessions.map((item) => {
                  const expanded = expandedSessionUuid === item.uuid;
                  return (
                    <button
                      type="button"
                      key={item.uuid}
                      onClick={() =>
                        setExpandedSessionUuid((prev) => (prev === item.uuid ? null : item.uuid))
                      }
                      className="w-full rounded-2xl bg-slate-50 p-4 text-left"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-bold text-slate-950">
                          {item.sessionDate ? formatDateDisplay(item.sessionDate) : "N/A"}
                        </p>
                        <StatusText>{getFlagLabel(item.flag)}</StatusText>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{item.sessionType || "Session"}</p>
                      {expanded ? (
                        <div className="mt-3 space-y-1 text-sm leading-6 text-slate-600">
                          <p><span className="font-bold text-slate-950">Facilitator:</span> {item.facilitator || "N/A"}</p>
                          <p><span className="font-bold text-slate-950">Issues discussed:</span> {item.issuesDiscussed || "N/A"}</p>
                          <p><span className="font-bold text-slate-950">Recommendations:</span> {item.recommendationsGiven || "N/A"}</p>
                          <p><span className="font-bold text-slate-950">Actions agreed:</span> {item.actionsAgreed || "N/A"}</p>
                          <p><span className="font-bold text-slate-950">Next session:</span> {item.nextSessionDate ? formatDateDisplay(item.nextSessionDate) : "N/A"}</p>
                        </div>
                      ) : (
                        <p className="mt-1 line-clamp-1 text-sm text-slate-500">
                          {item.issuesDiscussed || "No issues recorded"}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </PortalCard>
          </div>

          <aside className="space-y-8">
            <PortalCard icon={<Layers className="h-5 w-5" />} title="Tranche Stages" subtitle="Milestone-linked funding tranches for this startup.">
              {!readOnly && (
              <form
                onSubmit={onAddTrancheStage}
                className="mb-5 grid grid-cols-1 gap-3 rounded-2xl border border-[#082d77]/10 bg-[#082d77]/5 p-4"
              >
                <input
                  className={baseInputClass}
                  placeholder="Tranche title"
                  value={trancheForm.title}
                  onChange={(e) => setTrancheForm((prev) => ({ ...prev, title: e.target.value }))}
                  required
                />
                <input
                  className={baseInputClass}
                  type="date"
                  value={trancheForm.date}
                  onChange={(e) => setTrancheForm((prev) => ({ ...prev, date: e.target.value }))}
                  required
                />
                <input
                  className={baseInputClass}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Amount (USD)"
                  value={trancheForm.amount}
                  onChange={(e) => setTrancheForm((prev) => ({ ...prev, amount: e.target.value }))}
                  required
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingTrancheStages}
                    className="rounded-xl bg-[#082d77] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#061f54] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSavingTrancheStages ? "Saving..." : "Add tranche"}
                  </button>
                </div>
              </form>
              )}

              <div className="space-y-3">
                {trancheStages.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                    No tranche stages added yet.
                  </div>
                )}

                {trancheStages.map((item, index) => (
                  <div
                    key={`${item.title}-${item.date}-${index}`}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-950">{item.title}</p>
                      <p className="text-xs text-slate-500">
                        {formatDateDisplay(item.date)} • {formatCurrency(item.amount)}
                      </p>
                    </div>
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => onRemoveTrancheStage(index)}
                        disabled={isSavingTrancheStages}
                        className="rounded-xl bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </PortalCard>

            <PortalCard icon={<FileText className="h-5 w-5" />} title="Documents" subtitle="Evidence and reporting documents submitted by the entrepreneur.">
              <div className="space-y-3">
                {submittedDocuments.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                    No entrepreneur documents have been submitted yet.
                  </div>
                )}

                {submittedDocuments.map((document) => (
                  <div
                    key={document.id}
                    className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#082d77]/5 text-[#082d77]">
                        <UploadCloud className="h-5 w-5" />
                      </div>
                      <p className="truncate text-sm font-bold text-slate-950">{document.title}</p>
                    </div>
                    <a
                      href={document.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-[#082d77] hover:text-[#061f54]"
                    >
                      View
                    </a>
                  </div>
                ))}
              </div>
            </PortalCard>

            <PortalCard icon={<ShieldCheck className="h-5 w-5" />} title="Risk & Governance" subtitle="Current control signals for this startup.">
              <div className="space-y-3">
                <DataTile label="Business risk" value={getBusinessRiskLabel(enterprise?.flag)} />
                <DataTile label="Submitted reports" value={submittedMilestones} />
                <DataTile label="Overdue milestones" value={overdueMilestones} />
                <DataTile
                  label="Tranche stages"
                  value={trancheStages.length}
                  helper={formatCurrency(totalTrancheAmount)}
                />
              </div>
            </PortalCard>
          </aside>
        </div>
      </main>

      {showKpiModal && (
        <div className={modalOverlayClass}>
          <form onSubmit={onSubmitKpis} className={modalCardClass}>
            <div className={modalHeaderClass}>
              <div>
                <h3 className="text-2xl font-black text-slate-950">KPIs — {enterprise?.name}</h3>
                <p className="mt-1 text-sm text-slate-500">Update the operational indicators for this startup.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowKpiModal(false)}
                className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50"
              >
                ×
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
              <div>
                <FieldLabel>Monthly revenue (USD)</FieldLabel>
                <input className={baseInputClass} type="number" min="0" value={kpiForm.monthlyRevenue} onChange={(e) => setKpiForm((prev) => ({ ...prev, monthlyRevenue: e.target.value }))} />
              </div>
              <div>
                <FieldLabel>Employees (FTE)</FieldLabel>
                <input className={baseInputClass} type="number" min="0" value={kpiForm.employees} onChange={(e) => setKpiForm((prev) => ({ ...prev, employees: e.target.value }))} />
              </div>
              <div>
                <FieldLabel>Active customers</FieldLabel>
                <input className={baseInputClass} type="number" min="0" value={kpiForm.activeCustomers} onChange={(e) => setKpiForm((prev) => ({ ...prev, activeCustomers: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-5">
              <button type="button" onClick={() => setShowKpiModal(false)} className={modalCancelClass}>Cancel</button>
              <button type="submit" className={modalSubmitClass}>Update KPIs</button>
            </div>
          </form>
        </div>
      )}

      {showSessionModal && (
        <div className={modalOverlayClass}>
          <form onSubmit={onSubmitSession} className={modalCardClass}>
            <div className={modalHeaderClass}>
              <div>
                <h3 className="text-2xl font-black text-slate-950">Log a coaching session</h3>
                <p className="mt-1 text-sm text-slate-500">Record a coaching session for {enterprise?.name || "this startup"}.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowSessionModal(false)}
                className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50"
              >
                ×
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
              <div>
                <FieldLabel>Session date</FieldLabel>
                <input className={baseInputClass} type="date" value={sessionForm.sessionDate} onChange={(e) => setSessionForm((prev) => ({ ...prev, sessionDate: e.target.value }))} required />
              </div>
              <div>
                <FieldLabel>BDA / Facilitator</FieldLabel>
                <input className={baseInputClass} placeholder="BDA / Facilitator" value={sessionForm.facilitator} onChange={(e) => setSessionForm((prev) => ({ ...prev, facilitator: e.target.value }))} />
              </div>
              <div>
                <FieldLabel>Session type</FieldLabel>
                <select className={baseInputClass} value={sessionForm.sessionType} onChange={(e) => setSessionForm((prev) => ({ ...prev, sessionType: e.target.value }))}>
                  <option value="Weekly coaching">Weekly coaching</option>
                  <option value="Financial advisory">Financial advisory</option>
                  <option value="Milestone review">Milestone review</option>
                </select>
              </div>
              <div>
                <FieldLabel>Session status</FieldLabel>
                <select className={baseInputClass} value={sessionForm.flag} onChange={(e) => setSessionForm((prev) => ({ ...prev, flag: e.target.value }))}>
                  {FLAG_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <FieldLabel>Issues discussed</FieldLabel>
                <textarea className={`${baseInputClass} min-h-[90px]`} placeholder="Issues discussed" value={sessionForm.issuesDiscussed} onChange={(e) => setSessionForm((prev) => ({ ...prev, issuesDiscussed: e.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <FieldLabel>Recommendations given</FieldLabel>
                <textarea className={`${baseInputClass} min-h-[90px]`} placeholder="Recommendations given" value={sessionForm.recommendationsGiven} onChange={(e) => setSessionForm((prev) => ({ ...prev, recommendationsGiven: e.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <FieldLabel>Actions agreed</FieldLabel>
                <textarea className={`${baseInputClass} min-h-[90px]`} placeholder="Actions agreed" value={sessionForm.actionsAgreed} onChange={(e) => setSessionForm((prev) => ({ ...prev, actionsAgreed: e.target.value }))} />
              </div>
              <div>
                <FieldLabel>Next session date</FieldLabel>
                <input className={baseInputClass} type="date" value={sessionForm.nextSessionDate} onChange={(e) => setSessionForm((prev) => ({ ...prev, nextSessionDate: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-5">
              <button type="button" onClick={() => setShowSessionModal(false)} className={modalCancelClass}>Cancel</button>
              <button type="submit" className={modalSubmitClass}>Save coaching session</button>
            </div>
          </form>
        </div>
      )}

      {showMilestoneModal && (
        <div className={modalOverlayClass}>
          <form onSubmit={onSubmitMilestone} className={modalCardClass}>
            <div className={modalHeaderClass}>
              <div>
                <h3 className="text-2xl font-black text-slate-950">Add milestone</h3>
                <p className="mt-1 text-sm text-slate-500">Create a milestone for {enterprise?.name || "this startup"}.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowMilestoneModal(false)}
                className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50"
              >
                ×
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <FieldLabel>Milestone title</FieldLabel>
                <input className={baseInputClass} placeholder="Milestone title" value={milestoneForm.title} onChange={(e) => setMilestoneForm((prev) => ({ ...prev, title: e.target.value }))} required />
              </div>
              <div>
                <FieldLabel>Due date</FieldLabel>
                <input className={baseInputClass} type="date" value={milestoneForm.dueDate} onChange={(e) => setMilestoneForm((prev) => ({ ...prev, dueDate: e.target.value }))} />
              </div>
              <div>
                <FieldLabel>Initial status</FieldLabel>
                <select className={baseInputClass} value={milestoneForm.status} onChange={(e) => setMilestoneForm((prev) => ({ ...prev, status: e.target.value }))}>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <FieldLabel>Linked tranche</FieldLabel>
                <select className={baseInputClass} value={milestoneForm.linkedTranche} onChange={(e) => setMilestoneForm((prev) => ({ ...prev, linkedTranche: e.target.value }))}>
                  <option value="None">None</option>
                  {trancheStages.map((item, index) => (
                    <option key={`${item.title}-${item.date}-${index}`} value={item.title}>
                      {item.title} ({formatDateDisplay(item.date)} · {formatCurrency(item.amount)})
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <FieldLabel>Description</FieldLabel>
                <textarea className={`${baseInputClass} min-h-[90px]`} placeholder="Description" value={milestoneForm.description} onChange={(e) => setMilestoneForm((prev) => ({ ...prev, description: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-5">
              <button type="button" onClick={() => setShowMilestoneModal(false)} className={modalCancelClass}>Cancel</button>
              <button type="submit" className={modalSubmitClass}>Save milestone</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default EnterpriseTrackerDetails;
