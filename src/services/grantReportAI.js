import OpenAI from "openai";

// AI-assisted grant report. Given a startup's grant + milestone data, it
// produces a narrative answer for each of the six standard grant-report
// sections. Used by entrepreneurs, BDAs/Staff and Finance Officers to
// download a report for a startup.

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

const openai = OPENAI_API_KEY
  ? new OpenAI({ apiKey: OPENAI_API_KEY, dangerouslyAllowBrowser: true })
  : null;

// The six report sections (order is preserved in the PDF).
export const GRANT_REPORT_SECTIONS = [
  {
    key: "keyMilestones",
    title: "Key Milestones",
    question:
      "What were the main milestones you aimed to achieve with the grant funds?",
  },
  {
    key: "fundAllocation",
    title: "Fund Allocation",
    question:
      "How and where did you allocate the funds within your organization?",
  },
  {
    key: "currentProgress",
    title: "Current Progress and Impact",
    question:
      "Provide an update on your progress and impact so far. Feel free to include pictures, videos, or any other relevant materials that showcase your achievements.",
  },
  {
    key: "challenges",
    title: "Challenges",
    question:
      "What challenges have you faced and what measures did you take to address them?",
  },
  {
    key: "learningNextSteps",
    title: "Learning and Next Steps",
    question:
      "What are the learnings from this phase of the grant? What additional steps do you plan to take to raise more investments?",
  },
  {
    key: "financialBreakdown",
    title: "Financial Breakdown",
    question:
      "Please provide a detailed breakdown of how the funds were spent, supported by relevant documents such as contracts, invoices, receipts, and bank statements.",
  },
];

const num = (value) => {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
};

const money = (value) => `TZS ${num(value).toLocaleString()}`;

// Build a plain-text data digest for the prompt / fallback.
const describeContext = (context = {}) => {
  const s = context.startup || {};
  const g = context.grant || {};
  const milestones = Array.isArray(context.milestones) ? context.milestones : [];

  const lines = [];
  lines.push(`Company: ${s.name || "N/A"}`);
  if (s.sector) lines.push(`Industry/Sector: ${s.sector}`);
  if (s.location) lines.push(`Location: ${s.location}`);
  if (s.stage) lines.push(`Stage: ${s.stage}`);
  if (s.description) lines.push(`About: ${s.description}`);
  lines.push("");
  lines.push(`Grant amount: ${money(g.amount)}`);
  lines.push(`Disbursed amount: ${money(g.disbursed)}`);
  lines.push(`Amount spent: ${money(g.spent)}`);
  lines.push(
    `Balance: ${money(
      g.balance != null ? g.balance : num(g.disbursed || g.amount) - num(g.spent),
    )}`,
  );
  if (g.purpose) lines.push(`Grant purpose: ${g.purpose}`);
  if (g.reportDate) lines.push(`Report date: ${g.reportDate}`);

  if (milestones.length) {
    lines.push("");
    lines.push("Milestones:");
    milestones.forEach((m, i) => {
      const kpis = Array.isArray(m.kpis)
        ? m.kpis
            .map(
              (k) =>
                `${k.name || "KPI"} (target: ${k.target || "-"}, current: ${
                  k.currentValue || "-"
                })`,
            )
            .join("; ")
        : "";
      lines.push(
        `  ${i + 1}. ${m.title || "Milestone"} — status: ${
          m.status || "pending"
        }${m.tranche ? `, tranche: ${m.tranche}` : ""}${
          m.notes ? `, report: ${m.notes}` : ""
        }${kpis ? `, KPIs: ${kpis}` : ""}`,
      );
    });
  }

  return lines.join("\n");
};

// A usable report built straight from the data when AI is unavailable.
const fallbackReport = (context = {}) => {
  const g = context.grant || {};
  const milestones = Array.isArray(context.milestones) ? context.milestones : [];
  const balance =
    g.balance != null ? g.balance : num(g.disbursed || g.amount) - num(g.spent);

  const milestoneList = milestones.length
    ? milestones
        .map((m) => `• ${m.title || "Milestone"} (${m.status || "pending"})`)
        .join("\n")
    : "No milestones have been recorded for this grant yet.";

  return {
    keyMilestones: `The key milestones planned for this grant are:\n${milestoneList}`,
    fundAllocation: g.purpose
      ? `The grant funds were allocated as follows: ${g.purpose}`
      : "Fund allocation details have not been provided yet.",
    currentProgress: milestones.length
      ? `Progress to date: ${
          milestones.filter((m) => m.status === "completed").length
        } of ${milestones.length} milestone(s) completed.`
      : "No progress updates have been recorded yet.",
    challenges:
      "No challenges have been documented for this reporting period.",
    learningNextSteps:
      "Learnings and next steps have not yet been documented for this phase of the grant.",
    financialBreakdown: `Grant amount: ${money(
      g.amount,
    )}\nDisbursed: ${money(g.disbursed)}\nSpent: ${money(
      g.spent,
    )}\nBalance: ${money(balance)}`,
  };
};

const buildPrompt = (context) => `
You are a grant reporting assistant for an African startup accelerator.
Using ONLY the data provided below, write a clear, professional progress
report for this startup's grant. Answer each of the six sections in 1-3
short paragraphs. Be specific and reference the figures and milestones given.
If the data for a section is thin, state what is known and note that more
detail is required — do not invent facts.

STARTUP & GRANT DATA:
${describeContext(context)}

Return a strict JSON object with exactly these string keys:
"keyMilestones"      -> What were the main milestones you aimed to achieve with the grant funds?
"fundAllocation"     -> How and where were the funds allocated within the organization?
"currentProgress"    -> An update on progress and impact so far.
"challenges"         -> Challenges faced and the measures taken to address them.
"learningNextSteps"  -> Learnings from this phase and additional steps to raise more investment.
"financialBreakdown" -> A detailed breakdown of how the funds were spent (reference the grant, disbursed, spent and balance figures).

Return ONLY the JSON object.`;

export const generateGrantReport = async (context = {}) => {
  if (!openai) return fallbackReport(context);

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: buildPrompt(context) }],
      temperature: 0.6,
      max_tokens: 2500,
      response_format: { type: "json_object" },
    });

    const text = response?.choices?.[0]?.message?.content || "";
    const parsed = JSON.parse(text);
    const fallback = fallbackReport(context);

    const report = {};
    GRANT_REPORT_SECTIONS.forEach((section) => {
      const value = String(parsed[section.key] || "").trim();
      report[section.key] = value || fallback[section.key];
    });
    return report;
  } catch (error) {
    console.error("generateGrantReport error:", error);
    return fallbackReport(context);
  }
};
