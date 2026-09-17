// Words and styles for capital facilitation values.
//
// The API speaks in keys ("due_diligence", "revenue_based"); people read these.
// A status is always shown as its word on a tinted chip - the colour helps
// scanning, the word carries the meaning.

export const human = (value) => {
  const text = String(value || "").replace(/_/g, " ").trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "";
};

const labelFrom = (map) => (key) => map[key] || human(key);

export const STAGE_LABELS = {
  capital_request: "Capital Request",
  manager_review: "Manager Review",
  capital_ready: "Capital Ready",
  matching: "Matching",
  introduction: "Introduction",
  provider_interest: "Capital Provider Interest",
  initial_meeting: "Initial Meeting",
  due_diligence: "Due Diligence",
  provider_review: "Provider Internal Review",
  negotiation: "Negotiation",
  term_sheet: "Term Sheet / Offer",
  commitment: "Commitment",
  disbursement: "Disbursement",
  capital_secured: "Capital Secured",
  post_financing: "Post-Financing Monitoring",
};
export const stageLabel = labelFrom(STAGE_LABELS);

export const REQUEST_STATUS_LABELS = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under Review",
  more_information_required: "More Information Required",
  approved_for_matching: "Approved for Matching",
  matching_in_progress: "Matching in Progress",
  capital_provider_identified: "Capital Provider Identified",
  introduction_pending: "Introduction Pending",
  introduction_approved: "Introduction Approved",
  capital_provider_engaged: "Capital Provider Engaged",
  due_diligence: "Due Diligence",
  negotiation: "Negotiation",
  commitment_secured: "Commitment Secured",
  partially_funded: "Partially Funded",
  fully_funded: "Fully Funded",
  disbursed: "Disbursed",
  declined: "Declined",
  on_hold: "On Hold",
  closed: "Closed",
};
export const requestStatusLabel = labelFrom(REQUEST_STATUS_LABELS);

export const FINANCING_LABELS = {
  grant: "Grant",
  debt: "Debt",
  equity: "Equity",
  convertible: "Convertible Instrument",
  revenue_based: "Revenue-Based Finance",
  working_capital: "Working Capital",
  asset_finance: "Asset Finance / Capital Lease",
  catalytic: "Catalytic Capital",
  blended: "Blended Finance",
  guarantee: "Guarantee",
  other: "Other",
};
export const financingLabel = labelFrom(FINANCING_LABELS);

export const PROVIDER_TYPE_LABELS = {
  investor: "Investor",
  venture_capital: "Venture Capital Fund",
  impact_investor: "Impact Investor",
  bank: "Bank",
  microfinance: "Microfinance Institution",
  dfi: "Development Finance Institution",
  foundation: "Foundation",
  grant_provider: "Grant Provider",
  government_fund: "Government Fund",
  corporate_fund: "Corporate Fund",
  angel: "Angel Investor",
  family_office: "Family Office",
  accelerator: "Accelerator",
  catalytic_capital: "Catalytic Capital Provider",
  blended_facility: "Blended Finance Facility",
};
export const providerTypeLabel = labelFrom(PROVIDER_TYPE_LABELS);

export const READINESS_LABELS = {
  not_assessed: "Not assessed",
  not_ready: "Not ready",
  emerging: "Emerging",
  ready: "Capital ready",
  investment_ready: "Investment ready",
};
export const readinessLabel = labelFrom(READINESS_LABELS);

export const OUTCOME_LABELS = {
  capital_secured: "Capital Secured",
  partially_secured: "Partially Secured",
  declined_by_provider: "Declined by Capital Provider",
  withdrawn_by_enterprise: "Withdrawn by Enterprise",
  not_capital_ready: "Not Capital Ready",
  eligibility_not_met: "Eligibility Not Met",
  no_response: "No Response",
  application_unsuccessful: "Application Unsuccessful",
  other: "Other",
};
export const outcomeLabel = labelFrom(OUTCOME_LABELS);

