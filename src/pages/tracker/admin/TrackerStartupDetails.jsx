import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import Loader from "@/components/common/Loader";
import {
  getTrackerProgramOverview,
  getMentorEnterpriseDetails,
  listMentorEnterprises,
  listTrackerMilestones,
  reviewTrackerMilestone,
  updateMentorEnterprise,
  upsertMentorEnterprise,
  updateMentorEnterpriseTrancheStages,
} from "@/controllers/trackerController";
import {
  PLAN_STATUS,
  REPORT_STATUS,
  canDisburse,
  isPlanApproved,
  parseKpiPlan,
  planStatusLabel,
  planStatusPill,
} from "@/utils/trancheWorkflow";
import { editProgram, getProgram } from "@/controllers/program_controller";
import { assignEntreprenuerToStaff } from "@/controllers/staffEntreprenuerController";
import { getReviewers } from "@/controllers/user_controller";
import { createNotification } from "@/controllers/notification_controller";
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
  Paperclip,
  Download,
  UserCheck,
} from "lucide-react";
import TrancheGroupList, {
  groupMilestonesByTranche,
} from "@/components/tracker/TrancheGroupList";
import MilestoneReportTable from "@/components/tracker/MilestoneReportTable";
import MilestoneStatusTable from "@/components/tracker/MilestoneStatusTable";
import { downloadMilestoneTemplatePDF } from "@/services/milestoneTemplatePDF";
import {
  formatReportAmount,
  milestoneKpiImpact,
  milestonePlannedAmount,
  milestoneTimelineSpan,
  reportFromMilestone,
} from "@/utils/milestoneReport";
import {
  buildDescriptionWithMeta,
  parseTrackerProgramMeta,
} from "@/utils/trackerProgramMarkers";

// The BDA's own comment on a report is hidden from the finance officer for
// now — flip this to bring the line back.
const SHOW_BDA_COMMENT = false;

const labelClass = "mb-1 block text-xs font-semibold text-[#64748b]";
const inputClass = "w-full rounded-lg border border-[#b7c5e5] px-3 py-2 text-sm";

// Finance reads the plan through the same three sections as the BDA and the
// startup, so the three roles talk about the same views.
const SECTION_TABS = [
  { id: "milestones", label: "Milestones" },
  { id: "status", label: "Milestone Status" },
  { id: "report", label: "Milestone Reporting" },
];

const SECTION_SUBTITLE = {
  milestones:
    "Milestones the business development advisor has approved. Read-only — plans still under review are not shown here.",
  status:
    "Where every milestone stands: whether the BDA has approved the plan, and what has happened to the report filed against it.",
  report:
    "The startup's reports, budgeted against actual spend, with their evidence. Approve the tranche once the plan is BDA-approved, or decline it.",
};

const planHeadClass =
  "border border-black/10 bg-[#eaf0fb] px-3 py-2 text-left text-xs font-black text-[#111827]";
const planCellClass =
  "border border-black/10 px-3 py-2 align-top text-sm break-words text-[#334155]";

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

