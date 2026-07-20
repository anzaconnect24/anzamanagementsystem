import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Banknote, Layers, Wallet } from "lucide-react";
import Loader from "@/components/common/Loader";
import {
  listMentorEnterprises,
  getAdminBusinesses,
  getMentorEnterpriseDetails,
  updateMentorEnterprise,
  updateMentorEnterpriseTrancheStages,
  reviewTrackerMilestone,
} from "@/controllers/trackerController";
import { getReviewers } from "@/controllers/user_controller";
import SignedContractCard from "@/components/tracker/SignedContractCard";
import {
  PLAN_STATUS,
  planStatusLabel,
  planStatusPill,
  canDisburse,
} from "@/utils/trancheWorkflow";

const HERO_IMAGE_URL = "/images/mentor_hero.svg";

const baseInputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#082d77] focus:ring-4 focus:ring-[#082d77]/20 disabled:bg-slate-50 disabled:text-slate-400";

const formatMoney = (value) => `TZS ${Number(value || 0).toLocaleString()}`;

const FieldLabel = ({ children }) => (
  <label className="mb-1.5 block text-xs font-bold tracking-wide text-slate-500">{children}</label>
);

const PortalCard = ({ icon, title, subtitle, action, children, className = "" }) => (
  <section className={`rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/70 ${className}`}>
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-6 py-5">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#082d77]/5 text-[#082d77]">
            {icon}
          </div>
        )}
        <div>
          <h2 className="text-lg font-black tracking-tight text-slate-950">{title}</h2>
          {subtitle && <p className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
    <div className="p-6">{children}</div>
  </section>
);

