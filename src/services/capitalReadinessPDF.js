import OpenAI from "openai";
import jsPDF from "jspdf";

// ─── OpenAI client ────────────────────────────────────────────────────────────
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.warn(
    "VITE_OPENAI_API_KEY is not set. AI content generation may fall back to static content.",
  );
}
const openai = OPENAI_API_KEY
  ? new OpenAI({ apiKey: OPENAI_API_KEY, dangerouslyAllowBrowser: true })
  : null;

// ─── Modern Capital Readiness PDF Generator ──────────────────────────────────

const COLORS = {
  navy: [15, 23, 42],
  blue: [37, 99, 235],
  indigo: [67, 56, 202],
  softBlue: [239, 246, 255],
  paleBlue: [248, 250, 252],
  green: [34, 197, 94],
  orange: [249, 115, 22],
  red: [239, 68, 68],
  gold: [234, 179, 8],
  slate: [71, 85, 105],
  muted: [100, 116, 139],
  border: [226, 232, 240],
  white: [255, 255, 255],
  black: [0, 0, 0],
};

const LAYOUT = {
  marginX: 16,
  topY: 24,
  footerY: 282,
  pageCount: 8,
  radius: 4,
  gap: 6,
};

function pageWidth(doc) {
  return doc.internal.pageSize.width;
}

function pageHeight(doc) {
  return doc.internal.pageSize.height;
}

function contentWidth(doc) {
  return pageWidth(doc) - LAYOUT.marginX * 2;
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Number(value || 0)));
}

function calcOverallScore(scoreData) {
  const vals = [
    scoreData?.commercial?.percentage || 0,
    scoreData?.financial?.percentage || 0,
    scoreData?.operations?.percentage || 0,
    scoreData?.legal?.percentage || 0,
  ];

  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

function getBusinessName(userDetails) {
  return (
    userDetails?.Business?.name ||
    userDetails?.Business?.businessName ||
    userDetails?.businessName ||
    userDetails?.name ||
    "Business"
  );
}

function getScoreColor(score) {
  const value = Number(score || 0);
  if (value >= 60) return COLORS.green;
  if (value >= 45) return COLORS.orange;
  return COLORS.red;
}

function getStatus(score) {
  const value = Number(score || 0);
  if (value >= 75) return "Ready";
  if (value >= 60) return "Partially Ready";
  return "Not Ready";
}

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

// ─── Layout Helpers ──────────────────────────────────────────────────────────

function drawPageHeader(doc, title, businessName, pageNumber) {
  const PW = pageWidth(doc);
  const PH = pageHeight(doc);

  doc.setFillColor(...COLORS.paleBlue);
  doc.rect(0, 0, PW, 18, "F");

  doc.setTextColor(...COLORS.navy);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text(title.toUpperCase(), LAYOUT.marginX, 12);

  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);
  doc.line(LAYOUT.marginX, PH - 14, PW - LAYOUT.marginX, PH - 14);

  doc.setTextColor(...COLORS.muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(
    `${businessName} — Capital Readiness Assessment Report`,
    LAYOUT.marginX,
    PH - 8,
  );
  doc.text(`${pageNumber} / ${LAYOUT.pageCount}`, PW - LAYOUT.marginX, PH - 8, {
    align: "right",
  });

  return LAYOUT.topY;
}

function drawCard(doc, x, y, width, height, options = {}) {
  const fill = options.fill || COLORS.white;
  const border = options.border || COLORS.border;

  doc.setFillColor(...fill);
  doc.roundedRect(x, y, width, height, LAYOUT.radius, LAYOUT.radius, "F");

  doc.setDrawColor(...border);
  doc.setLineWidth(0.35);
  doc.roundedRect(x, y, width, height, LAYOUT.radius, LAYOUT.radius, "S");

  if (options.accent) {
    doc.setFillColor(...options.accent);
    doc.roundedRect(x, y, 3, height, LAYOUT.radius, LAYOUT.radius, "F");
  }
}

function drawSectionTitle(doc, title, x, y, width) {
  doc.setFillColor(...COLORS.indigo);
  doc.roundedRect(x, y, width, 9, 2, 2, "F");

  doc.setTextColor(...COLORS.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text(title.toUpperCase(), x + 4, y + 6);

  return y + 14;
}

function drawWrappedText(doc, text, x, y, width, options = {}) {
  const fontSize = options.fontSize || 8.5;
  const lineHeight = options.lineHeight || 4.2;
  const color = options.color || COLORS.slate;
  const style = options.style || "normal";

  doc.setFont("helvetica", style);
  doc.setFontSize(fontSize);
  doc.setTextColor(...color);

  const lines = doc.splitTextToSize(String(text || ""), width);
  lines.forEach((line, index) => {
    doc.text(line, x, y + index * lineHeight);
  });

  return y + lines.length * lineHeight;
}

function textHeight(doc, text, width, lineHeight = 4.2) {
  return doc.splitTextToSize(String(text || ""), width).length * lineHeight;
}

function drawMetricCard(doc, x, y, width, label, value) {
  const color = getScoreColor(value);

  drawCard(doc, x, y, width, 25, {
    fill: COLORS.white,
    accent: color,
  });

  doc.setTextColor(...COLORS.muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);

  const labelLines = doc.splitTextToSize(label, width - 10);
  doc.text(labelLines.slice(0, 2), x + 7, y + 8);

  doc.setTextColor(...color);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(`${clamp(value)}%`, x + 7, y + 21);
}

function drawHorizontalBar(doc, x, y, width, label, value, options = {}) {
  const safeValue = clamp(value);
  const color = options.color || getScoreColor(safeValue);
  const labelWidth = options.labelWidth || 42;
  const barHeight = options.height || 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.slate);

  const labelText = doc.splitTextToSize(label, labelWidth - 3)[0];
  doc.text(labelText, x, y);

  const barX = x + labelWidth;

  doc.setFillColor(...COLORS.border);
  doc.roundedRect(barX, y - 4, width, barHeight, 2, 2, "F");

  doc.setFillColor(...color);
  doc.roundedRect(barX, y - 4, (safeValue / 100) * width, barHeight, 2, 2, "F");

  if (options.threshold !== false) {
    const thresholdX = barX + width * 0.7;
    doc.setDrawColor(...COLORS.gold);
    doc.setLineWidth(1);
    doc.line(thresholdX, y - 6, thresholdX, y + 3);
  }

  doc.setTextColor(...COLORS.slate);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(`${safeValue}%`, barX + width + 5, y);
}

function drawBulletList(doc, items, x, y, width, options = {}) {
  const fontSize = options.fontSize || 7.5;
  const lineHeight = options.lineHeight || 3.6;
  const bulletGap = 4;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(fontSize);
  doc.setTextColor(...(options.color || COLORS.slate));

  let cursorY = y;

  items.forEach((item) => {
    const lines = doc.splitTextToSize(String(item), width - bulletGap);
    doc.text("•", x, cursorY);
    lines.forEach((line) => {
      doc.text(line, x + bulletGap, cursorY);
      cursorY += lineHeight;
    });
    cursorY += 0.8;
  });

  return cursorY;
}

// ─── Chart Helpers ───────────────────────────────────────────────────────────

function drawRadarChart(doc, centerX, centerY, size, scores) {
  const values = [
    clamp(scores.commercial),
    clamp(scores.financial),
    clamp(scores.operations),
    clamp(scores.legal),
  ];

  const labels = ["Commercial", "Financial", "Operations", "Legal"];

  const points = [
    { x: centerX, y: centerY - size },
    { x: centerX + size, y: centerY },
    { x: centerX, y: centerY + size },
    { x: centerX - size, y: centerY },
  ];

  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.4);

  [0.25, 0.5, 0.75, 1].forEach((level) => {
    const r = size * level;
    doc.line(centerX, centerY - r, centerX + r, centerY);
    doc.line(centerX + r, centerY, centerX, centerY + r);
    doc.line(centerX, centerY + r, centerX - r, centerY);
    doc.line(centerX - r, centerY, centerX, centerY - r);
  });

  doc.setDrawColor(...COLORS.muted);
  doc.setLineWidth(0.5);
  points.forEach((p) => doc.line(centerX, centerY, p.x, p.y));

  const dataPoints = values.map((value, i) => ({
    x: centerX + (points[i].x - centerX) * (value / 100),
    y: centerY + (points[i].y - centerY) * (value / 100),
  }));

  if (dataPoints.length) {
    const lines = [];
    for (let i = 0; i < dataPoints.length; i++) {
      const next = dataPoints[(i + 1) % dataPoints.length];
      lines.push([next.x - dataPoints[i].x, next.y - dataPoints[i].y]);
    }

    doc.setFillColor(37, 99, 235, 0.18);
    doc.setDrawColor(...COLORS.blue);
    doc.setLineWidth(1.8);
    doc.lines(lines, dataPoints[0].x, dataPoints[0].y, null, "FD");

    doc.setFillColor(...COLORS.blue);
    dataPoints.forEach((p) => doc.circle(p.x, p.y, 2, "F"));
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.slate);
  doc.text(labels[0], centerX, centerY - size - 7, { align: "center" });
  doc.text(labels[1], centerX + size + 7, centerY + 2, { align: "left" });
  doc.text(labels[2], centerX, centerY + size + 9, { align: "center" });
  doc.text(labels[3], centerX - size - 7, centerY + 2, { align: "right" });
}

