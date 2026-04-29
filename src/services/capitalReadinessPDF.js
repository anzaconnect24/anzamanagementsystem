import OpenAI from "openai";
import jsPDF from "jspdf";

// ─── OpenAI client ────────────────────────────────────────────────────────────
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.warn("VITE_OPENAI_API_KEY is not set. PDF AI generation may fail.");
}

const openai = OPENAI_API_KEY
  ? new OpenAI({
      apiKey: OPENAI_API_KEY,
      dangerouslyAllowBrowser: true,
    })
  : null;

// ─── Color Palette ────────────────────────────────────────────────────────────
const COLORS = {
  darkBlue: [22, 42, 92],
  lightBlue: [240, 242, 250],
  gold: [244, 220, 44],
  green: [39, 174, 96],
  orange: [244, 147, 66],
  red: [239, 68, 68],
  gray: [107, 114, 128],
  lightGray: [229, 231, 235],
  darkGray: [75, 85, 99],
  white: [255, 255, 255],
  black: [0, 0, 0],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  const name =
    userDetails?.Business?.name ||
    userDetails?.Business?.businessName ||
    userDetails?.businessName ||
    "Business";
  return name;
}

/** Get color based on score */
function getScoreColor(score) {
  if (score >= 60) return COLORS.green;
  if (score >= 45) return COLORS.orange;
  return COLORS.red;
}

/** Get status text based on score */
function getStatus(score) {
  if (score >= 75) return "Ready";
  if (score >= 60) return "Partially Ready";
  return "Not Ready";
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

// ─── Chart Drawing Functions ──────────────────────────────────────────────────

/** Draw horizontal bar chart */
function drawHorizontalBar(
  doc,
  x,
  y,
  width,
  height,
  percentage,
  color,
  label,
  showThreshold = true,
) {
  // Background
  doc.setFillColor(...COLORS.lightGray);
  doc.roundedRect(x, y, width, height, 2, 2, "F");

  // Filled portion
  const filledWidth = (percentage / 100) * width;
  doc.setFillColor(...color);
  doc.roundedRect(x, y, filledWidth, height, 2, 2, "F");

  // Threshold line (70%)
  if (showThreshold) {
    const thresholdX = x + (70 / 100) * width;
    doc.setDrawColor(244, 220, 44);
    doc.setLineWidth(1.5);
    doc.line(thresholdX, y - 2, thresholdX, y + height + 2);
  }

  // Label
  if (label) {
    doc.setTextColor(...COLORS.darkGray);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(label, x - 2, y + height - 1, { align: "right" });
  }

  // Percentage text
  doc.setTextColor(...COLORS.darkGray);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`${percentage}%`, x + width + 3, y + height - 1);
}

/** Draw radar/diamond chart */
function drawRadarChart(doc, centerX, centerY, size, scores) {
  const labels = [
    "Commercial\n/Market",
    "Financial",
    "Operations",
    "Legal &\nCompliance",
  ];
  const values = [
    scores.commercial || 0,
    scores.financial || 0,
    scores.operations || 0,
    scores.legal || 0,
  ];

  // Draw axes - diamond shape
  const points = [
    { x: centerX, y: centerY - size }, // top (commercial)
    { x: centerX + size, y: centerY }, // right (financial)
    { x: centerX, y: centerY + size }, // bottom (operations)
    { x: centerX - size, y: centerY }, // left (legal)
  ];

  // Draw threshold line (70%)
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(1);
  doc.setLineDash([2, 2]);
  doc.line(
    points[0].x,
    points[0].y + size * 0.3,
    points[1].x - size * 0.3,
    points[1].y,
  );
  doc.line(
    points[1].x - size * 0.3,
    points[1].y,
    points[2].x,
    points[2].y - size * 0.3,
  );
  doc.line(
    points[2].x,
    points[2].y - size * 0.3,
    points[3].x + size * 0.3,
    points[3].y,
  );
  doc.line(
    points[3].x + size * 0.3,
    points[3].y,
    points[0].x,
    points[0].y + size * 0.3,
  );
  doc.setLineDash([]);

  // Draw grid lines
  doc.setDrawColor(...COLORS.lightGray);
  doc.setLineWidth(0.5);
  for (let level of [0.25, 0.5, 0.75, 1.0]) {
    const levelSize = size * level;
    doc.line(centerX, centerY - levelSize, centerX + levelSize, centerY);
    doc.line(centerX + levelSize, centerY, centerX, centerY + levelSize);
    doc.line(centerX, centerY + levelSize, centerX - levelSize, centerY);
    doc.line(centerX - levelSize, centerY, centerX, centerY - levelSize);
  }

  // Draw axes
  doc.setDrawColor(...COLORS.gray);
  doc.setLineWidth(1);
  points.forEach((point) => {
    doc.line(centerX, centerY, point.x, point.y);
  });

  // Calculate data points
  const dataPoints = values.map((value, i) => {
    const normalizedValue = value / 100;
    const point = points[i];
    return {
      x: centerX + (point.x - centerX) * normalizedValue,
      y: centerY + (point.y - centerY) * normalizedValue,
    };
  });

  // Draw data polygon
  doc.setFillColor(22, 42, 92, 0.15);
  doc.setDrawColor(22, 42, 92);
  doc.setLineWidth(2.5);

  // Create polygon by connecting all points
  if (dataPoints.length > 0) {
    const lines = [];
    for (let i = 0; i < dataPoints.length; i++) {
      const nextIndex = (i + 1) % dataPoints.length;
      lines.push([
        dataPoints[nextIndex].x - dataPoints[i].x,
        dataPoints[nextIndex].y - dataPoints[i].y,
      ]);
    }
    doc.lines(lines, dataPoints[0].x, dataPoints[0].y, null, "FD");
  }

  // Draw data points
  doc.setFillColor(22, 42, 92);
  dataPoints.forEach((point) => {
    doc.circle(point.x, point.y, 2.5, "F");
  });

  // Draw labels
  doc.setTextColor(...COLORS.darkGray);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");

  // Top
  const topLines = labels[0].split("\n");
  topLines.forEach((line, i) => {
    doc.text(line, centerX, points[0].y - 8 - (topLines.length - 1 - i) * 4, {
      align: "center",
    });
  });

  // Right
  doc.text(labels[1], points[1].x + 10, centerY + 2, { align: "left" });

  // Bottom
  const bottomLines = labels[2].split("\n");
  bottomLines.forEach((line, i) => {
    doc.text(line, centerX, points[2].y + 10 + i * 4, { align: "center" });
  });

  // Left
  const leftLines = labels[3].split("\n");
  leftLines.forEach((line, i) => {
    doc.text(
      line,
      points[3].x - 10 - (leftLines.length - 1) * 8,
      centerY + 2 + i * 3,
      { align: "right" },
    );
  });

  // Draw percentage labels at 0%, 30%, 60%, 100%
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.gray);
  [0, 30, 60, 100].forEach((pct, i) => {
    const offset = (pct / 100) * size;
    doc.text(`${pct}%`, centerX + offset + 2, centerY - 2);
  });
}

/** Draw gauge/needle chart */
function drawGaugeChart(doc, centerX, centerY, radius, percentage, label) {
  const startAngle = Math.PI;
  const endAngle = 2 * Math.PI;
  const notReadyEnd = startAngle + 0.4 * Math.PI;
  const developingEnd = startAngle + 0.7 * Math.PI;

  // Draw arc segments
  // Not Ready (0-40%)
  doc.setFillColor(...COLORS.red);
  drawArcSegment(
    doc,
    centerX,
    centerY,
    radius,
    radius - 10,
    startAngle,
    notReadyEnd,
  );

  // Developing (40-70%)
  doc.setFillColor(...COLORS.orange);
  drawArcSegment(
    doc,
    centerX,
    centerY,
    radius,
    radius - 10,
    notReadyEnd,
    developingEnd,
  );

  // Ready (70-100%)
  doc.setFillColor(...COLORS.green);
  drawArcSegment(
    doc,
    centerX,
    centerY,
    radius,
    radius - 10,
    developingEnd,
    endAngle,
  );

  // Draw needle
  const needleAngle = startAngle + (percentage / 100) * Math.PI;
  const needleLength = radius - 5;
  const needleEndX = centerX + needleLength * Math.cos(needleAngle);
  const needleEndY = centerY + needleLength * Math.sin(needleAngle);

  doc.setDrawColor(...COLORS.darkBlue);
  doc.setLineWidth(2);
  doc.line(centerX, centerY, needleEndX, needleEndY);

  // Draw center circle
  doc.setFillColor(...COLORS.darkBlue);
  doc.circle(centerX, centerY, 3, "F");

  // Draw percentage in center
  doc.setTextColor(...getScoreColor(percentage));
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text(`${percentage}%`, centerX, centerY + 20, { align: "center" });

  // Draw label
  if (label) {
    doc.setTextColor(...COLORS.gray);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(label, centerX, centerY + 28, { align: "center" });
  }

  // Draw legends
  doc.setFontSize(8);
  const legendY = centerY + radius + 10;

  doc.setFillColor(...COLORS.red);
  doc.rect(centerX - 40, legendY, 4, 4, "F");
  doc.setTextColor(...COLORS.darkGray);
  doc.text("Not Ready (0-40%)", centerX - 34, legendY + 3);

  doc.setFillColor(...COLORS.orange);
  doc.rect(centerX - 40, legendY + 7, 4, 4, "F");
  doc.text("Developing (40-70%)", centerX - 34, legendY + 10);

  doc.setFillColor(...COLORS.green);
  doc.rect(centerX - 40, legendY + 14, 4, 4, "F");
  doc.text("Ready (70-100%)", centerX - 34, legendY + 17);
}

/** Helper to draw arc segment */
function drawArcSegment(
  doc,
  centerX,
  centerY,
  outerRadius,
  innerRadius,
  startAngle,
  endAngle,
) {
  const segments = 30;
  const angleStep = (endAngle - startAngle) / segments;

  for (let i = 0; i < segments; i++) {
    const a1 = startAngle + i * angleStep;
    const a2 = a1 + angleStep;

    const x1 = centerX + innerRadius * Math.cos(a1);
    const y1 = centerY + innerRadius * Math.sin(a1);
    const x2 = centerX + outerRadius * Math.cos(a1);
    const y2 = centerY + outerRadius * Math.sin(a1);
    const x3 = centerX + outerRadius * Math.cos(a2);
    const y3 = centerY + outerRadius * Math.sin(a2);
    const x4 = centerX + innerRadius * Math.cos(a2);
    const y4 = centerY + innerRadius * Math.sin(a2);

    // Draw gauge segment as a polygon using lines
    const lines = [
      [x2 - x1, y2 - y1],
      [x3 - x2, y3 - y2],
      [x4 - x3, y4 - y3],
      [x1 - x4, y1 - y4],
    ];
    doc.lines(lines, x1, y1, null, "F");
  }
}

/** Draw stacked bar chart */
function drawStackedBar(doc, x, y, width, height, label, stacks) {
  let currentY = y;

  stacks.forEach((stack) => {
    const stackHeight = (stack.value / 100) * height;
    doc.setFillColor(...stack.color);
    doc.rect(x, currentY, width, stackHeight, "F");
    currentY += stackHeight;
  });

  // Border
  doc.setDrawColor(...COLORS.lightGray);
  doc.setLineWidth(0.5);
  doc.rect(x, y, width, height, "S");

  // Label
  doc.setTextColor(...COLORS.darkGray);
  doc.setFontSize(9);
  doc.text(label, x + width / 2, y + height + 5, { align: "center" });
}

/** Draw line chart with projection */
function drawLineChart(doc, x, y, width, height, points, threshold = 70) {
  // Draw grid
  doc.setDrawColor(...COLORS.lightGray);
  doc.setLineWidth(0.3);

  // Horizontal grid lines
  for (let i = 0; i <= 4; i++) {
    const gridY = y + (i / 4) * height;
    doc.line(x, gridY, x + width, gridY);
  }

  // Vertical grid lines (for each point)
  points.forEach((_, i) => {
    const gridX = x + (i / (points.length - 1)) * width;
    doc.line(gridX, y, gridX, y + height);
  });

  // Draw threshold line
  const thresholdY = y + height - (threshold / 100) * height;
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(1);
  doc.setLineDash([3, 3]);
  doc.line(x, thresholdY, x + width, thresholdY);
  doc.setLineDash([]);

  // Y-axis labels
  doc.setTextColor(...COLORS.gray);
  doc.setFontSize(8);
  for (let i = 0; i <= 4; i++) {
    const value = 100 - i * 25;
    const labelY = y + (i / 4) * height;
    doc.text(`${value}%`, x - 3, labelY + 2, { align: "right" });
  }

  // Draw line
  doc.setDrawColor(38, 45, 137);
  doc.setLineWidth(2);
  points.forEach((point, i) => {
    if (i < points.length - 1) {
      const x1 = x + (i / (points.length - 1)) * width;
      const y1 = y + height - (point.value / 100) * height;
      const x2 = x + ((i + 1) / (points.length - 1)) * width;
      const y2 = y + height - (points[i + 1].value / 100) * height;
      doc.line(x1, y1, x2, y2);
    }
  });

  // Draw points
  doc.setFillColor(38, 45, 137);
  points.forEach((point, i) => {
    const pX = x + (i / (points.length - 1)) * width;
    const pY = y + height - (point.value / 100) * height;
    doc.circle(pX, pY, 2.5, "F");

    // Point label
    doc.setTextColor(...COLORS.darkBlue);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(`${point.value}%`, pX, pY - 4, { align: "center" });
  });

  // X-axis labels
  doc.setTextColor(...COLORS.darkGray);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  points.forEach((point, i) => {
    const pX = x + (i / (points.length - 1)) * width;
    const lines = point.label.split("\n");
    lines.forEach((line, lineIdx) => {
      doc.text(line, pX, y + height + 5 + lineIdx * 4, { align: "center" });
    });
  });
}

// ─── Page Drawing Functions ───────────────────────────────────────────────────

/** PAGE 1: Cover */
function drawCoverPage(doc, businessName, overallScore, date, logoDataUrl) {
  const PW = doc.internal.pageSize.width;
  const PH = doc.internal.pageSize.height;

  // Background
  doc.setFillColor(...COLORS.darkBlue);
  doc.rect(0, 0, PW, PH, "F");

  // Decorative circles (bottom right)
  doc.setDrawColor(30, 65, 175);
  doc.setLineWidth(1);
  for (let i = 0; i < 9; i++) {
    const radius = 38 + i * 22;
    doc.ellipse(PW - 5, PH - 5, radius * 0.8, radius * 0.5, "S");
  }

  // Logo (top right)
  const logoH = 14; // Only limit height to maintain aspect ratio
  const logoY = 12;

  if (logoDataUrl) {
    try {
      // Get image dimensions to maintain aspect ratio
      const imgProps = doc.getImageProperties(logoDataUrl);
      const logoW = (imgProps.width / imgProps.height) * logoH;
      const logoX = PW - 18 - logoW;
      doc.addImage(logoDataUrl, "PNG", logoX, logoY, logoW, logoH);
    } catch (e) {
      // Fallback text logo
      const logoW = 32;
      const logoX = PW - 18 - logoW;
      doc.setTextColor(...COLORS.white);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.text("anza", logoX + logoW / 2, logoY + 9, { align: "center" });
    }
  }

  // Header text
  doc.setTextColor(200, 210, 240);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("CAPITAL READINESS ASSESSMENT REPORT", 18, 50);

  // Business name
  doc.setTextColor(...COLORS.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(32);
  const nameLines = doc.splitTextToSize(businessName, PW * 0.7);
  let nameY = 65;
  nameLines.forEach((line, i) => {
    doc.text(line, 18, nameY + i * 14);
  });
  nameY += nameLines.length * 14 + 8;

  // Subtitle
  doc.setFontSize(16);
  doc.text("Investment Analysis Report", 18, nameY);

  // Score
  doc.setTextColor(...COLORS.gold);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text(`Score: ${overallScore}%`, 18, nameY + 20);

  // Date
  doc.setTextColor(190, 205, 240);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(date, 18, nameY + 30);

  // Footer
  doc.setTextColor(170, 185, 225);
  doc.setFontSize(8);
  doc.text(
    `${businessName} — Capital Readiness Assessment Report`,
    PW / 2,
    PH - 12,
    { align: "center" },
  );
}

/** PAGE 2: Executive Summary */
function drawExecutiveSummary(doc, businessName, scoreData, overallScore) {
  const PW = doc.internal.pageSize.width;
  const PH = doc.internal.pageSize.height;

  // Header
  doc.setFillColor(240, 242, 250);
  doc.rect(0, 0, PW, 18, "F");
  doc.setTextColor(...COLORS.darkBlue);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("EXECUTIVE SUMMARY · DOMAIN SCORE OVERVIEW", 18, 12);

  // Domain score cards
  const cardW = 35;
  const cardH = 20;
  const cardY = 25;
  let cardX = 10;
  const cardSpacing = 2;

  const domains = [
    { label: "Overall Score", key: "_overall", value: overallScore },
    {
      label: "Commercial / Market",
      key: "commercial",
      value: scoreData.commercial?.percentage || 0,
    },
    {
      label: "Financial",
      key: "financial",
      value: scoreData.financial?.percentage || 0,
    },
    {
      label: "Operations",
      key: "operations",
      value: scoreData.operations?.percentage || 0,
    },
    {
      label: "Legal & Compliance",
      key: "legal",
      value: scoreData.legal?.percentage || 0,
    },
  ];

  domains.forEach((domain, i) => {
    const color = getScoreColor(domain.value);
    const bgColor = i === 0 ? COLORS.gold : [255, 255, 255];

    // Card background
    doc.setFillColor(...bgColor);
    doc.roundedRect(cardX, cardY, cardW, cardH, 2, 2, "F");

    // Top border - color based on score
    doc.setFillColor(...color);
    doc.roundedRect(cardX, cardY, cardW, 3, 1, 1, "F");

    // Label
    doc.setTextColor(...COLORS.darkGray);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    const labelLines = doc.splitTextToSize(domain.label, cardW - 4);
    labelLines.forEach((line, lineIdx) => {
      doc.text(line, cardX + cardW / 2, cardY + 8 + lineIdx * 3, {
        align: "center",
      });
    });

    // Score number
    doc.setTextColor(...color);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(`${domain.value}%`, cardX + cardW / 2, cardY + cardH - 3, {
      align: "center",
    });

    cardX += cardW + cardSpacing;
  });

  // Domain scores vs. 70% threshold
  let barY = 58;
  doc.setTextColor(...COLORS.darkGray);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Domain scores vs. 70% investment readiness threshold", 18, barY);
  barY += 10;

  const barLabels = [
    "Commercial",
    "Financial",
    "Operations",
    "Legal & Compliance",
    "Overall",
  ];
  const barValues = [
    scoreData.commercial?.percentage || 0,
    scoreData.financial?.percentage || 0,
    scoreData.operations?.percentage || 0,
    scoreData.legal?.percentage || 0,
    overallScore,
  ];

  barValues.forEach((value, i) => {
    const color = i === 4 ? COLORS.darkBlue : getScoreColor(value);
    drawHorizontalBar(doc, 55, barY, 70, 5, value, color, barLabels[i], true);
    barY += 8;
  });

  // Legend
  barY += 5;
  const legendItems = [
    { label: "Not Ready", color: COLORS.red },
    { label: "Developing", color: COLORS.orange },
    { label: "Partial", color: COLORS.orange },
    { label: "70% threshold", color: COLORS.gold },
  ];

  let legendX = 18;
  legendItems.forEach((item) => {
    doc.setFillColor(...item.color);
    doc.rect(legendX, barY, 3, 3, "F");
    doc.setTextColor(...COLORS.darkGray);
    doc.setFontSize(7);
    doc.text(item.label, legendX + 5, barY + 2.5);
    legendX += 25;
  });

  // Readiness profile radar - moved below bar chart
  const radarY = barY + 30;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.darkGray);
  doc.text("Readiness profile radar", 18, radarY);

  drawRadarChart(doc, PW / 2, radarY + 22, 22, {
    commercial: scoreData.commercial?.percentage || 0,
    financial: scoreData.financial?.percentage || 0,
    operations: scoreData.operations?.percentage || 0,
    legal: scoreData.legal?.percentage || 0,
  });

  // Summary paragraph
  const summaryY = radarY + 52;
  doc.setFillColor(240, 248, 255);
  doc.roundedRect(15, summaryY, PW - 30, 22, 2, 2, "F");

  // Left border accent
  doc.setFillColor(38, 45, 137);
  doc.rect(15, summaryY, 2, 22, "F");

  doc.setTextColor(...COLORS.darkGray);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const summaryText = `${businessName} achieved an overall Capital Readiness Score of ${overallScore}%, ${overallScore >= 70 ? "meeting" : "below"} the 70% investment readiness threshold. The assessment reveals ${scoreData.commercial?.percentage || 0}% in Commercial, ${scoreData.financial?.percentage || 0}% in Financial, ${scoreData.operations?.percentage || 0}% in Operations, and ${scoreData.legal?.percentage || 0}% in Legal & Compliance. Targeted improvements across ${overallScore >= 70 ? "specific areas" : "all four domains"} are required before full investment readiness is achieved within the recommended 18-month roadmap.`;
  const summaryLines = doc.splitTextToSize(summaryText, PW - 45);
  let summaryLineY = summaryY + 6;
  summaryLines.forEach((line) => {
    doc.text(line, 20, summaryLineY);
    summaryLineY += 4;
  });

  // Page footer
  addPageFooter(doc, businessName, 2);
}

