import { jsPDF } from "jspdf";

// Renders an AI-generated Business Tool result — { title, summary, sections }
// — to a downloadable PDF. Structural approach (text wrapping, vertical
// positioning, page-break guard, safe filenames, section iteration) follows
// grantReportPDF.js; the content, heading copy and footer note are this
// feature's own, not the grant report's.

const safeFileName = (name) =>
  String(name || "business_tool_result")
    .replace(/[^a-z0-9]+/gi, "_")
    .replace(/^_+|_+$/g, "") || "business_tool_result";

export const downloadBusinessToolResultPDF = (result = {}) => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const ensureSpace = (needed) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const title = String(result.title || "AI-Generated Business Document").trim();
  const summary = String(result.summary || "").trim();
  const sections = Array.isArray(result.sections) ? result.sections : [];

  // Header band.
  doc.setFillColor(8, 45, 119); // #082d77 — this app's own primary color
  doc.rect(0, 0, pageWidth, 84, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("AI-GENERATED BUSINESS DOCUMENT", margin, 32);
  doc.setFontSize(18);
  const titleLines = doc.splitTextToSize(title, contentWidth).slice(0, 2);
  doc.text(titleLines, margin, 54);

  y = 108;

  // Summary.
  if (summary) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("Summary", margin, y);
    y += 16;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(30, 41, 59);
    const summaryLines = doc.splitTextToSize(summary, contentWidth);
    summaryLines.forEach((line) => {
      ensureSpace(15);
      doc.text(line, margin, y);
      y += 15;
    });
    y += 12;
  }

  // Sections.
  sections.forEach((section) => {
    const heading = String(section?.heading || "").trim();
    const content = String(section?.content || "").trim() || "Not provided.";

    ensureSpace(40);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y, pageWidth - margin, y);
    y += 18;

    if (heading) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(8, 45, 119);
      const headingLines = doc.splitTextToSize(heading, contentWidth);
      ensureSpace(headingLines.length * 16);
      doc.text(headingLines, margin, y);
      y += headingLines.length * 16 + 4;
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(30, 41, 59);
    const contentLines = doc.splitTextToSize(content, contentWidth);
    contentLines.forEach((line) => {
      ensureSpace(15);
      doc.text(line, margin, y);
      y += 15;
    });
    y += 14;
  });

  // Footer note.
  ensureSpace(30);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    "This document was generated with AI assistance based on your business information. Review it before use.",
    margin,
    pageHeight - margin + 16,
  );

  doc.save(`${safeFileName(title)}_AI_Result.pdf`);
};
