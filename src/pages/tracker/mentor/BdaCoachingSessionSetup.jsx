import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, Plus } from "lucide-react";
import Loader from "@/components/common/Loader";
import CoachingSessionsPanel from "@/components/tracker/CoachingSessionsPanel";

const HERO_IMAGE_URL = "/images/mentor_hero.svg";
import {
  createCoachingSession,
  getEntrepreneurCoachingSessions,
} from "@/controllers/coaching_session_controller";

const FLAG_OPTIONS = [
  { value: "green", label: "Green - on track" },
  { value: "amber", label: "Amber - at risk" },
  { value: "red", label: "Red - critical" },
];

const EMPTY_SESSION = {
  sessionDate: "",
  sessionType: "Weekly coaching",
  issuesDiscussed: "",
  recommendationsGiven: "",
  actionsAgreed: "",
  nextSessionDate: "",
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
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [sessionForm, setSessionForm] = useState(EMPTY_SESSION);

  const setField = (key, value) =>
    setSessionForm((prev) => ({ ...prev, [key]: value }));

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

  const onSubmitSession = async (e) => {
    e.preventDefault();
    if (!entUuid) return;

    setIsSaving(true);
    try {
      await createCoachingSession({
        ...sessionForm,
        entreprenuer_uuid: entUuid,
      });
      toast.success("Coaching session saved");
      setShowModal(false);
      setSessionForm(EMPTY_SESSION);
      loadSessions();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to save the coaching session",
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
                Set up and review coaching sessions for this startup.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/25"
            >
              <Plus className="h-4 w-4" />
              Log a session
            </button>
          </div>
        </section>

        <CoachingSessionsPanel
          sessions={sessions}
          emptyText={`No coaching sessions logged yet for ${startupName}. Use “Log a session” to record the first one.`}
        />
      </main>

      {showModal && (
        <div className={modalOverlayClass}>
          <form onSubmit={onSubmitSession} className={modalCardClass}>
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
              <div>
                <h3 className="text-2xl font-black text-slate-950">
                  Log a coaching session
                </h3>
                <p className="mt-1 text-sm text-slate-500">For {startupName}.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
              <div>
                <FieldLabel>Session date</FieldLabel>
                <input
                  className={baseInputClass}
                  type="date"
                  value={sessionForm.sessionDate}
                  onChange={(e) => setField("sessionDate", e.target.value)}
                  required
                />
              </div>
              <div>
                <FieldLabel>Session type</FieldLabel>
                <select
                  className={baseInputClass}
                  value={sessionForm.sessionType}
                  onChange={(e) => setField("sessionType", e.target.value)}
                >
                  <option value="Weekly coaching">Weekly coaching</option>
                  <option value="Financial advisory">Financial advisory</option>
                  <option value="Milestone review">Milestone review</option>
                </select>
              </div>
              <div>
                <FieldLabel>Session status</FieldLabel>
                <select
                  className={baseInputClass}
                  value={sessionForm.flag}
                  onChange={(e) => setField("flag", e.target.value)}
                >
                  {FLAG_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <FieldLabel>Issues discussed</FieldLabel>
                <textarea
                  className={`${baseInputClass} min-h-[90px]`}
                  placeholder="Issues discussed"
                  value={sessionForm.issuesDiscussed}
                  onChange={(e) => setField("issuesDiscussed", e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <FieldLabel>Recommendations given</FieldLabel>
                <textarea
                  className={`${baseInputClass} min-h-[90px]`}
                  placeholder="Recommendations given"
                  value={sessionForm.recommendationsGiven}
                  onChange={(e) =>
                    setField("recommendationsGiven", e.target.value)
                  }
                />
              </div>
              <div className="md:col-span-2">
                <FieldLabel>Actions agreed</FieldLabel>
                <textarea
                  className={`${baseInputClass} min-h-[90px]`}
                  placeholder="Actions agreed"
                  value={sessionForm.actionsAgreed}
                  onChange={(e) => setField("actionsAgreed", e.target.value)}
                />
              </div>
              <div>
                <FieldLabel>Next session date</FieldLabel>
                <input
                  className={baseInputClass}
                  type="date"
                  value={sessionForm.nextSessionDate}
                  onChange={(e) => setField("nextSessionDate", e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-5">
              <button
                type="button"
                onClick={() => setShowModal(false)}
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
                {isSaving ? "Saving..." : "Save coaching session"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default BdaCoachingSessionSetup;
