import OpenAI from "openai";

// ─── CRAT thematic insights ──────────────────────────────────────────────────
// Derives the four Key Thematic Gaps and four Key Recommendations that appear on
// the CRAT report from what was actually recorded for a given startup: the
// reviewer comments left against each assessed sub-domain and the notes the
// entrepreneur entered when answering. Output is therefore tailored per
// business rather than the same boilerplate for everyone.
//
// Two paths, in order of preference:
//   1. AI (gpt-4o-mini) reading the real comments — used when a key is set.
//   2. A deterministic derivation from the same evidence — used when the AI is
//      unavailable or returns something unusable. It still cites the startup's
//      own weakest sub-domains and reviewer wording, so it stays tailored.

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

const openai = OPENAI_API_KEY
  ? new OpenAI({ apiKey: OPENAI_API_KEY, dangerouslyAllowBrowser: true })
  : null;

export const INSIGHT_DOMAINS = [
  { key: "commercial", label: "Commercial", full: "Commercial & Market" },
  { key: "financial", label: "Financial", full: "Financial Management" },
  { key: "operations", label: "Operations", full: "Operations" },
  { key: "legal", label: "Legal", full: "Legal & Compliance" },
];

// Baseline per-domain copy. Used verbatim only when a domain has no reviewer
// comment and no entrepreneur note to work from — otherwise it supplies the
// framing sentence that the recorded evidence is woven into. Also consumed by
// the PDF's long-form sections.
export const DOMAIN_FALLBACK = {
  commercial: {
    gapTitle:
      "Weak commercial systems limiting predictable and scalable revenue growth",
    gap: "Revenue is being generated, but the commercial engine still runs on informal, undocumented routines. There is no defined sales pipeline, market positioning is held tacitly rather than written down, and acquisition and retention are not measured. For investors this translates directly into uncertainty about how repeatable and predictable future revenue really is.",
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
    recs: [
      "Review and consolidate licences, permits and key contracts into a diligence-ready pack.",
      "Close outstanding compliance gaps and formalise governance and oversight structures.",
      "Register intellectual property and document board composition and decision rights.",
    ],
  },
};

// ─── Evidence collection ─────────────────────────────────────────────────────

const DOMAIN_ALIASES = {
  commercial: "commercial",
  commercial_marketing: "commercial",
  commercialmarketing: "commercial",
  marketing: "commercial",
  market: "commercial",
  sales: "commercial",
  financial: "financial",
  finance: "financial",
  financials: "financial",
  operations: "operations",
  operational: "operations",
  operation: "operations",
  legal: "legal",
  legal_compliance: "legal",
  legalcompliance: "legal",
  compliance: "legal",
};

const REVIEWER_COMMENT_KEYS = [
  "reviewerComment",
  "reviewer_comment",
  "reviewerNotes",
  "reviewerNote",
  "reviewerFeedback",
  "feedback",
  "comment",
];

const STARTUP_NOTE_KEYS = [
  "entrepreneurComment",
  "entrepreneur_comment",
  "customerComment",
  "customer_comment",
  "applicantComment",
  "startupNote",
  "note",
  "notes",
];

const LABEL_KEYS = [
  "subDomain",
  "sub_domain",
  "subdomain",
  "questionText",
  "question",
  "questionCode",
  "title",
  "label",
  "area",
];

const clean = (value) =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";

const firstOf = (item, keys) => {
  for (const key of keys) {
    const value = clean(item?.[key]);
    if (value) return value;
  }
  return "";
};

const normaliseDomainKey = (value) => {
  const key = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  return DOMAIN_ALIASES[key] || DOMAIN_ALIASES[key.replace(/_/g, "")] || null;
};

const looksLikeItem = (node) =>
  Boolean(
    node &&
      typeof node === "object" &&
      !Array.isArray(node) &&
      (LABEL_KEYS.some((key) => clean(node[key])) ||
        REVIEWER_COMMENT_KEYS.some((key) => clean(node[key])) ||
        STARTUP_NOTE_KEYS.some((key) => clean(node[key])) ||
        node.score !== undefined),
  );

// Report payloads nest differently depending on where they came from (grouped by
// section, a flat `summary` array, or a bare array), so walk the tree rather
// than assuming one shape.
const walkItems = (node, out, depth = 0) => {
  if (!node || depth > 4) return;

  if (Array.isArray(node)) {
    node.forEach((child) => walkItems(child, out, depth + 1));
    return;
  }

  if (typeof node !== "object") return;

  if (looksLikeItem(node)) {
    out.push(node);
    return;
  }

  Object.values(node).forEach((child) => walkItems(child, out, depth + 1));
};

