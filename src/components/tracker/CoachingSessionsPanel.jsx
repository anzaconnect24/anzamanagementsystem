import {
  CalendarDays,
  ClipboardCheck,
  Lightbulb,
  ListChecks,
  MessageSquare,
  Target,
  Users,
} from "lucide-react";

// Shared coaching-sessions view: header, summary tiles and the session history.
// Used by the startup's own page and by the BDA's per-startup setup page, so the
// two always present sessions identically.
//
// Props:
//   title, subtitle - header text
//   sessions        - array of coaching session records
//   actions         - node rendered at the top right (Export, Log a session, …)
//   emptyText       - shown when there are no sessions
export const formatSessionDate = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const getFlagLabel = (flag) => {
  if (flag === "green") return "On track";
  if (flag === "amber") return "At risk";
  if (flag === "red") return "Critical";
  return "N/A";
};

// Status pill colours follow the flag, so "at risk" and "critical" don't read as
// calmly as "on track".
const flagTone = (flag) => {
  if (flag === "amber")
    return { pill: "bg-amber-50 text-amber-700", dot: "bg-amber-500" };
  if (flag === "red")
    return { pill: "bg-rose-50 text-rose-700", dot: "bg-rose-500" };
  return { pill: "bg-[#0b2b5c]/5 text-[#0b2b5c]", dot: "bg-emerald-500" };
};

// Whole days from today until `value`; null when there is no usable date.
const daysUntil = (value) => {
  if (!value) return null;
  const target = new Date(value);
  if (Number.isNaN(target.getTime())) return null;
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((startOfDay(target) - startOfDay(new Date())) / 86400000);
};

const StatCard = ({ label, value, sub, icon }) => (
  <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/50">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-500">{label}</p>
        <p className="mt-2 truncate text-2xl font-black tracking-tight text-slate-950">
          {value}
        </p>
        {sub}
      </div>
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#0b2b5c]/5 text-[#0b2b5c]">
        {icon}
      </div>
    </div>
  </div>
);

const DetailRow = ({ icon, label, children }) => (
  <div className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:gap-4">
    <div className="flex shrink-0 items-center gap-3 sm:w-52">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#0b2b5c]/5 text-[#0b2b5c]">
        {icon}
      </div>
      <p className="text-sm font-bold text-slate-900">{label}</p>
    </div>
    <div className="hidden h-8 w-px shrink-0 bg-slate-200 sm:block" />
    <div className="min-w-0 flex-1 text-sm leading-6 text-slate-600">{children}</div>
  </div>
);

const CoachingSessionsPanel = ({
  title,
  subtitle,
  sessions = [],
  actions = null,
  emptyText = "No coaching sessions logged yet.",
}) => {
  // Newest first — the summary reads from the most recent session.
  const ordered = [...sessions].sort(
    (a, b) => new Date(b.sessionDate || 0) - new Date(a.sessionDate || 0),
  );
  const latest = ordered[0] || null;

  // Sessions are numbered in the order they actually happened, so "Session 1"
  // is always the first one held even though the list shows the newest first.
  const sessionNumber = new Map(
    [...ordered].reverse().map((s, i) => [s.uuid, i + 1]),
  );

  // The next session is the soonest date still ahead of us; fall back to the
  // latest session's stated next date so something sensible shows.
  const upcoming = ordered
    .map((s) => s.nextSessionDate)
    .filter(Boolean)
    .map((d) => ({ date: d, days: daysUntil(d) }))
    .filter((d) => d.days !== null && d.days >= 0)
    .sort((a, b) => a.days - b.days)[0];

  const next =
    upcoming ||
    (latest?.nextSessionDate
      ? { date: latest.nextSessionDate, days: daysUntil(latest.nextSessionDate) }
      : null);

  const status = latest ? getFlagLabel(latest.flag) : "N/A";
  const actionCount = ordered.filter((s) =>
    String(s.actionsAgreed || "").trim(),
  ).length;

  const nextLabel = next ? formatSessionDate(next.date) : "Not set";
  const nextSub =
    next?.days === 0
      ? "Today"
      : next?.days > 0
        ? `In ${next.days} day${next.days === 1 ? "" : "s"}`
        : "No date scheduled";

  return (
    <div className="space-y-6">
      {/* Header — omitted when the page supplies its own hero instead. */}
      {title && (
        <section className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white px-6 py-5 shadow-sm shadow-slate-200/50">
          <div className="flex items-start gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-slate-200/80 bg-[#0b2b5c]/5 text-[#0b2b5c]">
              <CalendarDays className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-[#0b2b5c] md:text-3xl">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</p>
              )}
            </div>
          </div>
          {actions}
        </section>
      )}

      {/* Summary */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Sessions"
          value={ordered.length}
          sub={<p className="mt-1 text-xs text-slate-400">All time</p>}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          label="Current Status"
          value={status}
          sub={
            ordered.length > 0 ? (
              <span
                className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${flagTone(latest?.flag).pill}`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${flagTone(latest?.flag).dot}`}
                />
                {status}
              </span>
            ) : null
          }
          icon={<Target className="h-5 w-5" />}
        />
        <StatCard
          label="Next Session"
          value={nextLabel}
          sub={<p className="mt-1 text-xs text-slate-400">{nextSub}</p>}
          icon={<CalendarDays className="h-5 w-5" />}
        />
        <StatCard
          label="Action Items"
          value={actionCount}
          sub={<p className="mt-1 text-xs text-slate-400">From sessions</p>}
          icon={<ListChecks className="h-5 w-5" />}
        />

      </section>

      {/* Sessions */}
      {ordered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
          {emptyText}
        </div>
      ) : (
        <div className="space-y-6">
          {ordered.map((item) => {
            const tone = flagTone(item.flag);
            return (
              <div key={item.uuid}>
                {/* Session heading sits above the card, not inside it. */}
                <div className="mb-3 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xl font-black tracking-tight text-slate-950">
                      Session {sessionNumber.get(item.uuid) ?? "—"}
                    </p>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {item.sessionType || "Coaching session"}
                    </p>
                  </div>

                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${tone.pill}`}
                  >
                    <span className={`h-2 w-2 rounded-full ${tone.dot}`} />
                    {getFlagLabel(item.flag)}
                  </span>
                </div>

                <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/50">
                  <DetailRow
                    icon={<MessageSquare className="h-5 w-5" />}
                    label="Issues discussed"
                  >
                    {item.issuesDiscussed || "N/A"}
                  </DetailRow>

                  <DetailRow
                    icon={<Lightbulb className="h-5 w-5" />}
                    label="Recommendations"
                  >
                    {item.recommendationsGiven || "N/A"}
                  </DetailRow>

                  <DetailRow
                    icon={<ClipboardCheck className="h-5 w-5" />}
                    label="Actions agreed"
                  >
                    {item.actionsAgreed || "N/A"}
                  </DetailRow>

                  <DetailRow
                    icon={<CalendarDays className="h-5 w-5" />}
                    label="Next session"
                  >
                    {item.nextSessionDate
                      ? formatSessionDate(item.nextSessionDate)
                      : "N/A"}
                  </DetailRow>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CoachingSessionsPanel;
