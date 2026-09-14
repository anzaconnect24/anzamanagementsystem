"use client";

// The forms a startup uses to raise capital: an application (capital request),
// a request to be introduced to a capital provider, and a supporting document.
// Shared by every Raise Capital page.
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  createMyCapitalRequest,
  requestCapitalIntroduction,
  updateMyCapitalRequest,
  uploadRequestDocument,
} from "@/controllers/capital_controller";
import { Field, inputClass, Modal, Select, buttonClass } from "@/components/capital/CapitalUI";
import { DOCUMENT_CATEGORY_LABELS, FINANCING_LABELS, PROVIDER_TYPE_LABELS, financingLabel, money } from "@/utils/capital_labels";

export const CURRENCIES = ["USD", "TZS", "KES", "UGX", "RWF", "ZAR", "EUR", "GBP"];
// A startup may change an application while it is a draft or when Anza has asked for more.
export const EDITABLE = ["draft", "more_information_required"];
// An application that cannot carry introductions.
export const CLOSED = ["draft", "declined", "closed"];

const blankRequest = () => ({ amountRequested: "", currency: "USD", financingType: "equity", purpose: "", preferredProviderTypes: [], currentRevenue: "", revenueCurrency: "USD", traction: "", founderGender: "", youthLed: "" });

const fromRequest = (row) => ({
  amountRequested: row.amountRequested ?? "",
  currency: row.currency || "USD",
  financingType: row.financingType,
  purpose: row.purpose || "",
  preferredProviderTypes: row.preferredProviderTypes || [],
  currentRevenue: row.currentRevenue ?? "",
  revenueCurrency: row.revenueCurrency || row.currency || "USD",
  traction: row.traction || "",
  founderGender: row.founderGender || "",
  youthLed: row.youthLed === null || row.youthLed === undefined ? "" : String(row.youthLed),
});