// Reviewer scores arrive on a 0–2 scale in report payloads and 0–5 in raw
// assessment answers; infer which so the ratio is comparable either way.
const inferMaxScore = (items) =>
  items.some((item) => Number(item.score) > 2) ? 5 : 2;

const toRatio = (score, maxScore) => {
  const parsed = Number(score);

  if (!Number.isFinite(parsed) || maxScore <= 0) return null;

  return Math.max(0, Math.min(1, parsed / maxScore));
};

/**
 * Flatten a report's domain data and reviewer feedback into a single list of
 * evidence rows: one per assessed sub-domain that carries a score, a reviewer
 * comment or an entrepreneur note.
 */
export const collectAssessmentEvidence = (
  domainData,
  reviewerFeedback = [],
) => {
  const rows = [];

  Object.entries(domainData || {}).forEach(([domainKey, node]) => {
    const domain = normaliseDomainKey(domainKey);

    if (!domain) return;

    const items = [];

    walkItems(node, items);

    const maxScore = inferMaxScore(items);

    items.forEach((item) => {
      const label = firstOf(item, LABEL_KEYS);

      const reviewerComment = firstOf(item, REVIEWER_COMMENT_KEYS);

      const startupNote = firstOf(item, STARTUP_NOTE_KEYS);

      if (!label && !reviewerComment && !startupNote) return;

      rows.push({
        domain,
        subDomain: label || "General",
        ratio: toRatio(item.score, maxScore),
        reviewerComment,
        startupNote,
      });
    });
  });

  (Array.isArray(reviewerFeedback) ? reviewerFeedback : []).forEach((entry) => {
    if (typeof entry === "string") {
      const text = clean(entry);

      if (text) {
        rows.push({
          domain: null,
          subDomain: "Reviewer feedback",
          ratio: null,
          reviewerComment: text,
          startupNote: "",
        });
      }

      return;
    }

    if (!entry || typeof entry !== "object") return;

    const reviewerComment = firstOf(entry, REVIEWER_COMMENT_KEYS);

    const startupNote = firstOf(entry, STARTUP_NOTE_KEYS);

    if (!reviewerComment && !startupNote) return;

    rows.push({
      domain: normaliseDomainKey(entry.domain || entry.domainKey),
      subDomain: firstOf(entry, LABEL_KEYS) || "Reviewer feedback",
      ratio: toRatio(entry.score, Number(entry.maxScore) || 5),
      reviewerComment,
      startupNote,
    });
  });

  // Identical comments are common when a reviewer copies the same note across
  // questions; keep one of each so the model is not skewed by repetition.
  const seen = new Set();

  return rows.filter((row) => {
    const key = `${row.domain}|${row.subDomain}|${row.reviewerComment}|${row.startupNote}`;

    if (seen.has(key)) return false;

    seen.add(key);

    return true;
  });
};

export const hasUsableEvidence = (evidence) =>
  evidence.some((row) => row.reviewerComment || row.startupNote);

// ─── AI generation ───────────────────────────────────────────────────────────

const pctOf = (scoreData, key) =>
  Math.max(0, Math.min(100, Math.round(Number(scoreData?.[key]?.percentage || 0))));

const buildInsightPrompt = ({
  businessName,
  sector,
  location,
  scoreData,
  evidence,
}) => {
  const domainLines = INSIGHT_DOMAINS.map(
    (domain) =>
      `- ${domain.full}: ${pctOf(scoreData, domain.key)}% (${
        scoreData?.[domain.key]?.status || "Not Ready"
      })`,
  ).join("\n");

  // Weakest first, and capped per domain, so the most diagnostic evidence
  // survives the token budget.
  const evidenceByDomain = INSIGHT_DOMAINS.map((domain) => {
    const rows = evidence
      .filter((row) => row.domain === domain.key)
      .sort((a, b) => (a.ratio ?? 1) - (b.ratio ?? 1))
      .slice(0, 10)
      .map((row) => ({
        subDomain: row.subDomain,
        scorePct: row.ratio === null ? null : Math.round(row.ratio * 100),
        reviewerComment: row.reviewerComment || null,
        startupNote: row.startupNote || null,
      }));

    return `${domain.full}: ${JSON.stringify(rows)}`;
  }).join("\n");

  const general = evidence
    .filter((row) => !row.domain)
    .slice(0, 10)
    .map((row) => row.reviewerComment || row.startupNote)
    .filter(Boolean);

  return `You are a senior investment analyst writing the "Key Thematic Gaps" and "Key Recommendations" sections of a Capital Readiness Assessment report for a specific business in East Africa.

BUSINESS
- Name: ${businessName}
- Sector: ${sector || "Not specified"}
- Location: ${location || "Not specified"}

DOMAIN READINESS SCORES (investment-ready threshold is 70%)
${domainLines}

ASSESSMENT EVIDENCE — reviewer comments recorded against each sub-domain, and the notes the entrepreneur entered themselves:
${evidenceByDomain}
${general.length ? `\nGENERAL REVIEWER FEEDBACK: ${JSON.stringify(general)}` : ""}

TASK
Write EXACTLY 4 thematic gaps and EXACTLY 4 recommendations for THIS business.

Rules:
- Ground every gap in the evidence above. Paraphrase what the reviewers and the entrepreneur actually wrote — never invent facts, figures, systems or events that are not in the evidence.
- A gap is a theme, not a single question: group related reviewer observations into one cross-cutting issue and explain what it means for investment readiness.
- Prioritise the lowest-scoring domains and the sub-domains with the most critical reviewer comments. Do not write one gap per domain out of habit — if two weak domains share a root cause, say so, and if one domain has several distinct critical issues, it may carry more than one gap.
- Where a domain has little or no reviewer commentary, lean on its score and say plainly that evidence was limited.
- Each recommendation must close one of the four gaps, in the same order. Make it a specific, sequenced action this business can take, with the artefact or routine it should produce.
- Refer to the business as "${businessName}". Use British English. No markdown, no bullet characters, no headings inside the strings.
- "title" is a short bold lead-in of 4–12 words with no trailing colon. "body" is 2–3 sentences.

Return ONLY raw JSON in exactly this shape:
{
  "gaps": [{ "domain": "commercial|financial|operations|legal", "title": "...", "body": "..." }],
  "recommendations": [{ "domain": "commercial|financial|operations|legal", "title": "...", "body": "..." }]
}`;
};

