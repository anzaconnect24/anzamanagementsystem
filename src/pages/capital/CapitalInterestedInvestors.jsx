"use client";

import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FaChartLine, FaCheckCircle, FaClock, FaMoneyBillWave, FaTimesCircle, FaUserTie } from "react-icons/fa";
import { getMyIntroductions, respondToInformationRequest } from "@/controllers/capital_controller";
import Loader from "@/components/common/Loader";
import { EmptyState, RaiseHero, SoftTable, StatFilterCard, StatusPill, dangerButton, pageClass, primaryButton, successButton } from "@/components/capital/RaiseCapitalUI";
import { dateTime, introductionTypeLabel, providerTypeLabel } from "@/utils/capital_labels";
import { timeAgo } from "@/utils/time_ago";

const GROUPS = {
  waiting: ["pending_review", "changes_requested", "clarification_requested", "awaiting_enterprise_permission"],
  accepted: ["approved", "scheduled"],
  rejected: ["declined", "permission_denied", "replaced"],
};
const groupOf = (status) => Object.keys(GROUPS).find((key) => GROUPS[key].includes(status)) || "waiting";

const statusText = (row) => {
  if (row.awaitingMyPermission) return { tone: "yellow", label: "Needs your decision" };
  if (row.status === "scheduled") return { tone: "green", label: "Meeting scheduled" };
  if (row.status === "approved") return { tone: "green", label: "Introduced" };
  if (row.status === "permission_denied") return { tone: "red", label: "You declined" };
  if (row.status === "replaced") return { tone: "gray", label: "Redirected by Anza" };
  if (row.status === "declined") return { tone: "red", label: "Declined" };
  if (row.status === "changes_requested" || row.status === "clarification_requested") return { tone: "yellow", label: "Anza has a question" };
  return { tone: "yellow", label: "With Anza for review" };
};

const requestText = (row) => {
  if (row.initiatedBy === "provider") return row.requestType === "introduction" ? "Wants to meet you" : `Asks for your ${introductionTypeLabel(row.requestType).toLowerCase()}`;
  if (row.initiatedBy === "manager") return "Introduced by Anza";
  return "You asked for an introduction";
};

