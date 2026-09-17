"use client";

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { getCapitalOptions, listDueDiligence } from "@/controllers/capital_controller";
import { CapitalHero, Card, DataTable, Field, FilterBar, LoadingBlock, Select, StatTile, StatusChip } from "@/components/capital/CapitalUI";
import { openDocument } from "@/components/capital/CapitalRecord";
import { ddCategoryLabel, human, shortDate } from "@/utils/capital_labels";

const EMPTY = { status: "", riskLevel: "", category: "", responsibleParty: "", overdue: "" };

// Due diligence across every capital opportunity: what is outstanding, overdue
// or risky, wherever it sits.
const CapitalDueDiligence = () => {
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
    listDueDiligence(params).then((response) => {
      if (request !== latest.current) return;
      if (response?.status === false) toast.error(response.message || "Failed to load due diligence");
      else setResult(response.body);
    });
  }, [filters]);

  if (!result) return <LoadingBlock label="Loading due diligence…" />;

  const set = (key) => (value) => setFilters((prev) => ({ ...prev, [key]: value }));
  const s = result.summary;

  return (
    <div className="min-h-screen px-4 py-4 md:px-6">
      <CapitalHero title="Due Diligence" description="Every due diligence item on every capital opportunity. Open an item's opportunity to review documents, rate risk and record findings." />

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatTile label="Items" value={s.total} onClick={() => setFilters(EMPTY)} />
        <StatTile label="Complete" value={s.verified} tone="text-emerald-700" />
        <StatTile label="Under review" value={s.underReview} onClick={() => setFilters({ ...EMPTY, status: "under_review" })} />
        <StatTile label="Issues identified" value={s.issues} tone={s.issues ? "text-rose-700" : undefined} onClick={() => setFilters({ ...EMPTY, status: "issue_identified" })} />
        <StatTile label="Overdue" value={s.overdue} tone={s.overdue ? "text-rose-700" : undefined} onClick={() => setFilters({ ...EMPTY, overdue: "1" })} />
        <StatTile label="Open high / critical risk" value={s.highRisk} tone={s.highRisk ? "text-amber-700" : undefined} onClick={() => setFilters({ ...EMPTY, riskLevel: "high" })} />
      </div>

      <FilterBar onReset={() => setFilters(EMPTY)}>
        <Field label="Status" className="w-44"><Select value={filters.status} onChange={set("status")} placeholder="All" options={(options?.ddStatuses || []).map((v) => ({ value: v, label: human(v) }))} /></Field>
        <Field label="Risk" className="w-32"><Select value={filters.riskLevel} onChange={set("riskLevel")} placeholder="All" options={(options?.ddRisks || []).map((v) => ({ value: v, label: human(v) }))} /></Field>
        <Field label="Category" className="w-52"><Select value={filters.category} onChange={set("category")} placeholder="All" options={(options?.ddCategories || []).map((v) => ({ value: v, label: ddCategoryLabel(v) }))} /></Field>
        <Field label="Responsible" className="w-36"><Select value={filters.responsibleParty} onChange={set("responsibleParty")} placeholder="Anyone" options={(options?.ddParties || []).map((v) => ({ value: v, label: human(v) }))} /></Field>
        <Field label="Due" className="w-32"><Select value={filters.overdue} onChange={set("overdue")} placeholder="Any time" options={[{ value: "1", label: "Overdue only" }]} /></Field>
      </FilterBar>

      <Card title={`${result.data.length} items`} padded={false}>
        <DataTable
          rows={result.data}
          empty="No due diligence items match these filters."
          onRowClick={(row) => navigate(`/dashboard/capital/opportunities/${row.opportunity.uuid}?tab=duediligence`)}
          columns={[
            { key: "requirement", label: "Requirement", render: (row) => <><span className="block font-medium text-slate-800">{row.requirement}</span><span className="block text-xs text-slate-500">{ddCategoryLabel(row.category)}</span></> },
            { key: "opportunity", label: "Opportunity", render: (row) => <><span className="block text-xs font-semibold text-[#082d77]">{row.opportunity.reference}</span><span className="block text-slate-700">{row.opportunity.enterprise}</span><span className="block text-xs text-slate-500">{row.opportunity.provider}</span></> },
            { key: "responsible", label: "Responsible", render: (row) => human(row.responsibleParty) },
            { key: "status", label: "Status", render: (row) => <StatusChip value={row.status} label={human(row.status)} /> },
            { key: "risk", label: "Risk", render: (row) => <StatusChip value={row.riskLevel} label={human(row.riskLevel)} /> },
            { key: "due", label: "Due", className: "whitespace-nowrap", render: (row) => <span className={row.overdue ? "font-semibold text-rose-700" : ""}>{shortDate(row.dueDate)}{row.overdue ? " · overdue" : ""}</span> },
            {
              key: "document",
              label: "Document",
              render: (row) =>
                row.document ? (
                  <button
                    type="button"
                    className="text-xs font-semibold text-[#082d77] hover:underline"
                    onClick={(event) => {
                      event.stopPropagation();
                      openDocument(row.document);
                    }}
                  >
                    {row.document.title}
                  </button>
                ) : (
                  <span className="text-xs text-slate-400">None</span>
                ),
            },
            { key: "reviewer", label: "Reviewer", render: (row) => row.reviewer?.name || "—" },
          ]}
        />
      </Card>
    </div>
  );
};

export default CapitalDueDiligence;
