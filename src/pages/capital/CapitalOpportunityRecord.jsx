"use client";

import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  getCapitalOptions,
  getOpportunity,
  interveneOnOpportunity,
  moveOpportunityStage,
  recordOpportunityOutcome,
  recordProviderResponse,
  reopenOpportunity,
  setCommunicationMode,
  updateOpportunity,
} from "@/controllers/capital_controller";
import {
  CapitalHero,
  Card,
  DataTable,
  Detail,
  Empty,
  Field,
  inputClass,
  LoadingBlock,
  MatchScore,
  Modal,
  Select,
  StatusChip,
  Tabs,
  buttonClass,
} from "@/components/capital/CapitalUI";
import { AuditTrail, NotesPanel } from "@/components/capital/CapitalRecord";
import { DocumentsPanel, DueDiligencePanel, ThreadsPanel } from "@/components/capital/CapitalPanels";
import useCapitalAccess from "@/components/capital/useCapitalAccess";
import {
  CONTRIBUTION_LABELS,
  INTERVENTION_LABELS,
  MODE_LABELS,
  OUTCOME_LABELS,
  STAGE_LABELS,
  contributionLabel,
  dateTime,
  financingLabel,
  human,
  interventionLabel,
  introductionTypeLabel,
  modeLabel,
  money,
  outcomeLabel,
  providerTypeLabel,
  readinessLabel,
  requestStatusLabel,
  shortDate,
  stageLabel,
} from "@/utils/capital_labels";

