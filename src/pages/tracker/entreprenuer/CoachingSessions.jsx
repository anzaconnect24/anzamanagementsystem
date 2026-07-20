import { useContext, useEffect, useMemo, useState } from "react";
import { Upload } from "lucide-react";
import Loader from "@/components/common/Loader";
import { UserContext } from "@/layouts/DashboardLayout";
import { getEntrepreneurCoachingSessions } from "@/controllers/coaching_session_controller";
import CoachingSessionsPanel, {
  formatSessionDate,
  getFlagLabel,
} from "@/components/tracker/CoachingSessionsPanel";

const HERO_IMAGE_URL = "/images/mentor_hero.svg";

const CoachingSessions = () => {
  const { userDetails } = useContext(UserContext);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    if (!userDetails?.uuid) {
      setLoading(false);
      return;
    }
    const load = async () => {
      setLoading(true);
      try {
        const data = await getEntrepreneurCoachingSessions(userDetails.uuid);
        setSessions(Array.isArray(data) ? data : []);
      } catch {
        setSessions([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userDetails?.uuid]);

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
      ],
      ...ordered.map((s) => [
        formatSessionDate(s.sessionDate),
        s.sessionType || "Coaching session",
        getFlagLabel(s.flag),
        s.issuesDiscussed || "",
        s.recommendationsGiven || "",
        s.actionsAgreed || "",
        s.nextSessionDate ? formatSessionDate(s.nextSessionDate) : "",
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
          emptyText="No coaching sessions logged yet."
        />
      </main>
    </div>
  );
};

export default CoachingSessions;
