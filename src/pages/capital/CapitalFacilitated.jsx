"use client";

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { getCapitalFacilitated, getCapitalOptions } from "@/controllers/capital_controller";
import { CapitalHero, Card, DataTable, Field, FilterBar, inputClass, LoadingBlock, Select, StatTile, StatusChip, buttonClass } from "@/components/capital/CapitalUI";
import { compactUsd, contributionLabel, financingLabel, money, outcomeLabel, providerTypeLabel, shortDate } from "@/utils/capital_labels";
import { downloadCsv } from "@/utils/capital_csv";

const EMPTY = { programme: "", provider: "", sector: "", financingType: "", manager: "", dateFrom: "", dateTo: "" };

// Capital Facilitated: every financing secured with Anza's help, the evidence
// behind it, and how Anza contributed.
const CapitalFacilitated = () => {
  const navigate = useNavigate();
  const [options, setOptions] = useState(null);
  const [filters, setFilters] = useState(EMPTY);
  const [result, setResult] = useState(null);
  const latest = useRef(0);

  useEffect(() => {
    getCapitalOptions().then((response) => response?.status && setOptions(response.body));
  }, []);

  useEffect(() => {
    const request = ++latest.current;
    const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value));
    getCapitalFacilitated(params).then((response) => {
      if (request !== latest.current) return;
      if (response?.status === false) toast.error(response.message || "Failed to load capital facilitated");
      else setResult(response.body);
    });
  }, [filters]);

  if (!result) return <LoadingBlock label="Loading capital facilitated…" />;

  const set = (key) => (value) => setFilters((prev) => ({ ...prev, [key]: value }));
  const t = result.totals;

  const exportCsv = () =>
    downloadCsv(
      "capital-facilitated.csv",
      ["Reference", "Enterprise", "Sector", "Location", "Capital provider", "Provider type", "Programme", "Outcome", "Financing type", "Currency", "Amount requested", "Amount approved", "Amount committed", "Date committed", "Amount disbursed", "Date disbursed", "Committed (USD, indicative)", "Disbursed (USD, indicative)", "Capital source", "Financing terms", "Anza contribution", "Evidence documents", "Manager"],
      result.data.map((row) => [row.reference, row.enterprise?.name, row.enterprise?.sector, row.enterprise?.location, row.provider?.name, providerTypeLabel(row.provider?.providerType), row.programme, outcomeLabel(row.outcome), financingLabel(row.financingType), row.currency, row.amountRequested, row.amountApproved, row.amountCommitted, row.dateCommitted, row.amountDisbursed, row.dateDisbursed, row.committedUsd, row.disbursedUsd, row.capitalSource, row.financingTerms, (row.anzaContribution || []).map(contributionLabel).join("; "), row.evidenceDocuments, row.assignedManager?.name]),
    );

  return (
    <div className="min-h-screen px-4 py-4 md:px-6">
      <CapitalHero title="Capital Facilitated" description="Financing secured with Anza's facilitation: what was committed and disbursed, the evidence on file, and how Anza contributed.">
        <button type="button" className={buttonClass.secondary} disabled={!result.data.length} onClick={exportCsv}>Export CSV</button>
      </CapitalHero>

      <div className="mb-2 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Financings secured" value={t.count} />
        <StatTile label="Capital committed" value={compactUsd(t.committedUsd)} tone="text-emerald-700" />
        <StatTile label="Capital disbursed" value={compactUsd(t.disbursedUsd)} tone="text-emerald-700" />
        <StatTile label="Without evidence on file" value={t.withoutEvidence} tone={t.withoutEvidence ? "text-amber-700" : undefined} note="Upload agreements or disbursement evidence" />
      </div>
      <p className="mb-4 text-[11px] text-slate-400">USD totals use indicative exchange rates. Each financing is shown in its own currency below.</p>

      <FilterBar onReset={() => setFilters(EMPTY)}>
        <Field label="Programme" className="w-44"><Select value={filters.programme} onChange={set("programme")} placeholder="All" options={options?.programmes || []} getValue={(o) => o.uuid} getLabel={(o) => o.title} /></Field>
        <Field label="Capital provider" className="w-44"><Select value={filters.provider} onChange={set("provider")} placeholder="All" options={options?.providers || []} getValue={(o) => o.uuid} getLabel={(o) => o.name} /></Field>
        <Field label="Sector" className="w-40"><Select value={filters.sector} onChange={set("sector")} placeholder="All" options={options?.sectors || []} getValue={(o) => o.name} getLabel={(o) => o.name} /></Field>
        <Field label="Financing type" className="w-44"><Select value={filters.financingType} onChange={set("financingType")} placeholder="All" options={(options?.financingTypes || []).map((v) => ({ value: v, label: financingLabel(v) }))} /></Field>
        <Field label="Manager" className="w-40"><Select value={filters.manager} onChange={set("manager")} placeholder="All" options={options?.managers || []} getValue={(o) => o.uuid} getLabel={(o) => o.name} /></Field>
        <Field label="Opened from" className="w-36"><input type="date" className={inputClass} value={filters.dateFrom} onChange={(e) => set("dateFrom")(e.target.value)} /></Field>
        <Field label="to" className="w-36"><input type="date" className={inputClass} value={filters.dateTo} onChange={(e) => set("dateTo")(e.target.value)} /></Field>
      </FilterBar>

      <Card title={`${result.data.length} financings`} padded={false}>
        <DataTable
          rows={result.data}
          empty="No financing has been secured yet for these filters."
          onRowClick={(row) => navigate(`/dashboard/capital/opportunities/${row.uuid}?tab=outcome`)}
          columns={[
            { key: "reference", label: "Opportunity", render: (row) => <><span className="block text-xs font-semibold text-[#082d77]">{row.reference}</span><span className="block font-medium text-slate-800">{row.enterprise?.name}</span><span className="block text-xs text-slate-500">{row.provider?.name}</span></> },
            { key: "outcome", label: "Outcome", render: (row) => <><StatusChip value="won" label={outcomeLabel(row.outcome)} /><span className="mt-1 block text-xs text-slate-500">{financingLabel(row.financingType)}</span></> },
            { key: "committed", label: "Committed", className: "whitespace-nowrap", render: (row) => <><span className="block font-semibold text-slate-900">{money(row.amountCommitted, row.currency)}</span><span className="block text-xs text-slate-500">{shortDate(row.dateCommitted)}</span></> },
            { key: "disbursed", label: "Disbursed", className: "whitespace-nowrap", render: (row) => (row.amountDisbursed ? <><span className="block text-slate-800">{money(row.amountDisbursed, row.currency)}</span><span className="block text-xs text-slate-500">{shortDate(row.dateDisbursed)}</span></> : "—") },
            { key: "requested", label: "Requested", className: "whitespace-nowrap", render: (row) => money(row.amountRequested, row.currency) },
            { key: "programme", label: "Programme", render: (row) => row.programme || "—" },
            { key: "contribution", label: "Anza's contribution", render: (row) => <span className="text-xs text-slate-600">{(row.anzaContribution || []).map(contributionLabel).join(", ") || "—"}</span> },
            { key: "evidence", label: "Evidence", render: (row) => (row.evidenceDocuments ? <StatusChip value="verified" label={`${row.evidenceDocuments} on file`} /> : <StatusChip value="on_hold" label="Missing" />) },
            { key: "manager", label: "Manager", render: (row) => row.assignedManager?.name || "—" },
          ]}
        />
      </Card>
    </div>
  );
};

export default CapitalFacilitated;