const parseJsonBlock = (raw) => {
  const cleaned = String(raw || "")
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  const match = cleaned.match(/\{[\s\S]*\}/);

  if (!match) throw new Error("AI did not return valid JSON");

  return JSON.parse(match[0]);
};

const normaliseInsightList = (list) =>
  (Array.isArray(list) ? list : [])
    .map((entry) => {
      if (typeof entry === "string") {
        return { domain: null, title: "", body: clean(entry) };
      }

      const title = clean(entry?.title || entry?.lead || entry?.heading);

      const body = clean(entry?.body || entry?.description || entry?.text);

      if (!title && !body) return null;

      return {
        domain: normaliseDomainKey(entry?.domain),
        title: title.replace(/:\s*$/, ""),
        body: body || title,
      };
    })
    .filter(Boolean);

// ─── Deterministic derivation ────────────────────────────────────────────────

const excerpt = (text, limit = 190) => {
  const value = clean(text);

  if (value.length <= limit) return value;

  const trimmed = value.slice(0, limit);

  const cut = trimmed.lastIndexOf(" ");

  return `${trimmed.slice(0, cut > 60 ? cut : limit)}…`;
};

const firstSentence = (text) => {
  const value = clean(text);

  const match = value.match(/^[^.!?]+[.!?]/);

  return match ? match[0].trim() : value;
};

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "are",
  "not",
  "but",
  "with",
  "that",
  "this",
  "have",
  "has",
  "was",
  "were",
  "from",
  "they",
  "there",
  "their",
  "been",
  "into",
  "which",
  "will",
  "would",
  "should",
  "business",
]);

// Pick the baseline recommendation whose wording overlaps most with what the
// reviewers actually raised, so the action matches the observed problem.
const pickRecommendation = (recs, text) => {
  const words = new Set(
    clean(text)
      .toLowerCase()
      .split(/[^a-z]+/)
      .filter((word) => word.length > 3 && !STOP_WORDS.has(word)),
  );

  if (!words.size) return recs[0];

  let best = recs[0];

  let bestScore = -1;

  recs.forEach((rec) => {
    const score = rec
      .toLowerCase()
      .split(/[^a-z]+/)
      .filter((word) => words.has(word)).length;

    if (score > bestScore) {
      bestScore = score;
      best = rec;
    }
  });

  return best;
};

// An item is treated as a gap when it scores below the same 70% bar the report
// applies to domains.
const READINESS_RATIO = 0.7;

