"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { getCapitalOptions, getCapitalReports } from "@/controllers/capital_controller";
import { CapitalHero, Card, Field, FilterBar, inputClass, LoadingBlock, Select, StatTile, buttonClass } from "@/components/capital/CapitalUI";
import { compactUsd, contributionLabel, financingLabel, human, providerTypeLabel } from "@/utils/capital_labels";
import { downloadCsv } from "@/utils/capital_csv";

// Every chart here shows one measure, so every bar wears one hue and the panel
// title names what it measures. Values sit in text colours beside the bars.
const BAR = "#2a78d6";
const EMPTY = { programme: "", provider: "", sector: "", region: "", financingType: "", manager: "", dateFrom: "", dateTo: "" };

const percent = (value) => (value === null || value === undefined ? "—" : `${value}%`);
const daysText = (value) => (value === null || value === undefined ? "—" : `${value} days`);

const BarList = ({ rows, max, valueText, title }) => (
  <ul className="space-y-2.5" aria-label={title}>
    {rows.map((row) => (
      <li key={row.key} title={`${row.label}: ${valueText(row)}`}>
        <div className="mb-0.5 flex items-baseline justify-between gap-3 text-xs">
          <span className="truncate font-medium text-slate-700">{row.label}</span>
          <span className="shrink-0 font-bold text-slate-900">{valueText(row)}</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full" style={{ width: `${max ? Math.max((row.value / max) * 100, row.value ? 1 : 0) : 0}%`, backgroundColor: BAR }} />
        </div>
      </li>
    ))}
  </ul>
);

// Breakdown keys arrive as stored values; show them as words.
const groupKeyLabel = (groupBy, key) => {
  if (groupBy === "financingType") return financingLabel(key);
  if (groupBy === "providerType") return providerTypeLabel(key);
  if (groupBy === "gender") return human(key);
  return key;
};