const FundingAgreements = () => {
  const [loading, setLoading] = useState(true);
  const [enterprises, setEnterprises] = useState([]);
  const [bdaList, setBdaList] = useState([]);
  const [selectedUuid, setSelectedUuid] = useState("");
  const [details, setDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [saving, setSaving] = useState(false);
  const [disbursingId, setDisbursingId] = useState("");
  const [form, setForm] = useState({ totalFunding: "", trancheCount: "3", assignedBda: "" });

  useEffect(() => {
    // Admins aren't scoped to /tracker/enterprises, so also pull the
    // admin-wide business list and merge (dedupe by uuid).
    Promise.all([listMentorEnterprises(), getAdminBusinesses(), getReviewers(1000, 1)])
      .then(([mentorList, adminList, staffBody]) => {
        const a = Array.isArray(mentorList) ? mentorList : [];
        const b = Array.isArray(adminList) ? adminList : [];
        const byUuid = new Map();
        [...a, ...b].forEach((e) => {
          if (e?.uuid && !byUuid.has(e.uuid)) byUuid.set(e.uuid, e);
        });
        setEnterprises([...byUuid.values()]);

        const all = Array.isArray(staffBody)
          ? staffBody
          : Array.isArray(staffBody?.data)
            ? staffBody.data
            : [];
        const staffOnly = all.filter((u) => u.role === "Staff");
        setBdaList(staffOnly.length ? staffOnly : all);
      })
      .catch(() => toast.error("Failed to load startups"))
      .finally(() => setLoading(false));
  }, []);

  const loadDetails = async (uuid) => {
    if (!uuid) {
      setDetails(null);
      return;
    }
    setLoadingDetails(true);
    try {
      const data = await getMentorEnterpriseDetails(uuid);
      setDetails(data);
      const enterprise = data?.enterprise || {};
      const trancheStages = Array.isArray(data?.trancheStages) ? data.trancheStages : [];
      setForm({
        totalFunding: String(enterprise.grantUsd ?? ""),
        trancheCount: String(trancheStages.length || 3),
        assignedBda: enterprise.assignedBda || "",
      });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load funding details");
    } finally {
      setLoadingDetails(false);
    }
  };

  const onSelect = (uuid) => {
    setSelectedUuid(uuid);
    loadDetails(uuid);
  };

  // Phase 1: create the funding agreement and generate equal tranche shells.
  const onGenerate = async () => {
    const total = Number(form.totalFunding);
    const count = parseInt(form.trancheCount, 10);
    if (!Number.isFinite(total) || total <= 0) {
      toast.error("Enter a valid total funding amount");
      return;
    }
    if (!Number.isInteger(count) || count < 1) {
      toast.error("Enter a valid number of tranches");
      return;
    }
    const per = Math.round((total / count) * 100) / 100;
    const trancheStages = Array.from({ length: count }, (_, i) => ({
      title: `Tranche ${i + 1}`,
      date: "",
      amount: per,
    }));

    setSaving(true);
    try {
      await updateMentorEnterprise(selectedUuid, {
        grantUsd: total,
        assignedBda: form.assignedBda || null,
      });
      await updateMentorEnterpriseTrancheStages(selectedUuid, { trancheStages });
      toast.success(`Funding agreement created with ${count} tranche shell(s)`);
      loadDetails(selectedUuid);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to create funding agreement");
    } finally {
      setSaving(false);
    }
  };

  // Phase 4: release a tranche once the BDA has approved its plan.
  const onDisburse = async (milestone) => {
    setDisbursingId(milestone.uuid);
    try {
      await reviewTrackerMilestone(milestone.uuid, {
        planStatus: PLAN_STATUS.DISBURSED,
        disbursed: true,
      });
      toast.success("Tranche disbursed");
      loadDetails(selectedUuid);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to disburse tranche");
    } finally {
      setDisbursingId("");
    }
  };

  if (loading) return <Loader />;

  const enterprise = details?.enterprise || null;
  const trancheStages = Array.isArray(details?.trancheStages) ? details.trancheStages : [];
  const milestones = Array.isArray(details?.milestones) ? details.milestones : [];
  const milestoneForTranche = (title) =>
    milestones.find((m) => m.linkedTranche === title) || null;

  return (
    <div className="min-h-screen bg-[#f3f6fb] px-4 py-6 text-slate-950 md:px-8 xl:px-12">
      <main className="mx-auto max-w-[1480px] space-y-8">
        <section
          className="relative overflow-hidden rounded-2xl bg-slate-950 px-7 py-6 text-white shadow-sm shadow-slate-300/70 md:px-10 md:py-7"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.6) 50%, rgba(0, 0, 0, 0.2) 100%), url(${HERO_IMAGE_URL})`,
            backgroundPosition: "center",
            backgroundSize: "cover",
          }}
        >
          <div className="relative z-10 min-h-[150px]">
            <div className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-sm font-bold text-white shadow-sm backdrop-blur">
              <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
              Funding Agreements
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">Funding Agreements</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/85 md:text-base">
              Set the total funding and number of tranches for a startup, then release each tranche once its
              milestone &amp; KPI plan is approved.
            </p>
          </div>
        </section>

        <PortalCard
          icon={<Wallet className="h-5 w-5" />}
          title="Select startup"
          subtitle="Choose the startup whose funding agreement you want to set up."
        >
          <div className="max-w-md">
            <FieldLabel>Startup</FieldLabel>
            <select className={baseInputClass} value={selectedUuid} onChange={(e) => onSelect(e.target.value)}>
              <option value="">Select a startup</option>
              {enterprises.map((item) => (
                <option key={item.uuid} value={item.uuid}>
                  {item.name || "Unnamed startup"}
                </option>
              ))}
            </select>
          </div>
        </PortalCard>

        {selectedUuid && loadingDetails && (
          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
            Loading funding details...
          </div>
        )}

        {selectedUuid && !loadingDetails && (
          <>
            <PortalCard
              icon={<Banknote className="h-5 w-5" />}
              title="Funding agreement"
              subtitle="Total funding is split equally into the chosen number of tranche shells."
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <FieldLabel>Total funding (TZS)</FieldLabel>
                  <input
                    type="number"
                    min="0"
                    className={baseInputClass}
                    value={form.totalFunding}
                    onChange={(e) => setForm((prev) => ({ ...prev, totalFunding: e.target.value }))}
                    placeholder="e.g. 60000000"
                  />
                </div>
                <div>
                  <FieldLabel>Number of tranches</FieldLabel>
                  <input
                    type="number"
                    min="1"
                    className={baseInputClass}
                    value={form.trancheCount}
                    onChange={(e) => setForm((prev) => ({ ...prev, trancheCount: e.target.value }))}
                  />
                </div>
                <div>
                  <FieldLabel>Assigned BDA</FieldLabel>
                  <select
                    className={baseInputClass}
                    value={form.assignedBda}
                    onChange={(e) => setForm((prev) => ({ ...prev, assignedBda: e.target.value }))}
                  >
                    <option value="">Select BDA</option>
                    {bdaList.map((bda) => (
                      <option key={bda.uuid} value={bda.name || bda.email}>
                        {bda.name || bda.email || "Unnamed advisor"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {Number(form.totalFunding) > 0 && parseInt(form.trancheCount, 10) > 0 && (
                <p className="mt-4 text-sm text-slate-500">
                  Each tranche will be {formatMoney(Number(form.totalFunding) / parseInt(form.trancheCount, 10))}.
                </p>
              )}

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={onGenerate}
                  disabled={saving}
                  className="rounded-xl bg-[#082d77] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#061f54] disabled:opacity-60"
                >
                  {saving ? "Saving..." : trancheStages.length ? "Regenerate tranche shells" : "Create funding agreement"}
                </button>
              </div>
            </PortalCard>

            <SignedContractCard
              contractUrl={enterprise?.signedContractUrl}
              uploadedAt={enterprise?.signedContractUploadedAt}
              acknowledgedAt={enterprise?.contractAcknowledgedAt}
              signedUrl={enterprise?.startupSignedContractUrl}
              contractName={enterprise?.name || undefined}
            />

            <PortalCard
              icon={<Layers className="h-5 w-5" />}
              title="Tranches & disbursement"
              subtitle="A tranche can only be disbursed once the BDA has approved its milestone & KPI plan."
            >
              {trancheStages.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                  No tranche shells yet. Create the funding agreement above.
                </div>
              ) : (
                <div className="space-y-3">
                  {trancheStages.map((tranche, index) => {
                    const milestone = milestoneForTranche(tranche.title);
                    const ps = milestone?.planStatus || "";
                    const disbursed = ps === PLAN_STATUS.DISBURSED || Boolean(milestone?.disbursed);
                    const disbursable = milestone && canDisburse(ps, disbursed);

                    return (
                      <div
                        key={`${tranche.title}-${index}`}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-black text-slate-950">{tranche.title}</p>
                          <p className="text-xs text-slate-500">
                            {formatMoney(tranche.amount)}
                            {milestone ? ` • ${milestone.title}` : " • No milestone/plan linked yet"}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`rounded-full px-3 py-1 text-xs font-bold ${planStatusPill(ps)}`}>
                            {milestone ? planStatusLabel(ps) : "Awaiting plan"}
                          </span>
                          {disbursed ? (
                            <span className="rounded-xl bg-[#e1f0d8] px-4 py-2 text-xs font-bold text-[#2d6e1f]">
                              Disbursed
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onDisburse(milestone)}
                              disabled={!disbursable || disbursingId === milestone?.uuid}
                              title={disbursable ? "Release this tranche" : "Plan must be approved first"}
                              className="rounded-xl bg-[#16a34a] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#15803d] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {disbursingId === milestone?.uuid ? "Releasing..." : "Disburse"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </PortalCard>
          </>
        )}
      </main>
    </div>
  );
};

export default FundingAgreements;
