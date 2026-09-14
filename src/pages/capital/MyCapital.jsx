"use client";

import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { FaChartLine, FaCheckCircle, FaHandshake, FaMoneyBillWave, FaTimesCircle } from "react-icons/fa";
import { getMyCapitalOpportunities, getMyIntroductions } from "@/controllers/capital_controller";
import Loader from "@/components/common/Loader";
import { Tabs } from "@/components/capital/CapitalUI";
import { DocumentsPanel, DueDiligencePanel, ThreadsPanel } from "@/components/capital/CapitalPanels";
import { EmptyState, RaiseHero, SoftTable, StatFilterCard, StatusPill, pageClass, primaryButton } from "@/components/capital/RaiseCapitalUI";
import { dateTime, human, modeLabel, money, outcomeLabel, stageLabel } from "@/utils/capital_labels";
import { timeAgo } from "@/utils/time_ago";

const TONES = { active: "blue", won: "green", lost: "red", closed: "gray" };

// One deal, as the startup works on it with the investor and Anza.
const DealWorkspace = ({ deal }) => {
  const [tab, setTab] = useState("messages");
  return (
    <section className="mt-8 overflow-hidden rounded-3xl border border-[#EAECF0] bg-white shadow-sm">
      <div className="border-b border-[#EAECF0] px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#667085]">{deal.reference}</p>
        <h3 className="text-xl font-bold text-[#101828]">{deal.counterpart.name}</h3>
        <div className="mt-3 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div><p className="text-xs font-semibold uppercase text-[#667085]">Stage</p><p className="text-[#101828]">{stageLabel(deal.stage)}</p></div>
          <div><p className="text-xs font-semibold uppercase text-[#667085]">Communication</p><p className="text-[#101828]">{modeLabel(deal.communicationMode)}{deal.communicationPaused ? " (paused by Anza)" : ""}</p></div>
          <div><p className="text-xs font-semibold uppercase text-[#667085]">Investor contact</p><p className="text-[#101828]">{[deal.counterpart.contactName, deal.counterpart.contactEmail, deal.counterpart.contactPhone].filter(Boolean).join(" · ") || "—"}</p></div>
          <div><p className="text-xs font-semibold uppercase text-[#667085]">Meeting</p><p className="text-[#101828]">{deal.meetingAt ? dateTime(deal.meetingAt) : "None scheduled"}</p></div>
        </div>
      </div>
      <div className="p-6">
        <Tabs tabs={[{ key: "messages", label: "Messages" }, { key: "documents", label: deal.dealRoom ? "Deal room" : "Documents" }, { key: "duediligence", label: "Due diligence" }]} active={tab} onChange={setTab} />
        {tab === "messages" ? <ThreadsPanel opportunityUuid={deal.uuid} /> : null}
        {tab === "documents" ? <DocumentsPanel opportunityUuid={deal.uuid} /> : null}
        {tab === "duediligence" ? <DueDiligencePanel opportunityUuid={deal.uuid} /> : null}
      </div>
    </section>
  );
};

// Raise Capital › My Deals: every opportunity Anza has opened between the
// startup and an investor, and the place to work on each one.
const MyCapital = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [deals, setDeals] = useState(null);
  const [decisions, setDecisions] = useState(0);
  const [filter, setFilter] = useState("all");

  const load = useCallback(async () => {
    const [opportunities, introductions] = await Promise.all([getMyCapitalOpportunities(), getMyIntroductions()]);
    if (opportunities?.status === false) {
      toast.error(opportunities.message || "Failed to load your deals");
      setDeals([]);
    } else {
      setDeals(opportunities.body.data || []);
    }
    if (introductions?.status !== false) setDecisions((introductions.body.data || []).filter((row) => row.awaitingMyPermission).length);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!deals) return <Loader />;

  const selectedUuid = params.get("deal");
  const selected = deals.find((row) => row.uuid === selectedUuid) || null;
  const select = (uuid) => setParams(uuid ? { deal: uuid } : {}, { replace: true });
  const count = (status) => deals.filter((row) => row.status === status).length;
  const filtered = filter === "all" ? deals : deals.filter((row) => (filter === "closed" ? ["lost", "closed"].includes(row.status) : row.status === filter));
  const committed = deals.filter((row) => Number(row.amountCommitted) > 0);

  return (
    <div className={pageClass}>
      <div className="mx-auto max-w-7xl">
        <RaiseHero
          badge="My Deals"
          title="Work With Your Investors"
          description="Once Anza approves an introduction, the deal opens here: message the investor, share documents, complete due diligence and follow it to commitment."
          highlights={[
            { icon: FaHandshake, label: `${deals.length} Deals` },
            { icon: FaCheckCircle, label: `${committed.length} Committed` },
            { icon: FaChartLine, label: "Deal Tracking" },
          ]}
        />

        {decisions ? (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-yellow-200 bg-yellow-50 px-5 py-4 text-sm text-yellow-900">
            <span>{decisions === 1 ? "An investor is" : `${decisions} investors are`} waiting for your decision on sharing your information.</span>
            <button type="button" className="font-semibold underline" onClick={() => navigate("/dashboard/capital/interested-investors")}>Review now</button>
          </div>
        ) : null}

        <section className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-4">
          <StatFilterCard value={deals.length} label="All Deals" icon={FaMoneyBillWave} accent="blue" active={filter === "all"} onClick={() => setFilter("all")} />
          <StatFilterCard value={count("active")} label="In progress" icon={FaChartLine} accent="indigo" active={filter === "active"} onClick={() => setFilter("active")} />
          <StatFilterCard value={count("won")} label="Capital secured" icon={FaCheckCircle} accent="green" active={filter === "won"} onClick={() => setFilter("won")} />
          <StatFilterCard value={count("lost") + count("closed")} label="Closed" icon={FaTimesCircle} accent="red" active={filter === "closed"} onClick={() => setFilter("closed")} />
        </section>

        <div className="mb-6">
          <h2 className="text-3xl font-bold text-[#101828]">My Deals</h2>
        </div>

        {filtered.length ? (
          <SoftTable
            rows={filtered}
            columns={[
              { key: "investor", label: "Investor", render: (row) => <><p className="text-sm font-semibold text-[#101828]">{row.counterpart.name}</p><p className="text-xs text-[#667085]">{row.reference}</p></> },
              { key: "stage", label: "Stage", render: (row) => <span className="text-sm text-[#344054]">{stageLabel(row.stage)}</span> },
              { key: "amount", label: "Investment", render: (row) => <span className="text-sm font-bold text-[#2563EB]">{Number(row.amountCommitted) > 0 ? `${money(row.amountCommitted, row.currency)} committed` : money(row.potentialAmount, row.currency)}</span> },
              { key: "status", label: "Status", render: (row) => <StatusPill tone={TONES[row.status]}>{row.outcome ? outcomeLabel(row.outcome) : human(row.status)}</StatusPill> },
              { key: "date", label: "Last activity", render: (row) => timeAgo(row.lastActivityAt) },
              { key: "action", label: "Action", align: "right", render: (row) => <button type="button" className={primaryButton} onClick={() => select(row.uuid === selectedUuid ? null : row.uuid)}>{row.uuid === selectedUuid ? "Close" : "Open deal"}</button> },
            ]}
          />
        ) : (
          <EmptyState
            title={deals.length ? "No deals with this status" : "No deals yet"}
            action={deals.length ? null : <button type="button" className={primaryButton} onClick={() => navigate("/dashboard/capital/investors")}>Browse investors</button>}
          >
            {deals.length ? null : "A deal opens when Anza approves an introduction between you and an investor."}
          </EmptyState>
        )}

        {selected ? <DealWorkspace key={selected.uuid} deal={selected} /> : null}
      </div>
    </div>
  );
};

export default MyCapital;
