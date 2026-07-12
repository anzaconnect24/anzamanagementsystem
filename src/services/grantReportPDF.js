import { jsPDF } from "jspdf";
import { GRANT_REPORT_SECTIONS } from "./grantReportAI";

// Render an AI-generated grant report to a downloadable PDF.

const num = (value) => {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
};
const money = (value) => `TZS ${num(value).toLocaleString()}`;

const safeFileName = (name) =>
  String(name || "startup")
    .replace(/[^a-z0-9]+/gi, "_")
    .replace(/^_+|_+$/g, "") || "startup";

export const downloadGrantReportPDF = (report = {}, context = {}) => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const startup = context.startup || {};
  const grant = context.grant || {};
  const balance =
    grant.balance != null
      ? grant.balance
      : num(grant.disbursed || grant.amount) - num(grant.spent);

  const ensureSpace = (needed) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  // Header band
  doc.setFillColor(8, 45, 119); // #082d77
  doc.rect(0, 0, pageWidth, 96, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Grant Progress Report", margin, 46);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text(startup.name || "Startup", margin, 70);
  if (startup.sector) {
    doc.setFontSize(10);
    doc.text(String(startup.sector), margin, 86);
  }
  y = 120;

  // Grant summary box
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Grant Summary", margin, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const summary = [
    `Grant Amount: ${money(grant.amount)}`,
    `Disbursed Amount: ${money(grant.disbursed)}`,
    `Amount Spent: ${money(grant.spent)}`,
    `Balance: ${money(balance)}`,
  ];
  if (grant.purpose) summary.push(`Grant Purpose: ${grant.purpose}`);
  if (grant.reportDate) summary.push(`Report Date: ${grant.reportDate}`);
  summary.forEach((line) => {
    const wrapped = doc.splitTextToSize(line, contentWidth);
    ensureSpace(wrapped.length * 14);
    doc.text(wrapped, margin, y);
    y += wrapped.length * 14;
  });
  y += 10;

  // Sections
  GRANT_REPORT_SECTIONS.forEach((section) => {
    const heading = section.title;
    const question = section.question;
    const body = String(report[section.key] || "").trim() || "Not provided.";

    ensureSpace(40);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y, pageWidth - margin, y);
    y += 18;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(8, 45, 119);
    doc.text(heading, margin, y);
    y += 16;

    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    const qWrapped = doc.splitTextToSize(question, contentWidth);
    ensureSpace(qWrapped.length * 12);
    doc.text(qWrapped, margin, y);
    y += qWrapped.length * 12 + 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(30, 41, 59);
    const bodyWrapped = doc.splitTextToSize(body, contentWidth);
    bodyWrapped.forEach((line) => {
      ensureSpace(15);
      doc.text(line, margin, y);
      y += 15;
    });
    y += 12;
  });

  // Footer note
  ensureSpace(30);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    "This report was generated with AI assistance from the startup's grant and milestone data.",
    margin,
    pageHeight - margin + 16,
  );

  doc.save(`Grant_Report_${safeFileName(startup.name)}.pdf`);
};
