"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FaExclamationTriangle, FaFlag } from "react-icons/fa";
import { getCapitalOptions, getPipeline, moveOpportunityStage } from "@/controllers/capital_controller";
import { CapitalHero, Field, FilterBar, inputClass, LoadingBlock, MatchScore, Modal, Select, buttonClass } from "@/components/capital/CapitalUI";
import useCapitalAccess from "@/components/capital/useCapitalAccess";
import { STAGE_LABELS, financingLabel, money, shortDate, stageLabel } from "@/utils/capital_labels";

const STAGES = Object.keys(STAGE_LABELS);
const at = (stage) => STAGES.indexOf(stage);
const STALE_DAYS = 14;
const EMPTY = { programme: "", provider: "", sector: "", financingType: "", manager: "", status: "" };

const idleDays = (value) => (value ? Math.floor((Date.now() - new Date(value).getTime()) / 86400000) : null);

// The rules a drop must satisfy before it is sent; the API checks them again.
const blockers = (card, target) => {
  const problems = [];
  if (card.status !== "active") problems.push("A closed opportunity cannot be moved; reopen it first");
  if (at(target) >= at("provider_interest") && !card.introductionApproved) problems.push("An introduction must be approved before the provider can engage");
  return problems;
};

const needsFigures = (card, target) => at(target) >= at("commitment") && (!(Number(card.amountCommitted) > 0) || at(target) >= at("capital_secured") || (target === "post_financing" && !(Number(card.amountDisbursed) > 0)));

