// Shared by the advisor's programme page and the startup's own page, so a
// milestone or KPI line reads the same on both sides.

export const TARGET_KINDS = [
  { value: "milestone", label: "Milestone" },
  { value: "kpi", label: "KPI" },
];

export const kindLabel = (kind) => (kind === "kpi" ? "KPI" : "Milestone");

export const COMPLETION_OPTIONS = [
  { value: "not_started", label: "Not started" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
];

export const completionLabel = (value) =>
  COMPLETION_OPTIONS.find((option) => option.value === value)?.label || "";

const LINE_STATUS = {
  draft: { label: "Draft", tone: "bg-slate-100 text-slate-600" },
  submitted: { label: "Awaiting review", tone: "bg-[#dbe8ff] text-[#163b8f]" },
  approved: { label: "Approved", tone: "bg-[#e1f0d8] text-[#2d6e1f]" },
  revision_requested: {
    label: "Further information requested",
    tone: "bg-[#fdf1ce] text-[#8a6500]",
  },
};

export const lineStatus = (submission) =>
  LINE_STATUS[submission?.status] || {
    label: "Not started",
    tone: "bg-slate-100 text-slate-600",
  };

// A startup can change its line until it is submitted, and again once the
// advisor sends it back.
export const isLineEditable = (submission) =>
  !submission || ["draft", "revision_requested"].includes(submission.status);

// What a line still needs before it can be submitted, or null.
export const missingForSubmit = (target, line = {}) => {
  if (target.kind === "kpi" && !String(line.value || "").trim()) return "a reported value";
  if (target.kind === "milestone" && !line.completionStatus) return "a status";
  if (target.evidenceRequired && !(line.evidenceUrls || []).length) return "evidence";
  return null;
};

export const formatDueDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

export const targetText = (target) =>
  target?.targetValue
    ? `${target.targetValue}${target.kind === "kpi" && target.unit ? ` ${target.unit}` : ""}`
    : "";

export const headClass =
  "border border-black/10 bg-[#eaf0fb] px-3 py-2 text-left text-xs font-black text-[#111827]";
export const cellClass =
  "border border-black/10 px-3 py-2 align-top text-sm break-words text-[#334155]";
export const pillClass = (tone) =>
  `inline-block rounded-full px-2.5 py-1 text-xs font-bold ${tone}`;
