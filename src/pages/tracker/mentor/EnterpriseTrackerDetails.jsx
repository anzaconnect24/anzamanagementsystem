import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import Loader from "@/components/common/Loader";
import {
  createMentorEnterpriseMilestone,
  createMentorEnterpriseWeeklyLog,
  getMentorEnterpriseDetails,
  reviewTrackerMilestone,
} from "@/controllers/trackerController";
import SignedContractCard from "@/components/tracker/SignedContractCard";
import GrantSummaryCards from "@/components/tracker/GrantSummaryCards";
import { parseTrackerProgramMeta } from "@/utils/trackerProgramMarkers";
import MilestoneReportTable from "@/components/tracker/MilestoneReportTable";
import MilestoneStatusTable from "@/components/tracker/MilestoneStatusTable";
import {
  formatReportAmount,
  milestoneKpiImpact,
  milestonePlannedAmount,
  milestoneTimelineSpan,
  reportFromMilestone,
} from "@/utils/milestoneReport";
import TrancheGroupList, {
  groupMilestonesByTranche,
} from "@/components/tracker/TrancheGroupList";
import { ClipboardList, Download, FileText, Flag } from "lucide-react";
import {
  PLAN_STATUS,
  REPORT_STATUS,
  canReviewPlan,
  VERIFICATION_OPTIONS,
  verificationLabel,
  verificationPill,
} from "@/utils/trancheWorkflow";

const HERO_IMAGE_URL = "/images/mentor_hero.svg";

const baseInputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#082d77] focus:ring-4 focus:ring-[#082d77]/20 disabled:bg-slate-50 disabled:text-slate-400";

// Matches the milestone reporting and status tables so the three read as one.
const tableCellClass =
  "border border-black/10 px-3 py-2 align-top text-sm break-words text-[#334155]";
const tableHeadClass =
  "border border-black/10 bg-[#eaf0fb] px-3 py-2 text-left text-xs font-black text-[#111827]";
const tableSelectClass =
  "w-full rounded-lg border border-black/10 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700 outline-none transition focus:border-[#082d77] disabled:opacity-60";

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

const formatCurrency = (value, currency = "TZS") => {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount)) return `${currency} 0`;
  return `${currency} ${amount.toLocaleString()}`;
};

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

const modalOverlayClass =
  "fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm";
const modalCardClass =
  "max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl shadow-slate-950/20";
const modalHeaderClass =
  "sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5";
const modalCancelClass =
  "rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50";
const modalSubmitClass =
  "rounded-xl bg-[#082d77] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#061f54] disabled:cursor-not-allowed disabled:opacity-60";

const ACTIVITY_OPTIONS = [
  "Weekly coaching call",
  "Financial advisory",
  "Milestone review",
  "Business model support",
  "Governance / compliance",
  "Market linkage support",
  "Investment readiness",
  "CE performance coaching",
  "Red flag follow-up",
];

const formatDateDisplay = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-GB");
};


const normalizeTrancheStages = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => ({
        title: String(item?.title || "").trim(),
        date: item?.date ? String(item.date).slice(0, 10) : "",
        amount: Number(item?.amount || 0),
        // Finance marks a stage Disbursed when it releases the tranche — keep it
        // so the summary cards can tell which tranches are already out.
        status: item?.status ? String(item.status) : "",
      }))
      // A tranche without a planned date is still a tranche; it must not vanish
      // from the totals just because finance left the date blank.
      .filter((item) => item.title);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return normalizeTrancheStages(parsed);
    } catch (error) {
      return [];
    }
  }

  return [];
};

const parseSubmissionAttachments = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

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

