import OpenAI from "openai";
import jsPDF from "jspdf";
import { POPPINS_REGULAR, POPPINS_BOLD } from "./poppinsFont";

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

// ─── Capital Readiness PDF — modern blue design ──────────────────────────────
// Palette: the reference design uses a dark navy for its filled cards; per the
// brief every "dark" surface here is a deep BLUE instead.
const C = {
  ink: [15, 23, 42], // headings (slate-900)
  slate: [51, 65, 85], // body (slate-700)
  muted: [100, 116, 139], // secondary (slate-500)
  faint: [148, 163, 184], // captions (slate-400)
  line: [226, 232, 240], // borders (slate-200)
  track: [226, 232, 240], // bar / donut track
  cardBg: [248, 250, 252], // light card fill (slate-50)
  softBlue: [219, 234, 254], // blue-100 pill bg
  blue: [37, 99, 235], // primary blue (blue-600)
  blueMid: [59, 130, 246], // blue-500
  blueDeep: [30, 58, 138], // deep blue card background (was dark navy)
  blueLine: [51, 78, 160], // dividers on deep-blue cards
  blueTrack: [71, 99, 175], // donut track on deep-blue cards
  blueSoft: [191, 219, 254], // labels on deep-blue cards (blue-200)
  amber: [245, 158, 11], // eyebrow / accent (amber-500)
  gold: [234, 179, 8], // overall gauge arc
  green: [22, 163, 74], // ready / on-track
  greenSoft: [187, 247, 208],
  greenText: [134, 239, 172],
  red: [220, 38, 38], // not-ready / high-risk
  redSoft: [254, 226, 226],
  redText: [252, 165, 165],
  white: [255, 255, 255],
};

// A5 landscape: 210mm wide x 148mm tall (same width as A4 portrait, half the height).
const PW = 210;
const PH = 148;
const M = 12;
const CW = PW - 2 * M; // content width

// Report typeface — Poppins (embedded); falls back to helvetica if the font
// fails to register in the current jsPDF build.
let FONT = "Poppins";

// Running section number; reset at the start of each report build.
let SECTION_NO = 0;

function registerFonts(doc) {
  try {
    doc.addFileToVFS("Poppins-Regular.ttf", POPPINS_REGULAR);
    doc.addFont("Poppins-Regular.ttf", "Poppins", "normal");
    doc.addFileToVFS("Poppins-SemiBold.ttf", POPPINS_BOLD);
    doc.addFont("Poppins-SemiBold.ttf", "Poppins", "bold");
    doc.setFont("Poppins", "normal");
    FONT = "Poppins";
  } catch (e) {
    console.warn("Poppins font registration failed, using default:", e.message);
    FONT = "helvetica";
  }
}

// The overall score is a simple average of the four domains. The weights below
// are informational — they express each domain's relative importance for
// prioritising interventions — and drive the methodology table. Sum to 1.
const DOMAINS = [
  {
    key: "commercial",
    label: "Commercial",
    sub: "Market",
    full: "Commercial / Market",
    weight: 0.25,
    basis: "Revenue predictability and market traction underpin the investment case.",
  },
  {
    key: "financial",
    label: "Financial",
    sub: "Management",
    full: "Financial Management",
    weight: 0.35,
    basis: "Highest weight: financial transparency, controls and reporting are the primary determinant of capital readiness.",
  },
  {
    key: "operations",
    label: "Operations",
    sub: "Resilience",
    full: "Operations",
    weight: 0.15,
    basis: "Delivery resilience and scalability; material, but lower leverage on the funding decision.",
  },
  {
    key: "legal",
    label: "Legal",
    sub: "Compliance",
    full: "Legal & Compliance",
    weight: 0.25,
    basis: "Compliance, licensing and governance are gating items for investor due diligence.",
  },
];

// Per-domain narrative content: a short tailored gap description, the detailed
// findings (observations) and the recommended capacity interventions.
const DOMAIN_CONTENT = {
  commercial: {
    // gapTitle is the bold lead-in on the one-page report; gap is the body.
    gapTitle:
      "Weak commercial systems limiting predictable and scalable revenue growth",
    gap: "Revenue is being generated, but the commercial engine still runs on informal, undocumented routines. There is no defined sales pipeline, market positioning is held tacitly rather than written down, and acquisition and retention are not measured. For investors this translates directly into uncertainty about how repeatable and predictable future revenue really is.",
    intro:
      "Commercial capability was assessed across the sales process, market positioning, and customer acquisition and retention.",
    findings: [
      "The sales process and revenue pipeline operate without documented stages, ownership or conversion tracking, which makes forecasting unreliable.",
      "Market positioning and competitor intelligence are understood by the founder but are not documented or shared across the team.",
      "Customer acquisition and retention run without measurable targets, so channel performance and churn cannot be actively managed.",
    ],
    recs: [
      "Document the end-to-end sales process with defined stages, owners and conversion metrics, and review it monthly.",
      "Maintain a living market-positioning and competitor-intelligence brief that informs pricing and messaging.",
      "Adopt CRM-based pipeline tracking with explicit customer acquisition and retention KPIs.",
    ],
  },
  financial: {
    gapTitle:
      "Limited financial planning and reporting reducing investment readiness",
    gap: "Core financial management is operating, but reporting and forecasting fall short of the standard investors expect during due diligence. Cash-flow is not modelled forward, records are not yet investor-grade, and management reporting lacks a regular cadence — all of which limit confidence in the numbers.",
    intro:
      "Financial capability was assessed across record quality, management reporting, cash-flow forecasting and controls.",
    findings: [
      "Cash-flow is not formalised into a rolling forward-looking model, leaving liquidity risk unmanaged as the business scales.",
      "Financial records are maintained but are not yet investor-grade and have not been independently reviewed.",
      "Accounting systems and management reporting lack the controls and monthly cadence investors expect.",
    ],
    recs: [
      "Implement accounting software and produce disciplined monthly management accounts.",
      "Build and maintain a rolling 12-month cash-flow forecast tied to the operating plan.",
      "Prepare investor-grade financial statements and arrange an independent review or audit.",
    ],
  },
  operations: {
    gapTitle:
      "High operational dependency caused by undocumented processes and weak performance management",
    gap: "Operational delivery works at the current scale, but it depends on undocumented, person-dependent routines. Processes live in people's heads, key functions rest on individuals, and performance is not tracked against targets — which caps resilience and makes scaling risky.",
    intro:
      "Operational capability was assessed across process documentation, key-person dependency and performance management.",
    findings: [
      "Core operating processes and standard procedures are not documented, so quality depends on specific individuals.",
      "There is significant key-person dependency across critical functions, creating business-continuity risk.",
      "Performance is not consistently tracked against defined KPIs, which limits operational visibility.",
    ],
    recs: [
      "Document core processes and standard operating procedures for all critical functions.",
      "Reduce key-person dependency through delegation, cross-training and succession planning.",
      "Define operational KPIs and link them to a regular performance-management routine.",
    ],
  },
  legal: {
    gapTitle:
      "Incomplete governance and compliance framework increasing due diligence risk",
    gap: "Foundational legal structures are in place, but governance, contracts and compliance records are incomplete. Licences and agreements are not consolidated, compliance gaps remain open, and intellectual property and oversight are not fully established — the issues most likely to stall or derail investor due diligence.",
    intro:
      "Legal capability was assessed across registration, contracts, regulatory compliance, intellectual property and governance.",
    findings: [
      "Licences, permits, contracts and governance records require review and consolidation into a single verifiable set.",
      "Compliance gaps remain open that could delay or complicate investor due diligence.",
      "Intellectual property is unregistered and formal oversight and decision-rights structures are not established.",
    ],
    recs: [
      "Review and consolidate licences, permits and key contracts into a diligence-ready pack.",
      "Close outstanding compliance gaps and formalise governance and oversight structures.",
      "Register intellectual property and document board composition and decision rights.",
    ],
  },
};

// ─── Shared helpers ──────────────────────────────────────────────────────────

function clamp(v, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(Number(v || 0))));
}