function drawGaugeChart(doc, centerX, centerY, radius, percentage, label) {
  const value = clamp(percentage);
  const startAngle = Math.PI;
  const endAngle = 2 * Math.PI;

  function arcSegment(color, a1, a2) {
    doc.setFillColor(...color);
    const segments = 24;
    const innerRadius = radius - 8;
    const step = (a2 - a1) / segments;

    for (let i = 0; i < segments; i++) {
      const p1 = a1 + i * step;
      const p2 = p1 + step;

      const x1 = centerX + innerRadius * Math.cos(p1);
      const y1 = centerY + innerRadius * Math.sin(p1);
      const x2 = centerX + radius * Math.cos(p1);
      const y2 = centerY + radius * Math.sin(p1);
      const x3 = centerX + radius * Math.cos(p2);
      const y3 = centerY + radius * Math.sin(p2);
      const x4 = centerX + innerRadius * Math.cos(p2);
      const y4 = centerY + innerRadius * Math.sin(p2);

      doc.lines(
        [
          [x2 - x1, y2 - y1],
          [x3 - x2, y3 - y2],
          [x4 - x3, y4 - y3],
          [x1 - x4, y1 - y4],
        ],
        x1,
        y1,
        null,
        "F",
      );
    }
  }

  arcSegment(COLORS.red, startAngle, startAngle + 0.4 * Math.PI);
  arcSegment(
    COLORS.orange,
    startAngle + 0.4 * Math.PI,
    startAngle + 0.7 * Math.PI,
  );
  arcSegment(COLORS.green, startAngle + 0.7 * Math.PI, endAngle);

  const needleAngle = startAngle + (value / 100) * Math.PI;
  const needleX = centerX + (radius - 5) * Math.cos(needleAngle);
  const needleY = centerY + (radius - 5) * Math.sin(needleAngle);

  doc.setDrawColor(...COLORS.navy);
  doc.setLineWidth(1.8);
  doc.line(centerX, centerY, needleX, needleY);

  doc.setFillColor(...COLORS.navy);
  doc.circle(centerX, centerY, 2.7, "F");

  doc.setTextColor(...getScoreColor(value));
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(`${value}%`, centerX, centerY + 16, { align: "center" });

  doc.setTextColor(...COLORS.muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(label, centerX, centerY + 24, { align: "center" });
}

function drawLineChart(doc, x, y, width, height, points, threshold = 70) {
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);

  for (let i = 0; i <= 4; i++) {
    const gridY = y + (i / 4) * height;
    doc.line(x, gridY, x + width, gridY);
  }

  points.forEach((_, i) => {
    const gridX = x + (i / (points.length - 1)) * width;
    doc.line(gridX, y, gridX, y + height);
  });

  const thresholdY = y + height - (threshold / 100) * height;
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(0.8);
  doc.setLineDash([2, 2]);
  doc.line(x, thresholdY, x + width, thresholdY);
  doc.setLineDash([]);

  doc.setDrawColor(...COLORS.blue);
  doc.setLineWidth(1.8);

  points.forEach((point, i) => {
    if (i >= points.length - 1) return;

    const x1 = x + (i / (points.length - 1)) * width;
    const y1 = y + height - (clamp(point.value) / 100) * height;
    const x2 = x + ((i + 1) / (points.length - 1)) * width;
    const y2 = y + height - (clamp(points[i + 1].value) / 100) * height;

    doc.line(x1, y1, x2, y2);
  });

  points.forEach((point, i) => {
    const px = x + (i / (points.length - 1)) * width;
    const py = y + height - (clamp(point.value) / 100) * height;

    doc.setFillColor(...COLORS.blue);
    doc.circle(px, py, 2.2, "F");

    doc.setTextColor(...COLORS.navy);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text(`${clamp(point.value)}%`, px, py - 4, { align: "center" });

    doc.setTextColor(...COLORS.slate);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(String(point.label), px, y + height + 6, { align: "center" });
  });
}