/** PAGE 3: Overall Readiness Score */
function drawOverallReadinessPage(
  doc,
  businessName,
  scoreData,
  overallScore,
  domainData,
) {
  const PW = doc.internal.pageSize.width;
  const PH = doc.internal.pageSize.height;

  // Header
  doc.setFillColor(240, 242, 250);
  doc.rect(0, 0, PW, 18, "F");
  doc.setTextColor(...COLORS.darkBlue);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("OVERALL READINESS SCORE", 18, 12);

  // Left: Gauge
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.darkGray);
  doc.text("Capital readiness gauge — needle at " + overallScore + "%", 18, 30);

  drawGaugeChart(doc, 60, 78, 35, overallScore, "Overall Readiness Score");

  // Right: Domain comparison
  doc.text("Domain score comparison with 70% threshold", 130, 30);

  let barY = 40;
  const barLabels = ["Legal", "Operations", "Financial", "Commercial"];
  const barValues = [
    scoreData.legal?.percentage || 0,
    scoreData.operations?.percentage || 0,
    scoreData.financial?.percentage || 0,
    scoreData.commercial?.percentage || 0,
  ].reverse();

  barValues.forEach((value, i) => {
    const color = getScoreColor(value);
    drawHorizontalBar(
      doc,
      155,
      barY,
      40,
      4,
      value,
      color,
      barLabels[barLabels.length - 1 - i],
      false,
    );
    barY += 8;
  });

  // 70% threshold marker
  const thresholdX = 155 + (70 / 100) * 40;
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(2);
  doc.setLineDash([2, 2]);
  doc.line(thresholdX, 38, thresholdX, barY - 4);
  doc.setLineDash([]);
  doc.setTextColor(...COLORS.gold);
  doc.setFontSize(7);
  doc.text("70% threshold", thresholdX + 2, barY);

  // Sub-domain breakdown section
  const sectionY = 132;
  doc.setFillColor(38, 45, 137);
  doc.rect(0, sectionY, PW, 8, "F");
  doc.setTextColor(...COLORS.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(
    "SUB-DOMAIN BREAKDOWN — COMMERCIAL / MARKET & FINANCIAL",
    18,
    sectionY + 5.5,
  );

  // Commercial sub-domains - extract from actual CRAT data
  let chartY = sectionY + 15;
  doc.setTextColor(...COLORS.darkGray);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(
    "Commercial / Market sub-domains (Overall: " +
      (scoreData.commercial?.percentage || 0) +
      "%)",
    18,
    chartY,
  );
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.gray);
  const commercialPercent = scoreData.commercial?.percentage || 0;
  const commercialStatus =
    commercialPercent === 0
      ? "No assessment data available"
      : commercialPercent < 50
        ? "All commercial systems require development from baseline"
        : "Some commercial systems showing progress";
  doc.text(commercialStatus, 18, chartY + 4);

  // Extract commercial sub-domain scores from CRAT data
  chartY += 12;
  const commercialSubs = [];
  if (
    domainData?.commercial?.summary &&
    Array.isArray(domainData.commercial.summary)
  ) {
    domainData.commercial.summary.slice(0, 4).forEach((item) => {
      const score = item.score || 0; // Score is 0-2
      const percentage = Math.round((score / 2) * 100); // Convert to percentage
      const label = (item.subDomain || "Unknown")
        .split(" ")
        .slice(0, 2)
        .join("\n");
      commercialSubs.push({ label, value: percentage });
    });
  }
  // Fill with zeros if no data
  while (commercialSubs.length < 4) {
    commercialSubs.push({ label: "No Data\n", value: 0 });
  }

  let subX = 18;
  commercialSubs.forEach((sub) => {
    const barHeight = 35;
    const filledHeight = (sub.value / 100) * barHeight;
    const barY = chartY + barHeight - filledHeight;

    doc.setFillColor(...COLORS.lightGray);
    doc.rect(subX, chartY, 12, barHeight, "F");

    doc.setFillColor(...getScoreColor(sub.value));
    doc.rect(subX, barY, 12, filledHeight, "F");

    // Label
    doc.setTextColor(...COLORS.darkGray);
    doc.setFontSize(7);
    const labelLines = sub.label.split("\n");
    labelLines.forEach((line, i) => {
      doc.text(line, subX + 6, chartY + barHeight + 4 + i * 3, {
        align: "center",
      });
    });

    // Value
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(`${sub.value}%`, subX + 6, barY - 2, { align: "center" });
    doc.setFont("helvetica", "normal");

    subX += 20;
  });

  // 70% threshold line
  const thresholdY = chartY + 35 - 0.7 * 35;
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(1);
  doc.setLineDash([2, 2]);
  doc.line(15, thresholdY, 90, thresholdY);
  doc.setLineDash([]);
  doc.setTextColor(...COLORS.gold);
  doc.setFontSize(7);
  doc.text("70% threshold", 15, thresholdY - 2);

  // Financial sub-domains - extract from actual CRAT data
  doc.setTextColor(...COLORS.darkGray);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(
    "Financial sub-domains (Overall: " +
      (scoreData.financial?.percentage || 0) +
      "%)",
    110,
    sectionY + 15,
  );
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.gray);
  const financialPercent = scoreData.financial?.percentage || 0;
  const financialStatus =
    financialPercent === 0
      ? "No assessment data available"
      : financialPercent < 50
        ? "Financial systems need development"
        : "Some financial systems showing progress";
  doc.text(financialStatus, 110, sectionY + 19);

  // Extract financial sub-domain scores from CRAT data
  const financialSubs = [];
  if (
    domainData?.financial?.summary &&
    Array.isArray(domainData.financial.summary)
  ) {
    domainData.financial.summary.slice(0, 4).forEach((item) => {
      const score = item.score || 0; // Score is 0-2
      const percentage = Math.round((score / 2) * 100); // Convert to percentage
      const label = (item.subDomain || "Unknown")
        .split(" ")
        .slice(0, 2)
        .join("\n");
      financialSubs.push({ label, value: percentage });
    });
  }
  // Fill with zeros if no data
  while (financialSubs.length < 4) {
    financialSubs.push({ label: "No Data\n", value: 0 });
  }

  subX = 110;
  financialSubs.forEach((sub) => {
    const barHeight = 35;
    const filledHeight = (sub.value / 100) * barHeight;
    const barY = chartY + barHeight - filledHeight;

    doc.setFillColor(...COLORS.lightGray);
    doc.rect(subX, chartY, 12, barHeight, "F");

    doc.setFillColor(...getScoreColor(sub.value));
    doc.rect(subX, barY, 12, filledHeight, "F");

    // Label
    doc.setTextColor(...COLORS.darkGray);
    doc.setFontSize(7);
    const labelLines = sub.label.split("\n");
    labelLines.forEach((line, i) => {
      doc.text(line, subX + 6, chartY + barHeight + 4 + i * 3, {
        align: "center",
      });
    });

    // Value
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(`${sub.value}%`, subX + 6, barY - 2, { align: "center" });
    doc.setFont("helvetica", "normal");

    subX += 18;
  });

  // 70% threshold line
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(1);
  doc.setLineDash([2, 2]);
  doc.line(107, thresholdY, 182, thresholdY);
  doc.setLineDash([]);

  // Page footer
  addPageFooter(doc, businessName, 3);
}

