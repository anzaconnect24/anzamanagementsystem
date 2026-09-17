"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { listCapitalProviders, syncInvestorProviders } from "@/controllers/capital_controller";
import { CapitalHero, Card, DataTable, Field, FilterBar, inputClass, LoadingBlock, Select, StatusChip, buttonClass } from "@/components/capital/CapitalUI";
import ProviderForm from "@/components/capital/ProviderForm";
import useCapitalAccess from "@/components/capital/useCapitalAccess";
import { FINANCING_LABELS, PROVIDER_TYPE_LABELS, financingLabel, human, money, providerTypeLabel } from "@/utils/capital_labels";

const EMPTY = { q: "", type: "", instrument: "", status: "active", page: "1" };

const ticket = (row) => {
  if (row.minTicketUsd && row.maxTicketUsd) return `${money(row.minTicketUsd)} – ${money(row.maxTicketUsd)}`;
  if (row.maxTicketUsd) return `Up to ${money(row.maxTicketUsd)}`;
  if (row.minTicketUsd) return `From ${money(row.minTicketUsd)}`;
  return "—";
};

const CapitalProviders = () => {
  const navigate = useNavigate();
  const { can } = useCapitalAccess();
  const [filters, setFilters] = useState(EMPTY);
  const [result, setResult] = useState(null);
  const [adding, setAdding] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const latest = useRef(0);

  const load = useCallback(async () => {
    const request = ++latest.current;
    const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value));
    const response = await listCapitalProviders(params);
    if (request !== latest.current) return;
    if (response?.status === false) toast.error(response.message || "Failed to load capital providers");
    else setResult(response.body);
  }, [filters]);

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [load]);

  const set = (key) => (value) => setFilters((prev) => ({ ...prev, [key]: value, page: key === "page" ? value : "1" }));
  const manages = can("capital.providers.manage");

  const sync = async () => {
    setSyncing(true);
    const response = await syncInvestorProviders();
    setSyncing(false);
    if (response?.status === false) return toast.error(response.message || "Failed to sync investors");
    toast.success(response.body.created ? `${response.body.created} investor accounts added as capital providers` : "Every investor account is already on the list");
    load();
  };

  if (!result) return <LoadingBlock label="Loading capital providers…" />;

  return (
    <div className="min-h-screen px-4 py-4 md:px-6">
      <CapitalHero title="Capital Providers" description="Investors, funds, banks, DFIs, foundations and every other source of finance Anza matches enterprises to. What they back drives the match score.">
        {manages ? (
          <>
            <button type="button" className={buttonClass.secondary} disabled={syncing} onClick={sync}>{syncing ? "Syncing…" : "Sync investor accounts"}</button>
            <button type="button" className={buttonClass.success} onClick={() => setAdding(true)}>Add capital provider</button>
          </>
        ) : null}
      </CapitalHero>

      <FilterBar onReset={() => setFilters(EMPTY)}>
        <Field label="Search" className="w-52"><input className={inputClass} value={filters.q} onChange={(e) => set("q")(e.target.value)} placeholder="Provider name" /></Field>
        <Field label="Type" className="w-56"><Select value={filters.type} onChange={set("type")} placeholder="All types" options={Object.entries(PROVIDER_TYPE_LABELS).map(([value, label]) => ({ value, label }))} /></Field>
        <Field label="Instrument" className="w-48"><Select value={filters.instrument} onChange={set("instrument")} placeholder="Any" options={Object.entries(FINANCING_LABELS).map(([value, label]) => ({ value, label }))} /></Field>
        <Field label="Status" className="w-32"><Select value={filters.status} onChange={set("status")} options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }, { value: "all", label: "All" }]} /></Field>
      </FilterBar>

      <Card title={`${result.count} capital ${result.count === 1 ? "provider" : "providers"}`} padded={false}>
        <DataTable
          rows={result.data}
          empty="No capital provider matches these filters."
          onRowClick={(row) => navigate(`/dashboard/capital/providers/${row.uuid}`)}
          columns={[
            { key: "name", label: "Provider", render: (row) => <><span className="block font-semibold text-slate-800">{row.name}</span><span className="block text-xs text-slate-500">{providerTypeLabel(row.providerType)}{row.linkedAccount ? " · platform account" : ""}</span></> },
            { key: "sectors", label: "Sectors / geographies", render: (row) => <><span className="block text-slate-700">{(row.preferredSectors || []).join(", ") || "Any sector"}</span><span className="block text-xs text-slate-500">{(row.preferredGeographies || []).join(", ") || "Any geography"}</span></> },
            { key: "ticket", label: "Ticket size", className: "whitespace-nowrap", render: ticket },
            { key: "instruments", label: "Instruments", render: (row) => (row.instruments || []).map(financingLabel).join(", ") || "—" },
            { key: "appetite", label: "Appetite", render: (row) => (row.capitalAppetite ? human(row.capitalAppetite) : "—") },
            { key: "opportunities", label: "Opportunities", render: (row) => <><span className="block text-slate-800">{row.activeOpportunities} active</span><span className="block text-xs text-emerald-700">{row.securedOpportunities} secured</span></> },
            { key: "status", label: "Status", render: (row) => <StatusChip value={row.status === "active" ? "active" : "closed"} label={human(row.status)} /> },
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

      <ProviderForm
        open={adding}
        provider={null}
        onClose={() => setAdding(false)}
        onSaved={(provider) => {
          setAdding(false);
          navigate(`/dashboard/capital/providers/${provider.uuid}`);
        }}
      />
    </div>
  );
};

export default CapitalProviders;