// The enterprise's `documents` field is a flat { key: value } object (same
// one the KYC screen reads/writes) — the startup's uploaded budget document
// lives under `budgetDocumentUrl`/`budgetDocumentDescription`.
const parseDocuments = (value) => {
  if (value && typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
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
  // Finance feedback drafts, keyed by milestone uuid.
  const [financeNotes, setFinanceNotes] = useState({});
  // Which of the three sections is open: the plan ("milestones"), where each
  // one stands ("status"), or the reports filed against them ("report").
  const [milestoneTab, setMilestoneTab] = useState("milestones");
  // The open tranche lives in the URL so it is its own page: the browser's back
  // button returns to it and the view can be linked to. "__all__" shows every
  // milestone; empty falls back to the first tranche that has any.
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
      const matchesEnt = (e) =>
        (e?.Entreprenuer?.uuid || e?.entreprenuer_uuid) === entUuid;
      let match = enterprises.find(matchesEnt);

      // The overview lookup is best-effort. If it didn't resolve the enterprise,
      // fall back to the full enterprise list — the same records the BDA reads —
      // so the milestone/contract data still loads.
      if (!match?.uuid) {
        try {
          const all = await listMentorEnterprises();
          const list = Array.isArray(all) ? all : all?.data || [];
          match = list.find(matchesEnt) || match;
        } catch {
          // Fall through — milestone fallback below still runs.
        }
      }

      // An empty result means "could not tell", not "no enterprise". Keep what we
      // already resolved rather than erasing it and losing the contract.
      setEnterprise((prev) => match || prev || null);

      // Milestones (set/approved by the BDA) + the startup's reports, so the
      // finance officer can approve or decline the next tranche.
      const detailUuid = match?.uuid || enterprise?.uuid || "";
      let loadedMilestones = [];
      if (detailUuid) {
        try {
          const detail = await getMentorEnterpriseDetails(detailUuid);
          loadedMilestones = Array.isArray(detail?.milestones)
            ? detail.milestones
            : [];
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
          loadedMilestones = [];
        }
      }

      // Last resort: pull every milestone and keep this startup's. Covers the
      // case where the enterprise couldn't be resolved but the milestones the
      // startup created still exist under their entrepreneur/business.
      if (loadedMilestones.length === 0) {
        try {
          const all = await listTrackerMilestones();
          const list = Array.isArray(all) ? all : all?.data || [];
          loadedMilestones = list.filter((m) => {
            const mEnt = m?.Entreprenuer?.uuid || m?.entreprenuerUuid;
            const mBiz = m?.Business?.uuid || m?.businessUuid;
            return (
              (entUuid && mEnt === entUuid) ||
              (member.businessUuid && mBiz === member.businessUuid)
            );
          });
        } catch {
          // Leave empty — the "No milestones" state shows.
        }
      }

      setMilestones(loadedMilestones);
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
  // Index of the tranche whose bank advise is uploading, or null.
  const [adviseUploadingIndex, setAdviseUploadingIndex] = useState(null);
  // BDAs this startup can be assigned to, and the pending assignment.
  const [bdaList, setBdaList] = useState([]);
  const [assigningBda, setAssigningBda] = useState(false);

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

  // Finance officer's feedback on a milestone report, keyed by milestone uuid.
  // Stored on financeReviewNotes so it is distinct from the BDA's mentor notes,
  // and the startup can see both.
  const financeNote = (milestone) => financeNotes[milestone.uuid] || "";

  const onApproveTranche = async (milestone) => {
    // Set status to "completed" as well: when finance approves a report the BDA
    // had declined, the milestone is still "rejected", and leaving it there
    // would keep the startup's report open for edits and showing a declined
    // banner even though finance approved it. Completing it clears that.
    await reviewMilestone(
      milestone,
      {
        status: "completed",
        planStatus: PLAN_STATUS.DISBURSED,
        disbursed: true,
        financeReviewNotes: financeNote(milestone),
      },
      "Tranche approved and disbursed",
    );

    // Let the startup know the finance officer approved it, mirroring the
    // decline notification.
    if (form.entreprenuerUuid) {
      createNotification({
        user_uuid: form.entreprenuerUuid,
        to: "User",
        message: `Your report for "${milestone.title}" was approved by the finance officer and the tranche has been disbursed.`,
      });
    }
  };

  const onDeclineMilestone = async (milestone) => {
    const note = financeNote(milestone).trim();
    if (!note) {
      toast.error("Add feedback so the startup knows why it was declined");
      return;
    }
    // The BDA had marked the report "completed" when sending it to finance, so a
    // finance decline must reset the milestone's own status to "rejected" too —
    // that is the flag the startup's report tab keys off to reopen the report
    // for editing and resubmission. Setting only planStatus would leave the
    // report locked as completed on their side.
    await reviewMilestone(
      milestone,
      {
        status: "rejected",
        planStatus: PLAN_STATUS.REJECTED,
        financeReviewNotes: note,
      },
      "Milestone declined — the startup can edit and resubmit the report",
    );

    // Notify the startup so the decline surfaces on their notification bell, not
    // only as a status change they have to notice on the milestones page.
    if (form.entreprenuerUuid) {
      createNotification({
        user_uuid: form.entreprenuerUuid,
        to: "User",
        message: `Your report for "${milestone.title}" was declined by finance. Review the feedback, edit the report and submit it again.`,
      });
    }
  };

  // The report is not wrong, it is short of detail. It reopens for the startup
  // exactly like a decline, but the plan stays approved — dropping it back to
  // REJECTED would take the milestone out of their reporting tab, leaving them
  // unable to answer — and it is not recorded as a rejection.
  const onRequestMoreInfo = async (milestone) => {
    const note = financeNote(milestone).trim();
    if (!note) {
      toast.error("Say what further information you need");
      return;
    }

    await reviewMilestone(
      milestone,
      {
        status: REPORT_STATUS.INFO_REQUESTED,
        financeReviewNotes: note,
      },
      "Further information requested from the startup",
    );

    if (form.entreprenuerUuid) {
      createNotification({
        user_uuid: form.entreprenuerUuid,
        to: "User",
        message: `The finance officer needs more information on your report for "${milestone.title}". Read their comment, add what is missing and submit it again.`,
      });
    }
  };

  // One verdict per row, applied as soon as it is picked — the same shape as the
  // BDA's report verdict.
  const onFinanceVerdict = (milestone, verdict) => {
    if (verdict === "approve") return onApproveTranche(milestone);
    if (verdict === "decline") return onDeclineMilestone(milestone);
    if (verdict === "info") return onRequestMoreInfo(milestone);
  };

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
            disbursedDate: "",
            reportingDate: "",
            bankAdvise: "",
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

  // The schedule used to record a planned and an actual date; it now records the
  // date the money went out and the date the startup must report on it. Read the
  // old `actualDate` key too so tranches saved before that change keep theirs.
  const trancheDisbursedDate = (tranche) =>
    tranche?.disbursedDate || tranche?.actualDate || "";

  // Bank advise upload, one row at a time. The URL lands in form state and is
  // written with the rest of the schedule on Save.
  const onUploadBankAdvise = async (index, file) => {
    if (!file) return;
    setAdviseUploadingIndex(index);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const url = await uploadFile(formData);
      if (!url || typeof url !== "string" || !url.trim()) {
        throw new Error("Upload failed");
      }
      setTranche(index, "bankAdvise", url.trim());
      toast.success("Bank advise attached — save to keep it");
    } catch {
      toast.error("Failed to upload the bank advise");
    } finally {
      setAdviseUploadingIndex(null);
    }
  };

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

  // Every section opens on its tranche list, so no tranche is open until one is
  // picked: "" shows the list, "__all__" drops the filter.
  const visibleMilestones = useMemo(() => {
    if (openTranche === "__all__") return milestones;
    return milestoneGroups.find((g) => g.key === openTranche)?.items || [];
  }, [openTranche, milestoneGroups, milestones]);

  // Only BDA-approved plans go in the downloadable template — a milestone still
  // under review is not something the grant officer should be working from.
  // Scoped to the open tranche, so the document matches what is on screen.
  const approvedMilestones = useMemo(
    () => visibleMilestones.filter((m) => isPlanApproved(m.planStatus)),
    [visibleMilestones],
  );

  // BDAs are users stored under the Staff/Reviewer roles — the same list the
  // dedicated assignments page uses.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await getReviewers(1000, 1);
        const all = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : [];
        const staffOnly = all.filter((user) =>
          ["Staff", "Reviewer"].includes(user.role),
        );
        if (!cancelled) setBdaList(staffOnly.length ? staffOnly : all);
      } catch {
        // Non-fatal: the picker just stays empty and says so.
        if (!cancelled) setBdaList([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Assign right away rather than waiting for the page's Save: the assignment is
  // what lets the BDA reach this startup at all, and burying it behind the
  // disbursement form's save button hides that. This does everything onSave
  // would do for the assignment itself — writes the program markers and
  // creates the tracker enterprise — so a bare assignment is immediately
  // visible on the BDA's own Grant Management view, not just recorded server
  // side. (The BDA's view groups by the tracker enterprise's linked program;
  // without one being created here, the assignment would silently show
  // nowhere until someone separately opened "Configure disbursement" and hit
  // "Save changes".)
  const onAssignBda = async (bdaUuid) => {
    const bdaName =
      bdaList.find((bda) => bda.uuid === bdaUuid)?.name ||
      bdaList.find((bda) => bda.uuid === bdaUuid)?.email ||
      "";

    setForm((prev) => ({ ...prev, bdaUuid, bdaName }));
    if (!bdaUuid || !form.entreprenuerUuid) return;

    setAssigningBda(true);
    try {
      await assignEntreprenuerToStaff({
        staff_uuid: bdaUuid,
        entreprenuer_uuid: form.entreprenuerUuid,
      });

      if (program?.uuid) {
        const fresh = (await getProgram(program.uuid)) || program;
        const meta = parseTrackerProgramMeta(fresh);
        const startups = Array.isArray(meta.startups) ? [...meta.startups] : [];
        const idx = startups.findIndex((s) => s.entreprenuerUuid === entUuid);
        if (idx !== -1) {
          startups[idx] = { ...startups[idx], bdaUuid, bdaName };
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
        }
      }

      if (!enterprise?.uuid) {
        try {
          const created = await upsertMentorEnterprise({
            entreprenuer_uuid: form.entreprenuerUuid,
            program_uuid: programUuid,
            name: form.name || undefined,
          });
          if (created?.uuid) {
            setEnterprise((prev) => ({ ...(prev || {}), ...created }));
          }
        } catch {
          toast.error(
            "BDA assigned, but the startup's tracker workspace could not be created — they may not see it on Grant Management yet.",
          );
        }
      }

      toast.success("BDA assigned");
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to assign the BDA",
      );
    } finally {
      setAssigningBda(false);
    }
  };

  // Each section opens on its tranche list and drills into one, the same way the
  // BDA's and the startup's do. `suffix` names the rows for the section they are
  // in ("Tranche 1 Milestones", "Tranche 1 Reports").
  const renderTrancheList = (title, suffix) => (
    <TrancheGroupList
      title={title}
      groups={milestoneGroups
        .filter((group) => group.items.length > 0)
        .map((group) => ({
          key: group.key,
          title: `${group.title} ${suffix}`,
        }))}
      onSelect={setOpenTranche}
      onViewAll={() => setOpenTranche("__all__")}
      emptyText="No milestones have been set for this startup yet."
    />
  );

  // Names the tranche that was drilled into, above its table.
  const renderTrancheHeading = (allLabel) => (
    <p className="mb-3 text-sm font-bold text-[#111827]">
      {openTranche === "__all__" ? allLabel : openTranche}
    </p>
  );

  const onDownloadTemplate = () => {
    try {
      downloadMilestoneTemplatePDF(approvedMilestones, {
        startupName: form.name || "Startup",
        programName: program?.title || "",
        trancheLabel: openTranche === "__all__" ? "" : openTranche,
        grantCommitted: stats.committed ? fmtTZS(stats.committed) : "",
      });
      toast.success("Milestone plan downloaded");
    } catch (error) {
      console.error("Milestone template error:", error);
      toast.error("Failed to generate the milestone plan");
    }
  };

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
        .map((t) => {
          // The startup counts their milestone timelines from this date, so it
          // is the disbursement date — falling back to the planned date that
          // older schedules recorded instead.
          const date = trancheDisbursedDate(t) || t.plannedDate || "";
          return {
            title: String(t.title || "").trim(),
            date: date ? String(date).slice(0, 10) : "",
            amount: Number(t.amount || 0),
            status: isDisbursed(t) ? "Disbursed" : "Pending",
          };
        })
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

      {/* The startup's own budget document, uploaded from their Attachments
          tab — read-only here, finance just views/downloads it. */}
      {(() => {
        const documents = parseDocuments(enterprise?.documents);
        const budgetDocumentUrl = documents.budgetDocumentUrl;
        if (!budgetDocumentUrl) return null;

        return (
          <div className="rounded-2xl border border-black/10 bg-white p-6">
            <div className="mb-1 flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-black tracking-tight text-[#111827]">
                Budget Document
              </h2>
            </div>
            {documents.budgetDocumentDescription && (
              <p className="mb-3 text-sm text-[#64748b]">
                {documents.budgetDocumentDescription}
              </p>
            )}
            <a
              href={budgetDocumentUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#163b8f] hover:underline"
            >
              <Download className="h-4 w-4" />
              View / download budget document
            </a>
          </div>
        );
      })()}

      {/* Who coaches this startup. The assignment is what puts their milestones
          in front of a BDA for review, so it lives on the startup's own page
          rather than only on the separate assignments screen. */}
      <div className="rounded-2xl border border-black/10 bg-white p-6">
        <div className="mb-1 flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-emerald-600" />
          <h2 className="text-lg font-black tracking-tight text-[#111827]">
            Business Development Advisor
          </h2>
        </div>
        {/* The control sits on the description's line, the same way the other
            cards put their action beside their heading. The description names
            the field, so the select carries its label for screen readers only. */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[#64748b]">
            The BDA who reviews this startup's milestone plans and reports.
          </p>

          <div className="flex items-center gap-3">
            {assigningBda && (
              <span className="text-xs font-semibold text-[#64748b]">
                Assigning...
              </span>
            )}

            <select
              aria-label="Assigned BDA"
              className={`${inputClass} w-auto min-w-[16rem]`}
              value={form.bdaUuid || ""}
              disabled={assigningBda || !form.entreprenuerUuid}
              onChange={(e) => onAssignBda(e.target.value)}
            >
              <option value="">
                {bdaList.length === 0 ? "No BDAs available" : "Not assigned"}
              </option>
              {bdaList.map((bda) => (
                <option key={bda.uuid} value={bda.uuid}>
                  {bda.name || bda.email || "Unnamed BDA"}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

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
                  className="grid grid-cols-1 gap-3 rounded-xl border border-black/10 p-3 md:grid-cols-[minmax(0,1.2fr)_repeat(5,minmax(0,1fr))_auto] md:items-end"
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
                  {/* The date the money went out. The startup's milestone
                      timelines are counted from it, so it is the date mirrored
                      onto their tracker. */}
                  <div>
                    <label className={labelClass}>Disbursed Date</label>
                    <input
                      type="date"
                      className={inputClass}
                      value={trancheDisbursedDate(tranche)}
                      onChange={(e) =>
                        setTranche(index, "disbursedDate", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Reporting Date</label>
                    <input
                      type="date"
                      className={inputClass}
                      value={tranche.reportingDate || ""}
                      onChange={(e) =>
                        setTranche(index, "reportingDate", e.target.value)
                      }
                    />
                  </div>
                  {/* The bank's payment advice for this tranche. Uploaded on
                      pick; the schedule still has to be saved to keep it. */}
                  <div>
                    <label className={labelClass}>Bank Advise</label>
                    {tranche.bankAdvise ? (
                      <div className="flex items-center gap-2">
                        <a
                          href={tranche.bankAdvise}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex min-w-0 items-center gap-1 text-sm font-semibold text-emerald-700 hover:underline"
                        >
                          <FileText className="h-4 w-4 shrink-0" />
                          <span className="truncate">View advise</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => setTranche(index, "bankAdvise", "")}
                          className="shrink-0 text-xs font-semibold text-rose-600 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <label
                        className={`flex cursor-pointer items-center justify-center gap-1 rounded-lg border border-dashed border-[#b7c5e5] px-3 py-2 text-xs font-semibold text-[#082d77] transition hover:bg-[#082d77]/5 ${
                          adviseUploadingIndex === index
                            ? "pointer-events-none opacity-60"
                            : ""
                        }`}
                      >
                        <Paperclip className="h-3.5 w-3.5" />
                        {adviseUploadingIndex === index
                          ? "Uploading..."
                          : "Attach advise"}
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            onUploadBankAdvise(index, e.target.files?.[0]);
                            e.target.value = "";
                          }}
                        />
                      </label>
                    )}
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
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="border-b border-black/10 text-sm font-bold capitalize text-[#334155]">
                  <th className="py-2 pr-4">Tranche</th>
                  <th className="py-2 pr-4">Amount (TZS)</th>
                  <th className="py-2 pr-4">Disbursed Date</th>
                  <th className="py-2 pr-4">Reporting Date</th>
                  <th className="py-2 pr-4">Bank Advise</th>
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
                        {fmtDate(trancheDisbursedDate(tranche)) || "–"}
                      </td>
                      <td className="py-3 pr-4 text-[#334155]">
                        {fmtDate(tranche.reportingDate) || "–"}
                      </td>
                      <td className="py-3 pr-4">
                        {tranche.bankAdvise ? (
                          <a
                            href={tranche.bankAdvise}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:underline"
                          >
                            <FileText className="h-4 w-4" />
                            View advise
                          </a>
                        ) : (
                          <span className="text-[#94a3b8]">–</span>
                        )}
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

      {/* Outside the card, the same way the BDA's sit above their panels — the
          tabs pick which card is shown, so they are not part of one. */}
      <div className="flex flex-wrap gap-2">
        {SECTION_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              // A section always opens on its tranche list, so switching to one
              // closes whichever tranche was drilled into.
              setMilestoneTab(tab.id);
              setOpenTranche("");
            }}
            className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${
              milestoneTab === tab.id
                ? "bg-[#082d77] text-white"
                : "border border-[#082d77]/20 bg-[#082d77]/5 text-[#082d77] hover:bg-[#082d77]/10"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-black/10 bg-white p-6">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-black tracking-tight text-[#111827]">
              {SECTION_TABS.find((tab) => tab.id === milestoneTab)?.label ||
                "Milestones"}
            </h2>
          </div>

          {/* The approved plan as a document to work from. Only offered once the
              BDA has approved something — before that there is no plan to
              print, so the button would produce an empty table. */}
          {approvedMilestones.length > 0 && (
            <button
              type="button"
              onClick={onDownloadTemplate}
              className="inline-flex items-center gap-2 rounded-lg bg-[#16a34a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#15803d]"
            >
              <Download className="h-4 w-4" />
              Download milestone plan
            </button>
          )}
        </div>
        <p className="mb-4 text-sm text-[#64748b]">
          {SECTION_SUBTITLE[milestoneTab]}
        </p>

        {/* One tab per tranche, inside every section. The open one stays in the
            URL, so the view can still be linked to and the back button still
            works. */}
        {milestones.length > 0 &&
          !openTranche &&
          renderTrancheList(
            milestoneTab === "report" ? "Tranche Reports" : "Tranche Milestones",
            milestoneTab === "report" ? "Reports" : "Milestones",
          )}

        {milestones.length > 0 &&
          openTranche &&
          renderTrancheHeading(
            milestoneTab === "report" ? "All reports" : "All milestones",
          )}

        {milestones.length === 0 ? (
          <div className="rounded-xl border border-dashed border-black/20 p-6 text-center text-sm text-[#64748b]">
            No milestones have been set for this startup yet.
          </div>
        ) : !openTranche ? null : milestoneTab === "milestones" &&
          approvedMilestones.length === 0 ? (
          <div className="rounded-xl border border-dashed border-black/20 p-6 text-center text-sm text-[#64748b]">
            No approved milestones yet. Plans appear here once the business
            development advisor approves them.
          </div>
        ) : milestoneTab === "milestones" ? (
          // The approved plan only — finance acts on what the BDA has signed
          // off, so a plan still under review would just be noise here. It is
          // read-only: the BDA's comment is shown because it is the reasoning
          // behind the approval finance is acting on.
          <div className="-mx-6 overflow-x-auto px-1">
            <table
              className="w-full table-fixed border-collapse bg-white"
              style={{ minWidth: "900px" }}
            >
              <thead>
                <tr>
                  <th className={`${planHeadClass} w-[24%]`}>Milestone</th>
                  <th className={`${planHeadClass} w-[14%]`}>Budgeted amount</th>
                  <th className={`${planHeadClass} w-[12%]`}>Timeline</th>
                  <th className={`${planHeadClass} w-[18%]`}>Milestone status</th>
                  <th className={`${planHeadClass} w-[32%]`}>BDA comment</th>
                </tr>
              </thead>
              <tbody>
                {approvedMilestones.map((milestone) => (
                  <tr
                    key={milestone.uuid}
                    className="odd:bg-white even:bg-[#f8fafc]"
                  >
                    <td className={`${planCellClass} font-bold text-[#111827]`}>
                      {milestone.title}
                      {milestone.tranchePlannedUse ? (
                        <span className="mt-1 block text-xs font-normal text-[#64748b]">
                          {milestone.tranchePlannedUse}
                        </span>
                      ) : null}
                      {milestoneKpiImpact(milestone) ? (
                        <span className="mt-1 block text-xs font-normal text-emerald-700">
                          KPI/Impact: {milestoneKpiImpact(milestone)}
                        </span>
                      ) : null}
                    </td>
                    <td className={planCellClass}>
                      {formatReportAmount(milestonePlannedAmount(milestone))}
                    </td>
                    <td className={planCellClass}>
                      {milestoneTimelineSpan(milestone) || (
                        <span className="text-[#94a3b8]">—</span>
                      )}
                    </td>
                    <td className={planCellClass}>
                      <span
                        className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold ${planStatusPill(
                          milestone.planStatus,
                        )}`}
                      >
                        {planStatusLabel(milestone.planStatus)}
                      </span>
                    </td>
                    <td className={planCellClass}>
                      {milestone.mentorReviewNotes || (
                        <span className="text-[#94a3b8]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : milestoneTab === "status" ? (
          <div className="-mx-6 px-1">
            {/* The open tranche only. Its tab names it, so the tranche column is
                dropped — except on "All tranches". */}
            <MilestoneStatusTable
              rows={visibleMilestones}
              showTranche={openTranche === "__all__"}
            />
          </div>
        ) : (
          // The startup's reporting grid with the finance decision in it — the
          // whole review happens in this one table.
          <div className="-mx-6 px-1">
            <MilestoneReportTable
              showReview
              rows={visibleMilestones.map((milestone) => {
                const ps = milestone.planStatus || "";
                const disbursed =
                  ps === PLAN_STATUS.DISBURSED || Boolean(milestone.disbursed);
                const disbursable = canDisburse(ps, disbursed);
                const kpis = parseKpiPlan(milestone.kpiPlan);
                const busy = reviewingId === milestone.uuid;
                // The startup has sent a report the BDA has not ruled on yet.
                // The BDA reviews first; it reaches finance as SENT_TO_FINANCE.
                const reportAwaitingBda =
                  String(milestone.status || "").toLowerCase() === "submitted" &&
                  ps !== PLAN_STATUS.SENT_TO_FINANCE;
                // The BDA declined the report, but the plan is still approved —
                // so it lands with finance for the final call: approve to
                // override and disburse, or decline to send it back to the
                // startup. (A finance decline sets planStatus to rejected,
                // which is how we tell the two apart.)
                const bdaDeclined =
                  String(milestone.status || "").toLowerCase() === "rejected" &&
                  ps !== PLAN_STATUS.REJECTED &&
                  !disbursed;
                // The BDA asked the startup for more detail. That is between the
                // two of them — finance has nothing to decide until it comes
                // back, so this must not read as "awaiting BDA approval".
                const reportInfoRequested =
                  String(milestone.status || "").toLowerCase() ===
                  REPORT_STATUS.INFO_REQUESTED;
                const sentToFinance =
                  !disbursed && ps === PLAN_STATUS.SENT_TO_FINANCE;

                return {
                  uuid: milestone.uuid,
                  title: milestone.title,
                  activity: milestone.tranchePlannedUse,
                  kpiImpact: milestoneKpiImpact(milestone),
                  // Planned funds have their own column; the span does not.
                  timeline: milestoneTimelineSpan(milestone),
                  report: reportFromMilestone(milestone),
                  attachments: parseAttachments(milestone.submissionAttachments),

                  // Write the comment in the row being decided: an editable box
                  // while the decision is open, the recorded verdict after.
                  reviewComment: disbursable ? (
                    <textarea
                      className={`${inputClass} w-full`}
                      rows={3}
                      placeholder="Comment for the startup (required to decline or request more information)"
                      value={financeNote(milestone)}
                      onChange={(e) =>
                        setFinanceNotes((prev) => ({
                          ...prev,
                          [milestone.uuid]: e.target.value,
                        }))
                      }
                    />
                  ) : disbursed || ps === PLAN_STATUS.REJECTED ? (
                    <div className="space-y-1">
                      <p
                        className={`text-xs font-bold ${
                          disbursed ? "text-emerald-700" : "text-rose-700"
                        }`}
                      >
                        {disbursed ? "Approved" : "Declined"}
                      </p>
                      <p className="text-[#334155]">
                        {milestone.financeReviewNotes || "No comment"}
                      </p>
                    </div>
                  ) : null,

                  action: disbursed ? (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-center text-xs font-bold text-emerald-700">
                      Approved
                    </span>
                  ) : ps === PLAN_STATUS.REJECTED ? (
                    <span className="rounded-full bg-rose-50 px-2.5 py-1 text-center text-xs font-bold text-rose-700">
                      Declined
                    </span>
                  ) : // Checked before `disbursable`: once information has been
                  // asked for, the row waits on the startup rather than
                  // offering the verdict again. Their resubmission moves the
                  // status back and the dropdown returns.
                  ps === PLAN_STATUS.REVISION_REQUESTED || reportInfoRequested ? (
                    <span className="text-xs font-semibold text-[#8a6500]">
                      Information requested from the startup
                    </span>
                  ) : disbursable ? (
                    <select
                      className={inputClass}
                      value=""
                      disabled={busy}
                      onChange={(e) => {
                        if (e.target.value)
                          onFinanceVerdict(milestone, e.target.value);
                      }}
                    >
                      <option value="">
                        {busy ? "Processing..." : "Select verdict"}
                      </option>
                      <option value="approve">Approve</option>
                      <option value="decline">Decline</option>
                      <option value="info">Request further information</option>
                    </select>
                  ) : reportAwaitingBda ? (
                    <span className="text-xs font-semibold text-[#8a6500]">
                      Awaiting BDA review
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-[#64748b]">
                      Awaiting BDA approval of the plan
                    </span>
                  ),

                  // What the decision rests on beyond the row itself: where the
                  // report stands and the KPI plan. The comment is written in
                  // the row's own column.
                  detail:
                    sentToFinance ||
                    bdaDeclined ||
                    kpis.length > 0 ||
                    (SHOW_BDA_COMMENT && milestone.mentorReviewNotes) ? (
                      <div className="space-y-3">
                        {sentToFinance && (
                          <div className="flex items-center gap-2 rounded-lg border border-[#163b8f]/20 bg-[#163b8f]/5 px-3 py-2 text-sm font-semibold text-[#163b8f]">
                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                            BDA approved — report submitted for your review.
                          </div>
                        )}

                        {bdaDeclined && (
                          <div className="flex items-start gap-2 rounded-lg border border-amber-300/50 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
                            <Clock className="mt-0.5 h-4 w-4 shrink-0" />
                            The business coach declined this report. Review it and
                            make the final decision — approve to override and
                            disburse, or decline to send it back to the startup
                            with your feedback.
                          </div>
                        )}

                        {SHOW_BDA_COMMENT && milestone.mentorReviewNotes && (
                          <p className="text-sm text-[#334155]">
                            <span className="font-semibold text-[#111827]">
                              BDA comment:
                            </span>{" "}
                            {milestone.mentorReviewNotes}
                          </p>
                        )}

                        {kpis.length > 0 && (
                          <div className="overflow-x-auto">
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
                                    <td className="py-1 pr-3 text-[#334155]">
                                      {kpi.name || "—"}
                                    </td>
                                    <td className="py-1 pr-3 text-[#334155]">
                                      {kpi.target || "—"}
                                    </td>
                                    <td className="py-1 text-[#334155]">
                                      {kpi.currentValue || "—"}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                      </div>
                    ) : null,
                };
              })}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackerStartupDetails;