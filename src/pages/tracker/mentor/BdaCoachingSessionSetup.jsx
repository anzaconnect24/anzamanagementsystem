import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, Plus } from "lucide-react";
import Loader from "@/components/common/Loader";
import CoachingSessionsPanel, {
  formatSessionDate,
} from "@/components/tracker/CoachingSessionsPanel";

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

  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // The modal runs in one of two modes: "setup" (schedule a new session) or
  // "report" (file the post-session report against a scheduled one).
  const [modalMode, setModalMode] = useState(null);
  const [reportTarget, setReportTarget] = useState(null);
  const [setupForm, setSetupForm] = useState(EMPTY_SETUP);
  const [reportForm, setReportForm] = useState(EMPTY_REPORT);

  const setSetupField = (key, value) =>
    setSetupForm((prev) => ({ ...prev, [key]: value }));
  const setReportField = (key, value) =>
    setReportForm((prev) => ({ ...prev, [key]: value }));

  const openSetup = () => {
    setSetupForm(EMPTY_SETUP);
    setModalMode("setup");
  };

  const openReport = (session) => {
    setReportTarget(session);
    setReportForm({
      issuesDiscussed: session?.issuesDiscussed || "",
      recommendationsGiven: session?.recommendationsGiven || "",
      actionsAgreed: session?.actionsAgreed || "",
      flag: session?.flag || "green",
    });
    setModalMode("report");
  };

  const closeModal = () => {
    setModalMode(null);
    setReportTarget(null);
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

  // Part 1 — create the session in a "scheduled" state (no report yet).
  const onSubmitSetup = async (e) => {
    e.preventDefault();
    if (!entUuid) return;

    setIsSaving(true);
    try {
      await createCoachingSession({
        ...setupForm,
        status: "scheduled",
        flag: "",
        entreprenuer_uuid: entUuid,
      });
      toast.success("Session scheduled");
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

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-[#f3f6fb] px-4 py-6 text-slate-950 md:px-8 xl:px-12">
      <main className="mx-auto max-w-[1480px] space-y-6">
        <button
          type="button"
          onClick={() => navigate("/dashboard/bdaCoachingSessions")}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#082d77]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to startups
        </button>

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
                Set up coaching sessions for this startup, then report on each one
                after it has taken place.
              </p>
            </div>
          </div>
        </section>

        <CoachingSessionsPanel
          sessions={sessions}
          onReport={openReport}
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
                  Set up a session
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Schedule a coaching session for {startupName}. You will report
                  on it after it has taken place.
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
                className="rounded-xl bg-[#082d77] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#061f54] disabled:opacity-60"
              >
                {isSaving ? "Scheduling..." : "Schedule session"}
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
                className="rounded-xl bg-[#082d77] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#061f54] disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Save report"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default BdaCoachingSessionSetup;
