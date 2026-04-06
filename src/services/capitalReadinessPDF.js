import OpenAI from "openai";
import jsPDF from "jspdf";

// ─── OpenAI client ────────────────────────────────────────────────────────────
const OPENAI_API_KEY =
  "REDACTED_OPENAI_KEY";

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Extract scored items from a domain (object of section → item[]) */
function flattenDomain(domainData) {
  if (!domainData || typeof domainData !== "object") return [];
  const result = [];
  Object.entries(domainData).forEach(([section, rows]) => {
    if (!Array.isArray(rows)) return;
    rows.forEach((item) => {
      const narr =
        item.narrative?.find((n) => n.score === item.score)?.text || "";
      result.push({
        section,
        subDomain: item.subDomain || "",
        score: item.score ?? 0,
        maxScore: 2,
        narrative: narr,
        customerComment: item.customerComment || "",
        reviewerComment: item.reviewerComment || "",
      });
    });
  });
  return result;
}

/** Calculate weighted average score across all 4 domains */
function calcOverallScore(scoreData) {
  const vals = [
    scoreData?.commercial?.percentage || 0,
    scoreData?.financial?.percentage || 0,
    scoreData?.operations?.percentage || 0,
    scoreData?.legal?.percentage || 0,
  ];
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

/** Best-effort business name extraction */
function getBusinessName(userDetails) {
  console.log("🏢 Extracting business name from userDetails:", {
    hasUserDetails: !!userDetails,
    hasBusiness: !!userDetails?.Business,
    businessName: userDetails?.Business?.name,
    businessNameAlt: userDetails?.Business?.businessName,
    fallbackBusinessName: userDetails?.businessName,
  });

  // Prioritize Business.name (primary field from API response)
  const name =
    userDetails?.Business?.name ||
    userDetails?.Business?.businessName ||
    userDetails?.businessName ||
    "Business Investment Analysis";

  console.log("✅ Using business name for PDF:", name);
  return name;
}

// ─── Core AI Generation ─────────────────────────────────────────────────────

/**
 * Generate the structured Capital Readiness report content using AI.
 * This returns the same JSON object that is later used to build the PDF.
 *
 * @param {Object} data        - Domain data (commercial, financial, operations, legal)
 * @param {Object} scoreData   - Domain score percentages and statuses
 * @param {Object} userDetails - User / business details
 * @param {Function} [onStatus]- Optional callback(message) for progress updates
 * @returns {Promise<{ success: boolean, content: any }>}
 */
export async function generateCapitalReadinessContent(
  data,
  scoreData,
  userDetails,
  onStatus,
) {
  onStatus?.("Preparing assessment data...");

  let content;

  try {
    onStatus?.(
      "Calling AI to generate report content — this may take 20–40 seconds...",
    );

    const prompt = buildPrompt(data, scoreData, userDetails);

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.65,
      max_tokens: 8000,
    });

    const raw = response.choices[0]?.message?.content || "";
    onStatus?.("Processing AI response...");

    // Strip markdown fences if present
    const cleaned = raw
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();

    // Extract the JSON object
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI did not return valid JSON");

    content = JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.warn(
      "AI report generation failed, using fallback content:",
      err.message,
    );
    onStatus?.("AI unavailable — generating report with assessment data...");
    content = buildFallback(scoreData, userDetails);
  }

  return { success: true, content };
}

// ─── AI Prompt ────────────────────────────────────────────────────────────────

