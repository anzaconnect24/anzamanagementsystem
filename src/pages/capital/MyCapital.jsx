"use client";

import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  createMyCapitalRequest,
  getMyCapitalOpportunities,
  getMyCapitalRequests,
  getMyIntroductions,
  getProviderDirectory,
  requestCapitalIntroduction,
  respondToInformationRequest,
  updateMyCapitalRequest,
  uploadRequestDocument,
} from "@/controllers/capital_controller";
import { CapitalHero, Card, DataTable, Empty, Field, FilterBar, inputClass, LoadingBlock, Modal, Select, StatusChip, Tabs, buttonClass } from "@/components/capital/CapitalUI";
import { DocumentsPanel, DueDiligencePanel, ThreadsPanel } from "@/components/capital/CapitalPanels";
import { openDocument } from "@/components/capital/CapitalRecord";
import {
  DOCUMENT_CATEGORY_LABELS,
  FINANCING_LABELS,
  PROVIDER_TYPE_LABELS,
  dateTime,
  documentCategoryLabel,
  financingLabel,
  human,
  introductionTypeLabel,
  modeLabel,
  money,
  outcomeLabel,
  providerTypeLabel,
  requestStatusLabel,
  shortDate,
  stageLabel,
} from "@/utils/capital_labels";

const CURRENCIES = ["USD", "TZS", "KES", "UGX", "RWF", "ZAR", "EUR", "GBP"];
const EDITABLE = ["draft", "more_information_required"];
const CLOSED = ["draft", "declined", "closed"];

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

const ticket = (row) => {
  if (row.minTicketUsd && row.maxTicketUsd) return `${money(row.minTicketUsd)} – ${money(row.maxTicketUsd)}`;
  if (row.maxTicketUsd) return `Up to ${money(row.maxTicketUsd)}`;
  if (row.minTicketUsd) return `From ${money(row.minTicketUsd)}`;
  return "Not stated";
};

// ---- An opportunity, as the enterprise works on it ---------------------------
const OpportunityWorkspace = ({ opportunity }) => {
  const [tab, setTab] = useState("messages");
  return (
    <Card title={`${opportunity.reference} · ${opportunity.counterpart.name}`} padded={false} className="mt-4">
      <div className="grid gap-4 border-b border-slate-100 px-5 py-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div><p className="text-xs font-semibold uppercase text-slate-500">Stage</p><p className="text-slate-800">{stageLabel(opportunity.stage)}</p></div>
        <div><p className="text-xs font-semibold uppercase text-slate-500">Communication</p><p className="text-slate-800">{modeLabel(opportunity.communicationMode)}{opportunity.communicationPaused ? " (paused by Anza)" : ""}</p></div>
        <div><p className="text-xs font-semibold uppercase text-slate-500">Capital provider contact</p><p className="text-slate-800">{[opportunity.counterpart.contactName, opportunity.counterpart.contactEmail, opportunity.counterpart.contactPhone].filter(Boolean).join(" · ") || "—"}</p></div>
        <div><p className="text-xs font-semibold uppercase text-slate-500">Meeting</p><p className="text-slate-800">{opportunity.meetingAt ? dateTime(opportunity.meetingAt) : "None scheduled"}</p></div>
      </div>
      <div className="p-5">
        <Tabs tabs={[{ key: "messages", label: "Messages" }, { key: "documents", label: opportunity.dealRoom ? "Deal room" : "Documents" }, { key: "duediligence", label: "Due diligence" }]} active={tab} onChange={setTab} />
        {tab === "messages" ? <ThreadsPanel opportunityUuid={opportunity.uuid} /> : null}
        {tab === "documents" ? <DocumentsPanel opportunityUuid={opportunity.uuid} /> : null}
        {tab === "duediligence" ? <DueDiligencePanel opportunityUuid={opportunity.uuid} /> : null}
      </div>
    </Card>
  );
};

