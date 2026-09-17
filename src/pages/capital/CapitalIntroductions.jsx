"use client";

import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { getCapitalOptions, listIntroductions, reviewIntroduction } from "@/controllers/capital_controller";
import { CapitalHero, Empty, Field, FilterBar, inputClass, LoadingBlock, MatchScore, Modal, Select, StatusChip, buttonClass } from "@/components/capital/CapitalUI";
import { openDocument } from "@/components/capital/CapitalRecord";
import useCapitalAccess from "@/components/capital/useCapitalAccess";
import { dateTime, documentCategoryLabel, financingLabel, human, introductionTypeLabel, money, providerTypeLabel, readinessLabel, stageLabel } from "@/utils/capital_labels";

const OPEN = ["pending_review", "changes_requested", "clarification_requested", "awaiting_enterprise_permission"];
const NEEDS_PERMISSION = ["pitch_deck", "financial_information", "due_diligence_documents", "business_plan", "financial_model", "additional_information"];

const ACTIONS = {
  approve: { label: "Approve introduction", tone: "success", help: "Creates or joins the capital opportunity, opens the conversations in moderated mode, and notifies both parties. Contact details become visible to both." },
  provide_information: { label: "Share the information", tone: "success", help: "The enterprise has agreed. Approving shares the requested information through the opportunity, in moderated mode." },
  edit: { label: "Edit message", tone: "secondary", field: "editedMessage" },
  request_changes: { label: "Request changes", tone: "secondary", note: "What needs to change (the requester sees this)" },
  request_clarification: { label: "Request clarification", tone: "secondary", note: "What needs clarifying (the requester sees this)" },
  request_enterprise_permission: { label: "Ask the enterprise's permission", tone: "secondary", optionalNote: true, help: "The enterprise is asked whether this provider may receive its information. Nothing is shared until it agrees." },
  replace_provider: { label: "Redirect to another provider", tone: "secondary", provider: true, optionalNote: true },
  decline: { label: "Decline", tone: "danger", note: "Reason (the requester sees this)" },
  schedule: { label: "Schedule introduction", tone: "primary", schedule: true },
};

const actionsFor = (row) => {
  if (row.status === "approved") return ["schedule"];
  if (row.status === "scheduled") return ["schedule"];
  if (!OPEN.includes(row.status)) return [];
  const permissionNeeded = row.initiatedBy === "provider" && NEEDS_PERMISSION.includes(row.requestType);
  const list = [];
  if (permissionNeeded) {
    if (row.enterprisePermission === "granted") list.push(row.requestType === "introduction" ? "approve" : "provide_information");
    else if (row.status !== "awaiting_enterprise_permission") list.push("request_enterprise_permission");
  } else {
    list.push("approve");
  }
  return [...list, "edit", "request_changes", "request_clarification", "replace_provider", "decline"];
};

