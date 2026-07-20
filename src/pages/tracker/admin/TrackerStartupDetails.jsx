import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import Loader from "@/components/common/Loader";
import {
  getTrackerProgramOverview,
  getMentorEnterpriseDetails,
  reviewTrackerMilestone,
  updateMentorEnterprise,
  upsertMentorEnterprise,
  updateMentorEnterpriseTrancheStages,
} from "@/controllers/trackerController";
import {
  PLAN_STATUS,
  planStatusLabel,
  planStatusPill,
  canDisburse,
  parseKpiPlan,
  verificationLabel,
  verificationPill,
} from "@/utils/trancheWorkflow";
import { editProgram, getProgram } from "@/controllers/program_controller";
import { assignEntreprenuerToStaff } from "@/controllers/staffEntreprenuerController";
import { uploadFile } from "@/controllers/file_upload_controller";
import GrantReportButton from "@/components/reports/GrantReportButton";
import SignedContractCard from "@/components/tracker/SignedContractCard";
import GrantSummaryCards from "@/components/tracker/GrantSummaryCards";
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  ClipboardList,
  FileText,
} from "lucide-react";
import TrancheGroupList, {
  groupMilestonesByTranche,
} from "@/components/tracker/TrancheGroupList";
import {
  buildDescriptionWithMeta,
  parseTrackerProgramMeta,
} from "@/utils/trackerProgramMarkers";

const labelClass = "mb-1 block text-xs font-semibold text-[#64748b]";
const inputClass = "w-full rounded-lg border border-[#b7c5e5] px-3 py-2 text-sm";

const parseAttachments = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [value];
    } catch {
      return [value];
    }
  }
  return [];
};

const fmtTZS = (value) => `TZS ${Number(value || 0).toLocaleString()}`;

const fmtDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const TrackerStartupDetails = () => {
  const navigate = useNavigate();
  const { programUuid, entUuid } = useParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [program, setProgram] = useState(null);
  const [enterprise, setEnterprise] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [reviewingId, setReviewingId] = useState("");
  // The open tranche lives in the URL so it is its own page: the browser's back
  // button returns to the tranche list and the view can be linked to.
  // "" shows the list, "__all__" shows every milestone.
  const [searchParams, setSearchParams] = useSearchParams();
  const openTranche = searchParams.get("tranche") || "";
  const setOpenTranche = (key) => {
    const next = new URLSearchParams(searchParams);
    if (key) next.set("tranche", key);
    else next.delete("tranche");
    setSearchParams(next);
  };
  const [form, setForm] = useState({
    name: "",
    sector: "",
    grantUsd: "",
    disbursedAmount: "",
    utilized: "",
    reportDate: "",
    grantPurpose: "",
    bdaUuid: "",
    bdaName: "",
    entreprenuerUuid: "",
    businessUuid: "",
    tranches: [],
  });

  const loadDetails = async () => {
    if (!programUuid || !entUuid) return;
    setLoading(true);
    try {
      let overview = null;
      try {
        overview = await getTrackerProgramOverview(programUuid);
      } catch {
        overview = null;
      }

      let programRecord = overview?.program;
      if (!programRecord?.uuid) {
        programRecord = await getProgram(programUuid);
      }
      if (!programRecord?.uuid) throw new Error("Program not found");
      setProgram(programRecord);

      const { startups } = parseTrackerProgramMeta(programRecord);
      const member = startups.find((s) => s.entreprenuerUuid === entUuid);
      if (!member) throw new Error("Startup not found in this program");

      setForm({
        name: member.name || "",
        sector: member.sector || "",
        grantUsd: member.grantUsd ?? "",
        disbursedAmount: member.disbursedAmount ?? "",
        utilized: member.utilized ?? "",
        reportDate: member.reportDate || "",
        grantPurpose: member.grantPurpose || "",
        bdaUuid: member.bdaUuid || "",
        bdaName: member.bdaName || "",
        entreprenuerUuid: member.entreprenuerUuid || "",
        businessUuid: member.businessUuid || "",
        tranches: Array.isArray(member.tranches) ? member.tranches : [],
        // Contract mirrored into the markers on upload — read back here so it
        // shows even when the enterprise record does not carry it.
        signedContractUrl: member.signedContractUrl || "",
        signedContractUploadedAt: member.signedContractUploadedAt || "",
      });

      const enterprises = Array.isArray(overview?.enterprises)
        ? overview.enterprises
        : [];
      const match = enterprises.find(
        (e) => (e?.Entreprenuer?.uuid || e?.entreprenuer_uuid) === entUuid,
      );
      // The overview request is best-effort (its failure is swallowed above), so
      // an empty result means "could not tell", not "no enterprise". Keep what we
      // already resolved rather than erasing it and losing the contract.
      setEnterprise((prev) => match || prev || null);

      // Milestones (set/approved by the BDA) + the startup's reports, so the
      // finance officer can approve or decline the next tranche. Fall back to an
      // enterprise we already resolved: the overview is best-effort, and a miss
      // must not blank the milestone list — that would hide every report the BDA
      // has approved and sent here.
      const detailUuid = match?.uuid || enterprise?.uuid || "";
      if (detailUuid) {
        try {
          const detail = await getMentorEnterpriseDetails(detailUuid);
          setMilestones(Array.isArray(detail?.milestones) ? detail.milestones : []);
          // The overview list carries a summary of each enterprise, which omits
          // fields like the grant contract. Prefer the full record the detail
          // endpoint returns — it is the same one the BDA reads — so the
          // contract shows here as well.
          if (detail?.enterprise) {
            setEnterprise((prev) => ({
              ...(prev || {}),
              ...(match || {}),
              ...detail.enterprise,
            }));
          }
        } catch {
          setMilestones([]);
        }
      } else {
        setMilestones([]);
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to load the startup",
      );
      navigate(`/dashboard/trackerPrograms/${programUuid}/details`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [programUuid, entUuid]);

  const [editingTranches, setEditingTranches] = useState(false);
  const [contractUploading, setContractUploading] = useState(false);

  // Uploading the grant contract is the first step: the finance officer uploads
  // it and it is stored on the startup's tracker enterprise so it appears to the
  // startup for signing. If the tracker enterprise doesn't exist yet, it is
  // created here (upsert) so the upload is always available.
  const onUploadContract = async (file) => {
    if (!file) return;
    if (!form.entreprenuerUuid) {
      toast.error("This startup has no linked entrepreneur.");
      return;
    }
    // Also record the contract on this startup's entry in the program markers.
    // Those live inside the program description and are known to round-trip, so
    // the contract survives even if the enterprise endpoint drops the fields.
    const saveContractToMarkers = async (patch) => {
      if (!program?.uuid) return;
      const fresh = (await getProgram(program.uuid)) || program;
      const meta = parseTrackerProgramMeta(fresh);
      const startups = Array.isArray(meta.startups) ? [...meta.startups] : [];
      const idx = startups.findIndex((s) => s.entreprenuerUuid === entUuid);
      if (idx === -1) return;

      startups[idx] = { ...startups[idx], ...patch };
      await editProgram(program.uuid, {
        title: fresh.title,
        description: buildDescriptionWithMeta(
          meta.cleanDescription,
          meta.categories,
          startups,
        ),
        programCategory: fresh.programCategory,
        type: "grant",
        startDate: fresh.startDate || null,
        endDate: fresh.endDate || null,
        image: fresh.image,
      });
    };
    setContractUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const url = await uploadFile(formData);
      if (!url || typeof url !== "string") throw new Error("Upload failed");

      const contractFields = {
        signedContractUrl: url,
        signedContractUploadedAt: new Date().toISOString(),
      };

      const saved = enterprise?.uuid
        ? await updateMentorEnterprise(enterprise.uuid, contractFields)
        : await upsertMentorEnterprise({
            entreprenuer_uuid: form.entreprenuerUuid,
            program_uuid: programUuid,
            name: form.name || undefined,
            ...contractFields,
          });

      // Best-effort: the enterprise write above is the primary channel, this is
      // the durable fallback every role can read.
      try {
        await saveContractToMarkers(contractFields);
      } catch {
        // Non-fatal — the enterprise write may still have carried it.
      }

      toast.success("Contract uploaded");
      await loadDetails();

      // Take the contract straight from the write's own response. The reload
      // above re-derives `enterprise` from the program overview, which will not
      // list an enterprise that was just created — without this the card would
      // still read "Not uploaded yet" immediately after a successful upload.
      if (saved?.uuid || saved?.signedContractUrl) {
        setEnterprise((prev) => ({ ...(prev || {}), ...saved }));
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to upload the contract",
      );
    } finally {
      setContractUploading(false);
    }
  };

  // Finance reviews a BDA-approved milestone: approve (disburse the tranche)
  // or decline it.
  const reviewMilestone = async (milestone, data, successMessage) => {
    setReviewingId(milestone.uuid);
    try {
      await reviewTrackerMilestone(milestone.uuid, data);
      toast.success(successMessage);
      await loadDetails();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to update the milestone",
      );
    } finally {
      setReviewingId("");
    }
  };

  const onApproveTranche = (milestone) =>
    reviewMilestone(
      milestone,
      { planStatus: PLAN_STATUS.DISBURSED, disbursed: true },
      "Tranche approved and disbursed",
    );

  const onDeclineMilestone = (milestone) =>
    reviewMilestone(
      milestone,
      { planStatus: PLAN_STATUS.REJECTED },
      "Milestone declined",
    );

  const onRequestInfo = (milestone) =>
    reviewMilestone(
      milestone,
      { planStatus: PLAN_STATUS.REVISION_REQUESTED },
      "Requested more information from the startup",
    );

  const setTranche = (index, key, value) =>
    setForm((prev) => ({
      ...prev,
      tranches: (prev.tranches || []).map((t, i) =>
        i === index ? { ...t, [key]: value } : t,
      ),
    }));

  const addTranche = () =>
    setForm((prev) => {
      const list = prev.tranches || [];
      return {
        ...prev,
        tranches: [
          ...list,
          {
            title: `Tranche ${list.length + 1}`,
            amount: "",
            plannedDate: "",
            actualDate: "",
            status: "Pending",
          },
        ],
      };
    });

  const removeTranche = (index) =>
    setForm((prev) => ({
      ...prev,
      tranches: (prev.tranches || [])
        .filter((_, i) => i !== index)
        .map((t, i) => ({ ...t, title: t.title || `Tranche ${i + 1}` })),
    }));

  const balance = useMemo(
    () =>
      Number(form.disbursedAmount || form.grantUsd || 0) - Number(form.utilized || 0),
    [form.disbursedAmount, form.grantUsd, form.utilized],
  );

  const isDisbursed = (tranche) =>
    String(tranche?.status || "").toLowerCase() === "disbursed";

  // Grant financial summary shown as stat cards below the hero. Disbursement is
  // derived from the configured tranches when present, else the grant field.
  const stats = useMemo(() => {
    const committed = Number(form.grantUsd || 0);
    const tranches = Array.isArray(form.tranches) ? form.tranches : [];
    const disbursed = tranches.length
      ? tranches
          .filter(isDisbursed)
          .reduce((sum, t) => sum + Number(t.amount || 0), 0)
      : Number(form.disbursedAmount || 0);
    const remaining = Math.max(0, committed - disbursed);
    const disbursedPct = committed > 0 ? (disbursed / committed) * 100 : 0;
    const remainingPct = committed > 0 ? (remaining / committed) * 100 : 0;
    const next = tranches.find((t) => !isDisbursed(t)) || null;
    // Total scheduled across every tranche, disbursed or not — used to flag a
    // schedule that over-allocates the committed amount.
    const allocated = tranches.reduce((sum, t) => sum + Number(t.amount || 0), 0);
    return {
      committed,
      disbursed,
      remaining,
      disbursedPct,
      remainingPct,
      next,
      allocated,
    };
  }, [form.grantUsd, form.disbursedAmount, form.tranches]);

  const milestoneGroups = useMemo(
    () => groupMilestonesByTranche(milestones, form.tranches),
    [milestones, form.tranches],
  );

  const visibleMilestones = useMemo(() => {
    if (openTranche === "__all__") return milestones;
    return (
      milestoneGroups.find((g) => g.key === openTranche)?.items || milestones
    );
  }, [openTranche, milestoneGroups, milestones]);

  const onSave = async () => {
    if (!program) return;
    setSaving(true);
    try {
      // Re-read the latest program so we don't clobber other startups' edits.
      const fresh = (await getProgram(program.uuid)) || program;
      const meta = parseTrackerProgramMeta(fresh);
      const startups = Array.isArray(meta.startups) ? [...meta.startups] : [];
      const idx = startups.findIndex((s) => s.entreprenuerUuid === entUuid);
      if (idx === -1) throw new Error("Startup not found in this program");

      startups[idx] = {
        ...startups[idx],
        grantUsd: form.grantUsd,
        disbursedAmount: form.disbursedAmount,
        utilized: form.utilized,
        reportDate: form.reportDate,
        grantPurpose: form.grantPurpose,
        bdaUuid: form.bdaUuid,
        bdaName: form.bdaName,
        tranches: Array.isArray(form.tranches) ? form.tranches : [],
      };

      const description = buildDescriptionWithMeta(
        meta.cleanDescription,
        meta.categories,
        startups,
      );
      await editProgram(program.uuid, {
        title: fresh.title,
        description,
        programCategory: fresh.programCategory,
        type: "grant",
        startDate: fresh.startDate || null,
        endDate: fresh.endDate || null,
        image: fresh.image,
      });

      // Mirror the configured tranches onto the startup's tracker enterprise so
      // the startup and their BDA see the same tranche stages (and can link
      // milestones to them). Staff/startup read tranches from the enterprise,
      // not from the program markers. The status travels with each stage so a
      // released tranche reaches the startup on its own, without depending on a
      // milestone being linked to it.
      const trancheStages = (Array.isArray(form.tranches) ? form.tranches : [])
        .map((t) => ({
          title: String(t.title || "").trim(),
          date: t.plannedDate ? String(t.plannedDate).slice(0, 10) : "",
          amount: Number(t.amount || 0),
          status: isDisbursed(t) ? "Disbursed" : "Pending",
        }))
        .filter((t) => t.title);

      let enterpriseUuid = enterprise?.uuid;
      if (!enterpriseUuid && form.entreprenuerUuid) {
        try {
          const created = await upsertMentorEnterprise({
            entreprenuer_uuid: form.entreprenuerUuid,
            program_uuid: program.uuid,
            name: form.name || startups[idx]?.name || undefined,
          });
          enterpriseUuid = created?.uuid;
        } catch {
          // Reported below — without an enterprise there is nothing to sync to.
        }
      }
      if (!enterpriseUuid) {
        // Everything above only wrote the program markers, which the startup
        // cannot read. Say so plainly: otherwise finance sees "Startup updated"
        // and their own cards fill in, while the startup's stay at zero.
        toast.error(
          "Saved for finance only — this startup has no tracker workspace yet, so the funds and tranches will not show on their dashboard.",
        );
      }
      if (enterpriseUuid) {
        // The startup and BDA read the committed amount from the enterprise, not
        // from the program markers, so mirror it there too.
        try {
          await updateMentorEnterprise(enterpriseUuid, {
            grantUsd: Number(form.grantUsd || 0),
          });
        } catch {
          toast.error(
            "Committed amount saved for finance, but syncing it to the startup failed.",
          );
        }

        try {
          await updateMentorEnterpriseTrancheStages(enterpriseUuid, {
            trancheStages,
          });
        } catch {
          toast.error(
            "Tranches saved for finance, but syncing them to the startup failed.",
          );
        }
      }

      // Releasing a tranche here marks its linked milestone disbursed. That flag
      // is the channel the startup and BDA read tranche progress from, so
      // without it a tranche marked "Disbursed" would never reach them.
      const releaseFailures = [];
      for (const tranche of Array.isArray(form.tranches) ? form.tranches : []) {
        if (!isDisbursed(tranche)) continue;

        const title = String(tranche.title || "").trim();
        const linked = milestones.find((m) => m.linkedTranche === title);
        if (!title || !linked) continue;

        const alreadyReleased =
          String(linked.planStatus) === PLAN_STATUS.DISBURSED || linked.disbursed;
        if (alreadyReleased) continue;

        try {
          await reviewTrackerMilestone(linked.uuid, {
            planStatus: PLAN_STATUS.DISBURSED,
            disbursed: true,
          });
        } catch {
          releaseFailures.push(title);
        }
      }
      if (releaseFailures.length) {
        toast.error(
          `Could not release ${releaseFailures.join(", ")} to the startup.`,
        );
      }

      if (form.bdaUuid && form.entreprenuerUuid) {
        try {
          await assignEntreprenuerToStaff({
            staff_uuid: form.bdaUuid,
            entreprenuer_uuid: form.entreprenuerUuid,
          });
        } catch {
          toast.error("The BDA assignment could not be saved on the server.");
        }
      }

      toast.success("Startup updated");
      loadDetails();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save the startup");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-6 bg-[#eef2f8] px-6 py-6">
      <button
        type="button"
        onClick={() => navigate(`/dashboard/trackerPrograms/${programUuid}/details`)}
        className="text-sm font-semibold text-[#163b8f]"
      >
        Back to program startups
      </button>

      <section
        className="relative overflow-hidden rounded-2xl bg-slate-950 px-7 py-6 text-white shadow-sm shadow-slate-300/70 md:px-10 md:py-7"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.6) 50%, rgba(0, 0, 0, 0.2) 100%), url('/images/mentor_hero.svg')",
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      >
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-sm font-bold text-white shadow-sm backdrop-blur">
              <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
              {program?.title || "Grant Program"}
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">
              {form.name || "Startup"}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={!form.entreprenuerUuid}
              onClick={() =>
                navigate(
                  `/dashboard/mentorTracker/enterprise-kyc?entreprenuer=${form.entreprenuerUuid}${
                    form.businessUuid ? `&business=${form.businessUuid}` : ""
                  }&view=1`,
                )
              }
              className="rounded-lg bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/25 disabled:opacity-50"
            >
              View KYC
            </button>
            <GrantReportButton
              label="Report"
              context={{
                startup: { name: form.name, sector: form.sector },
                grant: {
                  amount: form.grantUsd,
                  disbursed: form.disbursedAmount,
                  spent: form.utilized,
                  balance,
                  purpose: form.grantPurpose,
                  reportDate: form.reportDate,
                },
                milestones: [],
              }}
            />
          </div>
        </div>
      </section>

      <GrantSummaryCards
        committed={stats.committed}
        disbursed={stats.disbursed}
        remaining={stats.remaining}
        disbursedPct={stats.disbursedPct}
        remainingPct={stats.remainingPct}
        next={stats.next}
        programName={program?.title}
      />

      <SignedContractCard
        contractUrl={enterprise?.signedContractUrl || form.signedContractUrl}
        uploadedAt={
          enterprise?.signedContractUploadedAt || form.signedContractUploadedAt
        }
        acknowledgedAt={enterprise?.contractAcknowledgedAt}
        signedUrl={enterprise?.startupSignedContractUrl}
        contractName={form.name || undefined}
        canUpload
        uploading={contractUploading}
        onUpload={onUploadContract}
      />

      <div className="rounded-2xl border border-black/10 bg-white p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-black tracking-tight text-[#111827]">Grant Disbursement</h2>
          </div>
          {editingTranches ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={addTranche}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#b7c5e5] px-3 py-2 text-sm font-semibold text-[#163b8f] transition hover:bg-[#163b8f]/5"
              >
                <Plus className="h-4 w-4" />
                Add tranche
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingTranches(false);
                  loadDetails();
                }}
                className="rounded-lg border border-black/10 px-3 py-2 text-sm font-semibold text-[#64748b]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await onSave();
                  setEditingTranches(false);
                }}
                disabled={saving}
                className="rounded-lg bg-[#163b8f] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0f2a66] disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (!(form.tranches || []).length) addTranche();
                setEditingTranches(true);
              }}
              className="rounded-lg bg-[#163b8f] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0f2a66]"
            >
              Configure disbursement
            </button>
          )}
        </div>

        {/* Total grant committed. Drives the summary cards above: disbursed is
            summed from the tranches below, and remaining / the percentages are
            derived from both, so the cards follow disbursement automatically. */}
        <div className="mb-5 rounded-xl border border-black/10 bg-[#f8fafc] p-4">
          <label className={labelClass} htmlFor="grant-committed">
            Total Grant Committed (TZS)
          </label>
          {editingTranches ? (
            <input
              id="grant-committed"
              type="number"
              min="0"
              className={`${inputClass} md:max-w-xs`}
              value={form.grantUsd ?? ""}
              placeholder="0"
              onChange={(e) =>
                setForm((prev) => ({ ...prev, grantUsd: e.target.value }))
              }
            />
          ) : (
            <p className="text-xl font-black tracking-tight text-[#111827]">
              {fmtTZS(stats.committed)}
            </p>
          )}
          {stats.committed > 0 && stats.allocated > stats.committed ? (
            <p className="mt-2 text-xs font-semibold text-rose-600">
              Tranches exceed the committed amount by{" "}
              {fmtTZS(stats.allocated - stats.committed)}.
            </p>
          ) : null}
        </div>

        {editingTranches ? (
          <div className="space-y-3">
            {(form.tranches || []).length === 0 ? (
              <div className="rounded-xl border border-dashed border-black/20 p-6 text-center text-sm text-[#64748b]">
                No tranches yet. Use “Add tranche” to create the disbursement schedule.
              </div>
            ) : (
              (form.tranches || []).map((tranche, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 gap-3 rounded-xl border border-black/10 p-3 md:grid-cols-[minmax(0,1.2fr)_repeat(4,minmax(0,1fr))_auto] md:items-end"
                >
                  <div>
                    <label className={labelClass}>Tranche</label>
                    <input
                      type="text"
                      className={inputClass}
                      value={tranche.title || ""}
                      placeholder={`Tranche ${index + 1}`}
                      onChange={(e) => setTranche(index, "title", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Amount (TZS)</label>
                    <input
                      type="number"
                      min="0"
                      className={inputClass}
                      value={tranche.amount || ""}
                      onChange={(e) => setTranche(index, "amount", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Planned Date</label>
                    <input
                      type="date"
                      className={inputClass}
                      value={tranche.plannedDate || ""}
                      onChange={(e) => setTranche(index, "plannedDate", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Actual Date</label>
                    <input
                      type="date"
                      className={inputClass}
                      value={tranche.actualDate || ""}
                      onChange={(e) => setTranche(index, "actualDate", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Status</label>
                    <select
                      className={inputClass}
                      value={tranche.status || "Pending"}
                      onChange={(e) => setTranche(index, "status", e.target.value)}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Disbursed">Disbursed</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeTranche(index)}
                    title="Remove tranche"
                    className="mb-1 grid h-10 w-10 place-items-center rounded-lg border border-rose-200 text-rose-600 transition hover:bg-rose-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        ) : (form.tranches || []).length === 0 ? (
          <div className="rounded-xl border border-dashed border-black/20 p-6 text-center text-sm text-[#64748b]">
            No disbursement tranches configured yet. Click “Configure tranches” to set the
            schedule and planned disbursement dates.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-black/10 text-sm font-bold capitalize text-[#334155]">
                  <th className="py-2 pr-4">Tranche</th>
                  <th className="py-2 pr-4">Amount (TZS)</th>
                  <th className="py-2 pr-4">Planned Date</th>
                  <th className="py-2 pr-4">Actual Date</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {(form.tranches || []).map((tranche, index) => {
                  const disbursed = isDisbursed(tranche);
                  return (
                    <tr key={index} className="border-b border-black/5">
                      <td className="py-3 pr-4 font-semibold text-[#111827]">
                        {tranche.title || `Tranche ${index + 1}`}
                      </td>
                      <td className="py-3 pr-4 text-[#334155]">
                        {Number(tranche.amount || 0).toLocaleString()}
                      </td>
                      <td className="py-3 pr-4 text-[#334155]">
                        {fmtDate(tranche.plannedDate) || "–"}
                      </td>
                      <td className="py-3 pr-4 text-[#334155]">
                        {fmtDate(tranche.actualDate) || "–"}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            disbursed
                              ? "bg-[#e1f0d8] text-[#2d6e1f]"
                              : "bg-[#fff3cd] text-[#8a6d3b]"
                          }`}
                        >
                          {disbursed ? "Disbursed" : "Pending"}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        {disbursed ? (
                          <CheckCircle2 className="ml-auto h-5 w-5 text-emerald-600" />
                        ) : (
                          <Clock className="ml-auto h-5 w-5 text-amber-500" />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-black/10 bg-white p-6">
        <div className="mb-1 flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-emerald-600" />
          <h2 className="text-lg font-black tracking-tight text-[#111827]">
            Milestones and Reports
          </h2>
        </div>
        <p className="mb-4 text-sm text-[#64748b]">
          Milestones set and approved by the business development advisor, with the startup's
          reports. Approve the next tranche once the plan is BDA-approved, or decline it.
        </p>

        {/* Tranche picker — opens a tranche as its own view. Replaced by that
            tranche's milestones once one is selected. */}
        {milestones.length > 0 && !openTranche && (
          <TrancheGroupList
            title="Tranche Milestones"
            groups={milestoneGroups.map((g) => ({
              key: g.key,
              title: `${g.title} Milestones`,
            }))}
            onSelect={setOpenTranche}
            onViewAll={() => setOpenTranche("__all__")}
            emptyText="No milestones have been set for this startup yet."
          />
        )}

        {openTranche && (
          <p className="mb-4 text-sm font-bold text-[#111827]">
            {openTranche === "__all__" ? "All milestones" : openTranche}
          </p>
        )}

        {milestones.length === 0 ? (
          <div className="rounded-xl border border-dashed border-black/20 p-6 text-center text-sm text-[#64748b]">
            No milestones have been set for this startup yet.
          </div>
        ) : !openTranche ? null : (
          <div className="space-y-3">
            {visibleMilestones.map((milestone) => {
              const ps = milestone.planStatus || "";
              const vs = milestone.verificationStatus || "";
              const disbursed =
                ps === PLAN_STATUS.DISBURSED || Boolean(milestone.disbursed);
              const disbursable = canDisburse(ps, disbursed);
              const attachments = parseAttachments(milestone.submissionAttachments);
              const kpis = parseKpiPlan(milestone.kpiPlan);
              const busy = reviewingId === milestone.uuid;
              // The startup has sent a report the BDA has not ruled on yet. The
              // BDA reviews first; it reaches finance as SENT_TO_FINANCE.
              const reportAwaitingBda =
                String(milestone.status || "").toLowerCase() === "submitted" &&
                ps !== PLAN_STATUS.SENT_TO_FINANCE;

              return (
                <div
                  key={milestone.uuid}
                  className="rounded-xl border border-black/10 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-[#111827]">{milestone.title}</p>
                      <p className="mt-1 text-xs text-[#64748b]">
                        Due {milestone.dueDate ? fmtDate(milestone.dueDate) : "N/A"}
                        {milestone.linkedTranche && milestone.linkedTranche !== "None"
                          ? ` • Linked tranche: ${milestone.linkedTranche}`
                          : ""}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {ps && (
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ${planStatusPill(ps)}`}
                        >
                          {planStatusLabel(ps)}
                        </span>
                      )}
                      {vs && (
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${verificationPill(vs)}`}
                        >
                          {verificationLabel(vs)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Report */}
                  <div className="mt-3 rounded-lg bg-[#f8fafc] p-3 text-sm">
                    <p className="text-[#334155]">
                      <span className="font-semibold text-[#111827]">Report:</span>{" "}
                      {milestone.submissionNotes || "No report submitted yet."}
                    </p>
                    {milestone.mentorReviewNotes && (
                      <p className="mt-1 text-[#334155]">
                        <span className="font-semibold text-[#111827]">
                          BDA comment:
                        </span>{" "}
                        {milestone.mentorReviewNotes}
                      </p>
                    )}
                    {attachments.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {attachments.map((url, i) => (
                          <a
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-green-600 transition hover:text-green-700"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            Evidence {i + 1}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* A report the startup has sent but the BDA has not reviewed
                      yet — finance waits for that verdict before acting. */}
                  {reportAwaitingBda && (
                    <p className="mt-3 text-xs font-semibold text-[#8a6500]">
                      Report submitted — awaiting BDA review
                    </p>
                  )}

                  {/* KPI plan */}
                  {kpis.length > 0 && (
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full min-w-[420px] text-left text-xs">
                        <thead>
                          <tr className="text-[#64748b]">
                            <th className="py-1 pr-3 font-semibold">KPI</th>
                            <th className="py-1 pr-3 font-semibold">Target</th>
                            <th className="py-1 font-semibold">Actual</th>
                          </tr>
                        </thead>
                        <tbody>
                          {kpis.map((kpi, i) => (
                            <tr key={i} className="border-t border-black/5">
                              <td className="py-1 pr-3 text-[#334155]">{kpi.name || "—"}</td>
                              <td className="py-1 pr-3 text-[#334155]">{kpi.target || "—"}</td>
                              <td className="py-1 text-[#334155]">{kpi.currentValue || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Finance action */}
                  <div className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-black/5 pt-3">
                    {/* The BDA approved the startup's report and passed it here
                        for the disbursement decision. */}
                    {!disbursed && ps === PLAN_STATUS.SENT_TO_FINANCE && (
                      <span className="mr-auto text-xs font-semibold text-[#163b8f]">
                        Report approved by the BDA — awaiting your decision
                      </span>
                    )}
                    {disbursed ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e1f0d8] px-3 py-1 text-xs font-bold text-[#2d6e1f]">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Tranche disbursed
                      </span>
                    ) : disbursable ? (
                      <>
                        <button
                          type="button"
                          onClick={() => onRequestInfo(milestone)}
                          disabled={busy}
                          className="rounded-lg border border-[#e2b100] px-4 py-2 text-sm font-semibold text-[#8a6500] transition hover:bg-[#fdf1ce]/60 disabled:opacity-60"
                        >
                          Request information
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeclineMilestone(milestone)}
                          disabled={busy}
                          className="rounded-lg border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-60"
                        >
                          Decline
                        </button>
                        <button
                          type="button"
                          onClick={() => onApproveTranche(milestone)}
                          disabled={busy}
                          className="rounded-lg bg-[#16a34a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#15803d] disabled:opacity-60"
                        >
                          {busy ? "Processing..." : "Accept & disburse tranche"}
                        </button>
                      </>
                    ) : ps === PLAN_STATUS.REJECTED ? (
                      <span className="text-xs font-semibold text-rose-600">Declined</span>
                    ) : ps === PLAN_STATUS.REVISION_REQUESTED ? (
                      <span className="text-xs font-semibold text-[#8a6500]">
                        Information requested from the startup
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-[#64748b]">
                        Awaiting BDA approval of the plan
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackerStartupDetails;