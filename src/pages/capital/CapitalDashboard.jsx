"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FaBalanceScale,
  FaCheckCircle,
  FaClipboardCheck,
  FaComments,
  FaHandHoldingUsd,
  FaHandshake,
  FaInbox,
  FaMoneyBillWave,
  FaSearchDollar,
  FaTimesCircle,
  FaUserCheck,
} from "react-icons/fa";
import { getCapitalDashboard, getCapitalOptions } from "@/controllers/capital_controller";
import {
  CapitalHero,
  Card,
  DataTable,
  Empty,
  Field,
  FilterBar,
  inputClass,
  LoadingBlock,
  Select,
  StatTile,
  StatusChip,
  Timeline,
  buttonClass,
} from "@/components/capital/CapitalUI";
import {
  compactUsd,
  dateTime,
  financingLabel,
  requestStatusLabel,
  shortDate,
  stageLabel,
} from "@/utils/capital_labels";

const EMPTY_FILTERS = {
  programme: "",
  enterprise: "",
  provider: "",
  sector: "",
  region: "",
  financingType: "",
  amountMin: "",
  amountMax: "",
  stage: "",
  manager: "",
  dateFrom: "",
  dateTo: "",
  status: "",
};

// The single hue the pipeline bars wear: one series, so one colour, and the
// panel title names it.
const BAR = "#2a78d6";

