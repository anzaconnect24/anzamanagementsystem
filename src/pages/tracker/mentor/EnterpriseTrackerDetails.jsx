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
import TrancheGroupList, {
  groupMilestonesByTranche,
} from "@/components/tracker/TrancheGroupList";
import { Flag } from "lucide-react";
import {
  PLAN_STATUS,
  canReviewPlan,
  VERIFICATION_OPTIONS,
  verificationLabel,
  verificationPill,
} from "@/utils/trancheWorkflow";

const HERO_IMAGE_URL = "/images/mentor_hero.svg";

const baseInputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#082d77] focus:ring-4 focus:ring-[#082d77]/20 disabled:bg-slate-50 disabled:text-slate-400";

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

const formatMilestoneStatus = (status) =>
  String(status || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

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
  const [expandedMilestoneUuid, setExpandedMilestoneUuid] = useState(null);
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

  const visibleMilestones = useMemo(() => {
    if (openTranche === "__all__") return milestones;
    return (
      milestoneGroups.find((g) => g.key === openTranche)?.items || milestones
    );
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

  // The BDA accepts or declines the startup's submitted report. Declining sets
  // the milestone back to "rejected", which is a status the startup can submit
  // from again — so a declined report can be edited and resubmitted. Accepting
  // hands it to the finance officer: SENT_TO_FINANCE is what puts the milestone
  // in front of them with the disburse decision (see canDisburse).
  const onReviewReport = async (uuid, accepted) => {
    const note = reviewState[uuid]?.reportReviewNotes || "";
    if (!accepted && !note.trim()) {
      toast.error("Add a comment so the startup knows what to change");
      return;
    }

    setReviewingById((prev) => ({ ...prev, [uuid]: true }));
    try {
      await reviewTrackerMilestone(uuid, {
        status: accepted ? "completed" : "rejected",
        mentorReviewNotes: note,
        ...(accepted ? { planStatus: PLAN_STATUS.SENT_TO_FINANCE } : {}),
      });
      toast.success(
        accepted ? "Report approved and sent to finance" : "Report declined",
      );
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
  return (
    <div className="min-h-screen bg-[#f3f6fb] px-4 py-6 text-slate-950 md:px-8 xl:px-12">
      <main className="mx-auto max-w-[1480px] space-y-8">
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

            <PortalCard
              icon={<Flag className="h-5 w-5" />}
              title="Milestones"
              subtitle="Create milestones, review entrepreneur reports and evidence, and drive tranche eligibility."
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
                  const attachments = parseSubmissionAttachments(item.submissionAttachments);
                  const expanded = expandedMilestoneUuid === item.uuid;
                  const ps = item.planStatus || "";
                  const vs = item.verificationStatus || "";
                  const verificationRequested = Boolean(item.verificationRequested);
                  // The startup has sent a report and it has not been ruled on.
                  const reportAwaitingReview =
                    String(item.status || "").toLowerCase() === "submitted";

                  return (
                    <div key={item.uuid} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedMilestoneUuid((prev) => (prev === item.uuid ? null : item.uuid))
                        }
                        className="flex w-full flex-wrap items-start justify-between gap-3 text-left"
                      >
                        {/* Same shape as the startup's own milestone list: the
                            name, with key activities (stored on
                            tranchePlannedUse) as the description. */}
                        <div className="flex min-w-0 flex-1 gap-3">
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-sm font-black text-slate-700">
                            {item.status === "completed" ? "✓" : index + 1}
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
                        <div className="flex flex-col items-end gap-1">
                          <StatusText>{formatMilestoneStatus(item.status)}</StatusText>
                        </div>
                      </button>

                      {/* Indented to clear the number badge (2.5rem + 0.75rem
                          gap) so the report lines up with the milestone name. */}
                      {expanded && (
                        <div className="mt-4 space-y-3 sm:pl-[3.25rem]">
                          {/* The startup's submitted report: their comments, the
                              evidence they attached, and any feedback already
                              given on it. */}
                          {(item.submissionNotes ||
                            item.mentorReviewNotes ||
                            item.financeReviewNotes ||
                            attachments.length > 0) && (
                            <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                              {item.submissionNotes && (
                                <p>
                                  <span className="font-bold text-slate-950">
                                    Submitted report:
                                  </span>{" "}
                                  {item.submissionNotes}
                                </p>
                              )}
                              {item.mentorReviewNotes && (
                                <p>
                                  <span className="font-bold text-slate-950">
                                    Your feedback:
                                  </span>{" "}
                                  {item.mentorReviewNotes}
                                </p>
                              )}
                              {item.financeReviewNotes && (
                                <p>
                                  <span className="font-bold text-slate-950">
                                    Finance feedback:
                                  </span>{" "}
                                  {item.financeReviewNotes}
                                </p>
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

                          {/* Accept or decline that report. Declining returns it
                              to the startup to edit and resubmit. */}
                          {!readOnly && reportAwaitingReview && (
                            <div className="rounded-2xl border border-slate-100 p-4">
                              <div className="flex flex-col gap-2 md:flex-row md:items-center">
                                <input
                                  className={`${baseInputClass} md:flex-1`}
                                  placeholder="Comment (required when declining)"
                                  value={reviewState[item.uuid]?.reportReviewNotes || ""}
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
                                <div className="flex flex-wrap gap-2 md:shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => onReviewReport(item.uuid, true)}
                                    disabled={reviewingById[item.uuid]}
                                    className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                                  >
                                    Approve report
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onReviewReport(item.uuid, false)}
                                    disabled={reviewingById[item.uuid]}
                                    className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-rose-700 disabled:opacity-60"
                                  >
                                    Decline report
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {!readOnly && canReviewPlan(ps) && (
                            <div className="rounded-2xl border border-slate-100 p-4">
                              {/* Note and the three verdicts on one row. */}
                              <div className="flex flex-col gap-2 md:flex-row md:items-center">
                                <input
                                  className={`${baseInputClass} md:flex-1`}
                                  placeholder="Review note (optional for approve, recommended for revision/reject)"
                                  value={reviewState[item.uuid]?.mentorReviewNotes || ""}
                                  onChange={(e) =>
                                    setReviewState((prev) => ({
                                      ...prev,
                                      [item.uuid]: { ...prev[item.uuid], mentorReviewNotes: e.target.value },
                                    }))
                                  }
                                />
                                <div className="flex flex-wrap gap-2 md:shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => onReviewPlan(item.uuid, PLAN_STATUS.APPROVED)}
                                    disabled={reviewingById[item.uuid]}
                                    className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                                  >
                                    Approve plan
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onReviewPlan(item.uuid, PLAN_STATUS.REVISION_REQUESTED)}
                                    disabled={reviewingById[item.uuid]}
                                    className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-amber-600 disabled:opacity-60"
                                  >
                                    Request revision
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onReviewPlan(item.uuid, PLAN_STATUS.REJECTED)}
                                    disabled={reviewingById[item.uuid]}
                                    className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-rose-700 disabled:opacity-60"
                                  >
                                    Reject
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {(verificationRequested || vs) && (
                            <div className="rounded-2xl border border-slate-100 p-4">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs font-black uppercase tracking-wide text-[#082d77]">Milestone verification</p>
                                <span className={`rounded-full px-3 py-1 text-xs font-bold ${verificationPill(vs)}`}>
                                  {verificationLabel(vs)}
                                </span>
                              </div>
                              {verificationRequested && (
                                <p className="mt-2 text-xs font-semibold text-amber-600">
                                  Entrepreneur has requested verification.
                                </p>
                              )}
                              {!readOnly && verificationRequested && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {VERIFICATION_OPTIONS.map((opt) => (
                                    <button
                                      key={opt.value}
                                      type="button"
                                      onClick={() => onVerifyMilestone(item.uuid, opt.value)}
                                      disabled={reviewingById[item.uuid]}
                                      className="rounded-xl border border-[#082d77]/20 bg-[#082d77]/5 px-4 py-2.5 text-sm font-bold text-[#082d77] transition hover:bg-[#082d77]/10 disabled:opacity-60"
                                    >
                                      {opt.label}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </PortalCard>
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
