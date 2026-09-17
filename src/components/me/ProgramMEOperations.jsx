import { Fragment, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import * as api from "@/controllers/me_controller";
import StatCard from "@/components/tracker/StatCard";
import {
  FaBullseye,
  FaCheckCircle,
  FaClipboardCheck,
  FaExclamationTriangle,
  FaFileAlt,
  FaMoneyBillWave,
  FaPaperclip,
  FaUserCheck,
  FaUsers,
} from "react-icons/fa";

// The M&E operations sections of a programme: everything after Indicators on
// the M&E page. Each section lists its records for the whole programme or one
// startup, and — for the M&E Officer — captures new records and reviews them.

// ---- Shared bits ------------------------------------------------------------

const NAVY = "text-[#0b2b5c]";
const pct = (value) => (value == null ? "—" : `${value}%`);

const OPERATION_TILES = [
  { label: "Participants", icon: <FaUsers />, tone: NAVY, value: (d) => d?.participants },
  { label: "Active participants", icon: <FaUserCheck />, tone: "text-emerald-600", value: (d) => d?.activeParticipants },
  { label: "Completion", icon: <FaBullseye />, tone: NAVY, value: (d) => pct(d?.completionRate) },
  { label: "Reports submitted", icon: <FaFileAlt />, tone: NAVY, value: (d) => d?.reportsSubmitted },
  { label: "Reports verified", icon: <FaCheckCircle />, tone: "text-emerald-600", value: (d) => d?.reportsVerified },
  { label: "Reports overdue", icon: <FaExclamationTriangle />, tone: "text-rose-600", value: (d) => d?.reportsOverdue },
  { label: "Baseline completion", icon: <FaClipboardCheck />, tone: NAVY, value: (d) => pct(d?.baselineCompletion) },
  { label: "Endline completion", icon: <FaClipboardCheck />, tone: NAVY, value: (d) => pct(d?.endlineCompletion) },
  { label: "Activities completed", icon: <FaCheckCircle />, tone: "text-emerald-600", value: (d) => d?.activitiesCompleted },
  { label: "Jobs created", icon: <FaUsers />, tone: NAVY, value: (d) => d?.jobsCreated },
  { label: "Capital mobilised", icon: <FaMoneyBillWave />, tone: "text-amber-500", value: (d) => Number(d?.capitalMobilised || 0).toLocaleString() },
  { label: "Open risks", icon: <FaExclamationTriangle />, tone: "text-rose-600", value: (d) => d?.openRisks },
  { label: "Evidence pending", icon: <FaPaperclip />, tone: "text-amber-500", value: (d) => d?.evidencePending },
  { label: "Data quality flags", icon: <FaExclamationTriangle />, tone: "text-amber-500", value: (d) => d?.openDataQualityFlags },
];

const ACTIVITY_TYPES = ["workshop", "mentoring_session", "site_visit", "investor_event", "reporting_deadline", "grant_milestone", "partner_meeting", "other"];
const ACTIVITY_STATUSES = ["planned", "in_progress", "completed", "overdue", "cancelled"];
const MILESTONE_STATUSES = ["not_started", "in_progress", "completed", "overdue", "blocked"];
const FUNDING_TYPES = ["grant", "loan", "equity", "prize", "revenue_based_financing", "investor_introduction", "other"];
const FUNDING_STATUSES = ["identified", "applied", "approved", "funded", "declined"];
const VERIFICATION_STATUSES = ["pending", "verified", "rejected"];
const IMPACT_CATEGORIES = ["economic", "social", "environmental", "climate", "gender", "custom"];
const ASSESSMENT_TYPES = ["baseline", "midline", "endline", "custom"];
const RISK_STATUSES = ["open", "reviewed", "closed"];
const EVIDENCE_TYPES = ["receipt", "invoice", "photo", "contract", "certificate", "report", "bank_statement", "other"];
const EVIDENCE_LINKS = [
  { value: "periodic_report", label: "Progress report" },
  { value: "assessment", label: "Assessment" },
  { value: "goal", label: "Goal" },
  { value: "funding", label: "Funding linkage" },
  { value: "impact", label: "Impact record" },
  { value: "activity", label: "Activity" },
];

const U = (response) => response?.body ?? response;
const failed = (response) => response?.status === false;

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#082d77]";
const smallInputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800 outline-none focus:border-[#082d77]";
const primaryButton =
  "rounded-lg bg-[#082d77] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#082d77]/90 disabled:opacity-60";
const greenButton =
  "rounded-lg bg-[#16a34a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#15803d] disabled:opacity-60";
const lightButton =
  "rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50";
const linkButton = "text-xs font-bold text-[#082d77] hover:underline";

const pretty = (value) =>
  String(value ?? "")
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
const day = (value) => (value ? String(value).slice(0, 10) : "—");
const dash = (value) => (value === null || value === undefined || value === "" ? "—" : value);
const amount = (value, currency = "") =>
  value === null || value === undefined || value === ""
    ? "—"
    : `${currency ? `${currency} ` : ""}${Number(value).toLocaleString()}`;

const TONES = {
  good: "bg-emerald-50 text-emerald-700",
  info: "bg-blue-50 text-blue-700",
  warn: "bg-amber-50 text-amber-700",
  bad: "bg-rose-50 text-rose-700",
  none: "bg-slate-100 text-slate-600",
};
const TONE_OF = {
  verified: "good", approved: "good", completed: "good", funded: "good", resolved: "good", closed: "good", active: "good",
  submitted: "info", under_review: "info", in_progress: "info", applied: "info", reviewed: "info",
  attention: "warn", warning: "warn", overdue: "warn", open: "warn", blocked: "warn",
  rejected: "bad", declined: "bad", cancelled: "bad", critical: "bad", error: "bad",
};
const Pill = ({ value }) => (
  <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${TONES[TONE_OF[value] || "none"]}`}>
    {pretty(value) || "—"}
  </span>
);

const Field = ({ label, className = "", children }) => (
  <label className={`block ${className}`}>
    <span className="mb-1 block text-xs font-bold text-slate-600">{label}</span>
    {children}
  </label>
);

const Options = ({ values, placeholder }) => (
  <>
    {placeholder !== undefined && <option value="">{placeholder}</option>}
    {values.map((value) => (
      <option key={value} value={value}>
        {pretty(value)}
      </option>
    ))}
  </>
);

const Cell = ({ className = "", children }) => (
  <td className={`px-4 py-3 align-top text-sm text-slate-700 ${className}`}>{children}</td>
);

const Table = ({ heads, empty, children, hasRows }) => (
  <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
    <table className="w-full min-w-[760px] text-left">
      <thead className="bg-slate-50">
        <tr>
          {heads.map((head) => (
            <th key={head} className="px-4 py-3 text-sm font-semibold capitalize text-black">
              {head}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {hasRows ? (
          children
        ) : (
          <tr>
            <td colSpan={heads.length} className="p-10 text-center text-slate-500">
              {empty}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

const Row = ({ children }) => <tr className="border-t border-slate-100">{children}</tr>;

const DetailRow = ({ span, children }) => (
  <tr className="border-t border-slate-100 bg-slate-50/70">
    <td colSpan={span} className="px-4 py-4">
      {children}
    </td>
  </tr>
);

const SectionIntro = ({ title, description }) => (
  <div className="mb-4">
    <h3 className="text-lg font-black tracking-tight text-slate-900">{title}</h3>
    {description && <p className="text-sm text-slate-500">{description}</p>}
  </div>
);

const FormCard = ({ title, onSubmit, onCancel, saving, submitLabel = "Save", extraActions, children }) => (
  <form
    onSubmit={(e) => {
      e.preventDefault();
      onSubmit();
    }}
    className="mb-5 rounded-2xl bg-white p-5 shadow-sm"
  >
    <h4 className="font-black text-slate-900">{title}</h4>
    <div className="mt-4 grid gap-4 md:grid-cols-3">{children}</div>
    <div className="mt-5 flex flex-wrap gap-3">
      <button type="submit" disabled={saving} className={greenButton}>
        {saving ? "Saving..." : submitLabel}
      </button>
      {extraActions}
      {onCancel && (
        <button type="button" onClick={onCancel} className={lightButton}>
          Cancel
        </button>
      )}
    </div>
  </form>
);

const useDraft = (initial) => {
  const [draft, setDraft] = useState(initial);
  const bind = (key) => (e) =>
    setDraft((prev) => ({
      ...prev,
      [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
    }));
  return [draft, setDraft, bind];
};

// Only the fields that were filled in, so blanks do not overwrite or fail
// numeric validation on the server.
const filled = (values) =>
  Object.fromEntries(Object.entries(values).filter(([, value]) => value !== "" && value !== null && value !== undefined));

const StartupSelect = ({ businesses, value, onChange, allLabel = "All startups", required }) => (
  <select className={inputClass} value={value} onChange={(e) => onChange(e.target.value)} required={required}>
    <option value="">{allLabel}</option>
    {businesses.map((business) => (
      <option key={business.uuid} value={business.uuid}>
        {business.name}
      </option>
    ))}
  </select>
);

// A review decision: pick the outcome, comment where one is needed, save.
const ReviewControl = ({ options, commentRequiredFor = [], onSubmit }) => {
  const [status, setStatus] = useState("");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!status) return toast.error("Choose an action");
    if (commentRequiredFor.includes(status) && !comment.trim()) return toast.error("Add a comment explaining why");
    setBusy(true);
    await onSubmit(status, comment.trim());
    setBusy(false);
  };

  return (
    <div className="flex min-w-[190px] flex-col gap-2">
      <select className={smallInputClass} value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="">Select action</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {status && (
        <input
          className={smallInputClass}
          placeholder={commentRequiredFor.includes(status) ? "Comment (required)" : "Comment (optional)"}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      )}
      <button
        type="button"
        onClick={submit}
        disabled={busy}
        className="rounded-lg bg-[#082d77] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
      >
        {busy ? "Saving..." : "Save"}
      </button>
    </div>
  );
};

// ---- Sections -------------------------------------------------------------

function OperationsSection({ ctx }) {
  const { data, canManage, act, programUuid } = ctx;
  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex flex-wrap gap-3">
          <button onClick={() => act(api.refreshMeRisks(programUuid), "Risk flags refreshed")} className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white">
            Refresh risk flags
          </button>
          <button onClick={() => act(api.runMeDataQuality(programUuid), "Data-quality checks run")} className={lightButton}>
            Run data-quality checks
          </button>
          <button onClick={() => act(api.generateMeReminders(programUuid), "Reminders generated")} className={primaryButton}>
            Generate reminders
          </button>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {OPERATION_TILES.map((tile) => (
          <StatCard key={tile.label} label={tile.label} value={tile.value(data) ?? 0} icon={tile.icon} tone={tile.tone} />
        ))}
      </div>
    </div>
  );
}

const emptyReport = () => ({
  businessUuid: "", reportingPeriod: "", periodStart: "", periodEnd: "", dueDate: "",
  revenue: "", employees: "", jobsCreated: "", customersServed: "", fundingReceived: "",
  keyMilestone: "", biggestChallenge: "", supportRequired: "",
});

function ReportsSection({ ctx }) {
  const { data, canManage, businesses, nameOf, programUuid, act, filterBar } = ctx;
  const rows = data?.data || [];
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft, bind] = useDraft(emptyReport());

  const save = async (submitNow) => {
    if (!draft.businessUuid) return toast.error("Choose the startup");
    if (!draft.reportingPeriod.trim()) return toast.error("Enter the reporting period");
    setSaving(true);
    const saved = await api.saveMeReport(programUuid, filled(draft));
    if (!failed(saved) && submitNow) {
      const submitted = await api.submitMeReport(programUuid, U(saved).uuid);
      if (failed(submitted)) toast.error(submitted.message);
    }
    setSaving(false);
    if (failed(saved)) return toast.error(saved.message);
    toast.success(submitNow ? "Report recorded and submitted" : "Report saved as draft");
    setDraft(emptyReport());
    setOpen(false);
    ctx.reload();
  };

  const download = async () => {
    try {
      const response = await api.downloadMeExport(programUuid, "reports");
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = "me-progress-reports.csv";
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Export failed");
    }
  };

  return (
    <>
      <SectionIntro title="Progress Reports" description="Periodic reports from each startup. Submitting a report records its figures under Business Performance; verifying it confirms them." />
      {filterBar(
        canManage && (
          <>
            <button onClick={download} className={lightButton}>Export CSV</button>
            {!open && <button onClick={() => setOpen(true)} className={greenButton}>Record progress report</button>}
          </>
        ),
      )}

      {open && (
        <FormCard
          title="Record a progress report"
          saving={saving}
          submitLabel="Save and submit"
          onSubmit={() => save(true)}
          onCancel={() => setOpen(false)}
          extraActions={<button type="button" onClick={() => save(false)} disabled={saving} className={lightButton}>Save draft</button>}
        >
          <Field label="Startup"><StartupSelect businesses={businesses} value={draft.businessUuid} onChange={(v) => setDraft({ ...draft, businessUuid: v })} allLabel="Select a startup" required /></Field>
          <Field label="Reporting period"><input className={inputClass} placeholder="e.g. Q3 2026" value={draft.reportingPeriod} onChange={bind("reportingPeriod")} /></Field>
          <Field label="Due date"><input type="date" className={inputClass} value={draft.dueDate} onChange={bind("dueDate")} /></Field>
          <Field label="Period start"><input type="date" className={inputClass} value={draft.periodStart} onChange={bind("periodStart")} /></Field>
          <Field label="Period end"><input type="date" className={inputClass} value={draft.periodEnd} onChange={bind("periodEnd")} /></Field>
          <Field label="Revenue (TZS)"><input type="number" min="0" className={inputClass} value={draft.revenue} onChange={bind("revenue")} /></Field>
          <Field label="Employees"><input type="number" min="0" className={inputClass} value={draft.employees} onChange={bind("employees")} /></Field>
          <Field label="Jobs created"><input type="number" min="0" className={inputClass} value={draft.jobsCreated} onChange={bind("jobsCreated")} /></Field>
          <Field label="Customers served"><input type="number" min="0" className={inputClass} value={draft.customersServed} onChange={bind("customersServed")} /></Field>
          <Field label="Funding received (TZS)"><input type="number" min="0" className={inputClass} value={draft.fundingReceived} onChange={bind("fundingReceived")} /></Field>
          <Field label="Key milestone" className="md:col-span-2"><input className={inputClass} value={draft.keyMilestone} onChange={bind("keyMilestone")} /></Field>
          <Field label="Biggest challenge" className="md:col-span-3"><textarea className={`${inputClass} min-h-[70px]`} value={draft.biggestChallenge} onChange={bind("biggestChallenge")} /></Field>
          <Field label="Support required" className="md:col-span-3"><textarea className={`${inputClass} min-h-[70px]`} value={draft.supportRequired} onChange={bind("supportRequired")} /></Field>
        </FormCard>
      )}

      <Table heads={["Period", "Startup", "Revenue", "Employees", "Jobs", "Due", "Status", "Action"]} empty="No reports found." hasRows={rows.length > 0}>
        {rows.map((r) => (
          <Row key={r.uuid}>
            <Cell className="font-semibold text-slate-900">{r.reportingPeriod}</Cell>
            <Cell>{nameOf(r.businessId)}</Cell>
            <Cell>{amount(r.revenue)}</Cell>
            <Cell>{dash(r.employees)}</Cell>
            <Cell>{dash(r.jobsCreated)}</Cell>
            <Cell>{day(r.dueDate)}</Cell>
            <Cell><Pill value={r.status} />{r.reviewComments && <p className="mt-1 text-xs text-slate-500">{r.reviewComments}</p>}</Cell>
            <Cell>
              {canManage && ["draft", "rejected"].includes(r.status) && (
                <button className={linkButton} onClick={() => act(api.submitMeReport(programUuid, r.uuid), "Report submitted")}>Submit</button>
              )}
              {canManage && ["submitted", "under_review"].includes(r.status) && (
                <ReviewControl
                  options={[
                    ...(r.status === "submitted" ? [{ value: "under_review", label: "Mark under review" }] : []),
                    { value: "verified", label: "Verify" },
                    { value: "rejected", label: "Reject" },
                  ]}
                  commentRequiredFor={["rejected"]}
                  onSubmit={(status, comments) => act(api.reviewMeReport(programUuid, r.uuid, { status, comments }), `Report ${pretty(status).toLowerCase()}`)}
                />
              )}
            </Cell>
          </Row>
        ))}
      </Table>
    </>
  );
}

const emptyAssessment = () => ({
  businessUuid: "", templateUuid: "", assessmentType: "baseline", assessmentDate: "",
  revenue: "", employees: "", customers: "", notes: "", scores: {},
});

function AssessmentsSection({ ctx }) {
  const { data, canManage, businesses, businessUuid, nameOf, programUuid, act, filterBar } = ctx;
  const rows = Array.isArray(data) ? data : [];
  const [templates, setTemplates] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft, bind] = useDraft(emptyAssessment());

  useEffect(() => {
    api.getMeAssessmentTemplates(programUuid).then((r) => !failed(r) && setTemplates(U(r) || []));
  }, [programUuid]);

  useEffect(() => {
    setComparison(null);
    if (businessUuid) {
      api.compareMeAssessments(programUuid, { businessUuid }).then((r) => !failed(r) && setComparison(U(r)));
    }
  }, [programUuid, businessUuid, data]);

  const template = templates.find((t) => t.uuid === draft.templateUuid);
  const areas = [...new Set((template?.questions || []).map((q) => q.area).filter(Boolean))];
  const scale = Number(template?.scoringScale || 5);
  const templateName = (id) => templates.find((t) => t.id === id)?.name || "—";

  const save = async (status) => {
    if (!draft.businessUuid) return toast.error("Choose the startup");
    const missing = areas.find((area) => !draft.scores[area]);
    if (status === "submitted" && missing) return toast.error(`Score "${missing}" before submitting`);
    setSaving(true);
    const performanceMetrics = filled({ revenue: draft.revenue, employees: draft.employees, customers: draft.customers });
    const response = await api.saveMeAssessment(programUuid, {
      businessUuid: draft.businessUuid,
      templateUuid: draft.templateUuid || undefined,
      assessmentType: draft.assessmentType,
      assessmentDate: draft.assessmentDate || undefined,
      performanceMetrics: Object.fromEntries(Object.entries(performanceMetrics).map(([k, v]) => [k, Number(v)])),
      capabilityScores: Object.fromEntries(Object.entries(filled(draft.scores)).map(([k, v]) => [k, Number(v)])),
      notes: draft.notes || undefined,
      status,
    });
    setSaving(false);
    if (failed(response)) return toast.error(response.message);
    toast.success(status === "submitted" ? "Assessment submitted" : "Assessment saved as draft");
    setDraft(emptyAssessment());
    setOpen(false);
    ctx.reload();
  };

  const changes = [
    ...(comparison?.changes || []),
    ...(comparison?.capabilityChanges || []).map((x) => ({ ...x, metric: `Capability: ${x.metric}` })),
  ];

  return (
    <>
      <SectionIntro title="Assessments" description="Baseline, midline and endline assessments of each startup. Verifying a baseline or endline marks it complete on the programme roster." />
      {filterBar(canManage && !open && <button onClick={() => setOpen(true)} className={greenButton}>Record assessment</button>)}

      {open && (
        <FormCard
          title="Record an assessment"
          saving={saving}
          submitLabel="Submit assessment"
          onSubmit={() => save("submitted")}
          onCancel={() => setOpen(false)}
          extraActions={<button type="button" onClick={() => save("draft")} disabled={saving} className={lightButton}>Save draft</button>}
        >
          <Field label="Startup"><StartupSelect businesses={businesses} value={draft.businessUuid} onChange={(v) => setDraft({ ...draft, businessUuid: v })} allLabel="Select a startup" required /></Field>
          <Field label="Template">
            <select
              className={inputClass}
              value={draft.templateUuid}
              onChange={(e) => {
                const chosen = templates.find((t) => t.uuid === e.target.value);
                setDraft({ ...draft, templateUuid: e.target.value, scores: {}, assessmentType: chosen && chosen.assessmentType !== "custom" ? chosen.assessmentType : draft.assessmentType });
              }}
            >
              <option value="">No template</option>
              {templates.map((t) => <option key={t.uuid} value={t.uuid}>{t.name}</option>)}
            </select>
          </Field>
          <Field label="Type"><select className={inputClass} value={draft.assessmentType} onChange={bind("assessmentType")}><Options values={ASSESSMENT_TYPES} /></select></Field>
          <Field label="Assessment date"><input type="date" className={inputClass} value={draft.assessmentDate} onChange={bind("assessmentDate")} /></Field>
          <Field label="Revenue (TZS)"><input type="number" min="0" className={inputClass} value={draft.revenue} onChange={bind("revenue")} /></Field>
          <Field label="Employees"><input type="number" min="0" className={inputClass} value={draft.employees} onChange={bind("employees")} /></Field>
          <Field label="Customers"><input type="number" min="0" className={inputClass} value={draft.customers} onChange={bind("customers")} /></Field>
          {areas.map((area) => (
            <Field key={area} label={`${area} (1–${scale})`}>
              <select className={inputClass} value={draft.scores[area] || ""} onChange={(e) => setDraft({ ...draft, scores: { ...draft.scores, [area]: e.target.value } })}>
                <option value="">Score</option>
                {Array.from({ length: scale }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </Field>
          ))}
          <Field label="Notes" className="md:col-span-3"><textarea className={`${inputClass} min-h-[70px]`} value={draft.notes} onChange={bind("notes")} /></Field>
        </FormCard>
      )}

      {businessUuid && changes.length > 0 && (
        <div className="mb-5">
          <h4 className="mb-2 text-sm font-black text-slate-900">Baseline vs latest verified assessment</h4>
          <Table heads={["Metric", "Baseline", "Current", "Change", "% Change"]} empty="" hasRows>
            {changes.map((r) => (
              <Row key={r.metric}>
                <Cell className="font-semibold">{pretty(r.metric)}</Cell>
                <Cell>{dash(r.baseline)}</Cell>
                <Cell>{dash(r.current)}</Cell>
                <Cell>{Number.isFinite(r.absoluteChange) ? r.absoluteChange : "—"}</Cell>
                <Cell>{r.percentageChange == null ? "—" : `${r.percentageChange}%`}</Cell>
              </Row>
            ))}
          </Table>
        </div>
      )}

      <Table heads={["Type", "Date", "Startup", "Template", "Status", "Action"]} empty="No assessments found." hasRows={rows.length > 0}>
        {rows.map((r) => (
          <Row key={r.uuid}>
            <Cell className="font-semibold text-slate-900">{pretty(r.assessmentType)}</Cell>
            <Cell>{day(r.assessmentDate)}</Cell>
            <Cell>{nameOf(r.businessId)}</Cell>
            <Cell>{r.templateId ? templateName(r.templateId) : "—"}</Cell>
            <Cell><Pill value={r.status} /></Cell>
            <Cell>
              {canManage && ["submitted", "under_review"].includes(r.status) && (
                <ReviewControl
                  options={[{ value: "verified", label: "Verify" }, { value: "rejected", label: "Reject" }]}
                  commentRequiredFor={["rejected"]}
                  onSubmit={(status, comments) => act(api.reviewMeAssessment(programUuid, r.uuid, { status, comments }), `Assessment ${status}`)}
                />
              )}
            </Cell>
          </Row>
        ))}
      </Table>
    </>
  );
}

const emptyTemplate = () => ({
  name: "", assessmentType: "baseline", scoringScale: 5, description: "",
  questions: [{ area: "", question: "" }],
});

function AssessmentSetupSection({ ctx }) {
  const { data, canManage, programUuid } = ctx;
  const rows = Array.isArray(data) ? data : [];
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft, bind] = useDraft(emptyTemplate());

  const setQuestion = (index, patch) =>
    setDraft((prev) => ({ ...prev, questions: prev.questions.map((q, i) => (i === index ? { ...q, ...patch } : q)) }));

  const save = async () => {
    if (!draft.name.trim()) return toast.error("Give the template a name");
    const questions = draft.questions.filter((q) => q.question.trim());
    if (!questions.length) return toast.error("Add at least one question");
    if (questions.some((q) => !q.area.trim())) return toast.error("Every question needs a capability area");
    setSaving(true);
    const response = await api.saveMeAssessmentTemplate(programUuid, {
      ...draft,
      questions: questions.map((q) => ({ ...q, responseType: "scale" })),
    });
    setSaving(false);
    if (failed(response)) return toast.error(response.message);
    toast.success("Assessment template saved");
    setDraft(emptyTemplate());
    setOpen(false);
    ctx.reload();
  };

  return (
    <>
      <SectionIntro title="Assessment Setup" description="Templates that define the capability areas and questions each assessment scores startups on." />
      {canManage && !open && (
        <div className="mb-5 flex justify-end">
          <button onClick={() => setOpen(true)} className={greenButton}>Create assessment template</button>
        </div>
      )}

      {open && (
        <FormCard title="Create an assessment template" saving={saving} submitLabel="Save template" onSubmit={save} onCancel={() => setOpen(false)}>
          <Field label="Template name"><input className={inputClass} value={draft.name} onChange={bind("name")} /></Field>
          <Field label="Assessment type"><select className={inputClass} value={draft.assessmentType} onChange={bind("assessmentType")}><Options values={ASSESSMENT_TYPES} /></select></Field>
          <Field label="Scoring scale (2–10)"><input type="number" min="2" max="10" className={inputClass} value={draft.scoringScale} onChange={bind("scoringScale")} /></Field>
          <Field label="Description" className="md:col-span-3"><textarea className={`${inputClass} min-h-[60px]`} value={draft.description} onChange={bind("description")} /></Field>

          <div className="md:col-span-3">
            <span className="mb-2 block text-xs font-bold text-slate-600">Questions</span>
            <div className="space-y-2">
              {draft.questions.map((q, index) => (
                <div key={index} className="grid gap-2 md:grid-cols-[1fr_2fr_auto]">
                  <input className={inputClass} placeholder="Capability area, e.g. Financial management" value={q.area} onChange={(e) => setQuestion(index, { area: e.target.value })} />
                  <input className={inputClass} placeholder="Question" value={q.question} onChange={(e) => setQuestion(index, { question: e.target.value })} />
                  <button
                    type="button"
                    disabled={draft.questions.length === 1}
                    onClick={() => setDraft((prev) => ({ ...prev, questions: prev.questions.filter((_, i) => i !== index) }))}
                    className="rounded-lg border border-rose-200 px-3 text-sm font-semibold text-rose-600 disabled:opacity-40"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setDraft((prev) => ({ ...prev, questions: [...prev.questions, { area: "", question: "" }] }))}
              className="mt-2 text-sm font-bold text-[#082d77] hover:underline"
            >
              + Add question
            </button>
          </div>
        </FormCard>
      )}

      {rows.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center text-slate-500 shadow-sm">No assessment templates yet.</div>
      ) : (
        <div className="space-y-4">
          {rows.map((template) => (
            <div key={template.uuid} className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h4 className="font-black text-slate-900">{template.name}</h4>
                  <p className="text-sm text-slate-500">
                    {pretty(template.assessmentType)} · Scored 1–{template.scoringScale} · {template.questions?.length || 0} question{template.questions?.length === 1 ? "" : "s"}
                  </p>
                  {template.description && <p className="mt-1 text-sm text-slate-600">{template.description}</p>}
                </div>
                <Pill value={template.active ? "active" : "inactive"} />
              </div>
              {(template.questions || []).length > 0 && (
                <Table heads={["#", "Capability Area", "Question"]} empty="" hasRows>
                  {template.questions.map((q, i) => (
                    <Row key={q.uuid || i}>
                      <Cell>{i + 1}</Cell>
                      <Cell className="font-semibold">{q.area}</Cell>
                      <Cell>{q.question}</Cell>
                    </Row>
                  ))}
                </Table>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function PerformanceSection({ ctx }) {
  const { data, nameOf, filterBar } = ctx;
  const rows = Array.isArray(data) ? data : [];
  return (
    <>
      <SectionIntro title="Business Performance" description="Figures recorded from each startup's submitted progress reports. They are verified when the report is verified." />
      {filterBar()}
      <Table heads={["Startup", "Metric", "Reporting Date", "Value", "Unit", "Verification"]} empty="No performance figures yet. They appear once progress reports are submitted." hasRows={rows.length > 0}>
        {rows.map((r) => (
          <Row key={r.uuid}>
            <Cell>{nameOf(r.businessId)}</Cell>
            <Cell className="font-semibold text-slate-900">{pretty(r.metricCode)}</Cell>
            <Cell>{day(r.reportingDate)}</Cell>
            <Cell>{r.numericValue != null ? Number(r.numericValue).toLocaleString() : dash(r.textValue)}</Cell>
            <Cell>{pretty(r.unit) || "—"}</Cell>
            <Cell><Pill value={r.verificationStatus} /></Cell>
          </Row>
        ))}
      </Table>
    </>
  );
}

const emptyActivity = () => ({
  name: "", activityType: "workshop", activityDate: "", location: "", facilitator: "",
  plannedParticipants: "", durationMinutes: "", cost: "", learningObjective: "",
});

function ActivityDetail({ ctx, activity }) {
  const { businesses, programUuid, act } = ctx;
  const [update, , bindUpdate] = useDraft({
    status: activity.status || "planned",
    actualParticipants: activity.actualParticipants ?? "",
    maleParticipants: activity.maleParticipants ?? "",
    femaleParticipants: activity.femaleParticipants ?? "",
    youthParticipants: activity.youthParticipants ?? "",
    cost: activity.cost ?? "",
    report: activity.report || "",
  });
  const [attendance, setAttendance, bindAttendance] = useDraft({
    businessUuid: "", attended: true, completed: false, satisfactionScore: "", preTestScore: "", postTestScore: "", notes: "",
  });

  const saveAttendance = async () => {
    if (!attendance.businessUuid) return toast.error("Choose the startup");
    const ok = await act(api.saveMeAttendance(programUuid, activity.uuid, filled(attendance)), "Attendance recorded");
    if (ok) setAttendance({ ...attendance, businessUuid: "", satisfactionScore: "", preTestScore: "", postTestScore: "", notes: "" });
  };

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div>
        <h5 className="mb-3 text-sm font-black text-slate-900">Update activity</h5>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Status"><select className={inputClass} value={update.status} onChange={bindUpdate("status")}><Options values={ACTIVITY_STATUSES} /></select></Field>
          <Field label="Actual participants"><input type="number" min="0" className={inputClass} value={update.actualParticipants} onChange={bindUpdate("actualParticipants")} /></Field>
          <Field label="Male"><input type="number" min="0" className={inputClass} value={update.maleParticipants} onChange={bindUpdate("maleParticipants")} /></Field>
          <Field label="Female"><input type="number" min="0" className={inputClass} value={update.femaleParticipants} onChange={bindUpdate("femaleParticipants")} /></Field>
          <Field label="Youth"><input type="number" min="0" className={inputClass} value={update.youthParticipants} onChange={bindUpdate("youthParticipants")} /></Field>
          <Field label="Cost (TZS)"><input type="number" min="0" className={inputClass} value={update.cost} onChange={bindUpdate("cost")} /></Field>
          <Field label="Activity report" className="sm:col-span-2"><textarea className={`${inputClass} min-h-[70px]`} value={update.report} onChange={bindUpdate("report")} /></Field>
        </div>
        <button className={`${primaryButton} mt-3`} onClick={() => act(api.updateMeActivity(programUuid, activity.uuid, filled(update)), "Activity updated")}>
          Save activity
        </button>
      </div>

      <div>
        <h5 className="mb-3 text-sm font-black text-slate-900">Record attendance</h5>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Startup" className="sm:col-span-2"><StartupSelect businesses={businesses} value={attendance.businessUuid} onChange={(v) => setAttendance({ ...attendance, businessUuid: v })} allLabel="Select a startup" /></Field>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={attendance.attended} onChange={bindAttendance("attended")} /> Attended</label>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={attendance.completed} onChange={bindAttendance("completed")} /> Completed</label>
          <Field label="Satisfaction (1–5)"><input type="number" min="1" max="5" className={inputClass} value={attendance.satisfactionScore} onChange={bindAttendance("satisfactionScore")} /></Field>
          <Field label="Pre-test score"><input type="number" min="0" className={inputClass} value={attendance.preTestScore} onChange={bindAttendance("preTestScore")} /></Field>
          <Field label="Post-test score"><input type="number" min="0" className={inputClass} value={attendance.postTestScore} onChange={bindAttendance("postTestScore")} /></Field>
          <Field label="Notes"><input className={inputClass} value={attendance.notes} onChange={bindAttendance("notes")} /></Field>
        </div>
        <button className={`${greenButton} mt-3`} onClick={saveAttendance}>Save attendance</button>
        {(activity.attendance || []).length > 0 && (
          <p className="mt-3 text-xs text-slate-500">
            Recorded for: {activity.attendance.map((a) => ctx.nameOf(a.businessId)).join(", ")}
          </p>
        )}
      </div>
    </div>
  );
}

function ActivitiesSection({ ctx }) {
  const { data, canManage, programUuid } = ctx;
  const rows = Array.isArray(data) ? data : [];
  const [open, setOpen] = useState(false);
  const [openUuid, setOpenUuid] = useState("");
  const [saving, setSaving] = useState(false);
  const [draft, setDraft, bind] = useDraft(emptyActivity());

  const save = async () => {
    if (!draft.name.trim() || !draft.activityDate) return toast.error("Activity name and date are required");
    setSaving(true);
    const response = await api.saveMeActivity(programUuid, filled(draft));
    setSaving(false);
    if (failed(response)) return toast.error(response.message);
    toast.success("Activity saved");
    setDraft(emptyActivity());
    setOpen(false);
    ctx.reload();
  };

  const heads = ["Activity", "Type", "Date", "Participants", "Attendance", "Completion", "Satisfaction", "Knowledge Gain", "Status", ...(canManage ? ["Action"] : [])];

  return (
    <>
      <SectionIntro title="Activities" description="Programme activities, who attended, and how each went." />
      {canManage && !open && (
        <div className="mb-5 flex justify-end"><button onClick={() => setOpen(true)} className={greenButton}>Add programme activity</button></div>
      )}

      {open && (
        <FormCard title="Add a programme activity" saving={saving} submitLabel="Save activity" onSubmit={save} onCancel={() => setOpen(false)}>
          <Field label="Activity name"><input className={inputClass} value={draft.name} onChange={bind("name")} /></Field>
          <Field label="Type"><select className={inputClass} value={draft.activityType} onChange={bind("activityType")}><Options values={ACTIVITY_TYPES} /></select></Field>
          <Field label="Date"><input type="date" className={inputClass} value={draft.activityDate} onChange={bind("activityDate")} /></Field>
          <Field label="Location"><input className={inputClass} value={draft.location} onChange={bind("location")} /></Field>
          <Field label="Facilitator"><input className={inputClass} value={draft.facilitator} onChange={bind("facilitator")} /></Field>
          <Field label="Planned participants"><input type="number" min="0" className={inputClass} value={draft.plannedParticipants} onChange={bind("plannedParticipants")} /></Field>
          <Field label="Duration (minutes)"><input type="number" min="0" className={inputClass} value={draft.durationMinutes} onChange={bind("durationMinutes")} /></Field>
          <Field label="Budgeted cost (TZS)"><input type="number" min="0" className={inputClass} value={draft.cost} onChange={bind("cost")} /></Field>
          <Field label="Learning objective" className="md:col-span-3"><textarea className={`${inputClass} min-h-[60px]`} value={draft.learningObjective} onChange={bind("learningObjective")} /></Field>
        </FormCard>
      )}

      <Table heads={heads} empty="No activities recorded." hasRows={rows.length > 0}>
        {rows.map((r) => (
          <Fragment key={r.uuid}>
            <Row>
              <Cell className="font-semibold text-slate-900">{r.name}{r.location && <p className="text-xs font-normal text-slate-500">{r.location}</p>}</Cell>
              <Cell>{pretty(r.activityType)}</Cell>
              <Cell>{day(r.activityDate)}</Cell>
              <Cell>{dash(r.actualParticipants ?? r.attendance?.length)} / {dash(r.plannedParticipants)}</Cell>
              <Cell>{r.attendanceRate == null ? "—" : `${r.attendanceRate}%`}</Cell>
              <Cell>{r.completionRate == null ? "—" : `${r.completionRate}%`}</Cell>
              <Cell>{dash(r.averageSatisfaction)}</Cell>
              <Cell>{dash(r.knowledgeImprovement)}</Cell>
              <Cell><Pill value={r.status} /></Cell>
              {canManage && (
                <Cell>
                  <button className={linkButton} onClick={() => setOpenUuid(openUuid === r.uuid ? "" : r.uuid)}>
                    {openUuid === r.uuid ? "Close" : "Update"}
                  </button>
                </Cell>
              )}
            </Row>
            {openUuid === r.uuid && (
              <DetailRow span={heads.length}><ActivityDetail ctx={ctx} activity={r} /></DetailRow>
            )}
          </Fragment>
        ))}
      </Table>
    </>
  );
}

const emptyGoal = () => ({
  businessUuid: "", title: "", description: "", baseline: "", target: "", unit: "", targetDate: "", responsiblePerson: "",
});

function GoalMilestones({ ctx, goal }) {
  const { canManage, programUuid, act, uuidOf } = ctx;
  const businessUuid = uuidOf(goal.businessId);
  const [draft, setDraft, bind] = useDraft({ title: "", dueDate: "" });
  const milestones = goal.milestones || [];

  const add = async () => {
    if (!draft.title.trim()) return toast.error("Give the milestone a title");
    const ok = await act(api.saveMeGoalMilestone(programUuid, goal.uuid, { ...filled(draft), businessUuid }), "Milestone added");
    if (ok) setDraft({ title: "", dueDate: "" });
  };

  return (
    <div>
      <h5 className="mb-3 text-sm font-black text-slate-900">Milestones</h5>
      {milestones.length === 0 ? (
        <p className="mb-3 text-sm text-slate-500">No milestones yet. Progress is worked out from completed milestones.</p>
      ) : (
        <div className="mb-3 space-y-2">
          {milestones.map((m) => (
            <div key={m.uuid} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white px-4 py-2 shadow-sm">
              <div>
                <p className="text-sm font-semibold text-slate-900">{m.title}</p>
                <p className="text-xs text-slate-500">Due {day(m.dueDate)}</p>
              </div>
              {canManage ? (
                <select
                  className={`${smallInputClass} w-44`}
                  value={m.status}
                  onChange={(e) => act(api.updateMeGoalMilestone(programUuid, goal.uuid, m.uuid, { businessUuid, status: e.target.value }), "Milestone updated")}
                >
                  <Options values={MILESTONE_STATUSES} />
                </select>
              ) : (
                <Pill value={m.status} />
              )}
            </div>
          ))}
        </div>
      )}
      {canManage && (
        <div className="flex flex-wrap items-end gap-2">
          <Field label="Milestone" className="min-w-[220px] flex-1"><input className={inputClass} value={draft.title} onChange={bind("title")} /></Field>
          <Field label="Due date"><input type="date" className={inputClass} value={draft.dueDate} onChange={bind("dueDate")} /></Field>
          <button className={greenButton} onClick={add}>Add milestone</button>
        </div>
      )}
    </div>
  );
}

function GoalsSection({ ctx }) {
  const { data, canManage, businesses, nameOf, programUuid, filterBar } = ctx;
  const rows = Array.isArray(data) ? data : [];
  const [open, setOpen] = useState(false);
  const [openUuid, setOpenUuid] = useState("");
  const [saving, setSaving] = useState(false);
  const [draft, setDraft, bind] = useDraft(emptyGoal());

  const save = async () => {
    if (!draft.businessUuid) return toast.error("Choose the startup");
    if (!draft.title.trim()) return toast.error("Give the goal a title");
    setSaving(true);
    const response = await api.saveMeGoal(programUuid, filled(draft));
    setSaving(false);
    if (failed(response)) return toast.error(response.message);
    toast.success("Goal saved");
    setDraft(emptyGoal());
    setOpen(false);
    ctx.reload();
  };

  const heads = ["Goal", "Startup", "Target", "Due Date", "Progress", "Status", "Milestones"];

  return (
    <>
      <SectionIntro title="Goals" description="Each startup's goals and the milestones that track progress towards them." />
      {filterBar(canManage && !open && <button onClick={() => setOpen(true)} className={greenButton}>Add goal</button>)}

      {open && (
        <FormCard title="Add a goal" saving={saving} submitLabel="Save goal" onSubmit={save} onCancel={() => setOpen(false)}>
          <Field label="Startup"><StartupSelect businesses={businesses} value={draft.businessUuid} onChange={(v) => setDraft({ ...draft, businessUuid: v })} allLabel="Select a startup" required /></Field>
          <Field label="Goal title" className="md:col-span-2"><input className={inputClass} value={draft.title} onChange={bind("title")} /></Field>
          <Field label="Baseline"><input type="number" className={inputClass} value={draft.baseline} onChange={bind("baseline")} /></Field>
          <Field label="Target"><input type="number" className={inputClass} value={draft.target} onChange={bind("target")} /></Field>
          <Field label="Unit"><input className={inputClass} placeholder="e.g. customers" value={draft.unit} onChange={bind("unit")} /></Field>
          <Field label="Target date"><input type="date" className={inputClass} value={draft.targetDate} onChange={bind("targetDate")} /></Field>
          <Field label="Responsible person"><input className={inputClass} value={draft.responsiblePerson} onChange={bind("responsiblePerson")} /></Field>
          <Field label="Description" className="md:col-span-3"><textarea className={`${inputClass} min-h-[60px]`} value={draft.description} onChange={bind("description")} /></Field>
        </FormCard>
      )}

      <Table heads={heads} empty="No goals recorded." hasRows={rows.length > 0}>
        {rows.map((r) => {
          const progress = Math.round(Number(r.progressPercentage || 0));
          return (
            <Fragment key={r.uuid}>
              <Row>
                <Cell className="font-semibold text-slate-900">{r.title}</Cell>
                <Cell>{nameOf(r.businessId)}</Cell>
                <Cell>{r.target != null ? `${Number(r.target).toLocaleString()} ${r.unit || ""}` : "—"}</Cell>
                <Cell>{day(r.targetDate)}</Cell>
                <Cell>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-[#16a34a]" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="text-xs font-semibold">{progress}%</span>
                  </div>
                </Cell>
                <Cell><Pill value={r.status} /></Cell>
                <Cell>
                  <button className={linkButton} onClick={() => setOpenUuid(openUuid === r.uuid ? "" : r.uuid)}>
                    {openUuid === r.uuid ? "Close" : `${(r.milestones || []).length} milestone${(r.milestones || []).length === 1 ? "" : "s"}`}
                  </button>
                </Cell>
              </Row>
              {openUuid === r.uuid && (
                <DetailRow span={heads.length}><GoalMilestones ctx={ctx} goal={r} /></DetailRow>
              )}
            </Fragment>
          );
        })}
      </Table>
    </>
  );
}

// Funding, employment and impact share one shape: a form, a list, and a status
// the M&E Officer can change in place.
const RECORD_SECTIONS = {
  funding: {
    title: "Funding",
    description: "Funding opportunities each startup pursued and what was received.",
    addLabel: "Add funding linkage",
    save: api.saveMeFunding,
    statusKey: "status",
    statusOptions: FUNDING_STATUSES,
    required: [["opportunityType", "Choose the opportunity type"]],
    fields: [
      { key: "opportunityType", label: "Opportunity type", options: FUNDING_TYPES },
      { key: "counterparty", label: "Funder / counterparty" },
      { key: "fundingType", label: "Instrument", placeholder: "e.g. convertible note" },
      { key: "amountRequested", label: "Amount requested", type: "number" },
      { key: "amountApproved", label: "Amount approved", type: "number" },
      { key: "amountReceived", label: "Amount received", type: "number" },
      { key: "currency", label: "Currency", initial: "TZS" },
      { key: "applicationDate", label: "Application date", type: "date" },
      { key: "approvalDate", label: "Approval date", type: "date" },
      { key: "receivedDate", label: "Received date", type: "date" },
      { key: "status", label: "Status", options: FUNDING_STATUSES, initial: "identified" },
      { key: "facilitatedByAnza", label: "Facilitated by Anza", type: "checkbox", initial: false },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
    heads: ["Startup", "Opportunity", "Funder", "Requested", "Approved", "Received"],
    cells: (r, nameOf) => [
      nameOf(r.businessId),
      <span key="o" className="font-semibold text-slate-900">{pretty(r.opportunityType)}{r.facilitatedByAnza ? <span className="ml-1 text-xs text-emerald-700">(Anza)</span> : null}</span>,
      dash(r.counterparty),
      amount(r.amountRequested, r.currency),
      amount(r.amountApproved, r.currency),
      amount(r.amountReceived, r.currency),
    ],
  },
  employment: {
    title: "Employment",
    description: "Workforce and jobs reported by each startup per period. Only verified records count towards programme totals.",
    addLabel: "Add employment record",
    save: api.saveMeEmployment,
    statusKey: "verificationStatus",
    statusOptions: VERIFICATION_STATUSES,
    required: [["reportingPeriod", "Enter the reporting period"], ["reportingDate", "Enter the reporting date"]],
    fields: [
      { key: "reportingPeriod", label: "Reporting period", placeholder: "e.g. Q3 2026" },
      { key: "reportingDate", label: "Reporting date", type: "date" },
      { key: "permanentMale", label: "Permanent – male", type: "number" },
      { key: "permanentFemale", label: "Permanent – female", type: "number" },
      { key: "temporaryMale", label: "Temporary – male", type: "number" },
      { key: "temporaryFemale", label: "Temporary – female", type: "number" },
      { key: "youthEmployees", label: "Youth employees", type: "number" },
      { key: "employeesWithDisabilities", label: "Employees with disabilities", type: "number" },
      { key: "jobsCreated", label: "Jobs created", type: "number" },
      { key: "jobsLost", label: "Jobs lost", type: "number" },
      { key: "jobsSustained", label: "Jobs sustained", type: "number" },
    ],
    heads: ["Startup", "Period", "Permanent", "Temporary", "Youth", "Jobs Created", "Jobs Lost"],
    cells: (r, nameOf) => [
      nameOf(r.businessId),
      <span key="p" className="font-semibold text-slate-900">{r.reportingPeriod}</span>,
      Number(r.permanentMale || 0) + Number(r.permanentFemale || 0),
      Number(r.temporaryMale || 0) + Number(r.temporaryFemale || 0),
      dash(r.youthEmployees),
      dash(r.jobsCreated),
      dash(r.jobsLost),
    ],
  },
  impact: {
    title: "Impact",
    description: "Impact metrics each startup reports against its baseline.",
    addLabel: "Add impact record",
    save: api.saveMeImpact,
    statusKey: "verificationStatus",
    statusOptions: VERIFICATION_STATUSES,
    required: [["metricName", "Enter the metric name"], ["metricCode", "Enter the metric code"], ["unit", "Enter the unit"], ["reportingPeriod", "Enter the reporting period"]],
    fields: [
      { key: "metricName", label: "Metric name", placeholder: "e.g. Waste diverted" },
      { key: "metricCode", label: "Metric code", placeholder: "e.g. waste_diverted" },
      { key: "category", label: "Category", options: IMPACT_CATEGORIES, initial: "economic" },
      { key: "unit", label: "Unit", placeholder: "e.g. tonnes" },
      { key: "baselineValue", label: "Baseline value", type: "number" },
      { key: "currentValue", label: "Current value", type: "number" },
      { key: "reportingPeriod", label: "Reporting period", placeholder: "e.g. Q3 2026" },
      { key: "methodology", label: "Methodology", type: "textarea" },
    ],
    heads: ["Startup", "Metric", "Category", "Baseline", "Current", "Period"],
    cells: (r, nameOf) => [
      nameOf(r.businessId),
      <span key="m" className="font-semibold text-slate-900">{r.metricName}</span>,
      pretty(r.category),
      r.baselineValue != null ? `${Number(r.baselineValue).toLocaleString()} ${r.unit}` : "—",
      r.currentValue != null ? `${Number(r.currentValue).toLocaleString()} ${r.unit}` : "—",
      r.reportingPeriod,
    ],
  },
};

function RecordSection({ ctx, config }) {
  const { data, canManage, businesses, nameOf, uuidOf, programUuid, act, filterBar } = ctx;
  const rows = Array.isArray(data) ? data : [];
  const initial = () => ({
    businessUuid: "",
    ...Object.fromEntries(config.fields.map((f) => [f.key, f.initial ?? ""])),
  });
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft, bind] = useDraft(initial());

  const save = async () => {
    if (!draft.businessUuid) return toast.error("Choose the startup");
    const missing = config.required.find(([key]) => !String(draft[key] ?? "").trim());
    if (missing) return toast.error(missing[1]);
    setSaving(true);
    const response = await config.save(programUuid, { ...filled(draft), ...(draft.facilitatedByAnza !== undefined ? { facilitatedByAnza: !!draft.facilitatedByAnza } : {}) });
    setSaving(false);
    if (failed(response)) return toast.error(response.message);
    toast.success("Record saved");
    setDraft(initial());
    setOpen(false);
    ctx.reload();
  };

  const heads = [...config.heads, config.statusKey === "status" ? "Status" : "Verification"];

  return (
    <>
      <SectionIntro title={config.title} description={config.description} />
      {filterBar(canManage && !open && <button onClick={() => setOpen(true)} className={greenButton}>{config.addLabel}</button>)}

      {open && (
        <FormCard title={config.addLabel} saving={saving} submitLabel="Save record" onSubmit={save} onCancel={() => setOpen(false)}>
          <Field label="Startup"><StartupSelect businesses={businesses} value={draft.businessUuid} onChange={(v) => setDraft({ ...draft, businessUuid: v })} allLabel="Select a startup" required /></Field>
          {config.fields.map((f) =>
            f.type === "checkbox" ? (
              <label key={f.key} className="flex items-center gap-2 self-end pb-2 text-sm font-semibold text-slate-700">
                <input type="checkbox" checked={!!draft[f.key]} onChange={bind(f.key)} /> {f.label}
              </label>
            ) : (
              <Field key={f.key} label={f.label} className={f.type === "textarea" ? "md:col-span-3" : ""}>
                {f.options ? (
                  <select className={inputClass} value={draft[f.key]} onChange={bind(f.key)}>
                    <Options values={f.options} placeholder={f.initial ? undefined : "Select"} />
                  </select>
                ) : f.type === "textarea" ? (
                  <textarea className={`${inputClass} min-h-[60px]`} value={draft[f.key]} onChange={bind(f.key)} />
                ) : (
                  <input type={f.type || "text"} min={f.type === "number" ? "0" : undefined} className={inputClass} placeholder={f.placeholder} value={draft[f.key]} onChange={bind(f.key)} />
                )}
              </Field>
            ),
          )}
        </FormCard>
      )}

      <Table heads={heads} empty={`No ${config.title.toLowerCase()} records found.`} hasRows={rows.length > 0}>
        {rows.map((r) => (
          <Row key={r.uuid}>
            {config.cells(r, nameOf).map((value, i) => <Cell key={i}>{value}</Cell>)}
            <Cell>
              {canManage ? (
                <select
                  className={`${smallInputClass} w-36`}
                  value={r[config.statusKey] || ""}
                  onChange={(e) =>
                    act(config.save(programUuid, { businessUuid: uuidOf(r.businessId), [config.statusKey]: e.target.value }, r.uuid), "Status updated")
                  }
                >
                  <Options values={config.statusOptions} />
                </select>
              ) : (
                <Pill value={r[config.statusKey]} />
              )}
            </Cell>
          </Row>
        ))}
      </Table>
    </>
  );
}

function MentorshipSection({ ctx }) {
  const { data, nameOf, filterBar } = ctx;
  const sessions = data?.data || [];
  const cards = [
    ["Sessions", data?.totalSessions],
    ["Hours", data?.mentorshipHours],
    ["Entrepreneurs mentored", data?.entrepreneursMentored],
    ["Action completion", data?.actionCompletionRate == null ? "—" : `${data.actionCompletionRate}%`],
    ["Overdue actions", data?.overdueActions],
  ];
  return (
    <>
      <SectionIntro title="Mentorship" description="Coaching sessions held on this programme and the actions agreed in them. Sessions are logged from the programme's coaching tools." />
      {filterBar()}
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded-xl bg-white p-4 shadow-sm">
            <b className="text-2xl text-[#082d77]">{value ?? 0}</b>
            <p className="text-sm text-slate-500">{label}</p>
          </div>
        ))}
      </div>
      <Table heads={["Date", "Startup", "Topic", "Duration", "Action Agreed", "Deadline", "Status"]} empty="No mentorship sessions." hasRows={sessions.length > 0}>
        {sessions.map((r) => (
          <Row key={r.uuid}>
            <Cell>{day(r.sessionDate)}</Cell>
            <Cell>{nameOf(r.businessId)}</Cell>
            <Cell className="font-semibold text-slate-900">{dash(r.topic)}</Cell>
            <Cell>{r.durationMinutes ? `${r.durationMinutes} min` : "—"}</Cell>
            <Cell>{dash(r.actionsAgreed)}</Cell>
            <Cell>{day(r.actionDeadline)}</Cell>
            <Cell>{r.actionStatus ? <Pill value={r.actionStatus} /> : "—"}</Cell>
          </Row>
        ))}
      </Table>
    </>
  );
}

function RiskReview({ ctx, risk }) {
  const { programUuid, act } = ctx;
  const [draft, , bind] = useDraft({ status: risk.status === "open" ? "reviewed" : risk.status, intervention: risk.intervention || "" });
  return (
    <div className="grid gap-3 md:grid-cols-[200px_1fr_auto] md:items-end">
      <Field label="Status"><select className={inputClass} value={draft.status} onChange={bind("status")}><Options values={RISK_STATUSES} /></select></Field>
      <Field label="Intervention"><input className={inputClass} placeholder="What is being done about it" value={draft.intervention} onChange={bind("intervention")} /></Field>
      <button className={primaryButton} onClick={() => act(api.reviewMeRisk(programUuid, risk.uuid, draft), "Risk flag updated")}>Save</button>
    </div>
  );
}

function RisksSection({ ctx }) {
  const { data, canManage, nameOf, programUuid, act, filterBar } = ctx;
  const rows = Array.isArray(data) ? data : [];
  const [openUuid, setOpenUuid] = useState("");
  const heads = ["Startup", "Level", "Reasons", "Detected", "Status", "Intervention", ...(canManage ? ["Action"] : [])];
  return (
    <>
      <SectionIntro title="Risk Flags" description="Startups flagged for overdue reports, missing baselines, late milestones or declining revenue." />
      {filterBar(canManage && <button onClick={() => act(api.refreshMeRisks(programUuid), "Risk flags refreshed")} className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white">Refresh risk flags</button>)}
      <Table heads={heads} empty="No risk flags. Refresh to check the programme." hasRows={rows.length > 0}>
        {rows.map((r) => (
          <Fragment key={r.uuid}>
            <Row>
              <Cell className="font-semibold text-slate-900">{nameOf(r.businessId)}</Cell>
              <Cell><Pill value={r.riskLevel} /></Cell>
              <Cell>{Array.isArray(r.reasons) ? r.reasons.join(", ") : dash(r.reasons)}</Cell>
              <Cell>{day(r.detectedAt)}</Cell>
              <Cell><Pill value={r.status} /></Cell>
              <Cell>{dash(r.intervention)}</Cell>
              {canManage && (
                <Cell><button className={linkButton} onClick={() => setOpenUuid(openUuid === r.uuid ? "" : r.uuid)}>{openUuid === r.uuid ? "Close" : "Review"}</button></Cell>
              )}
            </Row>
            {openUuid === r.uuid && <DetailRow span={heads.length}><RiskReview ctx={ctx} risk={r} /></DetailRow>}
          </Fragment>
        ))}
      </Table>
    </>
  );
}

function QualitySection({ ctx }) {
  const { data, canManage, businessUuid, nameOf, idOf, programUuid, act, filterBar } = ctx;
  const [status, setStatus] = useState("open");
  const [notes, setNotes] = useState({});
  const businessId = businessUuid ? idOf(businessUuid) : null;
  const rows = (Array.isArray(data) ? data : [])
    .filter((r) => status === "all" || r.status === status)
    .filter((r) => !businessId || r.businessId === businessId);

  return (
    <>
      <SectionIntro title="Data Quality" description="Problems found in captured records — missing figures, duplicates, and numbers that do not add up. Resolve each once it has been corrected or explained." />
      {filterBar(
        <>
          <select className={`${inputClass} w-36`} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
            <option value="all">All</option>
          </select>
          {canManage && <button onClick={() => act(api.runMeDataQuality(programUuid), "Data-quality checks run")} className={primaryButton}>Run data-quality checks</button>}
        </>,
      )}
      <Table heads={["Rule", "Severity", "Issue", "Startup", "Detected", "Status", ...(canManage ? ["Action"] : [])]} empty={status === "open" ? "No open data-quality flags." : "No data-quality flags."} hasRows={rows.length > 0}>
        {rows.map((r) => (
          <Row key={r.uuid}>
            <Cell className="font-semibold text-slate-900">{pretty(r.ruleCode)}</Cell>
            <Cell><Pill value={r.severity} /></Cell>
            <Cell>{r.message}{r.resolutionNotes && <p className="mt-1 text-xs text-slate-500">Resolution: {r.resolutionNotes}</p>}</Cell>
            <Cell>{r.businessId ? nameOf(r.businessId) : "Programme"}</Cell>
            <Cell>{day(r.detectedAt)}</Cell>
            <Cell><Pill value={r.status} /></Cell>
            {canManage && (
              <Cell>
                {r.status === "open" && (
                  <div className="flex min-w-[190px] flex-col gap-2">
                    <input className={smallInputClass} placeholder="Resolution notes" value={notes[r.uuid] || ""} onChange={(e) => setNotes({ ...notes, [r.uuid]: e.target.value })} />
                    <button className="rounded-lg bg-[#082d77] px-3 py-1.5 text-xs font-semibold text-white" onClick={() => act(api.resolveMeDataQuality(programUuid, r.uuid, { notes: notes[r.uuid] || undefined }), "Flag resolved")}>
                      Resolve
                    </button>
                  </div>
                )}
              </Cell>
            )}
          </Row>
        ))}
      </Table>
    </>
  );
}

// The records evidence can be attached to, loaded for the chosen startup.
const LINK_LOADERS = {
  periodic_report: { load: (p, b) => api.getMeReports(p, { businessUuid: b, limit: 100 }), rows: (body) => body?.data || [], label: (r) => r.reportingPeriod },
  assessment: { load: (p, b) => api.getMeAssessments(p, { businessUuid: b }), rows: (body) => body || [], label: (r) => `${pretty(r.assessmentType)} · ${day(r.assessmentDate)}` },
  goal: { load: (p, b) => api.getMeGoals(p, { businessUuid: b }), rows: (body) => body || [], label: (r) => r.title },
  funding: { load: (p, b) => api.getMeFunding(p, { businessUuid: b }), rows: (body) => body || [], label: (r) => `${pretty(r.opportunityType)}${r.counterparty ? ` · ${r.counterparty}` : ""}` },
  impact: { load: (p, b) => api.getMeImpact(p, { businessUuid: b }), rows: (body) => body || [], label: (r) => `${r.metricName} · ${r.reportingPeriod}` },
  activity: { load: (p) => api.getMeActivities(p), rows: (body) => body || [], label: (r) => `${r.name} · ${day(r.activityDate)}` },
};

function EvidenceSection({ ctx }) {
  const { data, canManage, businesses, nameOf, programUuid, act, filterBar } = ctx;
  const rows = Array.isArray(data) ? data : [];
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [records, setRecords] = useState([]);
  const [file, setFile] = useState(null);
  const [draft, setDraft, bind] = useDraft({ businessUuid: "", entityType: "periodic_report", entityUuid: "", evidenceType: "receipt", description: "" });

  useEffect(() => {
    setRecords([]);
    setDraft((prev) => ({ ...prev, entityUuid: "" }));
    const loader = LINK_LOADERS[draft.entityType];
    if (!open || !loader || !draft.businessUuid) return;
    loader.load(programUuid, draft.businessUuid).then((r) => !failed(r) && setRecords(loader.rows(U(r))));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, programUuid, draft.businessUuid, draft.entityType]);

  const upload = async () => {
    if (!draft.businessUuid) return toast.error("Choose the startup");
    if (!draft.entityUuid) return toast.error("Choose the record this evidence supports");
    if (!file) return toast.error("Choose a file (PDF, JPG, PNG, CSV or XLSX, up to 10 MB)");
    const formData = new FormData();
    Object.entries(filled(draft)).forEach(([key, value]) => formData.append(key, value));
    formData.append("file", file);
    setSaving(true);
    const response = await api.uploadMeEvidence(programUuid, formData);
    setSaving(false);
    if (failed(response)) return toast.error(response.message);
    toast.success("Evidence uploaded");
    setFile(null);
    setDraft({ businessUuid: "", entityType: "periodic_report", entityUuid: "", evidenceType: "receipt", description: "" });
    setOpen(false);
    ctx.reload();
  };

  const openFile = async (r) => {
    if (!r.storageKey) return window.open(r.fileUrl, "_blank", "noopener");
    try {
      const response = await api.downloadMeEvidence(programUuid, r.uuid);
      const url = URL.createObjectURL(response.data);
      window.open(url, "_blank", "noopener");
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch {
      toast.error("Unable to open evidence");
    }
  };

  const linkLabel = (type) => EVIDENCE_LINKS.find((x) => x.value === type)?.label || pretty(type);

  return (
    <>
      <SectionIntro title="Evidence" description="Files that support reported figures — receipts, contracts, photos. Verify each before relying on the record it supports." />
      {filterBar(canManage && !open && <button onClick={() => setOpen(true)} className={greenButton}>Upload evidence</button>)}

      {open && (
        <FormCard title="Upload evidence" saving={saving} submitLabel="Upload" onSubmit={upload} onCancel={() => setOpen(false)}>
          <Field label="Startup"><StartupSelect businesses={businesses} value={draft.businessUuid} onChange={(v) => setDraft({ ...draft, businessUuid: v })} allLabel="Select a startup" required /></Field>
          <Field label="Supports a">
            <select className={inputClass} value={draft.entityType} onChange={bind("entityType")}>
              {EVIDENCE_LINKS.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}
            </select>
          </Field>
          <Field label="Record">
            <select className={inputClass} value={draft.entityUuid} onChange={bind("entityUuid")} disabled={!draft.businessUuid}>
              <option value="">{!draft.businessUuid ? "Choose a startup first" : records.length ? "Select a record" : "No records of this type"}</option>
              {records.map((r) => <option key={r.uuid} value={r.uuid}>{LINK_LOADERS[draft.entityType].label(r)}</option>)}
            </select>
          </Field>
          <Field label="Evidence type"><select className={inputClass} value={draft.evidenceType} onChange={bind("evidenceType")}><Options values={EVIDENCE_TYPES} /></select></Field>
          <Field label="File" className="md:col-span-2">
            <input type="file" accept=".pdf,.jpg,.jpeg,.png,.csv,.xlsx" className={inputClass} onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </Field>
          <Field label="Description" className="md:col-span-3"><input className={inputClass} value={draft.description} onChange={bind("description")} /></Field>
        </FormCard>
      )}

      <Table heads={["Startup", "Evidence Type", "Supports", "Description", "Uploaded", "Verification", "File", ...(canManage ? ["Action"] : [])]} empty="No evidence found." hasRows={rows.length > 0}>
        {rows.map((r) => (
          <Row key={r.uuid}>
            <Cell className="font-semibold text-slate-900">{nameOf(r.businessId)}</Cell>
            <Cell>{pretty(r.evidenceType)}</Cell>
            <Cell>{linkLabel(r.entityType)}</Cell>
            <Cell>{dash(r.description)}</Cell>
            <Cell>{day(r.createdAt)}</Cell>
            <Cell><Pill value={r.verificationStatus} />{r.rejectionReason && <p className="mt-1 text-xs text-rose-600">{r.rejectionReason}</p>}</Cell>
            <Cell><button onClick={() => openFile(r)} className={linkButton}>Open</button></Cell>
            {canManage && (
              <Cell>
                {r.verificationStatus === "pending" && (
                  <ReviewControl
                    options={[{ value: "verified", label: "Verify" }, { value: "rejected", label: "Reject" }]}
                    commentRequiredFor={["rejected"]}
                    onSubmit={(status, comments) => act(api.reviewMeEvidence(programUuid, r.uuid, { status, comments }), `Evidence ${status}`)}
                  />
                )}
              </Cell>
            )}
          </Row>
        ))}
      </Table>
    </>
  );
}

// ---- The component ----------------------------------------------------------

const LOADERS = {
  operations: (p) => api.getMeOperationsDashboard(p),
  reports: (p, q) => api.getMeReports(p, { ...q, limit: 100 }),
  assessments: (p, q) => api.getMeAssessments(p, q),
  assessmentSetup: (p) => api.getMeAssessmentTemplates(p),
  performance: (p, q) => api.getMeMetrics(p, q),
  activities: (p) => api.getMeActivities(p),
  goals: (p, q) => api.getMeGoals(p, q),
  funding: (p, q) => api.getMeFunding(p, q),
  employment: (p, q) => api.getMeEmployment(p, q),
  impact: (p, q) => api.getMeImpact(p, q),
  mentorship: (p, q) => api.getMeMentorship(p, q),
  risks: (p, q) => api.getMeRisks(p, q),
  quality: (p) => api.getMeDataQuality(p),
  evidence: (p, q) => api.getMeEvidence(p, q),
};

const SECTIONS = {
  operations: OperationsSection,
  reports: ReportsSection,
  assessments: AssessmentsSection,
  assessmentSetup: AssessmentSetupSection,
  performance: PerformanceSection,
  activities: ActivitiesSection,
  goals: GoalsSection,
  mentorship: MentorshipSection,
  risks: RisksSection,
  quality: QualitySection,
  evidence: EvidenceSection,
};

export default function ProgramMEOperations({ programUuid, section, canManage }) {
  const [businesses, setBusinesses] = useState([]);
  const [businessUuid, setBusinessUuid] = useState(
    () => new URLSearchParams(window.location.search).get("businessUuid") || "",
  );
  // Tagged with the section it belongs to, so a section never renders the
  // previous section's data while its own is loading.
  const [loaded, setLoaded] = useState({ section: "", data: null });
  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => setReloadKey((key) => key + 1);

  useEffect(() => {
    api.getMeBusinesses(programUuid).then((r) => !failed(r) && setBusinesses(U(r) || []));
  }, [programUuid]);

  useEffect(() => {
    let cancelled = false;
    const loader = LOADERS[section];
    if (!loader) return undefined;
    loader(programUuid, businessUuid ? { businessUuid } : {}).then((response) => {
      if (cancelled) return;
      if (failed(response)) toast.error(response.message || "Failed to load M&E records");
      setLoaded({ section, data: failed(response) ? null : U(response) });
    });
    return () => {
      cancelled = true;
    };
  }, [programUuid, section, businessUuid, reloadKey]);

  const byId = useMemo(() => new Map(businesses.map((b) => [b.id, b])), [businesses]);

  if (loaded.section !== section) {
    return <div className="rounded-2xl bg-white p-12 text-center text-slate-500 shadow-sm">Loading M&amp;E records...</div>;
  }

  const ctx = {
    programUuid,
    canManage,
    businesses,
    businessUuid,
    data: loaded.data,
    reload,
    nameOf: (id) => byId.get(id)?.name || (id ? `Startup #${id}` : "—"),
    uuidOf: (id) => byId.get(id)?.uuid || "",
    idOf: (uuid) => businesses.find((b) => b.uuid === uuid)?.id || null,
    // Runs a save or review, reports the outcome and refreshes the section.
    act: async (request, success) => {
      const response = await request;
      if (failed(response)) {
        toast.error(response.message || "Something went wrong");
        return false;
      }
      toast.success(success);
      reload();
      return true;
    },
    filterBar: (actions = null) => (
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <Field label="Filter by startup" className="w-full max-w-xs">
          <StartupSelect businesses={businesses} value={businessUuid} onChange={setBusinessUuid} />
        </Field>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    ),
  };

  if (RECORD_SECTIONS[section]) return <RecordSection key={section} ctx={ctx} config={RECORD_SECTIONS[section]} />;
  const Section = SECTIONS[section];
  return Section ? <Section ctx={ctx} /> : null;
}
