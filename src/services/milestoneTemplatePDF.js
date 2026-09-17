import { jsPDF } from "jspdf";
import "jspdf-autotable";

import {
  completionStatusLabel,
  computeVariance,
  formatReportAmount,
  milestoneKpiImpact,
  milestonePlannedAmount,
  milestoneTimelineSpan,
  receiptLabel,
  reportFromMilestone,
} from "@/utils/milestoneReport";

// The approved milestone plan as a downloadable table — the document the grant
// officer works from once the BDA has signed the plan off.
//
// It doubles as a reporting template: the plan columns (milestone, activities,
// timeline, budgeted amount) come out filled, and the reporting columns carry
// whatever the startup has filed so far, blank where they have not. Printed, it
// is the form; downloaded mid-programme, it is the record.

const safeFileName = (name) =>
  String(name || "startup")
    .replace(/[^a-z0-9]+/gi, "_")
    .replace(/^_+|_+$/g, "") || "startup";

// Same "planned minus actual" the reporting grid shows, worded for print: no
// colour to carry the meaning, so the direction is spelled out.
const varianceText = (report) => {
  const variance = computeVariance(report.plannedAmount, report.actualAmount);
  if (variance === null) return "";
  if (variance === 0) return formatReportAmount(0);
  return `${formatReportAmount(Math.abs(variance))} ${
    variance > 0 ? "under" : "over"
  }`;
};

const HEAD = [
  "Milestone",
  "Key activities",
  "KPI / Impact",
  "Timeline",
  "Budgeted amount",
  "Actual amount",
  "Variance",
  "Receipt/evidence",
  "Narrative",
];

// milestones - the approved milestones to include, in the order they should print
// context    - { startupName, programName, trancheLabel, grantCommitted }
export const downloadMilestoneTemplatePDF = (milestones = [], context = {}) => {
  // Landscape: eight columns do not read at A4 portrait width.
  const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "landscape" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;

  const {
    startupName = "Startup",
    programName = "",
    trancheLabel = "",
    grantCommitted = "",
  } = context;

  // Header band, matching the grant report's.
  doc.setFillColor(8, 45, 119); // #082d77
  doc.rect(0, 0, pageWidth, 84, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Approved Milestone Plan", margin, 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(startupName, margin, 62);

  let y = 108;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);

  const meta = [
    programName ? `Programme: ${programName}` : "",
    trancheLabel ? `Tranche: ${trancheLabel}` : "",
    grantCommitted ? `Committed: ${grantCommitted}` : "",
    `Milestones: ${milestones.length}`,
    // Stamped so a printed copy can be told apart from a later one.
    `Generated: ${new Date().toLocaleDateString()}`,
  ].filter(Boolean);

  meta.forEach((line) => {
    doc.text(line, margin, y);
    y += 14;
  });

  y += 8;

  const body = milestones.map((milestone) => {
    const report = reportFromMilestone(milestone);
    return [
      milestone.title || "",
      milestone.tranchePlannedUse || "",
      milestoneKpiImpact(milestone) || "",
      milestoneTimelineSpan(milestone) || "",
      formatReportAmount(
        report.plannedAmount || milestonePlannedAmount(milestone),
      ),
      report.actualAmount ? formatReportAmount(report.actualAmount) : "",
      varianceText(report),
      report.receiptEvidence ? receiptLabel(report.receiptEvidence) : "",
      report.narrative || "",
    ];
  });

  doc.autoTable({
    startY: y,
    head: [HEAD],
    body,
    margin: { left: margin, right: margin },
    styles: {
      font: "helvetica",
      fontSize: 8,
      cellPadding: 5,
      overflow: "linebreak",
      valign: "top",
      lineColor: [226, 232, 240],
      lineWidth: 0.5,
    },
    headStyles: {
      fillColor: [234, 240, 251], // #eaf0fb
      textColor: [17, 24, 39],
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    // Empty reporting cells need to stay tall enough to write in by hand.
    columnStyles: {
      0: { cellWidth: 105, fontStyle: "bold" },
      1: { cellWidth: 110 },
      2: { cellWidth: 95 },
      3: { cellWidth: 55 },
      4: { cellWidth: 80 },
      5: { cellWidth: 80 },
      6: { cellWidth: 75 },
      7: { cellWidth: 70 },
      8: { cellWidth: "auto" },
    },
    didParseCell: (data) => {
      if (data.section === "body" && !String(data.cell.raw || "").trim()) {
        data.cell.styles.minCellHeight = 26;
      }
    },
  });

  const scope = trancheLabel ? `_${safeFileName(trancheLabel)}` : "";
  doc.save(`${safeFileName(startupName)}${scope}_milestone_plan.pdf`);
};
