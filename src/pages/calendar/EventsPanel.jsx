"use client";

import { FaCheck, FaLock, FaMapMarkerAlt, FaQuestion, FaTimes } from "react-icons/fa";
import CalendarPanel, { dayLabel } from "@/components/calendar/CalendarPanel";
import { colourOf } from "@/utils/calendar_colours";

// The four questions a person actually asks their calendar. Each is a filter
// over the same list, so nothing has to be fetched again to switch between
// them, and the counts are always of what the tab would really show.
export const TABS = [
  { key: "upcoming", label: "Upcoming" },
  { key: "invites", label: "Invites" },
  { key: "past", label: "Past" },
  { key: "yours", label: "Yours" },
];

const timeLabel = (event) => {
  if (!event.startTime) return "All day";
  return event.endTime ? `${event.startTime} – ${event.endTime}` : event.startTime;
};

// What an invitation is waiting on, said in the words the person would use.
const ANSWERS = [
  { key: "accepted", label: "Going", icon: <FaCheck />, tone: "bg-[#0b8043] hover:bg-[#0a6f39] text-white" },
  { key: "tentative", label: "Maybe", icon: <FaQuestion />, tone: "bg-white hover:bg-slate-50 text-slate-700 border border-slate-300" },
  { key: "declined", label: "Can't go", icon: <FaTimes />, tone: "bg-white hover:bg-rose-50 text-rose-600 border border-rose-200" },
];

const EventRow = ({ event, onOpen, onRespond, answering }) => (
  <div className="flex gap-3 border-b border-slate-100 px-5 py-4 last:border-b-0">
    <span
      className={`mt-1 h-full w-1 shrink-0 rounded-full ${colourOf(event.colour).chip}`}
      aria-hidden="true"
    />

    <div className="min-w-0 flex-1">
      <button
        type="button"
        onClick={() => onOpen(event)}
        className="block w-full text-left"
      >
        <span className="flex flex-wrap items-center gap-2">
          {event.personal ? (
            <FaLock className="shrink-0 text-[10px] text-slate-400" />
          ) : null}

          <span className="font-semibold text-slate-900">{event.title}</span>

          {event.invited && event.myResponse === "accepted" ? (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
              Going
            </span>
          ) : null}

          {event.invited && event.myResponse === "declined" ? (
            <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-600">
              Not going
            </span>
          ) : null}

          {event.invited && event.myResponse === "tentative" ? (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
              Maybe
            </span>
          ) : null}
        </span>

        <span className="mt-1 block text-sm text-slate-500">
          {dayLabel(String(event.startDate).slice(0, 10))} · {timeLabel(event)}
        </span>

        {event.location ? (
          <span className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
            <FaMapMarkerAlt className="shrink-0 text-xs text-slate-400" />
            {event.location}
          </span>
        ) : null}

        <span className="mt-1 block text-xs text-slate-400">
          {event.personal
            ? "Your reminder"
            : `From ${event.createdBy?.name || "the program team"}`}
        </span>
      </button>

      {/* Answering happens in the list. Making somebody open an event to say
          they are coming is the reason invitations sit unanswered. */}
      {event.invited && event.myResponse === "pending" ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {ANSWERS.map((answer) => (
            <button
              key={answer.key}
              type="button"
              disabled={answering}
              onClick={() => onRespond(event, answer.key)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-60 ${answer.tone}`}
            >
              {answer.icon}
              {answer.label}
            </button>
          ))}
        </div>
      ) : null}

      {/* Once answered, changing your mind is one press rather than a hunt. */}
      {event.invited && event.myResponse && event.myResponse !== "pending" ? (
        <button
          type="button"
          disabled={answering}
          onClick={() =>
            onRespond(
              event,
              event.myResponse === "accepted" ? "declined" : "accepted",
            )
          }
          className="mt-2 text-xs font-semibold text-[#082d77] underline-offset-2 hover:underline disabled:opacity-60"
        >
          {event.myResponse === "accepted" ? "Can't go after all" : "Actually, I'm going"}
        </button>
      ) : null}
    </div>
  </div>
);

// The right-hand half of the platform calendar: the shared panel, filled with
// events.
const EventsPanel = ({
  tab,
  onTab,
  counts,
  events,
  selected,
  onClearDay,
  onBack,
  onCreate,
  onOpen,
  onRespond,
  answering,
}) => (
  <CalendarPanel
    title="Events"
    // Only Invites carries a count: it is the only tab that is a queue.
    tabs={TABS.map((item) =>
      item.key === "invites" ? { ...item, badge: counts.invites } : item,
    )}
    tab={tab}
    onTab={onTab}
    onBack={onBack}
    onCreate={onCreate}
    createLabel="Add an event"
    selected={selected}
    onClearDay={onClearDay}
    isEmpty={events.length === 0}
    emptyText="No events found."
  >
    {events.map((event) => (
      <EventRow
        key={event.uuid}
        event={event}
        onOpen={onOpen}
        onRespond={onRespond}
        answering={answering}
      />
    ))}
  </CalendarPanel>
);

export default EventsPanel;
