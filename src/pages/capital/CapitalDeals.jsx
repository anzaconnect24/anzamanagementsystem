"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { expressCapitalInterest, getEnterpriseDirectory, getProviderIntroductions, getProviderOpportunities } from "@/controllers/capital_controller";
import { CapitalHero, Card, DataTable, Empty, Field, FilterBar, inputClass, LoadingBlock, Modal, Select, StatusChip, Tabs, buttonClass } from "@/components/capital/CapitalUI";
import { DocumentsPanel, DueDiligencePanel, ThreadsPanel } from "@/components/capital/CapitalPanels";
import { INTRODUCTION_TYPE_LABELS, dateTime, financingLabel, human, introductionTypeLabel, modeLabel, money, outcomeLabel, readinessLabel, shortDate, stageLabel } from "@/utils/capital_labels";

// ---- An opportunity, as the capital provider works on it -----------------------
const DealWorkspace = ({ opportunity }) => {
  const [tab, setTab] = useState("messages");
  const enterprise = opportunity.counterpart;
  return (
    <Card title={`${opportunity.reference} · ${enterprise.name}`} padded={false} className="mt-4">
      <div className="grid gap-4 border-b border-slate-100 px-5 py-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div><p className="text-xs font-semibold uppercase text-slate-500">Stage</p><p className="text-slate-800">{stageLabel(opportunity.stage)}</p></div>
        <div><p className="text-xs font-semibold uppercase text-slate-500">Enterprise</p><p className="text-slate-800">{[enterprise.sector, enterprise.location].filter(Boolean).join(" · ") || "—"}</p></div>
        <div><p className="text-xs font-semibold uppercase text-slate-500">Contact</p><p className="text-slate-800">{[enterprise.email, enterprise.phone].filter(Boolean).join(" · ") || "—"}</p></div>
        <div><p className="text-xs font-semibold uppercase text-slate-500">Communication</p><p className="text-slate-800">{modeLabel(opportunity.communicationMode)}{opportunity.communicationPaused ? " (paused by Anza)" : ""}</p></div>
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

// The capital provider's side: enterprises seeking capital (without contact
// details), interest routed through Anza, and deals once introduced.
const CapitalDeals = () => {
  const [tab, setTab] = useState("enterprises");
  const [directory, setDirectory] = useState(null);
  const [introductions, setIntroductions] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [filters, setFilters] = useState({ q: "", financingType: "" });
  const [selected, setSelected] = useState(null);
  const [interest, setInterest] = useState(null);
  const [form, setForm] = useState({ requestType: "introduction", message: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [enterprises, intros, opps] = await Promise.all([getEnterpriseDirectory(), getProviderIntroductions(), getProviderOpportunities()]);
    if (enterprises?.status === false) toast.error(enterprises.message || "Failed to load enterprises");
    else setDirectory(enterprises.body.data);
    if (intros?.status !== false) setIntroductions(intros.body.data);
    if (opps?.status !== false) setOpportunities(opps.body.data);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!directory) return <LoadingBlock label="Loading capital deals…" />;

  const q = filters.q.trim().toLowerCase();
  const visible = directory.filter((row) => (!q || row.enterprise.name.toLowerCase().includes(q) || (row.enterprise.sector || "").toLowerCase().includes(q)) && (!filters.financingType || row.financingType === filters.financingType));

  const send = async () => {
    setSaving(true);
    const response = await expressCapitalInterest({ businessUuid: interest.enterprise.uuid, requestType: form.requestType, message: form.message });
    setSaving(false);
    if (response?.status === false) return toast.error(response.message || "Failed to send your interest");
    toast.success("Sent to Anza. A Capital Facilitation Manager reviews it before contacting the enterprise.");
    setInterest(null);
    load();
  };

  return (
    <div className="min-h-screen px-4 py-4 md:px-6">
      <CapitalHero
        badge="Capital Deals"
        title="Enterprises seeking capital"
        description="Browse enterprises Anza has approved for matching, express interest or ask for information, and work on deals once Anza has made the introduction. Enterprise contact details are shared after an approved introduction."
      />

      <Tabs
        tabs={[
          { key: "enterprises", label: "Enterprises seeking capital", count: directory.length },
          { key: "introductions", label: "My requests", count: introductions.length },
          { key: "deals", label: "My deals", count: opportunities.length },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "enterprises" ? (
        <>
          <FilterBar onReset={() => setFilters({ q: "", financingType: "" })}>
            <Field label="Search" className="w-56"><input className={inputClass} value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} placeholder="Name or sector" /></Field>
            <Field label="Financing type" className="w-48"><Select value={filters.financingType} onChange={(value) => setFilters({ ...filters, financingType: value })} placeholder="All" options={[...new Set(directory.map((row) => row.financingType))].map((value) => ({ value, label: financingLabel(value) }))} /></Field>
          </FilterBar>
          {visible.length ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {visible.map((row) => (
                <section key={row.enterprise.uuid} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-base font-bold text-slate-900">{row.enterprise.name}</h3>
                  <p className="text-xs text-slate-500">{[row.enterprise.sector, row.enterprise.location, row.enterprise.stage].filter(Boolean).join(" · ")}</p>
                  <p className="mt-2 text-sm font-semibold text-slate-800">{money(row.amountRequested, row.currency)} · {financingLabel(row.financingType)}</p>
                  <p className="text-xs text-slate-500">Readiness: {readinessLabel(row.readinessStatus)}</p>
                  <p className="mt-2 line-clamp-3 flex-1 text-sm text-slate-600">{row.purpose}</p>
                  <div className="mt-3 flex justify-end">
                    <button type="button" className={buttonClass.primary} onClick={() => { setForm({ requestType: "introduction", message: "" }); setInterest(row); }}>Express interest</button>
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <Empty>No enterprise is seeking capital right now{q || filters.financingType ? " for these filters" : ""}.</Empty>
          )}
        </>
      ) : null}

      {tab === "introductions" ? (
        <Card title="My requests to Anza" padded={false}>
          <DataTable
            rows={introductions}
            empty="You have not expressed interest in any enterprise yet."
            columns={[
              { key: "enterprise", label: "Enterprise", render: (row) => <><span className="block font-semibold text-slate-800">{row.enterprise?.name}</span>{row.enterprise?.email ? <span className="block text-xs text-slate-500">{[row.enterprise.email, row.enterprise.phone].filter(Boolean).join(" · ")}</span> : null}</> },
              { key: "type", label: "Request", render: (row) => `${row.initiatedBy === "manager" ? "Anza introduction: " : ""}${introductionTypeLabel(row.requestType)}` },
              { key: "status", label: "Status", render: (row) => <StatusChip value={row.status} label={human(row.status)} /> },
              { key: "note", label: "Anza's note", render: (row) => row.reviewNote || "—" },
              { key: "when", label: "Date", render: (row) => `${shortDate(row.createdAt)}${row.scheduledAt ? ` · meeting ${dateTime(row.scheduledAt)}` : ""}` },
              { key: "action", label: "", render: (row) => (row.opportunity ? <button type="button" className={buttonClass.link} onClick={() => { setTab("deals"); setSelected(row.opportunity.uuid); }}>Open {row.opportunity.reference}</button> : null) },
            ]}
          />
        </Card>
      ) : null}

      {tab === "deals" ? (
        <>
          <Card title="My deals" padded={false}>
            <DataTable
              rows={opportunities}
              empty="No deals yet. They appear here once Anza approves an introduction."
              onRowClick={(row) => setSelected(row.uuid)}
              columns={[
                { key: "reference", label: "Reference", render: (row) => <span className={`font-semibold ${selected === row.uuid ? "text-[#16a34a]" : "text-[#082d77]"}`}>{row.reference}</span> },
                { key: "enterprise", label: "Enterprise", render: (row) => row.counterpart.name },
                { key: "stage", label: "Stage", render: (row) => stageLabel(row.stage) },
                { key: "status", label: "Status", render: (row) => <StatusChip value={row.status} label={row.outcome ? outcomeLabel(row.outcome) : human(row.status)} /> },
                { key: "amount", label: "Amount", className: "whitespace-nowrap", render: (row) => (row.amountCommitted ? `${money(row.amountCommitted, row.currency)} committed` : money(row.potentialAmount, row.currency)) },
                { key: "activity", label: "Last activity", render: (row) => dateTime(row.lastActivityAt) },
              ]}
            />
          </Card>
          {opportunities.find((row) => row.uuid === selected) ? <DealWorkspace key={selected} opportunity={opportunities.find((row) => row.uuid === selected)} /> : null}
        </>
      ) : null}

      <Modal
        open={!!interest}
        title={interest ? `Express interest in ${interest.enterprise.name}` : ""}
        onClose={() => setInterest(null)}
        footer={<><button type="button" className={buttonClass.secondary} onClick={() => setInterest(null)}>Cancel</button><button type="button" className={buttonClass.primary} disabled={saving} onClick={send}>{saving ? "Sending…" : "Send to Anza"}</button></>}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Anza reviews every request. Requests for the enterprise's documents or financial information also need the enterprise's permission before anything is shared.</p>
          <Field label="What would you like?"><Select value={form.requestType} onChange={(value) => setForm({ ...form, requestType: value })} options={Object.entries(INTRODUCTION_TYPE_LABELS).map(([value, label]) => ({ value, label: value === "introduction" ? "An introduction" : label }))} /></Field>
          <Field label="Message (optional)"><textarea rows={4} className={inputClass} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="What interests you, and what you would like to know" /></Field>
        </div>
      </Modal>
    </div>
  );
};

export default CapitalDeals;
