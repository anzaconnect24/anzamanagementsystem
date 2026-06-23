import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CalendarDays } from "lucide-react";
import Loader from "@/components/common/Loader";
import { getEntrepreneurTrackerDashboard } from "@/controllers/trackerController";

const HERO_IMAGE_URL = "/images/mentor_hero.svg";

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

const getFlagLabel = (flag) => {
  if (flag === "green") return "On track";
  if (flag === "amber") return "At risk";
  if (flag === "red") return "Critical";
  return "N/A";
};

const PortalCard = ({ icon, title, subtitle, children, className = "" }) => (
  <section className={`rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/70 ${className}`}>
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-6 py-5">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#082d77]/5 text-[#082d77]">
            {icon}
          </div>
        )}
        <div>
          <h2 className="text-lg font-black tracking-tight text-slate-950">{title}</h2>
          {subtitle && <p className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</p>}
        </div>
      </div>
    </div>
    <div className="p-6">{children}</div>
  </section>
);

const CoachingSessions = () => {
  const [loading, setLoading] = useState(true);
  const [enterprise, setEnterprise] = useState(null);
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getEntrepreneurTrackerDashboard({});
        setEnterprise(data?.enterprise || null);
        setSessions(Array.isArray(data?.sessions) ? data.sessions : []);
      } catch {
        // No tracking workspace yet — show the empty sessions state instead of an error.
        setEnterprise(null);
        setSessions([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

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
          <div className="relative z-10 min-h-[160px]">
            <div className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-sm font-bold text-white shadow-sm backdrop-blur">
              <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
              Coaching Sessions
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">
              {enterprise?.name || "Coaching Sessions"}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/85 md:text-base">
              Review your coaching sessions, the guidance shared, and the actions agreed with your advisor.
            </p>
          </div>
        </section>

        <PortalCard
          icon={<CalendarDays className="h-5 w-5" />}
          title="Coaching Sessions"
          subtitle="Your coaching sessions and engagement history."
        >
          <div className="space-y-4">
            {sessions.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                No coaching sessions logged yet.
              </div>
            )}

            {sessions.map((item) => (
              <div key={item.uuid} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-black text-slate-950">{formatDateDisplay(item.sessionDate)}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.sessionType || "Coaching session"}</p>
                  </div>
                  <span className="text-sm font-semibold text-slate-700">{getFlagLabel(item.flag)}</span>
                </div>

                <div className="mt-4 space-y-1 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                  <p><span className="font-bold text-slate-950">Facilitator:</span> {item.facilitator || "N/A"}</p>
                  <p><span className="font-bold text-slate-950">Issues discussed:</span> {item.issuesDiscussed || "N/A"}</p>
                  <p><span className="font-bold text-slate-950">Recommendations:</span> {item.recommendationsGiven || "N/A"}</p>
                  <p><span className="font-bold text-slate-950">Actions agreed:</span> {item.actionsAgreed || "N/A"}</p>
                  <p><span className="font-bold text-slate-950">Next session:</span> {item.nextSessionDate ? formatDateDisplay(item.nextSessionDate) : "N/A"}</p>
                </div>
              </div>
            ))}
          </div>
        </PortalCard>
      </main>
    </div>
  );
};

export default CoachingSessions;
