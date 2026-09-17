"use client";

import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { FaChartLine, FaCheckCircle, FaClock, FaMoneyBillWave, FaPlus, FaTimesCircle } from "react-icons/fa";
import { getMyCapitalRequests } from "@/controllers/capital_controller";
import Loader from "@/components/common/Loader";
import { Detail, Modal, buttonClass } from "@/components/capital/CapitalUI";
import { openDocument } from "@/components/capital/CapitalRecord";
import { CapitalRequestModal, EDITABLE, RequestDocumentModal } from "@/components/capital/EnterpriseCapitalForms";
import DeleteCapitalRequest, { ENTERPRISE_DELETABLE } from "@/components/capital/DeleteCapitalRequest";
import { EmptyState, RaiseHero, SoftTable, StatFilterCard, StatusPill, lightButton, pageClass, primaryButton } from "@/components/capital/RaiseCapitalUI";
import { documentCategoryLabel, financingLabel, human, money, providerTypeLabel, readinessLabel, requestStatusLabel, shortDate } from "@/utils/capital_labels";
import { timeAgo } from "@/utils/time_ago";

// How an application's many statuses group for the startup.
const GROUPS = {
  pending: ["draft", "submitted", "under_review", "more_information_required", "on_hold"],
  in_progress: ["approved_for_matching", "matching_in_progress", "capital_provider_identified", "introduction_pending", "introduction_approved", "capital_provider_engaged", "due_diligence", "negotiation"],
  approved: ["commitment_secured", "partially_funded", "fully_funded", "disbursed"],
  rejected: ["declined", "closed"],
};
const TONES = { pending: "yellow", in_progress: "blue", approved: "green", rejected: "red" };
const groupOf = (status) => Object.keys(GROUPS).find((key) => GROUPS[key].includes(status)) || "pending";