export const CONTRIBUTION_LABELS = {
  enterprise_identification: "Enterprise Identification",
  investment_readiness: "Investment Readiness Support",
  financial_model: "Financial Model Development",
  pitch_preparation: "Pitch Preparation",
  provider_matching: "Capital Provider Matching",
  introduction: "Introduction",
  due_diligence_support: "Due Diligence Support",
  negotiation_support: "Negotiation Support",
  documentation_support: "Documentation Support",
  deal_structuring: "Deal Structuring",
  follow_up: "Follow-Up",
  post_investment_support: "Post-Investment Support",
};
export const contributionLabel = labelFrom(CONTRIBUTION_LABELS);

export const MODE_LABELS = {
  moderated: { label: "Moderated", note: "Every message between the parties waits for Anza's approval." },
  monitored: { label: "Monitored", note: "The parties talk directly; Anza reads along and can step in." },
  direct: { label: "Direct", note: "The parties talk directly; Anza keeps following the deal." },
};
export const modeLabel = (key) => (MODE_LABELS[key] ? MODE_LABELS[key].label : human(key));

export const VISIBILITY_LABELS = {
  internal: { label: "Internal Only", note: "Anza staff only" },
  provider: { label: "Capital Provider Can View", note: "The capital provider on this opportunity, and Anza" },
  enterprise: { label: "Enterprise Can View", note: "The enterprise, and Anza" },
  both: { label: "Both Parties", note: "The enterprise, the capital provider, and Anza" },
  restricted: { label: "Restricted", note: "Capital Facilitation Managers only" },
};
export const visibilityLabel = (key) => (VISIBILITY_LABELS[key] ? VISIBILITY_LABELS[key].label : human(key));

export const DOCUMENT_CATEGORY_LABELS = {
  pitch_deck: "Pitch Deck",
  business_plan: "Business Plan",
  financial_statements: "Financial Statements",
  management_accounts: "Management Accounts",
  financial_model: "Financial Model",
  legal_documents: "Legal Documents",
  registration_documents: "Registration Documents",
  tax_documents: "Tax Documents",
  shareholding_information: "Shareholding Information",
  governance_documents: "Governance Documents",
  impact_information: "Impact Information",
  esg_information: "ESG Information",
  due_diligence_documents: "Due Diligence Documents",
  term_sheet: "Term Sheet",
  investment_agreement: "Investment Agreement",
  loan_agreement: "Loan Agreement",
  grant_agreement: "Grant Agreement",
  commitment_letter: "Commitment Letter",
  signed_agreement: "Signed Agreement",
  investor_confirmation: "Investor Confirmation",
  bank_confirmation: "Bank Confirmation",
  disbursement_evidence: "Disbursement Evidence",
  other: "Other",
};
export const documentCategoryLabel = labelFrom(DOCUMENT_CATEGORY_LABELS);

export const DD_CATEGORY_LABELS = {
  business: "Business",
  financial: "Financial",
  legal: "Legal",
  tax: "Tax",
  governance: "Governance",
  management: "Management",
  market: "Market",
  operations: "Operations",
  impact: "Impact",
  esg: "ESG",
  compliance: "Compliance",
  financing_readiness: "Investment / Financing Readiness",
};
export const ddCategoryLabel = labelFrom(DD_CATEGORY_LABELS);

export const INTERVENTION_LABELS = {
  request_enterprise_clarification: "Request enterprise clarification",
  request_provider_clarification: "Request capital provider clarification",
  stop_introduction: "Stop introduction",
  pause_communication: "Pause communication",
  change_provider: "Change capital provider",
  recommend_additional_providers: "Recommend additional capital providers",
  request_updated_documents: "Request updated documents",
  schedule_meeting: "Schedule meeting",
  escalate: "Escalate opportunity",
  flag_compliance_concern: "Flag compliance concern",
  flag_financing_risk: "Flag financing risk",
  flag_documentation_issue: "Flag documentation issue",
  close_opportunity: "Close opportunity",
  change_communication_mode: "Changed communication mode",
  communication_intervention: "Wrote into the parties' conversation",
  message_edited: "Edited a message before delivery",
  message_rejected: "Rejected a message",
};
export const interventionLabel = labelFrom(INTERVENTION_LABELS);

export const INTRODUCTION_TYPE_LABELS = {
  introduction: "Introduction",
  pitch_deck: "Pitch Deck",
  financial_information: "Financial Information",
  meeting: "Meeting",
  due_diligence_documents: "Due Diligence Documents",
  business_plan: "Business Plan",
  financial_model: "Financial Model",
  additional_information: "Additional Business Information",
};
export const introductionTypeLabel = labelFrom(INTRODUCTION_TYPE_LABELS);

