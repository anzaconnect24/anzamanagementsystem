// A milestone's plan, one row per activity, and the reviewer's comments on
// each. Shared by the business coach's review table and the status table every
// role reads, so both split a milestone the same way.
import { parseMilestonePlan, timelineSpanLabel } from "@/utils/milestoneReport";

// Older milestones kept the activity names only in tranchePlannedUse, so those
// are paired back with the planned rows by position.
const ACTIVITY_SPLIT = /\s*(?:•|;|\n)\s*/;

export const milestoneActivityRows = (milestone) => {
  const { activities } = parseMilestonePlan(milestone?.description);
  const names = String(milestone?.tranchePlannedUse || "")
    .split(ACTIVITY_SPLIT)
    .map((name) => name.trim())
    .filter(Boolean);
  const planned = activities.filter(
    (a) => a.text || a.plannedAmount || a.timelineSpan || a.kpiImpact,
  );
  const count = Math.max(planned.length, names.length, 1);

  return Array.from({ length: count }, (_, index) => {
    const activity = planned[index] || {};
    return {
      text: String(activity.text || names[index] || "").trim(),
      plannedAmount: activity.plannedAmount || "",
      timeline: timelineSpanLabel(activity.timelineSpan) || "",
      kpiImpact: String(activity.kpiImpact || "").trim(),
    };
  });
};

export const activityLabel = (row, index) => row.text || `Activity ${index + 1}`;

// Comments on activities travel in the review note as "Activity: comment"
// lines, so the startup reads them as plain text and the tables can put each
// one back beside its activity.
export const buildActivityNotes = (rows, comments) =>
  rows
    .map((row, index) => {
      const comment = String(comments?.[index] || "").trim();
      return comment ? `${activityLabel(row, index)}: ${comment}` : null;
    })
    .filter(Boolean)
    .join("\n");

export const commentsFromNotes = (notes, rows) => {
  const byRow = rows.map(() => "");
  const loose = [];

  String(notes || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const index = rows.findIndex((row, i) => line.startsWith(`${activityLabel(row, i)}: `));
      if (index >= 0 && !byRow[index]) {
        byRow[index] = line.slice(activityLabel(rows[index], index).length + 2);
      } else {
        loose.push(line);
      }
    });

  // A note written before per-activity comments sits with the first activity.
  if (loose.length) byRow[0] = [byRow[0], ...loose].filter(Boolean).join("\n");
  return byRow;
};

// ---- Reporting, one line per activity ---------------------------------------

export const emptyActivityReport = () => ({
  completionStatus: "",
  actualAmount: "",
  receiptEvidence: "",
  narrative: "",
  attachments: [],
});

// What an activity reported, reading a report filed before activities had their
// own lines as belonging to the first activity.
export const activityReportAt = (report, index) => {
  if (Array.isArray(report?.activities)) {
    return { ...emptyActivityReport(), ...(report.activities[index] || {}) };
  }
  if (index !== 0) return emptyActivityReport();
  return {
    ...emptyActivityReport(),
    completionStatus: report?.completionStatus || "",
    actualAmount: report?.actualAmount || "",
    receiptEvidence: report?.receiptEvidence || "",
    narrative: report?.narrative || "",
  };
};

const sumAmounts = (values) => {
  let any = false;
  const total = values.reduce((sum, value) => {
    const text = String(value ?? "").replace(/,/g, "").trim();
    const amount = Number(text);
    if (!text || !Number.isFinite(amount)) return sum;
    any = true;
    return sum + amount;
  }, 0);
  return any ? String(total) : "";
};

// The milestone's own report line, derived from its activities, so everything
// that reads a milestone as a whole - finance totals, exports - stays right.
export const summariseActivityReports = (report, rows) => {
  const activities = rows.map((_, index) => activityReportAt(report, index));
  const statuses = activities.map((a) => a.completionStatus).filter(Boolean);
  const receipts = activities.map((a) => a.receiptEvidence).filter(Boolean);

  const completionStatus = !statuses.length
    ? ""
    : statuses.every((s) => s === "completed")
      ? "completed"
      : statuses.every((s) => s === "cancelled")
        ? "cancelled"
        : statuses.includes("delayed")
          ? "delayed"
          : statuses.some((s) => s === "in_progress" || s === "completed")
            ? "in_progress"
            : statuses[0];

  return {
    ...(report || {}),
    activities,
    completionStatus,
    plannedAmount: sumAmounts(rows.map((row) => row.plannedAmount)) || report?.plannedAmount || "",
    actualAmount: sumAmounts(activities.map((a) => a.actualAmount)),
    receiptEvidence: receipts.includes("attached")
      ? "attached"
      : receipts.includes("not_attached")
        ? "not_attached"
        : receipts[0] || "",
    narrative: activities
      .map((a, index) =>
        String(a.narrative || "").trim()
          ? `${activityLabel(rows[index], index)}: ${String(a.narrative).trim()}`
          : null,
      )
      .filter(Boolean)
      .join("\n"),
  };
};