// Raise Capital › Investment Applications: the startup's requests for capital,
// each reviewed by Anza before it is matched to investors.
const CapitalApplications = () => {
  const [result, setResult] = useState(null);
  const [filter, setFilter] = useState("all");
  const [viewing, setViewing] = useState(null);
  const [editing, setEditing] = useState(null);
  const [uploadFor, setUploadFor] = useState(null);

  const load = useCallback(async () => {
    const response = await getMyCapitalRequests();
    if (response?.status === false) {
      toast.error(response.message || "Failed to load your applications");
      setResult({ business: null, data: [] });
    } else {
      setResult(response.body);
      setViewing((current) => (current ? response.body.data.find((row) => row.uuid === current.uuid) || null : null));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!result) return <Loader />;

  const applications = result.data;
  const count = (group) => applications.filter((row) => groupOf(row.status) === group).length;
  const filtered = filter === "all" ? applications : applications.filter((row) => groupOf(row.status) === filter);
  const actionNeeded = applications.filter((row) => row.status === "more_information_required");

  if (!result.business) {
    return (
      <div className={pageClass}>
        <div className="mx-auto max-w-7xl">
          <RaiseHero badge="Investment Applications" title="Track Your Investment Requests" description="Tell Anza how much capital you need and what it is for." />
          <EmptyState title="Complete your business profile first" action={<Link to="/dashboard/entreprenuer-profile" className={primaryButton}>Complete profile</Link>}>
            Anza needs your business profile before it can review an investment application.
          </EmptyState>
        </div>
      </div>
    );
  }

  return (
    <div className={pageClass}>
      <div className="mx-auto max-w-7xl">
        <RaiseHero
          badge="Investment Applications"
          title="Track Your Investment Requests"
          description="Apply for capital, follow each application through Anza's review and matching, and see when investors commit."
          highlights={[
            { icon: FaMoneyBillWave, label: `${applications.length} Applications` },
            { icon: FaCheckCircle, label: `${count("approved")} Funded` },
            { icon: FaChartLine, label: "Investment Tracking" },
          ]}
        >
          <button type="button" className={lightButton} onClick={() => setEditing("new")}><FaPlus /> New Application</button>
        </RaiseHero>

        {actionNeeded.length ? (
          <div className="mb-6 rounded-2xl border border-yellow-200 bg-yellow-50 px-5 py-4 text-sm text-yellow-900">
            Anza needs more information on {actionNeeded.map((row) => row.reference).join(", ")}. Open the application to update and resubmit it.
          </div>
        ) : null}

        <section className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-5">
          <StatFilterCard value={applications.length} label="All Applications" icon={FaMoneyBillWave} accent="blue" active={filter === "all"} onClick={() => setFilter("all")} />
          <StatFilterCard value={count("pending")} label="Pending" icon={FaClock} accent="yellow" active={filter === "pending"} onClick={() => setFilter("pending")} />
          <StatFilterCard value={count("in_progress")} label="In progress" icon={FaChartLine} accent="indigo" active={filter === "in_progress"} onClick={() => setFilter("in_progress")} />
          <StatFilterCard value={count("approved")} label="Funded" icon={FaCheckCircle} accent="green" active={filter === "approved"} onClick={() => setFilter("approved")} />
          <StatFilterCard value={count("rejected")} label="Rejected" icon={FaTimesCircle} accent="red" active={filter === "rejected"} onClick={() => setFilter("rejected")} />
        </section>

        <div className="mb-6">
          <h2 className="text-3xl font-bold text-[#101828]">My Applications</h2>
        </div>

        {filtered.length ? (
          <SoftTable
            rows={filtered}
            columns={[
              { key: "application", label: "Application", render: (row) => <><p className="text-sm font-semibold text-[#101828]">{row.reference}</p><p className="text-xs text-[#667085]">{financingLabel(row.financingType)}</p></> },
              { key: "amount", label: "Amount", render: (row) => <span className="text-sm font-bold text-[#2563EB]">{money(row.amountRequested, row.currency)}</span> },
              { key: "status", label: "Status", render: (row) => <StatusPill tone={row.status === "more_information_required" ? "yellow" : TONES[groupOf(row.status)]}>{row.status === "more_information_required" ? "Action needed" : requestStatusLabel(row.status)}</StatusPill> },
              { key: "date", label: "Date", render: (row) => timeAgo(row.submittedAt || row.updatedAt) },
              { key: "action", label: "Action", align: "right", render: (row) => <button type="button" className={primaryButton} onClick={() => setViewing(row)}>View details</button> },
            ]}
          />
        ) : (
          <EmptyState
            title={applications.length ? "No applications with this status" : "No applications yet"}
            action={applications.length ? null : <button type="button" className={primaryButton} onClick={() => setEditing("new")}><FaPlus /> New Application</button>}
          >
            {applications.length ? null : "Apply for capital and Anza will review it and introduce you to investors that fit."}
          </EmptyState>
        )}
      </div>

      <Modal
        open={!!viewing}
        wide
        title={viewing ? `${viewing.reference} · ${money(viewing.amountRequested, viewing.currency)}` : ""}
        onClose={() => setViewing(null)}
        footer={
          viewing ? (
            <>
              {ENTERPRISE_DELETABLE.includes(viewing.status) ? (
                <DeleteCapitalRequest
                  request={viewing}
                  mode="enterprise"
                  onDeleted={() => {
                    setViewing(null);
                    load();
                  }}
                />
              ) : null}
              <button type="button" className={buttonClass.secondary} onClick={() => setUploadFor(viewing)}>Upload document</button>
              {EDITABLE.includes(viewing.status) ? <button type="button" className={buttonClass.success} onClick={() => setEditing(viewing)}>{viewing.status === "draft" ? "Edit and submit" : "Update and resubmit"}</button> : null}
            </>
          ) : null
        }
      >
        {viewing ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill tone={TONES[groupOf(viewing.status)]}>{requestStatusLabel(viewing.status)}</StatusPill>
              <span className="text-xs text-slate-500">{viewing.submittedAt ? `Submitted ${shortDate(viewing.submittedAt)}` : "Not submitted yet"}</span>
            </div>
            {viewing.status === "more_information_required" && viewing.infoRequest ? <p className="rounded-xl bg-yellow-50 px-4 py-3 text-sm text-yellow-900"><strong>Anza needs:</strong> {viewing.infoRequest}</p> : null}
            {viewing.recommendations ? <p className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-900"><strong>Anza recommends:</strong> {viewing.recommendations}</p> : null}
            {viewing.status === "declined" && viewing.declineReason ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800"><strong>Not taken forward:</strong> {viewing.declineReason}</p> : null}
            <dl className="grid gap-4 sm:grid-cols-3">
              <Detail label="Type of financing">{financingLabel(viewing.financingType)}</Detail>
              <Detail label="Capital readiness">{readinessLabel(viewing.readinessStatus)}</Detail>
              <Detail label="Annual revenue">{viewing.currentRevenue !== null && viewing.currentRevenue !== undefined ? money(viewing.currentRevenue, viewing.revenueCurrency || viewing.currency) : null}</Detail>
              <Detail label="Preferred investors">{(viewing.preferredProviderTypes || []).map(providerTypeLabel).join(", ")}</Detail>
              <Detail label="Founder gender">{viewing.founderGender ? human(viewing.founderGender) : null}</Detail>
              <Detail label="Youth-led">{viewing.youthLed === null || viewing.youthLed === undefined ? null : viewing.youthLed ? "Yes" : "No"}</Detail>
            </dl>
            <dl className="space-y-4">
              <Detail label="What the funding is for"><span className="whitespace-pre-wrap">{viewing.purpose}</span></Detail>
              <Detail label="Traction"><span className="whitespace-pre-wrap">{viewing.traction}</span></Detail>
            </dl>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Documents</p>
              {viewing.documents.length ? (
                <ul className="flex flex-wrap gap-2">
                  {viewing.documents.map((doc) => (
                    <li key={doc.uuid}><button type="button" className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700 hover:bg-slate-200" onClick={() => openDocument(doc)}>{doc.title} · {documentCategoryLabel(doc.category)}</button></li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">No documents yet. A pitch deck and financial statements help Anza match you faster.</p>
              )}
            </div>
          </div>
        ) : null}
      </Modal>

      <CapitalRequestModal
        open={!!editing}
        request={editing === "new" ? null : editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          load();
        }}
      />
      <RequestDocumentModal
        request={uploadFor}
        onClose={() => setUploadFor(null)}
        onUploaded={() => {
          setUploadFor(null);
          load();
        }}
      />
    </div>
  );
};

export default CapitalApplications;