const CapitalPipeline = () => {
  const navigate = useNavigate();
  const { can } = useCapitalAccess();
  const [options, setOptions] = useState(null);
  const [filters, setFilters] = useState(EMPTY);
  const [board, setBoard] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [over, setOver] = useState(null);
  const [pending, setPending] = useState(null);
  const [figures, setFigures] = useState({});
  const [saving, setSaving] = useState(false);
  const latest = useRef(0);

  useEffect(() => {
    getCapitalOptions().then((response) => response?.status && setOptions(response.body));
  }, []);

  const load = useCallback(async () => {
    const request = ++latest.current;
    const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value));
    const response = await getPipeline(params);
    if (request !== latest.current) return;
    if (response?.status === false) toast.error(response.message || "Failed to load the pipeline");
    else setBoard(response.body.stages);
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  const movable = can("capital.opportunities.manage");
  const set = (key) => (value) => setFilters((prev) => ({ ...prev, [key]: value }));

  const send = async (card, target, extra = {}) => {
    setSaving(true);
    const response = await moveOpportunityStage(card.uuid, { stage: target, ...extra });
    setSaving(false);
    if (response?.status === false) {
      toast.error(response.errors?.length ? response.errors.join(". ") : response.message || "The opportunity could not be moved");
      return false;
    }
    toast.success(`${card.reference} moved to ${stageLabel(target)}`);
    setPending(null);
    load();
    return true;
  };

  const drop = (target) => {
    const card = dragging;
    setDragging(null);
    setOver(null);
    if (!card || card.stage === target) return;

    const problems = blockers(card, target);
    if (problems.length) {
      toast.error(problems[0]);
      return;
    }
    if (needsFigures(card, target)) {
      setFigures({ amountCommitted: card.amountCommitted || "", dateCommitted: "", amountDisbursed: card.amountDisbursed || "", dateDisbursed: "" });
      setPending({ card, target });
      return;
    }
    send(card, target);
  };

  if (!board) return <LoadingBlock label="Loading the capital pipeline…" />;

  return (
    <div className="min-h-screen px-4 py-4 md:px-6">
      <CapitalHero
        title="Capital Pipeline"
        description={`Every capital opportunity by stage. ${movable ? "Drag a card to move it; moves that break a rule - like engaging a provider before an approved introduction - are refused." : "You can view the pipeline; moving cards needs the manage-opportunities permission."}`}
      />

      <FilterBar onReset={() => setFilters(EMPTY)}>
        <Field label="Programme" className="w-44"><Select value={filters.programme} onChange={set("programme")} placeholder="All" options={options?.programmes || []} getValue={(o) => o.uuid} getLabel={(o) => o.title} /></Field>
        <Field label="Capital provider" className="w-44"><Select value={filters.provider} onChange={set("provider")} placeholder="All" options={options?.providers || []} getValue={(o) => o.uuid} getLabel={(o) => o.name} /></Field>
        <Field label="Sector" className="w-40"><Select value={filters.sector} onChange={set("sector")} placeholder="All" options={options?.sectors || []} getValue={(o) => o.name} getLabel={(o) => o.name} /></Field>
        <Field label="Financing type" className="w-44"><Select value={filters.financingType} onChange={set("financingType")} placeholder="All" options={(options?.financingTypes || []).map((v) => ({ value: v, label: financingLabel(v) }))} /></Field>
        <Field label="Manager" className="w-40"><Select value={filters.manager} onChange={set("manager")} placeholder="All" options={options?.managers || []} getValue={(o) => o.uuid} getLabel={(o) => o.name} /></Field>
        <Field label="Status" className="w-36"><Select value={filters.status} onChange={set("status")} placeholder="Active and won" options={[{ value: "active", label: "Active" }, { value: "won", label: "Won" }, { value: "lost", label: "Lost" }, { value: "closed", label: "Closed" }]} /></Field>
      </FilterBar>

      <div className="overflow-x-auto pb-4">
        <div className="flex min-w-max gap-3">
          {board.map((column) => {
            const blocked = dragging && dragging.stage !== column.stage && blockers(dragging, column.stage).length > 0;
            return (
              <section
                key={column.stage}
                onDragOver={(event) => {
                  if (!dragging) return;
                  event.preventDefault();
                  setOver(column.stage);
                }}
                onDragLeave={() => setOver((current) => (current === column.stage ? null : current))}
                onDrop={(event) => {
                  event.preventDefault();
                  drop(column.stage);
                }}
                className={`flex w-72 shrink-0 flex-col rounded-2xl border bg-slate-50 transition ${over === column.stage ? (blocked ? "border-rose-300 bg-rose-50" : "border-[#082d77] bg-blue-50/50") : "border-slate-200"}`}
              >
                <header className="flex items-center justify-between gap-2 border-b border-slate-200 px-3 py-2.5">
                  <h2 className="text-sm font-bold text-slate-800">{stageLabel(column.stage)}</h2>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-600">{column.count}</span>
                </header>
                <ul className="flex max-h-[70vh] min-h-[120px] flex-col gap-2 overflow-y-auto p-2">
                  {column.items.map((card) => {
                    const idle = idleDays(card.lastActivityAt);
                    const stale = card.status === "active" && idle !== null && idle >= STALE_DAYS;
                    return (
                      <li
                        key={card.uuid}
                        draggable={movable}
                        onDragStart={(event) => {
                          event.dataTransfer.effectAllowed = "move";
                          event.dataTransfer.setData("text/plain", card.uuid);
                          setDragging(card);
                        }}
                        onDragEnd={() => {
                          setDragging(null);
                          setOver(null);
                        }}
                        onClick={() => navigate(`/dashboard/capital/opportunities/${card.uuid}`)}
                        className={`cursor-pointer rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-[#082d77]/40 ${movable ? "active:cursor-grabbing" : ""} ${dragging?.uuid === card.uuid ? "opacity-50" : ""}`}
                      >
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-[#082d77]">{card.reference}</span>
                          <span className="flex items-center gap-1.5 text-xs">
                            {card.escalated ? <FaExclamationTriangle className="text-rose-600" title="Escalated" /> : null}
                            {(card.flags || []).length ? <FaFlag className="text-amber-600" title={`${card.flags.length} flag(s)`} /> : null}
                            {card.status !== "active" ? <span className="rounded bg-slate-100 px-1.5 text-[10px] font-semibold uppercase text-slate-600">{card.status}</span> : null}
                          </span>
                        </div>
                        <p className="truncate text-sm font-semibold text-slate-900" title={card.enterprise?.name}>{card.enterprise?.name}</p>
                        <p className="truncate text-xs text-slate-500" title={card.provider?.name}>{card.provider?.name}</p>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-slate-800">{money(card.amountCommitted || card.potentialAmount, card.currency)}</span>
                          <MatchScore score={card.matchScore} showLabel={false} />
                        </div>
                        <p className="mt-1 text-[11px] text-slate-500">Probability {card.probability ?? 0}%{card.introductionApproved ? "" : " · not introduced"}</p>
                        {card.nextAction ? <p className="mt-1 line-clamp-2 text-[11px] text-slate-600">Next: {card.nextAction}{card.nextActionDate ? ` (${shortDate(card.nextActionDate)})` : ""}</p> : null}
                        {stale ? <p className="mt-1 text-[11px] font-semibold text-amber-700">No activity for {idle} days</p> : null}
                        {card.assignedManager ? <p className="mt-1 text-[10px] text-slate-400">{card.assignedManager.name}</p> : null}
                      </li>
                    );
                  })}
                  {!column.items.length ? <li className="px-2 py-6 text-center text-xs text-slate-400">No opportunities</li> : null}
                </ul>
              </section>
            );
          })}
        </div>
      </div>

      <Modal
        open={!!pending}
        title={pending ? `Move ${pending.card.reference} to ${stageLabel(pending.target)}` : ""}
        onClose={() => setPending(null)}
        footer={
          <>
            <button type="button" className={buttonClass.secondary} onClick={() => setPending(null)}>Cancel</button>
            <button type="button" className={buttonClass.primary} disabled={saving} onClick={() => send(pending.card, pending.target, figures)}>{saving ? "Moving…" : "Move"}</button>
          </>
        }
      >
        {pending ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">This stage needs the financing figures. Leave a date blank if it is already recorded on the opportunity.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={`Amount committed (${pending.card.currency})`}><input className={inputClass} inputMode="numeric" value={figures.amountCommitted} onChange={(e) => setFigures({ ...figures, amountCommitted: e.target.value })} /></Field>
              <Field label="Date committed"><input type="date" className={inputClass} value={figures.dateCommitted} onChange={(e) => setFigures({ ...figures, dateCommitted: e.target.value })} /></Field>
              {at(pending.target) >= at("disbursement") ? (
                <>
                  <Field label={`Amount disbursed (${pending.card.currency})`}><input className={inputClass} inputMode="numeric" value={figures.amountDisbursed} onChange={(e) => setFigures({ ...figures, amountDisbursed: e.target.value })} /></Field>
                  <Field label="Date disbursed"><input type="date" className={inputClass} value={figures.dateDisbursed} onChange={(e) => setFigures({ ...figures, dateDisbursed: e.target.value })} /></Field>
                </>
              ) : null}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default CapitalPipeline;