function drawStackedBar(doc, x, y, width, height, label, stacks) {
  let currentY = y + height;

  stacks.forEach((stack) => {
    const stackHeight = (clamp(stack.value) / 100) * height;
    currentY -= stackHeight;
    doc.setFillColor(...stack.color);
    doc.rect(x, currentY, width, stackHeight, "F");
  });

  doc.setDrawColor(...COLORS.border);
  doc.rect(x, y, width, height, "S");

  doc.setTextColor(...COLORS.slate);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(label, x + width / 2, y + height + 5, { align: "center" });
}

function extractSubDomains(domainData, key, limit = 5) {
  const rows = [];

  if (Array.isArray(domainData?.[key]?.summary)) {
    domainData[key].summary.slice(0, limit).forEach((item) => {
      rows.push({
        label: item.subDomain || item.name || "Unknown",
        value: Math.round(((item.score || 0) / 2) * 100),
      });
    });
  }

  while (rows.length < 4) rows.push({ label: "No data", value: 0 });
  return rows.slice(0, limit);
}

function drawSubDomainPanel(doc, x, y, width, title, rows) {
  const height = 74;

  drawCard(doc, x, y, width, height, { fill: COLORS.paleBlue });

  doc.setTextColor(...COLORS.navy);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text(title, x + 7, y + 10);

  let rowY = y + 22;

  rows.slice(0, 5).forEach((row) => {
    const value = clamp(row.value);
    const label = doc.splitTextToSize(row.label, 36)[0];

    doc.setTextColor(...COLORS.slate);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(label, x + 7, rowY);

    const barX = x + 44;
    const barW = width - 61;

    doc.setFillColor(...COLORS.border);
    doc.roundedRect(barX, rowY - 4, barW, 4.5, 2, 2, "F");

    doc.setFillColor(...getScoreColor(value));
    doc.roundedRect(barX, rowY - 4, (barW * value) / 100, 4.5, 2, 2, "F");

    doc.setTextColor(...COLORS.slate);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text(`${value}%`, x + width - 7, rowY, { align: "right" });

    rowY += 10;
  });

  return y + height + LAYOUT.gap;
}

// ─── Pages ───────────────────────────────────────────────────────────────────

function drawCoverPage(doc, businessName, overallScore, date, logoDataUrl) {
  const PW = pageWidth(doc);
  const PH = pageHeight(doc);

  doc.setFillColor(...COLORS.navy);
  doc.rect(0, 0, PW, PH, "F");

  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(0.4);
  for (let i = 0; i < 8; i++) {
    doc.circle(PW - 10, PH - 12, 35 + i * 18, "S");
  }

  if (logoDataUrl) {
    try {
      const img = doc.getImageProperties(logoDataUrl);
      const logoH = 13;
      const logoW = (img.width / img.height) * logoH;
      doc.addImage(
        logoDataUrl,
        "PNG",
        PW - LAYOUT.marginX - logoW,
        14,
        logoW,
        logoH,
      );
    } catch {
      doc.setTextColor(...COLORS.white);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("anza", PW - LAYOUT.marginX, 24, { align: "right" });
    }
  }

  doc.setTextColor(191, 219, 254);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("CAPITAL READINESS ASSESSMENT", LAYOUT.marginX, 56);

  doc.setTextColor(...COLORS.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(29);

  const nameLines = doc.splitTextToSize(businessName, PW - 45);
  let y = 75;

  nameLines.slice(0, 4).forEach((line) => {
    doc.text(line, LAYOUT.marginX, y);
    y += 13;
  });

  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.setTextColor(226, 232, 240);
  doc.text("Investment Readiness Report", LAYOUT.marginX, y);

  y += 22;

  drawCard(doc, LAYOUT.marginX, y, 76, 35, {
    fill: COLORS.white,
    border: COLORS.white,
  });

  doc.setTextColor(...COLORS.muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Overall Readiness Score", LAYOUT.marginX + 7, y + 10);

  doc.setTextColor(...getScoreColor(overallScore));
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text(`${overallScore}%`, LAYOUT.marginX + 7, y + 28);

  doc.setTextColor(203, 213, 225);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(date, LAYOUT.marginX, PH - 22);

  doc.setFontSize(7);
  doc.text(
    `${businessName} — Capital Readiness Assessment Report`,
    PW / 2,
    PH - 10,
    {
      align: "center",
    },
  );
}

function drawExecutiveSummary(doc, businessName, scoreData, overallScore) {
  let y = drawPageHeader(doc, "Executive Summary", businessName, 2);
  const x = LAYOUT.marginX;
  const w = contentWidth(doc);

  const metrics = [
    ["Overall Score", overallScore],
    ["Commercial / Market", scoreData?.commercial?.percentage || 0],
    ["Financial", scoreData?.financial?.percentage || 0],
    ["Operations", scoreData?.operations?.percentage || 0],
    ["Legal & Compliance", scoreData?.legal?.percentage || 0],
  ];

  const gap = 4;
  const cardW = (w - gap * 4) / 5;

  metrics.forEach(([label, value], i) => {
    drawMetricCard(doc, x + i * (cardW + gap), y, cardW, label, value);
  });

  y += 35;
  y = drawSectionTitle(
    doc,
    "Domain Scores vs. 70% Investment Readiness Threshold",
    x,
    y,
    w,
  );

  drawCard(doc, x, y, w, 60, { fill: COLORS.paleBlue });

  const bars = [
    ["Commercial", scoreData?.commercial?.percentage || 0],
    ["Financial", scoreData?.financial?.percentage || 0],
    ["Operations", scoreData?.operations?.percentage || 0],
    ["Legal & Compliance", scoreData?.legal?.percentage || 0],
    ["Overall", overallScore],
  ];

  let barY = y + 14;
  bars.forEach(([label, value]) => {
    drawHorizontalBar(doc, x + 8, barY, 92, label, value, {
      color: label === "Overall" ? COLORS.blue : getScoreColor(value),
    });
    barY += 9;
  });

  y += 72;
  y = drawSectionTitle(doc, "Readiness Profile Radar", x, y, w);

  drawCard(doc, x, y, w, 74, { fill: COLORS.white });
  drawRadarChart(doc, x + w / 2, y + 36, 23, {
    commercial: scoreData?.commercial?.percentage || 0,
    financial: scoreData?.financial?.percentage || 0,
    operations: scoreData?.operations?.percentage || 0,
    legal: scoreData?.legal?.percentage || 0,
  });

  y += 84;

  const summaryText = `${businessName} achieved an overall Capital Readiness Score of ${overallScore}%, ${
    overallScore >= 70 ? "meeting" : "remaining below"
  } the 70% investment readiness threshold. The assessment shows Commercial at ${
    scoreData?.commercial?.percentage || 0
  }%, Financial at ${scoreData?.financial?.percentage || 0}%, Operations at ${
    scoreData?.operations?.percentage || 0
  }%, and Legal & Compliance at ${
    scoreData?.legal?.percentage || 0
  }%. The priority is to close the highest-risk capability gaps through a structured 18-month improvement roadmap.`;

  const h = textHeight(doc, summaryText, w - 16) + 16;
  drawCard(doc, x, y, w, h, {
    fill: COLORS.paleBlue,
    accent: COLORS.blue,
  });

  drawWrappedText(doc, summaryText, x + 8, y + 10, w - 16, {
    fontSize: 8.5,
    lineHeight: 4.2,
  });
}

function drawOverallReadinessPage(
  doc,
  businessName,
  scoreData,
  overallScore,
  domainData,
) {
  let y = drawPageHeader(doc, "Overall Readiness Score", businessName, 3);
  const x = LAYOUT.marginX;
  const w = contentWidth(doc);
  const colGap = 8;
  const colW = (w - colGap) / 2;

  drawCard(doc, x, y, colW, 88, { fill: COLORS.white });
  drawWrappedText(doc, "Capital Readiness Gauge", x + 8, y + 10, colW - 16, {
    style: "bold",
    color: COLORS.navy,
  });
  drawGaugeChart(
    doc,
    x + colW / 2,
    y + 49,
    28,
    overallScore,
    getStatus(overallScore),
  );

  drawCard(doc, x + colW + colGap, y, colW, 88, { fill: COLORS.white });
  drawWrappedText(
    doc,
    "Domain Comparison",
    x + colW + colGap + 8,
    y + 10,
    colW - 16,
    {
      style: "bold",
      color: COLORS.navy,
    },
  );

  let barY = y + 28;
  [
    ["Commercial", scoreData?.commercial?.percentage || 0],
    ["Financial", scoreData?.financial?.percentage || 0],
    ["Operations", scoreData?.operations?.percentage || 0],
    ["Legal", scoreData?.legal?.percentage || 0],
  ].forEach(([label, value]) => {
    drawHorizontalBar(doc, x + colW + colGap + 8, barY, 40, label, value, {
      labelWidth: 36,
    });
    barY += 13;
  });

  y += 100;
  y = drawSectionTitle(doc, "Sub-Domain Breakdown", x, y, w);

  const yStart = y;
  drawSubDomainPanel(
    doc,
    x,
    yStart,
    colW,
    "Commercial / Market",
    extractSubDomains(domainData, "commercial"),
  );
  drawSubDomainPanel(
    doc,
    x + colW + colGap,
    yStart,
    colW,
    "Financial",
    extractSubDomains(domainData, "financial"),
  );

  y = yStart + 84;

  const insightText =
    "Sub-domain results identify the operating capabilities most likely to influence due diligence outcomes. Weak commercial systems typically reduce investor confidence in revenue predictability, while weak financial systems limit visibility into cash flow, margins, and scalability.";

  drawCard(doc, x, y, w, 38, { fill: COLORS.paleBlue, accent: COLORS.indigo });
  drawWrappedText(doc, insightText, x + 8, y + 10, w - 16);
}

function drawProjectionsPage(
  doc,
  businessName,
  scoreData,
  overallScore,
  domainData,
) {
  let y = drawPageHeader(
    doc,
    "Operations, Legal & Score Projection",
    businessName,
    4,
  );
  const x = LAYOUT.marginX;
  const w = contentWidth(doc);
  const colGap = 8;
  const colW = (w - colGap) / 2;

  const yStart = y;
  drawSubDomainPanel(
    doc,
    x,
    yStart,
    colW,
    "Operations",
    extractSubDomains(domainData, "operations"),
  );
  drawSubDomainPanel(
    doc,
    x + colW + colGap,
    yStart,
    colW,
    "Legal & Compliance",
    extractSubDomains(domainData, "legal"),
  );

  y = yStart + 86;
  y = drawSectionTitle(doc, "18-Month Score Projection", x, y, w);

  drawCard(doc, x, y, w, 70, { fill: COLORS.white });

  const points = [
    { label: "Now", value: overallScore },
    { label: "3 mo", value: Math.min(overallScore + 12, 100) },
    { label: "9 mo", value: Math.min(overallScore + 24, 100) },
    { label: "18 mo", value: Math.min(overallScore + 39, 100) },
  ];

  drawLineChart(doc, x + 18, y + 14, w - 36, 38, points, 70);

  y += 82;
  y = drawSectionTitle(doc, "Domain Improvement Projection by Phase", x, y, w);

  drawCard(doc, x, y, w, 70, { fill: COLORS.paleBlue });

  const domains = [
    ["Commercial", scoreData?.commercial?.percentage || 0],
    ["Financial", scoreData?.financial?.percentage || 0],
    ["Operations", scoreData?.operations?.percentage || 0],
    ["Legal", scoreData?.legal?.percentage || 0],
  ];

  let stackX = x + 28;
  domains.forEach(([label, current]) => {
    const three = Math.max(0, Math.min(10, 70 - current));
    const nine = Math.max(0, Math.min(15, 80 - current - three));
    const eighteen = Math.max(0, Math.min(18, 90 - current - three - nine));

    drawStackedBar(doc, stackX, y + 12, 24, 40, label, [
      { value: current, color: COLORS.blue },
      { value: three, color: COLORS.orange },
      { value: nine, color: COLORS.gold },
      { value: eighteen, color: COLORS.green },
    ]);

    stackX += 38;
  });
}

function drawRiskAnalysisPage(doc, businessName, scoreData, overallScore) {
  let y = drawPageHeader(
    doc,
    "Key Thematic Gaps & Risk Analysis",
    businessName,
    5,
  );
  const x = LAYOUT.marginX;
  const w = contentWidth(doc);
  const gap = 6;
  const boxW = (w - gap) / 2;

  const gaps = [
    {
      title: "Commercial / Market",
      score: scoreData?.commercial?.percentage || 0,
      items: [
        "Sales process and revenue pipeline need stronger structure.",
        "Market positioning and competitor intelligence should be documented.",
        "Customer retention and acquisition channels need measurable controls.",
      ],
    },
    {
      title: "Financial Management",
      score: scoreData?.financial?.percentage || 0,
      items: [
        "Cash flow forecasting should be formalised.",
        "Investor-grade financial records should be prepared.",
        "Accounting systems and projections need stronger controls.",
      ],
    },
    {
      title: "Operations",
      score: scoreData?.operations?.percentage || 0,
      items: [
        "Core processes should be documented.",
        "Key-person dependency should be reduced.",
        "KPIs should be linked to performance management.",
      ],
    },
    {
      title: "Legal & Compliance",
      score: scoreData?.legal?.percentage || 0,
      items: [
        "Licences, permits, contracts, and governance records should be reviewed.",
        "Compliance gaps may delay investor due diligence.",
        "IP and formal oversight structures should be strengthened.",
      ],
    },
  ];

  gaps.forEach((gapItem, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const gx = x + col * (boxW + gap);
    const gy = y + row * 62;

    drawCard(doc, gx, gy, boxW, 56, {
      fill: COLORS.white,
      accent: getScoreColor(gapItem.score),
    });

    doc.setTextColor(...COLORS.navy);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text(`${gapItem.title} — ${clamp(gapItem.score)}%`, gx + 7, gy + 10);

    drawBulletList(doc, gapItem.items, gx + 7, gy + 19, boxW - 13, {
      fontSize: 7.2,
      lineHeight: 3.5,
    });
  });

  y += 130;
  y = drawSectionTitle(doc, "Consolidated Risk Analysis", x, y, w);

  drawCard(doc, x, y, w, 74, { fill: COLORS.paleBlue });

  const riskText = `The consolidated risk profile indicates that ${businessName} should prioritise investment-readiness controls that directly affect due diligence: revenue predictability, financial transparency, operational resilience, and legal compliance. The current overall score of ${overallScore}% means the business should sequence corrective action by impact and investor relevance.`;

  drawWrappedText(doc, riskText, x + 8, y + 12, w - 16);
}

function drawRoadmapPage(doc, businessName, overallScore) {
  let y = drawPageHeader(doc, "Readiness Improvement Roadmap", businessName, 6);
  const x = LAYOUT.marginX;
  const w = contentWidth(doc);

  y = drawSectionTitle(doc, "Projected Score Trajectory", x, y, w);

  drawCard(doc, x, y, w, 58, { fill: COLORS.white });

  drawLineChart(
    doc,
    x + 18,
    y + 12,
    w - 36,
    30,
    [
      { label: "Now", value: overallScore },
      { label: "3 mo", value: Math.min(overallScore + 12, 100) },
      { label: "9 mo", value: Math.min(overallScore + 24, 100) },
      { label: "18 mo", value: Math.min(overallScore + 39, 100) },
    ],
    70,
  );

  y += 70;
  y = drawSectionTitle(doc, "Implementation Phases", x, y, w);

  const phaseGap = 5;
  const phaseW = (w - phaseGap * 2) / 3;

  const phases = [
    {
      title: "0–3 Months",
      subtitle: "Immediate Stabilisation",
      fill: [254, 242, 242],
      items: [
        "Formalise financial records.",
        "Confirm licences and permits.",
        "Document core processes.",
        "Prepare investor information pack.",
        "Set up basic sales tracking.",
      ],
    },
    {
      title: "3–9 Months",
      subtitle: "Control Building",
      fill: [255, 251, 235],
      items: [
        "Implement accounting software.",
        "Build rolling cash-flow forecast.",
        "Formalise contracts.",
        "Implement CRM pipeline tracking.",
        "Launch structured team training.",
      ],
    },
    {
      title: "9–18 Months",
      subtitle: "Investor Readiness",
      fill: [240, 253, 244],
      items: [
        "Establish governance structure.",
        "Register IP assets.",
        "Prepare audited financials.",
        "Strengthen commercial traction.",
        "Reassess against 70%+ target.",
      ],
    },
  ];

  phases.forEach((phase, i) => {
    const px = x + i * (phaseW + phaseGap);

    drawCard(doc, px, y, phaseW, 72, { fill: phase.fill });

    doc.setTextColor(...COLORS.navy);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(phase.title, px + 7, y + 10);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.muted);
    doc.text(phase.subtitle, px + 7, y + 15);

    drawBulletList(doc, phase.items, px + 7, y + 25, phaseW - 13, {
      fontSize: 6.8,
      lineHeight: 3.3,
    });
  });

  y += 84;
  y = drawSectionTitle(doc, "Conclusion & Recommendations", x, y, w);

  const conclusion = `${businessName} has demonstrated commitment to capital readiness through participation in this assessment, achieving an overall score of ${overallScore}%. The most important opportunities are financial management, legal compliance, operational documentation, and commercial strategy development. Recommended next steps include using the CRAT framework as an ongoing monitoring tool, prioritising domain-specific gaps, engaging specialist advisors, and scheduling a follow-up assessment within 12 months.`;

  const h = textHeight(doc, conclusion, w - 16) + 16;
  drawCard(doc, x, y, w, h, { fill: COLORS.paleBlue, accent: COLORS.indigo });
  drawWrappedText(doc, conclusion, x + 8, y + 10, w - 16);
}

function calculateBusinessModelMetrics(domainData) {
  const commercial = extractSubDomains(domainData, "commercial");
  const financial = extractSubDomains(domainData, "financial");
  const operations = extractSubDomains(domainData, "operations");

  const avg = (rows) =>
    rows.length
      ? Math.round(
          rows.reduce((sum, r) => sum + clamp(r.value), 0) / rows.length,
        )
      : 0;

  const commercialAvg = avg(commercial);
  const financialAvg = avg(financial);
  const operationsAvg = avg(operations);

  return [
    ["Revenue Diversity", commercialAvg],
    ["Value Proposition", commercialAvg],
    ["Competitive Position", commercialAvg],
    ["Scalability", operationsAvg],
    ["Unit Economics", financialAvg],
  ];
}

function drawBusinessModelPage(doc, businessName, domainData) {
  let y = drawPageHeader(doc, "Business Model Viability", businessName, 7);
  const x = LAYOUT.marginX;
  const w = contentWidth(doc);

  const metrics = calculateBusinessModelMetrics(domainData);

  y = drawSectionTitle(doc, "Business Model Viability Scorecard", x, y, w);

  drawCard(doc, x, y, w, 76, { fill: COLORS.white });

  let rowY = y + 16;
  metrics.forEach(([label, value]) => {
    drawHorizontalBar(doc, x + 10, rowY, 100, label, value, {
      labelWidth: 52,
    });
    rowY += 11;
  });

  y += 88;
  y = drawSectionTitle(doc, "Interpretive Insight", x, y, w);

  const insight = `${businessName}'s business model viability depends on strengthening the connection between revenue quality, operating capacity, and financial visibility. Investors typically look for evidence that demand is repeatable, margins are understood, and the operating model can scale without disproportionate execution risk.`;

  const h = textHeight(doc, insight, w - 16) + 16;
  drawCard(doc, x, y, w, h, { fill: COLORS.paleBlue, accent: COLORS.blue });
  drawWrappedText(doc, insight, x + 8, y + 10, w - 16);

  y += h + 10;
  y = drawSectionTitle(doc, "Governance Lens", x, y, w);

  const governanceItems = [
    "Document decision rights and escalation paths.",
    "Track strategic KPIs monthly.",
    "Maintain investor-ready financial and compliance records.",
    "Create accountability for roadmap execution.",
  ];

  drawCard(doc, x, y, w, 54, { fill: COLORS.white });
  drawBulletList(doc, governanceItems, x + 8, y + 14, w - 16);
}

function drawPrioritizationPage(doc, businessName) {
  let y = drawPageHeader(doc, "Prioritisation Matrix", businessName, 8);
  const x = LAYOUT.marginX;
  const w = contentWidth(doc);

  const intro = `Quick wins are high-impact actions requiring fewer resources. Bold plays require more effort but deliver greater capital readiness gains and should be sequenced into the 3–18 month programme.`;

  drawCard(doc, x, y, w, 30, { fill: COLORS.paleBlue, accent: COLORS.gold });
  drawWrappedText(doc, intro, x + 8, y + 10, w - 16);

  y += 42;
  y = drawSectionTitle(doc, "Impact vs. Ease of Implementation", x, y, w);

  const matrixX = x + 12;
  const matrixY = y + 8;
  const matrixW = w - 24;
  const matrixH = 92;

  drawCard(doc, x, y, w, 112, { fill: COLORS.white });

  doc.setFillColor(254, 242, 242);
  doc.rect(matrixX, matrixY, matrixW / 2, matrixH / 2, "F");

  doc.setFillColor(255, 251, 235);
  doc.rect(matrixX + matrixW / 2, matrixY, matrixW / 2, matrixH / 2, "F");

  doc.setFillColor(239, 246, 255);
  doc.rect(matrixX, matrixY + matrixH / 2, matrixW / 2, matrixH / 2, "F");

  doc.setFillColor(240, 253, 244);
  doc.rect(
    matrixX + matrixW / 2,
    matrixY + matrixH / 2,
    matrixW / 2,
    matrixH / 2,
    "F",
  );

  doc.setDrawColor(...COLORS.border);
  doc.rect(matrixX, matrixY, matrixW, matrixH, "S");
  doc.line(
    matrixX + matrixW / 2,
    matrixY,
    matrixX + matrixW / 2,
    matrixY + matrixH,
  );
  doc.line(
    matrixX,
    matrixY + matrixH / 2,
    matrixX + matrixW,
    matrixY + matrixH / 2,
  );

  doc.setTextColor(...COLORS.navy);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("Bold Plays", matrixX + matrixW * 0.25, matrixY + 10, {
    align: "center",
  });
  doc.text("Strategic Bets", matrixX + matrixW * 0.75, matrixY + 10, {
    align: "center",
  });
  doc.text("Low Priority", matrixX + matrixW * 0.25, matrixY + matrixH - 8, {
    align: "center",
  });
  doc.text("Quick Wins", matrixX + matrixW * 0.75, matrixY + matrixH - 8, {
    align: "center",
  });

  const initiatives = [
    { label: "Financial records", x: 0.78, y: 0.78, color: COLORS.green },
    { label: "Licences review", x: 0.72, y: 0.7, color: COLORS.green },
    { label: "CRM pipeline", x: 0.62, y: 0.6, color: COLORS.orange },
    { label: "Governance board", x: 0.35, y: 0.75, color: COLORS.blue },
    { label: "Audited accounts", x: 0.38, y: 0.65, color: COLORS.indigo },
  ];

  initiatives.forEach((item) => {
    const px = matrixX + item.x * matrixW;
    const py = matrixY + matrixH - item.y * matrixH;

    doc.setFillColor(...item.color);
    doc.circle(px, py, 3, "F");

    doc.setTextColor(...COLORS.slate);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.text(item.label, px + 4, py + 1.5);
  });

  doc.setTextColor(...COLORS.muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(
    "Ease of implementation →",
    matrixX + matrixW / 2,
    matrixY + matrixH + 8,
    {
      align: "center",
    },
  );
  doc.text("Impact →", matrixX - 5, matrixY + matrixH / 2, {
    align: "center",
    angle: 90,
  });

  y += 126;
  y = drawSectionTitle(doc, "Recommended Sequencing", x, y, w);

  const sequence = [
    "Start with quick wins: records, licences, process documentation, and investor pack.",
    "Move to control building: accounting system, CRM, contracts, and cash-flow forecasting.",
    "Complete bold plays: audited accounts, governance structure, IP protection, and investor-grade reporting.",
  ];

  drawCard(doc, x, y, w, 46, { fill: COLORS.paleBlue, accent: COLORS.indigo });
  drawBulletList(doc, sequence, x + 8, y + 13, w - 16);
}

// ─── Main PDF Builder ────────────────────────────────────────────────────────

async function buildPDF(domainData, scoreData, userDetails, logoDataUrl) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const businessName = getBusinessName(userDetails);
  const overallScore = calcOverallScore(scoreData);

  const date = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  drawCoverPage(doc, businessName, overallScore, date, logoDataUrl);

  doc.addPage();
  drawExecutiveSummary(doc, businessName, scoreData, overallScore);

  doc.addPage();
  drawOverallReadinessPage(
    doc,
    businessName,
    scoreData,
    overallScore,
    domainData,
  );

  doc.addPage();
  drawProjectionsPage(doc, businessName, scoreData, overallScore, domainData);

  doc.addPage();
  drawRiskAnalysisPage(doc, businessName, scoreData, overallScore);

  doc.addPage();
  drawRoadmapPage(doc, businessName, overallScore);

  doc.addPage();
  drawBusinessModelPage(doc, businessName, domainData);

  doc.addPage();
  drawPrioritizationPage(doc, businessName);

  const safeTitle = businessName
    .replace(/[^a-zA-Z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");

  const filename = `Capital_Readiness_Report_${safeTitle}_${Date.now()}.pdf`;
  doc.save(filename);

  return filename;
}

// ─── AI Content Generation ──────────────────────────────────────────────────

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

COMMERCIAL DATA: ${JSON.stringify(commercialItems)}
FINANCIAL DATA: ${JSON.stringify(financialItems)}
OPERATIONS DATA: ${JSON.stringify(operationsItems)}
LEGAL DATA: ${JSON.stringify(legalItems)}

Generate a JSON object with EXACTLY this structure (no markdown, no code fences — ONLY raw JSON):
{
  "executiveSummary": "<3 paragraphs>",
  "background": { "purpose": "<2 paragraphs>", "definition": "<2 paragraphs>", "scopeAndMethodology": "<2 paragraphs>" },
  "companyOverview": "<3 paragraphs>",
  "assessmentOutcome": { "overallScore": "<2 paragraphs>", "domainScores": "<2 paragraphs>", "scoringMethodology": "<2 paragraphs>", "thresholdCriteria": "<2 paragraphs>" },
  "marketAssessment": "<4 paragraphs>",
  "financialAssessment": "<4 paragraphs>",
  "operationsAssessment": "<4 paragraphs>",
  "legalAssessment": "<4 paragraphs>",
  "riskAnalysis": { "commercialRisks": "<3 paragraphs>", "financialRisks": "<3 paragraphs>", "operationalRisks": "<3 paragraphs>", "legalRegulatoryRisks": "<3 paragraphs>" },
  "roadmap": { "immediate": "<2 paragraphs>", "shortTerm": "<2 paragraphs>", "mediumTerm": "<2 paragraphs>", "projectedImprovement": "<2 paragraphs>" },
  "conclusion": "<3 paragraphs>"
}

Return ONLY valid JSON. Base ALL content on the actual scores provided. Name the business as \"${businessName}\" in the narrative.`;
}

function buildFallbackContent(scoreData, userDetails) {
  const businessName = getBusinessName(userDetails);
  const overallScore = calcOverallScore(scoreData);
  const c = (k) => scoreData?.[k]?.percentage || 0;
  return {
    executiveSummary: `${businessName} has undergone a comprehensive Capital Readiness Assessment covering four key domains. The overall score of ${overallScore}% ${overallScore >= 70 ? "indicates investment readiness" : "indicates areas requiring improvement before full investment readiness"}.\n\nScores: Commercial ${c("commercial")}%, Financial ${c("financial")}%, Operations ${c("operations")}%, Legal ${c("legal")}%.\n\nTargeted improvements across identified gap areas have the potential to significantly enhance investment readiness within an 18-month roadmap.`,
    background: {
      purpose: `This Capital Readiness Assessment evaluates ${businessName}'s preparedness to attract, receive, and effectively deploy external investment capital across four critical dimensions.\n\nThe primary purpose is to identify strengths and gaps, enabling the business to present a compelling case to potential investors.`,
      definition: `Capital readiness refers to the degree to which a business has established the systems, processes, governance structures, and commercial foundations necessary to attract and deploy investment.\n\nFor ${businessName}, achieving capital readiness means building investor confidence through transparent financial management, robust operations, and legal compliance.`,
      scopeAndMethodology: `This assessment covers Commercial/Market, Financial, Operations, and Legal & Compliance domains. Each sub-domain is scored 0–2 and aggregated to domain percentages.\n\nThe 70% threshold represents investment readiness based on East African market best practices.`,
    },
    companyOverview: `${businessName} is a business seeking capital readiness certification through this structured assessment framework.\n\nThe assessment identified specific strengths and improvement areas across all four domains.\n\nThe business has demonstrated commitment to the assessment process and willingness to address identified gaps.`,
    assessmentOutcome: {
      overallScore: `${businessName} achieved an overall score of ${overallScore}%, which ${overallScore >= 70 ? "meets" : "falls below"} the 70% investment readiness threshold.\n\nThis score represents an average across four domains and investors should review individual domain scores for detailed insights.`,
      domainScores: `Domain scores: Commercial ${c("commercial")}%, Financial ${c("financial")}%, Operations ${c("operations")}%, Legal ${c("legal")}%.\n\nVariation across domains highlights areas of strength and those requiring focused improvement.`,
      scoringMethodology: `Each sub-domain is evaluated on a 0–2 scale: 0 (not met), 1 (partial), 2 (full compliance). Scores are aggregated to domain percentages.\n\nThis methodology ensures consistency and objectivity across assessments.`,
      thresholdCriteria: `The 70% threshold is based on investment best practices for East African markets. Businesses above 70% demonstrate sufficient foundations to manage investment capital responsibly.\n\nBusinesses below 70% are advised to address identified gaps before investor engagement.`,
    },
    marketAssessment: `Commercial score of ${c("commercial")}% reflects current market position and commercial capabilities.\n\nKey evaluation areas include market demand, competitive positioning, sales performance, and marketing effectiveness.\n\nRecommendations include formalising the sales process, investing in marketing strategy, and strengthening customer relationship management.\n\nRegular market assessment reviews are recommended to ensure the business adapts proactively to changing conditions.`,
    financialAssessment: `Financial score of ${c("financial")}% reflects current financial management capabilities.\n\nEvaluation covers revenue generation, cost management, cash flow, and financial record quality.\n\nRecommendations include implementing accounting software, preparing monthly management accounts, and developing a 12-month cash flow forecast.\n\nEngaging a qualified accountant to audit financial records prior to investor engagement is strongly advised.`,
    operationsAssessment: `Operations score of ${c("operations")}% captures operational maturity across management, systems, and quality control.\n\nThe business has functional operational systems supporting its current scale.\n\nRecommendations include documenting key processes, implementing performance KPIs, and upgrading data management systems.\n\nBuilding operational resilience is essential before deploying significant investment capital.`,
    legalAssessment: `Legal score of ${c("legal")}% reflects legal standing and governance framework.\n\nEvaluation covers incorporation, licensing, contracts, IP, and governance structures.\n\nRecommendations include engaging a legal advisor, ensuring full tax compliance, registering IP assets, and establishing a formal governance framework.\n\nEngagement of qualified legal counsel is strongly recommended prior to any investor engagement.`,
    riskAnalysis: {
      commercialRisks: `Primary commercial risks relate to market competition, customer concentration, and pace of market development.\n\nMitigation strategies include customer diversification, geographic expansion, and continuous product/service innovation.\n\nRegular competitive intelligence reviews and long-term customer contracts are recommended.`,
      financialRisks: `Financial risks centre on cash flow sustainability, working capital management, and quality of financial information.\n\nCash flow risk is particularly significant as the business scales toward investment.\n\nMitigation includes implementing robust financial management systems, maintaining cash reserves, and securing appropriate credit facilities.`,
      operationalRisks: `Operational risks include capacity constraints, key-person dependency, and scalability of current systems.\n\nKey-person risk must be proactively managed through succession planning and knowledge management systems.\n\nDocumenting critical processes and cross-training team members are priority mitigation actions.`,
      legalRegulatoryRisks: `Legal risks include compliance gaps, contractual exposure, and governance weaknesses.\n\nRegulatory risk includes evolving tax legislation and sector-specific compliance requirements.\n\nA comprehensive legal compliance audit and engagement of qualified legal counsel are strongly recommended.`,
    },
    roadmap: {
      immediate: `In the 0–3 month period, ${businessName} should prioritise closing critical compliance and documentation gaps.\n\nPriority actions include formalising financial records, ensuring all licences are current, and preparing an investor information pack.`,
      shortTerm: `Over 3–9 months, focus on strengthening commercial and operational systems including CRM, formalised sales processes, and comprehensive contracts.\n\nFinancially, implement monthly management accounting and develop investor-grade financial projections.`,
      mediumTerm: `The 9–18 month period should focus on scaling improvements and preparing for active investor engagement.\n\nBy end of the roadmap, the business should present audited financials, documented systems, and evidence of commercial traction.`,
      projectedImprovement: `If recommended actions are implemented, ${businessName} is projected to achieve a Capital Readiness Score above the 70% threshold.\n\nThe most significant improvements are anticipated in Financial and Legal domains through structured documentation and compliance improvements.`,
    },
    conclusion: `${businessName} has demonstrated commitment to capital readiness through this assessment, achieving ${overallScore}%.\n\nThe roadmap provides a clear path to investor readiness through targeted improvements in financial management, legal compliance, operational documentation, and commercial strategy.\n\nA follow-up assessment in 12 months is recommended to measure progress and update the investment readiness profile.`,
  };
}

/**
 * Generate the structured Capital Readiness report content using AI.
 * Returns the same JSON object used to build the PDF.
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
    if (!openai) {
      throw new Error("Missing VITE_OPENAI_API_KEY");
    }

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

    const cleaned = raw
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();

    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI did not return valid JSON");

    content = JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.warn(
      "AI report generation failed, using fallback content:",
      err.message,
    );
    onStatus?.("AI unavailable — generating report with assessment data...");
    content = buildFallbackContent(scoreData, userDetails);
  }

  return { success: true, content };
}

// ─── Main Export ─────────────────────────────────────────────────────────────

export async function generateCapitalReadinessPDF(
  data,
  scoreData,
  userDetails,
  onStatus,
) {
  if (!scoreData || typeof scoreData !== "object") {
    throw new Error("Invalid scoreData: must be an object with domain scores");
  }

  if (!userDetails || typeof userDetails !== "object") {
    throw new Error(
      "Invalid userDetails: must be an object with business information",
    );
  }

  const domains = ["commercial", "financial", "operations", "legal"];
  const hasValidDomain = domains.some(
    (domain) =>
      scoreData[domain] &&
      typeof scoreData[domain].percentage === "number" &&
      !Number.isNaN(scoreData[domain].percentage),
  );

  if (!hasValidDomain) {
    throw new Error(
      "Invalid scoreData: must contain at least one domain with a valid percentage score",
    );
  }

  onStatus?.("Preparing PDF report...");

  const logoDataUrl = await fetchImageAsBase64("/logo.png");

  onStatus?.("Building PDF...");
  const filename = await buildPDF(data, scoreData, userDetails, logoDataUrl);

  onStatus?.("Done!");
  return { success: true, filename };
}
