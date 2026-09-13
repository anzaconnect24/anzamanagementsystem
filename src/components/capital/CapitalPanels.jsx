"use client";

// The three working areas of a capital opportunity, shared by the Capital
// Facilitation Manager's record and by the enterprise's and capital provider's
// own pages. Each panel asks the API what the caller is to the opportunity
// (manager / staff, enterprise, provider) and offers only what that role may do;
// the API enforces the same rules.
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  applyDueDiligenceTemplate,
  changeDocumentVisibility,
  createDealRoom,
  createDueDiligenceItem,
  deleteCapitalDocument,
  deleteDueDiligenceItem,
  getCapitalThread,
  getDueDiligenceChecklist,
  getOpportunityDocuments,
  getOpportunityThreads,
  moderateCapitalMessage,
  postCapitalMessage,
  replaceCapitalDocument,
  submitDueDiligenceItem,
  updateDueDiligenceItem,
  uploadOpportunityDocument,
} from "@/controllers/capital_controller";
import { Card, Empty, Field, inputClass, LoadingBlock, Modal, Select, StatusChip, buttonClass } from "@/components/capital/CapitalUI";
import { openDocument } from "@/components/capital/CapitalRecord";
import useCapitalAccess from "@/components/capital/useCapitalAccess";
import {
  DD_CATEGORY_LABELS,
  DOCUMENT_CATEGORY_LABELS,
  MODE_LABELS,
  VISIBILITY_LABELS,
  dateTime,
  ddCategoryLabel,
  documentCategoryLabel,
  fileSize,
  human,
  modeLabel,
  shortDate,
  visibilityLabel,
} from "@/utils/capital_labels";

const failed = (response, fallback) => {
  if (response?.status === false) {
    toast.error(response.message || fallback);
    return true;
  }
  return false;
};

// ============================================================================
// Communications
// ============================================================================

const KIND_LABELS = {
  manager: { enterprise_provider: "Enterprise ↔ Capital provider", enterprise_manager: "Enterprise ↔ Anza", provider_manager: "Capital provider ↔ Anza" },
  enterprise: { enterprise_provider: "With the capital provider", enterprise_manager: "With Anza" },
  provider: { enterprise_provider: "With the enterprise", provider_manager: "With Anza" },
};

