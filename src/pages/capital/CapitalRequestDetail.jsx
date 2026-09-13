"use client";

import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  changeDocumentVisibility,
  getCapitalOptions,
  getCapitalRequest,
  reviewCapitalRequest,
  uploadRequestDocument,
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
import { AuditTrail, NotesPanel, openDocument } from "@/components/capital/CapitalRecord";
import useCapitalAccess from "@/components/capital/useCapitalAccess";
import {
  DOCUMENT_CATEGORY_LABELS,
  READINESS_LABELS,
  REQUEST_STATUS_LABELS,
  VISIBILITY_LABELS,
  dateTime,
  documentCategoryLabel,
  fileSize,
  financingLabel,
  human,
  introductionTypeLabel,
  money,
  providerTypeLabel,
  readinessLabel,
  requestStatusLabel,
  shortDate,
  stageLabel,
  visibilityLabel,
} from "@/utils/capital_labels";

const ALL = Object.keys(REQUEST_STATUS_LABELS);

// The review actions, mirroring the API's rules so a manager is only offered
// what the request's status allows. The API enforces them regardless.
const REVIEW = [
  { action: "start_review", label: "Start review", tone: "secondary", from: ["submitted", "more_information_required"], readiness: true },
  { action: "approve_for_matching", label: "Approve for matching", tone: "success", from: ["submitted", "under_review", "more_information_required", "on_hold"], readiness: true, help: "The request moves to Capital Matching, and the enterprise is told it has been approved." },
  { action: "request_information", label: "Request more information", tone: "secondary", from: ["submitted", "under_review", "approved_for_matching"], needs: "note", noteLabel: "What the enterprise needs to provide (they will see this)" },
  { action: "recommend", label: "Recommend improvements", tone: "secondary", from: ALL.filter((s) => s !== "draft"), needs: "recommendations" },
  { action: "assign", label: "Assign manager", tone: "secondary", from: ALL, needs: "manager" },
  { action: "hold", label: "Put on hold", tone: "secondary", from: ALL.filter((s) => !["draft", "declined", "closed", "on_hold", "disbursed"].includes(s)), needs: "note", noteLabel: "Reason", internalOption: true },
  { action: "reopen", label: "Reopen", tone: "secondary", from: ["on_hold", "declined"] },
  { action: "decline", label: "Decline", tone: "danger", from: ["submitted", "under_review", "more_information_required", "approved_for_matching", "on_hold"], needs: "note", noteLabel: "Reason for declining (the enterprise will see this)" },
  { action: "close", label: "Close request", tone: "danger", from: ALL.filter((s) => s !== "closed"), needs: "note", noteLabel: "Reason for closing", internalOption: true },
];

// A document on a request belongs to no opportunity, so it cannot yet be shown
// to a capital provider.
const REQUEST_VISIBILITIES = ["internal", "enterprise", "restricted"];

