import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Building2, CalendarClock, IdCard, Plus } from "lucide-react";
import Loader from "@/components/common/Loader";
import CoachingSessionsPanel, {
  formatSessionDate,
  isSessionRequested,
} from "@/components/tracker/CoachingSessionsPanel";
import {
  MaterialsInput,
  parseMaterials,
} from "@/components/tracker/SessionMaterials";

const HERO_IMAGE_URL = "/images/mentor_hero.svg";
import {
  createCoachingSession,
  updateCoachingSession,
  getEntrepreneurCoachingSessions,
} from "@/controllers/coaching_session_controller";

const FLAG_OPTIONS = [
  { value: "green", label: "Green - on track" },
  { value: "amber", label: "Amber - at risk" },
  { value: "red", label: "Red - critical" },
];

// Part 1 — setting up (scheduling) a session before it happens.
const EMPTY_SETUP = {
  title: "",
  purpose: "",
  sessionType: "Weekly coaching",
  sessionDate: "",
  sessionTime: "",
  duration: "",
  meetingPlatform: "Google Meet",
  meetingLink: "",
  meetingAccess: "",
  preparationRequired: "",
  nextSessionDate: "",
  // Documents and links shared with the startup for this session.
  materials: [],
};

const MEETING_PLATFORMS = [
  "Google Meet",
  "Zoom",
  "Microsoft Teams",
  "Phone call",
  "In person",
  "Other",
];

// Part 2 — reporting on the session after it has taken place.
const EMPTY_REPORT = {
  issuesDiscussed: "",
  recommendationsGiven: "",
  actionsAgreed: "",
  flag: "green",
  materials: [],
};

const baseInputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#082d77] focus:ring-4 focus:ring-[#082d77]/20 disabled:bg-slate-50 disabled:text-slate-400";

const FieldLabel = ({ children }) => (
  <label className="mb-1.5 block text-xs font-bold tracking-wide text-slate-500">
    {children}
  </label>
);

const modalOverlayClass =
  "fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm";
const modalCardClass =
  "max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl shadow-slate-950/20";

