import { useMemo, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Loader from "@/components/common/Loader";
import {
  createTrackerMilestone,
  getEntrepreneurTrackerDashboard,
  submitTrackerMilestone,
} from "@/controllers/trackerController";
import { uploadFile } from "@/controllers/file_upload_controller";
import {
  emptyKpi,
  PLAN_STATUS,
  parseKpiPlan,
  planStatusLabel,
  planStatusPill,
} from "@/utils/trancheWorkflow";
import {
  UploadCloud,
  Building2,
  Wallet,
  BarChart3,
  Flag,
  ClipboardList,
  Layers,
  FileText,
  ShieldCheck,
} from "lucide-react";

const TRACKER_CATEGORIES_MARKER = "__TRACKER_CATEGORIES__:";
const HERO_IMAGE_URL = "/images/mentor_hero.svg";
const BRAND_BLUE = "#082d77";

const formatDateDisplay = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

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
  if (!Number.isFinite(amount)) return `${currency} 0`;
  return `${currency} ${amount.toLocaleString()}`;
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

const getBusinessRiskLabel = (flag) => {
  if (flag === "red") return "Critical";
  if (flag === "amber") return "Medium";
  return "Low";
};

const baseInputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#082d77] focus:ring-4 focus:ring-[#082d77]/20 disabled:bg-slate-50 disabled:text-slate-400";

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

const FieldLabel = ({ children }) => (
  <label className="mb-1.5 block text-xs font-bold tracking-wide text-slate-500">
    {children}
  </label>
);

const DataTile = ({ label, value, helper }) => (
  <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
    <p className="text-xs font-bold tracking-wide text-slate-400">{label}</p>
    <p className="mt-1 text-base font-black text-slate-950">{value}</p>
    {helper && <p className="mt-1 text-xs text-slate-500">{helper}</p>}
  </div>
);

const StatusText = ({ children }) => (
  <span className="text-sm font-semibold text-slate-700">{children}</span>
);

const ProgressBar = ({ value, className = "" }) => (
  <div className={`h-2 rounded-full bg-slate-100 ${className}`}>
    <div
      className="h-2 rounded-full bg-[#082d77]"
      style={{ width: `${Math.min(100, Math.max(0, Number(value || 0)))}%` }}
    />
  </div>
);

const EntrepreneurMilestones = () => {
  const navigate = useNavigate();
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
  const [milestoneForm, setMilestoneForm] = useState({
    title: "",
    dueDate: "",
    linkedTranche: "",
    trancheAmount: "",
    tranchePlannedUse: "",
    description: "",
    kpiPlan: [emptyKpi()],
  });

  const addKpiRow = () =>
    setMilestoneForm((prev) => ({ ...prev, kpiPlan: [...prev.kpiPlan, emptyKpi()] }));
  const removeKpiRow = (index) =>
    setMilestoneForm((prev) => ({
      ...prev,
      kpiPlan: prev.kpiPlan.length > 1 ? prev.kpiPlan.filter((_, i) => i !== index) : prev.kpiPlan,
    }));
  const updateKpiRow = (index, key, value) =>
    setMilestoneForm((prev) => ({
      ...prev,
      kpiPlan: prev.kpiPlan.map((k, i) => (i === index ? { ...k, [key]: value } : k)),
    }));

  const loadDashboard = async (enterpriseUuid) => {
    setLoading(true);
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
      // No tracking workspace yet (the BDA hasn't set up tracking) — show a
      // friendly empty state instead of an error.
      setDashboard(null);
      setMilestones([]);
      setWeeklyLogs([]);
      setSessions([]);
      setTrancheStages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard(selectedEnterpriseUuid);
  }, [selectedEnterpriseUuid]);

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

    if (!milestoneForm.title.trim()) {
      toast.error("Milestone title is required");
      return;
    }

    setIsCreatingMilestone(true);
    try {
      await createTrackerMilestone({
        title: milestoneForm.title.trim(),
        dueDate: milestoneForm.dueDate || null,
        linkedTranche: milestoneForm.linkedTranche.trim() || null,
        trancheAmount: milestoneForm.trancheAmount || null,
        tranchePlannedUse: milestoneForm.tranchePlannedUse.trim() || null,
        description: milestoneForm.description.trim() || null,
        kpiPlan: milestoneForm.kpiPlan.filter((kpi) => kpi.name.trim()),
        planStatus: PLAN_STATUS.SUBMITTED,
      });

      setMilestoneForm({
        title: "",
        dueDate: "",
        linkedTranche: "",
        trancheAmount: "",
        tranchePlannedUse: "",
        description: "",
        kpiPlan: [emptyKpi()],
      });
      setShowMilestoneForm(false);
      toast.success("Milestone & KPI plan submitted for BDA review");
      loadDashboard(selectedEnterpriseUuid);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to create milestone");
    } finally {
      setIsCreatingMilestone(false);
    }
  };

  const enterprise = dashboard?.enterprise || {};
  const program = dashboard?.program || enterprise?.Program || null;
  const availableEnterprises = Array.isArray(dashboard?.availableEnterprises)
    ? dashboard.availableEnterprises
    : [];
  const stats = dashboard?.stats || {
    sessionsCount: 0,
    weeklyLogsCount: 0,
    milestonesCount: 0,
    milestonesProgress: 0,
    mentorshipHours: 0,
  };

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

  const completedMilestones = useMemo(
    () => milestones.filter((item) => item.status === "completed").length,
    [milestones],
  );

  const milestoneProgress = milestones.length
    ? Math.round((completedMilestones / milestones.length) * 100)
    : Number(stats.milestonesProgress || 0);

  const completedTranches = useMemo(() => {
    if (!Array.isArray(trancheStages) || trancheStages.length === 0) return 0;

    const completedTrancheNames = new Set(
      milestones
        .filter((item) => item.status === "completed" && item.linkedTranche)
        .map((item) => item.linkedTranche),
    );

    return trancheStages.filter((item) => completedTrancheNames.has(item.title)).length;
  }, [milestones, trancheStages]);

  const trancheProgress = trancheStages.length
    ? Math.round((completedTranches / trancheStages.length) * 100)
    : milestoneProgress;

  const activeCustomers = Number(kpiForm.activeCustomers || enterprise?.activeCustomers || 0);
  const employees = Number(kpiForm.employees || enterprise?.employees || 0);
  const monthlyRevenue = Number(kpiForm.monthlyRevenue || enterprise?.monthlyRevenue || 0);
  const capitalMobilised = Number(kpiForm.capitalMobilised || enterprise?.capitalMobilised || 0);
  const wasteDiverted = Number(kpiForm.wasteDiverted || enterprise?.wasteDiverted || 0);
  const ceReadiness = kpiForm.ceReadinessScore === ""
    ? (enterprise?.ceReadinessScore === null || enterprise?.ceReadinessScore === undefined ? "-" : Number(enterprise.ceReadinessScore))
    : Number(kpiForm.ceReadinessScore);
  const pendingApprovalCount = milestones.filter((item) => ["pending", "draft"].includes(String(item.status || "pending"))).length;
  const submittedReportCount = milestones.filter((item) => String(item.status || "").toLowerCase() === "submitted").length;

  if (loading) return <Loader />;

  if (!dashboard?.enterprise) {
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
            <div className="relative z-10 min-h-[140px]">
              <div className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-sm font-bold text-white shadow-sm backdrop-blur">
                <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
                Enterprise Growth
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">Grant Management</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/85 md:text-base">
                Track your grant milestones, KPIs, and tranche reporting once your workspace is ready.
              </p>
            </div>
          </section>

          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-lg font-black text-slate-950">Your tracking workspace is being set up</p>
            <p className="mt-2 text-sm leading-7 text-slate-500">
              You&apos;ve been added to a program. Once your Business Development Advisor sets up tracking,
              your grant details, milestones, and KPIs will appear here.
            </p>
          </div>
        </main>
      </div>
    );
  }

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
              </div>

              {availableEnterprises.length > 1 && (
                <div className="w-full max-w-xs rounded-xl bg-white/15 p-3 backdrop-blur-md">
                  <FieldLabel>Switch Program / Enterprise</FieldLabel>
                  <select
                    className="w-full rounded-xl border border-white/20 bg-white/90 px-3 py-2 text-sm font-semibold text-slate-700 outline-none"
                    value={selectedEnterpriseUuid || enterprise?.uuid || ""}
                    onChange={(e) => setSelectedEnterpriseUuid(e.target.value)}
                  >
                    {availableEnterprises.map((item) => (
                      <option key={item.uuid} value={item.uuid}>
                        {item.programTitle} - {item.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

          </div>
        </section>

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

            <PortalCard icon={<Wallet className="h-5 w-5" />} title="Funding Summary" subtitle="Capital mobilisation, tranche progress, and milestone-linked readiness.">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6">
                <DataTile label="Capital mobilised" value={formatCurrency(capitalMobilised)} />
                <DataTile label="Tranches completed" value={`${completedTranches}/${trancheStages.length || 0}`} />
                <DataTile label="Milestones completed" value={`${completedMilestones}/${milestones.length || 0}`} />
                <DataTile label="Progress" value={`${trancheProgress}%`} />
                <DataTile label="Pending mentor approval" value={pendingApprovalCount} />
                <DataTile label="Reports submitted" value={submittedReportCount} />
              </div>
              <div className="mt-5 rounded-2xl border border-slate-100 bg-white p-5">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-bold text-slate-700">Program progress</span>
                  <span className="font-black text-slate-950">{trancheProgress}%</span>
                </div>
                <ProgressBar value={trancheProgress} />
                <p className="mt-3 text-sm text-slate-500">
                  Progress is calculated from completed milestone-linked tranche stages where tranche stages are available.
                </p>
              </div>
            </PortalCard>

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
              subtitle="Create milestones with linked tranche details and amounts, then wait for mentor approval."
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
                <form onSubmit={onCreateMilestone} className="mb-5 grid grid-cols-1 gap-3 rounded-2xl border border-[#082d77]/10 bg-[#082d77]/5 p-4 md:grid-cols-2">
                  <input
                    className={baseInputClass}
                    placeholder="Milestone title"
                    value={milestoneForm.title}
                    onChange={(e) => setMilestoneForm((prev) => ({ ...prev, title: e.target.value }))}
                    required
                  />
                  <input
                    className={baseInputClass}
                    type="date"
                    value={milestoneForm.dueDate}
                    onChange={(e) => setMilestoneForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                  />
                  <input
                    className={baseInputClass}
                    placeholder="Linked tranche title, e.g. Tranche 1"
                    value={milestoneForm.linkedTranche}
                    onChange={(e) => setMilestoneForm((prev) => ({ ...prev, linkedTranche: e.target.value }))}
                  />
                  <input
                    className={baseInputClass}
                    type="number"
                    min="0"
                    placeholder="Tranche amount"
                    value={milestoneForm.trancheAmount}
                    onChange={(e) => setMilestoneForm((prev) => ({ ...prev, trancheAmount: e.target.value }))}
                  />
                  <textarea
                    className={`${baseInputClass} min-h-[90px] md:col-span-2`}
                    placeholder="Planned use of tranche funds"
                    value={milestoneForm.tranchePlannedUse}
                    onChange={(e) => setMilestoneForm((prev) => ({ ...prev, tranchePlannedUse: e.target.value }))}
                  />
                  <textarea
                    className={`${baseInputClass} min-h-[90px] md:col-span-2`}
                    placeholder="Milestone details and expected outputs"
                    value={milestoneForm.description}
                    onChange={(e) => setMilestoneForm((prev) => ({ ...prev, description: e.target.value }))}
                  />

                  <div className="space-y-3 rounded-2xl border border-[#082d77]/10 bg-white p-4 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black uppercase tracking-wide text-[#082d77]">KPI plan</p>
                      <button type="button" onClick={addKpiRow} className="text-xs font-bold text-[#082d77] hover:text-[#061f54]">
                        + Add KPI
                      </button>
                    </div>
                    <p className="text-xs text-slate-500">
                      Define measurable KPIs and their evidence source for this tranche. The BDA reviews and approves this plan.
                    </p>
                    {milestoneForm.kpiPlan.map((kpi, idx) => (
                      <div key={idx} className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_130px_1fr_auto]">
                        <input
                          className={baseInputClass}
                          placeholder="KPI, e.g. 20 pilot users onboarded"
                          value={kpi.name}
                          onChange={(e) => updateKpiRow(idx, "name", e.target.value)}
                        />
                        <input
                          className={baseInputClass}
                          placeholder="Target"
                          value={kpi.target}
                          onChange={(e) => updateKpiRow(idx, "target", e.target.value)}
                        />
                        <input
                          className={baseInputClass}
                          placeholder="Evidence source"
                          value={kpi.evidenceSource}
                          onChange={(e) => updateKpiRow(idx, "evidenceSource", e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => removeKpiRow(idx)}
                          disabled={milestoneForm.kpiPlan.length <= 1}
                          className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end md:col-span-2">
                    <button
                      type="submit"
                      disabled={isCreatingMilestone}
                      className="rounded-xl bg-[#082d77] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#061f54] disabled:cursor-not-allowed disabled:opacity-70"
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

                {milestones.map((item, index) => {
                  const normalizedStatus = String(item.status || "pending").toLowerCase();
                  const waitingForApproval = ["pending", "draft"].includes(normalizedStatus);

                  return (
                    <div key={item.uuid} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex gap-3">
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-sm font-black text-slate-700">
                            {item.status === "completed" ? "✓" : index + 1}
                          </div>
                          <div>
                            <p className="font-black text-slate-950">{item.title}</p>
                            <p className="mt-1 text-xs text-slate-500">Due {formatDateDisplay(item.dueDate)}</p>
                            <p className="mt-1 text-xs text-slate-500">Linked tranche: {item.linkedTranche || "N/A"}</p>
                            {item.trancheAmount ? (
                              <p className="mt-1 text-xs text-slate-500">Tranche amount: {formatCurrency(item.trancheAmount)}</p>
                            ) : null}
                          </div>
                        </div>
                        <StatusText>{formatStatusLabel(item.status)}</StatusText>
                      </div>

                      <p className="mt-4 text-sm leading-6 text-slate-600">
                        {item.description || "No description provided."}
                      </p>

                      {waitingForApproval && (
                        <p className="mt-4 text-sm font-semibold text-slate-700">
                          Waiting for mentor approval before report submission.
                        </p>
                      )}
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
                {milestones.filter((item) => !["pending", "draft"].includes(String(item.status || "pending").toLowerCase())).length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                    No milestones are ready for reporting yet. Milestones appear here once a mentor approves them.
                  </div>
                )}

                {milestones
                  .filter((item) => !["pending", "draft"].includes(String(item.status || "pending").toLowerCase()))
                  .map((item) => {
                    const attachments = parseSubmissionAttachments(item.submissionAttachments);
                    const normalizedStatus = String(item.status || "pending").toLowerCase();
                    const canSubmit = ["in_progress", "overdue", "rejected"].includes(normalizedStatus);
                    const ps = item.planStatus || "";
                    const disbursed = ps === PLAN_STATUS.DISBURSED || Boolean(item.disbursed);
                    const kpiProgress = getKpiProgress(item);

                    return (
                      <div key={item.uuid} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-black text-slate-950">{item.title}</p>
                            <p className="mt-1 text-xs text-slate-500">Linked tranche: {item.linkedTranche || "N/A"}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {ps && (
                              <span className={`rounded-full px-3 py-1 text-[10px] font-bold ${planStatusPill(ps)}`}>
                                {planStatusLabel(ps)}
                              </span>
                            )}
                            <StatusText>{formatStatusLabel(item.status)}</StatusText>
                          </div>
                        </div>

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
                                    className="rounded-xl bg-[#082d77]/5 px-3 py-1.5 text-xs font-bold text-[#082d77] underline"
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

                        {canSubmit && (
                          <div className="mt-4 space-y-3">
                            <textarea
                              className={`${baseInputClass} min-h-[90px]`}
                              placeholder="Submit tranche-stage report for mentor review"
                              value={notesById[item.uuid] || ""}
                              onChange={(e) =>
                                setNotesById((prev) => ({
                                  ...prev,
                                  [item.uuid]: e.target.value,
                                }))
                              }
                            />

                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-[#082d77]/30 bg-[#082d77]/5 px-4 py-3 text-sm font-bold text-[#082d77] transition hover:bg-[#082d77]/10">
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
                                className="rounded-xl bg-[#082d77] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#061f54] disabled:cursor-not-allowed disabled:opacity-70"
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
                    );
                  })}
              </div>
            </PortalCard>

          </div>

          <aside className="space-y-8">
            <PortalCard icon={<Layers className="h-5 w-5" />} title="Milestone Linked Tranches" subtitle="Each tranche is controlled by one linked milestone.">
              <div className="space-y-4">
                {trancheStages.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                    No tranche stages have been set yet.
                  </div>
                )}

                {trancheStages.map((item, index) => {
                  const linkedMilestone = milestones.find((milestone) => milestone.linkedTranche === item.title);

                  return (
                    <div key={`${item.title}-${index}`} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-black text-slate-950">{item.title}</p>
                          <p className="mt-1 text-xs text-slate-500">{formatCurrency(item.amount)}</p>
                        </div>
                        <StatusText>{formatStatusLabel(linkedMilestone?.status || "pending")}</StatusText>
                      </div>
                      <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                        <p><span className="font-bold text-slate-950">Linked milestone:</span> {linkedMilestone?.title || "No milestone linked"}</p>
                        <p><span className="font-bold text-slate-950">Target date:</span> {formatDateDisplay(item.date)}</p>
                        <p><span className="font-bold text-slate-950">Amount:</span> {formatCurrency(item.amount)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </PortalCard>

            <PortalCard icon={<FileText className="h-5 w-5" />} title="Documents" subtitle="Evidence and reporting documents submitted for mentor review.">
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
                  <div key={document.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#082d77]/5 text-[#082d77]">
                        <UploadCloud className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-bold text-slate-950">{document.label}</p>
                    </div>
                    <a href={document.url} target="_blank" rel="noreferrer" className="text-xs font-bold text-[#082d77] hover:text-[#061f54]">
                      View
                    </a>
                  </div>
                ))}
              </div>
            </PortalCard>

            <PortalCard icon={<ShieldCheck className="h-5 w-5" />} title="Risk & Governance" subtitle="Current control signals for the entrepreneur workspace.">
              <div className="space-y-3">
                <DataTile label="Business risk" value={getBusinessRiskLabel(enterprise?.flag)} />
                <DataTile label="Reports pending" value={milestones.filter((item) => item.status !== "completed" && item.status !== "submitted").length} />
                <DataTile label="Submitted reports" value={milestones.filter((item) => item.status === "submitted").length} />
                <DataTile label="Overdue milestones" value={milestones.filter((item) => item.status === "overdue").length} />
              </div>
            </PortalCard>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default EntrepreneurMilestones;
