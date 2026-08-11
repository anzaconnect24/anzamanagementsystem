// Tranche-based milestone + KPI governance workflow.
//
// A "tranche plan" is one milestone that governs a single funding tranche.
// It carries a structured KPI plan and moves through an approval lifecycle
// (proposed by entrepreneur -> reviewed/approved by BDA -> disbursed) and,
// after work, a verification lifecycle (entrepreneur reports KPI actuals ->
// requests verification -> BDA marks achievement).
//
// To stay compatible with the existing milestone endpoints, the structured
// data is carried in milestone fields:
//   - planStatus          : PLAN_STATUS value (approval lifecycle)
//   - verificationStatus  : VERIFICATION value (achievement outcome)
//   - kpiPlan             : array of KPI objects (JSON; see KPI_SHAPE)
//   - disbursed           : boolean (Phase 4)
// These are sent alongside the normal milestone payload. Use the encode/decode
// helpers so the array survives backends that store it as a JSON string.

// ---- Plan approval lifecycle (Phases 2-4) -------------------------------
export const PLAN_STATUS = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  UNDER_REVIEW: "under_review",
  REVISION_REQUESTED: "revision_requested",
  RESUBMITTED: "resubmitted",
  APPROVED: "plan_approved",
  REJECTED: "rejected",
  SENT_TO_FINANCE: "sent_to_finance",
  DISBURSED: "disbursed",
};

// Labels describe the milestone, not the money: disbursement is a state of the
// tranche, so the milestone whose report released it reads "Report approved".
export const PLAN_STATUS_LABEL = {
  draft: "Draft",
  submitted: "Submitted by entrepreneur",
  under_review: "Under BDA review",
  revision_requested: "Revision requested",
  resubmitted: "Resubmitted",
  plan_approved: "BDA approved",
  rejected: "Rejected",
  sent_to_finance: "Sent to finance",
  disbursed: "Report approved",
};

// Tailwind pill classes (match the app's existing status pill palette).
export const PLAN_STATUS_PILL = {
  draft: "bg-slate-100 text-slate-600",
  submitted: "bg-[#dbe8ff] text-[#163b8f]",
  under_review: "bg-[#dbe8ff] text-[#163b8f]",
  revision_requested: "bg-[#fdf1ce] text-[#8a6500]",
  resubmitted: "bg-[#dbe8ff] text-[#163b8f]",
  plan_approved: "bg-[#e1f0d8] text-[#2d6e1f]",
  rejected: "bg-[#fde0e0] text-[#a11111]",
  sent_to_finance: "bg-[#ede9fe] text-[#5b21b6]",
  disbursed: "bg-[#e1f0d8] text-[#2d6e1f]",
};

// ---- Report outcomes ----------------------------------------------------
//
// The milestone's own `status` field, as the report lifecycle uses it. Separate
// from PLAN_STATUS: a plan can stay approved while its report goes back and
// forth. `info_requested` is the BDA asking for more detail — it reopens the
// row for the startup exactly like a decline, but it is not a rejection and
// must not be shown as one.
export const REPORT_STATUS = {
  SUBMITTED: "submitted",
  COMPLETED: "completed",
  REJECTED: "rejected",
  INFO_REQUESTED: "info_requested",
};

// Statuses the startup can submit or resubmit a report from.
export const isReportOpen = (status) =>
  ![REPORT_STATUS.SUBMITTED, REPORT_STATUS.COMPLETED].includes(
    String(status || "").toLowerCase(),
  );

// ---- Verification outcomes (Phase 7) ------------------------------------
export const VERIFICATION = {
  PENDING: "",
  ACHIEVED: "achieved",
  PARTIALLY: "partially_achieved",
  NOT_ACHIEVED: "not_achieved",
  NEED_MORE_EVIDENCE: "need_more_evidence",
};

export const VERIFICATION_LABEL = {
  "": "Not verified",
  achieved: "Achieved",
  partially_achieved: "Partially achieved",
  not_achieved: "Not achieved",
  need_more_evidence: "Need more evidence",
};