// Raise Capital › Interested Investors: investors who want to meet the startup
// or see its information, and the introductions it asked for. Anza reviews
// every one; the startup decides whether its own information is shared.
const CapitalInterestedInvestors = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState(null);
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState(null);

  const load = useCallback(async () => {
    const response = await getMyIntroductions();
    if (response?.status === false) {
      toast.error(response.message || "Failed to load interested investors");
      setRows([]);
    } else {
      setRows(response.body.data || []);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const decide = async (row, decision) => {
    setBusy(row.uuid);
    const response = await respondToInformationRequest(row.uuid, { decision });
    setBusy(null);
    if (response?.status === false) return toast.error(response.message || "Failed to record your decision");
    toast.success(decision === "granted" ? "Accepted. Anza will share it through the introduction." : "Rejected. Nothing will be shared.");
    load();
  };

  if (!rows) return <Loader />;

  const count = (group) => rows.filter((row) => groupOf(row.status) === group).length;
  const filtered = filter === "all" ? rows : rows.filter((row) => groupOf(row.status) === filter);
  const decisions = rows.filter((row) => row.awaitingMyPermission).length;

  return (
    <div className={pageClass}>
      <div className="mx-auto max-w-7xl">
        <RaiseHero
          badge="Interested Investors"
          title="Manage Investor Interest"
          image="/images/general_resources_hero.svg"
          description="See which investors want to meet you or see your information, and the introductions you asked for. Anza reviews each one, and nothing of yours is shared without your agreement."
          highlights={[
            { icon: FaUserTie, label: `${new Set(rows.map((row) => row.provider?.uuid)).size} Investors` },
            { icon: FaCheckCircle, label: `${count("accepted")} Introduced` },
            { icon: FaChartLine, label: "Investment Tracking" },
          ]}
        />

        {decisions ? (
          <div className="mb-6 rounded-2xl border border-yellow-200 bg-yellow-50 px-5 py-4 text-sm text-yellow-900">
            {decisions === 1 ? "An investor is" : `${decisions} investors are`} waiting for your decision on sharing your information.
          </div>
        ) : null}

        <section className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-4">
          <StatFilterCard value={rows.length} label="Total Applications" icon={FaMoneyBillWave} accent="blue" active={filter === "all"} onClick={() => setFilter("all")} />
          <StatFilterCard value={count("waiting")} label="Pending Review" icon={FaClock} accent="yellow" active={filter === "waiting"} onClick={() => setFilter("waiting")} />
          <StatFilterCard value={count("accepted")} label="Accepted" icon={FaCheckCircle} accent="green" active={filter === "accepted"} onClick={() => setFilter("accepted")} />
          <StatFilterCard value={count("rejected")} label="Rejected" icon={FaTimesCircle} accent="red" active={filter === "rejected"} onClick={() => setFilter("rejected")} />
        </section>

        {filtered.length ? (
          <SoftTable
            rows={filtered}
            columns={[
              {
                key: "investor",
                label: "Investor",
                render: (row) => (
                  <>
                    <p className="text-sm font-semibold text-[#101828]">{row.provider?.name || "Unknown Investor"}</p>
                    <p className="text-xs text-[#667085]">{row.provider?.contactEmail ? [row.provider.contactName, row.provider.contactEmail, row.provider.contactPhone].filter(Boolean).join(" · ") : providerTypeLabel(row.provider?.providerType)}</p>
                  </>
                ),
              },
              { key: "request", label: "Request", render: (row) => <span className="text-sm text-[#344054]">{requestText(row)}</span> },
              {
                key: "status",
                label: "Status",
                nowrap: false,
                render: (row) => {
                  const status = statusText(row);
                  return (
                    <>
                      <StatusPill tone={status.tone}>{status.label}</StatusPill>
                      {row.reviewNote ? <p className="mt-1 max-w-xs text-xs text-[#667085]">Anza: {row.reviewNote}</p> : null}
                      {row.scheduledAt ? <p className="mt-1 text-xs text-green-700">{dateTime(row.scheduledAt)}</p> : null}
                    </>
                  );
                },
              },
              { key: "date", label: "Date", render: (row) => timeAgo(row.createdAt) },
              {
                key: "actions",
                label: "Actions",
                align: "right",
                render: (row) =>
                  row.awaitingMyPermission ? (
                    <div className="flex justify-end gap-2">
                      <button type="button" disabled={busy === row.uuid} onClick={() => decide(row, "granted")} className={successButton}>{busy === row.uuid ? "Loading..." : "Accept"}</button>
                      <button type="button" disabled={busy === row.uuid} onClick={() => decide(row, "denied")} className={dangerButton}>{busy === row.uuid ? "Loading..." : "Reject"}</button>
                    </div>
                  ) : row.opportunity ? (
                    <button type="button" className={primaryButton} onClick={() => navigate(`/dashboard/capital?deal=${row.opportunity.uuid}`)}>Open deal</button>
                  ) : (
                    <StatusPill tone={groupOf(row.status) === "rejected" ? "red" : "gray"}>{groupOf(row.status) === "rejected" ? "Closed" : "Waiting"}</StatusPill>
                  ),
              },
            ]}
          />
        ) : (
          <EmptyState
            title={rows.length ? "Nothing with this status" : "No investor interest yet"}
            action={rows.length ? null : <button type="button" className={primaryButton} onClick={() => navigate("/dashboard/capital/investors")}>Browse investors</button>}
          >
            {rows.length ? null : "When an investor shows interest in your business, or you ask Anza for an introduction, it appears here."}
          </EmptyState>
        )}
      </div>
    </div>
  );
};

export default CapitalInterestedInvestors;