const buildDerivedInsights = ({ scoreData, evidence }) => {
  // Weakest domain first — the gaps are ordered by where readiness is worst.
  const ranked = [...INSIGHT_DOMAINS].sort(
    (a, b) => pctOf(scoreData, a.key) - pctOf(scoreData, b.key),
  );

  const gaps = [];

  const recommendations = [];

  ranked.forEach((domain) => {
    const base = DOMAIN_FALLBACK[domain.key];

    const percentage = pctOf(scoreData, domain.key);

    const rows = evidence
      .filter((row) => row.domain === domain.key)
      .sort((a, b) => (a.ratio ?? 1) - (b.ratio ?? 1));

    // Only under-performing items describe a gap — a sub-domain the reviewer
    // scored well is a strength and must not be quoted as a weakness.
    const weakRows = rows.filter(
      (row) => row.ratio === null || row.ratio < READINESS_RATIO,
    );

    const cited = weakRows.filter((row) => row.reviewerComment).slice(0, 2);

    const noted = weakRows.find((row) => row.startupNote);

    const focus = cited[0]?.subDomain || weakRows[0]?.subDomain || "";

    const onTrack = percentage >= 70;

    const citedText = cited
      .map((row) => `"${excerpt(row.reviewerComment, 150)}"`)
      .join(" and ");

    const title =
      focus && focus !== "General" && focus !== "Reviewer feedback"
        ? `${domain.label} — ${focus} (${percentage}%)`
        : `${base.gapTitle} (${percentage}%)`;

    const opening = onTrack
      ? `${domain.full} clears the 70% investment-readiness threshold at ${percentage}%, so what remains is keeping the supporting evidence current and complete.`
      : firstSentence(base.gap);

    let body;

    if (cited.length) {
      body = [
        opening,
        `Reviewers recorded ${citedText}.`,
        noted
          ? `The business itself noted "${excerpt(noted.startupNote, 130)}".`
          : "",
        onTrack
          ? ""
          : `At ${percentage}% this domain sits below the 70% readiness threshold.`,
      ]
        .filter(Boolean)
        .join(" ");
    } else if (onTrack) {
      body = `${opening} No critical reviewer observations were recorded against this domain.`;
    } else {
      body = `${base.gap}${
        rows.length
          ? ` At ${percentage}% it sits below the 70% readiness threshold.`
          : " No reviewer commentary was recorded for this domain, so the score alone carries the assessment."
      }`;
    }

    gaps.push({ domain: domain.key, title, body });

    const evidenceText = [
      ...cited.map((row) => row.reviewerComment),
      noted?.startupNote,
      focus,
    ]
      .filter(Boolean)
      .join(" ");

    const target =
      focus && focus !== "General" && focus !== "Reviewer feedback"
        ? focus.toLowerCase()
        : "";

    recommendations.push({
      domain: domain.key,
      title: target
        ? `${domain.label}: ${onTrack ? "maintain" : "strengthen"} ${target}`
        : `${domain.label}: ${
            onTrack ? "sustain current standard" : "close the readiness gap"
          }`,
      body: pickRecommendation(base.recs, evidenceText),
    });
  });

  return { gaps, recommendations };
};

// ─── Public API ──────────────────────────────────────────────────────────────

const TARGET_COUNT = 4;

// Exactly four of each is what the report lays out, so top up from the derived
// set and trim anything extra.
const fitToFour = (list, filler) => {
  const out = [...list];

  filler.forEach((item) => {
    if (out.length >= TARGET_COUNT) return;

    const duplicate = out.some(
      (existing) =>
        existing.title.toLowerCase() === item.title.toLowerCase() ||
        existing.body.toLowerCase() === item.body.toLowerCase(),
    );

    if (!duplicate) out.push(item);
  });

  return out.slice(0, TARGET_COUNT);
};

/**
 * Generate the four thematic gaps and four recommendations for one startup.
 *
 * @returns {Promise<{gaps: Array, recommendations: Array, source: "ai"|"derived", evidenceCount: number}>}
 */
export const generateCratInsights = async ({
  domainData,
  scoreData,
  businessName = "The business",
  sector = "",
  location = "",
  reviewerFeedback = [],
  onStatus,
} = {}) => {
  const evidence = collectAssessmentEvidence(domainData, reviewerFeedback);

  const derived = buildDerivedInsights({ scoreData, evidence });

  if (!openai || !hasUsableEvidence(evidence)) {
    return {
      ...derived,
      source: "derived",
      evidenceCount: evidence.length,
    };
  }

  try {
    onStatus?.("Analysing reviewer comments...");

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: buildInsightPrompt({
            businessName,
            sector,
            location,
            scoreData,
            evidence,
          }),
        },
      ],
      temperature: 0.4,
      max_tokens: 2000,
    });

    const parsed = parseJsonBlock(response.choices[0]?.message?.content);

    const gaps = normaliseInsightList(parsed.gaps);

    const recommendations = normaliseInsightList(parsed.recommendations);

    if (!gaps.length || !recommendations.length) {
      throw new Error("AI returned no usable gaps or recommendations");
    }

    return {
      gaps: fitToFour(gaps, derived.gaps),
      recommendations: fitToFour(recommendations, derived.recommendations),
      source: "ai",
      evidenceCount: evidence.length,
    };
  } catch (error) {
    console.warn(
      "CRAT insight generation failed, deriving from assessment data:",
      error.message,
    );

    return {
      ...derived,
      source: "derived",
      evidenceCount: evidence.length,
    };
  }
};
