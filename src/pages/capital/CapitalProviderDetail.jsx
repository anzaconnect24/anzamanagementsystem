"use client";

import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { getCapitalProvider, listCapitalNotes } from "@/controllers/capital_controller";
import { CapitalHero, Card, DataTable, Detail, Empty, LoadingBlock, MatchScore, StatusChip, buttonClass } from "@/components/capital/CapitalUI";
import { NotesPanel } from "@/components/capital/CapitalRecord";
import ProviderForm from "@/components/capital/ProviderForm";
import useCapitalAccess from "@/components/capital/useCapitalAccess";
import { financingLabel, human, money, outcomeLabel, providerTypeLabel, shortDate, stageLabel } from "@/utils/capital_labels";

const list = (value) => (Array.isArray(value) && value.length ? value.join(", ") : null);

const CapitalProviderDetail = () => {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const { can } = useCapitalAccess();
  const [provider, setProvider] = useState(null);
  const [missing, setMissing] = useState(null);
  const [notes, setNotes] = useState([]);
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => {
    const response = await getCapitalProvider(uuid);
    if (response?.status === false) setMissing(response.message || "Capital provider not found");
    else setProvider(response.body);
  }, [uuid]);

  const loadNotes = useCallback(async () => {
    const response = await listCapitalNotes("provider", uuid);
    if (response?.status) setNotes(response.body.data);
  }, [uuid]);

  useEffect(() => {
    load();
  }, [load]);

  const notesAllowed = can("capital.notes.manage");
  useEffect(() => {
    if (notesAllowed) loadNotes();
  }, [notesAllowed, loadNotes]);

  if (missing) return <div className="p-6"><Empty action={<Link to="/dashboard/capital/providers" className={buttonClass.secondary}>All capital providers</Link>}>{missing}</Empty></div>;
  if (!provider) return <LoadingBlock label="Loading the capital provider…" />;

  const ticket = provider.minTicketUsd || provider.maxTicketUsd ? `${provider.minTicketUsd ? money(provider.minTicketUsd) : "Any"} – ${provider.maxTicketUsd ? money(provider.maxTicketUsd) : "any"}` : null;

  return (
    <div className="min-h-screen px-4 py-4 md:px-6">
      <CapitalHero badge={`Capital Provider · ${providerTypeLabel(provider.providerType)}`} title={provider.name} description={provider.financingCriteria || provider.eligibilityCriteria || "What this provider finances and for whom."}>
        {can("capital.providers.manage") ? <button type="button" className={buttonClass.success} onClick={() => setEditing(true)}>Edit provider</button> : null}
      </CapitalHero>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card title="Financing profile" className="xl:col-span-2">
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Detail label="Status"><StatusChip value={provider.status === "active" ? "active" : "closed"} label={human(provider.status)} /></Detail>
            <Detail label="Ticket size (USD)">{ticket}</Detail>
            <Detail label="Min annual revenue">{provider.minAnnualRevenueUsd ? money(provider.minAnnualRevenueUsd) : null}</Detail>
            <Detail label="Instruments">{(provider.instruments || []).map(financingLabel).join(", ")}</Detail>
            <Detail label="Capital appetite">{provider.capitalAppetite ? human(provider.capitalAppetite) : null}</Detail>
            <Detail label="Application window">{provider.applicationWindowOpens || provider.applicationWindowCloses ? `${shortDate(provider.applicationWindowOpens)} – ${shortDate(provider.applicationWindowCloses)}` : null}</Detail>
            <Detail label="Sectors">{list(provider.preferredSectors)}</Detail>
            <Detail label="Geographies">{list(provider.preferredGeographies)}</Detail>
            <Detail label="Enterprise stages">{list(provider.enterpriseStages)}</Detail>
            <Detail label="Impact themes">{list(provider.impactThemes)}</Detail>
            <Detail label="Gender focus">{provider.genderPreference && provider.genderPreference !== "none" ? human(provider.genderPreference) : "None"}</Detail>
            <Detail label="Youth-led focus">{provider.youthPreference ? "Yes" : "No"}</Detail>
          </dl>
          <dl className="mt-5 grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2">
            <Detail label="Eligibility criteria"><span className="whitespace-pre-wrap">{provider.eligibilityCriteria}</span></Detail>
            <Detail label="Traction requirements"><span className="whitespace-pre-wrap">{provider.tractionRequirements}</span></Detail>
            <Detail label="ESG requirements"><span className="whitespace-pre-wrap">{provider.esgRequirements}</span></Detail>
            <Detail label="Required documents">{list(provider.requiredDocuments)}</Detail>
            <Detail label="Previous transactions"><span className="whitespace-pre-wrap">{provider.previousTransactions}</span></Detail>
          </dl>
        </Card>

        <Card title="Contact">
          {provider.contactName !== undefined || provider.contactEmail !== undefined ? (
            <dl className="space-y-3">
              <Detail label="Name">{provider.contactName}</Detail>
              <Detail label="Email">{provider.contactEmail}</Detail>
              <Detail label="Phone">{provider.contactPhone}</Detail>
              <Detail label="Platform account">{provider.account ? `${provider.account.name} · ${provider.account.email}` : provider.linkedAccount ? "Linked" : "Not linked"}</Detail>
            </dl>
          ) : (
            <p className="text-sm text-slate-500">Contact details are confidential and shown only to people who manage capital providers.</p>
          )}
        </Card>
      </div>

      <Card title={`Capital opportunities (${provider.opportunities.length})`} padded={false} className="mt-4">
        <DataTable
          rows={provider.opportunities}
          empty="This provider has no capital opportunities yet."
          onRowClick={(row) => navigate(`/dashboard/capital/opportunities/${row.uuid}`)}
          columns={[
            { key: "reference", label: "Reference", render: (row) => <span className="font-semibold text-[#082d77]">{row.reference}</span> },
            { key: "stage", label: "Stage", render: (row) => stageLabel(row.stage) },
            { key: "status", label: "Status", render: (row) => <StatusChip value={row.status} label={row.outcome ? outcomeLabel(row.outcome) : human(row.status)} /> },
            { key: "match", label: "Match", render: (row) => <MatchScore score={row.matchScore} showLabel={false} /> },
            { key: "potential", label: "Potential", className: "whitespace-nowrap", render: (row) => money(row.potentialAmount, row.currency) },
            { key: "committed", label: "Committed", className: "whitespace-nowrap", render: (row) => (row.amountCommitted ? money(row.amountCommitted, row.currency) : "—") },
            { key: "updated", label: "Updated", render: (row) => shortDate(row.updatedAt) },
          ]}
        />
      </Card>

      {notesAllowed ? <div className="mt-4"><NotesPanel subjectType="provider" subjectUuid={provider.uuid} notes={notes} onAdded={loadNotes} /></div> : null}

      <ProviderForm
        open={editing}
        provider={provider}
        onClose={() => setEditing(false)}
        onSaved={() => {
          setEditing(false);
          toast.success("Match scores use the updated profile from now on");
          load();
        }}
      />
    </div>
  );
};

export default CapitalProviderDetail;