export const VERIFICATION_PILL = {
  "": "bg-slate-100 text-slate-600",
  achieved: "bg-[#e1f0d8] text-[#2d6e1f]",
  partially_achieved: "bg-[#fdf1ce] text-[#8a6500]",
  not_achieved: "bg-[#fde0e0] text-[#a11111]",
  need_more_evidence: "bg-[#fdf1ce] text-[#8a6500]",
};

export const VERIFICATION_OPTIONS = [
  { value: VERIFICATION.ACHIEVED, label: "Achieved" },
  { value: VERIFICATION.PARTIALLY, label: "Partially achieved" },
  { value: VERIFICATION.NOT_ACHIEVED, label: "Not achieved" },
  { value: VERIFICATION.NEED_MORE_EVIDENCE, label: "Need more evidence" },
];

// ---- Helpers ------------------------------------------------------------
export const planStatusLabel = (status) =>
  PLAN_STATUS_LABEL[status] || PLAN_STATUS_LABEL.draft;

export const planStatusPill = (status) =>
  PLAN_STATUS_PILL[status] || PLAN_STATUS_PILL.draft;

export const verificationLabel = (status) =>
  VERIFICATION_LABEL[status || ""] || VERIFICATION_LABEL[""];

export const verificationPill = (status) =>
  VERIFICATION_PILL[status || ""] || VERIFICATION_PILL[""];

// A single KPI line in a tranche plan.
export const emptyKpi = () => ({
  name: "",
  target: "",
  evidenceSource: "",
  currentValue: "",
  comment: "",
  evidenceUrl: "",
  updatedAt: "",
});

// Parse a kpiPlan that may arrive as an array or a JSON string.
export const parseKpiPlan = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

// The entrepreneur can edit the plan before approval, or when a revision is
// requested / it was rejected.
export const canEditPlan = (planStatus) =>
  [
    PLAN_STATUS.DRAFT,
    PLAN_STATUS.REVISION_REQUESTED,
    PLAN_STATUS.REJECTED,
    "",
    undefined,
    null,
  ].includes(planStatus);

// The entrepreneur can submit/resubmit the plan for review.
export const canSubmitPlan = (planStatus) =>
  [PLAN_STATUS.DRAFT, PLAN_STATUS.REVISION_REQUESTED, "", undefined, null].includes(
    planStatus,
  );

// The BDA can act on the plan (approve / request revision / reject).
export const canReviewPlan = (planStatus) =>
  [PLAN_STATUS.SUBMITTED, PLAN_STATUS.UNDER_REVIEW, PLAN_STATUS.RESUBMITTED].includes(
    planStatus,
  );

// The plan has cleared BDA review — the milestone is approved and can be
// reported on. Approval only moves planStatus; the milestone's own status stays
// where it was, so callers must not read approval off `status`.
export const isPlanApproved = (planStatus) =>
  [
    PLAN_STATUS.APPROVED,
    PLAN_STATUS.SENT_TO_FINANCE,
    PLAN_STATUS.DISBURSED,
  ].includes(planStatus);

// The entrepreneur can revise their own plan while it is still with the BDA,
// after it comes back for changes, and after approval — an approved plan that
// changes goes back for re-approval (see reviseTrackerMilestone), so what the
// BDA signed off always matches what is on record. Revision closes once the
// money is committed: sent to finance, disbursed, or rejected outright.
export const canRevisePlan = (planStatus) =>
  [
    PLAN_STATUS.DRAFT,
    PLAN_STATUS.SUBMITTED,
    PLAN_STATUS.UNDER_REVIEW,
    PLAN_STATUS.REVISION_REQUESTED,
    PLAN_STATUS.RESUBMITTED,
    PLAN_STATUS.APPROVED,
  ].includes(planStatus || PLAN_STATUS.DRAFT);

// A tranche can only be disbursed once the plan is approved (Phase 4 rule).
export const canDisburse = (planStatus, disbursed) =>
  !disbursed &&
  [PLAN_STATUS.APPROVED, PLAN_STATUS.SENT_TO_FINANCE].includes(planStatus);

// The entrepreneur can log KPI progress once funds are released.
export const canReportProgress = (planStatus, disbursed) =>
  Boolean(disbursed) || planStatus === PLAN_STATUS.DISBURSED;

// The BDA can verify achievement once the entrepreneur has requested it.
export const canVerify = (verificationRequested) => Boolean(verificationRequested);
