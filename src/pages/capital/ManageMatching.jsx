"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { getCapitalOptions, getRecommendations, selectCapitalProvider } from "@/controllers/capital_controller";
import {
  CapitalHero,
  Card,
  Empty,
  Field,
  FilterBar,
  inputClass,
  LoadingBlock,
  MatchScore,
  Modal,
  Select,
  StatusChip,
  buttonClass,
} from "@/components/capital/CapitalUI";
import useCapitalAccess from "@/components/capital/useCapitalAccess";
import {
  financingLabel,
  human,
  money,
  providerTypeLabel,
  readinessLabel,
  requestStatusLabel,
  stageLabel,
} from "@/utils/capital_labels";

// One measure (a criterion's score out of 100), so one hue.
const BAR = "#2a78d6";
const MAX_COMPARE = 3;

const ticketRange = (provider) => {
  const { minTicketUsd: min, maxTicketUsd: max } = provider;
  if (min && max) return `${money(min)} – ${money(max)}`;
  if (min) return `From ${money(min)}`;
  if (max) return `Up to ${money(max)}`;
  return "Not stated";
};

const listText = (value) => (Array.isArray(value) && value.length ? value.map(human).join(", ") : "Not stated");

const Breakdown = ({ rows }) => (
  <ul className="space-y-2.5">
    {rows.map((row) => (
      <li key={row.key} title={`${row.label}: ${row.score}/100, weighted ${row.weight}%`}>
        <div className="mb-0.5 flex items-baseline justify-between gap-3 text-xs">
          <span className="font-medium text-slate-700">{row.label} <span className="font-normal text-slate-400">· weight {row.weight}%</span></span>
          <span className="font-bold text-slate-900">{row.score}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full" style={{ width: `${row.score}%`, backgroundColor: BAR }} />
        </div>
        <p className="mt-0.5 text-[11px] text-slate-500">{row.reason}</p>
      </li>
    ))}
  </ul>
);

const ManageMatching = () => {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const { can } = useCapitalAccess();
  const [options, setOptions] = useState(null);
  const [filters, setFilters] = useState({ type: "", minScore: "" });
  const [result, setResult] = useState(null);
  const [missing, setMissing] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState(() => new Set());
  const [compare, setCompare] = useState([]);
  const [selecting, setSelecting] = useState(null);
  const [form, setForm] = useState({});
  const [serverHint, setServerHint] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getCapitalOptions().then((response) => response?.status && setOptions(response.body));
  }, []);

  const load = useCallback(async () => {
    setRefreshing(true);
    const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value));
    const response = await getRecommendations(uuid, params);
    if (response?.status === false) setMissing(response.message || "Capital request not found");
    else setResult(response.body);
    setRefreshing(false);
  }, [uuid, filters]);

  useEffect(() => {
    load();
  }, [load]);

  // The best-scoring provider not yet an opportunity: choosing below it is an
  // override. With filters on, the API has the final word.
  const bestAvailable = useMemo(() => (result ? result.data.find((row) => !row.opportunity) : null), [result]);

  if (missing) return <div className="p-6"><Empty action={<Link to="/dashboard/capital/matching" className={buttonClass.secondary}>Capital Matching</Link>}>{missing}</Empty></div>;
  if (!result) return <LoadingBlock label="Scoring every active capital provider…" />;

  const { request } = result;
  const manager = can("capital.matching.manage");
  const compared = compare.map((key) => result.data.find((row) => row.provider.uuid === key)).filter(Boolean);

  const toggle = (setter, key) =>
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const toggleCompare = (key) =>
    setCompare((prev) => {
      if (prev.includes(key)) return prev.filter((item) => item !== key);
      if (prev.length >= MAX_COMPARE) {
        toast.error(`Compare up to ${MAX_COMPARE} providers at a time`);
        return prev;
      }
      return [...prev, key];
    });

  const needsReason = (row) => !!row && !!bestAvailable && bestAvailable.provider.uuid !== row.provider.uuid && bestAvailable.score > row.score;

  const begin = (row) => {
    setForm({ potentialAmount: request.amountRequested, createIntroduction: false, introductionMessage: "", overrideReason: "" });
    setServerHint("");
    setSelecting(row);
  };

  const submit = async () => {
    const reasonRequired = needsReason(selecting) || !!serverHint;
    if (reasonRequired && !form.overrideReason.trim()) return toast.error("Give a reason for choosing this provider over a higher-scoring one");

    setSaving(true);
    const response = await selectCapitalProvider(request.uuid, {
      providerUuid: selecting.provider.uuid,
      potentialAmount: form.potentialAmount,
      overrideReason: form.overrideReason || undefined,
      createIntroduction: form.createIntroduction,
      introductionMessage: form.introductionMessage || undefined,
    });
    setSaving(false);

    if (response?.status === false) {
      if (/scores higher/.test(response.message || "")) setServerHint(response.message);
      else toast.error(response.message || "Failed to select the provider");
      return;
    }
    toast.success(`${response.body.reference} created${response.body.override ? " (override recorded)" : ""}`);
    navigate(`/dashboard/capital/opportunities/${response.body.uuid}`);
  };

  return (
    <div className="min-h-screen px-4 py-4 md:px-6">
      <CapitalHero
        badge={`Manage Matching · ${request.reference}`}
        title={request.enterprise?.name || "Manage Matching"}
        description={`${money(request.amountRequested, request.currency)} of ${financingLabel(request.financingType).toLowerCase()} · ${request.enterprise?.sector || "sector not recorded"} · ${request.enterprise?.location || "location not recorded"}. Every active capital provider, scored on seven criteria. The engine recommends; you decide.`}
      >
        <Link to={`/dashboard/capital/requests/${request.uuid}`} className={buttonClass.secondary}>Open the request</Link>
      </CapitalHero>

      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
        <StatusChip value={request.status} label={requestStatusLabel(request.status)} />
        <span className="text-slate-600">Readiness: <strong className="text-slate-800">{readinessLabel(request.readinessStatus)}</strong></span>
        {request.currency !== "USD" && request.amountUsd ? <span className="text-slate-600">≈ {money(request.amountUsd)} (indicative rate)</span> : null}
        {(request.preferredProviderTypes || []).length ? <span className="text-slate-600">Prefers: {request.preferredProviderTypes.map(providerTypeLabel).join(", ")}</span> : null}
      </div>

      {!request.matchable ? (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          This request is {requestStatusLabel(request.status).toLowerCase()}. Scores are shown for reference; approve it for matching before selecting a provider.
        </div>
      ) : null}

      <FilterBar onReset={() => setFilters({ type: "", minScore: "" })}>
        <Field label="Provider type" className="w-56">
          <Select value={filters.type} onChange={(value) => setFilters({ ...filters, type: value })} placeholder="All types" options={(options?.providerTypes || []).map((v) => ({ value: v, label: providerTypeLabel(v) }))} />
        </Field>
        <Field label="Minimum match" className="w-40">
          <Select value={filters.minScore} onChange={(value) => setFilters({ ...filters, minScore: value })} placeholder="Any score" options={[{ value: "75", label: "Strong (75%+)" }, { value: "50", label: "Moderate (50%+)" }, { value: "25", label: "25%+" }]} />
        </Field>
        <p className="mb-2 text-xs text-slate-500">{result.data.length} providers · tick up to {MAX_COMPARE} to compare</p>
      </FilterBar>

      {compared.length >= 2 ? (
        <Card title="Side-by-side comparison" className="mb-4" padded={false} action={<button type="button" className={buttonClass.link} onClick={() => setCompare([])}>Clear</button>}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-sm font-semibold capitalize text-black">
                  <th className="px-4 py-3">Criterion</th>
                  {compared.map((row) => <th key={row.provider.uuid} className="px-4 py-3 normal-case">{row.provider.name}</th>)}
                </tr>
              </thead>
              <tbody>
                {compared[0].breakdown.map((criterion, index) => (
                  <tr key={criterion.key} className="border-b border-slate-100">
                    <td className="px-4 py-3 align-top"><span className="block font-medium text-slate-800">{criterion.label}</span><span className="text-xs text-slate-400">weight {criterion.weight}%</span></td>
                    {compared.map((row) => (
                      <td key={row.provider.uuid} className="px-4 py-3 align-top">
                        <span className="block font-bold text-slate-900">{row.breakdown[index].score}</span>
                        <span className="block text-xs text-slate-500">{row.breakdown[index].reason}</span>
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td className="px-4 py-3 font-semibold text-slate-800">Match score</td>
                  {compared.map((row) => <td key={row.provider.uuid} className="px-4 py-3"><MatchScore score={row.score} /></td>)}
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      <div className={`space-y-3 transition-opacity ${refreshing ? "opacity-60" : ""}`}>
        {result.data.length ? (
          result.data.map((row, index) => {
            const open = expanded.has(row.provider.uuid);
            const provider = row.provider;
            return (
              <section key={provider.uuid} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <input type="checkbox" className="mt-1.5" aria-label={`Compare ${provider.name}`} checked={compare.includes(provider.uuid)} onChange={() => toggleCompare(provider.uuid)} />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-400">#{index + 1}</p>
                      <h3 className="text-base font-bold text-slate-900">{provider.name}</h3>
                      <p className="text-xs text-slate-500">{providerTypeLabel(provider.providerType)} · Ticket {ticketRange(provider)} · {listText(provider.instruments)}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <MatchScore score={row.score} />
                    {row.opportunity ? (
                      <Link to={`/dashboard/capital/opportunities/${row.opportunity.uuid}`} className={buttonClass.secondary}>
                        {row.opportunity.reference} · {stageLabel(row.opportunity.stage)}
                      </Link>
                    ) : manager && request.matchable ? (
                      <button type="button" className={buttonClass.primary} onClick={() => begin(row)}>Select provider</button>
                    ) : null}
                  </div>
                </div>

                <p className="mt-3 text-sm text-slate-700">{row.explanation}</p>

                <button type="button" className={`${buttonClass.link} mt-2`} onClick={() => toggle(setExpanded, provider.uuid)} aria-expanded={open}>
                  {open ? "Hide score breakdown" : "Show score breakdown"}
                </button>

                {open ? (
                  <div className="mt-4 grid gap-6 border-t border-slate-100 pt-4 lg:grid-cols-2">
                    <Breakdown rows={row.breakdown} />
                    <dl className="grid content-start gap-3 text-sm sm:grid-cols-2">
                      <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sectors</dt><dd className="text-slate-800">{listText(provider.preferredSectors)}</dd></div>
                      <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Geographies</dt><dd className="text-slate-800">{listText(provider.preferredGeographies)}</dd></div>
                      <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Enterprise stages</dt><dd className="text-slate-800">{listText(provider.enterpriseStages)}</dd></div>
                      <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Impact themes</dt><dd className="text-slate-800">{listText(provider.impactThemes)}</dd></div>
                      <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Capital appetite</dt><dd className="text-slate-800">{provider.capitalAppetite ? human(provider.capitalAppetite) : "Not stated"}</dd></div>
                      {provider.contactName || provider.contactEmail ? (
                        <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Contact (confidential)</dt><dd className="text-slate-800">{[provider.contactName, provider.contactEmail, provider.contactPhone].filter(Boolean).join(" · ")}</dd></div>
                      ) : null}
                    </dl>
                  </div>
                ) : null}
              </section>
            );
          })
        ) : (
          <Empty>No active capital provider matches these filters.</Empty>
        )}
      </div>

      <Modal
        open={!!selecting}
        title={selecting ? `Select ${selecting.provider.name}` : ""}
        onClose={() => setSelecting(null)}
        footer={
          <>
            <button type="button" className={buttonClass.secondary} onClick={() => setSelecting(null)}>Cancel</button>
            <button type="button" className={buttonClass.primary} disabled={saving} onClick={submit}>{saving ? "Creating…" : "Create capital opportunity"}</button>
          </>
        }
      >
        {selecting ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              This creates a Capital Opportunity for {request.enterprise?.name} and {selecting.provider.name} with a {selecting.score}% match score. Nothing is shared with the provider until an introduction is approved.
            </p>

            {needsReason(selecting) || serverHint ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                <p className="mb-2 text-sm text-amber-900">
                  {serverHint || `${bestAvailable.provider.name} scores higher (${bestAvailable.score}% vs ${selecting.score}%). Choosing ${selecting.provider.name} is a manual override and is recorded with your reason.`}
                </p>
                <textarea rows={3} className={inputClass} value={form.overrideReason} onChange={(e) => setForm({ ...form, overrideReason: e.target.value })} placeholder="Why this provider?" />
              </div>
            ) : null}

            <Field label={`Potential financing (${request.currency})`}>
              <input className={inputClass} inputMode="numeric" value={form.potentialAmount ?? ""} onChange={(e) => setForm({ ...form, potentialAmount: e.target.value })} />
            </Field>

            <label className="flex items-start gap-2 text-sm text-slate-700">
              <input type="checkbox" className="mt-1" checked={form.createIntroduction} onChange={(e) => setForm({ ...form, createIntroduction: e.target.checked })} />
              <span>
                Make the introduction now
                <span className="block text-xs text-slate-500">Approves the introduction immediately and notifies both parties. Leave unticked to decide later.</span>
              </span>
            </label>

            {form.createIntroduction ? (
              <Field label="Introduction message (optional)">
                <textarea rows={3} className={inputClass} value={form.introductionMessage} onChange={(e) => setForm({ ...form, introductionMessage: e.target.value })} />
              </Field>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default ManageMatching;