/** PAGE 4: Operations & Legal / Compliance + Projections */
function drawProjectionsPage(
  doc,
  businessName,
  scoreData,
  overallScore,
  domainData,
) {
  const PW = doc.internal.pageSize.width;
  const PH = doc.internal.pageSize.height;

  // Header
  doc.setFillColor(240, 242, 250);
  doc.rect(0, 0, PW, 18, "F");
  doc.setTextColor(...COLORS.darkBlue);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("SUB-DOMAIN BREAKDOWN — OPERATIONS & LEGAL / COMPLIANCE", 18, 12);

  // Operations sub-domains - extract from actual CRAT data
  let chartY = 25;
  doc.setTextColor(...COLORS.darkGray);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(
    "Operations sub-domains (Overall: " +
      (scoreData.operations?.percentage || 0) +
      "%)",
    18,
    chartY,
  );
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.gray);
  const operationsPercent = scoreData.operations?.percentage || 0;
  const operationsStatus =
    operationsPercent === 0
      ? "No assessment data available"
      : operationsPercent < 50
        ? "Operations systems need development"
        : "Some operations systems showing progress";
  doc.text(operationsStatus, 18, chartY + 4);

  chartY += 10;
  // Extract operations sub-domain scores from CRAT data
  const operationsSubs = [];
  if (
    domainData?.operations?.summary &&
    Array.isArray(domainData.operations.summary)
  ) {
    domainData.operations.summary.slice(0, 4).forEach((item) => {
      const score = item.score || 0;
      const percentage = Math.round((score / 2) * 100);
      const label = (item.subDomain || "Unknown")
        .split(" ")
        .slice(0, 2)
        .join("\n");
      operationsSubs.push({ label, value: percentage });
    });
  }
  while (operationsSubs.length < 4) {
    operationsSubs.push({ label: "No Data\n", value: 0 });
  }

  let subX = 18;
  operationsSubs.forEach((sub) => {
    const barHeight = 35;
    const filledHeight = (sub.value / 100) * barHeight;
    const barY = chartY + barHeight - filledHeight;

    doc.setFillColor(...COLORS.lightGray);
    doc.rect(subX, chartY, 12, barHeight, "F");

    doc.setFillColor(...getScoreColor(sub.value));
    doc.rect(subX, barY, 12, filledHeight, "F");

    doc.setTextColor(...COLORS.darkGray);
    doc.setFontSize(7);
    const labelLines = sub.label.split("\n");
    labelLines.forEach((line, i) => {
      doc.text(line, subX + 6, chartY + barHeight + 4 + i * 3, {
        align: "center",
      });
    });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(`${sub.value}%`, subX + 6, barY - 2, { align: "center" });
    doc.setFont("helvetica", "normal");

    subX += 18;
  });

  // 70% threshold
  const thresholdY = chartY + 35 - 0.7 * 35;
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(1);
  doc.setLineDash([2, 2]);
  doc.line(15, thresholdY, 85, thresholdY);
  doc.setLineDash([]);
  doc.setTextColor(...COLORS.gold);
  doc.setFontSize(7);
  doc.text("70% threshold", 15, thresholdY - 2);

  // Legal sub-domains - extract from actual CRAT data
  doc.setTextColor(...COLORS.darkGray);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(
    "Legal & Compliance sub-domains (Overall: " +
      (scoreData.legal?.percentage || 0) +
      "%)",
    112,
    25,
  );
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.gray);
  const legalPercent = scoreData.legal?.percentage || 0;
  const legalStatus =
    legalPercent === 0
      ? "No assessment data available"
      : legalPercent < 50
        ? "Legal and compliance systems need development"
        : "Some legal and compliance systems showing progress";
  doc.text(legalStatus, 110, 29);

  // Extract legal sub-domain scores from CRAT data
  const legalSubs = [];
  if (domainData?.legal?.summary && Array.isArray(domainData.legal.summary)) {
    domainData.legal.summary.slice(0, 4).forEach((item) => {
      const score = item.score || 0;
      const percentage = Math.round((score / 2) * 100);
      const label = (item.subDomain || "Unknown")
        .split(" ")
        .slice(0, 2)
        .join("\n");
      legalSubs.push({ label, value: percentage });
    });
  }
  while (legalSubs.length < 4) {
    legalSubs.push({ label: "No Data\n", value: 0 });
  }

  subX = 110;
  legalSubs.forEach((sub) => {
    const barHeight = 35;
    const filledHeight = (sub.value / 100) * barHeight;
    const barY = chartY + barHeight - filledHeight;

    doc.setFillColor(...COLORS.lightGray);
    doc.rect(subX, chartY, 12, barHeight, "F");

    doc.setFillColor(...getScoreColor(sub.value));
    doc.rect(subX, barY, 12, filledHeight, "F");

    doc.setTextColor(...COLORS.darkGray);
    doc.setFontSize(7);
    const labelLines = sub.label.split("\n");
    labelLines.forEach((line, i) => {
      doc.text(line, subX + 6, chartY + barHeight + 4 + i * 3, {
        align: "center",
      });
    });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(`${sub.value}%`, subX + 6, barY - 2, { align: "center" });
    doc.setFont("helvetica", "normal");

    subX += 18;
  });

  // 70% threshold
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(1);
  doc.setLineDash([2, 2]);
  doc.line(107, thresholdY, 177, thresholdY);
  doc.setLineDash([]);

  // 18-month score projection
  const projY = 95;
  doc.setFillColor(38, 45, 137);
  doc.rect(0, projY, PW, 8, "F");
  doc.setTextColor(...COLORS.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("18-MONTH SCORE PROJECTION", 18, projY + 5.5);

  doc.setTextColor(...COLORS.darkGray);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Projected capital readiness score trajectory", 18, projY + 13);

  // Line chart
  const projPoints = [
    { label: "Baseline\n(Now)", value: overallScore },
    { label: "3 Months", value: Math.min(overallScore + 12, 100) },
    { label: "9 Months", value: Math.min(overallScore + 24, 100) },
    { label: "18 Months", value: Math.min(overallScore + 39, 100) },
  ];

  drawLineChart(doc, 25, projY + 20, 160, 40, projPoints, 70);

  // Domain improvement projection
  const stackY = 177;
  doc.setFillColor(38, 45, 137);
  doc.rect(0, stackY, PW, 8, "F");
  doc.setTextColor(...COLORS.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("DOMAIN IMPROVEMENT PROJECTION BY PHASE", 18, stackY + 5.5);

  doc.setTextColor(...COLORS.darkGray);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(
    "Stacked scores showing current + projected gains per phase",
    18,
    stackY + 13,
  );

  // Stacked bars
  const stackBarY = stackY + 20;
  const stackBarHeight = 50;
  const stackBarWidth = 30;
  let stackX = 30;

  const domains = [
    { label: "Commercial", current: scoreData.commercial?.percentage || 0 },
    { label: "Financial", current: scoreData.financial?.percentage || 0 },
    { label: "Operations", current: scoreData.operations?.percentage || 0 },
    { label: "Legal & Comp", current: scoreData.legal?.percentage || 0 },
  ];

  domains.forEach((domain) => {
    const current = domain.current;
    const threeMonth = Math.min(10, 70 - current);
    const nineMonth = Math.min(15, 70 - current - threeMonth);
    const eighteenMonth = Math.max(0, 80 - current - threeMonth - nineMonth);

    const stacks = [
      { value: eighteenMonth, color: COLORS.green },
      { value: nineMonth, color: COLORS.gold },
      { value: threeMonth, color: COLORS.orange },
      { value: current, color: COLORS.darkBlue },
    ];

    drawStackedBar(
      doc,
      stackX,
      stackBarY,
      stackBarWidth,
      stackBarHeight,
      domain.label,
      stacks,
    );
    stackX += stackBarWidth + 10;
  });

  // Legend
  const legendY = stackBarY + stackBarHeight + 12;
  const legendItems = [
    { label: "Current", color: COLORS.darkBlue },
    { label: "+3 months", color: COLORS.orange },
    { label: "+9 months", color: COLORS.gold },
    { label: "+18 months", color: COLORS.green },
  ];

  let legendX = 35;
  legendItems.forEach((item) => {
    doc.setFillColor(...item.color);
    doc.rect(legendX, legendY, 4, 4, "F");
    doc.setTextColor(...COLORS.darkGray);
    doc.setFontSize(7);
    doc.text(item.label, legendX + 6, legendY + 3);
    legendX += 28;
  });

  // 70% threshold marker
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(1);
  doc.setLineDash([2, 2]);
  const threshold70Y = stackBarY + stackBarHeight - 0.7 * stackBarHeight;
  doc.line(25, threshold70Y, stackX - 10, threshold70Y);
  doc.setLineDash([]);
  doc.setTextColor(...COLORS.gold);
  doc.setFontSize(7);
  doc.text("70%", 22, threshold70Y + 1, { align: "right" });

  // Page footer
  addPageFooter(doc, businessName, 4);
}

/** PAGE 5: Key Thematic Gaps & Risk Analysis */
function drawRiskAnalysisPage(doc, businessName, scoreData, overallScore) {
  const PW = doc.internal.pageSize.width;
  const PH = doc.internal.pageSize.height;

  // Header
  doc.setFillColor(240, 242, 250);
  doc.rect(0, 0, PW, 18, "F");
  doc.setTextColor(...COLORS.darkBlue);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("KEY THEMATIC GAPS", 18, 12);

  // Gap boxes
  const boxY = 25;
  const boxW = 88;
  const boxH = 30;
  const boxSpacing = 6;

  const gaps = [
    {
      title: "Commercial / Market — 0%",
      color: COLORS.red,
      items: [
        "No formalised sales process or revenue pipeline tracking",
        "No competitive intelligence or structured market positioning",
        "Narrow customer base with no documented retention strategy",
        "Ad hoc marketing; no brand strategy or budget allocated",
      ],
    },
    {
      title: "Financial Management — 48%",
      color: COLORS.orange,
      items: [
        "No cash flow forecasting model or working capital plan",
        "Financial records not audited or prepared to investor standard",
        "No accounting software; records maintained manually",
        "No 12-month financial projections available for investors",
      ],
    },
    {
      title: "Operations — 60%",
      color: COLORS.orange,
      items: [
        "High key-person dependency creating succession risk",
        "Core operational processes largely undocumented",
        "No KPI framework or performance metrics linked to targets",
        "Data management is informal with no real-time insights",
      ],
    },
    {
      title: "Legal & Compliance — 36%",
      color: COLORS.red,
      items: [
        "Sector-specific licences and permits need comprehensive review",
        "Customer, supplier, and employment contracts not formalised",
        "No intellectual property registration or protection strategy",
        "No board or formal governance oversight structure in place",
      ],
    },
  ];

  // Top row
  let currentX = 18;
  [gaps[0], gaps[1]].forEach((gap) => {
    doc.setFillColor(...gap.color);
    doc.roundedRect(currentX, boxY, boxW, 3, 1, 1, "F");
    doc.setFillColor(255, 245, 245);
    doc.roundedRect(currentX, boxY + 3, boxW, boxH - 3, 1, 1, "F");

    doc.setTextColor(...COLORS.white);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(gap.title, currentX + 2, boxY + 2);

    doc.setTextColor(...COLORS.darkGray);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    let itemY = boxY + 8;
    gap.items.forEach((item) => {
      doc.text("•", currentX + 2, itemY);
      const itemLines = doc.splitTextToSize(item, boxW - 8);
      itemLines.forEach((line) => {
        doc.text(line, currentX + 5, itemY);
        itemY += 3;
      });
    });

    currentX += boxW + boxSpacing;
  });

  // Bottom row
  currentX = 18;
  [gaps[2], gaps[3]].forEach((gap) => {
    const bottomBoxY = boxY + boxH + 8;
    doc.setFillColor(...gap.color);
    doc.roundedRect(currentX, bottomBoxY, boxW, 3, 1, 1, "F");
    doc.setFillColor(255, 250, 240);
    doc.roundedRect(currentX, bottomBoxY + 3, boxW, boxH - 3, 1, 1, "F");

    doc.setTextColor(...COLORS.white);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(gap.title, currentX + 2, bottomBoxY + 2);

    doc.setTextColor(...COLORS.darkGray);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    let itemY = bottomBoxY + 8;
    gap.items.forEach((item) => {
      doc.text("•", currentX + 2, itemY);
      const itemLines = doc.splitTextToSize(item, boxW - 8);
      itemLines.forEach((line) => {
        doc.text(line, currentX + 5, itemY);
        itemY += 3;
      });
    });

    currentX += boxW + boxSpacing;
  });

  // Risk Analysis section
  const riskY = 100;
  doc.setFillColor(38, 45, 137);
  doc.rect(0, riskY, PW, 8, "F");
  doc.setTextColor(...COLORS.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("CONSOLIDATED RISK ANALYSIS", 18, riskY + 5.5);

  // Risk severity radar
  doc.setTextColor(...COLORS.darkGray);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Risk severity by domain", 18, riskY + 13);

  // Simple radar for risk
  const riskRadarX = 55;
  const riskRadarY = riskY + 40;
  const riskRadarSize = 20;

  // Draw diamond
  doc.setDrawColor(...COLORS.lightGray);
  doc.setLineWidth(0.5);
  doc.line(
    riskRadarX,
    riskRadarY - riskRadarSize,
    riskRadarX + riskRadarSize,
    riskRadarY,
  );
  doc.line(
    riskRadarX + riskRadarSize,
    riskRadarY,
    riskRadarX,
    riskRadarY + riskRadarSize,
  );
  doc.line(
    riskRadarX,
    riskRadarY + riskRadarSize,
    riskRadarX - riskRadarSize,
    riskRadarY,
  );
  doc.line(
    riskRadarX - riskRadarSize,
    riskRadarY,
    riskRadarX,
    riskRadarY - riskRadarSize,
  );

  // Draw risk polygon
  const riskValues = [
    100 - (scoreData.commercial?.percentage || 0), // Commercial risk (inverse of score)
    100 - (scoreData.financial?.percentage || 0),
    100 - (scoreData.operations?.percentage || 0),
    100 - (scoreData.legal?.percentage || 0),
  ];

  const riskPoints = riskValues.map((value, i) => {
    const normalizedValue = value / 100;
    const angles = [-Math.PI / 2, 0, Math.PI / 2, Math.PI];
    const angle = angles[i];
    return {
      x: riskRadarX + riskRadarSize * normalizedValue * Math.cos(angle),
      y: riskRadarY + riskRadarSize * normalizedValue * Math.sin(angle),
    };
  });

  doc.setFillColor(239, 68, 68, 0.3);
  doc.setDrawColor(239, 68, 68);
  doc.setLineWidth(2);

  // Create risk polygon by connecting all points
  if (riskPoints.length > 0) {
    const lines = [];
    for (let i = 0; i < riskPoints.length; i++) {
      const nextIndex = (i + 1) % riskPoints.length;
      lines.push([
        riskPoints[nextIndex].x - riskPoints[i].x,
        riskPoints[nextIndex].y - riskPoints[i].y,
      ]);
    }
    doc.lines(lines, riskPoints[0].x, riskPoints[0].y, null, "FD");
  }

  // Labels
  doc.setTextColor(...COLORS.darkGray);
  doc.setFontSize(7);
  doc.text("Financial", riskRadarX, riskRadarY - riskRadarSize - 3, {
    align: "center",
  });
  doc.text("Operational", riskRadarX + riskRadarSize + 5, riskRadarY + 1);
  doc.text("Commercial", riskRadarX, riskRadarY + riskRadarSize + 5, {
    align: "center",
  });
  doc.text("Legal /", riskRadarX - riskRadarSize - 12, riskRadarY - 1, {
    align: "right",
  });
  doc.text("Regulatory", riskRadarX - riskRadarSize - 12, riskRadarY + 2, {
    align: "right",
  });

  // Risk scatter plot
  doc.setTextColor(...COLORS.darkGray);
  doc.setFontSize(8);
  doc.text("Risk likelihood vs. impact matrix", 120, riskY + 13);

  const scatterX = 130;
  const scatterY = riskY + 20;
  const scatterW = 70;
  const scatterH = 50;

  // Draw axes
  doc.setDrawColor(...COLORS.lightGray);
  doc.setLineWidth(0.5);
  doc.rect(scatterX, scatterY, scatterW, scatterH, "S");
  doc.line(
    scatterX,
    scatterY + scatterH / 2,
    scatterX + scatterW,
    scatterY + scatterH / 2,
  );
  doc.line(
    scatterX + scatterW / 2,
    scatterY,
    scatterX + scatterW / 2,
    scatterY + scatterH,
  );

  // Axis labels
  doc.setTextColor(...COLORS.gray);
  doc.setFontSize(7);
  doc.text("Likelihood →", scatterX + scatterW / 2, scatterY + scatterH + 4, {
    align: "center",
  });
  doc.text("Impact →", scatterX - 4, scatterY + scatterH / 2, {
    align: "center",
    angle: 90,
  });

  // Plot risk points
  const riskPlotPoints = [
    { x: 0.75, y: 0.35, color: COLORS.red, size: 8, label: "Commercial" },
    { x: 0.25, y: 0.75, color: COLORS.orange, size: 7, label: "Financial" },
    { x: 0.45, y: 0.55, color: COLORS.orange, size: 6, label: "Operational" },
    { x: 0.85, y: 0.8, color: COLORS.red, size: 9, label: "Legal" },
  ];

  riskPlotPoints.forEach((point) => {
    const pX = scatterX + point.x * scatterW;
    const pY = scatterY + scatterH - point.y * scatterH;

    doc.setFillColor(...point.color, 0.6);
    doc.circle(pX, pY, point.size, "F");
  });

  // Legend
  const legendY = scatterY + scatterH + 10;
  doc.setTextColor(...COLORS.darkGray);
  doc.setFontSize(7);
  doc.text("● Commercial risks", scatterX, legendY);
  doc.text("● Financial risks", scatterX + 35, legendY);
  doc.text("● Operational risks", scatterX, legendY + 4);
  doc.text("● Legal & Regulatory risks", scatterX + 35, legendY + 4);

  // Risk descriptions
  const descY = riskY + 85;
  const descBoxW = 88;
  const descBoxH = 22;

  const riskDescs = [
    {
      title: "Commercial risks",
      color: COLORS.red,
      text: "Zero commercial score signals high vulnerability to competition. Absence of structured sales or customer strategy creates immediate revenue risk requiring urgent differentiation.",
    },
    {
      title: "Financial risks",
      color: COLORS.orange,
      text: "Cash flow gaps and manual record-keeping limit investor confidence. Liquidity risk increases as the business scales post-investment without rigorous financial controls.",
    },
    {
      title: "Operational risks",
      color: COLORS.orange,
      text: "Undocumented processes and key-person dependency reduce resilience. Quality may deteriorate under increased complexity without prior system upgrades.",
    },
    {
      title: "Legal & Regulatory risks",
      color: COLORS.red,
      text: "Compliance gaps and incomplete contracts could delay investment. Evolving tax legislation in Tanzania requires proactive legal engagement before due diligence.",
    },
  ];

  currentX = 18;
  [riskDescs[0], riskDescs[1]].forEach((risk) => {
    doc.setFillColor(...risk.color);
    doc.circle(currentX + 3, descY + 2, 2, "F");

    doc.setTextColor(...COLORS.darkGray);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text(risk.title, currentX + 7, descY + 3);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    const textLines = doc.splitTextToSize(risk.text, descBoxW - 4);
    let textY = descY + 7;
    textLines.forEach((line) => {
      doc.text(line, currentX + 2, textY);
      textY += 2.5;
    });

    currentX += descBoxW + boxSpacing;
  });

  currentX = 18;
  [riskDescs[2], riskDescs[3]].forEach((risk) => {
    const bottomDescY = descY + descBoxH + 3;
    doc.setFillColor(...risk.color);
    doc.circle(currentX + 3, bottomDescY + 2, 2, "F");

    doc.setTextColor(...COLORS.darkGray);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text(risk.title, currentX + 7, bottomDescY + 3);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    const textLines = doc.splitTextToSize(risk.text, descBoxW - 4);
    let textY = bottomDescY + 7;
    textLines.forEach((line) => {
      doc.text(line, currentX + 2, textY);
      textY += 2.5;
    });

    currentX += descBoxW + boxSpacing;
  });

  // Page footer
  addPageFooter(doc, businessName, 5);
}

/** PAGE 6: Readiness Improvement Roadmap */
function drawRoadmapPage(doc, businessName, overallScore) {
  const PW = doc.internal.pageSize.width;
  const PH = doc.internal.pageSize.height;

  // Header
  doc.setFillColor(240, 242, 250);
  doc.rect(0, 0, PW, 18, "F");
  doc.setTextColor(...COLORS.darkBlue);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("READINESS IMPROVEMENT ROADMAP", 18, 12);

  // Projected score trajectory
  doc.setTextColor(...COLORS.darkGray);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Projected score trajectory", 18, 27);

  const roadmapPoints = [
    { label: "Now", value: overallScore },
    { label: "3 mo", value: Math.min(overallScore + 12, 100) },
    { label: "9 mo", value: Math.min(overallScore + 24, 100) },
    { label: "18 mo", value: Math.min(overallScore + 39, 100) },
  ];

  drawLineChart(doc, 25, 35, 165, 35, roadmapPoints, 70);

  // Roadmap phases
  const phaseY = 80;
  const phaseBoxH = 45;
  const phaseBoxW = 62;
  const phaseSpacing = 2;

  const phases = [
    {
      title: "0–3 MONTHS · IMMEDIATE",
      color: [255, 230, 230],
      items: [
        "Formalise financial records; engage accountant",
        "Confirm all licences and permits are current",
        "Document core operational processes",
        "Prepare investor information pack",
        "Establish basic sales tracking system",
      ],
    },
    {
      title: "3–9 MONTHS · SHORT-TERM",
      color: [255, 248, 220],
      items: [
        "Implement accounting software (e.g. QuickBooks)",
        "Build 12-month rolling cash flow forecast",
        "Formalise all supplier and client contracts",
        "Implement CRM and sales pipeline tools",
        "Launch structured team training programme",
      ],
    },
    {
      title: "9–18 MONTHS · MEDIUM-TERM",
      color: [230, 248, 240],
      items: [
        "Establish board and governance structure",
        "Register all intellectual property assets",
        "Prepare investor-grade audited financials",
        "Build commercial traction and market presence",
        "Re-assess — target 70%+ readiness score",
      ],
    },
  ];

  let phaseX = 18;
  phases.forEach((phase) => {
    doc.setFillColor(...phase.color);
    doc.roundedRect(phaseX, phaseY, phaseBoxW, phaseBoxH, 2, 2, "F");

    doc.setTextColor(...COLORS.darkBlue);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    const titleLines = phase.title.split(" · ");
    doc.text(titleLines[0], phaseX + phaseBoxW / 2, phaseY + 4, {
      align: "center",
    });
    doc.text(titleLines[1], phaseX + phaseBoxW / 2, phaseY + 7.5, {
      align: "center",
    });

    doc.setTextColor(...COLORS.darkGray);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    let itemY = phaseY + 13;
    phase.items.forEach((item) => {
      doc.text("•", phaseX + 2, itemY);
      const itemLines = doc.splitTextToSize(item, phaseBoxW - 6);
      itemLines.forEach((line) => {
        doc.text(line, phaseX + 4, itemY);
        itemY += 2.8;
      });
    });

    phaseX += phaseBoxW + phaseSpacing;
  });

  // Conclusion section
  const conclusionY = phaseY + phaseBoxH + 10;
  doc.setFillColor(38, 45, 137);
  doc.rect(0, conclusionY, PW, 8, "F");
  doc.setTextColor(...COLORS.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("CONCLUSION & RECOMMENDATIONS", 18, conclusionY + 5.5);

  doc.setTextColor(...COLORS.darkGray);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");

  const conclusionText = `${businessName} has demonstrated commitment to capital readiness through participation in this comprehensive assessment, achieving an overall score of ${overallScore}%. While ${overallScore >= 70 ? "the business meets the investment readiness threshold, continued focus on the identified improvement areas will strengthen the investment proposition further" : "the business has not yet reached the 70% investment readiness threshold, the assessment has clearly identified priority areas that, when addressed, will unlock investment readiness within 18 months"}.

The most significant opportunities lie in financial management, legal compliance, operational documentation, and commercial strategy development. Targeted improvements across all four domains are required before full investment readiness is achieved within the recommended 18-month roadmap.

Recommended next steps: Engage with the CRAT framework as an ongoing monitoring tool · Prioritise resource allocation based on domain-specific insights · Engage specialist advisors in finance, legal, and operations · Schedule a follow-up assessment in 12 months to formally measure progress and update the investment readiness profile.`;

  const conclusionLines = doc.splitTextToSize(conclusionText, PW - 36);
  let conclusionLineY = conclusionY + 15;
  conclusionLines.forEach((line) => {
    doc.text(line, 18, conclusionLineY);
    conclusionLineY += 4;
  });

  // Page footer
  addPageFooter(doc, businessName, 6);
}

/** PAGE 7: Business Model Viability */
function drawBusinessModelPage(doc, businessName, domainData) {
  const PW = doc.internal.pageSize.width;
  const PH = doc.internal.pageSize.height;

  // Full-page header
  doc.setFillColor(38, 45, 137);
  doc.rect(0, 0, PW, 25, "F");

  doc.setTextColor(255, 200, 100);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(
    "CAPITAL READINESS ASSESSMENT REPORT · " + businessName.toUpperCase(),
    PW / 2,
    10,
    { align: "center" },
  );

  doc.setTextColor(...COLORS.white);
  doc.setFontSize(16);
  doc.text("BUSINESS MODEL VIABILITY", PW / 2, 19, { align: "center" });

  // Calculate Business Model Viability from domain data
  // If we have actual CRAT data, use the summary items; otherwise use 0
  const hasRealData =
    domainData &&
    ((domainData.commercial?.summary &&
      domainData.commercial.summary.length > 0) ||
      (domainData.financial?.summary &&
        domainData.financial.summary.length > 0));

  // Calculate viability scores - these are derived/estimated from CRAT domains
  let revenueDiv = 0,
    valueProp = 0,
    competitive = 0,
    scalability = 0,
    unitEcon = 0;

  if (hasRealData) {
    // Approximate viability metrics from CRAT sub-domains
    // Revenue Diversity: from Commercial domain average
    if (
      domainData.commercial?.summary &&
      domainData.commercial.summary.length > 0
    ) {
      const avgCommercial =
        domainData.commercial.summary.reduce(
          (sum, item) => sum + (item.score || 0),
          0,
        ) / domainData.commercial.summary.length;
      revenueDiv = Math.round((avgCommercial / 2) * 100);
      valueProp = Math.round((avgCommercial / 2) * 100);
      competitive = Math.round((avgCommercial / 2) * 100);
    }

    // Scalability & Unit Economics: from Financial and Operations
    if (
      domainData.financial?.summary &&
      domainData.financial.summary.length > 0
    ) {
      const avgFinancial =
        domainData.financial.summary.reduce(
          (sum, item) => sum + (item.score || 0),
          0,
        ) / domainData.financial.summary.length;
      unitEcon = Math.round((avgFinancial / 2) * 100);
    }
    if (
      domainData.operations?.summary &&
      domainData.operations.summary.length > 0
    ) {
      const avgOperations =
        domainData.operations.summary.reduce(
          (sum, item) => sum + (item.score || 0),
          0,
        ) / domainData.operations.summary.length;
      scalability = Math.round((avgOperations / 2) * 100);
    }
  }

  const viabilityOverall = Math.round(
    (revenueDiv + valueProp + competitive + scalability + unitEcon) / 5,
  );
  const viabilityStatus =
    viabilityOverall === 0
      ? "No assessment data available"
      : viabilityOverall < 40
        ? "Not Ready — investor-grade business model articulation is absent across all key dimensions"
        : viabilityOverall < 70
          ? "Developing — business model showing some articulation but needs strengthening"
          : "Ready — business model well-articulated for investor consideration";

  // Subtitle
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(
    "Overall score: " +
      viabilityOverall +
      "% · Critical dimension for investor confidence and capital readiness",
    PW / 2,
    24,
    { align: "center" },
  );

  // Yellow accent bar
  doc.setFillColor(244, 220, 44);
  doc.rect(0, 25, PW, 2, "F");

  // Warning box
  const warnY = 35;
  doc.setFillColor(255, 248, 230);
  doc.roundedRect(15, warnY, PW - 30, 12, 2, 2, "F");

  doc.setTextColor(...COLORS.darkBlue);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(
    "Business Model Viability Score: " + viabilityOverall + "%",
    18,
    warnY + 5,
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.darkGray);
  doc.text(viabilityStatus, 18, warnY + 9);

  // Score cards
  const cardY = 53;
  const cardW = 36;
  const cardH = 18;
  let cardX = 12;

  const viabilityScores = [
    {
      label: "Revenue\nDiversity",
      value: revenueDiv,
      color: getScoreColor(revenueDiv),
    },
    {
      label: "Value\nProposition",
      value: valueProp,
      color: getScoreColor(valueProp),
    },
    {
      label: "Competitive\nPosition",
      value: competitive,
      color: getScoreColor(competitive),
    },
    {
      label: "Scalability\nModel",
      value: scalability,
      color: getScoreColor(scalability),
    },
    {
      label: "Unit\nEconomics",
      value: unitEcon,
      color: getScoreColor(unitEcon),
    },
  ];

  viabilityScores.forEach((score) => {
    doc.setFillColor(...score.color);
    doc.roundedRect(cardX, cardY, cardW, cardH, 2, 2, "F");

    doc.setTextColor(...COLORS.white);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(`${score.value}%`, cardX + cardW / 2, cardY + 9, {
      align: "center",
    });

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    const labelLines = score.label.split("\n");
    labelLines.forEach((line, i) => {
      doc.text(line, cardX + cardW / 2, cardY + 13 + i * 3, {
        align: "center",
      });
    });

    cardX += cardW + 1;
  });

  // Sub-sections
  const subY = 78;
  doc.setTextColor(...COLORS.darkBlue);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("SUB-DOMAIN SCORES VS 70% THRESHOLD", 18, subY);

  // Horizontal bars
  let barY = subY + 6;
  viabilityScores.reverse().forEach((score) => {
    drawHorizontalBar(
      doc,
      60,
      barY,
      60,
      4,
      score.value,
      score.color,
      score.label.replace("\n", " "),
      false,
    );
    barY += 7;
  });
  viabilityScores.reverse();

  // Threshold line
  const thresholdX = 60 + (70 / 100) * 60;
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(1.5);
  doc.setLineDash([2, 2]);
  doc.line(thresholdX, subY + 5, thresholdX, barY);
  doc.setLineDash([]);
  doc.setTextColor(...COLORS.gold);
  doc.setFontSize(7);
  doc.text("70% threshold", thresholdX + 2, subY + 4);

  // Radar chart
  doc.setTextColor(...COLORS.darkBlue);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("VIABILITY PROFILE RADAR", PW - 80, subY);

  // Simple radar using calculated viability scores
  const radarX = PW - 40;
  const radarY = subY + 25;

  drawRadarChart(doc, radarX, radarY, 20, {
    commercial: revenueDiv, // Revenue Diversity
    financial: competitive, // Competitive Position
    operations: scalability, // Scalability
    legal: unitEcon, // Unit Economics
  });

  // Key Viability Gaps
  const gapY = 126;
  doc.setTextColor(...COLORS.darkBlue);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("KEY VIABILITY GAPS", 18, gapY);

  const gapBoxW = 88;
  const gapBoxH = 28;
  const gapBoxSpacing = 6;

  const viabilityGaps = [
    {
      title: "Revenue Streams — " + revenueDiv + "%",
      color: getScoreColor(revenueDiv),
      items: [
        hasRealData
          ? "Revenue diversification analysis from CRAT assessment"
          : "No assessment data available",
        hasRealData
          ? "Product line evaluation from domain scores"
          : "Complete CRAT assessment for detailed analysis",
        hasRealData ? "Revenue model assessment from CRAT" : "",
        hasRealData ? "Seasonal revenue patterns from assessment" : "",
      ].filter((item) => item),
    },
    {
      title: "Competitive Position — " + competitive + "%",
      color: getScoreColor(competitive),
      items: [
        hasRealData
          ? "Competitive analysis from CRAT assessment"
          : "No assessment data available",
        hasRealData
          ? "Pricing strategy evaluation from domain scores"
          : "Complete CRAT assessment for detailed analysis",
        hasRealData ? "Differentiation strategy from CRAT" : "",
        hasRealData ? "Market competition from assessment" : "",
      ].filter((item) => item),
    },
    {
      title: "Value Proposition — " + valueProp + "%",
      color: getScoreColor(valueProp),
      items: [
        hasRealData
          ? "Value proposition analysis from CRAT assessment"
          : "No assessment data available",
        hasRealData
          ? "Quality differentiation from domain scores"
          : "Complete CRAT assessment for detailed analysis",
        hasRealData ? "Market positioning from CRAT" : "",
        hasRealData ? "Customer value from assessment" : "",
      ].filter((item) => item),
    },
    {
      title:
        "Scalability & Unit Economics — " +
        Math.round((scalability + unitEcon) / 2) +
        "%",
      color: getScoreColor(Math.round((scalability + unitEcon) / 2)),
      items: [
        hasRealData
          ? "Cost structure analysis from CRAT assessment"
          : "No assessment data available",
        hasRealData
          ? "Growth model evaluation from domain scores"
          : "Complete CRAT assessment for detailed analysis",
        hasRealData ? "Capital efficiency from CRAT" : "",
        hasRealData ? "Financial model from assessment" : "",
      ].filter((item) => item),
    },
  ];

  let gapX = 18;
  let gapRowY = gapY + 5;

  viabilityGaps.forEach((gap, i) => {
    if (i === 2) {
      gapX = 18;
      gapRowY += gapBoxH + 5;
    }

    doc.setFillColor(...gap.color);
    doc.roundedRect(gapX, gapRowY, gapBoxW, 3, 1, 1, "F");
    doc.setFillColor(255, 250, 245);
    doc.roundedRect(gapX, gapRowY + 3, gapBoxW, gapBoxH - 3, 1, 1, "F");

    doc.setTextColor(...COLORS.white);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text(gap.title, gapX + 2, gapRowY + 2);

    doc.setTextColor(...COLORS.darkGray);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    let itemY = gapRowY + 7;
    gap.items.forEach((item) => {
      doc.text("•", gapX + 2, itemY);
      const itemLines = doc.splitTextToSize(item, gapBoxW - 6);
      itemLines.forEach((line) => {
        doc.text(line, gapX + 4, itemY);
        itemY += 2.8;
      });
    });

    gapX += gapBoxW + gapBoxSpacing;
  });

  // Investor Insight
  const insightY = gapRowY + gapBoxH + 10;
  doc.setFillColor(240, 245, 255);
  doc.roundedRect(15, insightY, PW - 30, 20, 2, 2, "F");

  doc.setFillColor(38, 45, 137);
  doc.rect(15, insightY, 3, 20, "F");

  doc.setTextColor(...COLORS.darkBlue);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("Investor Insight", 20, insightY + 5);

  doc.setTextColor(...COLORS.darkGray);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  const insightText = `${businessName} operates in a high-demand natural products segment but lacks the business model documentation required to build investor confidence. Honey businesses in Tanzania face fragmented markets and informal competition; investors require a clear articulation of how the business differentiates, scales, and generates sustainable margins before committing capital. Addressing business model viability gaps is critical for unlocking investment readiness.`;
  const insightLines = doc.splitTextToSize(insightText, PW - 45);
  let insightLineY = insightY + 10;
  insightLines.forEach((line) => {
    doc.text(line, 20, insightLineY);
    insightLineY += 3.5;
  });

  // Page footer
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(7);
  doc.text(
    `${businessName} — Capital Readiness Assessment Report`,
    PW / 2,
    PH - 8,
    { align: "center" },
  );
  doc.text("7 / 8", PW - 18, PH - 8);
}

/** PAGE 8: Prioritization Matrix */
function drawPrioritizationPage(doc, businessName) {
  const PW = doc.internal.pageSize.width;
  const PH = doc.internal.pageSize.height;

  // Full-page header
  doc.setFillColor(38, 45, 137);
  doc.rect(0, 0, PW, 25, "F");

  doc.setTextColor(255, 200, 100);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(
    "CAPITAL READINESS ASSESSMENT REPORT · " + businessName.toUpperCase(),
    PW / 2,
    10,
    { align: "center" },
  );

  doc.setTextColor(...COLORS.white);
  doc.setFontSize(16);
  doc.text("PRIORITISATION MATRIX — QUICK WINS & BOLD PLAYS", PW / 2, 19, {
    align: "center",
  });

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(
    "Interventions mapped by ease of implementation vs. potential impact on capital readiness",
    PW / 2,
    24,
    { align: "center" },
  );

  // Yellow accent bar
  doc.setFillColor(244, 220, 44);
  doc.rect(0, 25, PW, 2, "F");

  // Description
  doc.setTextColor(...COLORS.darkGray);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  const descText = `Quick Wins are high-impact actions requiring fewer resources — these are where ${businessName} should focus immediately. Bold Plays require more effort but deliver the greatest capital readiness gains and should be sequenced into the 3–18 month programme.`;
  const descLines = doc.splitTextToSize(descText, PW - 36);
  let descY = 33;
  descLines.forEach((line) => {
    doc.text(line, 18, descY);
    descY += 3.5;
  });

  // Matrix section
  const matrixY = descY + 8;
  doc.setTextColor(...COLORS.darkBlue);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("IMPACT VS EASE OF IMPLEMENTATION MATRIX", 18, matrixY);

  // Draw matrix (simplified scatter plot)
  const matrixX = 25;
  const matrixChartY = matrixY + 8;
  const matrixW = 160;
  const matrixH = 80;

  // Background zones - light pastel colors for clean appearance
  doc.setFillColor(252, 242, 242);
  doc.rect(matrixX, matrixChartY, matrixW / 2, matrixH / 2, "F"); // Hard slog - light red
  doc.setFillColor(255, 253, 248);
  doc.rect(matrixX, matrixChartY + matrixH / 2, matrixW / 2, matrixH / 2, "F"); // Low priority - light yellow
  doc.setFillColor(245, 255, 245);
  doc.rect(
    matrixX + matrixW / 2,
    matrixChartY + matrixH / 2,
    matrixW / 2,
    matrixH / 2,
    "F",
  ); // Quick wins - light green
  doc.setFillColor(248, 250, 255);
  doc.rect(matrixX + matrixW / 2, matrixChartY, matrixW / 2, matrixH / 2, "F"); // Bold plays - light blue

  // Borders
  doc.setDrawColor(...COLORS.gray);
  doc.setLineWidth(1);
  doc.rect(matrixX, matrixChartY, matrixW, matrixH, "S");
  doc.line(
    matrixX + matrixW / 2,
    matrixChartY,
    matrixX + matrixW / 2,
    matrixChartY + matrixH,
  );
  doc.line(
    matrixX,
    matrixChartY + matrixH / 2,
    matrixX + matrixW,
    matrixChartY + matrixH / 2,
  );

  // Axis labels
  doc.setTextColor(...COLORS.gray);
  doc.setFontSize(7);
  doc.text(
    "Ease of implementation → (Higher = Easier / Fewer Resources)",
    matrixX + matrixW / 2,
    matrixChartY + matrixH + 4,
    { align: "center" },
  );
  doc.text(
    "Potential Impact → (Greater Effect)",
    matrixX - 5,
    matrixChartY + matrixH / 2,
    { align: "center", angle: 90 },
  );

  // Zone labels
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text("HARD SLOG", matrixX + 5, matrixChartY + 10);
  doc.text("LOW PRIORITY", matrixX + 5, matrixChartY + matrixH / 2 + 10);
  doc.setTextColor(...COLORS.green);
  doc.setFont("helvetica", "bold");
  doc.text(
    "QUICK WINS",
    matrixX + matrixW / 2 + 5,
    matrixChartY + matrixH / 2 + 10,
  );
  doc.setTextColor(...COLORS.darkBlue);
  doc.text("BOLD PLAYS", matrixX + matrixW / 2 + 5, matrixChartY + 10);

  // Plot some actions (simplified)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.5);

  const actions = [
    // Quick Wins (high impact, easy)
    {
      x: 0.75,
      y: 0.7,
      label: "Confirm licences\n& permits",
      color: COLORS.green,
    },
    {
      x: 0.8,
      y: 0.65,
      label: "Formalise\nfinancial records",
      color: COLORS.green,
    },
    { x: 0.7, y: 0.6, label: "Basic sales\ntracking", color: COLORS.green },

    // Bold Plays (high impact, hard)
    {
      x: 0.3,
      y: 0.75,
      label: "Implement\naccounting\nsoftware",
      color: COLORS.darkBlue,
    },
    {
      x: 0.35,
      y: 0.7,
      label: "Build commercial\ntraction",
      color: COLORS.darkBlue,
    },
    { x: 0.25, y: 0.65, label: "Formalise\ncontracts", color: COLORS.darkBlue },
    {
      x: 0.4,
      y: 0.8,
      label: "Prepare investor\ninformation pack",
      color: COLORS.darkBlue,
    },

    // Hard Slog (low impact, hard)
    { x: 0.2, y: 0.3, label: "Register IP\nassets", color: COLORS.gray },
    {
      x: 0.3,
      y: 0.25,
      label: "Build\ngovernance\nstructure",
      color: COLORS.gray,
    },
  ];

  actions.forEach((action) => {
    const pX = matrixX + action.x * matrixW;
    const pY = matrixChartY + matrixH - action.y * matrixH;

    if (action.color === COLORS.green) {
      doc.setFillColor(...COLORS.green);
      doc.circle(pX, pY, 3, "F");
    } else if (action.color === COLORS.darkBlue) {
      doc.setFillColor(...COLORS.darkBlue);
      doc.rect(pX - 3, pY - 3, 6, 6, "F");
    } else {
      doc.setDrawColor(...COLORS.gray);
      doc.setFillColor(255, 255, 255);
      doc.circle(pX, pY, 2.5, "FD");
    }

    doc.setTextColor(...COLORS.darkGray);
    const labelLines = action.label.split("\n");
    labelLines.forEach((line, i) => {
      doc.text(line, pX + 4, pY + i * 2);
    });
  });

  // Legend
  const legendY = matrixChartY + matrixH + 10;
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.darkGray);

  doc.setFillColor(...COLORS.green);
  doc.circle(matrixX + 10, legendY, 2, "F");
  doc.text("Quick Wins", matrixX + 15, legendY + 1);

  doc.setFillColor(...COLORS.darkBlue);
  doc.rect(matrixX + 45, legendY - 2, 4, 4, "F");
  doc.text("Bold Plays", matrixX + 52, legendY + 1);

  doc.setDrawColor(...COLORS.gray);
  doc.setFillColor(255, 255, 255);
  doc.circle(matrixX + 85, legendY, 2, "FD");
  doc.text("Lower Priority", matrixX + 90, legendY + 1);

  // Quick Wins section
  const qwY = matrixChartY + matrixH + 22;
  doc.setTextColor(...COLORS.darkBlue);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("QUICK WINS — ACT NOW (0–3 MONTHS)", 18, qwY);

  const quickWins = [
    {
      action: "Formalise financial records & engage acc...",
      domain: "Financial",
      priority: "HIGH",
    },
    {
      action: "Prepare investor information pack",
      domain: "Fundraising",
      priority: "HIGH",
    },
    {
      action: "Confirm all licences and permits are current",
      domain: "Legal",
      priority: "HIGH",
    },
    {
      action: "Document core operational processes",
      domain: "Operations",
      priority: "MEDIUM",
    },
    {
      action: "Establish basic sales tracking system",
      domain: "Commercial",
      priority: "HIGH",
    },
    {
      action: "Define and document value proposition",
      domain: "BM Viability",
      priority: "HIGH",
    },
  ];

  let tableY = qwY + 5;
  const colWidths = [85, 30, 20];

  quickWins.forEach((item, i) => {
    if (i % 2 === 0) {
      doc.setFillColor(60, 60, 60);
      doc.rect(
        18,
        tableY - 3,
        colWidths[0] + colWidths[1] + colWidths[2],
        5,
        "F",
      );
    }

    doc.setTextColor(...(i % 2 === 0 ? [180, 180, 180] : COLORS.darkGray));
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(item.action, 20, tableY);

    // Domain badge
    const domainColors = {
      Financial: COLORS.orange,
      Legal: [100, 100, 200],
      Operations: COLORS.green,
      Commercial: COLORS.red,
      Fundraising: [150, 100, 200],
      "BM Viability": [200, 150, 50],
    };

    doc.setFillColor(...(domainColors[item.domain] || COLORS.gray));
    doc.roundedRect(106, tableY - 3, 28, 4, 1, 1, "F");
    doc.setTextColor(...COLORS.white);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.text(item.domain, 120, tableY - 0.5, { align: "center" });

    // Priority badge
    const priorityColor = item.priority === "HIGH" ? COLORS.red : COLORS.orange;
    doc.setFillColor(...priorityColor);
    doc.roundedRect(136, tableY - 3, 18, 4, 1, 1, "F");
    doc.setTextColor(...COLORS.white);
    doc.text(item.priority, 145, tableY - 0.5, { align: "center" });

    tableY += 5.5;
  });

  // Bold Plays section
  const bpY = tableY + 5;
  doc.setTextColor(...COLORS.darkBlue);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("BOLD PLAYS — COMMIT & BUILD (3–18 MONTHS)", 18, bpY);

  const boldPlays = [
    {
      action: "Implement accounting software (e.g. Qui...",
      domain: "Financial",
      priority: "HIGH",
    },
    {
      action: "Build 12-month rolling cash flow forecast",
      domain: "Financial",
      priority: "HIGH",
    },
    {
      action: "Implement CRM and sales pipeline tools",
      domain: "Commercial",
      priority: "HIGH",
    },
    {
      action: "Formalise all supplier and client contracts",
      domain: "Legal",
      priority: "MEDIUM",
    },
    {
      action: "Build commercial traction and market pre...",
      domain: "Commercial",
      priority: "HIGH",
    },
    {
      action: "Establish board and governance structure",
      domain: "Governance",
      priority: "MEDIUM",
    },
  ];

  tableY = bpY + 5;
  boldPlays.forEach((item, i) => {
    if (i % 2 === 0) {
      doc.setFillColor(60, 60, 60);
      doc.rect(
        18,
        tableY - 3,
        colWidths[0] + colWidths[1] + colWidths[2],
        5,
        "F",
      );
    }

    doc.setTextColor(...(i % 2 === 0 ? [180, 180, 180] : COLORS.darkGray));
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(item.action, 20, tableY);

    const domainColors = {
      Financial: COLORS.orange,
      Legal: [100, 100, 200],
      Commercial: COLORS.red,
      Governance: [100, 150, 100],
    };

    doc.setFillColor(...(domainColors[item.domain] || COLORS.gray));
    doc.roundedRect(106, tableY - 3, 28, 4, 1, 1, "F");
    doc.setTextColor(...COLORS.white);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.text(item.domain, 120, tableY - 0.5, { align: "center" });

    const priorityColor = item.priority === "HIGH" ? COLORS.red : COLORS.orange;
    doc.setFillColor(...priorityColor);
    doc.roundedRect(136, tableY - 3, 18, 4, 1, 1, "F");
    doc.setTextColor(...COLORS.white);
    doc.text(item.priority, 145, tableY - 0.5, { align: "center" });

    tableY += 5.5;
  });

  // Page footer
  doc.setTextColor(...COLORS.white);
  doc.setFillColor(38, 45, 137);
  doc.rect(0, PH - 12, PW, 12, "F");
  doc.setFontSize(7);
  doc.text(
    `${businessName} — Capital Readiness Assessment Report`,
    PW / 2,
    PH - 6,
    { align: "center" },
  );
  doc.text("8 / 8", PW - 18, PH - 6);
}

/** Add page footer */
function addPageFooter(doc, businessName, pageNumber) {
  const PW = doc.internal.pageSize.width;
  const PH = doc.internal.pageSize.height;

  doc.setDrawColor(...COLORS.lightGray);
  doc.setLineWidth(0.3);
  doc.line(18, PH - 14, PW - 18, PH - 14);

  doc.setTextColor(...COLORS.gray);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(`${businessName} — Capital Readiness Assessment Report`, 18, PH - 9);
  doc.text(`${pageNumber} / 8`, PW - 18, PH - 9, { align: "right" });
}

// ─── Main PDF Builder ─────────────────────────────────────────────────────────

async function buildPDF(domainData, scoreData, userDetails, logoDataUrl) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const businessName = getBusinessName(userDetails);
  const overallScore = calcOverallScore(scoreData);
  const date = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Draw all pages
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

  // Save
  const safeTitle = businessName
    .replace(/[^a-zA-Z0-9]/g, "_")
    .replace(/_+/g, "_");
  const filename = `Capital_Readiness_Report_${safeTitle}_${Date.now()}.pdf`;
  doc.save(filename);
  return filename;
}

// ─── AI Content Generation Helpers ───────────────────────────────────────────

/**
 * Flatten domain data into an array for the AI prompt
 */
function flattenDomain(domainKey, domainData) {
  if (!domainData || typeof domainData !== "object") return [];
  const items = [];
  for (const section in domainData) {
    const sectionData = domainData[section];
    if (!sectionData || typeof sectionData !== "object") continue;
    for (const subDomain in sectionData) {
      const entry = sectionData[subDomain];
      if (entry && typeof entry === "object") {
        items.push({
          section,
          subDomain,
          score: entry.score ?? null,
          narrative: entry.narrative || "",
        });
      }
    }
  }
  return items;
}

/**
 * Build detailed AI prompt for report generation
 */
function buildPrompt(data, scoreData, userDetails) {
  const businessName = getBusinessName(userDetails);
  const overallScore = calcOverallScore(scoreData);

  const commercialItems = flattenDomain("commercial", data.commercial);
  const financialItems = flattenDomain("financial", data.financial);
  const operationsItems = flattenDomain("operations", data.operations);
  const legalItems = flattenDomain("legal", data.legal);

  return `You are an expert investment analyst preparing a formal Capital Readiness Assessment Report for a business named "${businessName}".

Business Profile:
- Business Name: ${businessName}
- Overall Capital Readiness Score: ${overallScore}%
- Commercial/Market Score: ${scoreData?.commercial?.percentage || 0}%
- Financial Score: ${scoreData?.financial?.percentage || 0}%
- Operations Score: ${scoreData?.operations?.percentage || 0}%
- Legal & Compliance Score: ${scoreData?.legal?.percentage || 0}%

Assessment Data:

COMMERCIAL/MARKET DOMAIN:
${JSON.stringify(commercialItems, null, 2)}

FINANCIAL DOMAIN:
${JSON.stringify(financialItems, null, 2)}

OPERATIONS DOMAIN:
${JSON.stringify(operationsItems, null, 2)}

LEGAL & COMPLIANCE DOMAIN:
${JSON.stringify(legalItems, null, 2)}

Based on the above assessment data, generate a comprehensive Capital Readiness Assessment Report with the following sections. Use professional, investor-oriented language. Be specific and reference actual scores and data points. The report should be thorough but concise.

Respond with a JSON object containing these fields:

{
  "executiveSummary": "2-3 paragraphs summarizing overall readiness, key strengths, main gaps, and recommended actions",
  "background": {
    "purpose": "2 paragraphs on why this CRAT assessment was conducted and its objectives",
    "definition": "2 paragraphs defining capital readiness and what it means for this specific business",
    "scopeAndMethodology": "2 paragraphs describing the four domains assessed and the scoring methodology"
  },
  "companyOverview": "3 paragraphs providing context on the business, its stage, sector, and assessment engagement",
  "assessmentOutcome": {
    "overallScore": "2 paragraphs interpreting the overall ${overallScore}% score and what it means",
    "domainScores": "2 paragraphs analyzing the variation across the four domain scores",
    "scoringMethodology": "2 paragraphs explaining the 0-2 scoring scale and aggregation method",
    "thresholdCriteria": "2 paragraphs on the 70% threshold and its significance"
  },
  "marketAssessment": "4 paragraphs analyzing commercial performance (${scoreData?.commercial?.percentage || 0}%), market position, competitive landscape, and recommendations",
  "financialAssessment": "4 paragraphs analyzing financial management (${scoreData?.financial?.percentage || 0}%), cash flow, record quality, and recommendations",
  "operationsAssessment": "4 paragraphs analyzing operational maturity (${scoreData?.operations?.percentage || 0}%), systems, team capacity, and recommendations",
  "legalAssessment": "4 paragraphs analyzing legal compliance (${scoreData?.legal?.percentage || 0}%), governance, IP, contracts, and recommendations",
  "riskAnalysis": {
    "commercialRisks": "3 paragraphs identifying commercial risks and mitigation strategies",
    "financialRisks": "3 paragraphs identifying financial risks and mitigation strategies",
    "operationalRisks": "3 paragraphs identifying operational risks and mitigation strategies",
    "legalRegulatoryRisks": "3 paragraphs identifying legal/regulatory risks and mitigation strategies"
  },
  "roadmap": {
    "immediate": "2 paragraphs outlining 0-3 month priority actions",
    "shortTerm": "2 paragraphs outlining 3-9 month improvement actions",
    "mediumTerm": "2 paragraphs outlining 9-18 month scaling actions",
    "projectedImprovement": "2 paragraphs on expected score improvements if roadmap is implemented"
  },
  "conclusion": "3 paragraphs with final assessment, key recommendations, and next steps"
}

Important: Return ONLY valid JSON. Do not include any text before or after the JSON object.`;
}

/**
 * Fallback content when AI fails
 */
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

/**
 * Generate AI content for Capital Readiness report
 * This is used by AIAnalysisPanel to generate formal report content
 */
export async function generateCapitalReadinessContent(
  data,
  scoreData,
  userDetails,
  onStatus,
) {
  try {
    onStatus?.("Generating report content with AI...");

    const prompt = buildPrompt(data, scoreData, userDetails);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.65,
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      console.error("OpenAI API error:", response.status, response.statusText);
      throw new Error(`OpenAI API returned ${response.status}`);
    }

    const result = await response.json();
    const rawContent = result.choices?.[0]?.message?.content || "";

    // Parse JSON from response
    let content;
    try {
      content = JSON.parse(rawContent);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      throw new Error("Invalid JSON from AI");
    }

    onStatus?.("AI content generated successfully");
    return { success: true, content };
  } catch (error) {
    console.error("generateCapitalReadinessContent error:", error);
    onStatus?.("AI generation failed, using fallback content");

    // Return fallback content
    const fallbackContent = buildFallback(scoreData, userDetails);
    return { success: false, content: fallbackContent };
  }
}

