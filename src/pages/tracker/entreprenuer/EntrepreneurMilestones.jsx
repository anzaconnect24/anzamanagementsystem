import { Fragment, useContext, useMemo, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import Loader from "@/components/common/Loader";
import { UserContext } from "@/layouts/DashboardLayout";
import GrantReportButton from "@/components/reports/GrantReportButton";
import {
  createTrackerMilestone,
  getEntrepreneurTrackerDashboard,
  reviseTrackerMilestone,
  submitTrackerMilestone,
  updateEnterpriseBudgetDocument,
  updateMentorEnterpriseKpis,
} from "@/controllers/trackerController";
import { uploadFile } from "@/controllers/file_upload_controller";
import { parseTrackerProgramMeta } from "@/utils/trackerProgramMarkers";
import TrancheGroupList, {
  groupMilestonesByTranche,
} from "@/components/tracker/TrancheGroupList";
import {
  PLAN_STATUS,
  REPORT_STATUS,
  canRevisePlan,
  isPlanApproved,
  isReportOpen,
  parseKpiPlan,
} from "@/utils/trancheWorkflow";
import MilestoneReportTable from "@/components/tracker/MilestoneReportTable";
import MilestoneStatusTable from "@/components/tracker/MilestoneStatusTable";
import {
  TIMELINE_SPAN_OPTIONS,
  buildMilestoneDescription,
  buildSubmissionNotes,
  computeVariance,
  emptyMilestoneActivity,
  milestoneActivitiesDueDate,
  milestoneKpiImpact,
  milestoneReportNotes,
  milestoneTimelineSpan,
  parseMilestonePlan,
  reportFromMilestone,
} from "@/utils/milestoneReport";
import {
  BarChart3,
  Flag,
  ClipboardList,
  Wallet,
  Users,
  UserCheck,
  TrendingUp,
  Briefcase,
  Layers,
  CalendarDays,
} from "lucide-react";

const TRACKER_CATEGORIES_MARKER = "__TRACKER_CATEGORIES__:";
const HERO_IMAGE_URL = "/images/mentor_hero.svg";
const BRAND_BLUE = "#082d77";

// The business coach's verdict and comment are hidden from the startup's
// reporting grid for now — flip this to bring the line back.
const SHOW_COACH_COMMENT = false;

const parseSubmissionAttachments = (value) => {
  if (Array.isArray(value)) return value;

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

const formatCurrency = (value, currency = "USD") => {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount)) return `TZS ${amount || 0}`;
  return `TZS ${amount.toLocaleString()}`;
};

const formatHours = (value) => {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed.toFixed(1) : "0.0";
};

const getProgramDescription = (program) => {
  const description = String(program?.description || "");
  const markerIndex = description.lastIndexOf(TRACKER_CATEGORIES_MARKER);
  if (markerIndex === -1) return description;
  return description.slice(0, markerIndex).trim();
};

const getEnterpriseProgramName = (program, enterprise) =>
  String(
    program?.title ||
      enterprise?.Program?.title ||
      enterprise?.program?.title ||
      enterprise?.programTitle ||
      enterprise?.programName ||
      enterprise?.category ||
      "Program not set",
  ).trim();

const baseInputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#082d77] focus:ring-4 focus:ring-[#082d77]/20 disabled:bg-slate-50 disabled:text-slate-400";

const milestoneLabelClass =
  "mb-1 block text-xs font-black tracking-wide text-[#082d77]";

const milestoneRemoveClass =
  "rounded-xl bg-rose-50 px-3 py-3 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50";

// The Add Milestone table: Tranche and Date Set apply to the whole plan, so
// they're rendered once and rowSpan the full table; Milestone rowSpans just
// its own activities; every other column is one row per activity.
const tableHeadClass =
  "border border-black/10 bg-[#eaf0fb] px-3 py-2 text-left text-xs font-black text-[#111827]";
const tableCellClass =
  "border border-black/10 px-3 py-2 align-top text-sm text-[#334155]";

// How often the page quietly refetches so finance's changes (committed amount,
// released tranches) appear without a manual reload.
const DASHBOARD_REFRESH_MS = 60000;

// The startup plans against their own tranches, not the finance officer's
// schedule — milestones can be drafted before finance has configured one, and a
// plan is not held up waiting for it. Add entries here to offer more.
const MILESTONE_TRANCHE_OPTIONS = ["Tranche 1", "Tranche 2"];

const todayISO = () => new Date().toISOString().slice(0, 10);

