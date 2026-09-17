"use client";

// Pieces every capital record page shares: confidential notes, the audit
// trail, and opening a protected document.
import { useState } from "react";
import toast from "react-hot-toast";
import { addCapitalNote, openCapitalDocument } from "@/controllers/capital_controller";
import { Card, Empty, inputClass, Timeline, buttonClass } from "@/components/capital/CapitalUI";
import { changeSummary, dateTime } from "@/utils/capital_labels";

// Documents are fetched with the session's token; a refusal is shown, never swallowed.
export const openDocument = async (document, download = false) => {
  const response = await openCapitalDocument(document.uuid, { download, name: document.originalName || document.title });
  if (!response.status) toast.error(response.message);
};

export const NotesPanel = ({ subjectType, subjectUuid, notes = [], onAdded }) => {
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!body.trim()) {
      toast.error("Write the note first");
      return;
    }
    setSaving(true);
    const response = await addCapitalNote(subjectType, subjectUuid, { body });
    setSaving(false);
    if (response?.status === false) {
      toast.error(response.message || "Failed to save the note");
      return;
    }
    setBody("");
    toast.success("Note saved");
    if (onAdded) onAdded();
  };

  return (
    <Card title="Internal notes" action={<span className="text-xs text-slate-500">Confidential: Capital Facilitation Managers only</span>}>
      <div className="mb-5">
        <textarea rows={3} className={inputClass} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Observations, risks, follow-ups… Enterprises and capital providers never see these notes." />
        <div className="mt-2 flex justify-end">
          <button type="button" className={buttonClass.primary} disabled={saving} onClick={save}>
            {saving ? "Saving…" : "Add note"}
          </button>
        </div>
      </div>
      {notes.length ? (
        <ul className="space-y-3">
          {notes.map((note) => (
            <li key={note.uuid} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="whitespace-pre-wrap text-sm text-slate-800">{note.body}</p>
              <p className="mt-1 text-[11px] text-slate-500">{note.author?.name || "—"} · {dateTime(note.createdAt)}</p>
            </li>
          ))}
        </ul>
      ) : (
        <Empty>No internal notes yet.</Empty>
      )}
    </Card>
  );
};

export const AuditTrail = ({ entries = [] }) => (
  <Card title="Audit trail" action={<span className="text-xs text-slate-500">Permanent record: entries cannot be edited or deleted</span>}>
    <Timeline
      empty="Nothing recorded yet."
      items={entries.map((row, index) => ({
        key: index,
        title: row.action,
        detail: changeSummary(row.oldValue, row.newValue),
        meta: `${row.user?.name || "System"}${row.role ? ` · ${row.role}` : ""} · ${dateTime(row.createdAt)}${row.ipAddress ? ` · ${row.ipAddress}` : ""}`,
      }))}
    />
  </Card>
);
