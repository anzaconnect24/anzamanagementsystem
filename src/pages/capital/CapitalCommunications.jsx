"use client";

import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { getCommunicationCentre, getModerationQueue, moderateCapitalMessage } from "@/controllers/capital_controller";
import { CapitalHero, Card, DataTable, Empty, Field, FilterBar, inputClass, LoadingBlock, Modal, Select, StatusChip, buttonClass } from "@/components/capital/CapitalUI";
import { MODE_LABELS, dateTime, human, modeLabel, stageLabel } from "@/utils/capital_labels";

const KINDS = { enterprise_provider: "Enterprise ↔ Capital provider", enterprise_manager: "Enterprise ↔ Anza", provider_manager: "Capital provider ↔ Anza" };
const EMPTY = { mode: "", kind: "", pending: "" };

// The Communication Centre: every capital conversation, and the messages held
// for approval before they reach the other party.
const CapitalCommunications = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [filters, setFilters] = useState(EMPTY);
  const [centre, setCentre] = useState(null);
  const [queue, setQueue] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [form, setForm] = useState({ body: "", note: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const query = Object.fromEntries(Object.entries(filters).filter(([, value]) => value));
    const [threads, pending] = await Promise.all([getCommunicationCentre(query), getModerationQueue()]);
    if (threads?.status === false) toast.error(threads.message || "Failed to load conversations");
    else setCentre(threads.body);
    if (pending?.status !== false) setQueue(pending.body);
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  // A notification links here with ?thread=…; open that conversation on its opportunity.
  const target = params.get("thread");
  useEffect(() => {
    if (!target || !centre) return;
    const thread = centre.data.find((row) => row.uuid === target);
    if (thread) navigate(`/dashboard/capital/opportunities/${thread.opportunity.uuid}?tab=communications&thread=${thread.uuid}`, { replace: true });
  }, [target, centre, navigate]);

  const decide = async (message, decision, values = {}) => {
    setSaving(true);
    const response = await moderateCapitalMessage(message.uuid, { decision, ...values });
    setSaving(false);
    if (response?.status === false) return toast.error(response.message || "Failed to moderate the message");
    toast.success(decision === "approve" ? "Delivered" : decision === "edit" ? "Edited and delivered" : "Rejected; the sender was told why");
    setDialog(null);
    load();
  };

  const confirm = () => {
    if (dialog.decision === "reject" && !form.note.trim()) return toast.error("Tell the sender why the message is not delivered");
    if (dialog.decision === "edit" && !form.body.trim()) return toast.error("Write the edited message");
    decide(dialog.message, dialog.decision, { body: dialog.decision === "edit" ? form.body : undefined, note: form.note || undefined });
  };

  if (!centre) return <LoadingBlock label="Loading the Communication Centre…" />;

  const set = (key) => (value) => setFilters((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="min-h-screen px-4 py-4 md:px-6">
      <CapitalHero title="Communication Centre" description="Enterprises and capital providers talk through Anza. In moderated mode their messages wait here for you; in monitored and direct mode you read along and can step in. Every intervention is recorded." />

      <Card title={`Waiting for approval (${queue?.count ?? 0})`} className="mb-4" padded={false}>
        {queue?.data.length ? (
          <ul className="divide-y divide-slate-100">
            {queue.data.map((message) => (
              <li key={message.uuid} className="px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-500">
                      <button type="button" className="font-semibold text-[#082d77] hover:underline" onClick={() => navigate(`/dashboard/capital/opportunities/${message.opportunity.uuid}?tab=communications&thread=${message.thread.uuid}`)}>{message.opportunity.reference}</button>
                      {" · "}{message.opportunity.enterprise} ↔ {message.opportunity.provider} · from <strong className="text-slate-700">{message.sender?.name || "—"}</strong> ({message.senderRole === "Investor" ? "capital provider" : message.senderRole === "Enterprenuer" ? "enterprise" : message.senderRole}) · {dateTime(message.createdAt)}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{message.body}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" disabled={saving} className={buttonClass.success} onClick={() => decide(message, "approve")}>Approve</button>
                    <button type="button" className={buttonClass.secondary} onClick={() => { setForm({ body: message.body, note: "" }); setDialog({ message, decision: "edit" }); }}>Edit</button>
                    <button type="button" className={buttonClass.danger} onClick={() => { setForm({ body: "", note: "" }); setDialog({ message, decision: "reject" }); }}>Reject</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-5"><Empty>No message is waiting for approval.</Empty></div>
        )}
      </Card>

      <FilterBar onReset={() => setFilters(EMPTY)}>
        <Field label="Mode" className="w-40"><Select value={filters.mode} onChange={set("mode")} placeholder="All" options={Object.entries(MODE_LABELS).map(([value, mode]) => ({ value, label: mode.label }))} /></Field>
        <Field label="Conversation" className="w-60"><Select value={filters.kind} onChange={set("kind")} placeholder="All" options={Object.entries(KINDS).map(([value, label]) => ({ value, label }))} /></Field>
        <Field label="Show" className="w-48"><Select value={filters.pending} onChange={set("pending")} placeholder="All conversations" options={[{ value: "1", label: "With messages to approve" }]} /></Field>
      </FilterBar>

      <Card title={`${centre.count} conversations`} padded={false}>
        <DataTable
          rows={centre.data}
          empty="No capital conversations match these filters."
          onRowClick={(row) => navigate(`/dashboard/capital/opportunities/${row.opportunity.uuid}?tab=communications&thread=${row.uuid}`)}
          columns={[
            { key: "opportunity", label: "Opportunity", render: (row) => <><span className="block text-xs font-semibold text-[#082d77]">{row.opportunity.reference}</span><span className="block text-slate-800">{row.opportunity.enterprise}</span><span className="block text-xs text-slate-500">{row.opportunity.provider}</span></> },
            { key: "kind", label: "Conversation", render: (row) => KINDS[row.kind] || human(row.kind) },
            { key: "mode", label: "Mode", render: (row) => <>{modeLabel(row.opportunity.communicationMode)}{row.opportunity.communicationPaused ? <span className="ml-1"><StatusChip value="on_hold" label="Paused" /></span> : null}</> },
            { key: "stage", label: "Stage", render: (row) => stageLabel(row.opportunity.stage) },
            { key: "messages", label: "Messages", render: (row) => <>{row.messages}{row.pendingApproval ? <span className="ml-1"><StatusChip value="pending_approval" label={`${row.pendingApproval} to approve`} /></span> : null}</> },
            { key: "preview", label: "Latest", render: (row) => <span className="line-clamp-2 text-xs text-slate-600">{row.preview || "—"}</span> },
            { key: "last", label: "Last message", className: "whitespace-nowrap", render: (row) => (row.lastMessageAt ? dateTime(row.lastMessageAt) : "—") },
          ]}
        />
      </Card>

      <Modal
        open={!!dialog}
        title={dialog?.decision === "edit" ? "Edit and deliver" : "Reject message"}
        onClose={() => setDialog(null)}
        footer={<><button type="button" className={buttonClass.secondary} onClick={() => setDialog(null)}>Cancel</button><button type="button" disabled={saving} className={dialog?.decision === "reject" ? buttonClass.danger : buttonClass.primary} onClick={confirm}>{dialog?.decision === "reject" ? "Reject" : "Deliver edited message"}</button></>}
      >
        {dialog ? (
          <div className="space-y-3">
            {dialog.decision === "edit" ? <Field label="Message the recipient will receive"><textarea rows={5} className={inputClass} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></Field> : <p className="whitespace-pre-wrap rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">{dialog.message.body}</p>}
            <Field label={dialog.decision === "reject" ? "Reason (sent to the sender)" : "Note to the sender (optional)"}><textarea rows={2} className={inputClass} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></Field>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default CapitalCommunications;