const STAGES = Object.keys(STAGE_LABELS);
const at = (stage) => STAGES.indexOf(stage);
const SUCCESS = ["capital_secured", "partially_secured"];
const RESPONSES = [
  { value: "interested", label: "Interested - move to Capital Provider Interest" },
  { value: "requested_information", label: "Asked for more information" },
  { value: "no_response", label: "No response yet" },
  { value: "declined", label: "Declined - close the opportunity" },
];
// Errors the manager can clear by entering the figures in the same step.
const fixable = (error) => /^Record the (amount|date)/.test(error);
const localDateTime = (value) => (value ? new Date(new Date(value).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "");

const CapitalOpportunityRecord = () => {
  const { uuid } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { can } = useCapitalAccess();
  const [record, setRecord] = useState(null);
  const [missing, setMissing] = useState(null);
  const [options, setOptions] = useState(null);
  const [tab, setTab] = useState(params.get("tab") || "overview");
  const [dialog, setDialog] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const response = await getOpportunity(uuid);
    if (response?.status === false) setMissing(response.message || "Capital opportunity not found");
    else setRecord(response.body);
  }, [uuid]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    getCapitalOptions().then((response) => response?.status && setOptions(response.body));
  }, []);

  if (missing) return <div className="p-6"><Empty action={<Link to="/dashboard/capital/opportunities" className={buttonClass.secondary}>All opportunities</Link>}>{missing}</Empty></div>;
  if (!record) return <LoadingBlock label="Loading the capital opportunity…" />;

  const active = record.status === "active";
  const set = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));
  const setInput = (key) => (event) => set(key)(event.target.value);

  const open = (name, initial = {}) => {
    setForm(initial);
    setDialog(name);
  };

  const run = async (request, success) => {
    setSaving(true);
    const response = await request();
    setSaving(false);
    if (response?.status === false) {
      toast.error(response.errors?.length ? response.errors.join(". ") : response.message || "Something went wrong");
      return null;
    }
    toast.success(success);
    setDialog(null);
    load();
    return response.body;
  };

  // ---- Submissions ----------------------------------------------------------
  const stageTarget = form.stage;
  const targetErrors = (record.stageRules.find((rule) => rule.stage === stageTarget)?.errors || []).filter((error) => {
    if (!fixable(error)) return true;
    if (/amount committed/.test(error)) return !(Number(form.amountCommitted) > 0);
    if (/date of commitment/.test(error)) return !form.dateCommitted;
    if (/amount disbursed/.test(error)) return !(Number(form.amountDisbursed) > 0);
    return true;
  });

  const submitters = {
    stage: () => {
      if (!stageTarget) return toast.error("Choose a stage");
      return run(() => moveOpportunityStage(record.uuid, { stage: stageTarget, amountCommitted: form.amountCommitted, dateCommitted: form.dateCommitted, amountDisbursed: form.amountDisbursed, dateDisbursed: form.dateDisbursed, reason: form.reason || undefined }), `Moved to ${stageLabel(stageTarget)}`);
    },
    mode: () => {
      if (!form.reason?.trim()) return toast.error("Give a reason for the change");
      return run(() => setCommunicationMode(record.uuid, { mode: form.mode, reason: form.reason }), `Communication is now ${modeLabel(form.mode).toLowerCase()}`);
    },
    intervene: async () => {
      if (!form.action) return toast.error("Choose an intervention");
      if (!form.reason?.trim()) return toast.error("Every intervention needs a reason");
      const body = await run(
        () => interveneOnOpportunity(record.uuid, { action: form.action, reason: form.reason, comments: form.comments || undefined, providerUuid: form.providerUuid || undefined, meetingAt: form.meetingAt ? new Date(form.meetingAt).toISOString() : undefined, outcome: form.outcome || undefined }),
        `${interventionLabel(form.action)}: recorded`,
      );
      if (body?.replacement) navigate(`/dashboard/capital/opportunities/${body.replacement.uuid}`);
    },
    response: () => run(() => recordProviderResponse(record.uuid, { response: form.response, note: form.note || undefined }), "Provider response recorded"),
    outcome: () => {
      if (!form.outcome) return toast.error("Choose the outcome");
      return run(() => recordOpportunityOutcome(record.uuid, { ...form, anzaContribution: form.anzaContribution || [] }), `Outcome recorded: ${outcomeLabel(form.outcome)}`);
    },
    reopen: () => {
      if (!form.reason?.trim()) return toast.error("Give a reason for reopening");
      return run(() => reopenOpportunity(record.uuid, { reason: form.reason }), "Opportunity reopened");
    },
    edit: () => {
      const data = { nextAction: form.nextAction, nextActionDate: form.nextActionDate || null, probability: form.probability === "" ? undefined : Number(form.probability), potentialAmount: form.potentialAmount === "" ? null : form.potentialAmount, meetingAt: form.meetingAt ? new Date(form.meetingAt).toISOString() : null };
      if (form.managerUuid && form.managerUuid !== record.assignedManager?.uuid) data.managerUuid = form.managerUuid;
      return run(() => updateOpportunity(record.uuid, data), "Opportunity updated");
    },
  };

  const toggleContribution = (key) =>
    setForm((prev) => {
      const list = prev.anzaContribution || [];
      return { ...prev, anzaContribution: list.includes(key) ? list.filter((item) => item !== key) : [...list, key] };
    });

  // ---- Actions offered ---------------------------------------------------------
  const actions = [
    active && can("capital.opportunities.manage") && { key: "stage", label: "Move stage", tone: "primary", initial: { stage: "", amountCommitted: record.amountCommitted || "", dateCommitted: record.dateCommitted || "", amountDisbursed: record.amountDisbursed || "", dateDisbursed: record.dateDisbursed || "" } },
    active && can("capital.opportunities.manage") && at(record.stage) <= at("provider_interest") && { key: "response", label: "Record provider response", tone: "secondary", initial: { response: "interested" } },
    active && can("capital.communications.moderate") && { key: "mode", label: "Communication mode", tone: "secondary", initial: { mode: record.communicationMode } },
    active && can("capital.interventions.manage") && { key: "intervene", label: "Intervene", tone: "secondary", initial: {} },
    can("capital.outcomes.manage") && { key: "outcome", label: record.outcome ? "Update outcome" : "Record outcome", tone: "success", initial: { outcome: record.outcome || "", amountCommitted: record.amountCommitted || "", dateCommitted: record.dateCommitted || "", amountApproved: record.amountApproved || "", amountDisbursed: record.amountDisbursed || "", dateDisbursed: record.dateDisbursed || "", financingTerms: record.financingTerms || "", capitalSource: record.capitalSource || "", financingType: record.financingType, anzaContribution: record.anzaContribution || [], anzaContributionNotes: record.anzaContributionNotes || "" } },
    !active && can("capital.opportunities.manage") && { key: "reopen", label: "Reopen", tone: "secondary", initial: {} },
  ].filter(Boolean);

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "match", label: "Match" },
    { key: "introductions", label: "Introductions", count: record.introductions.length },
    { key: "communications", label: "Communications", count: record.threads.reduce((sum, thread) => sum + thread.pendingApproval, 0) || undefined },
    { key: "documents", label: "Deal room" },
    { key: "duediligence", label: "Due diligence", count: record.dueDiligence.total || undefined },
    { key: "interventions", label: "Interventions", count: record.interventions.length },
    ...(can("capital.notes.manage") ? [{ key: "notes", label: "Internal notes", count: record.notes.length }] : []),
    { key: "outcome", label: "Outcome" },
    ...(can("capital.audit.view") ? [{ key: "audit", label: "Audit trail" }] : []),
  ];

  const titles = { stage: "Move to another stage", response: "Record the capital provider's response", mode: "How the parties communicate", intervene: "Intervene on this opportunity", outcome: "Outcome and Anza's contribution", reopen: "Reopen the opportunity", edit: "Edit opportunity details" };
  const success = SUCCESS.includes(form.outcome);

  return (
    <div className="min-h-screen px-4 py-4 md:px-6">
      <CapitalHero
        badge={`Capital Opportunity · ${record.reference}`}
        title={`${record.enterprise?.name || "Enterprise"} × ${record.provider?.name || "Capital provider"}`}
        description={`${money(record.potentialAmount, record.currency)} potential ${financingLabel(record.financingType).toLowerCase()} · opened ${shortDate(record.createdAt)}${record.assignedManager ? ` · managed by ${record.assignedManager.name}` : ""}`}
      >
        {record.capitalRequest ? <Link to={`/dashboard/capital/requests/${record.capitalRequest.uuid}`} className={buttonClass.secondary}>{record.capitalRequest.reference}</Link> : null}
        <Link to="/dashboard/capital/pipeline" className={buttonClass.secondary}>Pipeline</Link>
      </CapitalHero>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <StatusChip value="active" label={stageLabel(record.stage)} />
        <StatusChip value={record.status} label={human(record.status)} />
        {record.outcome ? <StatusChip value={SUCCESS.includes(record.outcome) ? "won" : "lost"} label={outcomeLabel(record.outcome)} /> : null}
        <MatchScore score={record.matchScore} />
        <span className="text-sm text-slate-600">Probability <strong className="text-slate-900">{record.probability ?? 0}%</strong></span>
        <span className="text-sm text-slate-600">{modeLabel(record.communicationMode)} communication{record.communicationPaused ? " (paused)" : ""}</span>
        <div className="ml-auto flex flex-wrap gap-2">
          {actions.map((action) => (
            <button key={action.key} type="button" className={buttonClass[action.tone]} onClick={() => open(action.key, action.initial)}>{action.label}</button>
          ))}
        </div>
      </div>

      {!record.introductionApproved ? (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          No introduction has been approved. The enterprise and the capital provider cannot see each other, share documents or talk until you approve one.
        </div>
      ) : null}
      {record.escalated ? <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">Escalated</div> : null}
      {(record.flags || []).length ? (
        <div className="mb-4 space-y-1 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {record.flags.map((flag, index) => <p key={index}><strong>{human(flag.type)}</strong>: {flag.reason} <span className="text-xs text-rose-600">({shortDate(flag.at)})</span></p>)}
        </div>
      ) : null}

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {tab === "overview" ? (
        <div className="grid gap-4 xl:grid-cols-3">
          <Card title="Opportunity" className="xl:col-span-2" action={can("capital.opportunities.manage") ? <button type="button" className={buttonClass.link} onClick={() => open("edit", { nextAction: record.nextAction || "", nextActionDate: record.nextActionDate || "", probability: record.probability ?? "", potentialAmount: record.potentialAmount ?? "", managerUuid: record.assignedManager?.uuid || "", meetingAt: localDateTime(record.meetingAt) })}>Edit</button> : null}>
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Detail label="Stage">{stageLabel(record.stage)}</Detail>
              <Detail label="Potential financing">{money(record.potentialAmount, record.currency)}</Detail>
              <Detail label="Amount requested">{record.capitalRequest ? money(record.capitalRequest.amountRequested, record.capitalRequest.currency) : null}</Detail>
              <Detail label="Next action">{record.nextAction}</Detail>
              <Detail label="Due">{record.nextActionDate ? shortDate(record.nextActionDate) : null}</Detail>
              <Detail label="Meeting">{record.meetingAt ? dateTime(record.meetingAt) : null}</Detail>
              <Detail label="Last activity">{dateTime(record.lastActivityAt)}</Detail>
              <Detail label="Introduction approved">{record.introductionApprovedAt ? dateTime(record.introductionApprovedAt) : "Not yet"}</Detail>
              <Detail label="Request status">{record.capitalRequest ? requestStatusLabel(record.capitalRequest.status) : null}</Detail>
            </dl>
            <div className="mt-5 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-4">
              {[["Due diligence items", record.dueDiligence.total], ["Complete", record.dueDiligence.verified], ["Issues", record.dueDiligence.issues], ["Overdue", record.dueDiligence.overdue]].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-slate-50 px-3 py-2"><p className="text-lg font-black text-slate-900">{value}</p><p className="text-xs text-slate-500">{label}</p></div>
              ))}
            </div>
            {record.capitalRequest?.purpose ? <dl className="mt-4 border-t border-slate-100 pt-4"><Detail label="What the funding is for"><span className="whitespace-pre-wrap">{record.capitalRequest.purpose}</span></Detail></dl> : null}
          </Card>

          <div className="space-y-4">
            <Card title="Enterprise">
              <dl className="space-y-3">
                <Detail label="Name">{record.enterprise?.name}</Detail>
                <Detail label="Sector / location">{[record.enterprise?.sector, record.enterprise?.location].filter(Boolean).join(" · ")}</Detail>
                <Detail label="Readiness">{record.capitalRequest ? readinessLabel(record.capitalRequest.readinessStatus) : null}</Detail>
                <Detail label="Contact">{[record.enterprise?.email, record.enterprise?.phone].filter(Boolean).join(" · ")}</Detail>
              </dl>
            </Card>
            <Card title="Capital provider" action={record.provider?.uuid ? <Link to={`/dashboard/capital/providers/${record.provider.uuid}`} className={buttonClass.link}>Profile</Link> : null}>
              <dl className="space-y-3">
                <Detail label="Name">{record.provider?.name}</Detail>
                <Detail label="Type">{providerTypeLabel(record.provider?.providerType)}</Detail>
                <Detail label="Contact">{[record.provider?.contactName, record.provider?.contactEmail, record.provider?.contactPhone].filter(Boolean).join(" · ")}</Detail>
                <Detail label="Platform account">{record.provider?.account ? `${record.provider.account.name}` : "Not linked"}</Detail>
              </dl>
            </Card>
          </div>
        </div>
      ) : null}

      {tab === "match" ? (
        <Card title={`Match score ${record.matchScore ?? "—"}%`}>
          <p className="mb-4 text-sm text-slate-700">{record.matchExplanation || "No explanation recorded."}</p>
          <ul className="space-y-3">
            {(record.matchBreakdown || []).map((row) => (
              <li key={row.key}>
                <div className="mb-0.5 flex justify-between text-xs"><span className="font-medium text-slate-700">{row.label} <span className="text-slate-400">· weight {row.weight}%</span></span><span className="font-bold text-slate-900">{row.score}</span></div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full" style={{ width: `${row.score}%`, backgroundColor: "#2a78d6" }} /></div>
                <p className="mt-0.5 text-[11px] text-slate-500">{row.reason}</p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-slate-500">The score was recorded when the provider was selected. Any manual override and its reason are in the internal notes.</p>
        </Card>
      ) : null}

      {tab === "introductions" ? (
        <Card title="Introductions" padded={false} action={<Link to="/dashboard/capital/introductions" className={buttonClass.link}>Introduction queue</Link>}>
          <DataTable
            rows={record.introductions}
            empty="No introduction on this opportunity yet. Approve one from the introduction queue, or make it when selecting the provider."
            columns={[
              { key: "initiatedBy", label: "Initiated by", render: (row) => human(row.initiatedBy) },
              { key: "requestType", label: "Request", render: (row) => introductionTypeLabel(row.requestType) },
              { key: "status", label: "Status", render: (row) => <StatusChip value={row.status} label={human(row.status)} /> },
              { key: "reviewedBy", label: "Reviewed by", render: (row) => row.reviewedBy?.name || "—" },
              { key: "note", label: "Note", render: (row) => row.reviewNote || "—" },
              { key: "when", label: "Requested", render: (row) => `${dateTime(row.createdAt)}${row.scheduledAt ? ` · meeting ${dateTime(row.scheduledAt)}` : ""}` },
            ]}
          />
        </Card>
      ) : null}

      {tab === "communications" ? <ThreadsPanel opportunityUuid={record.uuid} initialThread={params.get("thread")} onActivity={load} /> : null}
      {tab === "documents" ? <DocumentsPanel opportunityUuid={record.uuid} canOpenRoom={record.introductionApproved && at(record.stage) >= at("provider_interest")} /> : null}
      {tab === "duediligence" ? <DueDiligencePanel opportunityUuid={record.uuid} /> : null}

      {tab === "interventions" ? (
        <Card title="Interventions" padded={false}>
          <DataTable
            rows={record.interventions}
            empty="No interventions on this opportunity."
            columns={[
              { key: "action", label: "Intervention", render: (row) => <span className="font-medium text-slate-800">{interventionLabel(row.action)}</span> },
              { key: "reason", label: "Reason", render: (row) => <><span className="block text-slate-700">{row.reason}</span>{row.comments ? <span className="block text-xs text-slate-500">{row.comments}</span> : null}</> },
              { key: "status", label: "Status change", render: (row) => <span className="text-xs text-slate-600">{human(row.previousStatus)} → {human(row.newStatus)}</span> },
              { key: "user", label: "By", render: (row) => <><span className="block text-slate-700">{row.user?.name || "—"}</span><span className="block text-xs text-slate-500">{dateTime(row.createdAt)}</span></> },
            ]}
          />
        </Card>
      ) : null}

      {tab === "notes" ? <NotesPanel subjectType="opportunity" subjectUuid={record.uuid} notes={record.notes} onAdded={load} /> : null}

      {tab === "outcome" ? (
        <Card title="Outcome and Anza's contribution">
          {record.outcome ? (
            <>
              <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Detail label="Outcome">{outcomeLabel(record.outcome)}</Detail>
                <Detail label="Type of financing">{financingLabel(record.financingType)}</Detail>
                <Detail label="Amount approved">{record.amountApproved ? money(record.amountApproved, record.currency) : null}</Detail>
                <Detail label="Amount committed">{record.amountCommitted ? money(record.amountCommitted, record.currency) : null}</Detail>
                <Detail label="Date committed">{record.dateCommitted ? shortDate(record.dateCommitted) : null}</Detail>
                <Detail label="Amount disbursed">{record.amountDisbursed ? money(record.amountDisbursed, record.currency) : null}</Detail>
                <Detail label="Date disbursed">{record.dateDisbursed ? shortDate(record.dateDisbursed) : null}</Detail>
                <Detail label="Capital source">{record.capitalSource}</Detail>
              </dl>
              <dl className="mt-4 space-y-4 border-t border-slate-100 pt-4">
                <Detail label="Financing terms"><span className="whitespace-pre-wrap">{record.financingTerms}</span></Detail>
                <Detail label="Anza's contribution">{(record.anzaContribution || []).map(contributionLabel).join(", ")}</Detail>
                <Detail label="Contribution notes"><span className="whitespace-pre-wrap">{record.anzaContributionNotes}</span></Detail>
                <Detail label="Evidence documents">{`${record.evidenceDocuments} on file`}</Detail>
                {record.closedReason ? <Detail label="Closing note">{record.closedReason}</Detail> : null}
              </dl>
            </>
          ) : (
            <Empty>No outcome recorded yet.</Empty>
          )}
        </Card>
      ) : null}

      {tab === "audit" ? <AuditTrail entries={record.auditTrail} /> : null}

      <Modal
        open={!!dialog}
        wide={dialog === "outcome"}
        title={dialog ? `${titles[dialog]} · ${record.reference}` : ""}
        onClose={() => setDialog(null)}
        footer={
          <>
            <button type="button" className={buttonClass.secondary} onClick={() => setDialog(null)}>Cancel</button>
            <button type="button" className={dialog === "outcome" ? buttonClass.success : buttonClass.primary} disabled={saving || (dialog === "stage" && (!stageTarget || targetErrors.length > 0))} onClick={() => submitters[dialog]?.()}>
              {saving ? "Saving…" : "Save"}
            </button>
          </>
        }
      >
        {dialog === "stage" ? (
          <div className="space-y-4">
            <Field label="Move to">
              <Select value={form.stage} onChange={set("stage")} placeholder="Choose a stage" options={record.stageRules.filter((rule) => rule.stage !== record.stage).map((rule) => ({ value: rule.stage, label: `${stageLabel(rule.stage)}${rule.errors.some((e) => !fixable(e)) ? " (blocked)" : ""}` }))} />
            </Field>
            {stageTarget && at(stageTarget) >= at("commitment") ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={`Amount committed (${record.currency})`}><input className={inputClass} inputMode="numeric" value={form.amountCommitted} onChange={setInput("amountCommitted")} /></Field>
                <Field label="Date committed"><input type="date" className={inputClass} value={form.dateCommitted} onChange={setInput("dateCommitted")} /></Field>
                {at(stageTarget) >= at("disbursement") ? (
                  <>
                    <Field label={`Amount disbursed (${record.currency})`}><input className={inputClass} inputMode="numeric" value={form.amountDisbursed} onChange={setInput("amountDisbursed")} /></Field>
                    <Field label="Date disbursed"><input type="date" className={inputClass} value={form.dateDisbursed} onChange={setInput("dateDisbursed")} /></Field>
                  </>
                ) : null}
              </div>
            ) : null}
            {targetErrors.length ? (
              <ul className="list-disc space-y-1 rounded-xl border border-rose-200 bg-rose-50 py-2 pl-8 pr-3 text-sm text-rose-800">
                {targetErrors.map((error) => <li key={error}>{error}</li>)}
              </ul>
            ) : null}
            <Field label="Note (optional, kept in the audit trail)"><input className={inputClass} value={form.reason || ""} onChange={setInput("reason")} /></Field>
          </div>
        ) : null}

        {dialog === "response" ? (
          <div className="space-y-4">
            <Field label="Response"><Select value={form.response} onChange={set("response")} options={RESPONSES} /></Field>
            <Field label="Note"><textarea rows={3} className={inputClass} value={form.note || ""} onChange={setInput("note")} placeholder="What the provider said" /></Field>
          </div>
        ) : null}

        {dialog === "mode" ? (
          <div className="space-y-4">
            {Object.entries(MODE_LABELS).map(([key, mode]) => (
              <label key={key} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${form.mode === key ? "border-[#082d77] bg-blue-50/40" : "border-slate-200"}`}>
                <input type="radio" name="mode" className="mt-1" checked={form.mode === key} onChange={() => set("mode")(key)} disabled={key !== "moderated" && !record.introductionApproved} />
                <span><span className="block text-sm font-semibold text-slate-800">{mode.label}</span><span className="block text-xs text-slate-500">{mode.note}</span></span>
              </label>
            ))}
            {!record.introductionApproved ? <p className="text-xs text-amber-700">Monitored and direct communication need an approved introduction.</p> : null}
            <Field label="Reason"><textarea rows={2} className={inputClass} value={form.reason || ""} onChange={setInput("reason")} /></Field>
          </div>
        ) : null}

        {dialog === "intervene" ? (
          <div className="space-y-4">
            <Field label="Intervention">
              <Select value={form.action} onChange={set("action")} placeholder="Choose an intervention" options={(options?.interventions || []).map((key) => ({ value: key, label: INTERVENTION_LABELS[key] || human(key) }))} />
            </Field>
            {form.action === "change_provider" ? (
              <Field label="New capital provider">
                <Select value={form.providerUuid} onChange={set("providerUuid")} placeholder="Choose a provider" options={(options?.providers || []).filter((p) => p.uuid !== record.provider?.uuid)} getValue={(o) => o.uuid} getLabel={(o) => `${o.name} · ${providerTypeLabel(o.providerType)}`} />
              </Field>
            ) : null}
            {form.action === "schedule_meeting" ? <Field label="Meeting date and time"><input type="datetime-local" className={inputClass} value={form.meetingAt || ""} onChange={setInput("meetingAt")} /></Field> : null}
            {form.action === "close_opportunity" ? (
              <Field label="Outcome"><Select value={form.outcome} onChange={set("outcome")} placeholder="Other" options={Object.entries(OUTCOME_LABELS).filter(([key]) => !SUCCESS.includes(key)).map(([value, label]) => ({ value, label }))} /></Field>
            ) : null}
            <Field label="Reason"><textarea rows={3} className={inputClass} value={form.reason || ""} onChange={setInput("reason")} /></Field>
            <Field label="Comments (optional)"><textarea rows={2} className={inputClass} value={form.comments || ""} onChange={setInput("comments")} /></Field>
            <p className="text-xs text-slate-500">Recorded with your name, the date, the reason, and the opportunity's status before and after.</p>
          </div>
        ) : null}

        {dialog === "outcome" ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Outcome"><Select value={form.outcome} onChange={set("outcome")} placeholder="Choose the outcome" options={Object.entries(OUTCOME_LABELS).map(([value, label]) => ({ value, label }))} /></Field>
              <Field label="Type of financing"><Select value={form.financingType} onChange={set("financingType")} options={(options?.financingTypes || []).map((v) => ({ value: v, label: financingLabel(v) }))} /></Field>
            </div>
            {success ? (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label={`Approved (${record.currency})`}><input className={inputClass} inputMode="numeric" value={form.amountApproved} onChange={setInput("amountApproved")} /></Field>
                  <Field label={`Committed (${record.currency})`}><input className={inputClass} inputMode="numeric" value={form.amountCommitted} onChange={setInput("amountCommitted")} /></Field>
                  <Field label="Date committed"><input type="date" className={inputClass} value={form.dateCommitted} onChange={setInput("dateCommitted")} /></Field>
                  <Field label={`Disbursed (${record.currency})`}><input className={inputClass} inputMode="numeric" value={form.amountDisbursed} onChange={setInput("amountDisbursed")} /></Field>
                  <Field label="Date disbursed"><input type="date" className={inputClass} value={form.dateDisbursed} onChange={setInput("dateDisbursed")} /></Field>
                  <Field label="Capital source"><input className={inputClass} value={form.capitalSource} onChange={setInput("capitalSource")} placeholder="Fund, facility or programme" /></Field>
                </div>
                <Field label="Financing terms"><textarea rows={2} className={inputClass} value={form.financingTerms} onChange={setInput("financingTerms")} placeholder="Tenor, rate, equity stake, conditions…" /></Field>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">How Anza contributed (at least one)</p>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(CONTRIBUTION_LABELS).map(([key, label]) => (
                      <label key={key} className="flex items-center gap-2 text-sm text-slate-700">
                        <input type="checkbox" checked={(form.anzaContribution || []).includes(key)} onChange={() => toggleContribution(key)} />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
                <Field label="Contribution notes"><textarea rows={2} className={inputClass} value={form.anzaContributionNotes} onChange={setInput("anzaContributionNotes")} /></Field>
                {!record.evidenceDocuments ? <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900">No evidence is on file yet. Upload the signed agreement, commitment letter or disbursement evidence in the deal room.</p> : null}
              </>
            ) : form.outcome ? (
              <p className="text-sm text-slate-600">The opportunity will be closed as {outcomeLabel(form.outcome).toLowerCase()}.</p>
            ) : null}
          </div>
        ) : null}

        {dialog === "reopen" ? <Field label="Reason for reopening"><textarea rows={3} className={inputClass} value={form.reason || ""} onChange={setInput("reason")} /></Field> : null}

        {dialog === "edit" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Next action" className="sm:col-span-2"><input className={inputClass} value={form.nextAction} onChange={setInput("nextAction")} /></Field>
            <Field label="Next action due"><input type="date" className={inputClass} value={form.nextActionDate} onChange={setInput("nextActionDate")} /></Field>
            <Field label="Meeting"><input type="datetime-local" className={inputClass} value={form.meetingAt} onChange={setInput("meetingAt")} /></Field>
            <Field label="Probability (%)"><input className={inputClass} inputMode="numeric" value={form.probability} onChange={setInput("probability")} /></Field>
            <Field label={`Potential financing (${record.currency})`}><input className={inputClass} inputMode="numeric" value={form.potentialAmount} onChange={setInput("potentialAmount")} /></Field>
            <Field label="Capital Facilitation Manager" className="sm:col-span-2"><Select value={form.managerUuid} onChange={set("managerUuid")} placeholder="Unassigned" options={options?.managers || []} getValue={(o) => o.uuid} getLabel={(o) => o.name} /></Field>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default CapitalOpportunityRecord;
