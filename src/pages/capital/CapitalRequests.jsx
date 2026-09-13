"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { listCapitalRequests, getCapitalOptions } from "@/controllers/capital_controller";
import {
  CapitalHero,
  Card,
  DataTable,
  Field,
  FilterBar,
  inputClass,
  LoadingBlock,
  Select,
  StatusChip,
  MatchScore,
  buttonClass,
} from "@/components/capital/CapitalUI";
import {
  financingLabel,
  money,
  readinessLabel,
  requestStatusLabel,
  shortDate,
} from "@/utils/capital_labels";

// The Capital Facilitation Manager's review queue and the full list of capital
// requests behind it.
const CapitalRequests = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [options, setOptions] = useState(null);
  const [result, setResult] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const latest = useRef(0);

  const filters = {
    awaiting: params.get("awaiting") || "",
    status: params.get("status") || "",
    financingType: params.get("financingType") || "",
    programme: params.get("programme") || "",
    manager: params.get("manager") || "",
    sector: params.get("sector") || "",
    region: params.get("region") || "",
    q: params.get("q") || "",
    dateFrom: params.get("dateFrom") || "",
    dateTo: params.get("dateTo") || "",
    amountMin: params.get("amountMin") || "",
    amountMax: params.get("amountMax") || "",
    page: params.get("page") || "1",
  };

  // Filters live in the address, so a filtered queue can be bookmarked or shared.
  const set = (key) => (value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    if (key === "status" && value) next.delete("awaiting");
    setParams(next, { replace: true });
  };

  useEffect(() => {
    getCapitalOptions().then((response) => response?.status && setOptions(response.body));
  }, []);

  const query = params.toString();

  const load = useCallback(async () => {
    const request = ++latest.current;
    setRefreshing(true);
    const response = await listCapitalRequests(Object.fromEntries(new URLSearchParams(query)));
    if (request !== latest.current) return;
    if (response?.status === false) toast.error(response.message || "Failed to load capital requests");
    else setResult(response.body);
    setRefreshing(false);
  }, [query]);

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [load]);

  if (!result) return <LoadingBlock label="Loading capital requests…" />;

  return (
    <div className="min-h-screen px-4 py-4 md:px-6">
      <CapitalHero
        title="Capital Requests"
        description="Every request for capital lands here first. Review it, ask for what is missing, and approve it for matching when it is ready."
      >
        <button type="button" className={filters.awaiting ? buttonClass.success : buttonClass.secondary} onClick={() => set("awaiting")(filters.awaiting ? "" : "1")}>
          {filters.awaiting ? "Showing requests awaiting review" : "Show only requests awaiting review"}
        </button>
      </CapitalHero>

      <FilterBar onReset={() => setParams(new URLSearchParams(), { replace: true })}>
        <Field label="Search enterprise" className="w-48">
          <input className={inputClass} value={filters.q} onChange={(e) => set("q")(e.target.value)} placeholder="Enterprise name" />
        </Field>
        <Field label="Status" className="w-52">
          <Select value={filters.status} onChange={set("status")} placeholder="All (except drafts)" options={(options?.requestStatuses || []).filter((s) => s !== "draft").map((v) => ({ value: v, label: requestStatusLabel(v) }))} />
        </Field>
        <Field label="Financing type" className="w-44">
          <Select value={filters.financingType} onChange={set("financingType")} placeholder="All" options={(options?.financingTypes || []).map((v) => ({ value: v, label: financingLabel(v) }))} />
        </Field>
        <Field label="Programme" className="w-44">
          <Select value={filters.programme} onChange={set("programme")} placeholder="All" options={options?.programmes || []} getValue={(o) => o.uuid} getLabel={(o) => o.title} />
        </Field>
        <Field label="Sector" className="w-40">
          <Select value={filters.sector} onChange={set("sector")} placeholder="All" options={options?.sectors || []} getValue={(o) => o.name} getLabel={(o) => o.name} />
        </Field>
        <Field label="Region" className="w-36">
          <input className={inputClass} value={filters.region} onChange={(e) => set("region")(e.target.value)} placeholder="e.g. Mwanza" />
        </Field>
        <Field label="Manager" className="w-40">
          <Select value={filters.manager} onChange={set("manager")} placeholder="All" options={options?.managers || []} getValue={(o) => o.uuid} getLabel={(o) => o.name} />
        </Field>
        <Field label="Amount (USD)" className="w-44">
          <div className="flex gap-1">
            <input className={inputClass} inputMode="numeric" value={filters.amountMin} onChange={(e) => set("amountMin")(e.target.value)} placeholder="Min" />
            <input className={inputClass} inputMode="numeric" value={filters.amountMax} onChange={(e) => set("amountMax")(e.target.value)} placeholder="Max" />
          </div>
        </Field>
        <Field label="Submitted from" className="w-36">
          <input type="date" className={inputClass} value={filters.dateFrom} onChange={(e) => set("dateFrom")(e.target.value)} />
        </Field>
        <Field label="to" className="w-36">
          <input type="date" className={inputClass} value={filters.dateTo} onChange={(e) => set("dateTo")(e.target.value)} />
        </Field>
      </FilterBar>

      <Card
        title={`${result.count} capital ${result.count === 1 ? "request" : "requests"}`}
        padded={false}
        className={`transition-opacity ${refreshing ? "opacity-60" : ""}`}
      >
        <DataTable
          rows={result.data}
          empty={filters.awaiting ? "Nothing is waiting for review." : "No capital request matches these filters."}
          onRowClick={(row) => navigate(`/dashboard/capital/requests/${row.uuid}`)}
          columns={[
            { key: "reference", label: "Reference", render: (row) => <span className="font-semibold text-[#082d77]">{row.reference}</span> },
            { key: "enterprise", label: "Enterprise", render: (row) => <><span className="block font-medium text-slate-800">{row.business?.name || "—"}</span><span className="block text-xs text-slate-500">{row.leader?.name || ""}</span></> },
            { key: "sector", label: "Sector / Region", render: (row) => <><span className="block text-slate-700">{row.business?.sector || "—"}</span><span className="block text-xs text-slate-500">{row.business?.location || ""}</span></> },
            { key: "programme", label: "Programme", render: (row) => row.programme?.title || "—" },
            { key: "amount", label: "Amount requested", className: "whitespace-nowrap", render: (row) => money(row.amountRequested, row.currency) },
            { key: "financingType", label: "Financing", render: (row) => financingLabel(row.financingType) },
            { key: "readiness", label: "Readiness", render: (row) => readinessLabel(row.readinessStatus) },
            { key: "match", label: "Best match", render: (row) => (row.highestMatchScore ? <MatchScore score={row.highestMatchScore} showLabel={false} /> : <span className="text-xs text-slate-400">—</span>) },
            { key: "submittedAt", label: "Submitted", className: "whitespace-nowrap", render: (row) => shortDate(row.submittedAt) },
            { key: "status", label: "Status", render: (row) => <StatusChip value={row.status} label={requestStatusLabel(row.status)} /> },
            { key: "manager", label: "Manager", render: (row) => row.assignedManager?.name || <span className="text-xs text-slate-400">Unassigned</span> },
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

export default CapitalRequests;