// Coaching session setup for one startup. Reached by selecting a startup on the
// BDA's coaching sessions page, which passes the display name through the query
// string so the header reads correctly without another lookup.
const BdaCoachingSessionSetup = () => {
  const { entUuid } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const startupName = searchParams.get("name") || "this startup";
  // The business profile is keyed by the business, which the startups list
  // passes through; without it there is nothing to link to.
  const businessUuid = searchParams.get("business") || "";

  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // The modal runs in one of three modes: "setup" (schedule a new session),
  // "report" (file the post-session report against a scheduled one) or
  // "materials" (share learning materials on an existing session).
  const [modalMode, setModalMode] = useState(null);
  const [reportTarget, setReportTarget] = useState(null);
  const [setupForm, setSetupForm] = useState(EMPTY_SETUP);
  const [reportForm, setReportForm] = useState(EMPTY_REPORT);
  const [materialsDraft, setMaterialsDraft] = useState([]);
  // Set when the setup form is answering a request the startup sent, rather
  // than creating a session from scratch.
  const [setupTarget, setSetupTarget] = useState(null);
  const [declineReason, setDeclineReason] = useState("");
  // An upload in flight — saving is held back until the file has a URL.
  const [isUploading, setIsUploading] = useState(false);

  const setSetupField = (key, value) =>
    setSetupForm((prev) => ({ ...prev, [key]: value }));
  const setReportField = (key, value) =>
    setReportForm((prev) => ({ ...prev, [key]: value }));

  const openSetup = () => {
    setSetupTarget(null);
    setSetupForm(EMPTY_SETUP);
    setModalMode("setup");
  };

  // Answer a request: the setup form opens on what the startup asked for, and
  // saving turns that same record into the scheduled session.
  const openSchedule = (session) => {
    setSetupTarget(session);
    setSetupForm({
      ...EMPTY_SETUP,
      title: session?.title || "",
      purpose: session?.purpose || "",
      sessionType: session?.sessionType || EMPTY_SETUP.sessionType,
      sessionDate: String(session?.sessionDate || "").slice(0, 10),
      sessionTime: session?.sessionTime || "",
      materials: parseMaterials(session?.materials),
    });
    setModalMode("setup");
  };

  const openDecline = (session) => {
    setReportTarget(session);
    setDeclineReason("");
    setModalMode("decline");
  };

  const openReport = (session) => {
    setReportTarget(session);
    setReportForm({
      issuesDiscussed: session?.issuesDiscussed || "",
      recommendationsGiven: session?.recommendationsGiven || "",
      actionsAgreed: session?.actionsAgreed || "",
      flag: session?.flag || "green",
      materials: parseMaterials(session?.materials),
    });
    setModalMode("report");
  };

  // Share (or tidy up) the materials on a session that already exists, without
  // having to open the report.
  const openMaterials = (session) => {
    setReportTarget(session);
    setMaterialsDraft(parseMaterials(session?.materials));
    setModalMode("materials");
  };

  const closeModal = () => {
    setModalMode(null);
    setReportTarget(null);
    setSetupTarget(null);
    setMaterialsDraft([]);
    setDeclineReason("");
    setIsUploading(false);
  };

  const loadSessions = async () => {
    if (!entUuid) {
      setSessions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getEntrepreneurCoachingSessions(entUuid);
      setSessions(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to load coaching sessions",
      );
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, [entUuid]);

  // Part 1 — create the session in a "scheduled" state (no report yet), or
  // schedule the session the startup requested.
  const onSubmitSetup = async (e) => {
    e.preventDefault();
    if (!entUuid) return;

    setIsSaving(true);
    try {
      if (setupTarget?.uuid) {
        await updateCoachingSession(setupTarget.uuid, {
          ...setupForm,
          status: "scheduled",
          flag: "",
          // A previously declined request that is being scheduled after all
          // should not keep showing why it was turned down.
          declineReason: "",
        });
        toast.success("Session scheduled — the startup can see the details");
      } else {
        await createCoachingSession({
          ...setupForm,
          status: "scheduled",
          flag: "",
          entreprenuer_uuid: entUuid,
        });
        toast.success("Session scheduled");
      }
      closeModal();
      loadSessions();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to schedule the session",
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Turn a request down, with a reason the startup sees on the session.
  const onSubmitDecline = async (e) => {
    e.preventDefault();
    if (!reportTarget?.uuid) return;

    setIsSaving(true);
    try {
      await updateCoachingSession(reportTarget.uuid, {
        status: "declined",
        declineReason: declineReason.trim(),
      });
      toast.success("Request declined");
      closeModal();
      loadSessions();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to decline the request",
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Part 2 — file the report against the scheduled session and mark it done.
  const onSubmitReport = async (e) => {
    e.preventDefault();
    if (!reportTarget?.uuid) return;

    setIsSaving(true);
    try {
      await updateCoachingSession(reportTarget.uuid, {
        ...reportForm,
        status: "completed",
      });
      toast.success("Session report saved");
      closeModal();
      loadSessions();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to save the session report",
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Learning materials on an existing session — saved on their own so they can
  // be shared before the session as easily as after it.
  const onSubmitMaterials = async (e) => {
    e.preventDefault();
    if (!reportTarget?.uuid) return;

    setIsSaving(true);
    try {
      await updateCoachingSession(reportTarget.uuid, {
        materials: materialsDraft,
      });
      toast.success("Learning materials saved");
      closeModal();
      loadSessions();
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          "Failed to save the learning materials",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const pendingRequests = sessions.filter(isSessionRequested);

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-[#f3f6fb] px-4 py-6 text-slate-950 md:px-8 xl:px-12">
      <main className="mx-auto max-w-[1480px] space-y-6">
        <section
          className="relative overflow-hidden rounded-2xl bg-slate-950 px-7 py-6 text-white shadow-sm shadow-slate-300/70 md:px-10 md:py-7"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.6) 50%, rgba(0, 0, 0, 0.2) 100%), url(${HERO_IMAGE_URL})`,
            backgroundPosition: "center",
            backgroundSize: "cover",
          }}
        >
          <div className="relative z-10 flex min-h-[160px] flex-wrap items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-sm font-bold text-white shadow-sm backdrop-blur">
                <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
                Coaching Sessions
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">
                {startupName}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/85 md:text-base">
                Set up coaching sessions for this startup, then report on each
                one after it has taken place.
              </p>
            </div>
          </div>
        </section>

        {/* Who they are coaching: the KYC and the business profile, both
            read-only and reachable without leaving the tracker. */}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() =>
              navigate(
                `/dashboard/mentorTracker/enterprise-kyc?view=1&entreprenuer=${entUuid}&back=${encodeURIComponent(
                  `/dashboard/bdaCoachingSessions/${entUuid}?name=${encodeURIComponent(
                    startupName,
                  )}&business=${encodeURIComponent(businessUuid)}`,
                )}`,
              )
            }
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-[#082d77] shadow-sm transition hover:bg-slate-50"
          >
            <IdCard className="h-4 w-4" />
            Personal KYC
          </button>
          {businessUuid && (
            <button
              type="button"
              onClick={() =>
                navigate(
                  `/dashboard/enterprenuers/businessDetails/${businessUuid}`,
                )
              }
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-[#082d77] shadow-sm transition hover:bg-slate-50"
            >
              <Building2 className="h-4 w-4" />
              Business Information
            </button>
          )}
        </div>

        {/* Requests the startup sent that still need an answer. */}
        {pendingRequests.length > 0 && (
          <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-indigo-100 bg-indigo-50/70 px-6 py-5">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-indigo-600">
                <CalendarClock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-base font-black text-indigo-950">
                  {pendingRequests.length} session request
                  {pendingRequests.length === 1 ? "" : "s"} from {startupName}
                </p>
                <p className="mt-0.5 text-sm text-indigo-900/80">
                  {pendingRequests[0].title ||
                    pendingRequests[0].sessionType ||
                    "Coaching session"}
                  {pendingRequests[0].sessionDate
                    ? ` · preferred ${formatSessionDate(pendingRequests[0].sessionDate)}`
                    : ""}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => openSchedule(pendingRequests[0])}
              className="shrink-0 rounded-xl bg-[#16a34a] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#15803d]"
            >
              Schedule it
            </button>
          </section>
        )}

        <CoachingSessionsPanel
          sessions={sessions}
          onReport={openReport}
          onManageMaterials={openMaterials}
          onSchedule={openSchedule}
          onDecline={openDecline}
          belowCards={
            <div className="flex justify-end">
              <button
                type="button"
                onClick={openSetup}
                className="inline-flex items-center gap-2 rounded-xl bg-[#16a34a] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#15803d]"
              >
                <Plus className="h-4 w-4" />
                Set up new session
              </button>
            </div>
          }
          emptyText={`No coaching sessions set up yet for ${startupName}. Use “Set up a session” to schedule the first one.`}
        />
      </main>

      {/* Part 1 — set up (schedule) a session. */}
      {modalMode === "setup" && (
        <div className={modalOverlayClass}>
          <form onSubmit={onSubmitSetup} className={modalCardClass}>
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
              <div>
                <h3 className="text-2xl font-black text-slate-950">
                  {setupTarget
                    ? "Schedule the requested session"
                    : "Set up a session"}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {setupTarget
                    ? `${startupName} asked for this session — add the date and joining details to confirm it.`
                    : `Schedule a coaching session for ${startupName}. You will report on it after it has taken place.`}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
              {setupTarget?.purpose && (
                <div className="rounded-xl bg-indigo-50/70 px-4 py-3 text-sm leading-6 text-indigo-900 md:col-span-2">
                  <span className="font-bold">What they asked for:</span>{" "}
                  {setupTarget.purpose}
                </div>
              )}
              <div className="md:col-span-2">
                <FieldLabel>Session title</FieldLabel>
                <input
                  className={baseInputClass}
                  placeholder="e.g. Cash-flow planning review"
                  value={setupForm.title}
                  onChange={(e) => setSetupField("title", e.target.value)}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <FieldLabel>Purpose</FieldLabel>
                <input
                  className={baseInputClass}
                  placeholder="What this session is for"
                  value={setupForm.purpose}
                  onChange={(e) => setSetupField("purpose", e.target.value)}
                />
              </div>
              <div>
                <FieldLabel>Session type</FieldLabel>
                <select
                  className={baseInputClass}
                  value={setupForm.sessionType}
                  onChange={(e) => setSetupField("sessionType", e.target.value)}
                >
                  <option value="Weekly coaching">Weekly coaching</option>
                  <option value="Financial advisory">Financial advisory</option>
                  <option value="Milestone review">Milestone review</option>
                </select>
              </div>
              <div>
                <FieldLabel>Date</FieldLabel>
                <input
                  className={baseInputClass}
                  type="date"
                  value={setupForm.sessionDate}
                  onChange={(e) => setSetupField("sessionDate", e.target.value)}
                  required
                />
              </div>
              <div>
                <FieldLabel>Time</FieldLabel>
                <input
                  className={baseInputClass}
                  type="time"
                  value={setupForm.sessionTime}
                  onChange={(e) => setSetupField("sessionTime", e.target.value)}
                />
              </div>
              <div>
                <FieldLabel>Duration</FieldLabel>
                <input
                  className={baseInputClass}
                  placeholder="e.g. 60 minutes"
                  value={setupForm.duration}
                  onChange={(e) => setSetupField("duration", e.target.value)}
                />
              </div>
              <div>
                <FieldLabel>Meeting platform</FieldLabel>
                <select
                  className={baseInputClass}
                  value={setupForm.meetingPlatform}
                  onChange={(e) =>
                    setSetupField("meetingPlatform", e.target.value)
                  }
                >
                  {MEETING_PLATFORMS.map((platform) => (
                    <option key={platform} value={platform}>
                      {platform}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel>Next session date (optional)</FieldLabel>
                <input
                  className={baseInputClass}
                  type="date"
                  value={setupForm.nextSessionDate}
                  onChange={(e) =>
                    setSetupField("nextSessionDate", e.target.value)
                  }
                />
              </div>
              <div className="md:col-span-2">
                <FieldLabel>Meeting link</FieldLabel>
                <input
                  className={baseInputClass}
                  placeholder="https://…"
                  value={setupForm.meetingLink}
                  onChange={(e) => setSetupField("meetingLink", e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <FieldLabel>Meeting ID and passcode</FieldLabel>
                <input
                  className={baseInputClass}
                  placeholder="e.g. 123 4567 8901 · passcode 000000"
                  value={setupForm.meetingAccess}
                  onChange={(e) =>
                    setSetupField("meetingAccess", e.target.value)
                  }
                />
              </div>
              <div className="md:col-span-2">
                <FieldLabel>Preparation required</FieldLabel>
                <textarea
                  className={`${baseInputClass} min-h-[80px]`}
                  placeholder="What the startup should prepare beforehand"
                  value={setupForm.preparationRequired}
                  onChange={(e) =>
                    setSetupField("preparationRequired", e.target.value)
                  }
                />
              </div>

              {/* Learning materials — anything the startup should read, use or
                  fill in around this session. */}
              <div className="md:col-span-2">
                <FieldLabel>Learning materials (optional)</FieldLabel>
                <p className="mb-2 text-xs text-slate-500">
                  Share guides, templates or examples to support {startupName}.
                  They can download them from their coaching sessions page.
                </p>
                <MaterialsInput
                  materials={setupForm.materials}
                  onChange={(next) => setSetupField("materials", next)}
                  onUploadingChange={setIsUploading}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-5">
              <button
                type="button"
                onClick={closeModal}
                disabled={isSaving}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || isUploading}
                className="rounded-xl bg-[#16a34a] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#15803d] disabled:opacity-60"
              >
                {isUploading
                  ? "Uploading materials..."
                  : isSaving
                    ? "Scheduling..."
                    : setupTarget
                      ? "Confirm session"
                      : "Schedule session"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Part 2 — report on a session that has taken place. */}
      {modalMode === "report" && (
        <div className={modalOverlayClass}>
          <form onSubmit={onSubmitReport} className={modalCardClass}>
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
              <div>
                <h3 className="text-2xl font-black text-slate-950">
                  Report on session
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {reportTarget?.sessionType || "Coaching session"}
                  {reportTarget?.sessionDate
                    ? ` · ${formatSessionDate(reportTarget.sessionDate)}`
                    : ""}{" "}
                  for {startupName}.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 p-6">
              <div>
                <FieldLabel>Session status</FieldLabel>
                <select
                  className={baseInputClass}
                  value={reportForm.flag}
                  onChange={(e) => setReportField("flag", e.target.value)}
                >
                  {FLAG_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel>Issues discussed</FieldLabel>
                <textarea
                  className={`${baseInputClass} min-h-[90px]`}
                  placeholder="Issues discussed"
                  value={reportForm.issuesDiscussed}
                  onChange={(e) =>
                    setReportField("issuesDiscussed", e.target.value)
                  }
                />
              </div>
              <div>
                <FieldLabel>Recommendations given</FieldLabel>
                <textarea
                  className={`${baseInputClass} min-h-[90px]`}
                  placeholder="Recommendations given"
                  value={reportForm.recommendationsGiven}
                  onChange={(e) =>
                    setReportField("recommendationsGiven", e.target.value)
                  }
                />
              </div>
              <div>
                <FieldLabel>Actions agreed</FieldLabel>
                <textarea
                  className={`${baseInputClass} min-h-[90px]`}
                  placeholder="Actions agreed"
                  value={reportForm.actionsAgreed}
                  onChange={(e) =>
                    setReportField("actionsAgreed", e.target.value)
                  }
                />
              </div>
              <div>
                <FieldLabel>Learning materials</FieldLabel>
                <p className="mb-2 text-xs text-slate-500">
                  Upload the documents or links that back up your
                  recommendations — templates, guides, worked examples.
                </p>
                <MaterialsInput
                  materials={reportForm.materials}
                  onChange={(next) => setReportField("materials", next)}
                  onUploadingChange={setIsUploading}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-5">
              <button
                type="button"
                onClick={closeModal}
                disabled={isSaving}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || isUploading}
                className="rounded-xl bg-[#16a34a] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#15803d] disabled:opacity-60"
              >
                {isUploading
                  ? "Uploading materials..."
                  : isSaving
                    ? "Saving..."
                    : "Save report"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Decline a session the startup requested. */}
      {modalMode === "decline" && (
        <div className={modalOverlayClass}>
          <form onSubmit={onSubmitDecline} className={modalCardClass}>
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
              <div>
                <h3 className="text-2xl font-black text-slate-950">
                  Decline this request
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {startupName} will see your reason on the request, so they
                  know what to do next.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              <FieldLabel>Reason (optional)</FieldLabel>
              <textarea
                className={`${baseInputClass} min-h-[110px]`}
                placeholder="e.g. I am on leave this week — let us do it on the 14th instead."
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-5">
              <button
                type="button"
                onClick={closeModal}
                disabled={isSaving}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-xl bg-[#e11d48] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#be123c] disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Decline request"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Learning materials on an existing session. */}
      {modalMode === "materials" && (
        <div className={modalOverlayClass}>
          <form onSubmit={onSubmitMaterials} className={modalCardClass}>
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
              <div>
                <h3 className="text-2xl font-black text-slate-950">
                  Learning materials
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Share documents and links to support {startupName} on{" "}
                  {reportTarget?.title ||
                    reportTarget?.sessionType ||
                    "this session"}
                  {reportTarget?.sessionDate
                    ? ` · ${formatSessionDate(reportTarget.sessionDate)}`
                    : ""}
                  .
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              <MaterialsInput
                materials={materialsDraft}
                onChange={setMaterialsDraft}
                onUploadingChange={setIsUploading}
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-5">
              <button
                type="button"
                onClick={closeModal}
                disabled={isSaving}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || isUploading}
                className="rounded-xl bg-[#16a34a] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#15803d] disabled:opacity-60"
              >
                {isUploading
                  ? "Uploading..."
                  : isSaving
                    ? "Saving..."
                    : "Save materials"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default BdaCoachingSessionSetup;