const CapitalReports = () => {
  const [options, setOptions] = useState(null);
  const [filters, setFilters] = useState(EMPTY);
  const [groupBy, setGroupBy] = useState("sector");
  const [report, setReport] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const latest = useRef(0);

  useEffect(() => {
    getCapitalOptions().then((response) => response?.status && setOptions(response.body));
  }, []);

  useEffect(() => {
    const request = ++latest.current;
    setRefreshing(true);
    const params = { ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value)), groupBy };
    const timer = setTimeout(() => {
      getCapitalReports(params).then((response) => {
        if (request !== latest.current) return;
        if (response?.status === false) toast.error(response.message || "Failed to load reports");
        else setReport(response.body);
        setRefreshing(false);
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [filters, groupBy]);

  if (!report) return <LoadingBlock label="Building capital facilitation reports…" />;

  const set = (key) => (value) => setFilters((prev) => ({ ...prev, [key]: value }));
  const t = report.totals;
  const funnelTop = report.funnel[0]?.count || 0;
  const breakdown = report.breakdown;
  const breakdownRows = breakdown ? breakdown.rows.map((row) => ({ ...row, label: groupKeyLabel(breakdown.groupBy, row.key) })) : [];
  const contribution = report.contribution.map((row) => ({ key: row.key, label: contributionLabel(row.key), value: row.opportunities, committedUsd: row.committedUsd }));

  const tiles = [
    ["Capital requests", t.totalCapitalRequests],
    ["Capital requested", compactUsd(t.totalCapitalRequestedUsd)],
    ["Enterprises seeking capital", t.enterprisesSeekingCapital],
    ["Enterprises matched", t.enterprisesMatched],
    ["Capital providers engaged", t.providersEngaged],
    ["Introductions facilitated", t.introductionsFacilitated],
    ["Provider response rate", percent(t.providerResponseRate)],
    ["Entered due diligence", t.enteringDueDiligence],
    ["Received offers", t.receivingOffers],
    ["Received commitments", t.receivingCommitments],
    ["Successfully financed", t.successfullyFinanced],
    ["Capital committed", compactUsd(t.totalCapitalCommittedUsd)],
    ["Capital disbursed", compactUsd(t.totalCapitalDisbursedUsd)],
    ["Capital facilitated", compactUsd(t.totalCapitalFacilitatedUsd)],
    ["Average financing", t.averageFinancingUsd === null ? "—" : compactUsd(t.averageFinancingUsd)],
    ["Request-to-financing conversion", percent(t.conversionRate)],
    ["Avg. days request → commitment", daysText(t.averageDaysRequestToCommitment)],
    ["Avg. days commitment → disbursement", daysText(t.averageDaysCommitmentToDisbursement)],
  ];

  const exportBreakdown = () =>
    downloadCsv(
      `capital-report-by-${breakdown.groupBy}.csv`,
      [breakdown.label, "Capital requests", "Requested (USD)", "Opportunities", "Committed (USD)", "Disbursed (USD)", "Successfully financed"],
      breakdownRows.map((row) => [row.label, row.requests, row.requestedUsd, row.opportunities, row.committedUsd, row.disbursedUsd, row.financed]),
    );

  return (
    <div className="min-h-screen px-4 py-4 md:px-6">
      <CapitalHero title="Capital Facilitation Reports" description="How much capital Anza helped mobilise, how far enterprises get through the process, and where Anza's contribution made the difference." />

      <FilterBar onReset={() => setFilters(EMPTY)}>
        <Field label="Programme" className="w-44"><Select value={filters.programme} onChange={set("programme")} placeholder="All" options={options?.programmes || []} getValue={(o) => o.uuid} getLabel={(o) => o.title} /></Field>
        <Field label="Capital provider" className="w-44"><Select value={filters.provider} onChange={set("provider")} placeholder="All" options={options?.providers || []} getValue={(o) => o.uuid} getLabel={(o) => o.name} /></Field>
        <Field label="Sector" className="w-40"><Select value={filters.sector} onChange={set("sector")} placeholder="All" options={options?.sectors || []} getValue={(o) => o.name} getLabel={(o) => o.name} /></Field>
        <Field label="Region" className="w-36"><input className={inputClass} value={filters.region} onChange={(e) => set("region")(e.target.value)} placeholder="e.g. Mbeya" /></Field>
        <Field label="Financing type" className="w-44"><Select value={filters.financingType} onChange={set("financingType")} placeholder="All" options={(options?.financingTypes || []).map((v) => ({ value: v, label: financingLabel(v) }))} /></Field>
        <Field label="Manager" className="w-40"><Select value={filters.manager} onChange={set("manager")} placeholder="All" options={options?.managers || []} getValue={(o) => o.uuid} getLabel={(o) => o.name} /></Field>
        <Field label="From" className="w-36"><input type="date" className={inputClass} value={filters.dateFrom} onChange={(e) => set("dateFrom")(e.target.value)} /></Field>
        <Field label="To" className="w-36"><input type="date" className={inputClass} value={filters.dateTo} onChange={(e) => set("dateTo")(e.target.value)} /></Field>
      </FilterBar>

      <div className={`transition-opacity ${refreshing ? "opacity-60" : ""}`}>
        <div className="mb-2 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {tiles.map(([label, value]) => <StatTile key={label} label={label} value={value} />)}
        </div>
        <p className="mb-6 text-[11px] text-slate-400">USD figures use indicative exchange rates so amounts in different currencies can be added up.</p>

        <div className="mb-6 grid gap-4 xl:grid-cols-2">
          <Card title="Capital requests reaching each step">
            <BarList
              title="Funnel"
              max={funnelTop}
              rows={report.funnel.map((step) => ({ key: step.label, label: step.label, value: step.count }))}
              valueText={(row) => `${row.value}${funnelTop ? ` · ${Math.round((row.value / funnelTop) * 100)}%` : ""}`}
            />
            <p className="mt-3 text-[11px] text-slate-400">Each step counts requests that got at least that far; percentages are of requests submitted.</p>
          </Card>

          <Card title="Successful financings Anza contributed to, by contribution">
            {contribution.some((row) => row.value) ? (
              <BarList title="Contribution" max={Math.max(...contribution.map((row) => row.value))} rows={[...contribution].sort((a, b) => b.value - a.value)} valueText={(row) => `${row.value} · ${compactUsd(row.committedUsd)}`} />
            ) : (
              <p className="text-sm text-slate-500">No successful financing has been recorded for these filters.</p>
            )}
          </Card>
        </div>

        <Card
          title={breakdown ? `By ${breakdown.label.toLowerCase()}` : "Breakdown"}
          padded={false}
          action={
            <div className="flex items-center gap-2">
              <Select className="!w-56 !py-1.5" value={groupBy} onChange={setGroupBy} options={report.groups.map((group) => ({ value: group.key, label: `By ${group.label.toLowerCase()}` }))} />
              <button type="button" className={buttonClass.secondary} disabled={!breakdownRows.length} onClick={exportBreakdown}>Export CSV</button>
            </div>
          }
        >
          {breakdownRows.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-sm font-semibold capitalize text-black">
                    <th className="px-4 py-3">{breakdown.label}</th>
                    <th className="px-4 py-3 text-right">Requests</th>
                    <th className="px-4 py-3 text-right">Requested</th>
                    <th className="px-4 py-3 text-right">Opportunities</th>
                    <th className="px-4 py-3">Committed</th>
                    <th className="px-4 py-3 text-right">Disbursed</th>
                    <th className="px-4 py-3 text-right">Financed</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const max = Math.max(...breakdownRows.map((row) => row.committedUsd), 0);
                    return breakdownRows.map((row) => (
                      <tr key={row.key} className="border-b border-slate-100 last:border-0">
                        <td className="px-4 py-3 font-medium text-slate-800">{row.label}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{row.requests}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{compactUsd(row.requestedUsd)}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{row.opportunities}</td>
                        <td className="px-4 py-3" title={`${row.label}: ${compactUsd(row.committedUsd)} committed`}>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                              <div className="h-full rounded-full" style={{ width: `${max ? (row.committedUsd / max) * 100 : 0}%`, backgroundColor: BAR }} />
                            </div>
                            <span className="tabular-nums">{compactUsd(row.committedUsd)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">{compactUsd(row.disbursedUsd)}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{row.financed}</td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="p-5 text-sm text-slate-500">Nothing to break down for these filters.</p>
          )}
        </Card>
      </div>
    </div>
  );
};

export default CapitalReports;