const Message = ({ message, party, onModerate }) => {
  const [mode, setMode] = useState(null);
  const [body, setBody] = useState(message.body);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const decide = async (decision) => {
    if (decision === "reject" && !note.trim()) return toast.error("Tell the sender why the message is not delivered");
    if (decision === "edit" && !body.trim()) return toast.error("Write the edited message");
    setSaving(true);
    const response = await moderateCapitalMessage(message.uuid, { decision, body: decision === "edit" ? body : undefined, note: note || undefined });
    setSaving(false);
    if (failed(response, "Failed to moderate the message")) return;
    toast.success(decision === "approve" ? "Delivered" : decision === "edit" ? "Edited and delivered" : "Rejected");
    setMode(null);
    onModerate();
  };

  const fromAnza = message.isIntervention || (party !== "manager" && !message.mine && ["CFM", "Admin"].includes(message.senderRole));

  return (
    <li className={`flex ${message.mine ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${message.mine ? "bg-[#082d77] text-white" : fromAnza ? "border border-orange-200 bg-orange-50 text-slate-800" : "bg-slate-100 text-slate-800"}`}>
        <p className={`mb-0.5 text-[11px] font-semibold ${message.mine ? "text-white/70" : "text-slate-500"}`}>
          {message.mine ? "You" : message.sender?.name || "—"}
          {fromAnza ? " · Anza" : ""}
          {message.isIntervention && party === "manager" ? " · intervention" : ""}
        </p>
        <p className="whitespace-pre-wrap">{message.body}</p>

        {party === "manager" && message.originalBody ? <p className={`mt-1 text-[11px] ${message.mine ? "text-white/70" : "text-slate-500"}`}>Original: {message.originalBody}</p> : null}
        {message.moderationNote && (party === "manager" || message.status === "rejected") ? <p className={`mt-1 text-[11px] ${message.mine ? "text-white/80" : "text-slate-600"}`}>Anza's note: {message.moderationNote}</p> : null}
        {party !== "manager" && message.edited ? <p className="mt-1 text-[11px] text-white/70">Edited by Anza before delivery</p> : null}

        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className={`text-[10px] ${message.mine ? "text-white/60" : "text-slate-400"}`}>{dateTime(message.createdAt)}</span>
          {message.status !== "delivered" ? <StatusChip value={message.status} label={message.status === "pending_approval" ? "Awaiting Anza's approval" : "Not delivered"} /> : null}
        </div>

        {party === "manager" && message.status === "pending_approval" ? (
          <div className="mt-3 rounded-xl bg-white p-3 text-slate-800">
            {mode === "edit" ? <textarea rows={3} className={`${inputClass} mb-2`} value={body} onChange={(e) => setBody(e.target.value)} /> : null}
            {mode ? <input className={`${inputClass} mb-2`} value={note} onChange={(e) => setNote(e.target.value)} placeholder={mode === "reject" ? "Reason (sent to the sender)" : "Note to the sender (optional)"} /> : null}
            <div className="flex flex-wrap gap-2">
              {mode ? (
                <>
                  <button type="button" disabled={saving} className={mode === "reject" ? buttonClass.danger : buttonClass.primary} onClick={() => decide(mode)}>{mode === "reject" ? "Reject message" : "Deliver edited message"}</button>
                  <button type="button" className={buttonClass.secondary} onClick={() => setMode(null)}>Cancel</button>
                </>
              ) : (
                <>
                  <button type="button" disabled={saving} className={buttonClass.success} onClick={() => decide("approve")}>Approve</button>
                  <button type="button" className={buttonClass.secondary} onClick={() => setMode("edit")}>Edit</button>
                  <button type="button" className={buttonClass.danger} onClick={() => setMode("reject")}>Reject</button>
                </>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </li>
  );
};

export const ThreadsPanel = ({ opportunityUuid, initialThread, onActivity }) => {
  const [meta, setMeta] = useState(null);
  const [active, setActive] = useState(initialThread || null);
  const [thread, setThread] = useState(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let alive = true;
    getOpportunityThreads(opportunityUuid).then((response) => {
      if (!alive || failed(response, "Failed to load conversations")) return;
      setMeta(response.body);
      setActive((current) => (current && response.body.data.some((t) => t.uuid === current) ? current : response.body.data[0]?.uuid || null));
    });
    return () => {
      alive = false;
    };
  }, [opportunityUuid]);

  const loadThread = useCallback(async () => {
    if (!active) return;
    const response = await getCapitalThread(active);
    if (!failed(response, "Failed to load the conversation")) setThread(response.body);
  }, [active]);

  useEffect(() => {
    setThread(null);
    loadThread();
    const timer = setInterval(loadThread, 30000);
    return () => clearInterval(timer);
  }, [loadThread]);

  const send = async () => {
    if (!draft.trim()) return;
    setSending(true);
    const response = await postCapitalMessage(active, { body: draft });
    setSending(false);
    if (failed(response, "Failed to send the message")) return;
    setDraft("");
    if (response.body.status === "pending_approval") toast.success("Sent to Anza for approval before delivery");
    loadThread();
    if (onActivity) onActivity();
  };

  if (!meta) return <LoadingBlock label="Loading conversations…" />;
  const labels = KIND_LABELS[meta.party] || KIND_LABELS.manager;
  const mode = MODE_LABELS[meta.communicationMode];

  return (
    <Card title="Communications" padded={false}>
      <div className="border-b border-slate-100 px-5 py-3 text-sm">
        <span className="font-semibold text-slate-800">{modeLabel(meta.communicationMode)} communication</span>
        {meta.communicationPaused ? <span className="ml-2"><StatusChip value="on_hold" label="Paused by Anza" /></span> : null}
        {mode ? <span className="ml-2 text-slate-500">{mode.note}</span> : null}
        {!meta.introductionApproved && meta.party === "manager" ? <p className="mt-1 text-xs text-amber-700">The parties cannot talk to each other until the introduction is approved.</p> : null}
      </div>

      <div className="grid md:grid-cols-[220px_1fr]">
        <ul className="border-b border-slate-100 md:border-b-0 md:border-r">
          {meta.data.map((item) => (
            <li key={item.uuid}>
              <button type="button" onClick={() => setActive(item.uuid)} className={`block w-full px-5 py-3 text-left text-sm ${active === item.uuid ? "bg-slate-50 font-semibold text-[#082d77]" : "text-slate-700 hover:bg-slate-50"}`}>
                {labels[item.kind] || human(item.kind)}
                <span className="block text-[11px] font-normal text-slate-400">{item.lastMessageAt ? dateTime(item.lastMessageAt) : "No messages yet"}</span>
              </button>
            </li>
          ))}
        </ul>

        <div className="flex min-h-[360px] flex-col">
          {!thread ? (
            <LoadingBlock label="Loading messages…" />
          ) : (
            <>
              <ul className="max-h-[480px] flex-1 space-y-3 overflow-y-auto p-5">
                {thread.data.length ? thread.data.map((message) => <Message key={message.uuid} message={message} party={thread.party} onModerate={loadThread} />) : <Empty>No messages in this conversation yet.</Empty>}
              </ul>
              <div className="border-t border-slate-100 p-4">
                {thread.canPost ? (
                  <>
                    {thread.moderated ? <p className="mb-2 text-xs text-slate-500">Anza reviews messages to the other party before they are delivered. Do not share contact details here.</p> : null}
                    {thread.party === "manager" && thread.kind === "enterprise_provider" ? <p className="mb-2 text-xs text-slate-500">Your message goes to both parties at once and is recorded as an intervention.</p> : null}
                    <div className="flex gap-2">
                      <textarea rows={2} className={inputClass} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Write a message…" />
                      <button type="button" className={`${buttonClass.primary} self-end`} disabled={sending || !draft.trim()} onClick={send}>{sending ? "Sending…" : "Send"}</button>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-slate-500">Messaging is closed on this opportunity{thread.opportunity.communicationPaused ? " while Anza has paused communication" : ""}.</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  );
};

// ============================================================================
// Documents and the deal room
// ============================================================================

export const DocumentsPanel = ({ opportunityUuid, canOpenRoom = false }) => {
  const { can } = useCapitalAccess();
  const [state, setState] = useState(null);
  const [upload, setUpload] = useState({ file: null, title: "", category: "pitch_deck", visibility: "internal" });
  const [uploadKey, setUploadKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [reason, setReason] = useState("");

  const load = useCallback(async () => {
    const response = await getOpportunityDocuments(opportunityUuid);
    if (!failed(response, "Failed to load documents")) setState(response.body);
  }, [opportunityUuid]);

  useEffect(() => {
    load();
  }, [load]);

  if (!state) return <LoadingBlock label="Loading documents…" />;

  const staff = state.party === "staff";
  const manages = staff && can("capital.dealrooms.manage");

  const send = async () => {
    if (!upload.file) return toast.error("Choose a file to upload");
    setBusy(true);
    const response = await uploadOpportunityDocument(opportunityUuid, upload.file, { title: upload.title, category: upload.category, visibility: manages ? upload.visibility : undefined });
    setBusy(false);
    if (failed(response, "Upload failed")) return;
    toast.success(staff ? "Document uploaded" : "Uploaded. Anza decides who else can see it.");
    setUpload({ ...upload, file: null, title: "" });
    setUploadKey((key) => key + 1);
    load();
  };

  const openRoom = async () => {
    const response = await createDealRoom(opportunityUuid, {});
    if (failed(response, "Failed to open the deal room")) return;
    toast.success("Deal room opened; both parties were notified");
    load();
  };

  const setVisibility = async (document, visibility) => {
    const response = await changeDocumentVisibility(document.uuid, { visibility });
    if (failed(response, "Failed to change who can see the document")) return;
    toast.success(`${document.title}: ${visibilityLabel(visibility)}`);
    load();
  };

  const replace = async (document, file) => {
    if (!file) return;
    const response = await replaceCapitalDocument(document.uuid, file, {});
    if (failed(response, "Failed to replace the document")) return;
    toast.success(`Version ${response.body.version} uploaded`);
    load();
  };

  const remove = async () => {
    if (!reason.trim()) return toast.error("Give a reason for deleting the document");
    const response = await deleteCapitalDocument(removing.uuid, { reason });
    if (failed(response, "Failed to delete the document")) return;
    toast.success("Document deleted; the record is kept in the audit trail");
    setRemoving(null);
    setReason("");
    load();
  };

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <Card
        className="xl:col-span-2"
        padded={false}
        title={state.dealRoom ? `Deal room · ${state.dealRoom.name}` : "Documents"}
        action={!state.dealRoom && manages && canOpenRoom ? <button type="button" className={buttonClass.primary} onClick={openRoom}>Open deal room</button> : null}
      >
        {state.data.length ? (
          <ul className="divide-y divide-slate-100">
            {state.data.map((document) => (
              <li key={document.uuid} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="font-medium text-slate-800">{document.title}</p>
                  <p className="text-xs text-slate-500">
                    {documentCategoryLabel(document.category)} · v{document.version} · {fileSize(document.sizeBytes)} · {document.uploadedBy?.name || "—"}
                    {document.uploadedBy?.role ? ` (${document.uploadedBy.role})` : ""} · {shortDate(document.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {manages ? (
                    <Select className="!w-48 !py-1 text-xs" value={document.visibility} onChange={(value) => setVisibility(document, value)} options={(state.visibilities || []).map((v) => ({ value: v, label: VISIBILITY_LABELS[v]?.label || v }))} />
                  ) : staff ? (
                    <StatusChip value="neutral" label={visibilityLabel(document.visibility)} />
                  ) : null}
                  <button type="button" className={buttonClass.link} onClick={() => openDocument(document)}>View</button>
                  <button type="button" className={buttonClass.link} onClick={() => openDocument(document, true)}>Download</button>
                  {manages ? (
                    <>
                      <label className={`${buttonClass.link} cursor-pointer`}>
                        Replace
                        <input type="file" className="hidden" onChange={(e) => replace(document, e.target.files?.[0])} />
                      </label>
                      <button type="button" className="text-sm font-semibold text-rose-700 hover:underline" onClick={() => setRemoving(document)}>Delete</button>
                    </>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-5"><Empty>No documents {staff ? "on this opportunity yet" : "shared with you yet"}.</Empty></div>
        )}
      </Card>

      <Card title="Upload a document">
        <div className="space-y-3">
          <Field label="File"><input key={uploadKey} type="file" className={inputClass} onChange={(e) => setUpload({ ...upload, file: e.target.files?.[0] || null })} /></Field>
          <Field label="Title"><input className={inputClass} value={upload.title} onChange={(e) => setUpload({ ...upload, title: e.target.value })} placeholder="Defaults to the file name" /></Field>
          <Field label="Category"><Select value={upload.category} onChange={(value) => setUpload({ ...upload, category: value })} options={Object.entries(DOCUMENT_CATEGORY_LABELS).map(([value, label]) => ({ value, label }))} /></Field>
          {manages ? (
            <Field label="Who can see it"><Select value={upload.visibility} onChange={(value) => setUpload({ ...upload, visibility: value })} options={(state.visibilities || []).map((v) => ({ value: v, label: `${VISIBILITY_LABELS[v].label} - ${VISIBILITY_LABELS[v].note}` }))} /></Field>
          ) : (
            <p className="text-xs text-slate-500">Only you and Anza see what you upload until Anza shares it.</p>
          )}
          <button type="button" className={`${buttonClass.primary} w-full`} disabled={busy} onClick={send}>{busy ? "Uploading…" : "Upload"}</button>
        </div>
      </Card>

      <Modal
        open={!!removing}
        title={removing ? `Delete "${removing.title}"` : ""}
        onClose={() => setRemoving(null)}
        footer={<><button type="button" className={buttonClass.secondary} onClick={() => setRemoving(null)}>Cancel</button><button type="button" className={buttonClass.danger} onClick={remove}>Delete document</button></>}
      >
        <p className="mb-3 text-sm text-slate-600">Nobody will be able to open the document. The record of it, and of this deletion, stays in the audit trail.</p>
        <Field label="Reason"><textarea rows={3} className={inputClass} value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
      </Modal>
    </div>
  );
};

// ============================================================================
// Due diligence
// ============================================================================

const PARTIES = ["enterprise", "provider", "anza"];
const RISKS = ["low", "medium", "high", "critical"];
const DONE = ["verified", "resolved", "not_applicable"];

const StaffItem = ({ item, statuses, onChange }) => {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState(item.comments || "");

  const save = async (values) => {
    const response = await updateDueDiligenceItem(item.uuid, values);
    if (!failed(response, "Failed to save the item")) onChange();
  };

  const remove = async () => {
    if (!window.confirm("Remove this due diligence item?")) return;
    const response = await deleteDueDiligenceItem(item.uuid);
    if (!failed(response, "Failed to remove the item")) onChange();
  };

  return (
    <li className="px-5 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-800">{item.requirement}</p>
          <p className="text-xs text-slate-500">
            {item.overdue ? <span className="font-semibold text-rose-700">Overdue · </span> : null}
            {item.document ? (
              <button type="button" className={buttonClass.link} onClick={() => openDocument(item.document)}>{item.document.title}</button>
            ) : (
              "No document yet"
            )}
            {item.reviewer ? ` · Reviewer: ${item.reviewer.name}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select className="!w-32 !py-1 text-xs" value={item.responsibleParty} onChange={(value) => save({ responsibleParty: value })} options={PARTIES.map((v) => ({ value: v, label: human(v) }))} />
          <Select className="!w-40 !py-1 text-xs" value={item.status} onChange={(value) => save({ status: value })} options={statuses.map((v) => ({ value: v, label: human(v) }))} />
          <Select className="!w-28 !py-1 text-xs" value={item.riskLevel} onChange={(value) => save({ riskLevel: value })} options={RISKS.map((v) => ({ value: v, label: `${human(v)} risk` }))} />
          <input type="date" className={`${inputClass} !w-36 !py-1 text-xs`} value={item.dueDate || ""} onChange={(e) => save({ dueDate: e.target.value })} />
          <button type="button" className={buttonClass.link} onClick={() => setOpen(!open)}>{open ? "Close" : "Comments"}</button>
          <button type="button" className="text-xs font-semibold text-rose-700 hover:underline" onClick={remove}>Remove</button>
        </div>
      </div>
      {open ? (
        <div className="mt-2 flex gap-2">
          <textarea rows={2} className={inputClass} value={comments} onChange={(e) => setComments(e.target.value)} placeholder="Review comments (Anza only)" />
          <button type="button" className={`${buttonClass.secondary} self-end`} onClick={() => save({ comments })}>Save</button>
        </div>
      ) : null}
    </li>
  );
};

const PartyItem = ({ item, opportunityUuid, onChange }) => {
  const [busy, setBusy] = useState(false);

  const submit = async (file) => {
    if (!file) return;
    setBusy(true);
    const uploaded = await uploadOpportunityDocument(opportunityUuid, file, { title: item.requirement.slice(0, 200), category: "due_diligence_documents" });
    if (failed(uploaded, "Upload failed")) return setBusy(false);
    const response = await submitDueDiligenceItem(item.uuid, { documentUuid: uploaded.body.uuid });
    setBusy(false);
    if (failed(response, "Failed to submit the document")) return;
    toast.success("Submitted to Anza for review");
    onChange();
  };

  const done = DONE.includes(item.status);

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-800">{item.requirement}</p>
        <p className="text-xs text-slate-500">
          Due {shortDate(item.dueDate)}
          {item.overdue ? <span className="font-semibold text-rose-700"> · Overdue</span> : null}
          {item.document ? ` · Submitted: ${item.document.title}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <StatusChip value={item.status} label={human(item.status)} />
        {!done ? (
          <label className={`${buttonClass.secondary} cursor-pointer ${busy ? "opacity-60" : ""}`}>
            {busy ? "Uploading…" : item.document ? "Submit a new file" : "Upload and submit"}
            <input type="file" className="hidden" disabled={busy} onChange={(e) => submit(e.target.files?.[0])} />
          </label>
        ) : null}
      </div>
    </li>
  );
};

export const DueDiligencePanel = ({ opportunityUuid, onChange }) => {
  const { can } = useCapitalAccess();
  const [state, setState] = useState(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ category: "financial", requirement: "", responsibleParty: "enterprise", riskLevel: "low", dueDate: "" });

  const load = useCallback(async () => {
    const response = await getDueDiligenceChecklist(opportunityUuid);
    if (!failed(response, "Failed to load due diligence")) setState(response.body);
    if (onChange) onChange();
  }, [opportunityUuid, onChange]);

  useEffect(() => {
    load();
  }, [load]);

  if (!state) return <LoadingBlock label="Loading due diligence…" />;

  const staff = state.party === "staff";
  const manages = staff && can("capital.duediligence.manage");
  const items = state.data.flatMap((group) => group.items);
  const complete = items.filter((item) => DONE.includes(item.status)).length;

  const applyTemplate = async () => {
    const response = await applyDueDiligenceTemplate(opportunityUuid, {});
    if (failed(response, "Failed to apply the checklist")) return;
    toast.success(response.body.added ? `${response.body.added} standard items added` : "Every standard item is already on the checklist");
    load();
  };

  const add = async () => {
    if (!form.requirement.trim()) return toast.error("Describe the requirement");
    const response = await createDueDiligenceItem(opportunityUuid, form);
    if (failed(response, "Failed to add the item")) return;
    setForm({ ...form, requirement: "" });
    setAdding(false);
    load();
  };

  return (
    <Card
      title="Due diligence"
      padded={false}
      action={
        manages ? (
          <div className="flex gap-2">
            <button type="button" className={buttonClass.secondary} onClick={applyTemplate}>Apply standard checklist</button>
            <button type="button" className={buttonClass.primary} onClick={() => setAdding(true)}>Add item</button>
          </div>
        ) : null
      }
    >
      <div className="border-b border-slate-100 px-5 py-3 text-sm text-slate-600">
        {items.length ? (
          <>
            <strong className="text-slate-900">{complete}</strong> of {items.length} complete
            {items.some((item) => item.overdue) ? <span className="ml-2 font-semibold text-rose-700">{items.filter((item) => item.overdue).length} overdue</span> : null}
            {staff && items.some((item) => item.status === "issue_identified") ? <span className="ml-2 font-semibold text-rose-700">{items.filter((item) => item.status === "issue_identified").length} issues</span> : null}
          </>
        ) : staff ? (
          "No checklist yet. Apply the standard checklist or add items."
        ) : (
          "Nothing is being asked of you in due diligence."
        )}
      </div>

      {state.data
        .filter((group) => group.items.length)
        .map((group) => (
          <section key={group.category}>
            <h3 className="bg-slate-50 px-5 py-2 text-xs font-bold uppercase tracking-wide text-slate-500">{ddCategoryLabel(group.category)}</h3>
            <ul className="divide-y divide-slate-100">
              {group.items.map((item) =>
                manages ? (
                  <StaffItem key={item.uuid} item={item} statuses={state.statuses} onChange={load} />
                ) : (
                  <PartyItem key={item.uuid} item={item} opportunityUuid={opportunityUuid} onChange={load} />
                ),
              )}
            </ul>
          </section>
        ))}

      <Modal
        open={adding}
        title="Add a due diligence item"
        onClose={() => setAdding(false)}
        footer={<><button type="button" className={buttonClass.secondary} onClick={() => setAdding(false)}>Cancel</button><button type="button" className={buttonClass.primary} onClick={add}>Add item</button></>}
      >
        <div className="space-y-3">
          <Field label="Category"><Select value={form.category} onChange={(value) => setForm({ ...form, category: value })} options={Object.entries(DD_CATEGORY_LABELS).map(([value, label]) => ({ value, label }))} /></Field>
          <Field label="Requirement"><textarea rows={3} className={inputClass} value={form.requirement} onChange={(e) => setForm({ ...form, requirement: e.target.value })} /></Field>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Responsible"><Select value={form.responsibleParty} onChange={(value) => setForm({ ...form, responsibleParty: value })} options={PARTIES.map((v) => ({ value: v, label: human(v) }))} /></Field>
            <Field label="Risk"><Select value={form.riskLevel} onChange={(value) => setForm({ ...form, riskLevel: value })} options={RISKS.map((v) => ({ value: v, label: human(v) }))} /></Field>
            <Field label="Due"><input type="date" className={inputClass} value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></Field>
          </div>
        </div>
      </Modal>
    </Card>
  );
};
