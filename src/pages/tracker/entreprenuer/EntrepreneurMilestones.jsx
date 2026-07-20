import { useContext, useMemo, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import Loader from "@/components/common/Loader";
import { UserContext } from "@/layouts/DashboardLayout";
import GrantReportButton from "@/components/reports/GrantReportButton";
import SignedContractCard from "@/components/tracker/SignedContractCard";
import GrantSummaryCards from "@/components/tracker/GrantSummaryCards";
import {
  createTrackerMilestone,
  getEntrepreneurTrackerDashboard,
  submitTrackerMilestone,
  updateEntrepreneurEnterpriseKyc,
} from "@/controllers/trackerController";
import { uploadFile } from "@/controllers/file_upload_controller";
import { parseTrackerProgramMeta } from "@/utils/trackerProgramMarkers";
import TrancheGroupList, {
  groupMilestonesByTranche,
} from "@/components/tracker/TrancheGroupList";
import {
  PLAN_STATUS,
  isPlanApproved,
  parseKpiPlan,
} from "@/utils/trancheWorkflow";
import {
  UploadCloud,
  Building2,
  BarChart3,
  Flag,
  ClipboardList,
  FileText,
} from "lucide-react";

const TRACKER_CATEGORIES_MARKER = "__TRACKER_CATEGORIES__:";
const HERO_IMAGE_URL = "/images/mentor_hero.svg";
const BRAND_BLUE = "#082d77";

const formatStatusLabel = (value) =>
  String(value || "pending")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const parseSubmissionAttachments = (value) => {
  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
};

const formatCurrency = (value, currency = "USD") => {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount)) return `TZS ${amount || 0}`;
  return `TZS ${amount.toLocaleString()}`;
};

const formatHours = (value) => {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed.toFixed(1) : "0.0";
};

const getProgramDescription = (program) => {
  const description = String(program?.description || "");
  const markerIndex = description.lastIndexOf(TRACKER_CATEGORIES_MARKER);
  if (markerIndex === -1) return description;
  return description.slice(0, markerIndex).trim();
};

const getEnterpriseProgramName = (program, enterprise) =>
  String(
    program?.title ||
      enterprise?.Program?.title ||
      enterprise?.program?.title ||
      enterprise?.programTitle ||
      enterprise?.programName ||
      enterprise?.category ||
      "Program not set",
  ).trim();

const baseInputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#082d77] focus:ring-4 focus:ring-[#082d77]/20 disabled:bg-slate-50 disabled:text-slate-400";

const milestoneLabelClass =
  "mb-1 block text-xs font-black tracking-wide text-[#082d77]";

// How often the page quietly refetches so finance's changes (committed amount,
// released tranches) appear without a manual reload.
const DASHBOARD_REFRESH_MS = 60000;

const emptyMilestoneRow = () => ({
  title: "",
  dueDate: "",
  tranchePlannedUse: "",
  description: "",
});