// ---- Audit entries ------------------------------------------------------------

const fieldName = (key) => String(key).replace(/([a-z])([A-Z])/g, "$1 $2").replace(/_/g, " ").toLowerCase();

const parseJson = (value) => {
  if (!value) return {};
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value) || {};
  } catch {
    return {};
  }
};

// "status: submitted → under review" from an audit entry's before and after.
export const changeSummary = (oldValue, newValue) => {
  const before = parseJson(oldValue);
  const after = parseJson(newValue);
  const show = (value) => {
    if (value === null || value === undefined || value === "") return "—";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value).replace(/_/g, " ");
  };
  return [...new Set([...Object.keys(before), ...Object.keys(after)])]
    .slice(0, 8)
    .map((key) => `${fieldName(key)}: ${key in before ? `${show(before[key])} → ` : ""}${key in after ? show(after[key]) : "—"}`)
    .join("; ");
};

export const fileSize = (bytes) => {
  const value = Number(bytes) || 0;
  if (value >= 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  if (value >= 1024) return `${Math.round(value / 1024)} KB`;
  return `${value} B`;
};

// ---- Chip styles ------------------------------------------------------------

const TONES = {
  neutral: "bg-slate-100 text-slate-700",
  info: "bg-blue-50 text-blue-700",
  progress: "bg-indigo-50 text-indigo-700",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-800",
  danger: "bg-rose-50 text-rose-700",
};

const TONE_OF = {
  draft: "neutral",
  submitted: "info",
  under_review: "info",
  more_information_required: "warning",
  approved_for_matching: "progress",
  matching_in_progress: "progress",
  capital_provider_identified: "progress",
  introduction_pending: "warning",
  introduction_approved: "progress",
  capital_provider_engaged: "progress",
  due_diligence: "progress",
  negotiation: "progress",
  commitment_secured: "success",
  partially_funded: "success",
  fully_funded: "success",
  disbursed: "success",
  declined: "danger",
  on_hold: "warning",
  closed: "neutral",
  // opportunity status
  active: "progress",
  won: "success",
  lost: "danger",
  // introductions
  pending_review: "warning",
  changes_requested: "warning",
  clarification_requested: "warning",
  awaiting_enterprise_permission: "warning",
  permission_denied: "danger",
  approved: "success",
  scheduled: "success",
  replaced: "neutral",
  // messages
  pending_approval: "warning",
  delivered: "success",
  rejected: "danger",
  // due diligence
  not_started: "neutral",
  requested: "info",
  under_review_dd: "info",
  verified: "success",
  issue_identified: "danger",
  resolved: "success",
  not_applicable: "neutral",
  // risk
  low: "neutral",
  medium: "warning",
  high: "danger",
  critical: "danger",
};

export const toneClass = (key) => TONES[TONE_OF[key] || "neutral"];

// ---- Numbers ------------------------------------------------------------------

export const money = (amount, currency = "USD") => {
  if (amount === null || amount === undefined || amount === "") return "—";
  const value = Number(amount);
  if (!Number.isFinite(value)) return "—";
  return `${currency || ""} ${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`.trim();
};

// Large sums in a tile: USD 1.2M, USD 350K.
export const compactUsd = (amount) => {
  const value = Number(amount) || 0;
  if (Math.abs(value) >= 1e9) return `USD ${(value / 1e9).toFixed(1)}B`;
  if (Math.abs(value) >= 1e6) return `USD ${(value / 1e6).toFixed(1)}M`;
  if (Math.abs(value) >= 1e3) return `USD ${Math.round(value / 1e3)}K`;
  return `USD ${Math.round(value)}`;
};

export const shortDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

export const dateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

// Match strength, always with its word.
export const matchStrength = (score) => {
  const value = Number(score);
  if (!Number.isFinite(value)) return { label: "Not scored", className: TONES.neutral };
  if (value >= 75) return { label: "Strong", className: TONES.success };
  if (value >= 50) return { label: "Moderate", className: TONES.warning };
  return { label: "Weak", className: TONES.danger };
};