function buildPrompt(data, scoreData, userDetails) {
  const businessName = getBusinessName(userDetails);
  const sector =
    userDetails?.Business?.sector ||
    userDetails?.Business?.businessSector ||
    "General Business";
  const location =
    userDetails?.Business?.location ||
    userDetails?.Business?.businessLocation ||
    "East Africa";
  const overallScore = calcOverallScore(scoreData);
  const readiness = overallScore >= 70 ? "Ready" : "Not Ready";

  // Compress data so it fits within prompt token budget
  const commercialItems = flattenDomain(data?.commercial).slice(0, 20);
  const financialItems = flattenDomain(data?.financial).slice(0, 20);
  const operationsItems = flattenDomain(data?.operations).slice(0, 20);
  const legalItems = flattenDomain(data?.legal).slice(0, 20);

  return `You are a senior investment analyst preparing a formal Capital Readiness Assessment Report for a business in East Africa. Based on the assessment data below, generate a comprehensive professional report in valid JSON format.

BUSINESS PROFILE:
- Name: ${businessName}
- Sector: ${sector}
- Location: ${location}

ASSESSMENT SCORES:
- Commercial/Market: ${scoreData?.commercial?.percentage || 0}% — ${scoreData?.commercial?.status || "Not Ready"}
- Financial: ${scoreData?.financial?.percentage || 0}% — ${scoreData?.financial?.status || "Not Ready"}
- Operations: ${scoreData?.operations?.percentage || 0}% — ${scoreData?.operations?.status || "Not Ready"}
- Legal & Compliance: ${scoreData?.legal?.percentage || 0}% — ${scoreData?.legal?.status || "Not Ready"}
- Overall Score: ${overallScore}% — ${readiness}

COMMERCIAL ASSESSMENT DATA:
${JSON.stringify(commercialItems)}

FINANCIAL ASSESSMENT DATA:
${JSON.stringify(financialItems)}

OPERATIONS ASSESSMENT DATA:
${JSON.stringify(operationsItems)}

LEGAL & COMPLIANCE DATA:
${JSON.stringify(legalItems)}

Generate a JSON object with EXACTLY this structure (no markdown, no code blocks — ONLY raw JSON):
{
  "executiveSummary": "<3 paragraphs: overall investment position, key findings narrative, and a clear recommendation>",
  "background": {
    "purpose": "<2 paragraphs explaining the purpose of this capital readiness assessment>",
    "definition": "<2 paragraphs defining capital readiness and its importance for ${businessName}>",
    "scopeAndMethodology": "<2 paragraphs describing scope and assessment methodology used>"
  },
  "companyOverview": "<3 paragraphs: what the business does, its market position, stage of development, based on the data>",
  "assessmentOutcome": {
    "overallScore": "<2 paragraphs analysing the ${overallScore}% overall score and what it means>",
    "domainScores": "<2 paragraphs comparing and contrasting the four domain scores>",
    "scoringMethodology": "<2 paragraphs explaining the 0–2 sub-domain scoring scale and aggregation>",
    "thresholdCriteria": "<2 paragraphs explaining the 70% readiness threshold and its significance>"
  },
  "marketAssessment": "<4 paragraphs: market demand, competition, sales & pricing, marketing strategy, and specific recommendations>",
  "financialAssessment": "<4 paragraphs: revenue & cost performance, cash flow, working capital, financial records quality, and recommendations>",
  "operationsAssessment": "<4 paragraphs: management team, systems & processes, quality control, operational readiness, and recommendations>",
  "legalAssessment": "<4 paragraphs: incorporation & licensing, contractual frameworks, governance, compliance gaps, and recommendations>",
  "riskAnalysis": {
    "commercialRisks": "<3 paragraphs on commercial and market risks with specific mitigation strategies>",
    "financialRisks": "<3 paragraphs on financial risks including cash flow and sustainability risks with mitigations>",
    "operationalRisks": "<3 paragraphs on operational risks including capacity and system risks with mitigations>",
    "legalRegulatoryRisks": "<3 paragraphs on legal and regulatory compliance risks with mitigations>"
  },
  "roadmap": {
    "immediate": "<2 paragraphs with specific, actionable steps for 0–3 months>",
    "shortTerm": "<2 paragraphs with specific steps for 3–9 months>",
    "mediumTerm": "<2 paragraphs with specific steps for 9–18 months>",
    "projectedImprovement": "<2 paragraphs projecting readiness improvement if recommendations are followed>"
  },
  "conclusion": "<3 paragraphs: final assessment summary, overall recommendation, and path forward for ${businessName}>"
}

CRITICAL RULES:
1. Return ONLY valid, parseable JSON — no markdown, no code fences, no extra text.
2. Base ALL content on the actual scores and assessment data provided — avoid generic filler.
3. Name the business as "${businessName}" in the narrative.
4. Each value must be a plain string (paragraphs separated by \\n\\n).`;
}

// ─── PDF Builder ──────────────────────────────────────────────────────────────

/** Append wrapped text to the page, adding new pages when needed.
 *  Returns the new Y position. */
function addWrappedText(
  doc,
  text,
  x,
  y,
  maxWidth,
  lineH,
  pageH,
  margin,
  pageSetup,
) {
  if (!text) return y;
  const str = String(text);
  // Split by paragraph breaks first to preserve structure
  const paragraphs = str.split(/\n\n+/);
  paragraphs.forEach((para, pi) => {
    const lines = doc.splitTextToSize(para.trim(), maxWidth);
    lines.forEach((line) => {
      if (y > pageH - margin - 8) {
        doc.addPage();
        y = margin + 6;
        if (pageSetup) pageSetup(doc);
      }
      doc.text(line, x, y);
      y += lineH;
    });
    // Add paragraph spacing (except after last paragraph)
    if (pi < paragraphs.length - 1) y += lineH * 0.5;
  });
  return y;
}

/** Draw overlapping partial ellipses for the wave decoration.
 *  cx/cy = center (can be off-page; PDF viewers clip to page). */
function drawWaves(
  doc,
  cx,
  cy,
  count,
  baseRx,
  growRx,
  ry_ratio,
  strokeRGB,
  lineW = 1.0,
) {
  doc.setDrawColor(...strokeRGB);
  doc.setLineWidth(lineW);
  for (let i = 0; i < count; i++) {
    const rx = baseRx + i * growRx;
    const ry = rx * ry_ratio;
    doc.ellipse(cx, cy, rx, ry, "S");
  }
}

/** Draw a neat domain score bar */
function drawScoreBar(
  doc,
  x,
  y,
  barWidth,
  label,
  pct,
  status,
  primaryBlue,
  ready,
) {
  const barH = 7;
  const filledW = Math.min((pct / 100) * barWidth, barWidth);
  const color = ready ? [34, 197, 94] : [220, 53, 69];

  doc.setFillColor(230, 235, 245);
  doc.roundedRect(x, y, barWidth, barH, 1, 1, "F");
  doc.setFillColor(...color);
  doc.roundedRect(x, y, filledW, barH, 1, 1, "F");

  doc.setTextColor(31, 41, 55);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(label, x, y - 2);
  doc.setFont("helvetica", "bold");
  doc.text(`${pct}%`, x + barWidth + 3, y + 5);
  doc.setFont("helvetica", "normal");
}

