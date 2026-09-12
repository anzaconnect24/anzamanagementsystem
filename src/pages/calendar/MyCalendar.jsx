"use client";

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FaChevronLeft,
  FaChevronRight,
  FaCompressAlt,
  FaExpandAlt,
  FaGlobeAfrica,
  FaLayerGroup,
  FaLock,
  FaMapMarkerAlt,
  FaPlus,
  FaRegCalendarCheck,
  FaTimes,
  FaTrash,
  FaUserFriends,
} from "react-icons/fa";
import Loader from "@/components/common/Loader";
import {
  deleteCalendarEvent,
  getCalendarAudiences,
  getCalendarEvents,
  respondToCalendarEvent,
  saveCalendarEvent,
} from "@/controllers/calendar_controller";
import { EVENT_COLOURS, colourOf, dayKey, spanOf } from "@/utils/calendar_colours";
import EventsPanel from "./EventsPanel";
import ExternalCalendarMenu from "./ExternalCalendarMenu";
import MiniMonth, { monthCells } from "@/components/calendar/MiniMonth";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-[#111a2e] outline-none focus:border-[#082d77] focus:ring-2 focus:ring-[#082d77]/20";

const labelClass = "mb-1.5 block text-sm font-semibold text-[#344054]";

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

// What each audience means, in the words a person would use.
const AUDIENCE = {
  private: {
    label: "Only me",
    note: "A reminder on your own calendar. Nobody else can see it — not even an administrator.",
    icon: <FaLock />,
  },
  programs: {
    label: "Chosen programs",
    note: "Everyone on the programs you pick: the startups on them and the advisors leading them.",
    icon: <FaLayerGroup />,
  },
  users: {
    label: "Chosen people",
    note: "Only the people you name.",
    icon: <FaUserFriends />,
  },
  everyone: {
    label: "Everyone",
    note: "Every signed-in account on the platform.",
    icon: <FaGlobeAfrica />,
  },
};

const emptyEvent = {
  title: "",
  description: "",
  location: "",
  startDate: "",
  endDate: "",
  startTime: "",
  endTime: "",
  colour: "blue",
  visibility: "private",
  programUuids: [],
  userUuids: [],
};

// Sortable to the minute. An all-day entry sorts to the top of its day, which
// is where a person looking at the day expects to find it.
const startsAt = (event) =>
  `${String(event.startDate || "").slice(0, 10)}T${event.startTime || "00:00"}`;

// The last day an event covers. A workshop that began on Monday and runs to
// Friday is still upcoming on Wednesday, and filing it under Past on the
// Tuesday would be wrong in the way people notice.
const endsOn = (event) =>
  String(event.endDate || "").slice(0, 10) ||
  String(event.startDate || "").slice(0, 10);

// An invitation still waiting on this person. Your own event is never one,
// even if you put yourself on the guest list — the same rule the header's dot
// counts by, so the two can never disagree about whether anything is waiting.
const isWaiting = (event) =>
  event.invited && event.myResponse === "pending" && !event.mine;

const timeLabel = (event) => {
  if (!event.startTime) return "";
  return event.endTime ? `${event.startTime}–${event.endTime}` : event.startTime;
};

// Everyone's calendar. What is on it is the union of two things: the events
// published to this person, and the reminders they keep for themselves.
const MyCalendar = () => {
  const navigate = useNavigate();

  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [audiences, setAudiences] = useState({ programs: [], users: [] });

  // The month picker beside a list is the everyday shape of this screen. The
  // whole-month grid is still here, one press away, for the weeks when the
  // question is "how busy is the 20th" rather than "what is next".
  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState("upcoming");
  const [selected, setSelected] = useState("");
  const [answering, setAnswering] = useState(false);

  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [editing, setEditing] = useState(null); // "new", or an event
  const [form, setForm] = useState(emptyEvent);
  const [saving, setSaving] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [confirming, setConfirming] = useState(null);
  const [show, setShow] = useState("all"); // all | mine | published

  const load = () =>
    getCalendarEvents()
      .then(setPayload)
      .catch(() => {
        toast.error("Failed to load the calendar");
        setPayload(null);
      })
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  // The audience lists are only fetched for the people who can use them.
  useEffect(() => {
    if (payload?.canPublish) getCalendarAudiences().then(setAudiences);
  }, [payload?.canPublish]);

  const events = payload?.data || [];

  const visible = useMemo(
    () =>
      events.filter((event) =>
        show === "mine"
          ? event.personal
          : show === "published"
            ? !event.personal
            : true,
      ),
    [events, show],
  );

  // Filed by every day each event covers, so a run of days shows on all of
  // them rather than only the first.
  const byDay = useMemo(() => {
    const map = new Map();

    for (const event of visible) {
      for (const key of spanOf(event)) {
        const list = map.get(key) || [];
        list.push(event);
        map.set(key, list);
      }
    }

    return map;
  }, [visible]);

  const cells = useMemo(() => monthCells(cursor), [cursor]);
  const today = dayKey(new Date());

  // The list beside the month picker.
  //
  // A day chosen in the picker wins over the tab: asking for the 18th and
  // being shown next week instead would make the picker a liar. With no day
  // chosen, the tab is the question, asked of every event loaded rather than
  // only the month on screen — "what is next" does not stop at the 30th.
  const listed = useMemo(() => {
    const ordered = [...visible].sort((a, b) => (startsAt(a) < startsAt(b) ? -1 : 1));

    if (selected) return ordered.filter((event) => spanOf(event).includes(selected));

    if (tab === "past") {
      return ordered.filter((event) => endsOn(event) < today).reverse();
    }

    const ahead = ordered.filter((event) => endsOn(event) >= today);

    if (tab === "invites") {
      // Only what is genuinely waiting on this person. An invitation to
      // something that has already happened is not a thing to answer.
      return ahead.filter(isWaiting);
    }

    if (tab === "yours") return ordered.filter((event) => event.mine);

    return ahead;
  }, [visible, selected, tab, today]);

  // What the hero and the Invites pill both report. Counted once, from the
  // same list the tabs filter, so the two can never disagree.
  const counts = useMemo(() => {
    const ahead = visible.filter((event) => endsOn(event) >= today);

    return {
      upcoming: ahead.length,
      invites: ahead.filter(isWaiting).length,
      today: ahead.filter((event) => spanOf(event).includes(today)).length,
    };
  }, [visible, today]);

  const step = (months) =>
    setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + months, 1));

  // Saying yes or no from the list. The calendar is reloaded rather than
  // patched in place so the Invites count and the event's own tally agree with
  // what the server now holds.
  const onRespond = async (event, answer) => {
    setAnswering(true);
    const response = await respondToCalendarEvent(event.uuid, answer);
    setAnswering(false);

    if (response?.status === false) {
      toast.error(response.message || "Failed to send your answer");
      return;
    }

    toast.success(
      answer === "accepted"
        ? "You're going"
        : answer === "declined"
          ? "You've declined"
          : "Marked as maybe",
    );

    load();
  };

  const openNew = (date) => {
    setViewing(null);
    setForm({
      ...emptyEvent,
      startDate: date ? dayKey(date) : dayKey(new Date()),
    });
    setEditing("new");
  };

  const openEdit = (event) => {
    setViewing(null);
    setForm({
      title: event.title || "",
      description: event.description || "",
      location: event.location || "",
      startDate: String(event.startDate || "").slice(0, 10),
      endDate: String(event.endDate || "").slice(0, 10),
      startTime: event.startTime || "",
      endTime: event.endTime || "",
      colour: event.colour || "blue",
      visibility: event.visibility || "private",
      programUuids: (event.programs || []).map((row) => row.uuid),
      userUuids: (event.invitees || []).map((row) => row.uuid),
    });
    setEditing(event);
  };

  const toggle = (field, value) =>
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((item) => item !== value)
        : [...prev[field], value],
    }));

  const onSave = async (event) => {
    event.preventDefault();

    if (!form.title.trim()) {
      toast.error("A title is required");
      return;
    }

    if (!form.startDate) {
      toast.error("A date is required");
      return;
    }

    setSaving(true);
    const response = await saveCalendarEvent(
      form,
      editing === "new" ? undefined : editing.uuid,
    );
    setSaving(false);

    if (response?.status === false) {
      toast.error(response.message || "Failed to save the event");
      return;
    }

    toast.success(editing === "new" ? "Added to the calendar" : "Event updated");
    setEditing(null);
    load();
  };

  const onDelete = async () => {
    const response = await deleteCalendarEvent(confirming.uuid);

    if (response?.status === false) {
      toast.error(response.message || "Failed to remove the event");
      return;
    }

    toast.success("Removed from the calendar");
    setConfirming(null);
    setViewing(null);
    load();
  };

  if (loading) return <Loader />;

  if (!payload) {
    return (
      <div className="px-6 py-10">
        <div className="mx-auto max-w-3xl rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          The calendar could not be loaded.
        </div>
      </div>
    );
  }

  const { canPublish } = payload;

  return (
    <div className="min-h-screen px-6 py-4">
      {/* HERO — above both shapes of the page, so expanding the month does not
          change what the screen says it is. */}
      <div className="relative mb-6 min-h-[180px] overflow-hidden rounded-2xl bg-black shadow-sm">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/mentor_hero.svg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-[#c9672b]/30" />

        <div className="relative z-10 max-w-2xl p-8 text-white">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-sm font-medium shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#f08a3c]" />
            Calendar
          </span>

          <h1 className="mb-2 text-2xl font-bold leading-tight drop-shadow-lg md:text-3xl">
            Everything you have coming up
          </h1>

          <p className="max-w-xl text-sm leading-6 text-white/85 drop-shadow-md">
            The events published to you by the programme team, and the reminders
            you keep for yourself, in one place. Your own entries stay yours —
            nobody else can read them, an administrator included.
          </p>

          {/* Counted from the same list the tabs filter, so the hero cannot
              claim something the page below then fails to show. */}
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold drop-shadow-md">
            <span className="inline-flex items-center gap-2">
              <FaRegCalendarCheck className="text-[#f08a3c]" />
              {counts.upcoming} coming up
            </span>

            {counts.today > 0 ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
                {counts.today} today
              </span>
            ) : null}

            {counts.invites > 0 ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-[#f09300] px-3 py-1">
                {counts.invites}{" "}
                {counts.invites === 1 ? "invitation" : "invitations"} waiting on
                you
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* THE EVERYDAY SHAPE: a month to pick from, a list to read.

          No items-start on the row: the two columns stretch to the taller of
          them, so the month and the list end on the same line. */}
      {!expanded ? (
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="flex w-full shrink-0 flex-col lg:w-2/5">
            <ExternalCalendarMenu />

            {/* The expand control straddles the top edge of the month it
                grows, rather than sitting in a toolbar away from it. */}
            <div className="relative mt-6 flex flex-1">
              <button
                type="button"
                onClick={() => setExpanded(true)}
                aria-label="Expand the calendar"
                title="Expand the calendar"
                className="absolute -top-4 left-1/2 z-10 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full bg-[#082d77] text-white shadow-md transition hover:bg-[#0a3a97]"
              >
                <FaExpandAlt className="text-xs" />
              </button>

              <MiniMonth
                cursor={cursor}
                onStep={step}
                selected={selected}
                onSelect={setSelected}
                byDay={byDay}
              />
            </div>
          </div>

          <EventsPanel
            tab={tab}
            onTab={(next) => {
              setTab(next);
              // A tab and a chosen day are two answers to the same question,
              // so choosing one clears the other.
              setSelected("");
            }}
            counts={counts}
            events={listed}
            selected={selected}
            onClearDay={() => setSelected("")}
            onBack={() => navigate(-1)}
            onCreate={() =>
              openNew(selected ? new Date(`${selected}T00:00:00`) : undefined)
            }
            onOpen={setViewing}
            onRespond={onRespond}
            answering={answering}
          />
        </div>
      ) : null}

      {/* THE WHOLE MONTH, for the weeks when its shape is the question. */}
      {expanded ? (
        <>
      {/* MONTH BAR */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const now = new Date();
              setCursor(new Date(now.getFullYear(), now.getMonth(), 1));
            }}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-[#344054] transition hover:bg-slate-50"
          >
            Today
          </button>

          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="Previous month"
            className="rounded-full p-2.5 text-slate-500 transition hover:bg-slate-100"
          >
            <FaChevronLeft />
          </button>

          <button
            type="button"
            onClick={() => step(1)}
            aria-label="Next month"
            className="rounded-full p-2.5 text-slate-500 transition hover:bg-slate-100"
          >
            <FaChevronRight />
          </button>

          <h1 className="ml-2 text-xl font-bold tracking-tight text-slate-900">
            {cursor.toLocaleDateString("en-GB", {
              month: "long",
              year: "numeric",
            })}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={show}
            onChange={(event) => setShow(event.target.value)}
            className="rounded-lg border border-slate-300 py-2 pl-3 pr-8 text-sm text-[#344054] outline-none focus:border-[#082d77]"
          >
            <option value="all">Everything</option>
            <option value="published">Program events</option>
            <option value="mine">My reminders</option>
          </select>

          <button
            type="button"
            onClick={() => setExpanded(false)}
            aria-label="Back to the list"
            title="Back to the list"
            className="rounded-lg border border-slate-300 p-2.5 text-slate-500 transition hover:bg-slate-50"
          >
            <FaCompressAlt className="text-sm" />
          </button>

          <button
            type="button"
            onClick={() => openNew()}
            className="inline-flex items-center gap-2 rounded-lg bg-[#16a34a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#15803d]"
          >
            <FaPlus /> Create
          </button>
        </div>
      </div>

      {/* THE MONTH */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="grid grid-cols-7 border-b border-slate-200">
          {WEEKDAYS.map((name) => (
            <div
              key={name}
              className="px-2 py-2.5 text-center text-xs font-semibold tracking-wide text-slate-500"
            >
              {name}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((date) => {
            const key = dayKey(date);
            const outside = date.getMonth() !== cursor.getMonth();
            const isToday = key === today;
            const list = byDay.get(key) || [];

            return (
              <div
                key={key}
                role="button"
                tabIndex={0}
                onClick={() => openNew(date)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") openNew(date);
                }}
                className={`min-h-[118px] cursor-pointer border-b border-r border-slate-200 p-1.5 transition hover:bg-slate-50 ${
                  outside ? "bg-slate-50/60" : ""
                }`}
              >
                <div className="mb-1 flex justify-center">
                  <span
                    className={`flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-semibold ${
                      isToday
                        ? "bg-[#1a73e8] text-white"
                        : outside
                          ? "text-slate-300"
                          : "text-slate-600"
                    }`}
                  >
                    {date.getDate() === 1
                      ? date.toLocaleDateString("en-GB", {
                          month: "short",
                          day: "numeric",
                        })
                      : date.getDate()}
                  </span>
                </div>

                <div className="space-y-1">
                  {list.slice(0, 3).map((event) => (
                    <button
                      key={`${event.uuid}-${key}`}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewing(event);
                      }}
                      title={event.title}
                      className={`flex w-full items-center gap-1 truncate rounded px-1.5 py-0.5 text-left text-xs font-semibold text-white ${colourOf(event.colour).chip}`}
                    >
                      {event.personal ? (
                        <FaLock className="shrink-0 text-[9px] opacity-80" />
                      ) : null}
                      <span className="truncate">
                        {timeLabel(event) ? `${timeLabel(event)} ` : ""}
                        {event.title}
                      </span>
                    </button>
                  ))}

                  {list.length > 3 ? (
                    <span className="block px-1.5 text-xs font-semibold text-slate-500">
                      {list.length - 3} more
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-200 px-4 py-3 text-xs text-[#667085]">
          <span className="inline-flex items-center gap-1.5">
            <FaLock className="text-[10px]" /> Only you can see your reminders
          </span>
          {canPublish ? (
            <span>
              You can publish an event to whole programs or to named people.
            </span>
          ) : (
            <span>
              Program events are published by the program team; anything you
              add is your own.
            </span>
          )}
        </div>
      </div>
        </>
      ) : null}

      {/* ONE EVENT */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl">
            <div
              className={`flex items-start justify-between gap-3 p-5 text-white ${colourOf(viewing.colour).chip}`}
            >
              <div className="min-w-0">
                <h3 className="text-lg font-black tracking-tight">
                  {viewing.title}
                </h3>
                <p className="mt-0.5 text-sm text-white/85">
                  {new Date(`${viewing.startDate}T00:00:00`).toLocaleDateString(
                    "en-GB",
                    { weekday: "long", day: "numeric", month: "long", year: "numeric" },
                  )}
                  {viewing.endDate && viewing.endDate !== viewing.startDate
                    ? ` – ${new Date(`${viewing.endDate}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}`
                    : ""}
                  {timeLabel(viewing) ? ` · ${timeLabel(viewing)}` : ""}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setViewing(null)}
                aria-label="Close"
                className="text-white/80 transition hover:text-white"
              >
                <FaTimes />
              </button>
            </div>

            <div className="space-y-3 p-5">
              {viewing.location ? (
                <p className="flex items-center gap-2 text-sm text-[#475467]">
                  <FaMapMarkerAlt className="text-slate-400" />
                  {viewing.location}
                </p>
              ) : null}

              {viewing.description ? (
                <p className="whitespace-pre-wrap text-sm leading-6 text-[#475467]">
                  {viewing.description}
                </p>
              ) : null}

              <p className="flex items-center gap-2 text-sm text-[#667085]">
                {AUDIENCE[viewing.visibility]?.icon}
                {viewing.personal
                  ? "Only you can see this"
                  : viewing.visibility === "programs"
                    ? `Published to ${viewing.programs.map((p) => p.title).join(", ") || "selected programs"}`
                    : viewing.visibility === "users"
                      ? `Published to ${viewing.invitees.length} ${viewing.invitees.length === 1 ? "person" : "people"}`
                      : "Published to everyone"}
              </p>

              {!viewing.mine && viewing.createdBy ? (
                <p className="text-xs text-[#8a8f98]">
                  Added by {viewing.createdBy.name}
                </p>
              ) : null}

              {/* Who has answered. Shown to everyone on the invitation rather
                  than to the organiser alone — an attendee list is not a
                  secret from the people on it. */}
              {viewing.visibility === "users" && viewing.invitees.length ? (
                <p className="text-xs text-[#667085]">
                  {viewing.responses.accepted} going ·{" "}
                  {viewing.responses.tentative} maybe ·{" "}
                  {viewing.responses.declined} not going ·{" "}
                  {viewing.responses.pending} yet to answer
                </p>
              ) : null}

              {viewing.invited ? (
                <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                  <span className="mr-1 text-sm font-semibold text-[#344054]">
                    Are you going?
                  </span>

                  {[
                    { key: "accepted", label: "Going" },
                    { key: "tentative", label: "Maybe" },
                    { key: "declined", label: "Can't go" },
                  ].map((answer) => (
                    <button
                      key={answer.key}
                      type="button"
                      disabled={answering}
                      onClick={() =>
                        onRespond(viewing, answer.key).then(() =>
                          setViewing(null),
                        )
                      }
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-60 ${
                        viewing.myResponse === answer.key
                          ? "bg-[#082d77] text-white"
                          : "border border-slate-300 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {answer.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {viewing.canEdit ? (
              <div className="flex items-center justify-end gap-3 border-t border-slate-100 p-5">
                <button
                  type="button"
                  onClick={() => setConfirming(viewing)}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-slate-200"
                >
                  <FaTrash /> Remove
                </button>

                {viewing.mine ? (
                  <button
                    type="button"
                    onClick={() => openEdit(viewing)}
                    className="rounded-lg bg-[#082d77] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#061f54]"
                  >
                    Edit
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* EDITOR */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={onSave}
            className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <h3 className="text-xl font-black tracking-tight text-slate-950">
                {editing === "new" ? "New calendar entry" : "Edit entry"}
              </h3>

              <button
                type="button"
                onClick={() => setEditing(null)}
                aria-label="Close"
                className="text-slate-400 transition hover:text-slate-600"
              >
                <FaTimes />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className={labelClass} htmlFor="ev-title">
                    Title
                  </label>
                  <input
                    id="ev-title"
                    className={inputClass}
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>

                <div>
                  <label className={labelClass} htmlFor="ev-start">
                    Date
                  </label>
                  <input
                    id="ev-start"
                    type="date"
                    className={inputClass}
                    value={form.startDate}
                    onChange={(e) =>
                      setForm({ ...form, startDate: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className={labelClass} htmlFor="ev-end">
                    Ends (optional)
                  </label>
                  <input
                    id="ev-end"
                    type="date"
                    className={inputClass}
                    value={form.endDate}
                    onChange={(e) =>
                      setForm({ ...form, endDate: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className={labelClass} htmlFor="ev-from">
                    From (optional)
                  </label>
                  <input
                    id="ev-from"
                    type="time"
                    className={inputClass}
                    value={form.startTime}
                    onChange={(e) =>
                      setForm({ ...form, startTime: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className={labelClass} htmlFor="ev-to">
                    To (optional)
                  </label>
                  <input
                    id="ev-to"
                    type="time"
                    className={inputClass}
                    value={form.endTime}
                    onChange={(e) =>
                      setForm({ ...form, endTime: e.target.value })
                    }
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass} htmlFor="ev-where">
                    Location
                  </label>
                  <input
                    id="ev-where"
                    className={inputClass}
                    placeholder="Anza offices, Zoom, Arusha…"
                    value={form.location}
                    onChange={(e) =>
                      setForm({ ...form, location: e.target.value })
                    }
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass} htmlFor="ev-note">
                    Details
                  </label>
                  <textarea
                    id="ev-note"
                    rows={3}
                    className={inputClass}
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                  />
                </div>

                <div className="md:col-span-2">
                  <p className={labelClass}>Colour</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(EVENT_COLOURS).map((name) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => setForm({ ...form, colour: name })}
                        aria-label={EVENT_COLOURS[name].label}
                        className={`h-8 w-8 rounded-full transition ${EVENT_COLOURS[name].dot} ${
                          form.colour === name
                            ? "ring-2 ring-[#082d77] ring-offset-2"
                            : ""
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* WHO SEES IT */}
                <div className="md:col-span-2">
                  <p className={labelClass}>Who can see this</p>

                  {canPublish ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {Object.keys(AUDIENCE).map((key) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setForm({ ...form, visibility: key })}
                          className={`flex items-start gap-3 rounded-xl border p-3 text-left transition ${
                            form.visibility === key
                              ? "border-[#082d77] bg-[#082d77]/5"
                              : "border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <span className="mt-0.5 text-[#082d77]">
                            {AUDIENCE[key].icon}
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-bold text-[#111a2e]">
                              {AUDIENCE[key].label}
                            </span>
                            <span className="block text-xs leading-5 text-[#667085]">
                              {AUDIENCE[key].note}
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-[#667085]">
                      <FaLock className="mt-0.5 text-slate-400" />
                      {AUDIENCE.private.note}
                    </p>
                  )}
                </div>

                {canPublish && form.visibility === "programs" ? (
                  <div className="md:col-span-2">
                    <p className={labelClass}>Programs</p>
                    <div className="max-h-44 overflow-y-auto rounded-xl border border-slate-200 p-2">
                      {audiences.programs.length === 0 ? (
                        <p className="p-2 text-sm text-slate-400">
                          No programs available.
                        </p>
                      ) : (
                        audiences.programs.map((program) => (
                          <label
                            key={program.uuid}
                            className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50"
                          >
                            <input
                              type="checkbox"
                              checked={form.programUuids.includes(program.uuid)}
                              onChange={() =>
                                toggle("programUuids", program.uuid)
                              }
                            />
                            {program.title}
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                ) : null}

                {canPublish && form.visibility === "users" ? (
                  <div className="md:col-span-2">
                    <p className={labelClass}>People</p>
                    <div className="max-h-44 overflow-y-auto rounded-xl border border-slate-200 p-2">
                      {audiences.users.map((person) => (
                        <label
                          key={person.uuid}
                          className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50"
                        >
                          <input
                            type="checkbox"
                            checked={form.userUuids.includes(person.uuid)}
                            onChange={() => toggle("userUuids", person.uuid)}
                          />
                          <span className="truncate">{person.name}</span>
                          <span className="ml-auto shrink-0 text-xs text-[#8a8f98]">
                            {person.role}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 p-6">
              <button
                type="button"
                onClick={() => setEditing(null)}
                disabled={saving}
                className="rounded-lg bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-200 disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-[#082d77] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#061f54] disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CONFIRM */}
      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-xl font-black tracking-tight text-slate-950">
              Remove {confirming.title}?
            </h3>
            <p className="mt-3 text-sm leading-6 text-[#667085]">
              {confirming.personal
                ? "It comes off your calendar. Nobody else ever saw it."
                : "It comes off the calendar of everyone it was published to."}
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirming(null)}
                className="rounded-lg bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={onDelete}
                className="rounded-lg bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyCalendar;