// Overall score: simple average of the four domain scores.
function calcOverallScore(scoreData) {
  const vals = DOMAINS.map((d) => scoreData?.[d.key]?.percentage || 0);
  return Math.round(vals.reduce((a, b) => a + b, 0) / (vals.length || 1));
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

function getBusinessProfile(userDetails) {
  const b = userDetails?.Business || {};
  const pick = (...keys) => {
    for (const k of keys) {
      const v = b[k];
      if (v != null && String(v).trim() !== "") return String(v).trim();
    }
    return "";
  };
  return {
    sector: pick("sector", "businessSector", "industry"),
    location: pick("location", "businessLocation", "region", "address"),
    stage: pick("stage", "businessStage"),
    founded: pick("foundedYear", "yearFounded", "establishedYear"),
    team: pick("employees", "teamSize", "numberOfEmployees"),
    website: pick("website", "url"),
  };
}

const pctOf = (sd, k) => clamp(sd?.[k]?.percentage || 0);
const domainColor = (p) => (p >= 70 ? C.blue : C.red);

function maturityLabel(pct) {
  const tiers = ["Basic", "Developing", "Progressing", "Advanced", "Leading"];
  return tiers[Math.min(4, Math.floor(clamp(pct) / 20))];
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

// ─── Drawing primitives ──────────────────────────────────────────────────────

function card(doc, x, y, w, h, opt = {}) {
  const r = opt.radius ?? 3;
  doc.setFillColor(...(opt.fill || C.white));
  doc.roundedRect(x, y, w, h, r, r, "F");
  if (opt.border) {
    doc.setDrawColor(...opt.border);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, w, h, r, r, "S");
  }
}

function eyebrow(doc, text, x, y, color) {
  doc.setFont(FONT, "bold");
  doc.setFontSize(8);
  doc.setTextColor(...(color || C.ink));
  doc.text(text, x, y, { charSpace: 0.5 });
}

function wrap(doc, text, x, y, w, lh, fs, color) {
  doc.setFont(FONT, "normal");
  doc.setFontSize(fs || 9);
  doc.setTextColor(...(color || C.slate));
  const lines = doc.splitTextToSize(String(text || ""), w);
  lines.forEach((l, i) => doc.text(l, x, y + i * lh));
  return y + lines.length * lh;
}

// Filled ring / arc (used by the donut gauges).
function ringArc(doc, cx, cy, rIn, rOut, color, a1, a2, segs = 64) {
  doc.setFillColor(...color);
  const step = (a2 - a1) / segs;
  for (let i = 0; i < segs; i += 1) {
    const p1 = a1 + i * step;
    const p2 = p1 + step;
    const x1 = cx + rIn * Math.cos(p1);
    const y1 = cy + rIn * Math.sin(p1);
    const x2 = cx + rOut * Math.cos(p1);
    const y2 = cy + rOut * Math.sin(p1);
    const x3 = cx + rOut * Math.cos(p2);
    const y3 = cy + rOut * Math.sin(p2);
    const x4 = cx + rIn * Math.cos(p2);
    const y4 = cy + rIn * Math.sin(p2);
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

function donut(doc, cx, cy, r, pct, o) {
  const th = o.thickness || 6;
  const rIn = r - th;
  ringArc(doc, cx, cy, rIn, r, o.track, 0, Math.PI * 2);
  const s = -Math.PI / 2;
  const e = s + (clamp(pct) / 100) * 2 * Math.PI;
  if (clamp(pct) > 0) {
    ringArc(doc, cx, cy, rIn, r, o.arc, s, e);
    const cr = (rIn + r) / 2;
    doc.setFillColor(...o.arc);
    doc.circle(cx + cr * Math.cos(s), cy + cr * Math.sin(s), th / 2, "F");
    doc.circle(cx + cr * Math.cos(e), cy + cr * Math.sin(e), th / 2, "F");
  }
  const big = o.big || 16;
  doc.setFont(FONT, "bold");
  doc.setFontSize(big);
  doc.setTextColor(...o.textColor);
  doc.text(`${clamp(pct)}%`, cx, cy + big * 0.125, { align: "center" });
  if (o.sub) {
    doc.setFont(FONT, "normal");
    doc.setFontSize(6.2);
    doc.setTextColor(...(o.subColor || C.faint));
    doc.text(o.sub, cx, cy + big * 0.125 + 4.5, { align: "center" });
  }
}

// Radial tick across a gauge ring marking a threshold (e.g. the 70% line).
function gaugeThresholdTick(doc, cx, cy, rIn, rOut, pctMark, color) {
  const a = -Math.PI / 2 + (clamp(pctMark) / 100) * 2 * Math.PI;
  doc.setDrawColor(...color);
  doc.setLineWidth(0.8);
  doc.line(
    cx + rIn * Math.cos(a),
    cy + rIn * Math.sin(a),
    cx + rOut * Math.cos(a),
    cy + rOut * Math.sin(a),
  );
}

// Pill / badge. opt: { bg, fg, dot, center, fs, h }
function pill(doc, x, y, text, opt) {
  const fs = opt.fs || 8;
  doc.setFont(FONT, "bold");
  doc.setFontSize(fs);
  const tw = doc.getTextWidth(text);
  const hasDot = opt.dot != null;
  const pw = tw + (hasDot ? 12 : 8);
  const h = opt.h || 7.5;
  const px = opt.center ? x - pw / 2 : x;
  doc.setFillColor(...opt.bg);
  doc.roundedRect(px, y, pw, h, h / 2, h / 2, "F");
  if (hasDot) {
    doc.setFillColor(...opt.dot);
    doc.circle(px + 5, y + h / 2, 1.3, "F");
    doc.setTextColor(...opt.fg);
    doc.text(text, px + 9, y + h / 2 + fs * 0.16 + 0.2);
  } else {
    doc.setTextColor(...opt.fg);
    doc.text(text, px + pw / 2, y + h / 2 + fs * 0.16 + 0.2, { align: "center" });
  }
  return pw;
}

// Right-anchored pill; returns its left edge x.
function pillRight(doc, xRight, y, text, bg, fg) {
  doc.setFont(FONT, "bold");
  doc.setFontSize(6.8);
  const pw = doc.getTextWidth(text) + 8;
  const h = 6;
  const x = xRight - pw;
  doc.setFillColor(...bg);
  doc.roundedRect(x, y, pw, h, h / 2, h / 2, "F");
  doc.setTextColor(...fg);
  doc.text(text, x + pw / 2, y + 4.1, { align: "center" });
  return x;
}

function callout(doc, x, y, w, title, body, accent) {
  const lines = doc.splitTextToSize(String(body || ""), w - 16);
  const h = 15 + lines.length * 4.4 + 4;
  card(doc, x, y, w, h, { fill: C.cardBg, radius: 3 });
  doc.setFillColor(...accent);
  doc.roundedRect(x, y, 2.4, h, 1, 1, "F");
  eyebrow(doc, title, x + 8, y + 10, accent);
  doc.setFont(FONT, "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...C.slate);
  lines.forEach((l, i) => doc.text(l, x + 8, y + 17 + i * 4.4));
  return y + h;
}

// Page header + footer chrome (drawn on every page).
function chrome(doc, businessName) {
  doc.setFont(FONT, "bold");
  doc.setFontSize(8);
  doc.setTextColor(...C.faint);
  doc.text("CAPITAL READINESS ASSESSMENT", M, 12.3, { charSpace: 0.6 });

  doc.setFont(FONT, "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...C.faint);
  doc.text(String(businessName), M, PH - 10);
}

// Inline section heading (number + title + sub) at the top of a section's
// first content page; returns the content start-Y.
function sectionHead(doc, num, title, sub) {
  doc.setFont(FONT, "bold");
  doc.setFontSize(11);
  doc.setTextColor(...C.amber);
  doc.text(num, M, 23);
  const numW = doc.getTextWidth(num);
  doc.setFontSize(15);
  doc.setTextColor(...C.ink);
  doc.text(title, M + numW + 4, 23);

  doc.setFont(FONT, "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...C.muted);
  const lines = doc.splitTextToSize(String(sub || ""), CW - 4);
  lines.forEach((l, i) => doc.text(l, M, 30 + i * 4.4));
  return 30 + lines.length * 4.4 + 5;
}

function maturityBand(doc, x, y, w, pct) {
  const tiers = ["Basic", "Developing", "Progressing", "Advanced", "Leading"];
  const seg = w / 5;
  const gap = 3;
  const sw = seg - gap;
  const idx = Math.min(4, Math.floor(clamp(pct) / 20));
  tiers.forEach((t, i) => {
    const sx = x + i * seg;
    doc.setFillColor(...(i === idx ? C.amber : C.track));
    doc.roundedRect(sx, y, sw, 5, 2, 2, "F");
    doc.setFont(FONT, i === idx ? "bold" : "normal");
    doc.setFontSize(8);
    doc.setTextColor(...(i === idx ? C.ink : C.muted));
    doc.text(t, sx + sw / 2, y + 12, { align: "center" });
  });
  const cx = x + idx * seg + sw / 2;
  const label = `You are here · ${clamp(pct)}%`;
  doc.setFont(FONT, "bold");
  doc.setFontSize(7);
  const pw = doc.getTextWidth(label) + 8;
  doc.setFillColor(...C.ink);
  doc.roundedRect(cx - pw / 2, y - 11, pw, 7, 3, 3, "F");
  doc.setTextColor(...C.white);
  doc.text(label, cx, y - 6.3, { align: "center" });
}

// Continued-page heading (for sections that overflow onto another page).
function contHead(doc, num, title) {
  doc.setFont(FONT, "bold");
  doc.setFontSize(11);
  doc.setTextColor(...C.amber);
  doc.text(num, M, 23);
  const numW = doc.getTextWidth(num);
  doc.setFontSize(15);
  doc.setTextColor(...C.ink);
  doc.text(`${title} (continued)`, M + numW + 4, 23);
  return 30;
}

// ─── Pages ───────────────────────────────────────────────────────────────────

function drawCover(doc, ctx) {
  const { name, overall, date } = ctx;
  chrome(doc, name);

  // Left: eyebrow, title, subtitle. Right: overall score card.
  const leftW = 112;

  doc.setFont(FONT, "bold");
  doc.setFontSize(8);
  doc.setTextColor(...C.amber);
  doc.text("CAPITAL READINESS ASSESSMENT", M, 40, { charSpace: 1.2 });

  doc.setFont(FONT, "bold");
  doc.setFontSize(23);
  doc.setTextColor(...C.ink);
  const titleLines = doc.splitTextToSize(name, leftW).slice(0, 3);
  let ty = 54;
  titleLines.forEach((l) => {
    doc.text(l, M, ty);
    ty += 9.5;
  });

  doc.setFont(FONT, "normal");
  doc.setFontSize(9);
  doc.setTextColor(...C.muted);
  const sub =
    "An independent evaluation of investment readiness across commercial, financial, operational and legal domains — with a structured 18-month improvement roadmap.";
  doc.splitTextToSize(sub, leftW).forEach((l, i) => doc.text(l, M, ty + 3 + i * 4.6));

  // Overall score card (deep blue), right column.
  const cardX = M + leftW + 10;
  const cardW = CW - leftW - 10;
  const cardY = 36;
  const cardH = 76;
  card(doc, cardX, cardY, cardW, cardH, { fill: C.blueDeep, radius: 5 });
  doc.setFont(FONT, "bold");
  doc.setFontSize(7);
  doc.setTextColor(...C.blueSoft);
  doc.text("OVERALL READINESS SCORE", cardX + cardW / 2, cardY + 11, {
    align: "center",
    charSpace: 0.5,
  });
  donut(doc, cardX + cardW / 2, cardY + 35, 17, overall, {
    thickness: 5,
    track: C.blueTrack,
    arc: C.gold,
    textColor: C.white,
    big: 16,
  });
  gaugeThresholdTick(doc, cardX + cardW / 2, cardY + 35, 12, 17, 70, C.white);
  doc.setFont(FONT, "bold");
  doc.setFontSize(8);
  doc.setTextColor(...C.white);
  doc.text(
    overall >= 70 ? "Meets the 70% threshold" : "Below the 70% threshold",
    cardX + cardW / 2,
    cardY + 60,
    { align: "center" },
  );
  pill(
    doc,
    cardX + cardW / 2,
    cardY + 64,
    overall >= 70 ? "Investment ready" : "Not yet investment ready",
    {
      bg: C.blueLine,
      fg: overall >= 70 ? C.greenText : C.redText,
      dot: overall >= 70 ? C.green : C.red,
      center: true,
      fs: 6.5,
      h: 6.5,
    },
  );

  doc.setDrawColor(...C.line);
  doc.setLineWidth(0.3);
  doc.line(M, 122, PW - M, 122);
  doc.setFont(FONT, "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...C.muted);
  doc.text(`Prepared on ${date} · Dar es Salaam, Tanzania`, M, 128);
  doc.text("Confidential · CRAT Framework", PW - M, 128, { align: "right" });
}

function drawProfile(doc, ctx) {
  const { name, overall, date, profile } = ctx;
  const y = beginSection(
    doc,
    name,
    "Company Profile",
    `Who ${name} is, and the context of this capital readiness assessment.`,
  ).y;

  const leftW = 116;
  const rightX = M + leftW + 8;
  const rightW = CW - leftW - 8;

  // Left: company overview + at a glance.
  let ly = y;
  eyebrow(doc, "COMPANY OVERVIEW", M, ly);
  ly += 6;
  const overview = `${name} is a ${profile.sector || "growing"} company operating in ${
    profile.location || "Tanzania"
  }. This report evaluates its readiness to raise external capital across four domains — commercial, financial, operational, and legal & compliance — using the Capital Readiness Assessment (CRAT) framework, and sets out the roadmap required to reach investment readiness.`;
  ly = wrap(doc, overview, M, ly, leftW, 4.2, 8) + 5;

  eyebrow(doc, "AT A GLANCE", M, ly);
  ly += 6;
  const glance = [
    ["SECTOR", profile.sector || "—"],
    ["HEADQUARTERS", profile.location || "—"],
    ["ASSESSMENT", "Capital Readiness (CRAT)"],
    ["ASSESSMENT DATE", date],
    ["FOCUS", "Investment Readiness"],
    ["READINESS THRESHOLD", "70%"],
  ];
  const gcW = (leftW - 6) / 2;
  const gcH = 13;
  glance.forEach((g, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const gx = M + col * (gcW + 6);
    const gy = ly + row * (gcH + 3);
    card(doc, gx, gy, gcW, gcH, { fill: C.cardBg, radius: 2.5 });
    doc.setFont(FONT, "bold");
    doc.setFontSize(6);
    doc.setTextColor(...C.faint);
    doc.text(g[0], gx + 4, gy + 5, { charSpace: 0.3 });
    doc.setFont(FONT, "bold");
    doc.setFontSize(8);
    doc.setTextColor(...C.ink);
    doc.text(doc.splitTextToSize(g[1], gcW - 8)[0], gx + 4, gy + 10.5);
  });
  // Right: deep-blue assessment snapshot.
  const snapH = 80;
  card(doc, rightX, y, rightW, snapH, { fill: C.blueDeep, radius: 4 });
  doc.setFont(FONT, "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(...C.blueSoft);
  doc.text("ASSESSMENT SNAPSHOT", rightX + rightW / 2, y + 10, {
    align: "center",
    charSpace: 0.5,
  });
  donut(doc, rightX + rightW / 2, y + 33, 15, overall, {
    thickness: 5,
    track: C.blueTrack,
    arc: C.gold,
    textColor: C.white,
    big: 14,
  });
  let sy = y + 60;
  doc.setDrawColor(...C.blueLine);
  doc.setLineWidth(0.3);
  doc.line(rightX + 8, sy - 4, rightX + rightW - 8, sy - 4);
  doc.setFont(FONT, "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...C.blueSoft);
  doc.text("Maturity", rightX + 8, sy);
  doc.setFont(FONT, "bold");
  doc.setTextColor(...C.white);
  doc.text(maturityLabel(overall), rightX + rightW - 8, sy, { align: "right" });
  sy += 12;
  doc.setDrawColor(...C.blueLine);
  doc.line(rightX + 8, sy - 4, rightX + rightW - 8, sy - 4);
  doc.setFont(FONT, "normal");
  doc.setTextColor(...C.blueSoft);
  doc.text("Status", rightX + 8, sy);
  doc.setFont(FONT, "bold");
  doc.setTextColor(...(overall >= 70 ? C.greenText : C.redText));
  doc.text(overall >= 70 ? "Ready" : "Not ready", rightX + rightW - 8, sy, {
    align: "right",
  });

}

function drawOverallFindings(doc, ctx) {
  const { name, overall, scoreData } = ctx;
  const ml = maturityLabel(overall);
  const ready = overall >= 70;
  const st = beginSection(
    doc,
    name,
    "Overall Findings",
    "Maturity level and readiness by domain, measured against the 70% threshold.",
  );
  const y = st.y;

  // Maturity band.
  card(doc, M, y, CW, 42, { fill: C.white, border: C.line, radius: 3 });
  eyebrow(doc, "STARTUP MATURITY RATING", M + 8, y + 12);
  maturityBand(doc, M + 8, y + 25, CW - 16, overall);

  // Readiness by domain — one gauge per domain.
  const gY = y + 48;
  const gH = 52;
  card(doc, M, gY, CW, gH, { fill: C.white, border: C.line, radius: 3 });
  eyebrow(doc, "READINESS BY DOMAIN", M + 8, gY + 10);
  doc.setFont(FONT, "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...C.amber);
  doc.text("| 70% threshold", PW - M - 8, gY + 10, { align: "right" });

  const cellW = (CW - 16) / 4;
  const gaugeR = 12;
  const gaugeTh = 4;
  DOMAINS.forEach((d, i) => {
    const p = pctOf(scoreData, d.key);
    const cx = M + 8 + i * cellW + cellW / 2;
    const cy = gY + 28;
    donut(doc, cx, cy, gaugeR, p, {
      thickness: gaugeTh,
      track: C.track,
      arc: domainColor(p),
      textColor: C.ink,
      big: 10,
    });
    gaugeThresholdTick(doc, cx, cy, gaugeR - gaugeTh, gaugeR, 70, C.amber);
    doc.setFont(FONT, "bold");
    doc.setFontSize(8);
    doc.setTextColor(...C.ink);
    doc.text(d.label, cx, gY + 45, { align: "center" });
    doc.setFont(FONT, "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...C.muted);
    doc.text(d.sub, cx, gY + 49, { align: "center" });
  });

  // Overall readiness + narrative continue on the next page (A5 landscape).
  doc.addPage();
  chrome(doc, name);
  const oY = contHead(doc, st.num, "Overall Findings");
  const oH = 40;
  card(doc, M, oY, CW, oH, { fill: C.blueDeep, radius: 4 });
  donut(doc, M + 28, oY + 20, 14, overall, {
    thickness: 4.5,
    track: C.blueTrack,
    arc: C.gold,
    textColor: C.white,
    big: 13,
  });
  gaugeThresholdTick(doc, M + 28, oY + 20, 9.5, 14, 70, C.white);
  doc.setFont(FONT, "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...C.blueSoft);
  doc.text("OVERALL READINESS", M + 52, oY + 13, { charSpace: 0.5 });
  doc.setFont(FONT, "bold");
  doc.setFontSize(11);
  doc.setTextColor(...C.white);
  doc.text(
    `${overall}% · ${ml} — ${ready ? "Investment ready" : "Not yet investment ready"}`,
    M + 52,
    oY + 23,
  );
  doc.setFont(FONT, "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...C.blueSoft);
  doc.text(
    "Measured against a 70% investment-readiness threshold.",
    M + 52,
    oY + 31,
  );

  // Narrative.
  const grade = DOMAINS.filter((d) => pctOf(scoreData, d.key) >= 70).map((d) => d.label);
  const risk = DOMAINS.filter((d) => pctOf(scoreData, d.key) < 70).map((d) => d.label);
  const narrative = `${name} achieved an overall Capital Readiness Score of ${overall}%, placing it at the "${ml}" maturity level.${
    grade.length
      ? ` ${grade.join(" and ")} ${grade.length > 1 ? "are" : "is"} investment-grade.`
      : ""
  }${
    risk.length
      ? ` ${risk.join(" and ")} ${risk.length > 1 ? "carry" : "carries"} the highest-risk capability gaps.`
      : ""
  } Overall the business is ${
    ready ? "investment-ready" : "not yet investment-ready"
  }; the sections that follow detail the thematic gaps, domain findings and recommended interventions.`;
  callout(doc, M, oY + oH + 8, CW, "READINESS LEVEL", narrative, C.blue);
}

function drawDetailedFindings(doc, ctx) {
  const { name, scoreData } = ctx;
  const st = beginSection(
    doc,
    name,
    "Detailed Findings",
    "Domain-by-domain observations recorded during the assessment.",
  );
  let y = st.y;
  const limit = PH - 16;

  DOMAINS.forEach((d) => {
    const p = pctOf(scoreData, d.key);
    const ready = p >= 70;
    const introLines = doc.splitTextToSize(DOMAIN_CONTENT[d.key].intro, CW - 16);
    const findingLines = DOMAIN_CONTENT[d.key].findings.map((t) =>
      doc.splitTextToSize(t, CW - 24),
    );
    const findingsH = findingLines.reduce((s, l) => s + l.length * 4.3 + 3.5, 0);
    const h = 18 + introLines.length * 4.2 + 4 + findingsH + 4;
    if (y + h > limit) {
      doc.addPage();
      chrome(doc, name);
      y = contHead(doc, st.num, "Detailed Findings");
    }

    card(doc, M, y, CW, h, { fill: C.white, border: C.line, radius: 3 });
    doc.setFillColor(...(ready ? C.blue : C.red));
    doc.roundedRect(M, y, 2.4, h, 1, 1, "F");

    doc.setFont(FONT, "bold");
    doc.setFontSize(11);
    doc.setTextColor(...C.ink);
    doc.text(d.full, M + 8, y + 13);
    pillRight(
      doc,
      M + CW - 8,
      y + 8,
      `${p}%`,
      ready ? C.softBlue : C.redSoft,
      ready ? C.blue : C.red,
    );

    doc.setFont(FONT, "normal");
    doc.setFontSize(8);
    doc.setTextColor(...C.muted);
    introLines.forEach((l, li) => doc.text(l, M + 8, y + 20 + li * 4.2));

    let by = y + 20 + introLines.length * 4.2 + 5;
    findingLines.forEach((l) => {
      doc.setFont(FONT, "bold");
      doc.setFontSize(8);
      doc.setTextColor(...domainColor(p));
      doc.text("›", M + 8, by);
      doc.setFont(FONT, "normal");
      doc.setTextColor(...C.slate);
      l.forEach((ln, li) => doc.text(ln, M + 13, by + li * 4.3));
      by += l.length * 4.3 + 3.5;
    });

    y += h + 6;
  });
}

function drawRecommendations(doc, ctx) {
  const { name, scoreData } = ctx;
  const st = beginSection(
    doc,
    name,
    "Recommendations",
    "Targeted capacity interventions to close the gap in each domain.",
  );
  let y = st.y;
  const limit = PH - 16;

  DOMAINS.forEach((d) => {
    const p = pctOf(scoreData, d.key);
    const ready = p >= 70;
    const recLines = DOMAIN_CONTENT[d.key].recs.map((t) =>
      doc.splitTextToSize(t, CW - 26),
    );
    const recsH = recLines.reduce((s, l) => s + l.length * 4.3 + 4, 0);
    const h = 24 + recsH + 4;
    if (y + h > limit) {
      doc.addPage();
      chrome(doc, name);
      y = contHead(doc, st.num, "Recommendations");
    }

    card(doc, M, y, CW, h, { fill: C.cardBg, radius: 3 });
    doc.setFillColor(...C.blue);
    doc.roundedRect(M, y, CW, 2.4, 1, 1, "F");

    doc.setFont(FONT, "bold");
    doc.setFontSize(11);
    doc.setTextColor(...C.ink);
    doc.text(d.full, M + 8, y + 14);
    pillRight(
      doc,
      M + CW - 8,
      y + 9,
      `${p}%`,
      ready ? C.softBlue : C.redSoft,
      ready ? C.blue : C.red,
    );

    let by = y + 25;
    recLines.forEach((l) => {
      doc.setFillColor(...C.blue);
      doc.circle(M + 9, by - 1.4, 1.5, "F");
      doc.setFont(FONT, "normal");
      doc.setFontSize(8);
      doc.setTextColor(...C.slate);
      l.forEach((ln, li) => doc.text(ln, M + 14, by + li * 4.3));
      by += l.length * 4.3 + 4;
    });

    y += h + 6;
  });
}

function drawGaps(doc, ctx) {
  const { name, scoreData } = ctx;
  const st = beginSection(
    doc,
    name,
    "Key Thematic Gaps",
    "The defining capability gap in each domain, with a tailored read on what it means for investment readiness.",
  );
  let y = st.y;
  const limit = PH - 16;

  DOMAINS.forEach((d) => {
    const p = pctOf(scoreData, d.key);
    const ready = p >= 70;
    const lines = doc.splitTextToSize(DOMAIN_CONTENT[d.key].gap, CW - 16);
    const h = 22 + lines.length * 4.6 + 6;
    if (y + h > limit) {
      doc.addPage();
      chrome(doc, name);
      y = contHead(doc, st.num, "Key Thematic Gaps");
    }

    card(doc, M, y, CW, h, { fill: C.white, border: C.line, radius: 3 });
    doc.setFillColor(...(ready ? C.blue : C.red));
    doc.roundedRect(M, y, 2.4, h, 1, 1, "F");

    doc.setFont(FONT, "bold");
    doc.setFontSize(11.5);
    doc.setTextColor(...C.ink);
    doc.text(d.full, M + 8, y + 13);
    const pillLeft = pillRight(
      doc,
      M + CW - 8,
      y + 8,
      ready ? "ON TRACK" : "HIGH RISK",
      ready ? C.softBlue : C.redSoft,
      ready ? C.blue : C.red,
    );
    doc.setFont(FONT, "bold");
    doc.setFontSize(12);
    doc.setTextColor(...domainColor(p));
    doc.text(`${p}%`, pillLeft - 4, y + 13, { align: "right" });

    doc.setFont(FONT, "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...C.slate);
    lines.forEach((l, li) => doc.text(l, M + 8, y + 22 + li * 4.6));

    y += h + 6;
  });
}

function drawInitiatives(doc, ctx) {
  const { name } = ctx;
  const st = beginSection(
    doc,
    name,
    "Prioritisation",
    "Quick wins are high-impact actions requiring fewer resources — sequence them first. Bold plays require more effort but deliver greater readiness gains.",
  );
  const y = st.y;
  const limit = PH - 16;

  const groups = [
    {
      title: "QUICK WINS",
      subtitle: "High impact · fewer resources · sequence first",
      start: 1,
      items: [
        "Formalise financial records",
        "Confirm licences & permits",
        "Document core processes",
      ],
    },
    {
      title: "BOLD PLAYS",
      subtitle: "Greater effort · greater readiness gains",
      start: 4,
      items: [
        "Implement CRM pipeline tracking",
        "Build a rolling cash-flow forecast",
        "Prepare audited financials",
        "Establish a governance structure",
        "Register intellectual-property assets",
      ],
    },
  ];

  let gy = y;
  groups.forEach((g) => {
    const h = 26 + g.items.length * 10 + 4;
    if (gy + h > limit) {
      doc.addPage();
      chrome(doc, name);
      gy = contHead(doc, st.num, "Prioritisation");
    }
    card(doc, M, gy, CW, h, { fill: C.cardBg, radius: 3 });
    doc.setFillColor(...C.blue);
    doc.roundedRect(M, gy, CW, 2.4, 1, 1, "F");
    doc.setFillColor(...C.blue);
    doc.circle(M + 10, gy + 13, 1.6, "F");
    doc.setFont(FONT, "bold");
    doc.setFontSize(10);
    doc.setTextColor(...C.blue);
    doc.text(g.title, M + 15, gy + 14, { charSpace: 0.4 });
    doc.setFont(FONT, "normal");
    doc.setFontSize(8);
    doc.setTextColor(...C.muted);
    doc.text(g.subtitle, M + CW - 8, gy + 14, { align: "right" });

    let iy = gy + 27;
    g.items.forEach((t, i) => {
      doc.setFillColor(...C.blue);
      doc.circle(M + 11, iy - 1.5, 3.4, "F");
      doc.setFont(FONT, "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(...C.white);
      doc.text(String(g.start + i), M + 11, iy + 0.5, { align: "center" });
      doc.setFont(FONT, "normal");
      doc.setFontSize(9);
      doc.setTextColor(...C.ink);
      doc.text(t, M + 18, iy);
      iy += 10;
    });

    gy += h + 6;
  });

  const seq =
    "Sequencing follows impact and investor relevance: stabilise the highest-risk domains first with the quick wins, then build the durable controls — CRM, audited financials, governance and IP — that carry the business past the 70% readiness threshold.";
  const seqH = 15 + doc.splitTextToSize(seq, CW - 16).length * 4.4 + 4;
  if (gy + seqH > limit) {
    doc.addPage();
    chrome(doc, name);
    gy = contHead(doc, st.num, "Prioritisation");
  }
  callout(doc, M, gy, CW, "SEQUENCING", seq, C.amber);
}

// ─── Due-diligence flow helpers ──────────────────────────────────────────────

// Per-domain evidence reviewed / missing evidence.
const EV = {
  commercial: {
    evidence: "CRAT self-assessment responses on sales, market and customers; reviewer scoring.",
    missing: "Sales-pipeline export, pricing sheet, top-customer contracts, marketing plan, churn / retention data.",
  },
  financial: {
    evidence: "CRAT self-assessment responses on financial management; reviewer scoring.",
    missing: "12-month management accounts, cash-flow model, bank statements, revenue ledger, accounting-system access.",
  },
  operations: {
    evidence: "CRAT self-assessment responses on operations; reviewer scoring.",
    missing: "Process / SOP documentation, organisation chart, KPI dashboard, key-person and succession plan.",
  },
  legal: {
    evidence: "CRAT self-assessment responses on legal & compliance; reviewer scoring.",
    missing: "Certificate of incorporation, licences / permits, key contracts, IP registrations, board and governance records.",
  },
};

function riskFromScore(p) {
  return p >= 70 ? "Low" : p >= 45 ? "Medium" : "High";
}

function riskColor(v) {
  const s = String(v || "").toLowerCase();
  if (s.includes("crit") || s.includes("high")) return C.red;
  if (s.includes("med")) return C.amber;
  if (s.includes("low")) return C.green;
  return C.muted;
}
function riskSoft(v) {
  const s = String(v || "").toLowerCase();
  if (s.includes("crit") || s.includes("high")) return C.redSoft;
  if (s.includes("med")) return [254, 243, 199];
  if (s.includes("low")) return C.greenSoft;
  return C.cardBg;
}
function cellColor(tone, val) {
  const v = String(val || "").toLowerCase();
  if (tone === "risk") return riskColor(v);
  if (tone === "status") {
    if (/(required|to provide|pending|missing|not in place|absent)/.test(v)) return C.amber;
    if (/(provided|complete|in place|verified|yes|held)/.test(v)) return C.green;
    return C.slate;
  }
  if (tone === "suit") {
    if (v.includes("recommend")) return C.green;
    if (v.includes("conditional")) return C.amber;
    if (v.includes("not")) return C.red;
    if (v.includes("optional")) return C.blue;
    return C.slate;
  }
  return C.slate;
}

// Begin a section; the number is auto-assigned from the build order so that
// adding/removing/reordering sections renumbers the whole report automatically.
function beginSection(doc, name, title, sub) {
  SECTION_NO += 1;
  const num = String(SECTION_NO).padStart(2, "0");
  chrome(doc, name);
  const y = sectionHead(doc, num, title, sub);
  return { doc, name, num, title, y };
}

// Page-break guard.
function ensure(st, h) {
  if (st.y + h > PH - 16) {
    st.doc.addPage();
    chrome(st.doc, st.name);
    st.y = contHead(st.doc, st.num, st.title);
  }
}

function heading(st, text) {
  ensure(st, 14);
  const { doc } = st;
  doc.setFont(FONT, "bold");
  doc.setFontSize(10);
  doc.setTextColor(...C.blue);
  doc.text(text, M, st.y + 4);
  doc.setDrawColor(...C.line);
  doc.setLineWidth(0.3);
  doc.line(M, st.y + 6.5, M + CW, st.y + 6.5);
  st.y += 12;
}

function para(st, text, opt = {}) {
  const { doc } = st;
  doc.setFont(FONT, opt.bold ? "bold" : "normal");
  doc.setFontSize(opt.fs || 9);
  const lh = opt.lh || 4.4;
  const lines = doc.splitTextToSize(String(text || ""), CW);
  lines.forEach((l) => {
    ensure(st, lh);
    doc.setFont(FONT, opt.bold ? "bold" : "normal");
    doc.setFontSize(opt.fs || 9);
    doc.setTextColor(...(opt.color || C.slate));
    doc.text(l, M, st.y + 3.2);
    st.y += lh;
  });
  st.y += opt.gap == null ? 3 : opt.gap;
}

function infoNote(st, text) {
  const { doc } = st;
  const lines = doc.splitTextToSize(String(text), CW - 16);
  const h = 12 + lines.length * 4 + 3;
  ensure(st, h);
  card(doc, M, st.y, CW, h, { fill: [255, 251, 235], radius: 2 });
  doc.setFillColor(...C.amber);
  doc.roundedRect(M, st.y, 2.4, h, 1, 1, "F");
  doc.setFont(FONT, "bold");
  doc.setFontSize(7);
  doc.setTextColor(...C.amber);
  doc.text("INFORMATION REQUIRED FROM COMPANY", M + 8, st.y + 7, { charSpace: 0.3 });
  doc.setFont(FONT, "normal");
  doc.setFontSize(8);
  doc.setTextColor(...C.slate);
  lines.forEach((l, i) => doc.text(l, M + 8, st.y + 12 + i * 4));
  st.y += h + 4;
}

// Generic table with wrapping, zebra rows, tone-coloured cells and header repeat.
function tableRows(st, columns, rows) {
  const { doc } = st;
  const pad = 2.2;
  const lh = 3.5;
  const drawHead = () => {
    doc.setFillColor(...C.blueDeep);
    doc.roundedRect(M, st.y, CW, 8, 1.5, 1.5, "F");
    doc.setFont(FONT, "bold");
    doc.setFontSize(6.8);
    doc.setTextColor(...C.white);
    let cx = M;
    columns.forEach((c) => {
      doc.text(String(c.header).toUpperCase(), cx + pad, st.y + 5.2, { charSpace: 0.2 });
      cx += c.w;
    });
    st.y += 9;
  };
  ensure(st, 20);
  drawHead();
  rows.forEach((row, ri) => {
    const cellLines = columns.map((c, ci) =>
      doc.splitTextToSize(String(row[ci] == null ? "" : row[ci]), c.w - pad * 2),
    );
    const rowH = Math.max(...cellLines.map((l) => l.length)) * lh + 3.5;
    if (st.y + rowH > PH - 16) {
      st.doc.addPage();
      chrome(doc, st.name);
      st.y = contHead(doc, st.num, st.title);
      drawHead();
    }
    if (ri % 2 === 1) {
      doc.setFillColor(...C.cardBg);
      doc.rect(M, st.y, CW, rowH, "F");
    }
    let cx = M;
    columns.forEach((c, ci) => {
      const color = c.tone ? cellColor(c.tone, row[ci]) : c.bold ? C.ink : C.slate;
      doc.setFont(FONT, c.bold || c.tone ? "bold" : "normal");
      doc.setFontSize(7.4);
      doc.setTextColor(...color);
      cellLines[ci].forEach((ln, li) => {
        const tx = c.align === "right" ? cx + c.w - pad : cx + pad;
        doc.text(ln, tx, st.y + 3.6 + li * lh, c.align === "right" ? { align: "right" } : {});
      });
      cx += c.w;
    });
    doc.setDrawColor(...C.line);
    doc.setLineWidth(0.2);
    doc.line(M, st.y + rowH, M + CW, st.y + rowH);
    st.y += rowH;
  });
  st.y += 5;
}

// Finding block: statement + risk pill + evidence / missing / action.
function findingBlock(st, f) {
  const { doc } = st;
  const evid = f.evidence || "Information required from company.";
  const miss = f.missing || "Information required from company.";
  const action = f.action || "—";
  const parts = [
    ["Evidence reviewed", evid],
    ["Missing evidence", miss],
    ["Recommended action", action],
  ];
  const titleLines = doc.splitTextToSize(f.finding, CW - 46);
  const partLines = parts.map(([, v]) => doc.splitTextToSize(v, CW - 48));
  let bodyH = 0;
  partLines.forEach((l) => (bodyH += Math.max(4, l.length * 3.8) + 1.8));
  const h = 9 + titleLines.length * 4.2 + 2 + bodyH + 3;
  ensure(st, h);
  card(doc, M, st.y, CW, h, { fill: C.white, border: C.line, radius: 3 });
  doc.setFillColor(...riskColor(f.risk));
  doc.roundedRect(M, st.y, 2.4, h, 1, 1, "F");
  doc.setFont(FONT, "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...C.ink);
  titleLines.forEach((l, i) => doc.text(l, M + 8, st.y + 9 + i * 4.2));
  pillRight(
    doc,
    M + CW - 8,
    st.y + 4.5,
    `${String(f.risk || "—").toUpperCase()} RISK`,
    riskSoft(f.risk),
    riskColor(f.risk),
  );
  let by = st.y + 9 + titleLines.length * 4.2 + 4;
  parts.forEach(([lab], pi) => {
    doc.setFont(FONT, "bold");
    doc.setFontSize(7);
    doc.setTextColor(...C.muted);
    doc.text(lab.toUpperCase(), M + 8, by, { charSpace: 0.2 });
    doc.setFont(FONT, "normal");
    doc.setFontSize(7.8);
    const req = /required/i.test(parts[pi][1]);
    doc.setTextColor(...(req ? C.amber : C.slate));
    partLines[pi].forEach((ln, li) => doc.text(ln, M + 40, by + li * 3.8));
    by += Math.max(4, partLines[pi].length * 3.8) + 1.8;
  });
  st.y += h + 5;
}

// Funding-instrument suitability from the readiness profile.
function fundingVerdict(overall, sd) {
  const fin = pctOf(sd, "financial");
  const legal = pctOf(sd, "legal");
  const ops = pctOf(sd, "operations");
  const rows = [
    [
      "Grant funding",
      overall < 70 ? "Recommended" : "Optional",
      "Suits early-stage capacity building and de-risking; least sensitive to the current gaps.",
    ],
    [
      "Milestone-based catalytic",
      overall >= 35 && overall < 78 ? "Recommended" : overall >= 78 ? "Optional" : "Conditional",
      "Tranches released against verified readiness milestones; aligns directly with the improvement roadmap.",
    ],
    [
      "Debt",
      overall >= 60 && fin >= 60 ? "Conditional" : "Not yet",
      "Requires reliable cash-flow, financial controls and clean legal standing before drawdown.",
    ],
    [
      "Equity",
      overall >= 70 && legal >= 55 && ops >= 55 ? "Conditional" : "Not yet",
      "Requires investor-grade financials, governance and a clean legal / IP position for due diligence.",
    ],
  ];
  let headline;
  if (overall >= 70)
    headline = "positioned to pursue structured debt or equity, subject to confirmatory due diligence";
  else if (overall >= 50)
    headline = "best matched to milestone-based catalytic funding and grants, with a clear 12–18 month path to debt or equity";
  else
    headline = "best matched to grant and milestone-based catalytic funding with technical assistance; it is not yet ready for commercial debt or equity";
  return { rows, headline };
}

// ─── Due-diligence sections ──────────────────────────────────────────────────

function drawExecSummary(doc, ctx) {
  const { name, overall, scoreData } = ctx;
  const st = beginSection(
    doc,
    name,
    "Executive Summary",
    `An investment-committee assessment of ${name}'s readiness to absorb and deploy external capital.`,
  );
  const v = fundingVerdict(overall, scoreData);

  ensure(st, 42);
  card(doc, M, st.y, CW, 42, { fill: C.blueDeep, radius: 4 });
  donut(doc, M + 30, st.y + 21, 15, overall, {
    thickness: 5,
    track: C.blueTrack,
    arc: C.gold,
    textColor: C.white,
    big: 15,
    sub: "READINESS",
    subColor: C.blueSoft,
  });
  doc.setFont(FONT, "bold");
  doc.setFontSize(8);
  doc.setTextColor(...C.blueSoft);
  doc.text("INVESTMENT-READINESS VERDICT", M + 58, st.y + 12, { charSpace: 0.5 });
  doc.setFont(FONT, "bold");
  doc.setFontSize(12);
  doc.setTextColor(...C.white);
  doc.splitTextToSize(`${name} is ${v.headline}.`, CW - 66).slice(0, 4).forEach((l, i) =>
    doc.text(l, M + 58, st.y + 20 + i * 5.4),
  );
  st.y += 47;

  para(
    st,
    `${name} recorded an overall Capital Readiness Score of ${overall}% (${maturityLabel(overall)}). This report expands the summary assessment into a due-diligence-grade review across company, business model, market, financial, operational, legal and regulatory dimensions. For every finding it states the evidence reviewed, the missing evidence, the risk level and the recommended corrective action.`,
  );
  heading(st, "Funding-instrument suitability");
  tableRows(
    st,
    [
      { header: "Instrument", w: 44, bold: true },
      { header: "Suitability", w: 34, tone: "suit" },
      { header: "Rationale", w: 108 },
    ],
    v.rows,
  );
  infoNote(
    st,
    "Findings are marked “information required from company” wherever primary evidence was not provided. Supplying the missing evidence listed against each finding converts these into verified findings.",
  );
}

function drawMethodology(doc, ctx) {
  const { name } = ctx;
  const st = beginSection(
    doc,
    name,
    "Assessment Methodology & Weighting",
    "How the Capital Readiness Assessment (CRAT) is conducted and weighted.",
  );

  heading(st, "Methodology");
  para(
    st,
    "The assessment combines a structured entrepreneur self-assessment with independent reviewer scoring. Each question is scored on a 0–5 scale; where multiple reviewers score a question, the reviewer scores are averaged. Question scores are aggregated to domain scores and normalised to percentages, and the overall readiness score is the simple average of the four domain scores. A 70% overall score is treated as the investment-readiness threshold. Findings are triangulated against supporting evidence; where evidence was not provided, the finding is flagged as requiring company information rather than assumed.",
  );

  heading(st, "Domain weights");
  para(
    st,
    "The headline readiness score is the simple average of the four domain scores. The weights below indicate each domain's relative importance to an investor's capital-allocation decision and are used to prioritise interventions; they sum to 100%.",
  );
  tableRows(
    st,
    [
      { header: "Domain", w: 60, bold: true },
      { header: "Weight", w: 26 },
      { header: "Basis", w: 100 },
    ],
    DOMAINS.map((d) => [d.full, `${Math.round(d.weight * 100)}%`, d.basis]),
  );
}

function drawEvidence(doc, ctx) {
  const { name, scoreData } = ctx;
  const st = beginSection(
    doc,
    name,
    "Evidence Reviewed & Evidence Gaps",
    "What was available to the assessment in each domain, and what must still be provided to verify the findings.",
  );
  DOMAINS.forEach((d) => {
    const p = pctOf(scoreData, d.key);
    findingBlock(st, {
      finding: `${d.full} — assessed at ${p}% (${riskFromScore(p) === "Low" ? "on track" : "gap identified"}).`,
      evidence: EV[d.key].evidence,
      missing: EV[d.key].missing,
      risk: riskFromScore(p),
      action: `Provide the missing evidence for independent verification; without it the ${d.label.toLowerCase()} score cannot be confirmed for due diligence.`,
    });
  });
}

function drawRoadmap(doc, ctx) {
  const { name, overall, scoreData } = ctx;
  const st = beginSection(
    doc,
    name,
    "Improvement Roadmap (6 / 12 / 18 months)",
    "Sequenced interventions with owners, deadlines, expected outputs and readiness-score targets.",
  );
  const f = pctOf(scoreData, "financial");
  const l = pctOf(scoreData, "legal");
  const o = pctOf(scoreData, "operations");
  const c = pctOf(scoreData, "commercial");
  const cap = (x) => Math.min(100, x);
  const cols = [
    { header: "Intervention", w: 60, bold: true },
    { header: "Owner", w: 28 },
    { header: "Deadline", w: 20 },
    { header: "Expected output", w: 46 },
    { header: "Score target", w: 32 },
  ];

  heading(st, "Phase 1 — 0 to 6 months (stabilise)");
  tableRows(st, cols, [
    ["Adopt accounting software & monthly management accounts", "Finance Lead", "Month 3", "Monthly management accounts", `Financial ${f} → ${cap(f + 8)}`],
    ["Consolidate licences, permits & key contracts", "Legal / Compliance", "Month 4", "Legal register", `Legal ${l} → ${cap(l + 23)}`],
    ["Document core processes & SOPs", "Ops Lead", "Month 5", "SOP handbook", `Operations ${o} → ${cap(o + 22)}`],
    ["Stand up AML/KYC & data-protection policies", "Legal / Compliance", "Month 6", "Approved policies + PDPA filing", `Legal ${cap(l + 23)} → ${cap(l + 33)}`],
    ["Populate the investor data room", "CEO", "Month 6", "Virtual data room", `Overall ${overall} → ${cap(overall + 12)}`],
  ]);

  heading(st, "Phase 2 — 6 to 12 months (build controls)");
  tableRows(st, cols, [
    ["Rolling 12-month cash-flow forecast", "Finance Lead", "Month 9", "Board-reviewed model", `Financial ${cap(f + 8)} → ${cap(f + 12)}`],
    ["Deploy CRM & pipeline tracking with KPIs", "Commercial Lead", "Month 9", "CRM + weekly pipeline reporting", `Commercial ${c} → ${cap(c + 10)}`],
    ["KPI / performance-management routine", "Ops Lead", "Month 10", "Operational KPI dashboard", `Operations ${cap(o + 22)} → ${cap(o + 42)}`],
    ["Progress BOT / e-money licensing pathway", "Legal / Compliance", "Month 12", "Application submitted / held", `Legal ${cap(l + 33)} → ${cap(l + 48)}`],
    ["Reduce key-person dependency", "CEO / Ops Lead", "Month 12", "Delegation & succession plan", `Overall ${cap(overall + 12)} → ${cap(overall + 24)}`],
  ]);

  heading(st, "Phase 3 — 12 to 18 months (investor-ready)");
  tableRows(st, cols, [
    ["Prepare audited financial statements", "Finance Lead + Auditor", "Month 15", "Audited accounts", `Financial ${cap(f + 12)} → ${cap(f + 15)}`],
    ["Formalise governance & board oversight", "CEO / Board", "Month 15", "Board charter & minutes", `Legal ${cap(l + 48)} → ${cap(l + 61)}`],
    ["Register IP (trademark, code assignment)", "Legal / Compliance", "Month 16", "IP certificates", `Legal ${cap(l + 61)} → ${cap(l + 68)}`],
    ["Strengthen cybersecurity & DR controls", "CTO", "Month 17", "Security policy, backups, IR plan", `Operations ${cap(o + 42)} → ${cap(o + 55)}`],
    ["Re-run CRAT & prepare for diligence", "CEO", "Month 18", "Updated report ≥ 80%", `Overall ${cap(overall + 24)} → ${cap(overall + 36)}`],
  ]);
}

// ─── PDF builder ─────────────────────────────────────────────────────────────

async function buildPDF(domainData, scoreData, userDetails, logoDataUrl) {
  const doc = new jsPDF({ unit: "mm", format: "a5", orientation: "landscape" });
  registerFonts(doc);

  const name = getBusinessName(userDetails);
  const overall = calcOverallScore(scoreData);
  const date = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const profile = getBusinessProfile(userDetails);
  const ctx = { name, overall, date, profile, scoreData, logoDataUrl };

  // Section numbers are auto-assigned in this order (see beginSection).
  SECTION_NO = 0;
  const sections = [
    drawExecSummary,
    drawProfile,
    drawMethodology,
    drawOverallFindings,
    drawGaps,
    drawDetailedFindings,
    drawEvidence,
    drawRecommendations,
    drawRoadmap,
    drawInitiatives,
  ];
  drawCover(doc, ctx);
  sections.forEach((fn) => {
    doc.addPage();
    fn(doc, ctx);
  });

  const safeTitle = name
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

// ─── One-page report (A4 landscape) ──────────────────────────────────────────
// The delivered CRAT report is a single A4 landscape page: identity and summary
// on the left, findings on the right. Everything below is sized to that page —
// nothing here may call addPage(). Where content could overflow, the type size
// steps down and the list is capped rather than spilling to a second page.

const P1 = { W: 297, H: 210, M: 14 };

// Bar colour by score band, matching the reference: strong = green through to
// weak = red, so the profile reads at a glance.
function p1ScoreColor(pct) {
  const p = clamp(pct);
  if (p >= 70) return [22, 128, 61];
  if (p >= 60) return [132, 204, 122];
  if (p >= 40) return [234, 179, 8];
  if (p >= 20) return [244, 162, 97];
  return [220, 38, 38];
}

// Priority follows the overall score; the note names the two weakest domains so
// it says what actually has to happen next.
function p1Priority(scoreData) {
  const overall = calcOverallScore(scoreData);
  const weakest = [...DOMAINS]
    .sort((a, b) => pctOf(scoreData, a.key) - pctOf(scoreData, b.key))
    .slice(0, 2)
    .map((d) => d.label.toLowerCase());
  const gaps = `${weakest[0]} & ${weakest[1]} gaps`;

  if (overall >= 70)
    return {
      label: "Low",
      note: "Investment-ready — proceed to investor matchmaking.",
    };
  if (overall >= 55)
    return {
      label: "Medium",
      note: `Proceed to acceleration while closing ${gaps}.`,
    };
  if (overall >= 40)
    return {
      label: "Medium-High",
      note: `Proceed to acceleration after ${gaps} are addressed.`,
    };
  return {
    label: "High",
    note: `Foundational support required before acceleration — ${gaps} are critical.`,
  };
}

// Strengths: every domain at or above the 70% threshold, strongest first, then
// the maturity read. Returns [] when nothing clears the bar rather than
// inventing a strength.
function p1Strengths(scoreData) {
  const out = [];
  [...DOMAINS]
    .filter((d) => pctOf(scoreData, d.key) >= 70)
    .sort((a, b) => pctOf(scoreData, b.key) - pctOf(scoreData, a.key))
    .forEach((d) => {
      const p = pctOf(scoreData, d.key);
      out.push({
        lead: `Strong ${d.full} (${p}%):`,
        body: `the business demonstrates established ${d.label.toLowerCase()} capability, with core systems in place, making this domain investment-grade.`,
      });
    });

  const overall = calcOverallScore(scoreData);
  out.push({
    lead: `${maturityLabel(overall)} Business Maturity:`,
    body: `the business sits at the "${maturityLabel(overall).toLowerCase()}" maturity level on an overall score of ${overall}%, with a defined path to investment readiness once the identified gaps are closed.`,
  });
  return out;
}

// Section header bar.
function p1Bar(doc, x, y, w, title) {
  doc.setFillColor(...C.blue);
  doc.rect(x, y, w, 8.4, "F");
  doc.setFont(FONT, "bold");
  doc.setFontSize(10);
  doc.setTextColor(...C.white);
  doc.text(title, x + w / 2, y + 5.8, { align: "center" });
  return y + 8.4;
}

// Lay out a bold lead-in followed by body text, wrapped as one paragraph.
// jsPDF has no inline rich text, so words are measured and placed individually.
function p1Rich(doc, x, y, w, lead, body, fs, lh, dry) {
  const tokens = [
    ...String(lead || "")
      .split(/\s+/)
      .filter(Boolean)
      .map((t) => ({ t, bold: true })),
    ...String(body || "")
      .split(/\s+/)
      .filter(Boolean)
      .map((t) => ({ t, bold: false })),
  ];

  doc.setFontSize(fs);
  let cx = x;
  let cy = y;
  let lines = 1;

  tokens.forEach((tok) => {
    doc.setFont(FONT, tok.bold ? "bold" : "normal");
    const tw = doc.getTextWidth(tok.t + " ");
    if (cx + tw > x + w && cx > x) {
      cx = x;
      cy += lh;
      lines += 1;
    }
    if (!dry) {
      doc.setTextColor(...(tok.bold ? C.ink : C.slate));
      doc.text(tok.t, cx, cy);
    }
    cx += tw;
  });

  return lines * lh;
}

// A bulleted list of { lead, body } (or plain strings). Returns the height used;
// pass dry to measure without drawing.
function p1Bullets(doc, x, y, w, items, fs, lh, dry) {
  let cy = y;
  items.forEach((it) => {
    const lead = typeof it === "string" ? "" : it.lead;
    const body = typeof it === "string" ? it : it.body;
    if (!dry) {
      doc.setFont(FONT, "normal");
      doc.setFontSize(fs);
      doc.setTextColor(...C.blue);
      doc.text("•", x, cy);
    }
    cy += p1Rich(doc, x + 3.6, cy, w - 3.6, lead, body, fs, lh, dry) + 1.6;
  });
  return cy - y;
}

const P1_SIZES = [8.6, 8.2, 7.8, 7.4, 7, 6.6];

// Largest type size at which `items` fit `avail`, or null if none do.
function p1FitSize(doc, w, items, avail, extra = 0) {
  for (const fs of P1_SIZES) {
    const lh = fs * 0.47;
    if (p1Bullets(doc, 0, 0, w, items, fs, lh, true) + extra <= avail) {
      return { fs, lh, items };
    }
  }
  return null;
}

// Fit a list to the space available: shrink the type first, and only drop
// entries once the smallest size still overflows. Always returns something that
// fits, so the page can never spill onto a second one.
function p1Fit(doc, w, items, avail, extra = 0) {
  const whole = p1FitSize(doc, w, items, avail, extra);
  if (whole) return whole;

  const fs = P1_SIZES[P1_SIZES.length - 1];
  const lh = fs * 0.47;
  for (let keep = items.length - 1; keep >= 1; keep -= 1) {
    const slice = items.slice(0, keep);
    if (p1Bullets(doc, 0, 0, w, slice, fs, lh, true) + extra <= avail) {
      return { fs, lh, items: slice };
    }
  }
  return { fs, lh, items: items.slice(0, 1) };
}

function buildOnePager(data, scoreData, userDetails) {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });
  registerFonts(doc);

  const { W, H, M: m } = P1;
  const name = getBusinessName(userDetails);
  const overall = calcOverallScore(scoreData);
  const priority = p1Priority(scoreData);
  const profile = getBusinessProfile(userDetails);

  const description =
    userDetails?.Business?.description ||
    userDetails?.Business?.businessDescription ||
    `${name} is a business assessed under the CRAT capital readiness framework${
      profile.sector ? ` operating in the ${profile.sector} sector` : ""
    }${profile.location ? `, based in ${profile.location}` : ""}.`;

  // ── Header: name + description, full width.
  doc.setFont(FONT, "bold");
  doc.setFontSize(19);
  doc.setTextColor(...C.blue);
  doc.text(name, m, m + 7);

  doc.setFont(FONT, "normal");
  doc.setFontSize(8.6);
  doc.setTextColor(...C.slate);
  const descLines = doc.splitTextToSize(String(description), W - 2 * m).slice(0, 3);
  descLines.forEach((l, i) => doc.text(l, m, m + 15 + i * 4.2));

  const top = m + 15 + descLines.length * 4.2 + 5;

  // ── Two columns.
  const leftW = 112;
  const gutter = 11;
  const rightX = m + leftW + gutter;
  const rightW = W - m - rightX;

  // ── LEFT: priority, rating, domain bars, summary, strengths.
  let ly = top;

  doc.setFillColor(...C.amber);
  doc.rect(m, ly, 52, 7.6, "F");
  doc.setFont(FONT, "bold");
  doc.setFontSize(9);
  doc.setTextColor(...C.ink);
  doc.text(`Priority: ${priority.label}`, m + 3.5, ly + 5.3);
  ly += 12.5;

  doc.setFont(FONT, "normal");
  doc.setFontSize(8.4);
  doc.setTextColor(...C.slate);
  doc.splitTextToSize(priority.note, leftW).forEach((l, i) => {
    doc.text(l, m, ly + i * 4.1);
  });
  ly += doc.splitTextToSize(priority.note, leftW).length * 4.1 + 4;

  ly = p1Bar(doc, m, ly, leftW, "Startup Rating") + 7;

  // Maturity tiers — the reached tier carries the score.
  const tiers = ["Basic", "Developing", "Progressing", "Advanced", "Leading"];
  const idx = Math.min(4, Math.floor(clamp(overall) / 20));
  const segW = leftW / 5;
  tiers.forEach((t, i) => {
    const sx = m + i * segW;
    const active = i === idx;
    doc.setFillColor(...(active ? C.amber : i < idx ? C.softBlue : C.track));
    doc.rect(sx, ly, segW - 1.2, 6.4, "F");
    doc.setFont(FONT, active ? "bold" : "normal");
    doc.setFontSize(active ? 6.6 : 6.4);
    doc.setTextColor(...(active ? C.ink : C.muted));
    doc.text(
      active ? `${t} · ${overall}%` : t,
      sx + (segW - 1.2) / 2,
      ly + 4.3,
      { align: "center" },
    );
  });
  ly += 12;

  doc.setFont(FONT, "bold");
  doc.setFontSize(8.6);
  doc.setTextColor(...C.blue);
  doc.text("Readiness by domain", m, ly);

  doc.setFontSize(6.6);
  doc.setTextColor(...C.red);
  doc.text("70% target", m + leftW * 0.7, ly, { align: "center" });
  ly += 4;

  // Domain bars + overall.
  const rows = [
    ...DOMAINS.map((d) => ({
      label: d.label,
      pct: pctOf(scoreData, d.key),
      bold: false,
    })),
    { label: "Overall", pct: overall, bold: true },
  ];

  const labelW = 24;
  const valW = 12;
  const barX = m + labelW;
  const barW = leftW - labelW - valW;

  rows.forEach((r) => {
    doc.setFont(FONT, r.bold ? "bold" : "normal");
    doc.setFontSize(8);
    doc.setTextColor(...C.ink);
    doc.text(r.label, m, ly + 4.2);

    doc.setFillColor(...C.track);
    doc.rect(barX, ly, barW, 5.6, "F");

    const fw = Math.max(1.2, (barW * clamp(r.pct)) / 100);
    doc.setFillColor(...p1ScoreColor(r.pct));
    doc.rect(barX, ly, fw, 5.6, "F");

    // 70% threshold marker.
    const tx = barX + barW * 0.7;
    doc.setDrawColor(...C.red);
    doc.setLineWidth(0.5);
    doc.line(tx, ly - 0.7, tx, ly + 6.3);

    doc.setFont(FONT, "bold");
    doc.setTextColor(...p1ScoreColor(r.pct));
    doc.text(`${clamp(r.pct)}%`, m + leftW, ly + 4.2, { align: "right" });

    ly += 9.4;
  });

  ly += 1.5;
  doc.setFont(FONT, "normal");
  doc.setFontSize(8.2);
  doc.setTextColor(...C.slate);
  const verdict = `The business achieved an overall Capital Readiness Score of ${overall}%, placing it at the "${maturityLabel(
    overall,
  )}" maturity level. As such, it is ${
    overall >= 70 ? "investment-ready" : "not yet investment-ready"
  }.`;
  doc.splitTextToSize(verdict, leftW).forEach((l, i) => {
    doc.text(l, m, ly + i * 4.1);
  });
  ly += doc.splitTextToSize(verdict, leftW).length * 4.1 + 5;

  // Strengths — sized to whatever space is left in the column.
  const strengths = p1Strengths(scoreData);
  const footerY = H - 10;
  ly = p1Bar(doc, m, ly, leftW, "Strengths") + 6;

  const str = p1Fit(doc, leftW, strengths, footerY - 5 - ly);
  p1Bullets(doc, m, ly, leftW, str.items, str.fs, str.lh, false);

  // ── RIGHT: thematic gaps + recommendations.
  const gaps = DOMAINS.map((d) => ({
    lead: `${DOMAIN_CONTENT[d.key].gapTitle || d.full}:`,
    body: DOMAIN_CONTENT[d.key].gap,
  }));
  // Recommendations are taken round-robin across the domains so every domain is
  // represented rather than the first ones crowding the list out.
  const byDomain = DOMAINS.map((d) => DOMAIN_CONTENT[d.key].recs || []);
  const recs = [];
  for (let i = 0; i < Math.max(...byDomain.map((r) => r.length)); i += 1) {
    byDomain.forEach((list) => {
      if (list[i]) recs.push(list[i]);
    });
  }

  // Gaps and recommendations share the column, so they are fitted together at a
  // single size: gaps first (they are fixed at four), then whatever space is
  // left goes to the recommendations.
  const rightAvail = footerY - 5 - top;
  const gapFit = p1Fit(doc, rightW, gaps, rightAvail * 0.52, 12);
  const usedByGaps =
    p1Bullets(doc, 0, 0, rightW, gapFit.items, gapFit.fs, gapFit.lh, true) + 12;
  const recFit = p1Fit(doc, rightW, recs, rightAvail - usedByGaps, 12);

  let ry = top;
  ry = p1Bar(doc, rightX, ry, rightW, "Key Thematic Gaps") + 6;
  ry +=
    p1Bullets(doc, rightX, ry, rightW, gapFit.items, gapFit.fs, gapFit.lh, false) +
    4;

  ry = p1Bar(doc, rightX, ry, rightW, "Key Recommendations") + 6;
  p1Bullets(doc, rightX, ry, rightW, recFit.items, recFit.fs, recFit.lh, false);

  // ── Footer.
  doc.setDrawColor(...C.line);
  doc.setLineWidth(0.3);
  doc.line(m, footerY - 4, W - m, footerY - 4);
  doc.setFont(FONT, "normal");
  doc.setFontSize(7);
  doc.setTextColor(...C.faint);
  doc.text(`${name} — Capital Readiness Assessment`, m, footerY);
  doc.text(String(new Date().getFullYear()), W - m, footerY, {
    align: "right",
  });

  const filename = `Capital_Readiness_Report_${String(name).replace(
    /[^a-z0-9]+/gi,
    "_",
  )}_${Date.now()}.pdf`;
  doc.save(filename);
  return filename;
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

  onStatus?.("Building report...");

  // The delivered report is the single-page summary. buildPDF below still holds
  // the long-form multi-page version if it is ever needed again.
  const filename = buildOnePager(data, scoreData, userDetails);

  onStatus?.("Done!");
  return { success: true, filename };
}