/** Fetch a remote image and return it as a base64 data-URL (null on failure). */
async function fetchImageAsBase64(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn("Could not fetch logo image:", err.message);
    return null;
  }
}

/** Build the full PDF and trigger download. Returns filename. */
async function buildPDF(content, scoreData, userDetails, logoDataUrl) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const PW = doc.internal.pageSize.width; // 210
  const PH = doc.internal.pageSize.height; // 297
  const M = 18; // margin
  const TW = PW - 2 * M; // text width
  const LH = 5.5; // line height

  // ── Colour palette ──
  const DARK_BLUE = [10, 26, 100]; // cover background
  const ACCENT_BLUE = [38, 45, 137]; // section headers / accents
  const WAVE_COVER = [30, 65, 175]; // wave lines on cover
  const WAVE_TOC = [170, 180, 220]; // wave lines on TOC
  const GOLD = [255, 193, 7]; // score colour
  const TEXT_DARK = [31, 41, 55];
  const TEXT_MID = [90, 100, 115];
  const BG_LIGHT = [248, 249, 252];

  const businessName = getBusinessName(userDetails);
  const overallScore = calcOverallScore(scoreData);
  const isReady = overallScore >= 70;
  const today = new Date().toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // ════════════════════════════════════════════════════════════════
  // PAGE 1 — COVER
  // ════════════════════════════════════════════════════════════════
  doc.setFillColor(...DARK_BLUE);
  doc.rect(0, 0, PW, PH, "F");

  // Decorative wave circles — centred just off bottom-right corner
  drawWaves(doc, PW - 5, PH - 5, 9, 38, 22, 0.62, WAVE_COVER, 1.0);

  // ── Anza logo (top right) ──
  const logoW = 32; // mm
  const logoH = 14; // mm — preserves typical logo aspect ratio
  const logoX = PW - M - logoW;
  const logoY = 12;
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, "PNG", logoX, logoY, logoW, logoH);
  } else {
    // Fallback: plain text logo if image could not be loaded
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text("anza", logoX + logoW / 2, logoY + 9, { align: "center" });
  }

  // ── Main cover text ──
  const titleAreaY = PH * 0.3;
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  const nameLines = doc.splitTextToSize(businessName, PW * 0.68);
  nameLines.forEach((line, i) => doc.text(line, M, titleAreaY + i * 13));
  let afterName = titleAreaY + nameLines.length * 13 + 4;

  doc.setFontSize(20);
  const rptLines = doc.splitTextToSize(
    "Capital Readiness Assessment Report",
    PW * 0.65,
  );
  rptLines.forEach((line, i) => doc.text(line, M, afterName + i * 10.5));
  const afterTitle = afterName + rptLines.length * 10.5 + 10;

  // Score in gold
  doc.setTextColor(...GOLD);
  doc.setFontSize(22);
  doc.text(`Score: ${overallScore}%`, M, afterTitle);

  // Date / reference line
  doc.setTextColor(190, 205, 240);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(today, M, afterTitle + 10);

  // Footer
  doc.setTextColor(170, 185, 225);
  doc.setFontSize(8.5);
  doc.text(`${businessName} - Investment Analysis Report`, PW / 2, PH - 12, {
    align: "center",
  });

  // ════════════════════════════════════════════════════════════════
  // PAGE 2 — TABLE OF CONTENTS
  // ════════════════════════════════════════════════════════════════
  doc.addPage();
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, PW, PH, "F");

  // Decorative waves top-right
  drawWaves(doc, PW + 10, 55, 8, 35, 18, 0.62, WAVE_TOC, 0.9);

  // "Table of Contents" rotated text on the left
  doc.setFont("helvetica", "bold");
  doc.setFontSize(34);
  doc.setTextColor(...ACCENT_BLUE);
  doc.text("Table of Contents", 16, PH - 28, { angle: 90 });

  // Vertical separator
  doc.setDrawColor(...ACCENT_BLUE);
  doc.setLineWidth(0.5);
  doc.line(52, 18, 52, PH - 18);

  // TOC items
  const TOC_X = 60;
  let tocY = 28;
  const tocData = [
    { num: "1.", title: "Executive Summary", subs: [] },
    {
      num: "2.",
      title: "Background Information",
      subs: [
        "Purpose of the Assessment",
        "Definition of Capital Readiness",
        "Scope and Methodology",
      ],
    },
    { num: "3.", title: "Company Overview", subs: [] },
    {
      num: "4.",
      title: "Assessment Outcome",
      subs: [
        "Overall Readiness Score",
        "Domain-Level Scores",
        "Scoring Methodology",
        "Readiness Threshold Criteria",
      ],
    },
    {
      num: "5.",
      title: "Generic Report",
      subs: [
        "Market Assessment Report",
        "Financial Assessment Report",
        "Operations Assessment Report",
        "Legal & Compliance Assessment Report",
      ],
    },
    {
      num: "6.",
      title: "Consolidated Risk Analysis",
      subs: [
        "Commercial Risks",
        "Financial Risks",
        "Operational Risks",
        "Legal & Regulatory Risks",
      ],
    },
    {
      num: "7.",
      title: "Readiness Improvement Roadmap",
      subs: [
        "Immediate Actions (0–3 Months)",
        "Short-Term Actions (3–9 Months)",
        "Medium-Term Actions (9–18 Months)",
        "Projected Readiness Improvement",
      ],
    },
    { num: "8.", title: "Conclusion & Recommendations", subs: [] },
  ];

  tocData.forEach((item) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11.5);
    doc.setTextColor(...ACCENT_BLUE);
    doc.text(`${item.num} ${item.title}`, TOC_X, tocY);
    tocY += 7;
    item.subs.forEach((sub) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(75, 85, 110);
      doc.text(`\u2022 ${sub}`, TOC_X + 7, tocY);
      tocY += 5.5;
    });
    if (item.subs.length > 0) tocY += 2;
  });

  // TOC footer
  doc.setTextColor(160, 165, 180);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`${businessName} - Investment Analysis Report`, PW / 2, PH - 10, {
    align: "center",
  });

  // ════════════════════════════════════════════════════════════════
  // Helper: section page header bar
  // ════════════════════════════════════════════════════════════════
  const sectionHeader = (num, title, isContinued = false) => {
    doc.setFillColor(...ACCENT_BLUE);
    doc.rect(0, 0, PW, 16, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    const label = isContinued
      ? `${num}. ${title} (continued)`
      : `${num}. ${title}`;
    doc.text(label, M, 11);
    doc.setTextColor(...TEXT_DARK);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
  };

  const pageSetupFor =
    (num, title, isContinued = false) =>
    () =>
      sectionHeader(num, title, isContinued);

  // ════════════════════════════════════════════════════════════════
  // Helper: add sub-section heading inside a page
  // ════════════════════════════════════════════════════════════════
  const subHeading = (doc, label, y) => {
    doc.setTextColor(...ACCENT_BLUE);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(label, M, y);
    // underline
    doc.setDrawColor(...ACCENT_BLUE);
    doc.setLineWidth(0.3);
    doc.line(M, y + 1, M + doc.getTextWidth(label), y + 1);
    doc.setTextColor(...TEXT_DARK);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    return y + 8;
  };

  // ════════════════════════════════════════════════════════════════
  // Helper: generic section with plain text body
  // ════════════════════════════════════════════════════════════════
  const addPlainSection = (num, title, bodyText) => {
    doc.addPage();
    sectionHeader(num, title);
    let y = 24;
    doc.setTextColor(...TEXT_DARK);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    y = addWrappedText(
      doc,
      bodyText,
      M,
      y,
      TW,
      LH,
      PH,
      M,
      pageSetupFor(num, title, true),
    );
  };

  // ════════════════════════════════════════════════════════════════
  // Helper: section with named sub-sections
  // ════════════════════════════════════════════════════════════════
  const addSubSection = (
    doc,
    key,
    displayLabel,
    value,
    y,
    num,
    sectionTitle,
  ) => {
    if (y > PH - 50) {
      doc.addPage();
      sectionHeader(num, sectionTitle, true);
      y = 24;
    }
    y = subHeading(doc, displayLabel, y);
    doc.setTextColor(...TEXT_DARK);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    y = addWrappedText(
      doc,
      value,
      M,
      y,
      TW,
      LH,
      PH,
      M,
      pageSetupFor(num, sectionTitle, true),
    );
    return y + 6;
  };

  // ════════════════════════════════════════════════════════════════
  // SECTION 1 — Executive Summary
  // ════════════════════════════════════════════════════════════════
  addPlainSection(1, "Executive Summary", content.executiveSummary);

  // ════════════════════════════════════════════════════════════════
  // SECTION 2 — Background Information
  // ════════════════════════════════════════════════════════════════
  doc.addPage();
  sectionHeader(2, "Background Information");
  let y2 = 24;
  const bgItems = [
    { key: "purpose", label: "Purpose of the Assessment" },
    { key: "definition", label: "Definition of Capital Readiness" },
    { key: "scopeAndMethodology", label: "Scope and Methodology" },
  ];
  bgItems.forEach(({ key, label }) => {
    y2 = addSubSection(
      doc,
      key,
      label,
      content.background?.[key] || "",
      y2,
      2,
      "Background Information",
    );
  });

  // ════════════════════════════════════════════════════════════════
  // SECTION 3 — Company Overview
  // ════════════════════════════════════════════════════════════════
  addPlainSection(3, "Company Overview", content.companyOverview);

  // ════════════════════════════════════════════════════════════════
  // SECTION 4 — Assessment Outcome
  // ════════════════════════════════════════════════════════════════
  doc.addPage();
  sectionHeader(4, "Assessment Outcome");
  let y4 = 24;

  // Domain score summary table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...ACCENT_BLUE);
  doc.text("Domain Scores Summary", M, y4);
  y4 += 7;

  const domains4 = [
    { label: "Commercial / Market", key: "commercial" },
    { label: "Financial", key: "financial" },
    { label: "Operations", key: "operations" },
    { label: "Legal & Compliance", key: "legal" },
  ];
  const colW = [80, 35, 50];
  const rowH = 8;

  // Table header
  doc.setFillColor(...ACCENT_BLUE);
  doc.rect(M, y4, TW, rowH, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  let cx4 = M;
  ["Domain", "Score", "Readiness Status"].forEach((h, i) => {
    doc.text(h, cx4 + 3, y4 + 5.5);
    cx4 += colW[i];
  });
  y4 += rowH;

  // Data rows
  [...domains4, { label: "Overall", key: "_overall" }].forEach((d, ri) => {
    const pct =
      d.key === "_overall" ? overallScore : scoreData?.[d.key]?.percentage || 0;
    const status =
      d.key === "_overall"
        ? isReady
          ? "Ready"
          : "Not Ready"
        : scoreData?.[d.key]?.status || "Not Ready";
    const isRowReady = status === "Ready";

    doc.setFillColor(...(ri % 2 === 0 ? BG_LIGHT : [255, 255, 255]));
    doc.rect(M, y4, TW, rowH, "F");
    doc.setDrawColor(210, 218, 235);
    doc.setLineWidth(0.2);
    doc.rect(M, y4, TW, rowH, "S");

    cx4 = M;
    doc.setTextColor(...TEXT_DARK);
    doc.setFont("helvetica", ri === 4 ? "bold" : "normal");
    doc.setFontSize(9);
    [d.label, `${pct}%`, status].forEach((cell, ci) => {
      if (ci === 2) {
        doc.setTextColor(...(isRowReady ? [34, 140, 60] : [200, 50, 50]));
      }
      doc.text(String(cell), cx4 + 3, y4 + 5.5);
      doc.setTextColor(...TEXT_DARK);
      cx4 += colW[ci];
    });
    y4 += rowH;
  });
  y4 += 10;

  // Score bar chart visual
  const barMaxW = 100;
  domains4.forEach((d) => {
    const pct = scoreData?.[d.key]?.percentage || 0;
    const ready = (scoreData?.[d.key]?.status || "") === "Ready";
    if (y4 > PH - 30) {
      doc.addPage();
      sectionHeader(4, "Assessment Outcome", true);
      y4 = 24;
    }
    drawScoreBar(
      doc,
      M,
      y4,
      barMaxW,
      d.label,
      pct,
      pct >= 70 ? "Ready" : "Not Ready",
      ACCENT_BLUE,
      ready,
    );
    y4 += 14;
  });
  y4 += 6;

  // Assessment outcome sub-sections
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const outcomeItems = [
    { key: "overallScore", label: "Overall Readiness Score" },
    { key: "domainScores", label: "Domain-Level Scores" },
    { key: "scoringMethodology", label: "Scoring Methodology" },
    { key: "thresholdCriteria", label: "Readiness Threshold Criteria" },
  ];
  outcomeItems.forEach(({ key, label }) => {
    y4 = addSubSection(
      doc,
      key,
      label,
      content.assessmentOutcome?.[key] || "",
      y4,
      4,
      "Assessment Outcome",
    );
  });

  // ════════════════════════════════════════════════════════════════
  // SECTION 5 — Generic Report
  // ════════════════════════════════════════════════════════════════
  doc.addPage();
  sectionHeader(5, "Generic Report");
  let y5 = 24;

  const generic5 = [
    { key: "marketAssessment", label: "Market Assessment Report" },
    { key: "financialAssessment", label: "Financial Assessment Report" },
    { key: "operationsAssessment", label: "Operations Assessment Report" },
    { key: "legalAssessment", label: "Legal & Compliance Assessment Report" },
  ];
  generic5.forEach(({ key, label }) => {
    y5 = addSubSection(
      doc,
      key,
      label,
      content[key] || "",
      y5,
      5,
      "Generic Report",
    );
  });

  // ════════════════════════════════════════════════════════════════
  // SECTION 6 — Consolidated Risk Analysis
  // ════════════════════════════════════════════════════════════════
  doc.addPage();
  sectionHeader(6, "Consolidated Risk Analysis");
  let y6 = 24;
  const risk6 = [
    { key: "commercialRisks", label: "Commercial Risks" },
    { key: "financialRisks", label: "Financial Risks" },
    { key: "operationalRisks", label: "Operational Risks" },
    { key: "legalRegulatoryRisks", label: "Legal & Regulatory Risks" },
  ];
  risk6.forEach(({ key, label }) => {
    y6 = addSubSection(
      doc,
      key,
      label,
      content.riskAnalysis?.[key] || "",
      y6,
      6,
      "Consolidated Risk Analysis",
    );
  });

  // ════════════════════════════════════════════════════════════════
  // SECTION 7 — Readiness Improvement Roadmap
  // ════════════════════════════════════════════════════════════════
  doc.addPage();
  sectionHeader(7, "Readiness Improvement Roadmap");
  let y7 = 24;
  const roadmap7 = [
    { key: "immediate", label: "Immediate Actions (0–3 Months)" },
    { key: "shortTerm", label: "Short-Term Actions (3–9 Months)" },
    { key: "mediumTerm", label: "Medium-Term Actions (9–18 Months)" },
    { key: "projectedImprovement", label: "Projected Readiness Improvement" },
  ];
  roadmap7.forEach(({ key, label }) => {
    y7 = addSubSection(
      doc,
      key,
      label,
      content.roadmap?.[key] || "",
      y7,
      7,
      "Readiness Improvement Roadmap",
    );
  });

  // ════════════════════════════════════════════════════════════════
  // SECTION 8 — Conclusion & Recommendations
  // ════════════════════════════════════════════════════════════════
  addPlainSection(8, "Conclusion & Recommendations", content.conclusion);

  // ════════════════════════════════════════════════════════════════
  // FOOTER on every page except cover
  // ════════════════════════════════════════════════════════════════
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 2; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(200, 210, 230);
    doc.setLineWidth(0.3);
    doc.line(M, PH - 14, PW - M, PH - 14);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(140, 150, 170);
    doc.text(
      `${businessName} — Capital Readiness Assessment Report`,
      M,
      PH - 9,
    );
    doc.text(`${p} / ${totalPages}`, PW - M, PH - 9, { align: "right" });
  }

  // ── Save ──
  const safeTitle = businessName
    .replace(/[^a-zA-Z0-9]/g, "_")
    .replace(/_+/g, "_");
  const filename = `Capital_Readiness_Report_${safeTitle}_${Date.now()}.pdf`;
  doc.save(filename);
  return filename;
}