const CapitalIntroductions = () => {
  const { can } = useCapitalAccess();
  const [options, setOptions] = useState(null);
  const [filters, setFilters] = useState({ status: "", initiatedBy: "" });
  const [result, setResult] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getCapitalOptions().then((response) => response?.status && setOptions(response.body));
  }, []);

  const load = useCallback(async () => {
    const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value));
    const response = await listIntroductions(params);
    if (response?.status === false) toast.error(response.message || "Failed to load introductions");
    else setResult(response.body);
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  if (!result) return <LoadingBlock label="Loading introductions…" />;

  const begin = (row, action) => {
    setForm({ editedMessage: row.editedMessage || row.message || "", note: "", providerUuid: "", scheduledAt: "" });
    setDialog({ row, action });
  };

  const submit = async () => {
    const { row, action } = dialog;
    const rule = ACTIONS[action];
    const data = { action };
    if (rule.note) {
      if (!form.note.trim()) return toast.error("Give a reason the requester will see");
      data.note = form.note;
    } else if (rule.optionalNote && form.note.trim()) data.note = form.note;
    if (rule.field || action === "approve") {
      if (action === "edit" && !form.editedMessage.trim()) return toast.error("Write the edited message");
      if (form.editedMessage.trim() && form.editedMessage !== row.message) data.editedMessage = form.editedMessage;
    }
    if (rule.provider) {
      if (!form.providerUuid) return toast.error("Choose the provider to redirect to");
      data.providerUuid = form.providerUuid;
    }
    if (rule.schedule) {
      if (!form.scheduledAt) return toast.error("Choose the date and time");
      data.scheduledAt = new Date(form.scheduledAt).toISOString();
    }

    setSaving(true);
    const response = await reviewIntroduction(row.uuid, data);
    setSaving(false);
    if (response?.status === false) return toast.error(response.message || "Failed to update the introduction");
    toast.success(response.body.opportunity ? `${rule.label}: ${response.body.opportunity.reference}` : `${rule.label}: done`);
    setDialog(null);
    load();
  };

  const manages = can("capital.introductions.manage");
  const rule = dialog ? ACTIONS[dialog.action] : null;

  return (
    <div className="min-h-screen px-4 py-4 md:px-6">
      <CapitalHero
        title="Introductions"
        description="Every request to connect an enterprise and a capital provider - whichever side asked - waits here for your decision. Nothing passes between them until you approve it."
      />

      <FilterBar onReset={() => setFilters({ status: "", initiatedBy: "" })}>
        <Field label="Status" className="w-56">
          <Select value={filters.status} onChange={(value) => setFilters({ ...filters, status: value })} placeholder="Waiting for a decision" options={[{ value: "all", label: "All" }, ...(options?.introductionStatuses || []).map((v) => ({ value: v, label: human(v) }))]} />
        </Field>
        <Field label="Initiated by" className="w-44">
          <Select value={filters.initiatedBy} onChange={(value) => setFilters({ ...filters, initiatedBy: value })} placeholder="Anyone" options={[{ value: "enterprise", label: "Enterprise" }, { value: "provider", label: "Capital provider" }, { value: "manager", label: "Anza" }]} />
        </Field>
        <p className="mb-2 text-xs text-slate-500">{result.count} {result.count === 1 ? "introduction" : "introductions"}</p>
      </FilterBar>

      {result.data.length ? (
        <div className="space-y-3">
          {result.data.map((row) => (
            <section key={row.uuid} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {row.initiatedBy === "provider" ? "Capital provider interest" : row.initiatedBy === "enterprise" ? "Enterprise request" : "Anza introduction"} · {introductionTypeLabel(row.requestType)} · {dateTime(row.createdAt)}
                  </p>
                  <h3 className="mt-1 text-base font-bold text-slate-900">
                    {row.enterprise?.name} <span className="font-normal text-slate-400">and</span> {row.provider?.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {[row.enterprise?.sector, row.enterprise?.location].filter(Boolean).join(" · ")} · {providerTypeLabel(row.provider?.providerType)}
                    {row.requestedBy ? ` · requested by ${row.requestedBy.name}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <MatchScore score={row.matchScore} />
                  <StatusChip value={row.status} label={human(row.status)} />
                  {row.enterprisePermission ? <StatusChip value={row.enterprisePermission === "granted" ? "approved" : row.enterprisePermission === "denied" ? "permission_denied" : "pending_review"} label={`Enterprise permission: ${row.enterprisePermission}`} /> : null}
                </div>
              </div>

              <div className="mt-3 grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <p className="whitespace-pre-wrap rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">{row.editedMessage || row.message || "No message."}</p>
                  {row.editedMessage && row.message ? <p className="mt-1 text-[11px] text-slate-500">Edited by Anza. Original: {row.message}</p> : null}
                  {row.reviewNote ? <p className="mt-2 text-xs text-slate-600">Anza's note: {row.reviewNote}{row.reviewedBy ? ` (${row.reviewedBy.name})` : ""}</p> : null}
                  {row.scheduledAt ? <p className="mt-2 text-xs font-semibold text-emerald-700">Scheduled for {dateTime(row.scheduledAt)}</p> : null}
                </div>
                <div className="text-sm">
                  {row.capitalRequest ? (
                    <>
                      <Link to={`/dashboard/capital/requests/${row.capitalRequest.uuid}`} className={buttonClass.link}>{row.capitalRequest.reference}</Link>
                      <p className="text-slate-700">{money(row.capitalRequest.amountRequested, row.capitalRequest.currency)} · {financingLabel(row.capitalRequest.financingType)}</p>
                      <p className="text-xs text-slate-500">Readiness: {readinessLabel(row.capitalRequest.readinessStatus)}</p>
                    </>
                  ) : (
                    <p className="text-xs text-slate-500">The enterprise has no open capital request. Approving opens one on its behalf.</p>
                  )}
                  {row.documents?.length ? (
                    <ul className="mt-2 space-y-0.5">
                      {row.documents.map((doc) => (
                        <li key={doc.uuid}><button type="button" className="text-xs text-[#082d77] hover:underline" onClick={() => openDocument(doc)}>{doc.title}</button> <span className="text-[11px] text-slate-400">{documentCategoryLabel(doc.category)}</span></li>
                      ))}
                    </ul>
                  ) : null}
                  {row.opportunity ? <Link to={`/dashboard/capital/opportunities/${row.opportunity.uuid}`} className={`${buttonClass.link} mt-2 block`}>{row.opportunity.reference} · {stageLabel(row.opportunity.stage)}</Link> : null}
                </div>
              </div>

              {manages && actionsFor(row).length ? (
                <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                  {actionsFor(row).map((action) => (
                    <button key={action} type="button" className={buttonClass[ACTIONS[action].tone]} onClick={() => begin(row, action)}>{ACTIONS[action].label}</button>
                  ))}
                </div>
              ) : null}
            </section>
          ))}
        </div>
      ) : (
        <Empty>{filters.status ? "No introductions match these filters." : "Nothing is waiting for a decision."}</Empty>
      )}

      <Modal
        open={!!dialog}
        title={dialog ? `${rule.label} · ${dialog.row.enterprise?.name} and ${dialog.row.provider?.name}` : ""}
        onClose={() => setDialog(null)}
        footer={
          <>
            <button type="button" className={buttonClass.secondary} onClick={() => setDialog(null)}>Cancel</button>
            <button type="button" className={buttonClass[rule?.tone === "secondary" ? "primary" : rule?.tone || "primary"]} disabled={saving} onClick={submit}>{saving ? "Saving…" : rule?.label}</button>
          </>
        }
      >
        {dialog ? (
          <div className="space-y-4">
            {rule.help ? <p className="text-sm text-slate-600">{rule.help}</p> : null}
            {rule.field || dialog.action === "approve" ? (
              <Field label={dialog.action === "approve" ? "Message the other party receives (edit if needed)" : "Edited message"}>
                <textarea rows={4} className={inputClass} value={form.editedMessage} onChange={(e) => setForm({ ...form, editedMessage: e.target.value })} />
              </Field>
            ) : null}
            {rule.provider ? (
              <Field label="Redirect to">
                <Select value={form.providerUuid} onChange={(value) => setForm({ ...form, providerUuid: value })} placeholder="Choose a capital provider" options={(options?.providers || []).filter((p) => p.uuid !== dialog.row.provider?.uuid)} getValue={(o) => o.uuid} getLabel={(o) => `${o.name} · ${providerTypeLabel(o.providerType)}`} />
              </Field>
            ) : null}
            {rule.schedule ? <Field label="Date and time"><input type="datetime-local" className={inputClass} value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} /></Field> : null}
            {rule.note || rule.optionalNote || dialog.action === "approve" ? (
              <Field label={rule.note || "Note (optional)"}>
                <textarea rows={3} className={inputClass} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
              </Field>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default CapitalIntroductions;
