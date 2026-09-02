// Structured milestone financial report — the grid the programme reports on:
// milestone / milestone status / budgeted vs actual amount / variance /
// receipt-evidence / link to supporting docs / narrative for the variance.
//
// The submit endpoint only carries `submissionNotes` and
// `submissionAttachments` (see submitTrackerMilestone), so the structured part
// rides along inside submissionNotes behind a marker, the same way tracker
// programs carry their metadata in the program description. The startup's own
// narrative stays first in the field, so anything reading the raw value still
// sees readable text.

export const MILESTONE_REPORT_MARKER = "__MILESTONE_REPORT__:";

export const COMPLETION_STATUS_OPTIONS = [
  { value: "not_started", label: "Not started" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "delayed", label: "Delayed" },
  { value: "cancelled", label: "Cancelled" },
];

export const RECEIPT_OPTIONS = [
  { value: "attached", label: "Attached" },
  { value: "not_attached", label: "Not attached" },
  { value: "not_applicable", label: "Not applicable" },
];

export const COMPLETION_STATUS_PILL = {
  not_started: "bg-slate-100 text-slate-600",
  in_progress: "bg-[#dbe8ff] text-[#163b8f]",
  completed: "bg-[#e1f0d8] text-[#2d6e1f]",
  delayed: "bg-[#fdf1ce] text-[#8a6500]",
  cancelled: "bg-[#fde0e0] text-[#a11111]",
};

export const completionStatusLabel = (value) =>
  COMPLETION_STATUS_OPTIONS.find((o) => o.value === value)?.label || "—";

export const receiptLabel = (value) =>
  RECEIPT_OPTIONS.find((o) => o.value === value)?.label || "—";

export const emptyMilestoneReport = () => ({
  completionStatus: "",
  plannedAmount: "",
  actualAmount: "",
  receiptEvidence: "",
  supportingDocsUrl: "",
  narrative: "",
});

const REPORT_KEYS = Object.keys(emptyMilestoneReport());

// Keep only the known keys so a hand-edited or older payload can't smuggle
// extra fields into the submission.
const sanitizeReport = (value) => {
  const base = emptyMilestoneReport();
  if (!value || typeof value !== "object") return base;
  REPORT_KEYS.forEach((key) => {
    if (value[key] !== undefined && value[key] !== null) {
      base[key] = String(value[key]);
    }
  });
  return base;
};

// Split a stored submissionNotes into the human narrative and the structured
// report. Always returns both, so callers can render notes without leaking the
// marker line into the UI.
export const parseMilestoneReport = (submissionNotes) => {
  const raw = String(submissionNotes || "");
  const idx = raw.lastIndexOf(MILESTONE_REPORT_MARKER);

  if (idx === -1) return { notes: raw.trim(), report: emptyMilestoneReport() };

  const line = raw.slice(idx + MILESTONE_REPORT_MARKER.length).split("\n")[0].trim();

  let parsed = null;
  try {
    parsed = JSON.parse(line);
  } catch {
    parsed = null;
  }

  return {
    notes: raw.slice(0, idx).trim(),
    report: sanitizeReport(parsed),
  };
};

// Notes as they should be shown to a human (marker stripped).
export const milestoneReportNotes = (submissionNotes) =>
  parseMilestoneReport(submissionNotes).notes;

// A row is worth persisting only if the startup actually filled something in.
export const hasReportData = (report) =>
  REPORT_KEYS.some((key) => String(report?.[key] || "").trim());

// Rebuild submissionNotes from the narrative plus the structured row.
export const buildSubmissionNotes = (notes, report) => {
  const clean = String(notes || "").trim();
  const sanitized = sanitizeReport(report);

  if (!hasReportData(sanitized)) return clean;

  return `${clean}\n\n${MILESTONE_REPORT_MARKER}${JSON.stringify(sanitized)}`;
};

// Planned minus actual. Positive = under budget, negative = overspent. Returns
// null when either side is blank, so the cell can stay empty instead of
// claiming a variance of zero.
export const computeVariance = (plannedAmount, actualAmount) => {
  const planned = Number(String(plannedAmount ?? "").replace(/,/g, ""));
  const actual = Number(String(actualAmount ?? "").replace(/,/g, ""));

  if (
    !String(plannedAmount ?? "").trim() ||
    !String(actualAmount ?? "").trim() ||
    !Number.isFinite(planned) ||
    !Number.isFinite(actual)
  ) {
    return null;
  }

  return planned - actual;
};

export const formatReportAmount = (value) => {
  const amount = Number(String(value ?? "").replace(/,/g, ""));
  if (!String(value ?? "").trim() || !Number.isFinite(amount)) return "—";
  return `TZS ${amount.toLocaleString()}`;
};

// ---- Planned amount, set when the milestone is created ------------------
//
// The create endpoint has no field for it, so it rides in the milestone's
// description behind its own marker — the description is free text the backend
// already stores, and the tracker views render `tranchePlannedUse` rather than
// this field.

export const MILESTONE_PLAN_MARKER = "__MILESTONE_PLAN__:";

// Milestones are planned as a span of time ("3 months"), not a calendar date.
// The span is what the startup and reviewers read; a due date is still derived
// from it so the existing overdue handling keeps working.
export const TIMELINE_SPAN_OPTIONS = [
  { value: "1_week", label: "1 week", days: 7 },
  { value: "2_weeks", label: "2 weeks", days: 14 },
  { value: "1_month", label: "1 month", days: 30 },
  { value: "2_months", label: "2 months", days: 61 },
  { value: "3_months", label: "3 months", days: 91 },
  { value: "6_months", label: "6 months", days: 182 },
  { value: "9_months", label: "9 months", days: 273 },
  { value: "12_months", label: "12 months", days: 365 },
];

export const timelineSpanLabel = (value) =>
  TIMELINE_SPAN_OPTIONS.find((option) => option.value === value)?.label || "";

// Due date for a span, counted from the tranche's disbursed date when there is
// one and from today otherwise. Returns null for an unknown span.
export const timelineSpanDueDate = (span, startDate) => {
  const option = TIMELINE_SPAN_OPTIONS.find((item) => item.value === span);
  if (!option) return null;

  const start = startDate ? new Date(startDate) : new Date();
  if (Number.isNaN(start.getTime())) return null;

  start.setDate(start.getDate() + option.days);
  return start.toISOString().slice(0, 10);
};

const todayISO = () => new Date().toISOString().slice(0, 10);

export const emptyMilestoneActivity = () => ({
  text: "",
  plannedAmount: "",
  timelineSpan: "",
  kpiImpact: "",
  setDate: todayISO(),
});

const emptyMilestonePlan = () => ({
  activities: [emptyMilestoneActivity()],
});

// `plan.activities` is a list of { text, plannedAmount, timelineSpan,
// kpiImpact, setDate } — each activity within the milestone carries its own
// budget, timeline, expected KPI/impact, and the date its timeline is counted
// from. Entries with nothing filled in are dropped.
export const buildMilestoneDescription = (description, plan = {}) => {
  const clean = String(description || "").trim();

  const activities = (Array.isArray(plan?.activities) ? plan.activities : [])
    .map((a) => ({
      text: String(a?.text ?? "").trim(),
      plannedAmount: String(a?.plannedAmount ?? "").trim(),
      timelineSpan: String(a?.timelineSpan ?? "").trim(),
      kpiImpact: String(a?.kpiImpact ?? "").trim(),
      setDate: String(a?.setDate ?? "").trim(),
    }))
    .filter((a) => a.text || a.plannedAmount || a.timelineSpan || a.kpiImpact);

  if (!activities.length) return clean || null;

  return `${clean}\n${MILESTONE_PLAN_MARKER}${JSON.stringify({ activities })}`;
};

// Split a milestone description into the text the user typed and the list of
// activities (each with its own planned amount and timeline) stored alongside
// it. Milestones created before per-activity planning stored one shared
// { plannedAmount, timelineSpan } — read as a single activity with blank text
// so old milestones still parse; EntrepreneurMilestones.jsx pairs it back up
// with the activity text (stored separately in tranchePlannedUse) when a plan
// is reopened for revision.
export const parseMilestonePlan = (description) => {
  const raw = String(description || "");
  const idx = raw.lastIndexOf(MILESTONE_PLAN_MARKER);

  if (idx === -1) return { description: raw.trim(), ...emptyMilestonePlan() };

  const line = raw.slice(idx + MILESTONE_PLAN_MARKER.length).split("\n")[0].trim();

  let activities = [];
  try {
    const parsed = JSON.parse(line);
    if (Array.isArray(parsed?.activities)) {
      activities = parsed.activities.map((a) => ({
        text: String(a?.text ?? ""),
        plannedAmount: String(a?.plannedAmount ?? ""),
        timelineSpan: String(a?.timelineSpan ?? ""),
        kpiImpact: String(a?.kpiImpact ?? ""),
        setDate: String(a?.setDate ?? ""),
      }));
    } else if (parsed && (parsed.plannedAmount !== undefined || parsed.timelineSpan !== undefined)) {
      activities = [
        {
          text: "",
          plannedAmount: String(parsed.plannedAmount ?? ""),
          timelineSpan: String(parsed.timelineSpan ?? ""),
          kpiImpact: "",
          setDate: "",
        },
      ];
    }
  } catch {
    // Leave activities empty — a description that lost its marker still reads.
  }

  if (!activities.length) activities = [emptyMilestoneActivity()];

  return { description: raw.slice(0, idx).trim(), activities };
};

// Every activity's expected KPI/impact, joined for display the same way
// activity text is (see ACTIVITY_SEPARATOR in EntrepreneurMilestones.jsx) —
// so wherever this is shown alongside the activities line, they read
// consistently.
export const milestoneKpiImpact = (milestone) => {
  const { activities } = parseMilestonePlan(milestone?.description);
  return activities
    .map((a) => String(a.kpiImpact || "").trim())
    .filter(Boolean)
    .join(" • ");
};

// The milestone's total budget — the sum of every activity's planned amount.
export const milestonePlannedAmount = (milestone) => {
  const { activities } = parseMilestonePlan(milestone?.description);
  const sum = activities.reduce((total, a) => {
    const n = Number(String(a.plannedAmount || "").replace(/,/g, ""));
    return total + (Number.isFinite(n) ? n : 0);
  }, 0);

  if (sum > 0) return String(sum);
  return milestone?.trancheAmount ? String(milestone.trancheAmount) : "";
};

// The milestone isn't done until its last activity is, so its overall
// timeline is the longest (latest-due) span among its activities.
export const milestoneTimelineSpan = (milestone) => {
  const { activities } = parseMilestonePlan(milestone?.description);
  const longest = activities.reduce((best, a) => {
    const option = TIMELINE_SPAN_OPTIONS.find((o) => o.value === a.timelineSpan);
    if (!option) return best;
    return !best || option.days > best.days ? option : best;
  }, null);

  return longest?.label || "";
};

// The milestone's own due date: the latest due date among its activities,
// each counted from its own Date Set — falling back to `fallbackStartDate`
// only for an activity that doesn't have one of its own (older data saved
// before per-activity Date Set).
export const milestoneActivitiesDueDate = (activities, fallbackStartDate) => {
  const dueDates = (activities || [])
    .map((a) => timelineSpanDueDate(a.timelineSpan, a.setDate || fallbackStartDate))
    .filter(Boolean);

  if (!dueDates.length) return null;
  return dueDates.reduce((latest, d) => (d > latest ? d : latest));
};

// Pre-fill a row from what the milestone already knows: the planned amount set
// when it was created, falling back to the tranche amount finance committed, so
// the startup isn't retyping either.
export const reportFromMilestone = (milestone) => {
  const { notes, report } = parseMilestoneReport(milestone?.submissionNotes);

  if (!report.plannedAmount) {
    report.plannedAmount = milestonePlannedAmount(milestone);
  }

  // Reports submitted as free text (before the grid, or through the KPI panel)
  // have comments but no narrative — show them in the narrative cell so the
  // table carries the whole report rather than sending readers elsewhere.
  if (!report.narrative && notes) {
    report.narrative = notes;
  }

  return report;
};