// ─── Fallback content when AI fails ──────────────────────────────────────────

function buildFallback(scoreData, userDetails) {
  const businessName = getBusinessName(userDetails);
  const overallScore = calcOverallScore(scoreData);
  const c = (k) => scoreData?.[k]?.percentage || 0;
  return {
    executiveSummary: `${businessName} has undergone a comprehensive Capital Readiness Assessment covering four key domains: Commercial/Market, Financial, Operations, and Legal & Compliance. The overall score of ${overallScore}% ${overallScore >= 70 ? "indicates investment readiness" : "indicates areas requiring improvement before full investment readiness"}.\n\nThe assessment reveals that the business scores ${c("commercial")}% in Commercial performance, ${c("financial")}% in Financial management, ${c("operations")}% in Operations, and ${c("legal")}% in Legal & Compliance. These scores provide a holistic view of the business's preparedness to effectively utilise investment capital.\n\nBased on the assessment findings, targeted improvements across the identified gap areas have the potential to significantly enhance the business's investment readiness within a structured 18-month roadmap.`,
    background: {
      purpose: `This Capital Readiness Assessment has been conducted to evaluate ${businessName}'s preparedness to attract, receive, and effectively deploy external investment capital. The assessment provides a structured, evidence-based evaluation of the business across four critical dimensions that investors scrutinise when making investment decisions.\n\nThe primary purpose is to identify both strengths that can be leveraged and gaps that require addressing, enabling the business to present a compelling case to potential investors while building a stronger, more sustainable enterprise.`,
      definition: `Capital readiness refers to the degree to which a business has established the systems, processes, governance structures, and commercial foundations necessary to attract investment and deploy capital effectively for growth. A capital-ready business demonstrates not only commercial viability but also operational maturity, financial discipline, and legal compliance.\n\nFor ${businessName}, achieving capital readiness means building investor confidence through transparent financial management, robust operational systems, sound commercial strategies, and full legal compliance — all of which are evaluated in this assessment.`,
      scopeAndMethodology: `This assessment covers four domains: Commercial/Market (evaluating demand, competition, sales, and marketing), Financial (covering revenue, costs, cash flow, and record quality), Operations (examining management, systems, and quality control), and Legal & Compliance (assessing incorporation, licensing, and governance).\n\nEach sub-domain is scored on a 0–2 scale based on evidence provided by the entrepreneur, reviewer observations, and supporting documentation. Domain scores are aggregated to produce percentage scores, with 70% representing the threshold for investment readiness.`,
    },
    companyOverview: `${businessName} is a business operating in the ${scoreData?.commercial?.status ? "commercial" : "general"} sector, at a stage of development where foundational systems and market presence are being established and strengthened. The business has undergone a formal assessment to understand its current position relative to investment readiness benchmarks.\n\nBased on the assessment data, the business has demonstrated capabilities in several key areas while also identifying specific domains requiring focused improvement. The assessment provides a clear picture of where the business stands today and what is required to achieve full investment readiness.\n\nThe business has demonstrated commitment to the assessment process through engagement with the CRAT framework, providing data across all four domains and showing willingness to identify and address improvement areas as part of its growth journey.`,
    assessmentOutcome: {
      overallScore: `${businessName} achieved an overall Capital Readiness Score of ${overallScore}%, which ${overallScore >= 70 ? "meets the 70% investment readiness threshold, indicating that the business is broadly prepared for investment consideration" : "falls below the 70% investment readiness threshold, indicating that targeted improvements are required before the business can be considered fully investment-ready"}.\n\nThis overall score represents an average across the four assessed domains, and while it provides a useful summary indicator, investors should review individual domain scores to understand the specific areas of strength and the gaps that require attention.`,
      domainScores: `The domain-level scores reveal a nuanced picture: Commercial at ${c("commercial")}%, Financial at ${c("financial")}%, Operations at ${c("operations")}%, and Legal & Compliance at ${c("legal")}%. ${c("commercial") === Math.max(c("commercial"), c("financial"), c("operations"), c("legal")) ? "The Commercial domain represents the business's strongest area" : "Each domain offers distinct insights into the business's readiness profile"}.\n\nThe variation across domains highlights both the areas where the business has invested in building strong foundations and those where focused improvement efforts will yield the greatest impact on overall investment readiness.`,
      scoringMethodology: `The assessment uses a structured scoring methodology where each sub-domain is evaluated on a 0–2 scale: 0 indicates the criterion is not met or evidence is absent, 1 indicates partial compliance or foundational capability, and 2 indicates full compliance with strong evidence. These scores are aggregated within each domain to produce a percentage score.\n\nThis methodology ensures consistency and objectivity across assessments, enabling meaningful comparisons and clear identification of priority areas. The scoring reflects observable evidence rather than subjective impressions, providing a reliable basis for investment decision-making.`,
      thresholdCriteria: `The 70% readiness threshold has been established based on investment best practices and analysis of businesses that have successfully attracted and deployed capital in East African markets. Businesses scoring above 70% demonstrate sufficient foundations across all domains to manage investment capital responsibly and generate returns.\n\nBusinesses scoring below 70% are not excluded from investment consideration but are advised to address identified gaps before or as part of any investment agreement. The threshold also serves as a goal for businesses on their capital readiness journey, providing a clear, measurable target.`,
    },
    marketAssessment: `The commercial assessment of ${businessName} reveals a score of ${c("commercial")}%, reflecting the business's current market position and commercial capabilities. This score encompasses evaluation of market demand, competitive positioning, sales performance, customer segmentation, pricing strategy, and marketing effectiveness.\n\nThe business has demonstrated understanding of its target market and has begun building commercial systems to serve its customer base. Key areas of strength include market awareness and product development, while areas such as market share expansion and advanced sales strategy may require further development.\n\nFrom a competitive standpoint, the business operates in a market with existing competition and must continue to differentiate its offerings through quality, pricing, and customer service. Developing a more structured approach to competitive intelligence will strengthen the business's ability to anticipate and respond to market changes.\n\nRecommendations include formalising the sales process with clear targets and tracking mechanisms, investing in marketing strategy development, and strengthening customer relationship management systems to improve retention and referral rates.`,
    financialAssessment: `The financial assessment score of ${c("financial")}% reflects ${businessName}'s current financial management capabilities and the quality of its financial information systems. This evaluation covers revenue generation, cost management, working capital, cash flow management, asset management, debt posture, and the quality of financial records.\n\nThe assessment found that the business has established basic financial management practices. Revenue generation and cost management are operational, though there is opportunity to improve the sophistication of financial planning and reporting to meet investor expectations.\n\nCash flow management is a critical area for businesses seeking investment. The assessment results indicate that establishing more rigorous cash flow forecasting and working capital management practices would significantly strengthen the business's financial readiness profile.\n\nRecommendations include implementing accounting software for accurate bookkeeping, preparing monthly management accounts, developing a 12-month cash flow forecast, and engaging a qualified accountant to audit and formalise financial records prior to investor engagement.`,
    operationsAssessment: `${businessName}'s operations score of ${c("operations")}% captures the business's operational maturity across management structure, team capacity, professional development, performance measurement, data management, systems utilisation, quality control, customer relationship management, and strategic planning.\n\nThe assessment indicates that the business has functional operational systems supporting its current scale of operations. Leadership demonstrates commitment to the business, and the team possesses relevant knowledge and skills for day-to-day operations.\n\nAs the business prepares for investment and subsequent growth, operational systems will need to scale accordingly. Investors will look for evidence of documented processes, clear performance metrics, and systems capable of supporting increased operational complexity.\n\nRecommendations include documenting key operational processes and procedures, implementing performance management systems with measurable KPIs, investing in team development and succession planning, and upgrading data management systems to provide real-time operational insights.`,
    legalAssessment: `The legal and compliance assessment score of ${c("legal")}% reflects the business's legal standing and governance framework. This domain evaluates business incorporation, tax identification and compliance, licensing, sector-specific regulations, contractual frameworks with customers, suppliers, and employees, intellectual property protection, and governance structures.\n\nThe assessment found that the business has established foundational legal structures, including business registration. Areas such as comprehensive contract documentation, IP protection, and formal governance structures may require attention to meet investor due diligence requirements.\n\nLegal compliance is non-negotiable for investment-ready businesses. Investors conduct rigorous legal due diligence and will require clear evidence of compliance across all regulatory requirements, well-documented contracts, and appropriate governance structures.\n\nRecommendations include engaging a legal advisor to review and formalise all contractual arrangements, ensuring full tax compliance with supporting documentation, registering any intellectual property assets, and establishing a formal governance framework including board oversight mechanisms.`,
    riskAnalysis: {
      commercialRisks: `The primary commercial risks facing ${businessName} relate to market competition, customer concentration, and the pace of market development. With a commercial score of ${c("commercial")}%, there is potential vulnerability to competitive pressures that could impact revenue generation if not proactively managed through differentiation and customer loyalty strategies.\n\nDemand-side risks include dependency on a limited customer base and potential market saturation in core segments. These risks can be mitigated through customer diversification, geographic expansion, and continuous product/service innovation to maintain competitive relevance.\n\nMitigation strategies should include developing a formal competitive intelligence process, building long-term customer contracts to stabilise revenue, investing in brand development, and exploring adjacent market opportunities. Regular market assessment reviews are recommended to ensure the business adapts proactively to changing market dynamics.`,
      financialRisks: `Financial risks for ${businessName} centre on cash flow sustainability, working capital management, and the quality of financial information for investor decision-making. With a financial score of ${c("financial")}%, the business faces risks associated with financial management sophistication and the availability of accurate, timely financial data.\n\nCash flow risk is particularly significant as the business scales — growth often requires capital deployment before revenue is realised, creating potential liquidity gaps. Additionally, cost management discipline will be critical to maintaining healthy margins as operational complexity increases post-investment.\n\nMitigation strategies include implementing robust financial management systems, maintaining adequate cash reserves, establishing a cash flow monitoring process, securing appropriate credit facilities as a precautionary measure, and engaging financial expertise to strengthen reporting and forecasting capabilities.`,
      operationalRisks: `Operational risks for ${businessName} include capacity constraints, key-person dependency, process documentation gaps, and the scalability of current systems to support growth. With an operations score of ${c("operations")}%, the business may face challenges in maintaining quality and efficiency as scale increases.\n\nKey-person risk, where the business's performance is heavily dependent on the founder or a small number of key individuals, is common at this stage. This risk must be proactively managed through succession planning, delegation of authority, and knowledge management systems.\n\nMitigation involves documenting all critical processes, cross-training team members, implementing scalable operational systems, establishing quality management processes, and developing a human resources strategy that anticipates growth-stage staffing needs. Building operational resilience is essential before deploying significant investment capital.`,
      legalRegulatoryRisks: `Legal and regulatory risks for ${businessName} include compliance gaps, contractual exposure, and governance weaknesses. With a legal score of ${c("legal")}%, the business must prioritise closing any legal compliance gaps before entering into investment agreements, as outstanding compliance issues can delay or derail investment transactions.\n\nRegulatory risk in East African markets includes evolving tax legislation, sector-specific compliance requirements, and labour law compliance. Non-compliance in any of these areas creates financial liability and reputational risk that investors will seek to understand and mitigate.\n\nMitigation strategies include conducting a comprehensive legal compliance audit, ensuring all licences and permits are current, formalising all employment and supplier contracts, registering intellectual property, and establishing a legal monitoring process to stay current with regulatory changes. Engagement of qualified legal counsel is strongly recommended prior to any investor engagement.`,
    },
    roadmap: {
      immediate: `In the immediate 0–3 month period, ${businessName} should prioritise closing the most critical compliance and documentation gaps identified in this assessment. Priority actions include formalising financial records with accurate, up-to-date accounts, ensuring all business registrations and licences are current, and preparing a comprehensive investor information pack.\n\nAdditionally, the business should focus on documenting key operational processes and establishing basic performance measurement systems. These foundational actions will demonstrate seriousness to investors and provide the building blocks for the improvements required in subsequent phases.`,
      shortTerm: `Over the 3–9 month period, the focus should shift to strengthening commercial and operational systems. This includes implementing CRM systems, formalising the sales process, developing comprehensive customer and supplier contracts, and building the team's capacity through targeted training and professional development.\n\nFrom a financial perspective, this period should be used to implement monthly management accounting, develop a rolling 12-month cash flow forecast, and engage a financial advisor to prepare investor-grade financial projections. Legal structures should be fully consolidated during this period.`,
      mediumTerm: `The 9–18 month period should be focused on scaling the improvements made in earlier phases and preparing for active investor engagement. This includes establishing a formal governance structure, implementing advanced financial management systems, and building the market presence needed to demonstrate commercial traction to investors.\n\nBy the end of the 18-month roadmap period, the business should be in a position to present a compelling investment case with audited financials, documented systems, a clear growth strategy, and evidence of commercial momentum. Regular readiness re-assessments are recommended to track progress against this roadmap.`,
      projectedImprovement: `If the recommended actions are implemented across all three phases of the roadmap, ${businessName} is projected to achieve a Capital Readiness Score above the 70% investment readiness threshold. The most significant score improvements are anticipated in the Financial and Legal domains, where structured improvements to documentation and compliance will have the most immediate impact.\n\nCommercial and Operational improvements will take longer to demonstrate measurable impact but will be critical to sustaining investment readiness over time. The combined effect of these improvements will strengthen the business's overall investment proposition and increase confidence among potential investors.`,
    },
    conclusion: `${businessName} has demonstrated a commitment to capital readiness through its participation in this comprehensive assessment, achieving an overall score of ${overallScore}%. While ${overallScore >= 70 ? "the business meets the investment readiness threshold, continued focus on the identified improvement areas will strengthen the investment proposition further" : "the business has not yet reached the 70% investment readiness threshold, the assessment has clearly identified the priority areas that, when addressed, will unlock investment readiness within 18 months"}.\n\nThe most significant opportunities for improvement lie in the targeted actions outlined in the Readiness Improvement Roadmap. With focused execution on these recommendations — particularly in areas of financial management, legal compliance, operational documentation, and commercial strategy — the business has a clear path to presenting a compelling case to investors.\n\nIt is recommended that ${businessName} engages with the CRAT framework as an ongoing tool for monitoring progress, uses the domain-specific insights from this report to prioritise resource allocation, and considers engaging specialist advisors in finance, legal, and operations to accelerate progress. A follow-up assessment in 12 months is recommended to formally measure progress against this baseline and update the investment readiness profile.`,
  };
}

// ─── Main Export ──────────────────────────────────────────────────────────────

/**
 * Generate a Capital Readiness Assessment PDF using AI-generated content.
 *
 * @param {Object} data          - Domain data from Report.jsx state (commercial, financial, operations, legal)
 * @param {Object} scoreData     - Domain score percentages and statuses
 * @param {Object} userDetails   - User / business details from UserContext
 * @param {Function} [onStatus]  - Optional callback(message) for progress updates
 * @returns {Promise<{success: boolean, filename: string}>}
 */
export async function generateCapitalReadinessPDF(
  data,
  scoreData,
  userDetails,
  onStatus,
) {
  const { content } = await generateCapitalReadinessContent(
    data,
    scoreData,
    userDetails,
    onStatus,
  );

  onStatus?.("Building PDF...");
  const logoDataUrl = await fetchImageAsBase64("/logo.png");
  const filename = await buildPDF(content, scoreData, userDetails, logoDataUrl);
  onStatus?.("Done!");
  return { success: true, filename };
}