const Notice = ({ tone = "amber", title, children }) => (
  <div className={`mb-4 rounded-xl border px-4 py-3 text-sm ${tone === "rose" ? "border-rose-200 bg-rose-50 text-rose-800" : tone === "blue" ? "border-blue-200 bg-blue-50 text-blue-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
    <p className="font-semibold">{title}</p>
    <p className="mt-0.5 whitespace-pre-wrap">{children}</p>
  </div>
);

const CapitalRequestDetail = () => {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const { can } = useCapitalAccess();
  const [record, setRecord] = useState(null);
  const [missing, setMissing] = useState(null);
  const [options, setOptions] = useState(null);
  const [tab, setTab] = useState("overview");
  const [pending, setPending] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [upload, setUpload] = useState({ file: null, title: "", category: "pitch_deck", visibility: "internal" });
  const [uploadKey, setUploadKey] = useState(0);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    const response = await getCapitalRequest(uuid);
    if (response?.status === false) setMissing(response.message || "Capital request not found");
    else setRecord(response.body);
  }, [uuid]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    getCapitalOptions().then((response) => response?.status && setOptions(response.body));
  }, []);

  if (missing) return <div className="p-6"><Empty action={<Link to="/dashboard/capital/requests" className={buttonClass.secondary}>All capital requests</Link>}>{missing}</Empty></div>;
  if (!record) return <LoadingBlock label="Loading the capital request…" />;

  const reviewer = can("capital.requests.review");
  const available = reviewer ? REVIEW.filter((item) => item.from.includes(record.status)) : [];
  const matchable = (options?.matchableStatuses || []).includes(record.status);

  const begin = (item) => {
    setForm({ readinessStatus: record.readinessStatus === "not_assessed" && item.action === "approve_for_matching" ? "ready" : record.readinessStatus, managerUuid: record.assignedManager?.uuid || "" });
    setPending(item);
  };

  const submit = async () => {
    const data = { action: pending.action };
    if (pending.needs === "note") {
      if (!String(form.note || "").trim()) return toast.error("Give a reason for this decision");
      data.note = form.note;
    }
    if (pending.needs === "recommendations") {
      if (!String(form.recommendations || "").trim()) return toast.error("Write the recommended improvements");
      data.recommendations = form.recommendations;
    }
    if (pending.needs === "manager") {
      if (!form.managerUuid) return toast.error("Choose a Capital Facilitation Manager");
      data.managerUuid = form.managerUuid;
    }
    if (pending.readiness && form.readinessStatus) data.readinessStatus = form.readinessStatus;
    if (pending.internalOption && form.internal) data.internal = true;

    setSaving(true);
    const response = await reviewCapitalRequest(record.uuid, data);
    setSaving(false);
    if (response?.status === false) return toast.error(response.message || "Failed to update the request");
    toast.success(`${pending.label}: done`);
    setPending(null);
    load();
  };

  const sendUpload = async () => {
    if (!upload.file) return toast.error("Choose a file to upload");
    setUploading(true);
    const response = await uploadRequestDocument(record.uuid, upload.file, { title: upload.title, category: upload.category, visibility: upload.visibility });
    setUploading(false);
    if (response?.status === false) return toast.error(response.message || "Upload failed");
    toast.success("Document uploaded");
    setUpload({ file: null, title: "", category: upload.category, visibility: upload.visibility });
    setUploadKey((key) => key + 1);
    load();
  };

  const changeVisibility = async (document, visibility) => {
    const response = await changeDocumentVisibility(document.uuid, { visibility });
    if (response?.status === false) return toast.error(response.message);
    toast.success(`Now visible to: ${visibilityLabel(visibility)}`);
    load();
  };

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "documents", label: "Documents", count: record.documents.length },
    { key: "opportunities", label: "Opportunities", count: record.opportunityList.length },
    { key: "introductions", label: "Introductions", count: record.introductions.length },
    ...(can("capital.notes.manage") ? [{ key: "notes", label: "Internal notes", count: record.notes.length }] : []),
    ...(can("capital.audit.view") ? [{ key: "audit", label: "Audit trail" }] : []),
  ];

  return (
    <div className="min-h-screen px-4 py-4 md:px-6">
      <CapitalHero
        badge={`Capital Request · ${record.reference}`}
        title={record.business?.name || "Capital request"}
        description={`${money(record.amountRequested, record.currency)} of ${financingLabel(record.financingType).toLowerCase()} · submitted ${shortDate(record.submittedAt)}${record.programme ? ` · ${record.programme.title}` : ""}`}
      >
        {matchable && can("capital.matching.manage") ? (
          <button type="button" className={buttonClass.success} onClick={() => navigate(`/dashboard/capital/matching/${record.uuid}`)}>Manage Matching</button>
        ) : null}
      </CapitalHero>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <StatusChip value={record.status} label={requestStatusLabel(record.status)} />
        <span className="text-sm text-slate-600">Readiness: <strong className="text-slate-800">{readinessLabel(record.readinessStatus)}</strong></span>
        <span className="text-sm text-slate-600">Manager: <strong className="text-slate-800">{record.assignedManager?.name || "Unassigned"}</strong></span>
        {record.legacyRequest ? <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">From an investment request</span> : null}
        {available.length ? (
          <div className="ml-auto flex flex-wrap gap-2">
            {available.map((item) => (
              <button key={item.action} type="button" className={buttonClass[item.tone]} onClick={() => begin(item)}>{item.label}</button>
            ))}
          </div>
        ) : null}
      </div>

      {record.status === "more_information_required" && record.infoRequest ? <Notice title="Waiting for the enterprise">{record.infoRequest}</Notice> : null}
      {record.status === "declined" && record.declineReason ? <Notice tone="rose" title="Declined">{record.declineReason}</Notice> : null}
      {record.recommendations ? <Notice tone="blue" title="Recommended improvements">{record.recommendations}</Notice> : null}

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {tab === "overview" ? (
        <div className="grid gap-4 xl:grid-cols-3">
          <Card title="The request" className="xl:col-span-2">
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Detail label="Amount requested">{money(record.amountRequested, record.currency)}</Detail>
              <Detail label="Indicative USD">{record.currency !== "USD" && record.amountUsd ? money(record.amountUsd, "USD") : null}</Detail>
              <Detail label="Type of financing">{financingLabel(record.financingType)}</Detail>
              <Detail label="Current revenue">{record.currentRevenue !== null && record.currentRevenue !== undefined ? money(record.currentRevenue, record.revenueCurrency || record.currency) : null}</Detail>
              <Detail label="Founder gender">{record.founderGender ? human(record.founderGender) : null}</Detail>
              <Detail label="Youth-led">{record.youthLed === null || record.youthLed === undefined ? null : record.youthLed ? "Yes" : "No"}</Detail>
              <Detail label="Preferred providers">{(record.preferredProviderTypes || []).map(providerTypeLabel).join(", ")}</Detail>
              <Detail label="Programme">{record.programme?.title}</Detail>
              <Detail label="Last reviewed">{record.reviewedAt ? `${shortDate(record.reviewedAt)}${record.reviewer ? ` by ${record.reviewer.name}` : ""}` : null}</Detail>
            </dl>
            <dl className="mt-5 space-y-4 border-t border-slate-100 pt-4">
              <Detail label="What the funding is for"><span className="whitespace-pre-wrap">{record.purpose}</span></Detail>
              <Detail label="Traction"><span className="whitespace-pre-wrap">{record.traction}</span></Detail>
            </dl>
          </Card>

          <Card title="Enterprise">
            <dl className="space-y-3">
              <Detail label="Name">{record.business?.name}</Detail>
              <Detail label="Sector">{record.business?.sector}</Detail>
              <Detail label="Location">{record.business?.location}</Detail>
              <Detail label="Stage">{record.business?.stage}</Detail>
              <Detail label="Email">{record.business?.email}</Detail>
              <Detail label="Phone">{record.business?.phone}</Detail>
            </dl>
            <dl className="mt-4 space-y-3 border-t border-slate-100 pt-4">
              <Detail label="Submitted by">{record.leader?.name}</Detail>
              <Detail label="Contact">{[record.leader?.email, record.leader?.phone].filter(Boolean).join(" · ")}</Detail>
            </dl>
          </Card>
        </div>
      ) : null}

      {tab === "documents" ? (
        <div className="grid gap-4 xl:grid-cols-3">
          <Card title="Documents" padded={false} className="xl:col-span-2">
            <DataTable
              rows={record.documents}
              empty="No documents on this request yet."
              columns={[
                { key: "title", label: "Document", render: (row) => <><span className="block font-medium text-slate-800">{row.title}</span><span className="block text-xs text-slate-500">{documentCategoryLabel(row.category)} · v{row.version} · {fileSize(row.sizeBytes)}</span></> },
                { key: "uploadedBy", label: "Uploaded", render: (row) => <><span className="block text-slate-700">{row.uploadedBy?.name || "—"}</span><span className="block text-xs text-slate-500">{dateTime(row.createdAt)}</span></> },
                {
                  key: "visibility",
                  label: "Who can see it",
                  render: (row) =>
                    can("capital.dealrooms.manage") ? (
                      <Select className="!py-1 text-xs" value={row.visibility} onChange={(value) => changeVisibility(row, value)} options={REQUEST_VISIBILITIES.map((v) => ({ value: v, label: VISIBILITY_LABELS[v].label }))} />
                    ) : (
                      visibilityLabel(row.visibility)
                    ),
                },
                { key: "open", label: "", render: (row) => <div className="flex gap-3 whitespace-nowrap"><button type="button" className={buttonClass.link} onClick={() => openDocument(row)}>View</button><button type="button" className={buttonClass.link} onClick={() => openDocument(row, true)}>Download</button></div> },
              ]}
            />
          </Card>
          <Card title="Upload a document">
            <div className="space-y-3">
              <Field label="File"><input key={uploadKey} type="file" className={inputClass} onChange={(e) => setUpload({ ...upload, file: e.target.files?.[0] || null })} /></Field>
              <Field label="Title"><input className={inputClass} value={upload.title} onChange={(e) => setUpload({ ...upload, title: e.target.value })} placeholder="Defaults to the file name" /></Field>
              <Field label="Category"><Select value={upload.category} onChange={(value) => setUpload({ ...upload, category: value })} options={Object.entries(DOCUMENT_CATEGORY_LABELS).map(([value, label]) => ({ value, label }))} /></Field>
              <Field label="Who can see it"><Select value={upload.visibility} onChange={(value) => setUpload({ ...upload, visibility: value })} options={REQUEST_VISIBILITIES.map((v) => ({ value: v, label: `${VISIBILITY_LABELS[v].label} - ${VISIBILITY_LABELS[v].note}` }))} /></Field>
              <p className="text-xs text-slate-500">Documents are shared with a capital provider from the opportunity, once an introduction is approved.</p>
              <button type="button" className={`${buttonClass.primary} w-full`} disabled={uploading} onClick={sendUpload}>{uploading ? "Uploading…" : "Upload"}</button>
            </div>
          </Card>
        </div>
      ) : null}

      {tab === "opportunities" ? (
        <Card
          title="Capital opportunities on this request"
          padded={false}
          action={matchable && can("capital.matching.manage") ? <button type="button" className={buttonClass.primary} onClick={() => navigate(`/dashboard/capital/matching/${record.uuid}`)}>Manage Matching</button> : null}
        >
          <DataTable
            rows={record.opportunityList}
            empty={matchable ? "No capital provider has been selected yet. Use Manage Matching to choose one." : "Approve the request for matching to start selecting capital providers."}
            onRowClick={(row) => navigate(`/dashboard/capital/opportunities/${row.uuid}`)}
            columns={[
              { key: "reference", label: "Opportunity", render: (row) => <span className="font-semibold text-[#082d77]">{row.reference}</span> },
              { key: "provider", label: "Capital provider", render: (row) => <><span className="block font-medium text-slate-800">{row.provider?.name}</span><span className="block text-xs text-slate-500">{providerTypeLabel(row.provider?.providerType)}</span></> },
              { key: "match", label: "Match", render: (row) => <MatchScore score={row.matchScore} showLabel={false} /> },
              { key: "stage", label: "Stage", render: (row) => stageLabel(row.stage) },
              { key: "status", label: "Status", render: (row) => <StatusChip value={row.status} label={human(row.status)} /> },
              { key: "potential", label: "Potential", className: "whitespace-nowrap", render: (row) => money(row.potentialAmount, row.currency) },
              { key: "committed", label: "Committed", className: "whitespace-nowrap", render: (row) => (row.amountCommitted ? money(row.amountCommitted, row.currency) : "—") },
            ]}
          />
        </Card>
      ) : null}

      {tab === "introductions" ? (
        <Card title="Introductions" padded={false} action={<Link to="/dashboard/capital/introductions" className={buttonClass.link}>Introduction queue</Link>}>
          <DataTable
            rows={record.introductions}
            empty="No introductions requested on this capital request."
            columns={[
              { key: "provider", label: "Capital provider", render: (row) => row.provider?.name || "—" },
              { key: "initiatedBy", label: "Initiated by", render: (row) => human(row.initiatedBy) },
              { key: "requestType", label: "Request", render: (row) => introductionTypeLabel(row.requestType) },
              { key: "status", label: "Status", render: (row) => <StatusChip value={row.status} label={human(row.status)} /> },
              { key: "createdAt", label: "Requested", render: (row) => dateTime(row.createdAt) },
            ]}
          />
        </Card>
      ) : null}

      {tab === "notes" ? <NotesPanel subjectType="request" subjectUuid={record.uuid} notes={record.notes} onAdded={load} /> : null}
      {tab === "audit" ? <AuditTrail entries={record.auditTrail} /> : null}

      <Modal
        open={!!pending}
        title={pending ? `${pending.label} · ${record.reference}` : ""}
        onClose={() => setPending(null)}
        footer={
          <>
            <button type="button" className={buttonClass.secondary} onClick={() => setPending(null)}>Cancel</button>
            <button type="button" className={pending?.tone === "danger" ? buttonClass.danger : pending?.tone === "success" ? buttonClass.success : buttonClass.primary} disabled={saving} onClick={submit}>
              {saving ? "Saving…" : pending?.label}
            </button>
          </>
        }
      >
        {pending ? (
          <div className="space-y-4">
            {pending.help ? <p className="text-sm text-slate-600">{pending.help}</p> : null}
            {pending.readiness ? (
              <Field label="Capital readiness">
                <Select value={form.readinessStatus} onChange={(value) => setForm({ ...form, readinessStatus: value })} options={Object.entries(READINESS_LABELS).map(([value, label]) => ({ value, label }))} />
              </Field>
            ) : null}
            {pending.needs === "note" ? (
              <Field label={pending.noteLabel}>
                <textarea rows={4} className={inputClass} value={form.note || ""} onChange={(e) => setForm({ ...form, note: e.target.value })} />
              </Field>
            ) : null}
            {pending.needs === "recommendations" ? (
              <Field label="Recommended improvements (the enterprise will see these)">
                <textarea rows={5} className={inputClass} value={form.recommendations || ""} onChange={(e) => setForm({ ...form, recommendations: e.target.value })} placeholder="e.g. Update the financial model with 2026 management accounts; clarify the use of funds." />
              </Field>
            ) : null}
            {pending.needs === "manager" ? (
              <Field label="Capital Facilitation Manager">
                <Select value={form.managerUuid} onChange={(value) => setForm({ ...form, managerUuid: value })} placeholder="Choose a manager" options={options?.managers || []} getValue={(o) => o.uuid} getLabel={(o) => o.name} />
              </Field>
            ) : null}
            {pending.internalOption ? (
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={!!form.internal} onChange={(e) => setForm({ ...form, internal: e.target.checked })} />
                Keep the reason as a confidential internal note
              </label>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default CapitalRequestDetail;