// The enterprise's own capital workspace: ask for capital, ask to meet capital
// providers, and work on opportunities once Anza has made the introduction.
const MyCapital = () => {
  const [tab, setTab] = useState("requests");
  const [requests, setRequests] = useState(null);
  const [introductions, setIntroductions] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [providers, setProviders] = useState([]);
  const [providerFilters, setProviderFilters] = useState({ q: "", type: "" });
  const [selected, setSelected] = useState(null);

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blankRequest());
  const [saving, setSaving] = useState(false);

  const [introducing, setIntroducing] = useState(null);
  const [introForm, setIntroForm] = useState({ capitalRequestUuid: "", message: "" });

  const [uploadFor, setUploadFor] = useState(null);
  const [upload, setUpload] = useState({ file: null, title: "", category: "pitch_deck" });

  const load = useCallback(async () => {
    const [mine, intros, opps] = await Promise.all([getMyCapitalRequests(), getMyIntroductions(), getMyCapitalOpportunities()]);
    if (mine?.status === false) toast.error(mine.message || "Failed to load your capital requests");
    else setRequests(mine.body);
    if (intros?.status !== false) setIntroductions(intros.body.data);
    if (opps?.status !== false) setOpportunities(opps.body.data);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (tab !== "providers") return undefined;
    const timer = setTimeout(() => {
      const params = Object.fromEntries(Object.entries(providerFilters).filter(([, value]) => value));
      getProviderDirectory(params).then((response) => response?.status !== false && setProviders(response.body.data));
    }, 300);
    return () => clearTimeout(timer);
  }, [tab, providerFilters]);

  if (!requests) return <LoadingBlock label="Loading your capital workspace…" />;

  if (!requests.business) {
    return (
      <div className="min-h-screen px-4 py-4 md:px-6">
        <CapitalHero badge="Capital" title="Raise capital through Anza" description="Tell Anza how much capital you need and what it is for. A Capital Facilitation Manager reviews it and introduces you to suitable capital providers." />
        <Empty action={<Link to="/dashboard/entreprenuer-profile" className={buttonClass.primary}>Complete your business profile</Link>}>Register your business profile before asking for capital.</Empty>
      </div>
    );
  }

  const openRequests = requests.data.filter((row) => !CLOSED.includes(row.status));
  const awaitingPermission = introductions.filter((row) => row.awaitingMyPermission);

  const setField = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));
  const toggleType = (type) => setField("preferredProviderTypes")(form.preferredProviderTypes.includes(type) ? form.preferredProviderTypes.filter((item) => item !== type) : [...form.preferredProviderTypes, type]);

  const startRequest = (row) => {
    setForm(row ? fromRequest(row) : blankRequest());
    setEditing(row || "new");
  };

  const saveRequest = async (submit) => {
    if (!(Number(form.amountRequested) > 0)) return toast.error("Say how much capital you need");
    if (submit && !form.purpose.trim()) return toast.error("Describe what the funding is for");
    const data = { ...form, youthLed: form.youthLed === "" ? null : form.youthLed === "true", submit };
    setSaving(true);
    const response = editing === "new" ? await createMyCapitalRequest(data) : await updateMyCapitalRequest(editing.uuid, data);
    setSaving(false);
    if (response?.status === false) return toast.error(response.message || "Failed to save the request");
    toast.success(submit ? `Submitted ${response.body.reference}. Anza will review it.` : "Draft saved");
    setEditing(null);
    load();
  };

  const sendIntroduction = async () => {
    if (!introForm.capitalRequestUuid) return toast.error("Choose the capital request this introduction is for");
    if (!introForm.message.trim()) return toast.error("Write a message for the capital provider");
    setSaving(true);
    const response = await requestCapitalIntroduction({ providerUuid: introducing.uuid, ...introForm });
    setSaving(false);
    if (response?.status === false) return toast.error(response.message || "Failed to request the introduction");
    toast.success("Sent to Anza. A Capital Facilitation Manager reviews every introduction before it is made.");
    setIntroducing(null);
    load();
  };

  const decide = async (row, decision) => {
    const response = await respondToInformationRequest(row.uuid, { decision });
    if (response?.status === false) return toast.error(response.message || "Failed to record your decision");
    toast.success(decision === "granted" ? "Permission given. Anza will share it through the opportunity." : "Permission refused. Nothing will be shared.");
    load();
  };

  const sendUpload = async () => {
    if (!upload.file) return toast.error("Choose a file");
    setSaving(true);
    const response = await uploadRequestDocument(uploadFor.uuid, upload.file, { title: upload.title, category: upload.category });
    setSaving(false);
    if (response?.status === false) return toast.error(response.message || "Upload failed");
    toast.success("Uploaded for Anza's review");
    setUploadFor(null);
    load();
  };

  return (
    <div className="min-h-screen px-4 py-4 md:px-6">
      <CapitalHero
        badge="Capital"
        title={`${requests.business.name}: raising capital`}
        description="Ask Anza for capital, request introductions to capital providers, and work with them once Anza has made the introduction. Your contact details are shared with a provider only after Anza approves an introduction."
      >
        <button type="button" className={buttonClass.success} onClick={() => startRequest(null)}>New capital request</button>
      </CapitalHero>

      {awaitingPermission.length ? (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>{awaitingPermission.length}</strong> capital {awaitingPermission.length === 1 ? "provider has" : "providers have"} asked for your information. <button type="button" className="font-semibold underline" onClick={() => setTab("introductions")}>Review the {awaitingPermission.length === 1 ? "request" : "requests"}</button>
        </div>
      ) : null}

      <Tabs
        tabs={[
          { key: "requests", label: "My capital requests", count: requests.data.length },
          { key: "providers", label: "Capital providers" },
          { key: "introductions", label: "Introductions", count: introductions.length },
          { key: "opportunities", label: "Opportunities", count: opportunities.length },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "requests" ? (
        requests.data.length ? (
          <div className="space-y-3">
            {requests.data.map((row) => (
              <section key={row.uuid} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-400">{row.reference} · {row.submittedAt ? `submitted ${shortDate(row.submittedAt)}` : "not submitted"}</p>
                    <h3 className="text-base font-bold text-slate-900">{money(row.amountRequested, row.currency)} · {financingLabel(row.financingType)}</h3>
                    <p className="mt-1 max-w-3xl whitespace-pre-wrap text-sm text-slate-600">{row.purpose}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusChip value={row.status} label={requestStatusLabel(row.status)} />
                    {EDITABLE.includes(row.status) ? <button type="button" className={buttonClass.primary} onClick={() => startRequest(row)}>{row.status === "draft" ? "Edit and submit" : "Update and resubmit"}</button> : null}
                    {!CLOSED.includes(row.status) || row.status === "draft" ? <button type="button" className={buttonClass.secondary} onClick={() => { setUpload({ file: null, title: "", category: "pitch_deck" }); setUploadFor(row); }}>Upload document</button> : null}
                  </div>
                </div>
                {row.status === "more_information_required" && row.infoRequest ? <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900"><strong>Anza needs:</strong> {row.infoRequest}</p> : null}
                {row.recommendations ? <p className="mt-3 rounded-xl bg-blue-50 px-3 py-2 text-sm text-blue-900"><strong>Anza recommends:</strong> {row.recommendations}</p> : null}
                {row.status === "declined" && row.declineReason ? <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800"><strong>Not taken forward:</strong> {row.declineReason}</p> : null}
                {row.documents.length ? (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {row.documents.map((doc) => (
                      <li key={doc.uuid}><button type="button" className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700 hover:bg-slate-200" onClick={() => openDocument(doc)}>{doc.title} · {documentCategoryLabel(doc.category)}</button></li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>
        ) : (
          <Empty action={<button type="button" className={buttonClass.success} onClick={() => startRequest(null)}>New capital request</button>}>You have not asked Anza for capital yet.</Empty>
        )
      ) : null}

      {tab === "providers" ? (
        <>
          <FilterBar onReset={() => setProviderFilters({ q: "", type: "" })}>
            <Field label="Search" className="w-52"><input className={inputClass} value={providerFilters.q} onChange={(e) => setProviderFilters({ ...providerFilters, q: e.target.value })} placeholder="Provider name" /></Field>
            <Field label="Type" className="w-56"><Select value={providerFilters.type} onChange={(value) => setProviderFilters({ ...providerFilters, type: value })} placeholder="All types" options={Object.entries(PROVIDER_TYPE_LABELS).map(([value, label]) => ({ value, label }))} /></Field>
          </FilterBar>
          <Card title="Capital providers" padded={false}>
            <DataTable
              rows={providers}
              empty="No capital providers match."
              columns={[
                { key: "name", label: "Provider", render: (row) => <><span className="block font-semibold text-slate-800">{row.name}</span><span className="block text-xs text-slate-500">{providerTypeLabel(row.providerType)}</span></> },
                { key: "focus", label: "Focus", render: (row) => <><span className="block text-slate-700">{(row.preferredSectors || []).join(", ") || "Any sector"}</span><span className="block text-xs text-slate-500">{(row.preferredGeographies || []).join(", ") || "Any geography"}</span></> },
                { key: "ticket", label: "Ticket size (USD)", className: "whitespace-nowrap", render: ticket },
                { key: "instruments", label: "Instruments", render: (row) => (row.instruments || []).map(financingLabel).join(", ") || "—" },
                {
                  key: "action",
                  label: "",
                  render: (row) => (
                    <button type="button" className={buttonClass.primary} disabled={!openRequests.length} title={openRequests.length ? undefined : "Submit a capital request first"} onClick={() => { setIntroForm({ capitalRequestUuid: openRequests[0]?.uuid || "", message: "" }); setIntroducing(row); }}>
                      Request introduction
                    </button>
                  ),
                },
              ]}
            />
          </Card>
          {!openRequests.length ? <p className="mt-2 text-xs text-slate-500">Submit a capital request before asking for introductions.</p> : null}
        </>
      ) : null}

      {tab === "introductions" ? (
        <Card title="Introductions" padded={false}>
          <DataTable
            rows={introductions}
            empty="No introductions yet."
            columns={[
              { key: "provider", label: "Capital provider", render: (row) => <><span className="block font-semibold text-slate-800">{row.provider?.name}</span>{row.provider?.contactEmail ? <span className="block text-xs text-slate-500">{[row.provider.contactName, row.provider.contactEmail, row.provider.contactPhone].filter(Boolean).join(" · ")}</span> : null}</> },
              { key: "type", label: "Request", render: (row) => `${row.initiatedBy === "provider" ? "Provider asks for: " : row.initiatedBy === "manager" ? "Anza introduction: " : ""}${introductionTypeLabel(row.requestType)}` },
              { key: "status", label: "Status", render: (row) => <StatusChip value={row.status} label={human(row.status)} /> },
              { key: "note", label: "Anza's note", render: (row) => row.reviewNote || "—" },
              { key: "when", label: "Date", render: (row) => `${shortDate(row.createdAt)}${row.scheduledAt ? ` · meeting ${dateTime(row.scheduledAt)}` : ""}` },
              {
                key: "action",
                label: "",
                render: (row) =>
                  row.awaitingMyPermission ? (
                    <div className="flex gap-2">
                      <button type="button" className={buttonClass.success} onClick={() => decide(row, "granted")}>Allow</button>
                      <button type="button" className={buttonClass.danger} onClick={() => decide(row, "denied")}>Refuse</button>
                    </div>
                  ) : row.opportunity ? (
                    <button type="button" className={buttonClass.link} onClick={() => { setTab("opportunities"); setSelected(row.opportunity.uuid); }}>Open {row.opportunity.reference}</button>
                  ) : null,
              },
            ]}
          />
        </Card>
      ) : null}

      {tab === "opportunities" ? (
        <>
          <Card title="Capital opportunities" padded={false}>
            <DataTable
              rows={opportunities}
              empty="No opportunities yet. They appear here once Anza approves an introduction to a capital provider."
              onRowClick={(row) => setSelected(row.uuid)}
              columns={[
                { key: "reference", label: "Reference", render: (row) => <span className={`font-semibold ${selected === row.uuid ? "text-[#16a34a]" : "text-[#082d77]"}`}>{row.reference}</span> },
                { key: "provider", label: "Capital provider", render: (row) => row.counterpart.name },
                { key: "stage", label: "Stage", render: (row) => stageLabel(row.stage) },
                { key: "status", label: "Status", render: (row) => <StatusChip value={row.status} label={row.outcome ? outcomeLabel(row.outcome) : human(row.status)} /> },
                { key: "amount", label: "Amount", className: "whitespace-nowrap", render: (row) => (row.amountCommitted ? `${money(row.amountCommitted, row.currency)} committed` : money(row.potentialAmount, row.currency)) },
                { key: "activity", label: "Last activity", render: (row) => dateTime(row.lastActivityAt) },
              ]}
            />
          </Card>
          {opportunities.find((row) => row.uuid === selected) ? <OpportunityWorkspace key={selected} opportunity={opportunities.find((row) => row.uuid === selected)} /> : null}
        </>
      ) : null}

      <Modal
        open={!!editing}
        wide
        title={editing === "new" ? "New capital request" : editing ? `Capital request ${editing.reference}` : ""}
        onClose={() => setEditing(null)}
        footer={
          <>
            <button type="button" className={buttonClass.secondary} onClick={() => setEditing(null)}>Cancel</button>
            {editing === "new" || editing?.status === "draft" ? <button type="button" className={buttonClass.secondary} disabled={saving} onClick={() => saveRequest(false)}>Save draft</button> : null}
            <button type="button" className={buttonClass.success} disabled={saving} onClick={() => saveRequest(true)}>{saving ? "Saving…" : "Submit to Anza"}</button>
          </>
        }
      >
        <div className="space-y-4">
          {editing?.infoRequest && editing.status === "more_information_required" ? <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900"><strong>Anza needs:</strong> {editing.infoRequest}</p> : null}
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Amount needed"><input className={inputClass} inputMode="numeric" value={form.amountRequested} onChange={(e) => setField("amountRequested")(e.target.value)} /></Field>
            <Field label="Currency"><Select value={form.currency} onChange={setField("currency")} options={CURRENCIES.map((c) => ({ value: c, label: c }))} /></Field>
            <Field label="Type of financing"><Select value={form.financingType} onChange={setField("financingType")} options={Object.entries(FINANCING_LABELS).map(([value, label]) => ({ value, label }))} /></Field>
          </div>
          <Field label="What is the funding for?"><textarea rows={4} className={inputClass} value={form.purpose} onChange={(e) => setField("purpose")(e.target.value)} placeholder="Use of funds, what it will achieve, and over what period" /></Field>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Preferred kinds of capital provider (optional)</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {Object.entries(PROVIDER_TYPE_LABELS).map(([value, label]) => (
                <label key={value} className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={form.preferredProviderTypes.includes(value)} onChange={() => toggleType(value)} />{label}</label>
              ))}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <Field label="Annual revenue"><input className={inputClass} inputMode="numeric" value={form.currentRevenue} onChange={(e) => setField("currentRevenue")(e.target.value)} /></Field>
            <Field label="Revenue currency"><Select value={form.revenueCurrency} onChange={setField("revenueCurrency")} options={CURRENCIES.map((c) => ({ value: c, label: c }))} /></Field>
            <Field label="Founder gender"><Select value={form.founderGender} onChange={setField("founderGender")} placeholder="Prefer not to say" options={[{ value: "female", label: "Female" }, { value: "male", label: "Male" }, { value: "mixed", label: "Mixed founding team" }]} /></Field>
            <Field label="Youth-led (under 35)"><Select value={form.youthLed} onChange={setField("youthLed")} placeholder="Not stated" options={[{ value: "true", label: "Yes" }, { value: "false", label: "No" }]} /></Field>
          </div>
          <Field label="Traction"><textarea rows={3} className={inputClass} value={form.traction} onChange={(e) => setField("traction")(e.target.value)} placeholder="Customers, growth, partnerships, milestones" /></Field>
        </div>
      </Modal>

      <Modal
        open={!!introducing}
        title={introducing ? `Request an introduction to ${introducing.name}` : ""}
        onClose={() => setIntroducing(null)}
        footer={<><button type="button" className={buttonClass.secondary} onClick={() => setIntroducing(null)}>Cancel</button><button type="button" className={buttonClass.primary} disabled={saving} onClick={sendIntroduction}>{saving ? "Sending…" : "Send to Anza"}</button></>}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Anza reviews your request and may edit your message, suggest a better-suited provider, or ask for more information before making the introduction.</p>
          <Field label="For capital request"><Select value={introForm.capitalRequestUuid} onChange={(value) => setIntroForm({ ...introForm, capitalRequestUuid: value })} options={openRequests.map((row) => ({ value: row.uuid, label: `${row.reference} · ${money(row.amountRequested, row.currency)} ${financingLabel(row.financingType)}` }))} /></Field>
          <Field label="Message to the capital provider"><textarea rows={5} className={inputClass} value={introForm.message} onChange={(e) => setIntroForm({ ...introForm, message: e.target.value })} placeholder="Why this provider, and what you would like to discuss. Do not include contact details." /></Field>
        </div>
      </Modal>

      <Modal
        open={!!uploadFor}
        title={uploadFor ? `Upload a document to ${uploadFor.reference}` : ""}
        onClose={() => setUploadFor(null)}
        footer={<><button type="button" className={buttonClass.secondary} onClick={() => setUploadFor(null)}>Cancel</button><button type="button" className={buttonClass.primary} disabled={saving} onClick={sendUpload}>{saving ? "Uploading…" : "Upload"}</button></>}
      >
        <div className="space-y-3">
          <Field label="File"><input type="file" className={inputClass} onChange={(e) => setUpload({ ...upload, file: e.target.files?.[0] || null })} /></Field>
          <Field label="Title"><input className={inputClass} value={upload.title} onChange={(e) => setUpload({ ...upload, title: e.target.value })} placeholder="Defaults to the file name" /></Field>
          <Field label="Category"><Select value={upload.category} onChange={(value) => setUpload({ ...upload, category: value })} options={Object.entries(DOCUMENT_CATEGORY_LABELS).map(([value, label]) => ({ value, label }))} /></Field>
          <p className="text-xs text-slate-500">Only you and Anza can see this document. Anza shares documents with a capital provider only after an approved introduction.</p>
        </div>
      </Modal>
    </div>
  );
};

export default MyCapital;