const CapitalDashboard = () => {
  const navigate = useNavigate();
  const [options, setOptions] = useState(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [data, setData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const latest = useRef(0);

  useEffect(() => {
    getCapitalOptions().then((response) => response?.status && setOptions(response.body));
  }, []);

  const load = useCallback(async (current) => {
    const request = ++latest.current;
    setRefreshing(true);
    const params = Object.fromEntries(Object.entries(current).filter(([, value]) => value !== ""));
    const response = await getCapitalDashboard(params);
    if (request !== latest.current) return;
    if (response?.status === false) toast.error(response.message || "Failed to load the dashboard");
    else setData(response.body);
    setRefreshing(false);
  }, []);

  // Typed filters wait for a pause; chosen ones apply at once.
  useEffect(() => {
    const timer = setTimeout(() => load(filters), 350);
    return () => clearTimeout(timer);
  }, [filters, load]);

  const set = (key) => (value) => setFilters((prev) => ({ ...prev, [key]: value }));
  const go = (path) => () => navigate(path);

  const pipelineMax = useMemo(
    () => Math.max(1, ...(data?.pipeline || []).map((row) => row.count)),
    [data],
  );

  if (!data) return <LoadingBlock label="Loading the capital facilitation dashboard…" />;

  const c = data.cards;

  const tiles = [
    { label: "New Capital Requests", value: c.newCapitalRequests, icon: <FaInbox />, onClick: go("/dashboard/capital/requests?status=submitted") },
    { label: "Requests Awaiting Review", value: c.requestsAwaitingReview, icon: <FaClipboardCheck />, tone: c.requestsAwaitingReview ? "text-amber-600" : undefined, onClick: go("/dashboard/capital/requests?awaiting=1") },
    { label: "Capital Provider Interests Received", value: c.providerInterestsReceived, icon: <FaSearchDollar />, onClick: go("/dashboard/capital/introductions") },
    { label: "Matches Suggested", value: c.matchesSuggested, icon: <FaBalanceScale />, onClick: go("/dashboard/capital/matching") },
    { label: "Introductions Awaiting Approval", value: c.introductionsAwaitingApproval, icon: <FaHandshake />, tone: c.introductionsAwaitingApproval ? "text-amber-600" : undefined, onClick: go("/dashboard/capital/introductions") },
    { label: "Active Capital Conversations", value: c.activeConversations, note: "Messages in the last 30 days", icon: <FaComments />, onClick: go("/dashboard/capital/communications") },
    { label: "Due Diligence in Progress", value: c.dueDiligenceInProgress, icon: <FaClipboardCheck />, onClick: go("/dashboard/capital/due-diligence") },
    { label: "Deals Under Negotiation", value: c.dealsUnderNegotiation, icon: <FaHandshake />, onClick: go("/dashboard/capital/pipeline") },
    { label: "Capital Commitments Secured", value: c.commitmentsSecured, icon: <FaUserCheck />, tone: "text-emerald-700", onClick: go("/dashboard/capital/facilitated") },
    { label: "Capital Disbursed", value: c.capitalDisbursedCount, note: "Opportunities with disbursement", icon: <FaMoneyBillWave />, tone: "text-emerald-700", onClick: go("/dashboard/capital/facilitated") },
    { label: "Declined / Closed Opportunities", value: c.declinedClosed, icon: <FaTimesCircle />, tone: "text-slate-500" },
    { label: "Total Capital Requested", value: compactUsd(c.totalCapitalRequestedUsd), icon: <FaHandHoldingUsd /> },
    { label: "Total Capital Under Discussion", value: compactUsd(c.totalCapitalUnderDiscussionUsd), note: "Engaged opportunities' potential", icon: <FaComments /> },
    { label: "Total Capital Committed", value: compactUsd(c.totalCapitalCommittedUsd), icon: <FaCheckCircle />, tone: "text-emerald-700" },
    { label: "Total Capital Facilitated", value: compactUsd(c.totalCapitalFacilitatedUsd), note: "Secured with Anza's facilitation", icon: <FaCheckCircle />, tone: "text-emerald-700" },
  ];

  return (
    <div className="min-h-screen px-4 py-4 md:px-6">
      <CapitalHero
        title="Capital Facilitation Dashboard"
        description="Every capital request, capital provider and financing opportunity Anza is facilitating - from the first request to disbursement."
      >
        <button type="button" className={buttonClass.secondary} onClick={go("/dashboard/capital/requests?awaiting=1")}>
          Review queue
        </button>
        <button type="button" className={buttonClass.success} onClick={go("/dashboard/capital/pipeline")}>
          Open pipeline
        </button>
      </CapitalHero>

      <FilterBar onReset={() => setFilters(EMPTY_FILTERS)}>
        <Field label="Programme" className="w-44">
          <Select value={filters.programme} onChange={set("programme")} placeholder="All" options={options?.programmes || []} getValue={(o) => o.uuid} getLabel={(o) => o.title} />
        </Field>
        <Field label="Capital provider" className="w-44">
          <Select value={filters.provider} onChange={set("provider")} placeholder="All" options={options?.providers || []} getValue={(o) => o.uuid} getLabel={(o) => o.name} />
        </Field>
        <Field label="Sector" className="w-40">
          <Select value={filters.sector} onChange={set("sector")} placeholder="All" options={options?.sectors || []} getValue={(o) => o.name} getLabel={(o) => o.name} />
        </Field>
        <Field label="Region" className="w-36">
          <input className={inputClass} value={filters.region} onChange={(e) => set("region")(e.target.value)} placeholder="e.g. Arusha" />
        </Field>
        <Field label="Financing type" className="w-44">
          <Select value={filters.financingType} onChange={set("financingType")} placeholder="All" options={(options?.financingTypes || []).map((v) => ({ value: v, label: financingLabel(v) }))} />
        </Field>
        <Field label="Stage" className="w-44">
          <Select value={filters.stage} onChange={set("stage")} placeholder="All" options={(options?.stages || []).map((v) => ({ value: v, label: stageLabel(v) }))} />
        </Field>
        <Field label="Manager" className="w-40">
          <Select value={filters.manager} onChange={set("manager")} placeholder="All" options={options?.managers || []} getValue={(o) => o.uuid} getLabel={(o) => o.name} />
        </Field>
        <Field label="Status" className="w-32">
          <Select value={filters.status} onChange={set("status")} placeholder="All" options={[{ value: "active", label: "Active" }, { value: "won", label: "Won" }, { value: "lost", label: "Lost" }, { value: "closed", label: "Closed" }]} />
        </Field>
        <Field label="Amount (USD)" className="w-44">
          <div className="flex gap-1">
            <input className={inputClass} inputMode="numeric" value={filters.amountMin} onChange={(e) => set("amountMin")(e.target.value)} placeholder="Min" />
            <input className={inputClass} inputMode="numeric" value={filters.amountMax} onChange={(e) => set("amountMax")(e.target.value)} placeholder="Max" />
          </div>
        </Field>
        <Field label="From" className="w-36">
          <input type="date" className={inputClass} value={filters.dateFrom} onChange={(e) => set("dateFrom")(e.target.value)} />
        </Field>
        <Field label="To" className="w-36">
          <input type="date" className={inputClass} value={filters.dateTo} onChange={(e) => set("dateTo")(e.target.value)} />
        </Field>
      </FilterBar>

      {/* The previous figures stay on screen, dimmed, while new ones load. */}
      <div className={`transition-opacity ${refreshing ? "opacity-60" : ""}`}>
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          {tiles.map((tile) => (
            <StatTile key={tile.label} {...tile} />
          ))}
        </div>
        <p className="-mt-4 mb-6 text-[11px] text-slate-400">{data.currencyNote}</p>

        <div className="mb-6 grid gap-4 xl:grid-cols-5">
          <Card title="Active opportunities by pipeline stage" className="xl:col-span-2">
            <ul className="space-y-2">
              {data.pipeline.map((row) => (
                <li key={row.stage}>
                  <button type="button" onClick={go(`/dashboard/capital/opportunities?stage=${row.stage}`)} className="block w-full text-left" title={`${stageLabel(row.stage)}: ${row.count}`}>
                    <div className="mb-0.5 flex items-baseline justify-between gap-3 text-xs">
                      <span className="truncate font-medium text-slate-700">{stageLabel(row.stage)}</span>
                      <span className="shrink-0 font-bold text-slate-900">{row.count}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full" style={{ width: `${(row.count / pipelineMax) * 100}%`, backgroundColor: BAR }} />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Next actions due" className="xl:col-span-3" padded={false}>
            <DataTable
              rows={data.upcoming}
              empty="No opportunity has a next action date."
              onRowClick={(row) => navigate(`/dashboard/capital/opportunities/${row.uuid}`)}
              columns={[
                { key: "reference", label: "Opportunity", render: (row) => <span className="font-semibold text-[#082d77]">{row.reference}</span> },
                { key: "enterprise", label: "Enterprise / Provider", render: (row) => <><span className="block font-medium text-slate-800">{row.enterprise}</span><span className="block text-xs text-slate-500">{row.provider}</span></> },
                { key: "nextAction", label: "Next action", render: (row) => row.nextAction || "—" },
                { key: "nextActionDate", label: "Due", render: (row) => shortDate(row.nextActionDate) },
                { key: "stage", label: "Stage", render: (row) => <StatusChip value="active" label={stageLabel(row.stage)} /> },
              ]}
            />
          </Card>
        </div>

        <Card title="Recent capital facilitation activity">
          {data.recentActivity.length ? (
            <Timeline
              items={data.recentActivity.map((row, index) => ({
                key: index,
                title: row.action,
                meta: `${row.user ? row.user.name : "System"}${row.role ? ` · ${row.role}` : ""} · ${dateTime(row.createdAt)}`,
              }))}
            />
          ) : (
            <Empty>No capital facilitation activity yet. It appears here as requests are reviewed and opportunities move.</Empty>
          )}
        </Card>
      </div>
    </div>
  );
};

export { requestStatusLabel };
export default CapitalDashboard;
