"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { getCapitalOptions, getMatchingTable } from "@/controllers/capital_controller";
import {
  CapitalHero,
  Card,
  DataTable,
  Field,
  FilterBar,
  LoadingBlock,
  MatchScore,
  Select,
  StatusChip,
  buttonClass,
} from "@/components/capital/CapitalUI";
import {
  financingLabel,
  money,
  readinessLabel,
  requestStatusLabel,
} from "@/utils/capital_labels";

// Capital Matching: every enterprise approved for matching, with the capital
// providers the engine recommends for it. The engine recommends; the manager
// chooses, from Manage Matching.
const CapitalMatching = () => {
  const navigate = useNavigate();
  const [options, setOptions] = useState(null);
  const [filters, setFilters] = useState({ status: "", financingType: "", sector: "" });
  const [result, setResult] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    getCapitalOptions().then((response) => response?.status && setOptions(response.body));
  }, []);

  useEffect(() => {
    let alive = true;
    setRefreshing(true);
    const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value));
    getMatchingTable(params).then((response) => {
      if (!alive) return;
      if (response?.status === false) toast.error(response.message || "Failed to load matching");
      else setResult(response.body);
      setRefreshing(false);
    });
    return () => {
      alive = false;
    };
  }, [filters]);

  const set = (key) => (value) => setFilters((prev) => ({ ...prev, [key]: value }));

  if (!result) return <LoadingBlock label="Scoring capital providers…" />;

  return (
    <div className="min-h-screen px-4 py-4 md:px-6">
      <CapitalHero
        title="Capital Matching"
        description="Enterprises approved for matching and the capital providers that best fit each one. Open Manage Matching to compare providers, choose one - or override the recommendation with a reason - and create the introduction."
      />

      <FilterBar onReset={() => setFilters({ status: "", financingType: "", sector: "" })}>
        <Field label="Status" className="w-56">
          <Select value={filters.status} onChange={set("status")} placeholder="All being matched" options={(options?.matchableStatuses || []).map((v) => ({ value: v, label: requestStatusLabel(v) }))} />
        </Field>
        <Field label="Financing type" className="w-48">
          <Select value={filters.financingType} onChange={set("financingType")} placeholder="All" options={(options?.financingTypes || []).map((v) => ({ value: v, label: financingLabel(v) }))} />
        </Field>
        <Field label="Sector" className="w-44">
          <Select value={filters.sector} onChange={set("sector")} placeholder="All" options={options?.sectors || []} getValue={(o) => o.name} getLabel={(o) => o.name} />
        </Field>
      </FilterBar>

      <Card title={`${result.count} ${result.count === 1 ? "enterprise" : "enterprises"} requiring capital`} padded={false} className={`transition-opacity ${refreshing ? "opacity-60" : ""}`}>
        <DataTable
          rows={result.data}
          empty="No enterprise is approved for matching yet. Approve a capital request for matching and it appears here."
          columns={[
            { key: "enterprise", label: "Enterprise", render: (row) => <><span className="block font-semibold text-slate-800">{row.enterprise?.name}</span><span className="block text-xs text-slate-500">{row.reference}</span></> },
            { key: "sector", label: "Sector", render: (row) => row.enterprise?.sector || "—" },
            { key: "capitalRequired", label: "Capital required", className: "whitespace-nowrap", render: (row) => money(row.capitalRequired, row.currency) },
            { key: "financingType", label: "Financing type", render: (row) => financingLabel(row.financingType) },
            { key: "readiness", label: "Capital readiness", render: (row) => readinessLabel(row.readinessStatus) },
            {
              key: "recommended",
              label: "Recommended capital providers",
              render: (row) =>
                row.recommendedProviders.length ? (
                  <ul className="space-y-1">
                    {row.recommendedProviders.map((provider) => (
                      <li key={provider.uuid} className="flex items-center justify-between gap-2 text-xs">
                        <span className="truncate text-slate-700">{provider.name}</span>
                        <MatchScore score={provider.score} showLabel={false} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-xs text-slate-400">No active providers</span>
                ),
            },
            { key: "highest", label: "Highest match", render: (row) => <MatchScore score={row.highestMatchScore} /> },
            { key: "manager", label: "Assigned manager", render: (row) => row.assignedManager?.name || <span className="text-xs text-slate-400">Unassigned</span> },
            { key: "status", label: "Status", render: (row) => <><StatusChip value={row.status} label={requestStatusLabel(row.status)} />{row.totalOpportunities ? <span className="mt-1 block text-[11px] text-slate-500">{row.activeOpportunities} active of {row.totalOpportunities} opportunities</span> : null}</> },
            {
              key: "action",
              label: "Action",
              render: (row) => (
                <button type="button" className={buttonClass.primary} onClick={() => navigate(`/dashboard/capital/matching/${row.uuid}`)}>
                  Manage Matching
                </button>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default CapitalMatching;