const EnterpriseTrackerDetails = () => {
  const { enterpriseUuid } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  // Read-only mode (e.g. admin viewing from the tracker overview).
  const readOnly = searchParams.get("view") === "1";

  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState(null);

  const [showWeekLogModal, setShowWeekLogModal] = useState(false);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [expandedWeeklyUuid, setExpandedWeeklyUuid] = useState(null);
  // The open tranche lives in the URL so it is its own page: the browser's back
  // button returns to the tranche list and the view can be linked to.
  // "" shows the list, "__all__" shows every milestone.
  const openTranche = searchParams.get("tranche") || "";
  const setOpenTranche = (key) => {
    const next = new URLSearchParams(searchParams);
    if (key) next.set("tranche", key);
    else next.delete("tranche");
    setSearchParams(next);
  };

  // The milestones section is tabbed the same way the startup's is: the plan
  // ("Milestones") and the reports filed against it ("Milestone Reporting").
  const [milestoneTab, setMilestoneTab] = useState("milestones");

  const [weekLogForm, setWeekLogForm] = useState({
    weekStart: "",
    facilitator: "",
    hours: "",
    touchpoints: "",
    activities: [],
    focus: "",
    outcomes: "",
    barriers: "",
    nextPlan: "",
    engagement: "high",
    flag: "green",
  });

  const [milestoneForm, setMilestoneForm] = useState({
    title: "",
    dueDate: "",
    status: "pending",
    linkedTranche: "None",
    description: "",
  });

  const [reviewState, setReviewState] = useState({});
  const [reviewingById, setReviewingById] = useState({});

  const enterprise = details?.enterprise;
  const weeklyLogs = details?.weeklyLogs || [];
  const milestones = details?.milestones || [];
  const trancheStages = useMemo(() => {
    const fromResponse = details?.trancheStages;
    if (Array.isArray(fromResponse)) {
      return normalizeTrancheStages(fromResponse);
    }

    return normalizeTrancheStages(enterprise?.trancheStages);
  }, [details?.trancheStages, enterprise?.trancheStages]);

  const milestoneGroups = useMemo(
    () => groupMilestonesByTranche(milestones, trancheStages),
    [milestones, trancheStages],
  );

  // Every section opens on its tranche list, so no tranche is open until one is
  // picked: "" shows the list, "__all__" drops the filter.
  const visibleMilestones = useMemo(() => {
    if (openTranche === "__all__") return milestones;
    return milestoneGroups.find((g) => g.key === openTranche)?.items || [];
  }, [openTranche, milestoneGroups, milestones]);

  // The finance officer mirrors the grant contract onto this startup's entry in
  // the program markers, which persist reliably. Read it from there when the
  // enterprise record does not carry it — the program is already attached to the
  // enterprise, so this costs no extra request.
  const financeMember = useMemo(() => {
    const program = details?.program || enterprise?.Program || null;
    const entUuid =
      enterprise?.entreprenuer_uuid || enterprise?.Entreprenuer?.uuid || "";
    if (!program || !entUuid) return null;
    return (
      parseTrackerProgramMeta(program).startups.find(
        (m) => m?.entreprenuerUuid === entUuid,
      ) || null
    );
  }, [details?.program, enterprise]);

  // Grant financial summary shown below the hero — the same cards the startup
  // and the finance officer see. A tranche counts as released either because
  // finance marked the stage Disbursed, or because the milestone linked to it
  // was disbursed through the plan workflow.
  const grantStats = useMemo(() => {
    const isTrancheDisbursed = (stage) => {
      if (String(stage?.status || "").toLowerCase() === "disbursed") return true;
      const linked = milestones.find((m) => m.linkedTranche === stage?.title);
      return Boolean(
        linked &&
          (String(linked.planStatus) === PLAN_STATUS.DISBURSED || linked.disbursed),
      );
    };

    const stagesTotal = trancheStages.reduce(
      (sum, t) => sum + Number(t.amount || 0),
      0,
    );
    const committed = Number(enterprise?.grantUsd || 0) || stagesTotal;
    const disbursed = trancheStages
      .filter(isTrancheDisbursed)
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const remaining = Math.max(0, committed - disbursed);
    const disbursedPct = committed > 0 ? (disbursed / committed) * 100 : 0;
    const remainingPct = committed > 0 ? (remaining / committed) * 100 : 0;
    const next = trancheStages.find((stage) => !isTrancheDisbursed(stage)) || null;

    return { committed, disbursed, remaining, disbursedPct, remainingPct, next };
  }, [enterprise?.grantUsd, trancheStages, milestones]);

  const loadDetails = async () => {
    if (!enterpriseUuid) return;

    setLoading(true);
    try {
      const response = await getMentorEnterpriseDetails(enterpriseUuid);
      setDetails(response);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to load enterprise",
      );
      navigate("/dashboard/mentorTracker");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [enterpriseUuid]);

  const onToggleActivity = (activity) => {
    setWeekLogForm((prev) => {
      const exists = prev.activities.includes(activity);
      return {
        ...prev,
        activities: exists
          ? prev.activities.filter((item) => item !== activity)
          : [...prev.activities, activity],
      };
    });
  };


  const onSubmitWeekLog = async (e) => {
    e.preventDefault();
    try {
      await createMentorEnterpriseWeeklyLog(enterpriseUuid, weekLogForm);
      toast.success("Weekly log saved");
      setShowWeekLogModal(false);
      setWeekLogForm({
        weekStart: "",
        facilitator: "",
        hours: "",
        touchpoints: "",
        activities: [],
        focus: "",
        outcomes: "",
        barriers: "",
        nextPlan: "",
        engagement: "high",
        flag: "green",
      });
      loadDetails();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to save weekly log",
      );
    }
  };

  const onSubmitMilestone = async (e) => {
    e.preventDefault();
    try {
      await createMentorEnterpriseMilestone(enterpriseUuid, milestoneForm);
      toast.success("Milestone saved");
      setShowMilestoneModal(false);
      setMilestoneForm({
        title: "",
        dueDate: "",
        status: "pending",
        linkedTranche: "None",
        description: "",
      });
      loadDetails();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save milestone");
    }
  };

  // The BDA's verdict on a submitted report, one of three:
  //
  //   approve  — hands it to the finance officer. SENT_TO_FINANCE is what puts
  //              the milestone in front of them with the disburse decision
  //              (see canDisburse).
  //   decline  — sets the milestone back to REPORT_STATUS.REJECTED, a status the
  //              startup can submit from again, so it can be fixed and resent.
  //   info     — the report is not wrong, it is short of detail. Same effect for
  //              the startup (the row reopens), but it does not read as a
  //              rejection to anyone looking at the milestone afterwards.
  //
  // Only approving is silent: the other two go back to the startup, so they have
  // to say what is wanted.
  const onReviewReport = async (uuid, verdict) => {
    const note = reviewState[uuid]?.reportReviewNotes || "";
    if (verdict !== "approve" && !note.trim()) {
      toast.error("Add a comment so the startup knows what to change");
      return;
    }

    const outcome = {
      approve: {
        status: REPORT_STATUS.COMPLETED,
        planStatus: PLAN_STATUS.SENT_TO_FINANCE,
        toast: "Report approved and sent to finance",
      },
      decline: {
        status: REPORT_STATUS.REJECTED,
        toast: "Report declined",
      },
      info: {
        status: REPORT_STATUS.INFO_REQUESTED,
        toast: "Further information requested from the startup",
      },
    }[verdict];

    if (!outcome) return;

    setReviewingById((prev) => ({ ...prev, [uuid]: true }));
    try {
      await reviewTrackerMilestone(uuid, {
        status: outcome.status,
        mentorReviewNotes: note,
        // The plan stays approved on a decline or an info request — otherwise
        // the milestone would drop out of the startup's reporting tab and they
        // could not answer.
        ...(outcome.planStatus ? { planStatus: outcome.planStatus } : {}),
      });
      toast.success(outcome.toast);
      setReviewState((prev) => ({
        ...prev,
        [uuid]: { ...prev[uuid], reportReviewNotes: "" },
      }));
      loadDetails();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to review the report");
    } finally {
      setReviewingById((prev) => ({ ...prev, [uuid]: false }));
    }
  };

  // Phase 3: BDA approves / requests revision / rejects the proposed plan.
  const onReviewPlan = async (uuid, planStatus) => {
    setReviewingById((prev) => ({ ...prev, [uuid]: true }));
    try {
      await reviewTrackerMilestone(uuid, {
        planStatus,
        mentorReviewNotes: reviewState[uuid]?.mentorReviewNotes || "",
      });
      toast.success(
        planStatus === PLAN_STATUS.APPROVED
          ? "Plan approved — ready for disbursement"
          : planStatus === PLAN_STATUS.REVISION_REQUESTED
            ? "Revision requested"
            : "Plan rejected",
      );
      setReviewState((prev) => ({ ...prev, [uuid]: {} }));
      loadDetails();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update plan");
    } finally {
      setReviewingById((prev) => ({ ...prev, [uuid]: false }));
    }
  };

  // Phase 7: BDA verifies milestone achievement.
  const onVerifyMilestone = async (uuid, verificationStatus) => {
    setReviewingById((prev) => ({ ...prev, [uuid]: true }));
    try {
      await reviewTrackerMilestone(uuid, {
        verificationStatus,
        mentorReviewNotes: reviewState[uuid]?.mentorReviewNotes || "",
      });
      toast.success("Milestone verification recorded");
      setReviewState((prev) => ({ ...prev, [uuid]: {} }));
      loadDetails();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to verify milestone");
    } finally {
      setReviewingById((prev) => ({ ...prev, [uuid]: false }));
    }
  };

  if (loading) {
    return <Loader />;
  }

  const completedMilestones = milestones.filter(
    (item) => String(item.status || "").toLowerCase() === "completed",
  ).length;
  const milestoneProgress = milestones.length
    ? Math.round((completedMilestones / milestones.length) * 100)
    : 0;

  // Each section opens on its tranche list and drills into one, the same way the
  // startup's does. The open tranche lives in the URL, so the view can still be
  // linked to and the back button steps out of it. `suffix` names the rows for
  // the section they are in ("Tranche 1 Milestones", "Tranche 1 Reports").
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
    <p className="text-sm font-bold text-slate-950">
      {openTranche === "__all__" ? allLabel : openTranche}
    </p>
  );

  return (
    <div className="min-h-screen bg-[#f3f6fb] px-4 py-6 text-slate-950 md:px-6">
      <main className="mx-auto w-full space-y-8">
        <button
          type="button"
          onClick={() => navigate("/dashboard/mentorTracker")}
          className="inline-flex items-center gap-2 text-sm font-bold text-[#082d77] transition hover:text-[#061f54]"
        >
          <span aria-hidden>&larr;</span> Back to startups
        </button>

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
                  {enterprise?.name || "Enterprise"}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/85 md:text-base">
                  {enterprise?.businessDescription ||
                    "Track milestones, mentorship activity, KPI progress, and milestone-linked funding tranches from one governance workspace."}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => navigate(`/dashboard/mentorTracker/enterprise-kyc/${enterpriseUuid}?view=1`)}
                  className="rounded-xl bg-white/15 px-4 py-2.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/25"
                >
                  View KYC
                </button>
                {!readOnly && (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowMilestoneModal(true)}
                      className="rounded-xl bg-white px-4 py-2.5 text-sm font-black text-[#082d77] shadow-sm transition hover:bg-white/90"
                    >
                      + Milestone
                    </button>
                  </>
                )}
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
          programName={enterprise?.Program?.title}
        />

        <div className="space-y-8">
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
            />

            {/* The startup's own budget document, uploaded from their
                Attachments tab — read-only here, the BDA just views it. */}
            {(() => {
              const documents = parseDocuments(enterprise?.documents);
              const budgetDocumentUrl = documents.budgetDocumentUrl;
              if (!budgetDocumentUrl) return null;

              return (
                <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/70">
                  <div className="mb-1 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-emerald-600" />
                    <h2 className="text-lg font-black tracking-tight text-slate-950">
                      Budget Document
                    </h2>
                  </div>
                  {documents.budgetDocumentDescription && (
                    <p className="mb-3 text-sm text-slate-500">
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

            {/* The plan and the reports filed against it, split the same way
                the startup sees them. */}
            <div className="flex flex-wrap gap-2">
              {[
                { id: "milestones", label: "Milestones" },
                { id: "status", label: "Milestone Status" },
                { id: "report", label: "Milestone Reporting" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    // A section always opens on its tranche list, so switching
                    // to one closes whichever tranche was drilled into.
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

            {milestoneTab === "status" && (
              <PortalCard
                icon={<Flag className="h-5 w-5" />}
                title="Milestone Status"
                subtitle="Where every milestone stands across the tranches — whether you have approved the plan, and what has happened to the report filed against it."
              >
                <div className="space-y-4">
                  {milestones.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                      No milestones yet.
                    </div>
                  )}

                  {milestones.length > 0 &&
                    !openTranche &&
                    renderTrancheList("Tranche Milestones", "Milestones")}

                  {openTranche && renderTrancheHeading("All milestones")}

                  {openTranche && (
                    <div className="-mx-6 px-1">
                      {/* The open tranche only. The heading names it, so the
                          tranche column is dropped — except on "All milestones",
                          where it is the only thing telling the rows apart. */}
                      <MilestoneStatusTable
                        rows={visibleMilestones}
                        showTranche={openTranche === "__all__"}
                      />
                    </div>
                  )}
                </div>
              </PortalCard>
            )}

            {milestoneTab === "report" && (
              <PortalCard
                icon={<ClipboardList className="h-5 w-5" />}
                title="Milestone Reporting"
                subtitle="The startup's reports for this tranche — planned against actual spend, with their evidence. Approve a report to send it to the finance officer, or decline it back to the startup."
              >
                <div className="space-y-4">
                  {milestones.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                      No milestones yet.
                    </div>
                  )}

                  {milestones.length > 0 &&
                    !openTranche &&
                    renderTrancheList("Tranche Reports", "Reports")}

                  {openTranche && renderTrancheHeading("All reports")}

                  {openTranche && visibleMilestones.length > 0 && (
                    <div className="-mx-6 px-1">
                      <MilestoneReportTable
                        showReview
                        reviewLabel="Business coach comment"
                        rows={visibleMilestones.map((item) => {
                          const status = String(item.status || "").toLowerCase();
                          const ps = item.planStatus || "";
                          // The startup has filed a report nobody has ruled on.
                          const awaitingReview = status === "submitted";
                          const sentToFinance =
                            ps === PLAN_STATUS.SENT_TO_FINANCE ||
                            ps === PLAN_STATUS.DISBURSED ||
                            Boolean(item.disbursed);

                          return {
                            uuid: item.uuid,
                            title: item.title,
                            activity: item.tranchePlannedUse,
                            kpiImpact: milestoneKpiImpact(item),
                            timeline: milestoneTimelineSpan(item),
                            report: reportFromMilestone(item),
                            attachments: parseSubmissionAttachments(
                              item.submissionAttachments,
                            ),

                            // Comment written in the row being reviewed; the
                            // recorded one once it has been ruled on.
                            reviewComment:
                              !readOnly && awaitingReview ? (
                                <textarea
                                  className={`${baseInputClass} min-h-[70px]`}
                                  placeholder="Comment (required when declining)"
                                  value={
                                    reviewState[item.uuid]?.reportReviewNotes || ""
                                  }
                                  onChange={(e) =>
                                    setReviewState((prev) => ({
                                      ...prev,
                                      [item.uuid]: {
                                        ...prev[item.uuid],
                                        reportReviewNotes: e.target.value,
                                      },
                                    }))
                                  }
                                />
                              ) : item.mentorReviewNotes ? (
                                <p className="text-[#334155]">
                                  {item.mentorReviewNotes}
                                </p>
                              ) : null,

                            action:
                              !readOnly && awaitingReview ? (
                                // One verdict per row, picked from the list and
                                // applied as soon as it is chosen — the same
                                // shape as the plan verdict on the Milestones
                                // tab.
                                <select
                                  className={tableSelectClass}
                                  value=""
                                  disabled={reviewingById[item.uuid]}
                                  onChange={(e) => {
                                    if (e.target.value)
                                      onReviewReport(item.uuid, e.target.value);
                                  }}
                                >
                                  <option value="">
                                    {reviewingById[item.uuid]
                                      ? "Saving..."
                                      : "Select verdict"}
                                  </option>
                                  <option value="approve">Approve</option>
                                  <option value="decline">Decline</option>
                                  <option value="info">
                                    Request further information
                                  </option>
                                </select>
                              ) : (
                                <span className="text-xs font-semibold text-slate-600">
                                  {sentToFinance
                                    ? "Approved — with finance"
                                    : status === REPORT_STATUS.REJECTED
                                      ? "Declined"
                                      : status === REPORT_STATUS.INFO_REQUESTED
                                        ? "Further information requested"
                                        : status === REPORT_STATUS.COMPLETED
                                          ? "Completed"
                                          : "No report submitted yet"}
                                </span>
                              ),
                          };
                        })}
                      />
                    </div>
                  )}
                </div>
              </PortalCard>
            )}

            {milestoneTab === "milestones" && (
            <PortalCard
              icon={<Flag className="h-5 w-5" />}
              title="Milestones"
              subtitle="Create milestones, review the plan the startup proposed, and drive tranche eligibility."
              action={
                readOnly ? undefined : (
                  <button
                    type="button"
                    onClick={() => setShowMilestoneModal(true)}
                    className="rounded-xl border border-[#082d77]/20 bg-[#082d77]/5 px-4 py-2.5 text-sm font-bold text-[#082d77] transition hover:bg-[#082d77]/10"
                  >
                    + New Milestone
                  </button>
                )
              }
            >
              <div className="space-y-4">
                {milestones.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                    No milestones yet.
                  </div>
                )}

                {milestones.length > 0 &&
                  !openTranche &&
                  renderTrancheList("Tranche Milestones", "Milestones")}

                {openTranche && renderTrancheHeading("All milestones")}

                {/* The submitted plans, one row each: what the startup proposed,
                    where it stands, and the verdict you can give it. */}
                {openTranche && visibleMilestones.length > 0 && (
                  <div className="-mx-6 overflow-x-auto px-1">
                    <table
                      className="w-full table-fixed border-collapse bg-white"
                      style={{ minWidth: "1030px" }}
                    >
                      <thead>
                        <tr>
                          <th className={`${tableHeadClass} w-[28%]`}>Milestone</th>
                          <th className={`${tableHeadClass} w-[11%]`}>Planned funds</th>
                          <th className={`${tableHeadClass} w-[10%]`}>Timeline</th>
                          <th className={`${tableHeadClass} w-[15%]`}>Verification</th>
                          <th className={`${tableHeadClass} w-[19%]`}>Review note</th>
                          <th className={`${tableHeadClass} w-[17%]`}>Action</th>
                        </tr>
                      </thead>

                      <tbody>
                        {visibleMilestones.map((item) => {
                          const ps = item.planStatus || "";
                          const vs = item.verificationStatus || "";
                          const verificationRequested = Boolean(
                            item.verificationRequested,
                          );
                          const reviewable = !readOnly && canReviewPlan(ps);
                          const plannedAmount = milestonePlannedAmount(item);
                          const timelineSpan = milestoneTimelineSpan(item);

                          return (
                            <tr
                              key={item.uuid}
                              className="odd:bg-white even:bg-[#f8fafc]"
                            >
                              <td
                                className={`${tableCellClass} font-bold text-[#111827]`}
                              >
                                {item.title}
                                {item.tranchePlannedUse ? (
                                  <span className="mt-1 block text-xs font-normal text-[#64748b]">
                                    {item.tranchePlannedUse}
                                  </span>
                                ) : null}
                                {milestoneKpiImpact(item) ? (
                                  <span className="mt-1 block text-xs font-normal text-emerald-700">
                                    KPI/Impact: {milestoneKpiImpact(item)}
                                  </span>
                                ) : null}
                              </td>

                              <td className={tableCellClass}>
                                {formatReportAmount(plannedAmount)}
                              </td>

                              <td className={tableCellClass}>
                                {timelineSpan || (
                                  <span className="text-[#94a3b8]">—</span>
                                )}
                              </td>

                              <td className={tableCellClass}>
                                <span
                                  className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold ${verificationPill(vs)}`}
                                >
                                  {verificationLabel(vs)}
                                </span>
                                {verificationRequested && (
                                  <span className="mt-1 block text-xs font-semibold text-amber-600">
                                    Verification requested
                                  </span>
                                )}
                              </td>

                              {/* Written where the verdict is given; the note
                                  already on record once it has been given. */}
                              <td className={tableCellClass}>
                                {reviewable ? (
                                  <textarea
                                    className={`${baseInputClass} min-h-[70px]`}
                                    placeholder="Optional for approve, recommended for revision/reject"
                                    value={
                                      reviewState[item.uuid]?.mentorReviewNotes || ""
                                    }
                                    onChange={(e) =>
                                      setReviewState((prev) => ({
                                        ...prev,
                                        [item.uuid]: {
                                          ...prev[item.uuid],
                                          mentorReviewNotes: e.target.value,
                                        },
                                      }))
                                    }
                                  />
                                ) : item.mentorReviewNotes ? (
                                  item.mentorReviewNotes
                                ) : (
                                  <span className="text-[#94a3b8]">—</span>
                                )}
                              </td>

                              <td className={tableCellClass}>
                                <div className="flex flex-col gap-2">
                                  {/* One verdict per row, picked from the list —
                                      it applies as soon as it is chosen. Where
                                      the plan ends up is read on the Milestone
                                      Status tab. */}
                                  {reviewable && (
                                    <select
                                      className={tableSelectClass}
                                      value=""
                                      disabled={reviewingById[item.uuid]}
                                      onChange={(e) => {
                                        if (e.target.value)
                                          onReviewPlan(item.uuid, e.target.value);
                                      }}
                                    >
                                      <option value="">
                                        {reviewingById[item.uuid]
                                          ? "Saving..."
                                          : "Select verdict"}
                                      </option>
                                      <option value={PLAN_STATUS.APPROVED}>
                                        Approve plan
                                      </option>
                                      <option value={PLAN_STATUS.REVISION_REQUESTED}>
                                        Request revision
                                      </option>
                                      <option value={PLAN_STATUS.REJECTED}>
                                        Reject
                                      </option>
                                    </select>
                                  )}

                                  {/* Verification is a separate call, made once
                                      the startup asks for it. */}
                                  {!readOnly && verificationRequested && (
                                    <select
                                      className={tableSelectClass}
                                      value=""
                                      disabled={reviewingById[item.uuid]}
                                      onChange={(e) => {
                                        if (e.target.value)
                                          onVerifyMilestone(item.uuid, e.target.value);
                                      }}
                                    >
                                      <option value="">Verify milestone</option>
                                      {VERIFICATION_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                          {opt.label}
                                        </option>
                                      ))}
                                    </select>
                                  )}

                                  {!reviewable && !verificationRequested && (
                                    <span className="text-xs font-semibold text-[#64748b]">
                                      {String(item.status || "").toLowerCase() ===
                                      "submitted"
                                        ? "Report awaiting your review"
                                        : "No action needed"}
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </PortalCard>
            )}
        </div>
      </main>

      {showMilestoneModal && (
        <div className={modalOverlayClass}>
          <form onSubmit={onSubmitMilestone} className={modalCardClass}>
            <div className={modalHeaderClass}>
              <div>
                <h3 className="text-2xl font-black text-slate-950">Add milestone</h3>
                <p className="mt-1 text-sm text-slate-500">Create a milestone for {enterprise?.name || "this startup"}.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowMilestoneModal(false)}
                className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50"
              >
                ×
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <FieldLabel>Milestone title</FieldLabel>
                <input className={baseInputClass} placeholder="Milestone title" value={milestoneForm.title} onChange={(e) => setMilestoneForm((prev) => ({ ...prev, title: e.target.value }))} required />
              </div>
              <div>
                <FieldLabel>Due date</FieldLabel>
                <input className={baseInputClass} type="date" value={milestoneForm.dueDate} onChange={(e) => setMilestoneForm((prev) => ({ ...prev, dueDate: e.target.value }))} />
              </div>
              <div>
                <FieldLabel>Initial status</FieldLabel>
                <select className={baseInputClass} value={milestoneForm.status} onChange={(e) => setMilestoneForm((prev) => ({ ...prev, status: e.target.value }))}>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <FieldLabel>Linked tranche</FieldLabel>
                <select className={baseInputClass} value={milestoneForm.linkedTranche} onChange={(e) => setMilestoneForm((prev) => ({ ...prev, linkedTranche: e.target.value }))}>
                  <option value="None">None</option>
                  {trancheStages.map((item, index) => (
                    <option key={`${item.title}-${item.date}-${index}`} value={item.title}>
                      {item.title} ({formatDateDisplay(item.date)} · {formatCurrency(item.amount)})
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <FieldLabel>Description</FieldLabel>
                <textarea className={`${baseInputClass} min-h-[90px]`} placeholder="Description" value={milestoneForm.description} onChange={(e) => setMilestoneForm((prev) => ({ ...prev, description: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-5">
              <button type="button" onClick={() => setShowMilestoneModal(false)} className={modalCancelClass}>Cancel</button>
              <button type="submit" className={modalSubmitClass}>Save milestone</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default EnterpriseTrackerDetails;