// ─── Main Export ──────────────────────────────────────────────────────────────

/**
 * Generate a Capital Readiness Assessment PDF
 */
export async function generateCapitalReadinessPDF(
  data,
  scoreData,
  userDetails,
  onStatus,
) {
  // Validate arguments BEFORE starting PDF generation
  if (!scoreData || typeof scoreData !== "object") {
    throw new Error("Invalid scoreData: must be an object with domain scores");
  }

  if (!userDetails || typeof userDetails !== "object") {
    throw new Error(
      "Invalid userDetails: must be an object with business information",
    );
  }

  // Check if scoreData has at least one domain with a valid percentage
  const domains = ["commercial", "financial", "operations", "legal"];
  const hasValidDomain = domains.some(
    (domain) =>
      scoreData[domain] &&
      typeof scoreData[domain].percentage === "number" &&
      !isNaN(scoreData[domain].percentage),
  );

  if (!hasValidDomain) {
    throw new Error(
      "Invalid scoreData: must contain at least one domain with a valid percentage score",
    );
  }

  // Only start showing status messages after validation passes
  onStatus?.("Preparing PDF report...");

  const logoDataUrl = await fetchImageAsBase64("/logo.png");

  onStatus?.("Building PDF...");
  const filename = await buildPDF(data, scoreData, userDetails, logoDataUrl);

  onStatus?.("Done!");
  return { success: true, filename };
}