const PortalCard = ({ icon, title, subtitle, action, children, className = "" }) => (
  <section className={`rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/70 ${className}`}>
    {(title || subtitle || action || icon) && (
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {icon && (
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#082d77]/5 text-[#082d77]">
              {icon}
            </div>
          )}
          <div>
            {title && <h2 className="text-lg font-black tracking-tight text-slate-950">{title}</h2>}
            {subtitle && <p className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
    )}
    <div className={title || subtitle || action || icon ? "mt-6" : ""}>{children}</div>
  </section>
);

const DataTile = ({ label, value, helper }) => (
  <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
    <p className="text-xs font-bold tracking-wide text-slate-400">{label}</p>
    <p className="mt-1 text-base font-black text-slate-950">{value}</p>
    {helper && <p className="mt-1 text-xs text-slate-500">{helper}</p>}
  </div>
);

// Completed reads green and pending amber, so a milestone's state is legible at
// a glance rather than uniform grey.
const statusTone = (value) => {
  const label = String(value || "").toLowerCase();
  if (label.includes("complete")) return "text-green-600";
  if (label.includes("pending")) return "text-amber-600";
  return "text-slate-700";
};

const StatusText = ({ children }) => (
  <span className={`text-sm font-semibold ${statusTone(children)}`}>
    {children}
  </span>
);

const EntrepreneurMilestones = () => {
  const navigate = useNavigate();
  const { userDetails } = useContext(UserContext);
  const [loading, setLoading] = useState(true);
  const [isCreatingMilestone, setIsCreatingMilestone] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [selectedEnterpriseUuid, setSelectedEnterpriseUuid] = useState("");
  const [milestones, setMilestones] = useState([]);
  const [weeklyLogs, setWeeklyLogs] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [trancheStages, setTrancheStages] = useState([]);
  const [notesById, setNotesById] = useState({});
  const [filesById, setFilesById] = useState({});
  const [submittingById, setSubmittingById] = useState({});
  const [kpiProgressById, setKpiProgressById] = useState({});
  const [savingProgressById, setSavingProgressById] = useState({});

  // Phase 5: the entrepreneur's KPI actuals for a milestone (falls back to the
  // stored plan values until edited).
  const getKpiProgress = (item) => {
    const plan = parseKpiPlan(item.kpiPlan);
    const override = kpiProgressById[item.uuid];
    return plan.map((kpi, idx) => ({
      ...kpi,
      currentValue: override?.[idx]?.currentValue ?? kpi.currentValue ?? "",
      comment: override?.[idx]?.comment ?? kpi.comment ?? "",
    }));
  };

  const setKpiProgress = (uuid, idx, key, value) => {
    setKpiProgressById((prev) => {
      const arr = Array.isArray(prev[uuid]) ? [...prev[uuid]] : [];
      arr[idx] = { ...(arr[idx] || {}), [key]: value };
      return { ...prev, [uuid]: arr };
    });
  };
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [showKpiForm, setShowKpiForm] = useState(false);
  const [kpiForm, setKpiForm] = useState({
    monthlyRevenue: "",
    employees: "",
    wasteDiverted: "",
    ceReadinessScore: "",
    capitalMobilised: "",
    activeCustomers: "",
  });
  // The milestone form collects Milestone / Key activities / Verification /
  // Timeline, and takes several rows so a whole plan can be entered before it
  // goes to the BDA. Key activities and Verification reuse the
  // tranchePlannedUse and description fields the API already stores.
  // The tranche is chosen once for the whole form — every milestone entered
  // below is linked to it.
  const [milestoneTranche, setMilestoneTranche] = useState("");
  const [milestoneRows, setMilestoneRows] = useState([emptyMilestoneRow()]);

  const addMilestoneRow = () =>
    setMilestoneRows((prev) => [...prev, emptyMilestoneRow()]);
  const removeMilestoneRow = (index) =>
    setMilestoneRows((prev) =>
      prev.length > 1 ? prev.filter((_, i) => i !== index) : prev,
    );
  const updateMilestoneRow = (index, key, value) =>
    setMilestoneRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [key]: value } : row)),
    );

  // `silent` refreshes in the background: no full-page loader, and a failed
  // request leaves what's on screen alone rather than blanking it.
  const loadDashboard = async (enterpriseUuid, { silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const data = await getEntrepreneurTrackerDashboard({
        enterpriseUuid: enterpriseUuid || undefined,
      });

      setDashboard(data || null);
      setMilestones(Array.isArray(data?.milestones) ? data.milestones : []);
      setWeeklyLogs(Array.isArray(data?.weeklyLogs) ? data.weeklyLogs : []);
      setSessions(Array.isArray(data?.sessions) ? data.sessions : []);
      setTrancheStages(Array.isArray(data?.trancheStages) ? data.trancheStages : []);

      if (!selectedEnterpriseUuid && data?.selectedEnterpriseUuid) {
        setSelectedEnterpriseUuid(data.selectedEnterpriseUuid);
      }
    } catch {
      if (silent) return;
      // No tracking workspace yet (the BDA hasn't set up tracking) — show a
      // friendly empty state instead of an error.
      setDashboard(null);
      setMilestones([]);
      setWeeklyLogs([]);
      setSessions([]);
      setTrancheStages([]);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard(selectedEnterpriseUuid);
  }, [selectedEnterpriseUuid]);

  // Finance can set the committed amount or release a tranche while this page is
  // open, so pick those changes up without a manual reload: on a timer, and
  // whenever the tab is brought back to the foreground.
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState !== "visible") return;
      loadDashboard(selectedEnterpriseUuid, { silent: true });
    };

    const interval = setInterval(refresh, DASHBOARD_REFRESH_MS);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [selectedEnterpriseUuid]);

  const [signingContract, setSigningContract] = useState(false);

  // The startup downloads the grant contract, signs it, and uploads the signed
  // copy — which records the signature (contractAcknowledgedAt).
  const onUploadSignedContract = async (file) => {
    if (!file) return;
    setSigningContract(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const url = await uploadFile(formData);
      if (!url || typeof url !== "string") throw new Error("Upload failed");
      await updateEntrepreneurEnterpriseKyc({
        startupSignedContractUrl: url,
        contractAcknowledgedAt: new Date().toISOString(),
      });
      toast.success("Signed contract uploaded");
      await loadDashboard(selectedEnterpriseUuid);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to upload the signed contract",
      );
    } finally {
      setSigningContract(false);
    }
  };

  const onSubmitMilestone = async (uuid) => {
    const targetMilestone = milestones.find((item) => item.uuid === uuid);

    if (targetMilestone?.status === "completed") {
      toast.error("Completed milestones do not need report submission");
      return;
    }

    if (!String(notesById[uuid] || "").trim()) {
      toast.error("Please add a report before submitting for mentor review");
      return;
    }

    setSubmittingById((prev) => ({ ...prev, [uuid]: true }));

    try {
      const selectedFiles = Array.from(filesById[uuid] || []);
      const uploadedAttachmentUrls = [];

      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append("file", file);
        const fileUrl = await uploadFile(formData);
        if (typeof fileUrl === "string" && fileUrl.trim()) {
          uploadedAttachmentUrls.push(fileUrl.trim());
        }
      }

      await submitTrackerMilestone(uuid, {
        submissionNotes: notesById[uuid] || "",
        submissionAttachments: uploadedAttachmentUrls,
      });

      toast.success("Report submitted for mentor review");
      setFilesById((prev) => ({ ...prev, [uuid]: [] }));
      setNotesById((prev) => ({ ...prev, [uuid]: "" }));
      loadDashboard(selectedEnterpriseUuid);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to submit milestone");
    } finally {
      setSubmittingById((prev) => ({ ...prev, [uuid]: false }));
    }
  };

  // Phase 5 (save progress) and Phase 6 (submit for verification).
  const persistKpiProgress = async (item, { requestVerification }) => {
    setSavingProgressById((prev) => ({ ...prev, [item.uuid]: true }));
    try {
      const merged = getKpiProgress(item);
      await submitTrackerMilestone(item.uuid, {
        kpiPlan: merged,
        submissionNotes: notesById[item.uuid] || item.submissionNotes || "",
        requestVerification: Boolean(requestVerification),
      });
      toast.success(
        requestVerification ? "Tranche submitted for verification" : "Progress saved",
      );
      loadDashboard(selectedEnterpriseUuid);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save progress");
    } finally {
      setSavingProgressById((prev) => ({ ...prev, [item.uuid]: false }));
    }
  };

  const onCreateMilestone = async (e) => {
    e.preventDefault();

    // Ignore rows the user left completely untouched, but don't silently drop a
    // half-filled one — every milestone that has any content needs a name.
    const filled = milestoneRows.filter(
      (row) =>
        row.title.trim() ||
        row.tranchePlannedUse.trim() ||
        row.description.trim() ||
        row.dueDate,
    );

    if (!filled.length) {
      toast.error("Add at least one milestone");
      return;
    }
    if (filled.some((row) => !row.title.trim())) {
      toast.error("Every milestone needs a name");
      return;
    }

    setIsCreatingMilestone(true);
    let created = 0;
    try {
      for (const row of filled) {
        await createTrackerMilestone({
          title: row.title.trim(),
          dueDate: row.dueDate || null,
          linkedTranche: milestoneTranche || null,
          tranchePlannedUse: row.tranchePlannedUse.trim() || null,
          description: row.description.trim() || null,
          planStatus: PLAN_STATUS.SUBMITTED,
        });
        created += 1;
      }

      setMilestoneRows([emptyMilestoneRow()]);
      setMilestoneTranche("");
      setShowMilestoneForm(false);
      toast.success(
        created === 1
          ? "Milestone submitted for BDA review"
          : `${created} milestones submitted for BDA review`,
      );
      loadDashboard(selectedEnterpriseUuid);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to create milestone");
      // Some rows may already be saved — reload so they aren't entered twice,
      // and keep only the ones that never made it.
      if (created > 0) {
        setMilestoneRows(filled.slice(created));
        loadDashboard(selectedEnterpriseUuid);
      }
    } finally {
      setIsCreatingMilestone(false);
    }
  };

  const enterprise = dashboard?.enterprise || {};
  const program = dashboard?.program || enterprise?.Program || null;
  useEffect(() => {
    setKpiForm({
      monthlyRevenue: String(enterprise?.monthlyRevenue ?? ""),
      employees: String(enterprise?.employees ?? ""),
      wasteDiverted: String(enterprise?.wasteDiverted ?? ""),
      ceReadinessScore: enterprise?.ceReadinessScore === null || enterprise?.ceReadinessScore === undefined ? "" : String(enterprise.ceReadinessScore),
      capitalMobilised: String(enterprise?.capitalMobilised ?? ""),
      activeCustomers: String(enterprise?.activeCustomers ?? ""),
    });
  }, [enterprise?.uuid]);

  const onSaveKpis = (e) => {
    e.preventDefault();
    setDashboard((prev) => ({
      ...prev,
      enterprise: {
        ...(prev?.enterprise || {}),
        monthlyRevenue: Number(kpiForm.monthlyRevenue || 0),
        employees: Number(kpiForm.employees || 0),
        wasteDiverted: Number(kpiForm.wasteDiverted || 0),
        ceReadinessScore: kpiForm.ceReadinessScore === "" ? null : Number(kpiForm.ceReadinessScore),
        capitalMobilised: Number(kpiForm.capitalMobilised || 0),
        activeCustomers: Number(kpiForm.activeCustomers || 0),
      },
    }));
    setShowKpiForm(false);
    toast.success("KPI values updated");
  };

  const programName = getEnterpriseProgramName(program, enterprise);
  const programDescription = getProgramDescription(program) || "Track your milestones, reports, mentorship engagement, KPIs, and tranche readiness from one workspace.";

  // The finance officer enters the committed amount and the tranche schedule on
  // the program's startup list, which is stored in markers inside the program
  // description. Mirroring that onto this startup's tracker enterprise is
  // best-effort and depends on the API allowing it, so read the markers here
  // too — finance's numbers then reach this page as soon as they save.
  const financeMember = useMemo(() => {
    const ids = [
      userDetails?.uuid,
      enterprise?.entreprenuer_uuid,
      enterprise?.Entreprenuer?.uuid,
    ].filter(Boolean);
    if (!ids.length || !program) return null;
    return (
      parseTrackerProgramMeta(program).startups.find((member) =>
        ids.includes(member?.entreprenuerUuid),
      ) || null
    );
  }, [
    program,
    userDetails?.uuid,
    enterprise?.entreprenuer_uuid,
    enterprise?.Entreprenuer?.uuid,
  ]);

  // Tranches as this startup should see them: the stages mirrored onto their
  // enterprise when that sync landed, otherwise finance's own schedule read
  // straight from the program markers — with any status the mirror dropped
  // filled back in from those markers.
  const effectiveTrancheStages = useMemo(() => {
    const mirrored = Array.isArray(trancheStages) ? trancheStages : [];
    const fromFinance = (
      Array.isArray(financeMember?.tranches) ? financeMember.tranches : []
    )
      .map((t) => ({
        title: String(t.title || "").trim(),
        date: t.plannedDate ? String(t.plannedDate).slice(0, 10) : "",
        amount: Number(t.amount || 0),
        status: t.status || "",
      }))
      .filter((t) => t.title);

    const statusByTitle = new Map(fromFinance.map((t) => [t.title, t.status]));

    return (mirrored.length ? mirrored : fromFinance).map((stage) => ({
      ...stage,
      status:
        stage.status || statusByTitle.get(String(stage.title || "").trim()) || "",
    }));
  }, [trancheStages, financeMember]);

  // A milestone is ready to report on once the BDA approves its plan. Approval
  // only moves planStatus — the milestone's own status stays "pending" — so this
  // must not key off `status`. Milestones predating the plan workflow have no
  // planStatus, hence the fallback to an already-active work status.
  // The open tranche lives in the URL so each section is its own page: the
  // browser's back button returns to the tranche list and the view can be linked
  // to. "" shows the list, "__all__" drops the filter.
  const [searchParams, setSearchParams] = useSearchParams();
  const openTranche = searchParams.get("tranche") || "";
  const openReportTranche = searchParams.get("reportTranche") || "";
  const setParam = (name, key) => {
    const next = new URLSearchParams(searchParams);
    if (key) next.set(name, key);
    else next.delete(name);
    setSearchParams(next);
  };
  const setOpenTranche = (key) => setParam("tranche", key);
  const setOpenReportTranche = (key) => setParam("reportTranche", key);

  const reportableMilestones = useMemo(
    () =>
      milestones.filter(
        (item) =>
          isPlanApproved(item.planStatus) ||
          !["pending", "draft"].includes(
            String(item.status || "pending").toLowerCase(),
          ),
      ),
    [milestones],
  );

  const milestoneGroups = useMemo(
    () => groupMilestonesByTranche(milestones, effectiveTrancheStages),
    [milestones, effectiveTrancheStages],
  );

  const visibleMilestones = useMemo(() => {
    if (openTranche === "__all__") return milestones;
    return milestoneGroups.find((g) => g.key === openTranche)?.items || milestones;
  }, [openTranche, milestoneGroups, milestones]);

  const reportGroups = useMemo(
    () => groupMilestonesByTranche(reportableMilestones, effectiveTrancheStages),
    [reportableMilestones, effectiveTrancheStages],
  );

  const visibleReportables = useMemo(() => {
    if (openReportTranche === "__all__") return reportableMilestones;
    return (
      reportGroups.find((g) => g.key === openReportTranche)?.items ||
      reportableMilestones
    );
  }, [openReportTranche, reportGroups, reportableMilestones]);

  // The tranche picked on the milestone form — its date is shown read-only.
  const selectedMilestoneTranche = effectiveTrancheStages.find(
    (stage) => stage.title === milestoneTranche,
  );

  const activeCustomers = Number(kpiForm.activeCustomers || enterprise?.activeCustomers || 0);
  const employees = Number(kpiForm.employees || enterprise?.employees || 0);
  const monthlyRevenue = Number(kpiForm.monthlyRevenue || enterprise?.monthlyRevenue || 0);
  const wasteDiverted = Number(kpiForm.wasteDiverted || enterprise?.wasteDiverted || 0);
  const ceReadiness = kpiForm.ceReadinessScore === ""
    ? (enterprise?.ceReadinessScore === null || enterprise?.ceReadinessScore === undefined ? "-" : Number(enterprise.ceReadinessScore))
    : Number(kpiForm.ceReadinessScore);

  // Financial summary shown in the stat cards below the hero (mirrors the
  // finance officer's view). Disbursement is derived from tranche stages whose
  // linked milestone has been disbursed.
  const grantStats = useMemo(() => {
    const stages = effectiveTrancheStages;
    // A tranche counts as released either because finance marked the stage
    // itself Disbursed, or because the milestone linked to it was disbursed
    // through the plan workflow. The first works even with no milestone linked.
    const isTrancheDisbursed = (stage) => {
      if (String(stage?.status || "").toLowerCase() === "disbursed") return true;
      const linked = milestones.find((m) => m.linkedTranche === stage?.title);
      return Boolean(
        linked &&
          (String(linked.planStatus) === PLAN_STATUS.DISBURSED || linked.disbursed),
      );
    };
    const stagesTotal = stages.reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const committed =
      Number(enterprise?.grantUsd || 0) ||
      Number(financeMember?.grantUsd || 0) ||
      stagesTotal;
    const disbursed = stages
      .filter(isTrancheDisbursed)
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const remaining = Math.max(0, committed - disbursed);
    const disbursedPct = committed > 0 ? (disbursed / committed) * 100 : 0;
    const remainingPct = committed > 0 ? (remaining / committed) * 100 : 0;
    const next = stages.find((stage) => !isTrancheDisbursed(stage)) || null;
    return { committed, disbursed, remaining, disbursedPct, remainingPct, next };
  }, [enterprise?.grantUsd, trancheStages, milestones, financeMember]);

  // Context for the AI grant report download.
  const reportContext = useMemo(() => {
    const totalGrant = milestones.reduce(
      (sum, m) => sum + Number(m.trancheAmount || 0),
      0,
    );
    const disbursedTotal = milestones.reduce(
      (sum, m) => sum + (m.disbursed ? Number(m.trancheAmount || 0) : 0),
      0,
    );
    const business = userDetails?.Business || {};
    return {
      startup: {
        name:
          enterprise?.name || business.name || userDetails?.name || "My Startup",
        sector:
          enterprise?.ceSector ||
          business.BusinessSector?.name ||
          business.sector,
        location: enterprise?.district || business.location,
        stage: business.stage,
        description: business.description,
      },
      grant: {
        amount: totalGrant,
        disbursed: disbursedTotal,
        purpose: milestones
          .map((m) => m.tranchePlannedUse)
          .filter(Boolean)
          .join("; "),
      },
      milestones: milestones.map((m) => ({
        title: m.title,
        status: m.status,
        tranche: m.linkedTranche,
        trancheAmount: m.trancheAmount,
        plannedUse: m.tranchePlannedUse,
        kpis: parseKpiPlan(m.kpiPlan),
        notes: m.submissionNotes,
      })),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [milestones, enterprise?.uuid, userDetails?.uuid]);

  if (loading) return <Loader />;

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
          <div className="relative z-10 flex min-h-[220px] flex-col justify-between gap-6">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-sm font-bold text-white shadow-sm backdrop-blur">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
                  Startup Dashboard
                </div>
                <h1 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">
                  Funds &amp; KPI Management
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/85 md:text-base">
                  Analyze financial performance, monitor operational metrics, and align resources with business objectives to improve accountability and growth.
                </p>
                <div className="mt-5">
                  <GrantReportButton
                    label="Download Grant Report"
                    context={reportContext}
                  />
                </div>
              </div>

            </div>

          </div>
        </section>

        <GrantSummaryCards
          committed={grantStats.committed}
          disbursed={grantStats.disbursed}
          remaining={grantStats.remaining}
          disbursedPct={grantStats.disbursedPct}
          remainingPct={grantStats.remainingPct}
          next={grantStats.next}
          programName={program?.title}
        />

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.45fr_0.75fr]">
          <div className="space-y-8">
            <PortalCard
              icon={<Building2 className="h-5 w-5" />}
              title="Business Information & KYC"
              subtitle="Your business identity, ownership, and documents used for funding verification."
              action={
                <button
                  type="button"
                  onClick={() => navigate("/dashboard/myMilestones/kyc")}
                  className="rounded-xl border border-[#082d77]/20 bg-[#082d77]/5 px-4 py-2.5 text-sm font-bold text-[#082d77] transition hover:bg-[#082d77]/10"
                >
                  Complete / Update KYC
                </button>
              }
            >
              <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm leading-6 text-slate-600">
                Complete your KYC to provide your verified business and identity details. This information is used for funding and compliance review by your mentor.
              </div>
            </PortalCard>

            <SignedContractCard
              contractUrl={
                enterprise?.signedContractUrl || financeMember?.signedContractUrl
              }
              uploadedAt={
                enterprise?.signedContractUploadedAt ||
                financeMember?.signedContractUploadedAt
              }
              acknowledgedAt={enterprise?.contractAcknowledgedAt}
              signedUrl={enterprise?.startupSignedContractUrl}
              contractName={enterprise?.name || undefined}
              canSign
              signing={signingContract}
              onSignUpload={onUploadSignedContract}
            />

            <PortalCard
              icon={<BarChart3 className="h-5 w-5" />}
              title="KPI Tracking"
              subtitle="Operational indicators for enterprise growth and reporting."
              action={
                <button
                  type="button"
                  onClick={() => setShowKpiForm((prev) => !prev)}
                  className="rounded-xl border border-[#082d77]/20 bg-[#082d77]/5 px-4 py-2.5 text-sm font-bold text-[#082d77] transition hover:bg-[#082d77]/10"
                >
                  {showKpiForm ? "Close KPI Edit" : "Edit KPIs"}
                </button>
              }
            >
              {showKpiForm && (
                <form onSubmit={onSaveKpis} className="mb-5 grid grid-cols-1 gap-3 rounded-2xl border border-[#082d77]/10 bg-[#082d77]/5 p-4 md:grid-cols-3">
                  <input className={baseInputClass} type="number" min="0" placeholder="Monthly revenue" value={kpiForm.monthlyRevenue} onChange={(e) => setKpiForm((prev) => ({ ...prev, monthlyRevenue: e.target.value }))} />
                  <input className={baseInputClass} type="number" min="0" placeholder="Employees" value={kpiForm.employees} onChange={(e) => setKpiForm((prev) => ({ ...prev, employees: e.target.value }))} />
                  <input className={baseInputClass} type="number" min="0" placeholder="Active customers" value={kpiForm.activeCustomers} onChange={(e) => setKpiForm((prev) => ({ ...prev, activeCustomers: e.target.value }))} />
                  <div className="flex justify-end md:col-span-3">
                    <button type="submit" className="rounded-xl bg-[#082d77] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#061f54]">
                      Save KPI Updates
                    </button>
                  </div>
                </form>
              )}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <DataTile label="Monthly revenue" value={formatCurrency(monthlyRevenue)} />
                <DataTile label="Employees" value={employees} />
                <DataTile label="Active customers" value={activeCustomers} />
              </div>
            </PortalCard>

            <PortalCard
              icon={<Flag className="h-5 w-5" />}
              title="Milestones"
              subtitle="Create milestones with their key activities, verification and timeline, then wait for mentor approval."
              action={
                <button
                  type="button"
                  onClick={() => setShowMilestoneForm((prev) => !prev)}
                  className="rounded-xl border border-[#082d77]/20 bg-[#082d77]/5 px-4 py-2.5 text-sm font-bold text-[#082d77] transition hover:bg-[#082d77]/10"
                >
                  + New Milestone
                </button>
              }
            >
              {showMilestoneForm && (
                <form onSubmit={onCreateMilestone} className="mb-5 space-y-3 rounded-2xl border border-[#082d77]/10 bg-[#082d77]/5 p-4">
                  {/* Step 1 — pick the tranche these milestones belong to. Its
                      date comes from the schedule the finance officer set, so it
                      is shown for reference only. */}
                  <div className="grid grid-cols-1 gap-3 rounded-2xl border border-[#082d77]/10 bg-white p-4 md:grid-cols-2">
                    <div>
                      <label className={milestoneLabelClass} htmlFor="milestone-tranche">
                        Tranche
                      </label>
                      <select
                        id="milestone-tranche"
                        className={baseInputClass}
                        value={milestoneTranche}
                        onChange={(e) => setMilestoneTranche(e.target.value)}
                      >
                        <option value="">No tranche</option>
                        {effectiveTrancheStages.map((stage) => (
                          <option key={stage.title} value={stage.title}>
                            {stage.title}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={milestoneLabelClass} htmlFor="milestone-tranche-date">
                        Tranche date
                      </label>
                      <input
                        id="milestone-tranche-date"
                        className={baseInputClass}
                        type="date"
                        value={String(selectedMilestoneTranche?.date || "").slice(0, 10)}
                        disabled
                        readOnly
                      />
                    </div>
                    <p className="text-xs text-slate-500 md:col-span-2">
                      {effectiveTrancheStages.length === 0
                        ? "No tranches have been configured for your grant yet, so the tranche list is empty."
                        : "Every milestone below is linked to the tranche selected here."}
                    </p>
                  </div>

                  {/* Step 2 — the milestones themselves. Key activities and
                      Verification are stored on the existing tranchePlannedUse /
                      description fields. Labels repeat on mobile, where the row
                      stacks. */}
                  {milestoneRows.map((row, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-1 gap-3 md:grid-cols-[repeat(4,minmax(0,1fr))_auto] md:items-end"
                    >
                      <div>
                        <label
                          className={`${milestoneLabelClass} ${idx > 0 ? "md:hidden" : ""}`}
                          htmlFor={`milestone-title-${idx}`}
                        >
                          Milestone
                        </label>
                        <input
                          id={`milestone-title-${idx}`}
                          className={baseInputClass}
                          placeholder="Milestone"
                          value={row.title}
                          onChange={(e) => updateMilestoneRow(idx, "title", e.target.value)}
                        />
                      </div>
                      <div>
                        <label
                          className={`${milestoneLabelClass} ${idx > 0 ? "md:hidden" : ""}`}
                          htmlFor={`milestone-activities-${idx}`}
                        >
                          Key activities
                        </label>
                        <input
                          id={`milestone-activities-${idx}`}
                          className={baseInputClass}
                          placeholder="Key activities"
                          value={row.tranchePlannedUse}
                          onChange={(e) => updateMilestoneRow(idx, "tranchePlannedUse", e.target.value)}
                        />
                      </div>
                      <div>
                        <label
                          className={`${milestoneLabelClass} ${idx > 0 ? "md:hidden" : ""}`}
                          htmlFor={`milestone-verification-${idx}`}
                        >
                          Verification
                        </label>
                        <input
                          id={`milestone-verification-${idx}`}
                          className={baseInputClass}
                          placeholder="How it is verified"
                          value={row.description}
                          onChange={(e) => updateMilestoneRow(idx, "description", e.target.value)}
                        />
                      </div>
                      <div>
                        <label
                          className={`${milestoneLabelClass} ${idx > 0 ? "md:hidden" : ""}`}
                          htmlFor={`milestone-timeline-${idx}`}
                        >
                          Timeline
                        </label>
                        <input
                          id={`milestone-timeline-${idx}`}
                          className={baseInputClass}
                          type="date"
                          value={row.dueDate}
                          onChange={(e) => updateMilestoneRow(idx, "dueDate", e.target.value)}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeMilestoneRow(idx)}
                        disabled={milestoneRows.length <= 1}
                        title="Remove milestone"
                        className="rounded-xl bg-rose-50 px-3 py-3 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>
                  ))}

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={addMilestoneRow}
                      className="text-xs font-bold text-[#082d77] hover:text-[#061f54]"
                    >
                      + Add another milestone
                    </button>
                    <button
                      type="submit"
                      disabled={isCreatingMilestone}
                      className="rounded-xl bg-[#16a34a] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#15803d] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isCreatingMilestone ? "Submitting..." : "Submit plan for BDA review"}
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-4">
                {milestones.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                    No milestones yet.
                  </div>
                )}

                {/* Tranche picker — drill into one tranche rather than listing
                    every milestone at once. */}
                {milestones.length > 0 && !openTranche && (
                  <TrancheGroupList
                    title="Tranche Milestones"
                    groups={milestoneGroups.map((g) => ({
                      key: g.key,
                      title: `${g.title} Milestones`,
                    }))}
                    onSelect={setOpenTranche}
                    onViewAll={() => setOpenTranche("__all__")}
                    emptyText="No milestones yet."
                  />
                )}

                {openTranche && (
                  <p className="text-sm font-bold text-slate-950">
                    {openTranche === "__all__" ? "All milestones" : openTranche}
                  </p>
                )}

                {(openTranche ? visibleMilestones : []).map((item, index) => {
                  const normalizedStatus = String(item.status || "pending").toLowerCase();
                  // Approval moves planStatus, not status — so a milestone the
                  // BDA has approved must stop claiming it is still waiting.
                  const waitingForApproval =
                    !isPlanApproved(item.planStatus) &&
                    ["pending", "draft"].includes(normalizedStatus);

                  return (
                    <div key={item.uuid} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                      <div className="flex gap-3">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-sm font-black text-slate-700">
                          {item.status === "completed" ? "✓" : index + 1}
                        </div>
                        {/* Activities and status sit in the title's column so
                            they line up with the milestone name, not the badge. */}
                        <div className="min-w-0 flex-1">
                          <p className="font-black text-slate-950">{item.title}</p>

                          {/* Key activities, which the milestone form stores on
                              tranchePlannedUse — the milestone's description. */}
                          {item.tranchePlannedUse ? (
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                              {item.tranchePlannedUse}
                            </p>
                          ) : null}

                          {waitingForApproval && (
                            <p className="mt-2 text-sm font-semibold text-slate-700">
                              Waiting for mentor approval before report submission.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </PortalCard>

            <PortalCard
              icon={<ClipboardList className="h-5 w-5" />}
              title="Milestone Reporting"
              subtitle="Report on mentor-approved milestones and tranches, and provide supporting evidence for review."
            >
              <div className="space-y-4">
                {reportableMilestones.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                    No milestones are ready for reporting yet. Milestones appear here once a mentor approves them.
                  </div>
                )}

                {/* Same drill-down for reports: pick a tranche, then report on
                    its milestones. */}
                {reportableMilestones.length > 0 && !openReportTranche && (
                  <TrancheGroupList
                    title="Tranche Reports"
                    groups={reportGroups.map((g) => ({
                      key: g.key,
                      title: `${g.title} Reports`,
                    }))}
                    onSelect={setOpenReportTranche}
                    onViewAll={() => setOpenReportTranche("__all__")}
                    emptyText="No milestones are ready for reporting yet."
                  />
                )}

                {openReportTranche && (
                  <p className="text-sm font-bold text-slate-950">
                    {openReportTranche === "__all__"
                      ? "All reports"
                      : openReportTranche}
                  </p>
                )}

                {(openReportTranche ? visibleReportables : [])
                  .map((item, index) => {
                    const attachments = parseSubmissionAttachments(item.submissionAttachments);
                    const normalizedStatus = String(item.status || "pending").toLowerCase();
                    const ps = item.planStatus || "";
                    // An approved plan is the startup's cue to report, whatever
                    // the work status still says — otherwise the milestone would
                    // show up here with no way to submit anything.
                    const canSubmit = isPlanApproved(ps)
                      ? !["submitted", "completed"].includes(normalizedStatus)
                      : ["in_progress", "overdue", "rejected"].includes(normalizedStatus);
                    // The mentor declined the report — it comes back for edits.
                    const wasDeclined = normalizedStatus === "rejected";
                    const disbursed = ps === PLAN_STATUS.DISBURSED || Boolean(item.disbursed);
                    const kpiProgress = getKpiProgress(item);

                    return (
                      <div key={item.uuid} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                        {/* Numbered like the milestone list, with the key
                            activity beneath the name. */}
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex min-w-0 flex-1 gap-3">
                            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-sm font-black text-slate-700">
                              {normalizedStatus === "completed" ? "✓" : index + 1}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-black text-slate-950">{item.title}</p>
                              {item.tranchePlannedUse ? (
                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                  {item.tranchePlannedUse}
                                </p>
                              ) : null}
                            </div>
                          </div>
                          <StatusText>{formatStatusLabel(item.status)}</StatusText>
                        </div>

                        {/* Indented to clear the number badge (2.5rem + 0.75rem
                            gap) so the report and its form line up with the
                            milestone name. */}
                        <div className="sm:pl-[3.25rem]">
                        {(item.submissionNotes || item.mentorReviewNotes || attachments.length > 0) && (
                          <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                            {item.submissionNotes && (
                              <p><span className="font-bold text-slate-950">Submitted report:</span> {item.submissionNotes}</p>
                            )}
                            {item.mentorReviewNotes && (
                              <p><span className="font-bold text-slate-950">Mentor feedback:</span> {item.mentorReviewNotes}</p>
                            )}
                            {attachments.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {attachments.map((url, idx) => (
                                  <a
                                    key={`${item.uuid}-attachment-${idx}`}
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs font-bold text-green-600 transition hover:text-green-700"
                                  >
                                    Attachment {idx + 1}
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {disbursed && kpiProgress.length > 0 && (
                          <div className="mt-4 rounded-2xl border border-slate-100 p-4">
                            <p className="text-xs font-black uppercase tracking-wide text-[#082d77]">KPI progress</p>
                            <div className="mt-3 space-y-3">
                              {kpiProgress.map((kpi, idx) => (
                                <div key={idx} className="rounded-xl bg-slate-50 p-3">
                                  <p className="text-sm font-bold text-slate-950">{kpi.name}</p>
                                  <p className="text-xs text-slate-500">Target: {kpi.target || "—"} • Evidence: {kpi.evidenceSource || "—"}</p>
                                  <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                                    <input
                                      className={baseInputClass}
                                      placeholder="Current value"
                                      value={kpi.currentValue}
                                      onChange={(e) => setKpiProgress(item.uuid, idx, "currentValue", e.target.value)}
                                    />
                                    <input
                                      className={baseInputClass}
                                      placeholder="Comment"
                                      value={kpi.comment}
                                      onChange={(e) => setKpiProgress(item.uuid, idx, "comment", e.target.value)}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="mt-3 flex flex-wrap justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => persistKpiProgress(item, { requestVerification: false })}
                                disabled={savingProgressById[item.uuid]}
                                className="rounded-xl border border-[#082d77]/20 bg-[#082d77]/5 px-4 py-2.5 text-sm font-bold text-[#082d77] transition hover:bg-[#082d77]/10 disabled:opacity-60"
                              >
                                {savingProgressById[item.uuid] ? "Saving..." : "Save progress"}
                              </button>
                              <button
                                type="button"
                                onClick={() => persistKpiProgress(item, { requestVerification: true })}
                                disabled={savingProgressById[item.uuid]}
                                className="rounded-xl bg-[#16a34a] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#15803d] disabled:opacity-60"
                              >
                                Submit tranche for verification
                              </button>
                            </div>
                          </div>
                        )}

                        {wasDeclined && (
                          <p className="mt-4 rounded-2xl bg-rose-50 p-4 text-sm font-semibold leading-6 text-rose-700">
                            Your mentor declined this report. Update it below and
                            submit it again.
                          </p>
                        )}

                        {canSubmit && (
                          <div className="mt-4 space-y-3">
                            {/* A declined report starts from what was sent, so the
                                startup edits it rather than retyping. */}
                            <textarea
                              className={`${baseInputClass} min-h-[90px]`}
                              placeholder="Submit tranche-stage report for mentor review"
                              value={
                                notesById[item.uuid] ??
                                (wasDeclined ? item.submissionNotes || "" : "")
                              }
                              onChange={(e) =>
                                setNotesById((prev) => ({
                                  ...prev,
                                  [item.uuid]: e.target.value,
                                }))
                              }
                            />

                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-green-600/40 bg-green-50 px-4 py-3 text-sm font-bold text-green-700 transition hover:bg-green-100">
                                <UploadCloud className="h-5 w-5" />
                                {Array.isArray(filesById[item.uuid]) && filesById[item.uuid].length > 0
                                  ? `${filesById[item.uuid].length} file(s) selected`
                                  : "Upload evidence"}
                                <input
                                  type="file"
                                  multiple
                                  className="hidden"
                                  onChange={(e) =>
                                    setFilesById((prev) => ({
                                      ...prev,
                                      [item.uuid]: Array.from(e.target.files || []),
                                    }))
                                  }
                                />
                              </label>

                              <button
                                type="button"
                                onClick={() => onSubmitMilestone(item.uuid)}
                                className="rounded-xl bg-[#16a34a] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#15803d] disabled:cursor-not-allowed disabled:opacity-70"
                                disabled={submittingById[item.uuid]}
                              >
                                {submittingById[item.uuid] ? "Submitting..." : "Submit report"}
                              </button>
                            </div>
                          </div>
                        )}

                        {item.status === "submitted" && (
                          <p className="mt-4 text-sm font-semibold text-slate-700">
                            Report already submitted. Waiting for mentor review.
                          </p>
                        )}

                        {item.status === "completed" && (
                          <p className="mt-4 text-sm font-semibold text-slate-700">
                            Milestone completed. No further report submission needed.
                          </p>
                        )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </PortalCard>

          </div>

          <aside className="space-y-8">
            <PortalCard icon={<FileText className="h-5 w-5" />} title="Documents" subtitle="Reporting documents submitted for mentor review.">
              <div className="space-y-3">
                {milestones.flatMap((item) =>
                  parseSubmissionAttachments(item.submissionAttachments).map((url, idx) => ({
                    id: `${item.uuid}-${idx}`,
                    label: `${item.title} attachment ${idx + 1}`,
                    url,
                  })),
                ).length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                    No documents submitted yet.
                  </div>
                )}

                {milestones.flatMap((item) =>
                  parseSubmissionAttachments(item.submissionAttachments).map((url, idx) => ({
                    id: `${item.uuid}-${idx}`,
                    label: `${item.title} attachment ${idx + 1}`,
                    url,
                  })),
                ).map((document) => (
                  // The row itself opens the document, so no separate View
                  // button is needed.
                  <a
                    key={document.id}
                    href={document.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm transition hover:border-slate-200 hover:shadow-md"
                  >
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-green-50 text-green-600">
                      <UploadCloud className="h-5 w-5" />
                    </div>
                    <p className="truncate text-sm font-bold text-slate-950">
                      {document.label}
                    </p>
                  </a>
                ))}
              </div>
            </PortalCard>

          </aside>
        </div>
      </main>
    </div>
  );
};

export default EntrepreneurMilestones;
