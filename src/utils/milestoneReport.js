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

const emptyMilestonePlan = () => ({
  plannedAmount: "",
  timelineSpan: "",
});

const PLAN_KEYS = Object.keys(emptyMilestonePlan());

// `plan` takes any subset of { plannedAmount, timelineSpan }; anything omitted
// is stored blank.
export const buildMilestoneDescription = (description, plan = {}) => {
  const clean = String(description || "").trim();

  const stored = emptyMilestonePlan();
  PLAN_KEYS.forEach((key) => {
    stored[key] = String(plan?.[key] ?? "").trim();
  });

  if (PLAN_KEYS.every((key) => !stored[key])) return clean || null;

  return `${clean}\n${MILESTONE_PLAN_MARKER}${JSON.stringify(stored)}`;
};

// Split a milestone description into the text the user typed and the plan
// (amount, timeline span) stored alongside it.
export const parseMilestonePlan = (description) => {
  const raw = String(description || "");
  const idx = raw.lastIndexOf(MILESTONE_PLAN_MARKER);

  if (idx === -1) return { description: raw.trim(), ...emptyMilestonePlan() };

  const line = raw.slice(idx + MILESTONE_PLAN_MARKER.length).split("\n")[0].trim();

  const plan = emptyMilestonePlan();
  try {
    const parsed = JSON.parse(line);
    PLAN_KEYS.forEach((key) => {
      plan[key] = String(parsed?.[key] || "");
    });
  } catch {
    // Leave the plan blank — a description that lost its marker still reads.
  }

  return { description: raw.slice(0, idx).trim(), ...plan };
};

export const milestonePlannedAmount = (milestone) =>
  parseMilestonePlan(milestone?.description).plannedAmount ||
  (milestone?.trancheAmount ? String(milestone.trancheAmount) : "");

export const milestoneTimelineSpan = (milestone) =>
  timelineSpanLabel(parseMilestonePlan(milestone?.description).timelineSpan);

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
