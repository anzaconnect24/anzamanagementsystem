import { useContext, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { CalendarPlus, Upload } from "lucide-react";
import Loader from "@/components/common/Loader";
import { UserContext } from "@/layouts/DashboardLayout";
import {
  createCoachingSession,
  getEntrepreneurCoachingSessions,
} from "@/controllers/coaching_session_controller";
import { getEntrepreneurTrackerDashboard } from "@/controllers/trackerController";
import CoachingSessionsPanel, {
  formatSessionDate,
  getFlagLabel,
} from "@/components/tracker/CoachingSessionsPanel";
import { parseMaterials } from "@/components/tracker/SessionMaterials";

const HERO_IMAGE_URL = "/images/mentor_hero.svg";

const baseInputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#082d77] focus:ring-4 focus:ring-[#082d77]/20";

const FieldLabel = ({ children }) => (
  <label className="mb-1.5 block text-xs font-bold tracking-wide text-slate-500">
    {children}
  </label>
);

const SESSION_TYPES = [
  "Weekly coaching",
  "Financial advisory",
  "Milestone review",
  "Other",
];

const EMPTY_REQUEST = {
  title: "",
  purpose: "",
  sessionType: "Weekly coaching",
  sessionDate: "",
  sessionTime: "",
};

const CoachingSessions = () => {
  const { userDetails } = useContext(UserContext);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  // Who the request goes to — best effort, so the page still works when the
  // tracker workspace has not been set up yet.
  const [advisor, setAdvisor] = useState("");
  const [showRequest, setShowRequest] = useState(false);
  const [requestForm, setRequestForm] = useState(EMPTY_REQUEST);
  const [isRequesting, setIsRequesting] = useState(false);

  const setRequestField = (key, value) =>
    setRequestForm((prev) => ({ ...prev, [key]: value }));

  const loadSessions = async () => {
    const data = await getEntrepreneurCoachingSessions(userDetails.uuid);
    setSessions(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    if (!userDetails?.uuid) {
      setLoading(false);
      return;
    }
    const load = async () => {
      setLoading(true);
      try {
        await loadSessions();
      } catch {
        setSessions([]);
      } finally {
        setLoading(false);
      }
    };
    load();

    getEntrepreneurTrackerDashboard()
      .then((data) => setAdvisor(data?.enterprise?.assignedBda || ""))
      .catch(() => setAdvisor(""));
  }, [userDetails?.uuid]);

  // Ask the assigned BDA for a session. It is stored as a coaching session in
  // the "requested" state, so it lands in the advisor's list for this startup
  // and becomes the scheduled session once they answer.
  const onSubmitRequest = async (e) => {
    e.preventDefault();
    if (!userDetails?.uuid) return;

    setIsRequesting(true);
    try {
      await createCoachingSession({
        ...requestForm,
        sessionDate: requestForm.sessionDate || null,
        status: "requested",
        flag: "",
        facilitator: advisor || "",
        requestedBy: userDetails.uuid,
        requestedAt: new Date().toISOString(),
        entreprenuer_uuid: userDetails.uuid,
      });
      toast.success("Session request sent to your advisor");
      setRequestForm(EMPTY_REQUEST);
      setShowRequest(false);
      await loadSessions();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to send the session request",
      );
    } finally {
      setIsRequesting(false);
    }
  };

  const ordered = useMemo(
    () =>
      [...sessions].sort(
        (a, b) => new Date(b.sessionDate || 0) - new Date(a.sessionDate || 0),
      ),
    [sessions],
  );

  const onExport = () => {
    const rows = [
      [
        "Date",
        "Type",
        "Status",
        "Issues discussed",
        "Recommendations",
        "Actions agreed",
        "Next session",
        "Learning materials",
      ],
      ...ordered.map((s) => [
        formatSessionDate(s.sessionDate),
        s.sessionType || "Coaching session",
        getFlagLabel(s.flag),
        s.issuesDiscussed || "",
        s.recommendationsGiven || "",
        s.actionsAgreed || "",
        s.nextSessionDate ? formatSessionDate(s.nextSessionDate) : "",
        parseMaterials(s.materials)
          .map((m) => `${m?.name || "Material"}: ${m?.url || ""}`)
          .join(" | "),
      ]),
    ];

    const csv = rows
      .map((row) =>
        row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","),
      )
      .join("\n");

    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "coaching-sessions.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

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
                {userDetails?.Business?.name || "Coaching Sessions"}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/85 md:text-base">
                Your coaching sessions and engagement history — the guidance
                shared and the actions agreed with your advisor.
              </p>
            </div>

            <button
              type="button"
              onClick={onExport}
              disabled={ordered.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Upload className="h-4 w-4" />
              Export
            </button>
          </div>
        </section>

        <CoachingSessionsPanel
          sessions={sessions}
          // Sits on the "Session History" row, opposite the heading — the same
          // place the BDA's "Set up new session" action lives.
          belowCards={
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowRequest(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-[#F59E0B] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#d97706]"
              >
                <CalendarPlus className="h-4 w-4" />
                Request a session
              </button>
            </div>
          }
          emptyText="No coaching sessions yet. Use “Request a session” to ask your advisor for one."
        />
      </main>

      {/* Ask the advisor for a session. */}
      {showRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <form
            onSubmit={onSubmitRequest}
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl shadow-slate-950/20"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
              <div>
                <h3 className="text-2xl font-black text-slate-950">
                  Request a coaching session
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {advisor
                    ? `${advisor} will see this request and come back with a date and joining details.`
                    : "Your advisor will see this request and come back with a date and joining details."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowRequest(false)}
                className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <FieldLabel>What do you need help with?</FieldLabel>
                <input
                  className={baseInputClass}
                  placeholder="e.g. Pricing our new product line"
                  value={requestForm.title}
                  onChange={(e) => setRequestField("title", e.target.value)}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <FieldLabel>Tell your advisor a bit more</FieldLabel>
                <textarea
                  className={`${baseInputClass} min-h-[110px]`}
                  placeholder="The problem you are facing, what you have tried and what you would like out of the session."
                  value={requestForm.purpose}
                  onChange={(e) => setRequestField("purpose", e.target.value)}
                  required
                />
              </div>
              <div>
                <FieldLabel>Type of support</FieldLabel>
                <select
                  className={baseInputClass}
                  value={requestForm.sessionType}
                  onChange={(e) => setRequestField("sessionType", e.target.value)}
                >
                  {SESSION_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel>Preferred date (optional)</FieldLabel>
                <input
                  className={baseInputClass}
                  type="date"
                  value={requestForm.sessionDate}
                  onChange={(e) => setRequestField("sessionDate", e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <FieldLabel>Preferred time (optional)</FieldLabel>
                <input
                  className={baseInputClass}
                  type="time"
                  value={requestForm.sessionTime}
                  onChange={(e) => setRequestField("sessionTime", e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-5">
              <button
                type="button"
                onClick={() => setShowRequest(false)}
                disabled={isRequesting}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isRequesting}
                className="rounded-xl bg-[#16a34a] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#15803d] disabled:opacity-60"
              >
                {isRequesting ? "Sending..." : "Send request"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default CoachingSessions;
