import { useSearchParams } from "react-router-dom";
import {
  CalendarDays,
  ChevronRight,
  ClipboardCheck,
  Clock,
  KeyRound,
  Lightbulb,
  Link2,
  ListChecks,
  MessageSquare,
  Paperclip,
  Target,
  Users,
  Video,
} from "lucide-react";
import { MaterialsList, parseMaterials } from "@/components/tracker/SessionMaterials";

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

// A session that has been set up but not yet reported on. Sessions created
// before the two-phase flow carry no status and are treated as completed.
export const isSessionScheduled = (session) =>
  String(session?.status || "").toLowerCase() === "scheduled";

// The startup asked for a session and the BDA has not answered yet.
export const isSessionRequested = (session) =>
  String(session?.status || "").toLowerCase() === "requested";

// The BDA turned a request down — the reason lives on `declineReason`.
export const isSessionDeclined = (session) =>
  String(session?.status || "").toLowerCase() === "declined";

// True once a post-session report has been filed (any of the report fields is
// filled). Used to decide whether the "Add report" action still applies — this
// works even if the backend never stored the `status` flag.
export const hasSessionReport = (session) =>
  Boolean(
    String(session?.issuesDiscussed || "").trim() ||
      String(session?.recommendationsGiven || "").trim() ||
      String(session?.actionsAgreed || "").trim(),
  );

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

