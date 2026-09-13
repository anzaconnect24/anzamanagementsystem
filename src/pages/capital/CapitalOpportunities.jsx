"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { getCapitalOptions, listOpportunities } from "@/controllers/capital_controller";
import { CapitalHero, Card, DataTable, Field, FilterBar, inputClass, LoadingBlock, MatchScore, Select, StatusChip, buttonClass } from "@/components/capital/CapitalUI";
import { dateTime, financingLabel, human, modeLabel, money, outcomeLabel, providerTypeLabel, shortDate, stageLabel } from "@/utils/capital_labels";

const KEYS = ["stage", "status", "financingType", "programme", "provider", "providerType", "manager", "sector", "region", "dateFrom", "dateTo", "amountMin", "amountMax", "page"];

// Every Capital Opportunity: one enterprise's request matched to one capital provider.
const CapitalOpportunities = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [options, setOptions] = useState(null);
  const [result, setResult] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const latest = useRef(0);

  const filters = Object.fromEntries(KEYS.map((key) => [key, params.get(key) || ""]));
  const set = (key) => (value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setParams(next, { replace: true });
  };

  useEffect(() => {
    getCapitalOptions().then((response) => response?.status && setOptions(response.body));
  }, []);

  const query = params.toString();
  const load = useCallback(async () => {
    const request = ++latest.current;
    setRefreshing(true);
    const response = await listOpportunities(Object.fromEntries(new URLSearchParams(query)));
    if (request !== latest.current) return;
    if (response?.status === false) toast.error(response.message || "Failed to load opportunities");
    else setResult(response.body);
    setRefreshing(false);
  }, [query]);

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [load]);

  if (!result) return <LoadingBlock label="Loading capital opportunities…" />;

  return (
    <div className="min-h-screen px-4 py-4 md:px-6">
      <CapitalHero title="Capital Opportunities" description="Each record is one enterprise's capital request matched to one capital provider, with its own stage, conversations, deal room, due diligence and outcome.">
        <button type="button" className={buttonClass.success} onClick={() => navigate("/dashboard/capital/pipeline")}>Pipeline view</button>
      </CapitalHero>

      <FilterBar onReset={() => setParams(new URLSearchParams(), { replace: true })}>
        <Field label="Stage" className="w-48"><Select value={filters.stage} onChange={set("stage")} placeholder="All" options={(options?.stages || []).map((v) => ({ value: v, label: stageLabel(v) }))} /></Field>
        <Field label="Status" className="w-32"><Select value={filters.status} onChange={set("status")} placeholder="All" options={["active", "won", "lost", "closed"].map((v) => ({ value: v, label: human(v) }))} /></Field>
        <Field label="Capital provider" className="w-44"><Select value={filters.provider} onChange={set("provider")} placeholder="All" options={options?.providers || []} getValue={(o) => o.uuid} getLabel={(o) => o.name} /></Field>
        <Field label="Provider type" className="w-44"><Select value={filters.providerType} onChange={set("providerType")} placeholder="All" options={(options?.providerTypes || []).map((v) => ({ value: v, label: providerTypeLabel(v) }))} /></Field>
        <Field label="Financing type" className="w-44"><Select value={filters.financingType} onChange={set("financingType")} placeholder="All" options={(options?.financingTypes || []).map((v) => ({ value: v, label: financingLabel(v) }))} /></Field>
        <Field label="Programme" className="w-44"><Select value={filters.programme} onChange={set("programme")} placeholder="All" options={options?.programmes || []} getValue={(o) => o.uuid} getLabel={(o) => o.title} /></Field>
        <Field label="Sector" className="w-40"><Select value={filters.sector} onChange={set("sector")} placeholder="All" options={options?.sectors || []} getValue={(o) => o.name} getLabel={(o) => o.name} /></Field>
        <Field label="Region" className="w-36"><input className={inputClass} value={filters.region} onChange={(e) => set("region")(e.target.value)} placeholder="e.g. Dodoma" /></Field>
        <Field label="Manager" className="w-40"><Select value={filters.manager} onChange={set("manager")} placeholder="All" options={options?.managers || []} getValue={(o) => o.uuid} getLabel={(o) => o.name} /></Field>
        <Field label="Created from" className="w-36"><input type="date" className={inputClass} value={filters.dateFrom} onChange={(e) => set("dateFrom")(e.target.value)} /></Field>
        <Field label="to" className="w-36"><input type="date" className={inputClass} value={filters.dateTo} onChange={(e) => set("dateTo")(e.target.value)} /></Field>
      </FilterBar>

      <Card title={`${result.count} capital ${result.count === 1 ? "opportunity" : "opportunities"}`} padded={false} className={`transition-opacity ${refreshing ? "opacity-60" : ""}`}>
        <DataTable
          rows={result.data}
          empty="No capital opportunity matches these filters."
          onRowClick={(row) => navigate(`/dashboard/capital/opportunities/${row.uuid}`)}
          columns={[
            { key: "reference", label: "Reference", render: (row) => <span className="font-semibold text-[#082d77]">{row.reference}</span> },
            { key: "parties", label: "Enterprise / Provider", render: (row) => <><span className="block font-medium text-slate-800">{row.enterprise?.name}</span><span className="block text-xs text-slate-500">{row.provider?.name}</span></> },
            { key: "stage", label: "Stage", render: (row) => <><span className="block text-slate-800">{stageLabel(row.stage)}</span><StatusChip value={row.status} label={row.outcome ? outcomeLabel(row.outcome) : human(row.status)} /></> },
            { key: "amount", label: "Potential / committed", className: "whitespace-nowrap", render: (row) => <><span className="block">{money(row.potentialAmount, row.currency)}</span>{row.amountCommitted ? <span className="block text-xs text-emerald-700">{money(row.amountCommitted, row.currency)} committed</span> : null}</> },
            { key: "match", label: "Match", render: (row) => <MatchScore score={row.matchScore} showLabel={false} /> },
            { key: "probability", label: "Prob.", render: (row) => `${row.probability ?? 0}%` },
            { key: "communication", label: "Communication", render: (row) => `${modeLabel(row.communicationMode)}${row.communicationPaused ? " (paused)" : ""}` },
            { key: "next", label: "Next action", render: (row) => (row.nextAction ? <><span className="block text-slate-700">{row.nextAction}</span><span className="block text-xs text-slate-500">{shortDate(row.nextActionDate)}</span></> : "—") },
            { key: "activity", label: "Last activity", className: "whitespace-nowrap", render: (row) => dateTime(row.lastActivityAt) },
            { key: "manager", label: "Manager", render: (row) => row.assignedManager?.name || "—" },
          ]}
        />
        {result.totalPages > 1 ? (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-sm">
            <span className="text-slate-500">Page {result.page} of {result.totalPages}</span>
            <div className="flex gap-2">
              <button type="button" className={buttonClass.secondary} disabled={result.page <= 1} onClick={() => set("page")(String(result.page - 1))}>Previous</button>
              <button type="button" className={buttonClass.secondary} disabled={result.page >= result.totalPages} onClick={() => set("page")(String(result.page + 1))}>Next</button>
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
};

export default CapitalOpportunities;