// ---- Application ------------------------------------------------------------
export const CapitalRequestModal = ({ open, request, onClose, onSaved }) => {
  const [form, setForm] = useState(blankRequest());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(request ? fromRequest(request) : blankRequest());
  }, [open, request]);

  const set = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));
  const toggleType = (type) => set("preferredProviderTypes")(form.preferredProviderTypes.includes(type) ? form.preferredProviderTypes.filter((item) => item !== type) : [...form.preferredProviderTypes, type]);

  const save = async (submit) => {
    if (!(Number(form.amountRequested) > 0)) return toast.error("Say how much capital you need");
    if (submit && !form.purpose.trim()) return toast.error("Describe what the funding is for");
    const data = { ...form, youthLed: form.youthLed === "" ? null : form.youthLed === "true", submit };
    setSaving(true);
    const response = request ? await updateMyCapitalRequest(request.uuid, data) : await createMyCapitalRequest(data);
    setSaving(false);
    if (response?.status === false) return toast.error(response.message || "Failed to save the application");
    toast.success(submit ? `Application ${response.body.reference} sent to Anza for review` : "Draft saved");
    onSaved(response.body);
  };

  return (
    <Modal
      open={open}
      wide
      title={request ? `Application ${request.reference}` : "New investment application"}
      onClose={onClose}
      footer={
        <>
          <button type="button" className={buttonClass.secondary} onClick={onClose}>Cancel</button>
          {!request || request.status === "draft" ? <button type="button" className={buttonClass.secondary} disabled={saving} onClick={() => save(false)}>Save draft</button> : null}
          <button type="button" className={buttonClass.success} disabled={saving} onClick={() => save(true)}>{saving ? "Saving…" : "Submit to Anza"}</button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-600">Anza's Capital Facilitation team reviews your application and introduces you to capital providers that fit it.</p>
        {request?.infoRequest && request.status === "more_information_required" ? <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900"><strong>Anza needs:</strong> {request.infoRequest}</p> : null}
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Amount needed"><input className={inputClass} inputMode="numeric" value={form.amountRequested} onChange={(e) => set("amountRequested")(e.target.value)} /></Field>
          <Field label="Currency"><Select value={form.currency} onChange={set("currency")} options={CURRENCIES.map((c) => ({ value: c, label: c }))} /></Field>
          <Field label="Type of financing"><Select value={form.financingType} onChange={set("financingType")} options={Object.entries(FINANCING_LABELS).map(([value, label]) => ({ value, label }))} /></Field>
        </div>
        <Field label="What is the funding for?"><textarea rows={4} className={inputClass} value={form.purpose} onChange={(e) => set("purpose")(e.target.value)} placeholder="Use of funds, what it will achieve, and over what period" /></Field>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Preferred kinds of investor (optional)</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {Object.entries(PROVIDER_TYPE_LABELS).map(([value, label]) => (
              <label key={value} className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={form.preferredProviderTypes.includes(value)} onChange={() => toggleType(value)} />{label}</label>
            ))}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-4">
          <Field label="Annual revenue"><input className={inputClass} inputMode="numeric" value={form.currentRevenue} onChange={(e) => set("currentRevenue")(e.target.value)} /></Field>
          <Field label="Revenue currency"><Select value={form.revenueCurrency} onChange={set("revenueCurrency")} options={CURRENCIES.map((c) => ({ value: c, label: c }))} /></Field>
          <Field label="Founder gender"><Select value={form.founderGender} onChange={set("founderGender")} placeholder="Prefer not to say" options={[{ value: "female", label: "Female" }, { value: "male", label: "Male" }, { value: "mixed", label: "Mixed founding team" }]} /></Field>
          <Field label="Youth-led (under 35)"><Select value={form.youthLed} onChange={set("youthLed")} placeholder="Not stated" options={[{ value: "true", label: "Yes" }, { value: "false", label: "No" }]} /></Field>
        </div>
        <Field label="Traction"><textarea rows={3} className={inputClass} value={form.traction} onChange={(e) => set("traction")(e.target.value)} placeholder="Customers, growth, partnerships, milestones" /></Field>
      </div>
    </Modal>
  );
};

// ---- Introduction -----------------------------------------------------------
export const IntroductionModal = ({ provider, openRequests = [], onClose, onSent, onNewApplication }) => {
  const [form, setForm] = useState({ capitalRequestUuid: "", message: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (provider) setForm({ capitalRequestUuid: openRequests[0]?.uuid || "", message: "" });
  }, [provider, openRequests]);

  const send = async () => {
    if (!form.capitalRequestUuid) return toast.error("Choose the application this introduction is for");
    if (!form.message.trim()) return toast.error("Write a message for the investor");
    setSaving(true);
    const response = await requestCapitalIntroduction({ providerUuid: provider.uuid, ...form });
    setSaving(false);
    if (response?.status === false) return toast.error(response.message || "Failed to request the introduction");
    toast.success("Sent to Anza. Every introduction is reviewed before it is made.");
    onSent(response.body);
  };

  const needsApplication = !openRequests.length;

  return (
    <Modal
      open={!!provider}
      title={provider ? `Request an introduction to ${provider.name}` : ""}
      onClose={onClose}
      footer={
        <>
          <button type="button" className={buttonClass.secondary} onClick={onClose}>Cancel</button>
          {needsApplication ? (
            <button type="button" className={buttonClass.success} onClick={onNewApplication}>Start an application</button>
          ) : (
            <button type="button" className={buttonClass.primary} disabled={saving} onClick={send}>{saving ? "Sending…" : "Send to Anza"}</button>
          )}
        </>
      }
    >
      {needsApplication ? (
        <p className="text-sm text-slate-600">Submit an investment application first. Anza introduces you to investors against an application, so they know how much you are raising and why.</p>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Anza reviews your request and may edit your message, suggest a better-suited investor, or ask for more information first. Your contact details are shared only once the introduction is approved.</p>
          <Field label="For application">
            <Select value={form.capitalRequestUuid} onChange={(value) => setForm({ ...form, capitalRequestUuid: value })} options={openRequests.map((row) => ({ value: row.uuid, label: `${row.reference} · ${money(row.amountRequested, row.currency)} ${financingLabel(row.financingType)}` }))} />
          </Field>
          <Field label="Message to the investor">
            <textarea rows={5} className={inputClass} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Why this investor, and what you would like to discuss. Do not include contact details." />
          </Field>
        </div>
      )}
    </Modal>
  );
};

// ---- Supporting document ----------------------------------------------------------
export const RequestDocumentModal = ({ request, onClose, onUploaded }) => {
  const [upload, setUpload] = useState({ file: null, title: "", category: "pitch_deck" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (request) setUpload({ file: null, title: "", category: "pitch_deck" });
  }, [request]);

  const send = async () => {
    if (!upload.file) return toast.error("Choose a file");
    setSaving(true);
    const response = await uploadRequestDocument(request.uuid, upload.file, { title: upload.title, category: upload.category });
    setSaving(false);
    if (response?.status === false) return toast.error(response.message || "Upload failed");
    toast.success("Uploaded for Anza's review");
    onUploaded(response.body);
  };

  return (
    <Modal
      open={!!request}
      title={request ? `Upload a document to ${request.reference}` : ""}
      onClose={onClose}
      footer={<><button type="button" className={buttonClass.secondary} onClick={onClose}>Cancel</button><button type="button" className={buttonClass.primary} disabled={saving} onClick={send}>{saving ? "Uploading…" : "Upload"}</button></>}
    >
      <div className="space-y-3">
        <Field label="File"><input type="file" className={inputClass} onChange={(e) => setUpload({ ...upload, file: e.target.files?.[0] || null })} /></Field>
        <Field label="Title"><input className={inputClass} value={upload.title} onChange={(e) => setUpload({ ...upload, title: e.target.value })} placeholder="Defaults to the file name" /></Field>
        <Field label="Category"><Select value={upload.category} onChange={(value) => setUpload({ ...upload, category: value })} options={Object.entries(DOCUMENT_CATEGORY_LABELS).map(([value, label]) => ({ value, label }))} /></Field>
        <p className="text-xs text-slate-500">Only you and Anza can see this document. Anza shares documents with an investor only after an approved introduction.</p>
      </div>
    </Modal>
  );
};