// The enterprise's `documents` field is a flat { key: value } object (the
// same one the BDA's KYC screen reads/writes) — parsed defensively since it
// may arrive as a JSON string, an object, or be empty.
const parseDocuments = (value) => {
  if (value && typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
};

const emptyMilestoneRow = () => ({
  title: "",
  linkedTranche: "",
  activities: [emptyMilestoneActivity()],
});

// Each activity's own text is still mirrored into the existing
// tranchePlannedUse string field (bullet-separated) so every other view that
// reads it — the BDA's plan table, the PDF export, report tables — keeps
// working unchanged; the amount and timeline per activity live only in the
// milestone's description marker (see milestoneReport.js).
const ACTIVITY_SEPARATOR = " • ";

const joinActivities = (activities) =>
  (activities || [])
    .map((a) => a.text.trim())
    .filter(Boolean)
    .join(ACTIVITY_SEPARATOR) || "";

// Splits a stored tranchePlannedUse string back into activity text only —
// used to recover a milestone's activity texts (they aren't in the plan
// marker) when reopening it for revision.
const splitActivityTexts = (value) => {
  const parts = String(value || "")
    .split(ACTIVITY_SEPARATOR)
    .map((a) => a.trim())
    .filter(Boolean);
  return parts.length ? parts : [""];
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

const DataTile = ({ label, value, helper }) => (
  <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
    <p className="text-xs font-bold tracking-wide text-slate-400">{label}</p>
    <p className="mt-1 text-base font-black text-slate-950">{value}</p>
    {helper && <p className="mt-1 text-xs text-slate-500">{helper}</p>}
  </div>
);

// One reviewer's verdict on a milestone report: what they decided, then what
// they wrote. Renders an em dash when they have not ruled on it yet.
const ReviewCell = ({ outcome, tone, note }) => {
  if (!outcome && !note) return null;

  return (
    <div className="space-y-1">
      {outcome && (
        <p
          className={`text-xs font-bold ${
            tone === "approved" ? "text-emerald-700" : "text-rose-700"
          }`}
        >
          {outcome}
        </p>
      )}
      <p className="text-[#334155]">{note || "No comment"}</p>
    </div>
  );
};

const EntrepreneurMilestones = () => {
  const navigate = useNavigate();
  const { userDetails } = useContext(UserContext);
  const [loading, setLoading] = useState(true);
  const [isCreatingMilestone, setIsCreatingMilestone] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [selectedEnterpriseUuid, setSelectedEnterpriseUuid] = useState("");
  const [milestones, setMilestones] = useState([]);
  const [weeklyLogs, setWeeklyLogs] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [trancheStages, setTrancheStages] = useState([]);
  const [filesById, setFilesById] = useState({});
  const [submittingById, setSubmittingById] = useState({});
  const [kpiProgressById, setKpiProgressById] = useState({});
  const [savingProgressById, setSavingProgressById] = useState({});

  // Phase 5: the entrepreneur's KPI actuals for a milestone (falls back to the
  // stored plan values until edited).
  const getKpiProgress = (item) => {
    const plan = parseKpiPlan(item.kpiPlan);
    const override = kpiProgressById[item.uuid];
    return plan.map((kpi, idx) => ({
      ...kpi,
      currentValue: override?.[idx]?.currentValue ?? kpi.currentValue ?? "",
      comment: override?.[idx]?.comment ?? kpi.comment ?? "",
    }));
  };

  const setKpiProgress = (uuid, idx, key, value) => {
    setKpiProgressById((prev) => {
      const arr = Array.isArray(prev[uuid]) ? [...prev[uuid]] : [];
      arr[idx] = { ...(arr[idx] || {}), [key]: value };
      return { ...prev, [uuid]: arr };
    });
  };

  // Revising a milestone already sent to the BDA. `revisingUuid` is the one
  // open for editing; `reviseForm` holds its unsaved values.
  const [revisingUuid, setRevisingUuid] = useState(null);
  const [reviseForm, setReviseForm] = useState(null);
  const [savingRevision, setSavingRevision] = useState(false);

  const openRevision = (milestone) => {
    const { activities: planActivities } = parseMilestonePlan(milestone?.description);
    // Activity text lives in tranchePlannedUse, amount/timeline live in the
    // plan marker — pair them back up by position. A milestone predating
    // per-activity planning has one plan entry (its old shared amount and
    // timeline) and possibly several texts; every activity starts out with
    // that same shared amount/timeline, which can then be adjusted per row.
    const texts = splitActivityTexts(milestone.tranchePlannedUse);
    const count = Math.max(texts.length, planActivities.length, 1);
    const activities = Array.from({ length: count }, (_, i) => ({
      text: texts[i] ?? "",
      plannedAmount:
        planActivities[i]?.plannedAmount ?? planActivities[0]?.plannedAmount ?? "",
      timelineSpan:
        planActivities[i]?.timelineSpan ?? planActivities[0]?.timelineSpan ?? "",
      kpiImpact: planActivities[i]?.kpiImpact ?? "",
      setDate: planActivities[i]?.setDate || todayISO(),
    }));

    setRevisingUuid(milestone.uuid);
    setReviseForm({
      title: milestone.title || "",
      activities,
      linkedTranche: milestone.linkedTranche || "",
    });
  };

  const closeRevision = () => {
    setRevisingUuid(null);
    setReviseForm(null);
  };

  const setReviseField = (key, value) =>
    setReviseForm((prev) => ({ ...(prev || {}), [key]: value }));

  const addReviseActivity = () =>
    setReviseForm((prev) => ({
      ...(prev || {}),
      activities: [...(prev?.activities || [emptyMilestoneActivity()]), emptyMilestoneActivity()],
    }));

  const removeReviseActivity = (activityIndex) =>
    setReviseForm((prev) => {
      const activities = prev?.activities || [emptyMilestoneActivity()];
      return {
        ...(prev || {}),
        activities:
          activities.length > 1
            ? activities.filter((_, i) => i !== activityIndex)
            : activities,
      };
    });

  const updateReviseActivity = (activityIndex, field, value) =>
    setReviseForm((prev) => ({
      ...(prev || {}),
      activities: (prev?.activities || [emptyMilestoneActivity()]).map((a, i) =>
        i === activityIndex ? { ...a, [field]: value } : a,
      ),
    }));

  // Milestone reporting grid (planned vs actual, variance, evidence). Unsaved
  // edits live here; anything not touched falls back to what was submitted.
  const [reportById, setReportById] = useState({});

  const getReportRow = (item) =>
    reportById[item.uuid] || reportFromMilestone(item);

  const setReportField = (uuid, key, value) =>
    setReportById((prev) => {
      const current =
        prev[uuid] ||
        reportFromMilestone(milestones.find((m) => m.uuid === uuid));
      return { ...prev, [uuid]: { ...current, [key]: value } };
    });
  // Milestones section is tabbed: "create" (+ Milestone), "report" (Milestone
  // Reporting), "status" (Milestone Status) and "attachments" (Attachments).
  const [milestoneTab, setMilestoneTab] = useState("create");
  // Attachments tab: the startup's budget document + its description. Held
  // as a pending edit until Save, same as the KPI form below.
  const [budgetDocForm, setBudgetDocForm] = useState({ description: "" });
  const [budgetDocFile, setBudgetDocFile] = useState(null);
  const [savingBudgetDoc, setSavingBudgetDoc] = useState(false);
  const [showKpiForm, setShowKpiForm] = useState(false);
  const [savingKpis, setSavingKpis] = useState(false);
  const [kpiForm, setKpiForm] = useState({
    monthlyRevenue: "",
    employees: "",
    wasteDiverted: "",
    ceReadinessScore: "",
    capitalMobilised: "",
    activeCustomers: "",
  });
  // The milestone form collects Milestone / Key activities / Planned amount /
  // KPI-Impact / Timeline, and takes several rows so a whole plan can be
  // entered before it goes to the BDA. Key activities reuse the
  // tranchePlannedUse field the API already stores. Each milestone sets its
  // own tranche and date-set — a plan can cover several tranches at once.
  const [milestoneRows, setMilestoneRows] = useState([emptyMilestoneRow()]);

  const addMilestoneRow = () =>
    setMilestoneRows((prev) => [...prev, emptyMilestoneRow()]);
  const removeMilestoneRow = (index) =>
    setMilestoneRows((prev) =>
      prev.length > 1 ? prev.filter((_, i) => i !== index) : prev,
    );
  const updateMilestoneRow = (index, key, value) =>
    setMilestoneRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [key]: value } : row)),
    );

  const addActivity = (rowIndex) =>
    setMilestoneRows((prev) =>
      prev.map((row, i) =>
        i === rowIndex
          ? { ...row, activities: [...row.activities, emptyMilestoneActivity()] }
          : row,
      ),
    );
  const removeActivity = (rowIndex, activityIndex) =>
    setMilestoneRows((prev) =>
      prev.map((row, i) =>
        i === rowIndex
          ? {
              ...row,
              activities:
                row.activities.length > 1
                  ? row.activities.filter((_, ai) => ai !== activityIndex)
                  : row.activities,
            }
          : row,
      ),
    );
  const updateActivity = (rowIndex, activityIndex, field, value) =>
    setMilestoneRows((prev) =>
      prev.map((row, i) =>
        i === rowIndex
          ? {
              ...row,
              activities: row.activities.map((a, ai) =>
                ai === activityIndex ? { ...a, [field]: value } : a,
              ),
            }
          : row,
      ),
    );

  // `silent` refreshes in the background: no full-page loader, and a failed
  // request leaves what's on screen alone rather than blanking it.
  const loadDashboard = async (enterpriseUuid, { silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const data = await getEntrepreneurTrackerDashboard({
        enterpriseUuid: enterpriseUuid || undefined,
      });

      setDashboard(data || null);
      setMilestones(Array.isArray(data?.milestones) ? data.milestones : []);
      setWeeklyLogs(Array.isArray(data?.weeklyLogs) ? data.weeklyLogs : []);
      setSessions(Array.isArray(data?.sessions) ? data.sessions : []);
      setTrancheStages(Array.isArray(data?.trancheStages) ? data.trancheStages : []);

      if (!selectedEnterpriseUuid && data?.selectedEnterpriseUuid) {
        setSelectedEnterpriseUuid(data.selectedEnterpriseUuid);
      }
    } catch {
      if (silent) return;
      // No tracking workspace yet (the BDA hasn't set up tracking) — show a
      // friendly empty state instead of an error.
      setDashboard(null);
      setMilestones([]);
      setWeeklyLogs([]);
      setSessions([]);
      setTrancheStages([]);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard(selectedEnterpriseUuid);
  }, [selectedEnterpriseUuid]);

  // Finance can set the committed amount or release a tranche while this page is
  // open, so pick those changes up without a manual reload: on a timer, and
  // whenever the tab is brought back to the foreground.
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState !== "visible") return;
      loadDashboard(selectedEnterpriseUuid, { silent: true });
    };

    const interval = setInterval(refresh, DASHBOARD_REFRESH_MS);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [selectedEnterpriseUuid]);

  const onSubmitMilestone = async (uuid) => {
    const targetMilestone = milestones.find((item) => item.uuid === uuid);

    if (targetMilestone?.status === "completed") {
      toast.error("Completed milestones do not need report submission");
      return;
    }

    // Everything is reported in the grid now, so validate the row: a status is
    // always required, and a variance has to be explained.
    const row = targetMilestone ? getReportRow(targetMilestone) : null;

    if (!row?.completionStatus) {
      toast.error("Select a status for this milestone");
      return;
    }

    const variance = computeVariance(row.plannedAmount, row.actualAmount);

    if (variance !== null && variance !== 0 && !String(row.narrative).trim()) {
      toast.error(
        "Planned and actual amounts differ — add a narrative explaining the variance",
      );
      return;
    }

    setSubmittingById((prev) => ({ ...prev, [uuid]: true }));

    try {
      const selectedFiles = Array.from(filesById[uuid] || []);
      const uploadedAttachmentUrls = [];

      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append("file", file);
        const fileUrl = await uploadFile(formData);
        if (typeof fileUrl === "string" && fileUrl.trim()) {
          uploadedAttachmentUrls.push(fileUrl.trim());
        }
      }

      // The row travels as structured data; its narrative doubles as the report
      // text, so anything reading submissionNotes still gets readable prose.
      await submitTrackerMilestone(uuid, {
        submissionNotes: buildSubmissionNotes(row.narrative, row),
        submissionAttachments: uploadedAttachmentUrls,
      });

      toast.success("Report submitted for mentor review");
      setFilesById((prev) => ({ ...prev, [uuid]: [] }));
      setReportById((prev) => {
        const next = { ...prev };
        delete next[uuid];
        return next;
      });
      loadDashboard(selectedEnterpriseUuid);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to submit milestone");
    } finally {
      setSubmittingById((prev) => ({ ...prev, [uuid]: false }));
    }
  };

  // Phase 5 (save progress) and Phase 6 (submit for verification).
  const persistKpiProgress = async (item, { requestVerification }) => {
    setSavingProgressById((prev) => ({ ...prev, [item.uuid]: true }));
    try {
      const merged = getKpiProgress(item);
      await submitTrackerMilestone(item.uuid, {
        kpiPlan: merged,
        // Rebuild rather than resend the raw value — the stored notes carry the
        // reporting grid behind a marker that must survive this save.
        submissionNotes: buildSubmissionNotes(
          milestoneReportNotes(item.submissionNotes),
          getReportRow(item),
        ),
        requestVerification: Boolean(requestVerification),
      });
      toast.success(
        requestVerification ? "Tranche submitted for verification" : "Progress saved",
      );
      loadDashboard(selectedEnterpriseUuid);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save progress");
    } finally {
      setSavingProgressById((prev) => ({ ...prev, [item.uuid]: false }));
    }
  };

  const onCreateMilestone = async (e) => {
    e.preventDefault();

    // Ignore rows the user left completely untouched, but don't silently drop a
    // half-filled one — every milestone that has any content needs a name.
    const filled = milestoneRows.filter(
      (row) =>
        row.title.trim() ||
        row.activities.some(
          (a) => a.text.trim() || String(a.plannedAmount).trim() || a.timelineSpan,
        ),
    );

    if (!filled.length) {
      toast.error("Add at least one milestone");
      return;
    }
    if (filled.some((row) => !row.title.trim())) {
      toast.error("Every milestone needs a name");
      return;
    }

    setIsCreatingMilestone(true);
    let created = 0;
    try {
      for (const row of filled) {
        // Each activity plans its own amount and timeline; the milestone's
        // own due date is the latest of them (it isn't done until its last
        // activity is), and its trancheAmount is their sum.
        const totalAmount = row.activities.reduce((sum, a) => {
          const n = Number(String(a.plannedAmount || "").trim());
          return sum + (Number.isFinite(n) ? n : 0);
        }, 0);

        await createTrackerMilestone({
          title: row.title.trim(),
          dueDate:
            milestoneActivitiesDueDate(row.activities, todayISO()) || null,
          linkedTranche: row.linkedTranche || null,
          tranchePlannedUse: joinActivities(row.activities) || null,
          // The description carries only the plan marker — each activity's
          // planned amount, KPI/impact and timeline (see
          // buildMilestoneDescription). trancheAmount is sent too, as their
          // sum, so a backend that has the column gets a real number.
          description: buildMilestoneDescription("", {
            activities: row.activities,
          }),
          trancheAmount: totalAmount > 0 ? totalAmount : null,
          planStatus: PLAN_STATUS.SUBMITTED,
        });
        created += 1;
      }

      setMilestoneRows([emptyMilestoneRow()]);
      toast.success(
        created === 1
          ? "Milestone submitted for review"
          : `${created} milestones submitted for review`,
      );
      loadDashboard(selectedEnterpriseUuid);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to create milestone");
      // Some rows may already be saved — reload so they aren't entered twice,
      // and keep only the ones that never made it.
      if (created > 0) {
        setMilestoneRows(filled.slice(created));
        loadDashboard(selectedEnterpriseUuid);
      }
    } finally {
      setIsCreatingMilestone(false);
    }
  };

  // Save an edit to a milestone that is already with the BDA. An approved plan
  // that changes has to be approved again — otherwise the record would no
  // longer be the thing the BDA signed off — so every revision goes back as
  // "resubmitted" and the milestone reappears in their review queue.
  const onSaveRevision = async (milestone) => {
    const form = reviseForm;
    if (!form) return;

    if (!form.title.trim()) {
      toast.error("Every milestone needs a name");
      return;
    }

    setSavingRevision(true);
    try {
      const totalAmount = form.activities.reduce((sum, a) => {
        const n = Number(String(a.plannedAmount || "").trim());
        return sum + (Number.isFinite(n) ? n : 0);
      }, 0);

      await reviseTrackerMilestone(milestone.uuid, {
        title: form.title.trim(),
        linkedTranche: form.linkedTranche || null,
        tranchePlannedUse: joinActivities(form.activities) || null,
        // The due date is re-derived from each activity's span, counted from
        // the date the milestone was originally set rather than today, so
        // revising a plan does not quietly push its deadline out.
        dueDate:
          milestoneActivitiesDueDate(
            form.activities,
            String(milestone.createdAt || "").slice(0, 10) || undefined,
          ) || milestone.dueDate || null,
        description: buildMilestoneDescription("", {
          activities: form.activities,
        }),
        trancheAmount: totalAmount > 0 ? totalAmount : null,
        planStatus: PLAN_STATUS.RESUBMITTED,
      });

      toast.success("Milestone revised and sent back for approval");
      closeRevision();
      loadDashboard(selectedEnterpriseUuid);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to revise this milestone",
      );
    } finally {
      setSavingRevision(false);
    }
  };

  // Passed to every per-tranche MilestoneStatusTable, so the Revise action
  // behaves the same in each group.
  const renderReviseAction = (milestone) =>
    canRevisePlan(milestone.planStatus) ? (
      <button
        type="button"
        onClick={() =>
          revisingUuid === milestone.uuid
            ? closeRevision()
            : openRevision(milestone)
        }
        className="rounded-lg border border-[#082d77]/20 bg-white px-3 py-1.5 text-xs font-bold text-[#082d77] transition hover:bg-[#082d77]/5"
      >
        {revisingUuid === milestone.uuid ? "Cancel" : "Revise"}
      </button>
    ) : null;

  const renderReviseForm = (milestone) =>
    revisingUuid === milestone.uuid && reviseForm ? (
      <div className="space-y-3">
        <p className="text-xs font-semibold text-[#082d77]">
          {isPlanApproved(milestone.planStatus)
            ? "This milestone is already approved — saving your changes sends it back to your business coach for approval again."
            : "Update your milestone and send it back to your business coach."}
        </p>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className={milestoneLabelClass} htmlFor="revise-title">
              Milestone
            </label>
            <input
              id="revise-title"
              className={baseInputClass}
              value={reviseForm.title}
              onChange={(e) => setReviseField("title", e.target.value)}
            />
          </div>
          <div>
            <label className={milestoneLabelClass} htmlFor="revise-tranche">
              Tranche
            </label>
            <select
              id="revise-tranche"
              className={baseInputClass}
              value={reviseForm.linkedTranche}
              onChange={(e) => setReviseField("linkedTranche", e.target.value)}
            >
              <option value="">No tranche</option>
              {MILESTONE_TRANCHE_OPTIONS.map((title) => (
                <option key={title} value={title}>
                  {title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={milestoneLabelClass} htmlFor="revise-activities-0">
            Key activities — each with its own planned amount, KPI / impact, timeline and Date Set
          </label>
          <div className="space-y-2">
            {reviseForm.activities.map((activity, activityIndex) => (
              <div
                key={activityIndex}
                className="grid grid-cols-1 gap-2 rounded-xl border border-slate-200 p-3 md:grid-cols-[minmax(0,1.4fr)_minmax(0,0.9fr)_minmax(0,1.2fr)_minmax(0,0.9fr)_minmax(0,1fr)_auto] md:items-end"
              >
                <div>
                  <label
                    className={`${milestoneLabelClass} ${activityIndex > 0 ? "md:hidden" : ""}`}
                    htmlFor={`revise-activities-${activityIndex}`}
                  >
                    Activity
                  </label>
                  <input
                    id={`revise-activities-${activityIndex}`}
                    className={baseInputClass}
                    placeholder="Activity"
                    value={activity.text}
                    onChange={(e) =>
                      updateReviseActivity(activityIndex, "text", e.target.value)
                    }
                  />
                </div>
                <div>
                  <label
                    className={`${milestoneLabelClass} ${activityIndex > 0 ? "md:hidden" : ""}`}
                    htmlFor={`revise-activity-amount-${activityIndex}`}
                  >
                    Planned amount (TZS)
                  </label>
                  <input
                    id={`revise-activity-amount-${activityIndex}`}
                    className={baseInputClass}
                    type="number"
                    min="0"
                    placeholder="0"
                    value={activity.plannedAmount}
                    onChange={(e) =>
                      updateReviseActivity(activityIndex, "plannedAmount", e.target.value)
                    }
                  />
                </div>
                <div>
                  <label
                    className={`${milestoneLabelClass} ${activityIndex > 0 ? "md:hidden" : ""}`}
                    htmlFor={`revise-activity-kpi-${activityIndex}`}
                  >
                    KPI / Impact
                  </label>
                  <input
                    id={`revise-activity-kpi-${activityIndex}`}
                    className={baseInputClass}
                    placeholder="Expected KPI or impact"
                    value={activity.kpiImpact}
                    onChange={(e) =>
                      updateReviseActivity(activityIndex, "kpiImpact", e.target.value)
                    }
                  />
                </div>
                <div>
                  <label
                    className={`${milestoneLabelClass} ${activityIndex > 0 ? "md:hidden" : ""}`}
                    htmlFor={`revise-activity-timeline-${activityIndex}`}
                  >
                    Timeline
                  </label>
                  <select
                    id={`revise-activity-timeline-${activityIndex}`}
                    className={baseInputClass}
                    value={activity.timelineSpan}
                    onChange={(e) =>
                      updateReviseActivity(activityIndex, "timelineSpan", e.target.value)
                    }
                  >
                    <option value="">Select duration</option>
                    {TIMELINE_SPAN_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    className={`${milestoneLabelClass} ${activityIndex > 0 ? "md:hidden" : ""}`}
                    htmlFor={`revise-activity-date-set-${activityIndex}`}
                  >
                    Date Set
                  </label>
                  <input
                    id={`revise-activity-date-set-${activityIndex}`}
                    className={baseInputClass}
                    type="date"
                    value={activity.setDate}
                    onChange={(e) =>
                      updateReviseActivity(activityIndex, "setDate", e.target.value)
                    }
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeReviseActivity(activityIndex)}
                  disabled={reviseForm.activities.length <= 1}
                  title="Remove activity"
                  className="rounded-xl bg-rose-50 px-3 py-3 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addReviseActivity}
              className="text-xs font-bold text-[#082d77] hover:underline"
            >
              + Add activity
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onSaveRevision(milestone)}
            disabled={savingRevision}
            className="rounded-lg bg-[#082d77] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#061f54] disabled:opacity-60"
          >
            {savingRevision ? "Saving..." : "Save and resubmit"}
          </button>
          <button
            type="button"
            onClick={closeRevision}
            disabled={savingRevision}
            className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      </div>
    ) : null;

  const enterprise = dashboard?.enterprise || {};
  const program = dashboard?.program || enterprise?.Program || null;
  useEffect(() => {
    setKpiForm({
      monthlyRevenue: String(enterprise?.monthlyRevenue ?? ""),
      employees: String(enterprise?.employees ?? ""),
      wasteDiverted: String(enterprise?.wasteDiverted ?? ""),
      ceReadinessScore: enterprise?.ceReadinessScore === null || enterprise?.ceReadinessScore === undefined ? "" : String(enterprise.ceReadinessScore),
      capitalMobilised: String(enterprise?.capitalMobilised ?? ""),
      activeCustomers: String(enterprise?.activeCustomers ?? ""),
    });
  }, [enterprise?.uuid]);

  // Was previously a local-only optimistic update with no backend call at
  // all — it showed "KPI values updated" and reset silently on next reload.
  // Now actually persists via the existing, already Enterprenuer-authorized
  // PATCH /tracker/enterprises/:uuid/kpis.
  const onSaveKpis = async (e) => {
    e.preventDefault();
    if (savingKpis) return;

    if (!enterprise?.uuid) {
      toast.error("No tracker workspace yet — nothing to save KPIs to.");
      return;
    }

    setSavingKpis(true);
    try {
      const payload = {
        monthlyRevenue: Number(kpiForm.monthlyRevenue || 0),
        employees: Number(kpiForm.employees || 0),
        wasteDiverted: Number(kpiForm.wasteDiverted || 0),
        ceReadinessScore:
          kpiForm.ceReadinessScore === "" ? null : Number(kpiForm.ceReadinessScore),
        capitalMobilised: Number(kpiForm.capitalMobilised || 0),
        activeCustomers: Number(kpiForm.activeCustomers || 0),
      };

      const updated = await updateMentorEnterpriseKpis(enterprise.uuid, payload);

      setDashboard((prev) => ({
        ...prev,
        enterprise: { ...(prev?.enterprise || {}), ...(updated || payload) },
      }));
      setShowKpiForm(false);
      toast.success("KPI values updated");
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to save KPI values"
      );
    } finally {
      setSavingKpis(false);
    }
  };

  const enterpriseDocuments = parseDocuments(enterprise?.documents);
  const budgetDocumentUrl = enterpriseDocuments.budgetDocumentUrl || "";

  useEffect(() => {
    setBudgetDocForm({
      description: parseDocuments(enterprise?.documents).budgetDocumentDescription || "",
    });
    setBudgetDocFile(null);
  }, [enterprise?.uuid]);

  // Saves the description on its own, and the file too when a new one was
  // picked — matches the KYC/contract uploads elsewhere: the file goes up via
  // uploadFile first, then the URL (and description) is persisted on the
  // enterprise's budget-document endpoint, which merges into the existing
  // `documents` JSON rather than replacing it (so KYC documents stored there
  // survive).
  const onSaveBudgetDocument = async (e) => {
    e.preventDefault();
    if (!enterprise?.uuid) {
      toast.error("No tracker workspace yet — nothing to attach this to.");
      return;
    }

    setSavingBudgetDoc(true);
    try {
      let uploadedUrl = budgetDocumentUrl;
      if (budgetDocFile) {
        const formData = new FormData();
        formData.append("file", budgetDocFile);
        uploadedUrl = await uploadFile(formData);
        if (!uploadedUrl || typeof uploadedUrl !== "string") {
          throw new Error("Upload failed");
        }
      }

      const updated = await updateEnterpriseBudgetDocument(enterprise.uuid, {
        budgetDocumentUrl: uploadedUrl,
        budgetDocumentDescription: budgetDocForm.description.trim(),
      });

      setDashboard((prev) => ({
        ...prev,
        enterprise: { ...(prev?.enterprise || {}), documents: updated?.documents },
      }));
      setBudgetDocFile(null);
      toast.success("Attachment saved");
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to save the attachment",
      );
    } finally {
      setSavingBudgetDoc(false);
    }
  };

  const programName = getEnterpriseProgramName(program, enterprise);
  const programDescription = getProgramDescription(program) || "Track your milestones, reports, mentorship engagement, KPIs, and tranche readiness from one workspace.";

  // The finance officer enters the committed amount and the tranche schedule on
  // the program's startup list, which is stored in markers inside the program
  // description. Mirroring that onto this startup's tracker enterprise is
  // best-effort and depends on the API allowing it, so read the markers here
  // too — finance's numbers then reach this page as soon as they save.
  const financeMember = useMemo(() => {
    const ids = [
      userDetails?.uuid,
      enterprise?.entreprenuer_uuid,
      enterprise?.Entreprenuer?.uuid,
    ].filter(Boolean);
    if (!ids.length || !program) return null;
    return (
      parseTrackerProgramMeta(program).startups.find((member) =>
        ids.includes(member?.entreprenuerUuid),
      ) || null
    );
  }, [
    program,
    userDetails?.uuid,
    enterprise?.entreprenuer_uuid,
    enterprise?.Entreprenuer?.uuid,
  ]);

  // Tranches as this startup should see them: the stages mirrored onto their
  // enterprise when that sync landed, otherwise finance's own schedule read
  // straight from the program markers — with any status the mirror dropped
  // filled back in from those markers.
  const effectiveTrancheStages = useMemo(() => {
    const mirrored = Array.isArray(trancheStages) ? trancheStages : [];
    const fromFinance = (
      Array.isArray(financeMember?.tranches) ? financeMember.tranches : []
    )
      .map((t) => {
        // Same precedence finance's own mirror uses: the disbursement date,
        // then the keys older schedules recorded it under.
        const date = t.disbursedDate || t.actualDate || t.plannedDate || "";
        return {
          title: String(t.title || "").trim(),
          date: date ? String(date).slice(0, 10) : "",
          amount: Number(t.amount || 0),
          status: t.status || "",
        };
      })
      .filter((t) => t.title);

    const statusByTitle = new Map(fromFinance.map((t) => [t.title, t.status]));

    return (mirrored.length ? mirrored : fromFinance).map((stage) => ({
      ...stage,
      status:
        stage.status || statusByTitle.get(String(stage.title || "").trim()) || "",
    }));
  }, [trancheStages, financeMember]);

  // A milestone is ready to report on once the BDA approves its plan. Approval
  // only moves planStatus — the milestone's own status stays "pending" — so this
  // must not key off `status`. Milestones predating the plan workflow have no
  // planStatus, hence the fallback to an already-active work status.
  // The open tranche lives in the URL so each section is its own page: the
  // browser's back button returns to the tranche list and the view can be linked
  // to. "" shows the list, "__all__" drops the filter.
  const [searchParams, setSearchParams] = useSearchParams();
  const openTranche = searchParams.get("tranche") || "";
  const openReportTranche = searchParams.get("reportTranche") || "";
  const setParam = (name, key) => {
    const next = new URLSearchParams(searchParams);
    if (key) next.set(name, key);
    else next.delete(name);
    setSearchParams(next);
  };
  const setOpenTranche = (key) => setParam("tranche", key);
  const setOpenReportTranche = (key) => setParam("reportTranche", key);
  // Both drill-downs close in one update. Two setParam calls in a row would each
  // build from this render's `searchParams`, so the second would put back the
  // param the first removed and the open tranche would survive the click.
  const closeTranches = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("tranche");
    next.delete("reportTranche");
    setSearchParams(next);
  };

  const reportableMilestones = useMemo(
    () =>
      milestones.filter(
        (item) =>
          isPlanApproved(item.planStatus) ||
          !["pending", "draft"].includes(
            String(item.status || "pending").toLowerCase(),
          ),
      ),
    [milestones],
  );

  const milestoneGroups = useMemo(
    () => groupMilestonesByTranche(milestones, effectiveTrancheStages),
    [milestones, effectiveTrancheStages],
  );

  const visibleMilestones = useMemo(() => {
    if (openTranche === "__all__") return milestones;
    return milestoneGroups.find((g) => g.key === openTranche)?.items || milestones;
  }, [openTranche, milestoneGroups, milestones]);

  const reportGroups = useMemo(
    () => groupMilestonesByTranche(reportableMilestones, effectiveTrancheStages),
    [reportableMilestones, effectiveTrancheStages],
  );

  const visibleReportables = useMemo(() => {
    if (openReportTranche === "__all__") return reportableMilestones;
    return (
      reportGroups.find((g) => g.key === openReportTranche)?.items ||
      reportableMilestones
    );
  }, [openReportTranche, reportGroups, reportableMilestones]);

  // KPI values shown as cards under the KPI Tracking panel — the same figures
  // the Edit KPIs form updates.
  const activeCustomers = Number(kpiForm.activeCustomers || enterprise?.activeCustomers || 0);
  const employees = Number(kpiForm.employees || enterprise?.employees || 0);
  const monthlyRevenue = Number(kpiForm.monthlyRevenue || enterprise?.monthlyRevenue || 0);
  const capitalMobilised = Number(kpiForm.capitalMobilised || enterprise?.capitalMobilised || 0);


  // Financial summary shown in the stat cards below the hero (mirrors the
  // finance officer's view). Disbursement is derived from tranche stages whose
  // linked milestone has been disbursed.
  const grantStats = useMemo(() => {
    const stages = effectiveTrancheStages;
    // A tranche counts as released either because finance marked the stage
    // itself Disbursed, or because the milestone linked to it was disbursed
    // through the plan workflow. The first works even with no milestone linked.
    const isTrancheDisbursed = (stage) => {
      if (String(stage?.status || "").toLowerCase() === "disbursed") return true;
      const linked = milestones.find((m) => m.linkedTranche === stage?.title);
      return Boolean(
        linked &&
          (String(linked.planStatus) === PLAN_STATUS.DISBURSED || linked.disbursed),
      );
    };
    const stagesTotal = stages.reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const committed =
      Number(enterprise?.grantUsd || 0) ||
      Number(financeMember?.grantUsd || 0) ||
      stagesTotal;
    const disbursed = stages
      .filter(isTrancheDisbursed)
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const remaining = Math.max(0, committed - disbursed);
    const disbursedPct = committed > 0 ? (disbursed / committed) * 100 : 0;
    const remainingPct = committed > 0 ? (remaining / committed) * 100 : 0;
    const next = stages.find((stage) => !isTrancheDisbursed(stage)) || null;
    return { committed, disbursed, remaining, disbursedPct, remainingPct, next };
  }, [enterprise?.grantUsd, trancheStages, milestones, financeMember]);

  // Context for the AI grant report download.
  const reportContext = useMemo(() => {
    const totalGrant = milestones.reduce(
      (sum, m) => sum + Number(m.trancheAmount || 0),
      0,
    );
    const disbursedTotal = milestones.reduce(
      (sum, m) => sum + (m.disbursed ? Number(m.trancheAmount || 0) : 0),
      0,
    );
    const business = userDetails?.Business || {};
    return {
      startup: {
        name:
          enterprise?.name || business.name || userDetails?.name || "My Startup",
        sector:
          enterprise?.ceSector ||
          business.BusinessSector?.name ||
          business.sector,
        location: enterprise?.district || business.location,
        stage: business.stage,
        description: business.description,
      },
      grant: {
        amount: totalGrant,
        disbursed: disbursedTotal,
        purpose: milestones
          .map((m) => m.tranchePlannedUse)
          .filter(Boolean)
          .join("; "),
      },
      milestones: milestones.map((m) => ({
        title: m.title,
        status: m.status,
        tranche: m.linkedTranche,
        trancheAmount: m.trancheAmount,
        plannedUse: m.tranchePlannedUse,
        kpis: parseKpiPlan(m.kpiPlan),
        notes: milestoneReportNotes(m.submissionNotes),
        report: reportFromMilestone(m),
      })),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [milestones, enterprise?.uuid, userDetails?.uuid]);

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-[#f3f6fb] px-4 py-6 text-slate-950 md:px-6">
      <main className="mx-auto w-full space-y-8">
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
                  Funds &amp; KPI Management
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/85 md:text-base">
                  Analyze financial performance, monitor operational metrics, and align resources with business objectives to improve accountability and growth.
                </p>
                {/* Each opens its own page. */}
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => navigate("/dashboard/myMilestones/kyc")}
                    className="rounded-xl bg-white/15 px-4 py-2.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/25"
                  >
                    Business Information
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/dashboard/myMilestones/contract")}
                    className="rounded-xl bg-white/15 px-4 py-2.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/25"
                  >
                    Grant Contract
                  </button>
                  <GrantReportButton
                    label="Download Grant Report"
                    context={reportContext}
                  />
                </div>
              </div>

            </div>

          </div>
        </section>

        <div className="space-y-8">
            {/* KPI summary cards. */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  icon: <Wallet className="h-5 w-5" />,
                  tint: "bg-emerald-50 text-emerald-600",
                  label: "Monthly Revenue",
                  value: formatCurrency(monthlyRevenue),
                },
                {
                  icon: <TrendingUp className="h-5 w-5" />,
                  tint: "bg-amber-50 text-amber-600",
                  label: "Capital Mobilised",
                  value: formatCurrency(capitalMobilised),
                },
                {
                  icon: <Users className="h-5 w-5" />,
                  tint: "bg-blue-50 text-blue-600",
                  label: "Employees",
                  value: employees,
                },
                {
                  icon: <UserCheck className="h-5 w-5" />,
                  tint: "bg-violet-50 text-violet-600",
                  label: "Active Customers",
                  value: activeCustomers,
                },
              ].map((kpi) => (
                <div
                  key={kpi.label}
                  className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${kpi.tint}`}
                    >
                      {kpi.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-[#64748b]">
                        {kpi.label}
                      </p>
                      <p className="mt-1 text-sm font-black tracking-tight text-[#111827]">
                        {kpi.value}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* KPI Tracking panel, sitting below the KPI summary cards. */}
            <PortalCard
              icon={<BarChart3 className="h-5 w-5" />}
              title="KPI Tracking"
              subtitle="Operational indicators for enterprise growth and reporting."
              action={
                <button
                  type="button"
                  onClick={() => setShowKpiForm((prev) => !prev)}
                  className="rounded-xl border border-[#082d77]/20 bg-[#082d77]/5 px-4 py-2.5 text-sm font-bold text-[#082d77] transition hover:bg-[#082d77]/10"
                >
                  {showKpiForm ? "Close KPI Edit" : "Edit KPIs"}
                </button>
              }
            >
              {showKpiForm && (
                <form onSubmit={onSaveKpis} className="mb-5 grid grid-cols-1 gap-3 rounded-2xl border border-[#082d77]/10 bg-[#082d77]/5 p-4 md:grid-cols-3">
                  <div>
                    <label className={milestoneLabelClass} htmlFor="kpi-monthly-revenue">Monthly revenue</label>
                    <input id="kpi-monthly-revenue" className={baseInputClass} type="number" min="0" placeholder="Monthly revenue" value={kpiForm.monthlyRevenue} onChange={(e) => setKpiForm((prev) => ({ ...prev, monthlyRevenue: e.target.value }))} />
                  </div>
                  <div>
                    <label className={milestoneLabelClass} htmlFor="kpi-capital-mobilised">Capital mobilised</label>
                    <input id="kpi-capital-mobilised" className={baseInputClass} type="number" min="0" placeholder="Capital mobilised" value={kpiForm.capitalMobilised} onChange={(e) => setKpiForm((prev) => ({ ...prev, capitalMobilised: e.target.value }))} />
                  </div>
                  <div>
                    <label className={milestoneLabelClass} htmlFor="kpi-employees">Employees</label>
                    <input id="kpi-employees" className={baseInputClass} type="number" min="0" placeholder="Employees" value={kpiForm.employees} onChange={(e) => setKpiForm((prev) => ({ ...prev, employees: e.target.value }))} />
                  </div>
                  <div>
                    <label className={milestoneLabelClass} htmlFor="kpi-active-customers">Active customers</label>
                    <input id="kpi-active-customers" className={baseInputClass} type="number" min="0" placeholder="Active customers" value={kpiForm.activeCustomers} onChange={(e) => setKpiForm((prev) => ({ ...prev, activeCustomers: e.target.value }))} />
                  </div>
                  <div className="flex items-end justify-end md:col-span-3">
                    <button
                      type="submit"
                      disabled={savingKpis}
                      className="rounded-xl bg-[#082d77] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#061f54] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {savingKpis ? "Saving..." : "Save KPI Updates"}
                    </button>
                  </div>
                </form>
              )}
            </PortalCard>

            {/* Grant financial summary. */}
            <div>
              <h2 className="mb-4 text-lg font-black tracking-tight text-[#172033]">
                Grant Summary
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  {
                    icon: <Briefcase className="h-5 w-5" />,
                    tint: "bg-emerald-50 text-emerald-600",
                    label: "Total Grant Committed",
                    value: formatCurrency(grantStats.committed),
                  },
                  {
                    icon: <Layers className="h-5 w-5" />,
                    tint: "bg-blue-50 text-blue-600",
                    label: "Total Disbursed",
                    value: formatCurrency(grantStats.disbursed),
                  },
                  {
                    icon: <Wallet className="h-5 w-5" />,
                    tint: "bg-amber-50 text-amber-600",
                    label: "Remaining Balance",
                    value: formatCurrency(grantStats.remaining),
                  },
                  {
                    icon: <CalendarDays className="h-5 w-5" />,
                    tint: "bg-violet-50 text-violet-600",
                    label: "Next Disbursement",
                    value: formatCurrency(grantStats.next?.amount || 0),
                  },
                ].map((kpi) => (
                  <div
                    key={kpi.label}
                    className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${kpi.tint}`}
                      >
                        {kpi.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold text-[#64748b]">
                          {kpi.label}
                        </p>
                        <p className="mt-1 text-sm font-black tracking-tight text-[#111827]">
                          {kpi.value}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <h2 className="pt-2 text-lg font-black tracking-tight text-[#172033]">
              Milestones
            </h2>

            {/* Milestones split into three tabs: create, status, report —
                in the order the startup works through them. */}
            <div className="flex flex-wrap gap-2">
              {[
                { id: "create", label: "+ Milestone" },
                { id: "status", label: "Milestone Status" },
                { id: "report", label: "Milestone Reporting" },
                { id: "attachments", label: "Attachments" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    // A tab always opens on its tranche list (Tranche 1,
                    // Tranche 2…) — clicking one closes whichever tranche was
                    // open, whether or not the tab was already active.
                    setMilestoneTab(tab.id);
                    closeTranches();
                  }}
                  className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                    milestoneTab === tab.id
                      ? "bg-[#16a34a] text-white"
                      : "border border-green-600/30 bg-green-50 text-green-700 hover:bg-green-100"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {milestoneTab === "create" && (
              <PortalCard
                icon={<Flag className="h-5 w-5" />}
                title="Add Milestone"
                subtitle="Create milestones with their key activities, planned amount and timeline, then wait for mentor approval."
              >
                <form onSubmit={onCreateMilestone} className="mb-5 space-y-3 rounded-2xl border border-[#082d77]/10 bg-[#082d77]/5 p-4">
                  {/* One table: Tranche and Milestone rowSpan down one
                      milestone's activities (each milestone sets its own
                      tranche, independent of the others); every other column
                      is one row per activity — each activity plans its own
                      amount, KPI/impact, timeline and Date Set (the date its
                      own timeline is counted from). The milestone's own due
                      date is the latest of its activities' and its budget
                      their sum (see onCreateMilestone). Key activities are
                      still mirrored into the existing tranchePlannedUse
                      field. */}
                  <div className="overflow-x-auto rounded-xl border border-black/10">
                    <table className="w-full min-w-[960px] border-collapse bg-white text-left">
                      <thead>
                        <tr>
                          <th className={tableHeadClass}>Tranche</th>
                          <th className={tableHeadClass}>Milestone</th>
                          <th className={tableHeadClass}>Key Activities</th>
                          <th className={tableHeadClass}>Planned amount (TZS)</th>
                          <th className={tableHeadClass}>KPI / Impact</th>
                          <th className={tableHeadClass}>Timeline</th>
                          <th className={tableHeadClass}>Date Set</th>
                          <th className={tableHeadClass} />
                        </tr>
                      </thead>
                      <tbody>
                        {milestoneRows.map((row, idx) => (
                          <Fragment key={idx}>
                            {row.activities.map((activity, activityIndex) => {
                              const isFirstOfMilestone = activityIndex === 0;

                              return (
                                <tr key={activityIndex}>
                                  {isFirstOfMilestone && (
                                    <td
                                      rowSpan={row.activities.length}
                                      className={tableCellClass}
                                    >
                                      <select
                                        aria-label="Tranche"
                                        className={baseInputClass}
                                        value={row.linkedTranche}
                                        onChange={(e) =>
                                          updateMilestoneRow(idx, "linkedTranche", e.target.value)
                                        }
                                      >
                                        <option value="">No tranche</option>
                                        {MILESTONE_TRANCHE_OPTIONS.map((title) => (
                                          <option key={title} value={title}>
                                            {title}
                                          </option>
                                        ))}
                                      </select>
                                    </td>
                                  )}
                                  {isFirstOfMilestone && (
                                    <td
                                      rowSpan={row.activities.length}
                                      className={tableCellClass}
                                    >
                                      <div className="space-y-2">
                                        <input
                                          aria-label="Milestone"
                                          className={baseInputClass}
                                          placeholder="Milestone"
                                          value={row.title}
                                          onChange={(e) =>
                                            updateMilestoneRow(idx, "title", e.target.value)
                                          }
                                        />
                                        <button
                                          type="button"
                                          onClick={() => removeMilestoneRow(idx)}
                                          disabled={milestoneRows.length <= 1}
                                          className={milestoneRemoveClass}
                                        >
                                          Remove milestone
                                        </button>
                                      </div>
                                    </td>
                                  )}
                                  <td className={tableCellClass}>
                                      <input
                                        aria-label="Activity"
                                        className={baseInputClass}
                                        placeholder="Activity"
                                        value={activity.text}
                                        onChange={(e) =>
                                          updateActivity(idx, activityIndex, "text", e.target.value)
                                        }
                                      />
                                    </td>
                                    <td className={tableCellClass}>
                                      <input
                                        aria-label="Planned amount (TZS)"
                                        className={baseInputClass}
                                        type="number"
                                        min="0"
                                        placeholder="0"
                                        value={activity.plannedAmount}
                                        onChange={(e) =>
                                          updateActivity(
                                            idx,
                                            activityIndex,
                                            "plannedAmount",
                                            e.target.value,
                                          )
                                        }
                                      />
                                    </td>
                                    <td className={tableCellClass}>
                                      <input
                                        aria-label="KPI / Impact"
                                        className={baseInputClass}
                                        placeholder="Expected KPI or impact"
                                        value={activity.kpiImpact}
                                        onChange={(e) =>
                                          updateActivity(
                                            idx,
                                            activityIndex,
                                            "kpiImpact",
                                            e.target.value,
                                          )
                                        }
                                      />
                                    </td>
                                    <td className={tableCellClass}>
                                      <select
                                        aria-label="Timeline"
                                        className={baseInputClass}
                                        value={activity.timelineSpan}
                                        onChange={(e) =>
                                          updateActivity(
                                            idx,
                                            activityIndex,
                                            "timelineSpan",
                                            e.target.value,
                                          )
                                        }
                                      >
                                        <option value="">Select duration</option>
                                        {TIMELINE_SPAN_OPTIONS.map((option) => (
                                          <option key={option.value} value={option.value}>
                                            {option.label}
                                          </option>
                                        ))}
                                      </select>
                                    </td>
                                    <td className={tableCellClass}>
                                      <input
                                        aria-label="Date Set"
                                        className={baseInputClass}
                                        type="date"
                                        value={activity.setDate}
                                        onChange={(e) =>
                                          updateActivity(
                                            idx,
                                            activityIndex,
                                            "setDate",
                                            e.target.value,
                                          )
                                        }
                                      />
                                    </td>
                                    <td className={tableCellClass}>
                                      <button
                                        type="button"
                                        onClick={() => removeActivity(idx, activityIndex)}
                                        disabled={row.activities.length <= 1}
                                        title="Remove activity"
                                        className={milestoneRemoveClass}
                                      >
                                        Remove
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                              <tr>
                                <td colSpan={8} className={`${tableCellClass} bg-[#f8fafc]`}>
                                  <button
                                    type="button"
                                    onClick={() => addActivity(idx)}
                                    className="text-xs font-bold text-[#082d77] hover:underline"
                                  >
                                    + Add activity to “{row.title || `Milestone ${idx + 1}`}”
                                  </button>
                                </td>
                              </tr>
                          </Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-slate-500">
                    Each milestone sets its own Tranche. Each activity within
                    it plans its own amount, expected KPI/impact, timeline and
                    Date Set (the date its timeline is counted from) — the
                    milestone's own timeline is the latest of its activities,
                    and its budget their sum.
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={addMilestoneRow}
                      className="text-xs font-bold text-[#082d77] hover:text-[#061f54]"
                    >
                      + Add another milestone
                    </button>
                    <button
                      type="submit"
                      disabled={isCreatingMilestone}
                      className="rounded-xl bg-[#16a34a] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#15803d] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isCreatingMilestone ? "Submitting..." : "Submit plan for review"}
                    </button>
                  </div>
                </form>
              </PortalCard>
            )}

            {milestoneTab === "status" && (
              <PortalCard
                icon={<Flag className="h-5 w-5" />}
                title="Milestone Status"
                subtitle="Track where each of your milestones stands — whether the business coach has approved the plan, and what has happened to the report you filed."
              >
                <div className="space-y-4">
                  {milestones.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                      No milestones yet.
                    </div>
                  )}

                  {/* Same drill-down as reporting: pick a tranche, then see the
                      milestones in it. */}
                  {milestones.length > 0 && !openTranche && (
                    <TrancheGroupList
                      title="Tranche Milestones"
                      groups={milestoneGroups
                        .filter((group) => group.items.length > 0)
                        .map((group) => ({
                          key: group.key,
                          title: `${group.title} Milestones`,
                        }))}
                      onSelect={setOpenTranche}
                      onViewAll={() => setOpenTranche("__all__")}
                      emptyText="No milestones yet."
                    />
                  )}

                  {openTranche && (
                    <p className="text-sm font-bold text-slate-950">
                      {openTranche === "__all__" ? "All milestones" : openTranche}
                    </p>
                  )}

                  {/* The tranche column is dropped inside a group — the heading
                      above already says which one. */}
                  {milestones.length > 0 && openTranche && (
                    <div className="-mx-6 px-1">
                      <MilestoneStatusTable
                        rows={visibleMilestones}
                        showTranche={openTranche === "__all__"}
                        renderAction={renderReviseAction}
                        renderDetail={renderReviseForm}
                      />
                    </div>
                  )}
                </div>
              </PortalCard>
            )}

            {milestoneTab === "report" && (
            <PortalCard
              icon={<ClipboardList className="h-5 w-5" />}
              title="Milestone Reporting"
              subtitle="Report on mentor-approved milestones and tranches, and provide supporting evidence for review."
            >
              <div className="space-y-4">
                {reportableMilestones.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                    No milestones are ready for reporting yet. Milestones appear here once a mentor approves them.
                  </div>
                )}

                {/* Same drill-down for reports: pick a tranche, then report on
                    its milestones. */}
                {reportableMilestones.length > 0 && !openReportTranche && (
                  <TrancheGroupList
                    title="Tranche Reports"
                    groups={reportGroups.map((g) => ({
                      key: g.key,
                      title: `${g.title} Reports`,
                    }))}
                    onSelect={setOpenReportTranche}
                    onViewAll={() => setOpenReportTranche("__all__")}
                    emptyText="No milestones are ready for reporting yet."
                  />
                )}

                {openReportTranche && (
                  <p className="text-sm font-bold text-slate-950">
                    {openReportTranche === "__all__"
                      ? "All reports"
                      : openReportTranche}
                  </p>
                )}

                {/* Reporting grid — the whole flow lives in this one table: fill
                    the row, attach evidence and submit from the Action column.
                    It is the same table the business coach and the finance
                    officer review. */}
                {openReportTranche && visibleReportables.length > 0 && (
                  // Bleeds into the card's padding so the widest table in the
                  // app gets every pixel before it starts scrolling.
                  <div className="-mx-6 space-y-2 px-1">
                    <MilestoneReportTable
                      editable
                      showReview
                      onChange={setReportField}
                      onAttach={(uuid, files) =>
                        setFilesById((prev) => ({ ...prev, [uuid]: files }))
                      }
                      rows={visibleReportables.map((item) => {
                        const attachments = parseSubmissionAttachments(
                          item.submissionAttachments,
                        );
                        const normalizedStatus = String(
                          item.status || "pending",
                        ).toLowerCase();
                        const ps = item.planStatus || "";
                        // An approved plan is the startup's cue to report,
                        // whatever the work status still says — otherwise the
                        // milestone would show up here with no way to submit.
                        const canSubmit = isPlanApproved(ps)
                          ? isReportOpen(normalizedStatus)
                          : [
                              "in_progress",
                              "overdue",
                              REPORT_STATUS.REJECTED,
                              REPORT_STATUS.INFO_REQUESTED,
                            ].includes(normalizedStatus);
                        // The coach asked for more detail rather than declining.
                        // The row reopens either way, but this one must not be
                        // presented to the startup as a rejection.
                        const infoRequested =
                          normalizedStatus === REPORT_STATUS.INFO_REQUESTED;
                        // The report was declined — it comes back for edits.
                        // Finance declines also set planStatus to rejected and
                        // leave finance feedback, which is how we tell who sent
                        // it back.
                        const wasDeclined = normalizedStatus === "rejected";
                        const declinedByFinance =
                          wasDeclined &&
                          ps === PLAN_STATUS.REJECTED &&
                          Boolean(item.financeReviewNotes);
                        const disbursed =
                          ps === PLAN_STATUS.DISBURSED || Boolean(item.disbursed);
                        // Approval, attributed the same way as a decline: the
                        // finance officer's approval disburses the tranche;
                        // before that, the business coach approves the report
                        // and sends it to finance.
                        const financeApproved = disbursed;
                        const coachApproved =
                          !disbursed &&
                          !wasDeclined &&
                          (ps === PLAN_STATUS.SENT_TO_FINANCE ||
                            (normalizedStatus === "completed" &&
                              ps !== PLAN_STATUS.REJECTED));
                        const kpiProgress = getKpiProgress(item);
                        const selectedFiles = Array.isArray(filesById[item.uuid])
                          ? filesById[item.uuid]
                          : [];
                        const showKpiPanel = disbursed && kpiProgress.length > 0;
                        // A decline belongs to whoever sent it back: finance
                        // declines set planStatus to rejected and leave finance
                        // feedback, otherwise it was the business coach.
                        const coachDeclined = wasDeclined && !declinedByFinance;
                        // The finance officer has a column; the coach's verdict
                        // rides in the sub-row so a decline still explains
                        // itself without widening the grid.
                        const showCoachNote =
                          SHOW_COACH_COMMENT &&
                          (coachApproved ||
                            coachDeclined ||
                            infoRequested ||
                            item.mentorReviewNotes);
                        const showDetail = showKpiPanel || showCoachNote;

                        return {
                          uuid: item.uuid,
                          title: item.title,
                          activity: item.tranchePlannedUse,
                          kpiImpact: milestoneKpiImpact(item),
                          timeline: milestoneTimelineSpan(item),
                          report: getReportRow(item),
                          attachments,
                          readOnly: !canSubmit,

                          pendingFiles: selectedFiles,

                          action: canSubmit ? (
                            <button
                              type="button"
                              onClick={() => onSubmitMilestone(item.uuid)}
                              disabled={submittingById[item.uuid]}
                              className="rounded-xl bg-[#16a34a] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#15803d] disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              {submittingById[item.uuid] ? "Submitting..." : "Submit"}
                            </button>
                          ) : (
                            <span className="text-xs font-semibold text-slate-600">
                              {normalizedStatus === "submitted"
                                ? "Submitted — awaiting review"
                                : normalizedStatus === "completed"
                                  ? "Completed"
                                  : "Awaiting plan approval"}
                            </span>
                          ),

                          // The finance officer's verdict and comment sit in
                          // the row; the business coach's stays in the sub-row.
                          reviewComment: (
                            <ReviewCell
                              outcome={
                                financeApproved
                                  ? "Approved"
                                  : declinedByFinance
                                    ? "Declined"
                                    : ""
                              }
                              tone={financeApproved ? "approved" : "declined"}
                              note={item.financeReviewNotes}
                            />
                          ),

                          detail: showDetail ? (
                            <div className="space-y-3 text-sm leading-6">
                              {showCoachNote && (
                                <p className="text-slate-600">
                                  <span className="font-bold text-slate-950">
                                    Business coach:
                                  </span>{" "}
                                  <span
                                    className={`font-bold ${
                                      coachApproved
                                        ? "text-emerald-700"
                                        : coachDeclined
                                          ? "text-rose-700"
                                          : infoRequested
                                            ? "text-amber-700"
                                            : "text-slate-700"
                                    }`}
                                  >
                                    {coachApproved
                                      ? "Approved — sent to finance."
                                      : coachDeclined
                                        ? "Declined — update the row and submit again."
                                        : infoRequested
                                          ? "More information needed — add it and submit again."
                                          : ""}
                                  </span>{" "}
                                  {item.mentorReviewNotes}
                                </p>
                              )}

                              {showKpiPanel && (
                                <div className="rounded-xl border border-slate-200 bg-white p-3">
                                  <p className="text-xs font-black uppercase tracking-wide text-[#082d77]">
                                    KPI progress
                                  </p>
                                  <div className="mt-3 space-y-3">
                                    {kpiProgress.map((kpi, idx) => (
                                      <div key={idx} className="rounded-xl bg-slate-50 p-3">
                                        <p className="text-sm font-bold text-slate-950">
                                          {kpi.name}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                          Target: {kpi.target || "—"} • Evidence:{" "}
                                          {kpi.evidenceSource || "—"}
                                        </p>
                                        <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                                          <input
                                            className={baseInputClass}
                                            placeholder="Current value"
                                            value={kpi.currentValue}
                                            onChange={(e) =>
                                              setKpiProgress(
                                                item.uuid,
                                                idx,
                                                "currentValue",
                                                e.target.value,
                                              )
                                            }
                                          />
                                          <input
                                            className={baseInputClass}
                                            placeholder="Comment"
                                            value={kpi.comment}
                                            onChange={(e) =>
                                              setKpiProgress(
                                                item.uuid,
                                                idx,
                                                "comment",
                                                e.target.value,
                                              )
                                            }
                                          />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="mt-3 flex flex-wrap justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        persistKpiProgress(item, {
                                          requestVerification: false,
                                        })
                                      }
                                      disabled={savingProgressById[item.uuid]}
                                      className="rounded-xl border border-[#082d77]/20 bg-[#082d77]/5 px-4 py-2 text-xs font-bold text-[#082d77] transition hover:bg-[#082d77]/10 disabled:opacity-60"
                                    >
                                      {savingProgressById[item.uuid]
                                        ? "Saving..."
                                        : "Save progress"}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        persistKpiProgress(item, {
                                          requestVerification: true,
                                        })
                                      }
                                      disabled={savingProgressById[item.uuid]}
                                      className="rounded-xl bg-[#16a34a] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#15803d] disabled:opacity-60"
                                    >
                                      Submit tranche for verification
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : null,
                        };
                      })}
                    />
                    <p className="text-xs text-slate-500">
                      Variance is calculated for you (planned − actual). The
                      narrative you write is sent as the milestone report,
                      together with the evidence you attach.
                    </p>
                  </div>
                )}

              </div>
            </PortalCard>
            )}

            {milestoneTab === "attachments" && (
              <PortalCard
                icon={<ClipboardList className="h-5 w-5" />}
                title="Attachments"
                subtitle="Upload your budget document and describe it — your business coach and finance officer can see it here."
              >
                {!enterprise?.uuid ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                    No tracker workspace yet — attachments will be available once one exists.
                  </div>
                ) : (
                  <form onSubmit={onSaveBudgetDocument} className="space-y-4">
                    <div>
                      <label className={milestoneLabelClass} htmlFor="budget-document-file">
                        Budget Document
                      </label>
                      <input
                        id="budget-document-file"
                        className={baseInputClass}
                        type="file"
                        accept="application/pdf,image/*,.doc,.docx,.xls,.xlsx"
                        onChange={(e) => setBudgetDocFile(e.target.files?.[0] || null)}
                      />
                      {budgetDocumentUrl ? (
                        <p className="mt-2 text-sm">
                          <a
                            href={budgetDocumentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="font-bold text-[#082d77] hover:underline"
                          >
                            View current budget document
                          </a>
                          {budgetDocFile ? (
                            <span className="ml-2 text-xs text-slate-500">
                              — replacing with "{budgetDocFile.name}" on save
                            </span>
                          ) : (
                            <span className="ml-2 text-xs text-slate-500">
                              — choose a file above to replace it
                            </span>
                          )}
                        </p>
                      ) : (
                        <p className="mt-2 text-xs text-slate-500">
                          No budget document uploaded yet.
                        </p>
                      )}
                    </div>

                    <div>
                      <label className={milestoneLabelClass} htmlFor="budget-document-description">
                        Description
                      </label>
                      <textarea
                        id="budget-document-description"
                        className={`${baseInputClass} min-h-[100px]`}
                        placeholder="Describe this budget document"
                        value={budgetDocForm.description}
                        onChange={(e) =>
                          setBudgetDocForm({ description: e.target.value })
                        }
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={savingBudgetDoc}
                      className="rounded-xl bg-[#16a34a] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#15803d] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {savingBudgetDoc ? "Saving..." : "Save attachment"}
                    </button>
                  </form>
                )}
              </PortalCard>
            )}
        </div>
      </main>
    </div>
  );
};

export default EntrepreneurMilestones;