// Value first and large, label beneath, and a small tinted icon top-right.
const StatCard = ({ label, value, sub, icon, tone = "text-[#0b2b5c]" }) => (
  <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50">
    <div className="flex items-start justify-between gap-3">
      <p className="min-w-0 truncate text-xl font-black tracking-tight text-slate-950">
        {value}
      </p>
      <span className={`shrink-0 ${tone}`}>{icon}</span>
    </div>

    <p className="mt-3 text-sm font-medium text-slate-500">{label}</p>
    {sub}
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
  // When provided (BDA view), a scheduled session offers a "Report on session"
  // action that calls this with the session record.
  onReport = null,
  // When provided (BDA view), the open session offers an action to upload or
  // remove the learning materials shared with the startup.
  onManageMaterials = null,
  // BDA view: answer a session the startup asked for — schedule it, or turn it
  // down with a reason.
  onSchedule = null,
  onDecline = null,
  // Optional node rendered on the right of the "Session History" title row
  // (e.g. the "Set up new session" action on the BDA page).
  belowCards = null,
}) => {
  // Newest first — the summary reads from the most recent session.
  const ordered = [...sessions].sort(
    (a, b) => new Date(b.sessionDate || 0) - new Date(a.sessionDate || 0),
  );
  const latest = ordered[0] || null;

  // Sessions are numbered in the order they actually happened, so "Session 1"
  // is always the first one held.
  const sessionNumber = new Map(
    [...ordered].reverse().map((s, i) => [s.uuid, i + 1]),
  );

  // The history list reads oldest-first — Session 1 on top, then the next — even
  // though the summary above keys off the most recent session.
  const chronological = [...ordered].reverse();

  // The open session lives in the URL so it is its own view and the browser's
  // back button returns to the list.
  const [searchParams, setSearchParams] = useSearchParams();
  const openSession = searchParams.get("session") || "";
  const activeSession = ordered.find((s) => s.uuid === openSession) || null;
  const setOpenSession = (uuid) => {
    const next = new URLSearchParams(searchParams);
    if (uuid) next.set("session", uuid);
    else next.delete("session");
    setSearchParams(next);
  };

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

  const status = latest
    ? isSessionRequested(latest)
      ? "Requested"
      : isSessionDeclined(latest)
        ? "Declined"
        : isSessionScheduled(latest)
          ? "Scheduled"
          : getFlagLabel(latest.flag)
    : "N/A";
  const actionCount = ordered.filter((s) =>
    String(s.actionsAgreed || "").trim(),
  ).length;
  const openRequests = ordered.filter(isSessionRequested).length;

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
          value={
            ordered.filter(
              (s) => !isSessionRequested(s) && !isSessionDeclined(s),
            ).length
          }
          sub={
            openRequests > 0 ? (
              <p className="mt-1 text-xs font-semibold text-indigo-600">
                {openRequests} request{openRequests === 1 ? "" : "s"} awaiting a
                date
              </p>
            ) : null
          }
          icon={<Users className="h-6 w-6" />}
          tone="text-[#0b2b5c]"
        />
        <StatCard
          label="Current Status"
          value={status}
          icon={<Target className="h-6 w-6" />}
          tone={
            latest?.flag === "red"
              ? "text-rose-500"
              : latest?.flag === "amber"
                ? "text-amber-500"
                : "text-emerald-500"
          }
        />
        <StatCard
          label="Next Session"
          value={nextLabel}
          sub={<p className="mt-1 text-xs text-slate-400">{nextSub}</p>}
          icon={<CalendarDays className="h-6 w-6" />}
          tone="text-amber-500"
        />
        <StatCard
          label="Action Items"
          value={actionCount}
          icon={<ListChecks className="h-6 w-6" />}
          tone="text-[#0b2b5c]"
        />

      </section>

      {/* Sessions — the heading names the list, and is dropped once a single
          session is open since that view carries its own title. */}
      {!openSession && (
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-950">
              Session History
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Select a session to see what was discussed and agreed.
            </p>
          </div>
          {belowCards}
        </div>
      )}

      {ordered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
          {emptyText}
        </div>
      ) : !openSession ? (
        /* Sessions list — "Session 1 - Milestone review", oldest first. Opening
           one shows its information. */
        <div className="space-y-3">
          {chronological.map((item) => {
            const tone = flagTone(item.flag);
            const scheduled = isSessionScheduled(item);
            const requested = isSessionRequested(item);
            const declined = isSessionDeclined(item);
            // BDA view: offer to add a report on sessions not yet reported on, or
            // to edit the report on ones that already have one.
            const reported = hasSessionReport(item);
            const materials = parseMaterials(item.materials);
            return (
              <div
                key={item.uuid}
                className="flex w-full items-center gap-4 rounded-2xl border border-slate-200/80 bg-white px-6 py-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
              >
                <button
                  type="button"
                  onClick={() => setOpenSession(item.uuid)}
                  className="flex min-w-0 flex-1 items-center gap-4 text-left"
                >
                  <CalendarDays className="h-6 w-6 shrink-0 text-[#0b2b5c]" />

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-base font-bold text-slate-950">
                      Session {sessionNumber.get(item.uuid) ?? "—"}
                      {item.title || item.sessionType
                        ? ` - ${item.title || item.sessionType}`
                        : ""}
                    </span>
                    {requested ? (
                      <span className="mt-0.5 inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                        Requested by the startup
                        {item.sessionDate
                          ? ` for ${formatSessionDate(item.sessionDate)}`
                          : ""}
                        {onSchedule ? " — needs your answer" : ""}
                      </span>
                    ) : declined ? (
                      <span className="mt-0.5 inline-flex items-center gap-1.5 text-sm font-semibold text-rose-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                        Request declined
                      </span>
                    ) : scheduled ? (
                      <span className="mt-0.5 inline-flex items-center gap-1.5 text-sm font-semibold text-amber-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        Scheduled
                        {item.sessionDate
                          ? ` for ${formatSessionDate(item.sessionDate)}`
                          : ""}
                        {onReport ? " — awaiting report" : ""}
                      </span>
                    ) : (
                      <span
                        className={`mt-0.5 inline-flex items-center gap-1.5 text-sm font-semibold ${
                          item.flag === "red"
                            ? "text-rose-600"
                            : item.flag === "amber"
                              ? "text-amber-600"
                              : "text-emerald-600"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${tone.dot}`}
                        />
                        {getFlagLabel(item.flag)}
                      </span>
                    )}
                  </span>
                </button>

                {materials.length > 0 && (
                  <span className="hidden shrink-0 items-center gap-1.5 rounded-full bg-[#0b2b5c]/5 px-3 py-1.5 text-xs font-bold text-[#0b2b5c] sm:inline-flex">
                    <Paperclip className="h-3.5 w-3.5" />
                    {materials.length} material
                    {materials.length === 1 ? "" : "s"}
                  </span>
                )}

                {requested && onSchedule && (
                  <button
                    type="button"
                    onClick={() => onSchedule(item)}
                    className="shrink-0 rounded-xl bg-[#082d77] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#061f54]"
                  >
                    Schedule
                  </button>
                )}

                {onReport &&
                  !requested &&
                  !declined &&
                  (reported ? (
                    <button
                      type="button"
                      onClick={() => onReport(item)}
                      className="shrink-0 rounded-xl bg-[#F59E0B] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#d97706]"
                    >
                      Edit report
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onReport(item)}
                      className="shrink-0 rounded-xl bg-[#16a34a] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#15803d]"
                    >
                      Add report
                    </button>
                  ))}

                <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-6">
          {[activeSession].filter(Boolean).map((item) => {
            const tone = flagTone(item.flag);
            const scheduled = isSessionScheduled(item);
            const requested = isSessionRequested(item);
            const declined = isSessionDeclined(item);
            // Anything that has not been reported on yet shows the session plan
            // rather than the (still empty) report fields.
            const pending = scheduled || requested || declined;
            const materials = parseMaterials(item.materials);
            return (
              <div key={item.uuid}>
                {/* Session heading sits above the card, not inside it. */}
                <div className="mb-3 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xl font-black tracking-tight text-slate-950">
                      Session {sessionNumber.get(item.uuid) ?? "—"}
                      {item.title || item.sessionType
                        ? ` - ${item.title || item.sessionType}`
                        : ""}
                    </p>
                    <button
                      type="button"
                      onClick={() => setOpenSession("")}
                      className="mt-1 text-sm font-semibold text-[#0b2b5c]"
                    >
                      All sessions
                    </button>
                  </div>

                  {requested ? (
                    <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-700">
                      <span className="h-2 w-2 rounded-full bg-indigo-500" />
                      Requested
                    </span>
                  ) : declined ? (
                    <span className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-4 py-2 text-sm font-bold text-rose-700">
                      <span className="h-2 w-2 rounded-full bg-rose-500" />
                      Declined
                    </span>
                  ) : scheduled ? (
                    <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-sm font-bold text-amber-700">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      Scheduled
                    </span>
                  ) : (
                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${tone.pill}`}
                    >
                      <span className={`h-2 w-2 rounded-full ${tone.dot}`} />
                      {getFlagLabel(item.flag)}
                    </span>
                  )}
                </div>

                {pending ? (
                  /* Requested, or set up and awaiting its report — show the
                     session plan and whatever action applies next. */
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50">
                    <div className="divide-y divide-slate-100">
                      {item.purpose && (
                        <DetailRow
                          icon={<Target className="h-5 w-5" />}
                          label={requested ? "What they need help with" : "Purpose"}
                        >
                          {item.purpose}
                        </DetailRow>
                      )}
                      <DetailRow
                        icon={<CalendarDays className="h-5 w-5" />}
                        label={requested ? "Preferred date" : "Date"}
                      >
                        {item.sessionDate
                          ? formatSessionDate(item.sessionDate)
                          : "N/A"}
                        {item.sessionTime ? ` · ${item.sessionTime}` : ""}
                      </DetailRow>
                      {item.duration && (
                        <DetailRow
                          icon={<Clock className="h-5 w-5" />}
                          label="Duration"
                        >
                          {item.duration}
                        </DetailRow>
                      )}
                      {item.meetingPlatform && (
                        <DetailRow
                          icon={<Video className="h-5 w-5" />}
                          label="Meeting platform"
                        >
                          {item.meetingPlatform}
                        </DetailRow>
                      )}
                      {item.meetingLink && (
                        <DetailRow
                          icon={<Link2 className="h-5 w-5" />}
                          label="Meeting link"
                        >
                          <a
                            href={item.meetingLink}
                            target="_blank"
                            rel="noreferrer"
                            className="font-semibold text-[#0b2b5c] underline break-all"
                          >
                            {item.meetingLink}
                          </a>
                        </DetailRow>
                      )}
                      {item.meetingAccess && (
                        <DetailRow
                          icon={<KeyRound className="h-5 w-5" />}
                          label="Meeting ID & passcode"
                        >
                          {item.meetingAccess}
                        </DetailRow>
                      )}
                      {item.preparationRequired && (
                        <DetailRow
                          icon={<ClipboardCheck className="h-5 w-5" />}
                          label="Preparation required"
                        >
                          {item.preparationRequired}
                        </DetailRow>
                      )}
                      {!requested && !declined && (
                        <DetailRow
                          icon={<CalendarDays className="h-5 w-5" />}
                          label="Next session"
                        >
                          {item.nextSessionDate
                            ? formatSessionDate(item.nextSessionDate)
                            : "N/A"}
                        </DetailRow>
                      )}
                    </div>

                    {/* What happens next depends on who is looking and where the
                        session stands. */}
                    {requested ? (
                      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-indigo-50/70 px-4 py-4">
                        <p className="text-sm font-semibold leading-6 text-indigo-900">
                          {onSchedule
                            ? "This startup asked for a coaching session. Schedule it with the meeting details, or let them know why it cannot go ahead."
                            : "Your request is with your advisor. You will see the date and joining details here once they schedule it."}
                        </p>
                        {onSchedule && (
                          <div className="flex shrink-0 flex-wrap gap-2">
                            {onDecline && (
                              <button
                                type="button"
                                onClick={() => onDecline(item)}
                                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                              >
                                Decline
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onSchedule(item)}
                              className="rounded-xl bg-[#082d77] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#061f54]"
                            >
                              Schedule session
                            </button>
                          </div>
                        )}
                      </div>
                    ) : declined ? (
                      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-rose-50/70 px-4 py-4">
                        <p className="text-sm font-semibold leading-6 text-rose-800">
                          {item.declineReason
                            ? `This request was declined: ${item.declineReason}`
                            : onSchedule
                              ? "You declined this request. You can still schedule it if things change."
                              : "Your advisor could not take this request. Request another session when you are ready."}
                        </p>
                        {onSchedule && (
                          <button
                            type="button"
                            onClick={() => onSchedule(item)}
                            className="shrink-0 rounded-xl bg-[#082d77] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#061f54]"
                          >
                            Schedule anyway
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-amber-50/60 px-4 py-4">
                        <p className="text-sm font-semibold leading-6 text-amber-800">
                          {onReport
                            ? "This session is set up but not yet reported on. Once it has taken place, file the report of what was discussed and agreed."
                            : "This session is scheduled. The details are above — your advisor will add the session report here after it takes place."}
                        </p>
                        {onReport && (
                          <button
                            type="button"
                            onClick={() => onReport(item)}
                            className="shrink-0 rounded-xl bg-[#16a34a] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#15803d]"
                          >
                            Add report
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <>
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

                    {onReport && (
                      <div className="mt-4 flex justify-end">
                        <button
                          type="button"
                          onClick={() => onReport(item)}
                          className="rounded-xl bg-[#F59E0B] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#d97706]"
                        >
                          Edit report
                        </button>
                      </div>
                    )}
                  </>
                )}

                {/* Learning materials the mentor shared to support the startup —
                    visible to both sides; only the BDA can change them. */}
                <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50">
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#0b2b5c]/5 text-[#0b2b5c]">
                        <Paperclip className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-base font-black tracking-tight text-slate-950">
                          Learning materials
                        </p>
                        <p className="mt-0.5 text-sm text-slate-500">
                          {onManageMaterials
                            ? "Documents and links you share to support this startup."
                            : "Documents and links your advisor shared for this session."}
                        </p>
                      </div>
                    </div>

                    {onManageMaterials && (
                      <button
                        type="button"
                        onClick={() => onManageMaterials(item)}
                        className="shrink-0 rounded-xl bg-[#082d77] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#061f54]"
                      >
                        {materials.length ? "Manage materials" : "Upload materials"}
                      </button>
                    )}
                  </div>

                  <MaterialsList
                    materials={materials}
                    emptyText={
                      onManageMaterials
                        ? "No materials shared yet. Upload documents or add links to support this startup."
                        : "No learning materials shared for this session yet."
                    }
                  />
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
