"use client";

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { getCapitalEnterprises, getCapitalOptions } from "@/controllers/capital_controller";
import { CapitalHero, Card, DataTable, Field, FilterBar, inputClass, LoadingBlock, Select, StatusChip } from "@/components/capital/CapitalUI";
import { compactUsd, financingLabel, requestStatusLabel } from "@/utils/capital_labels";

const EMPTY = { programme: "", sector: "", region: "", financingType: "", manager: "", q: "" };

// Enterprises seeking capital through Anza, one row each, however many
// requests they have made.
const CapitalEnterprises = () => {
  const navigate = useNavigate();
  const [options, setOptions] = useState(null);
  const [filters, setFilters] = useState(EMPTY);
  const [rows, setRows] = useState(null);
  const latest = useRef(0);

  useEffect(() => {
    getCapitalOptions().then((response) => response?.status && setOptions(response.body));
  }, []);

  useEffect(() => {
    const request = ++latest.current;
    const params = Object.fromEntries(Object.entries(filters).filter(([key, value]) => value && key !== "q"));
    const timer = setTimeout(() => {
      getCapitalEnterprises(params).then((response) => {
        if (request !== latest.current) return;
        if (response?.status === false) toast.error(response.message || "Failed to load enterprises");
        else setRows(response.body.data);
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [filters]);

  if (!rows) return <LoadingBlock label="Loading enterprises…" />;

  const set = (key) => (value) => setFilters((prev) => ({ ...prev, [key]: value }));
  const q = filters.q.trim().toLowerCase();
  const visible = q ? rows.filter((row) => row.enterprise.name.toLowerCase().includes(q)) : rows;

  return (
    <div className="min-h-screen px-4 py-4 md:px-6">
      <CapitalHero title="Enterprises" description="Every enterprise that has asked Anza for capital, with what it asked for and how far it has got. Amounts are in USD at indicative rates." />

      <FilterBar onReset={() => setFilters(EMPTY)}>
        <Field label="Search" className="w-48"><input className={inputClass} value={filters.q} onChange={(e) => set("q")(e.target.value)} placeholder="Enterprise name" /></Field>
        <Field label="Programme" className="w-44"><Select value={filters.programme} onChange={set("programme")} placeholder="All" options={options?.programmes || []} getValue={(o) => o.uuid} getLabel={(o) => o.title} /></Field>
        <Field label="Sector" className="w-40"><Select value={filters.sector} onChange={set("sector")} placeholder="All" options={options?.sectors || []} getValue={(o) => o.name} getLabel={(o) => o.name} /></Field>
        <Field label="Region" className="w-36"><input className={inputClass} value={filters.region} onChange={(e) => set("region")(e.target.value)} placeholder="e.g. Arusha" /></Field>
        <Field label="Financing type" className="w-44"><Select value={filters.financingType} onChange={set("financingType")} placeholder="All" options={(options?.financingTypes || []).map((v) => ({ value: v, label: financingLabel(v) }))} /></Field>
        <Field label="Manager" className="w-40"><Select value={filters.manager} onChange={set("manager")} placeholder="All" options={options?.managers || []} getValue={(o) => o.uuid} getLabel={(o) => o.name} /></Field>
      </FilterBar>

      <Card title={`${visible.length} ${visible.length === 1 ? "enterprise" : "enterprises"}`} padded={false}>
        <DataTable
          rows={visible}
          rowKey={(row) => row.enterprise.uuid}
          empty="No enterprise matches these filters."
          onRowClick={(row) => navigate(`/dashboard/capital/requests/${row.latestRequest}`)}
          columns={[
            { key: "name", label: "Enterprise", render: (row) => <><span className="block font-semibold text-slate-800">{row.enterprise.name}</span><span className="block text-xs text-slate-500">{[row.enterprise.sector, row.enterprise.location].filter(Boolean).join(" · ")}</span></> },
            { key: "programme", label: "Programme", render: (row) => row.programme || "—" },
            { key: "requests", label: "Requests", render: (row) => <><span className="block text-slate-800">{row.requests}</span><span className="block text-xs text-slate-500">{compactUsd(row.requestedUsd)} requested</span></> },
            { key: "status", label: "Latest request", render: (row) => <StatusChip value={row.latestStatus} label={requestStatusLabel(row.latestStatus)} /> },
            { key: "active", label: "Active opportunities", render: (row) => row.activeOpportunities },
            { key: "committed", label: "Committed", className: "whitespace-nowrap", render: (row) => (row.committedUsd ? compactUsd(row.committedUsd) : "—") },
            { key: "financed", label: "Financed", render: (row) => (row.financed ? <StatusChip value="won" label={`${row.financed} secured`} /> : "—") },
          ]}
        />
      </Card>
    </div>
  );
};

export default CapitalEnterprises;
