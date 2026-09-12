"use client";

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FaCheckCircle,
  FaChevronLeft,
  FaChevronRight,
  FaClock,
  FaCompressAlt,
  FaExclamationTriangle,
  FaExpandAlt,
  FaLayerGroup,
  FaPen,
  FaPlus,
  FaTimes,
  FaTrash,
} from "react-icons/fa";
import Loader from "@/components/common/Loader";
import StatCard from "@/components/tracker/StatCard";
import CalendarPanel from "@/components/calendar/CalendarPanel";
import MiniMonth, { monthCells } from "@/components/calendar/MiniMonth";
import {
  deleteCohortCalendarEntry,
  getCohortCalendar,
  saveCohortCalendarEntry,
} from "@/controllers/cohort_controller";
// The same day key and the same month the platform calendar uses. This file
// had its own copies of both, identical down to the comment.
import { dayKey } from "@/utils/calendar_colours";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-[#111a2e] outline-none focus:border-[#082d77] focus:ring-2 focus:ring-[#082d77]/20";

const labelClass = "mb-1.5 block text-sm font-semibold text-[#344054]";

// Reserved status colours, always shipped with the word rather than instead
// of it.
const STATUS_CHIP = {
  planned: "bg-slate-100 text-slate-600",
  in_progress: "bg-blue-50 text-blue-700",
  completed: "bg-emerald-50 text-emerald-700",
  overdue: "bg-rose-50 text-rose-700",
  cancelled: "bg-slate-100 text-slate-400 line-through",
};

// Each kind of activity gets its own colour on the grid, so a month reads as
// a shape before it is read as words. Calendar colours, not the status
// palette — status is still said in the word on the chip.
const EVENT_TINT = {
  workshop: "bg-[#0b8043]",
  mentoring: "bg-[#3f51b5]",
  mentoring_session: "bg-[#3f51b5]",
  site_visit: "bg-[#e8710a]",
  investor_event: "bg-[#8e24aa]",
  reporting_deadline: "bg-[#d50000]",
  grant_milestone: "bg-[#c0ca33]",
  partner_meeting: "bg-[#039be5]",
  other: "bg-[#616161]",
};

// Anything the server invents later still gets a stable colour rather than
// falling to grey: the same type is the same colour every time.
const SPARE = [
  "bg-[#7986cb]",
  "bg-[#33b679]",
  "bg-[#e67c73]",
  "bg-[#f6bf26]",
  "bg-[#009688]",
  "bg-[#795548]",
];

const tintFor = (type) => {
  if (EVENT_TINT[type]) return EVENT_TINT[type];

  const text = String(type || "");
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) hash = (hash * 31 + text.charCodeAt(i)) % 997;

  return SPARE[hash % SPARE.length];
};

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const pretty = (value) =>
  String(value || "")
    .replace(/[_-]/g, " ")
    .replace(/^./, (c) => c.toUpperCase());

const day = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const emptyEntry = {
  name: "",
  activityType: "workshop",
  activityDate: "",
  dueDate: "",
  location: "",
  facilitator: "",
  ownerUuid: "",
  deliverables: "",
  status: "planned",
};

// One activity in the schedule list. The same shape as an event on the
// platform calendar — colour bar, name, when, who — carrying what a programme
// activity has instead of what an event has: an owner, a due date and evidence.
const ActivityRow = ({ entry, onOpen, onRemove }) => (
  <div className="flex gap-3 border-b border-slate-100 px-5 py-4 last:border-b-0">
    <span
      className={`mt-1 h-full w-1 shrink-0 rounded-full ${tintFor(entry.activityType)}`}
      aria-hidden="true"
    />

    <div className="min-w-0 flex-1">
      <button
        type="button"
        onClick={() => onOpen(entry)}
        className="block w-full text-left"
      >
        <span className="flex flex-wrap items-center gap-2">
          <span
            className={`font-semibold text-slate-900 ${
              entry.status === "cancelled" ? "line-through opacity-60" : ""
            }`}
          >
            {entry.name}
          </span>

          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              entry.overdue
                ? STATUS_CHIP.overdue
                : STATUS_CHIP[entry.status] || STATUS_CHIP.planned
            }`}
          >
            {entry.overdue ? "Overdue" : pretty(entry.status)}
          </span>
        </span>

        <span className="mt-1 block text-sm text-slate-500">
          {day(entry.activityDate)} · {pretty(entry.activityType)}
          {entry.dueDate ? ` · due ${day(entry.dueDate)}` : ""}
        </span>

        <span className="mt-1 block text-xs text-slate-400">
          {entry.owner?.name || "Unassigned"}
          {entry.evidenceCount ? ` · ${entry.evidenceCount} evidence` : ""}
        </span>
      </button>
    </div>

    <div className="flex shrink-0 items-start gap-3 pt-1">
      <button
        type="button"
        onClick={() => onOpen(entry)}
        aria-label={`Edit ${entry.name}`}
        className="text-[#082d77] transition hover:opacity-70"
      >
        <FaPen />
      </button>

      <button
        type="button"
        onClick={() => onRemove(entry)}
        aria-label={`Remove ${entry.name}`}
        className="text-rose-600 transition hover:opacity-70"
      >
        <FaTrash />
      </button>
    </div>
  </div>
);

// The Program Calendar. The workplan as dated work: every
// workshop, mentoring session, site visit, investor event, reporting deadline,
// grant milestone and partner meeting in one schedule, each answerable to
// someone by a date.
const ProgramCalendar = () => {
  const { uuid } = useParams();
  const navigate = useNavigate();

  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // How the schedule is read. "schedule" is the same shape as the platform
  // calendar the top bar leads to — a month to pick from, a list to read — and
  // is the default for the same reason it is there: it answers "what is next"
  // without making anybody parse a grid. The whole month and the
  // detailed table are both a press away.
  const [view, setView] = useState("schedule");
  const [tab, setTab] = useState("upcoming");
  const [selected, setSelected] = useState("");
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [editing, setEditing] = useState(null); // entry uuid, or "new"
  const [form, setForm] = useState(emptyEntry);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(null);

  const load = () =>
    getCohortCalendar(uuid)
      .then(setPayload)
      .catch((error) => {
        toast.error(
          error?.response?.status === 403
            ? "This program is not yours to schedule"
            : "Failed to load the calendar",
        );
        setPayload(null);
      })
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uuid]);

  const entries = payload?.data || [];

  // Filtering stays on the client: the whole programme calendar is one page of
  // work, and a round trip per filter would be slower than the list is long.
  const visible = useMemo(
    () =>
      entries.filter(
        (entry) =>
          (!typeFilter || entry.activityType === typeFilter) &&
          (!statusFilter ||
            (statusFilter === "overdue"
              ? entry.overdue
              : entry.status === statusFilter)),
      ),
    [entries, typeFilter, statusFilter],
  );

  // Everything on the grid, filed by the day it happens. Built once per
  // change rather than filtered per cell — forty-two cells scanning the whole
  // list is forty-two passes for no reason.
  const byDay = useMemo(() => {
    const map = new Map();

    for (const entry of visible) {
      const key = String(entry.activityDate || "").slice(0, 10);
      if (!key) continue;

      const list = map.get(key) || [];
      list.push(entry);
      map.set(key, list);
    }

    return map;
  }, [visible]);

  const cells = useMemo(() => monthCells(cursor), [cursor]);
  const today = dayKey(new Date());

  // The tabs the platform calendar has, asked of programme work instead of
  // events. There is no Invites here — nobody RSVPs to a reporting deadline —
  // so Overdue takes that slot: it is the one that is a queue, the one with
  // something waiting on somebody.
  const TABS = [
    { key: "upcoming", label: "Upcoming" },
    { key: "overdue", label: "Overdue" },
    { key: "past", label: "Past" },
    { key: "all", label: "All" },
  ];

  const dayOf = (entry) => String(entry.activityDate || "").slice(0, 10);

  // A day chosen in the picker wins over the tab, the same as on the platform
  // calendar: asking for the 18th and being shown next week would make the
  // picker a liar.
  const listed = useMemo(() => {
    const ordered = [...visible].sort((a, b) => (dayOf(a) < dayOf(b) ? -1 : 1));

    if (selected) return ordered.filter((entry) => dayOf(entry) === selected);

    if (tab === "all") return ordered;
    if (tab === "overdue") return ordered.filter((entry) => entry.overdue);
    if (tab === "past") {
      return ordered.filter((entry) => dayOf(entry) < today).reverse();
    }

    return ordered.filter((entry) => dayOf(entry) >= today);
  }, [visible, selected, tab, today]);

  const overdueCount = useMemo(
    () => visible.filter((entry) => entry.overdue).length,
    [visible],
  );

  const step = (months) =>
    setCursor(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + months, 1),
    );

  // Clicking an empty day starts an activity on that day, which is what
  // clicking a day on a calendar has always meant.
  const openNew = (date) => {
    setForm({ ...emptyEntry, activityDate: date ? dayKey(date) : "" });
    setEditing("new");
  };

  const openEdit = (entry) => {
    setForm({
      name: entry.name || "",
      activityType: entry.activityType || "workshop",
      activityDate: String(entry.activityDate || "").slice(0, 10),
      dueDate: String(entry.dueDate || "").slice(0, 10),
      location: entry.location || "",
      facilitator: entry.facilitator || "",
      ownerUuid: entry.owner?.uuid || "",
      deliverables: entry.deliverables || "",
      status: entry.status || "planned",
    });
    setEditing(entry.uuid);
  };

  const onSave = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      toast.error("An activity name is required");
      return;
    }

    if (!form.activityDate) {
      toast.error("An activity date is required");
      return;
    }

    setSaving(true);
    const response = await saveCohortCalendarEntry(
      uuid,
      form,
      editing === "new" ? undefined : editing,
    );
    setSaving(false);

    if (response?.status === false) {
      toast.error(response.message || "Failed to save the entry");
      return;
    }

    toast.success(editing === "new" ? "Activity added" : "Activity updated");
    setEditing(null);
    load();
  };

  const onDelete = async () => {
    const response = await deleteCohortCalendarEntry(uuid, confirming.uuid);

    if (response?.status === false) {
      toast.error(response.message || "Failed to remove the entry");
      return;
    }

    toast.success("Activity removed");
    setConfirming(null);
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

  const { summary, types, statuses, owners, program } = payload;

  return (
    <div className="min-h-screen px-6 py-4">
      {/* HERO */}
      <div className="relative mb-8 min-h-[200px] overflow-hidden rounded-2xl bg-black shadow-sm">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/mentor_hero.svg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-[#c9672b]/30" />

        <div className="relative z-10 max-w-3xl p-10 text-white">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-sm font-medium shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#f08a3c]" />
            Program Calendar
          </span>

          <h1 className="mb-3 text-3xl font-bold leading-tight drop-shadow-lg md:text-4xl">
            {program?.title || "Program"}
          </h1>

          <p className="max-w-2xl text-sm leading-6 text-white/85 drop-shadow-md">
            Workshops, mentoring, site visits, investor events, reporting
            deadlines, grant milestones and partner meetings — each with an
            owner, a date it is due and what it must produce.
          </p>
        </div>
      </div>

      {/* HEADLINE FIGURES */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          icon={<FaLayerGroup />}
          label="Activities"
          value={summary.total}
          tone="text-[#0b2b5c]"
          sub={
            <p className="mt-1 text-xs text-slate-400">
              {summary.completed} completed
            </p>
          }
        />
        <StatCard
          icon={<FaClock />}
          label="Upcoming"
          value={summary.upcoming}
          tone="text-emerald-600"
          sub={<p className="mt-1 text-xs text-slate-400">Still to come</p>}
        />
        <StatCard
          icon={<FaExclamationTriangle />}
          label="Overdue"
          value={summary.overdue}
          tone="text-rose-600"
          sub={<p className="mt-1 text-xs text-slate-400">Past their due date</p>}
        />
      </div>

      {/* MONTH BAR — only for the two wider shapes. In the schedule view the
          month carries its own controls, the way the platform calendar's
          does. */}
      {view !== "schedule" ? (
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

          <h2 className="ml-2 text-xl font-bold tracking-tight text-slate-900">
            {cursor.toLocaleDateString("en-GB", {
              month: "long",
              year: "numeric",
            })}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setView("schedule")}
            aria-label="Back to the schedule"
            title="Back to the schedule"
            className="rounded-lg border border-slate-300 p-2.5 text-slate-500 transition hover:bg-slate-50"
          >
            <FaCompressAlt className="text-sm" />
          </button>

          <select
            value={view}
            onChange={(event) => setView(event.target.value)}
            className="rounded-lg border border-slate-300 py-2 pl-3 pr-8 text-sm text-[#344054] outline-none focus:border-[#082d77]"
          >
            <option value="schedule">Schedule</option>
            <option value="month">Month grid</option>
            <option value="table">Table</option>
          </select>
        </div>
      </div>
      ) : null}

      {/* FILTERS */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-[#082d77]"
          >
            <option value="">All activity types</option>
            {types.map((type) => (
              <option key={type} value={type}>
                {pretty(type)}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-[#082d77]"
          >
            <option value="">All statuses</option>
            <option value="overdue">Overdue</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {pretty(status)}
              </option>
            ))}
          </select>
        </div>

        {/* In the schedule view the panel's own + does this, so one button is
            enough. */}
        {view !== "schedule" ? (
          <button
            type="button"
            onClick={() => openNew()}
            className="inline-flex items-center gap-2 rounded-lg bg-[#16a34a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#15803d]"
          >
            <FaPlus />
            Add Activity
          </button>
        ) : null}
      </div>

      {/* THE SCHEDULE — the shape the platform calendar uses. */}
      {view === "schedule" ? (
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="flex w-full shrink-0 flex-col lg:w-2/5">
            {/* The expand control straddles the top edge of the month it
                grows, rather than sitting in a toolbar away from it. */}
            <div className="relative mt-4 flex flex-1">
              <button
                type="button"
                onClick={() => setView("month")}
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
                // Coloured by the kind of work, not by a colour somebody
                // picked — that is the only thing this month does differently.
                dotClass={(entry) => tintFor(entry.activityType)}
              />
            </div>
          </div>

          <CalendarPanel
            title="Activities"
            tabs={TABS.map((item) =>
              item.key === "overdue" ? { ...item, badge: overdueCount } : item,
            )}
            tab={tab}
            onTab={(next) => {
              setTab(next);
              // A tab and a chosen day are two answers to the same question,
              // so choosing one clears the other.
              setSelected("");
            }}
            onBack={() =>
              navigate(`/dashboard/programManagement/program/${uuid}`)
            }
            onCreate={() =>
              openNew(selected ? new Date(`${selected}T00:00:00`) : undefined)
            }
            createLabel="Add an activity"
            selected={selected}
            onClearDay={() => setSelected("")}
            isEmpty={listed.length === 0}
            emptyText={
              entries.length === 0
                ? "Nothing is scheduled yet."
                : "No activity found."
            }
          >
            {listed.map((entry) => (
              <ActivityRow
                key={entry.uuid}
                entry={entry}
                onOpen={openEdit}
                onRemove={setConfirming}
              />
            ))}
          </CalendarPanel>
        </div>
      ) : null}

      {/* THE MONTH */}
      {view === "month" ? (
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
              const events = byDay.get(key) || [];

              return (
                <div
                  key={key}
                  role="button"
                  tabIndex={0}
                  onClick={() => openNew(date)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") openNew(date);
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
                      {/* The 1st says which month it is, the way a calendar
                          does when a week straddles two. */}
                      {date.getDate() === 1
                        ? date.toLocaleDateString("en-GB", {
                            month: "short",
                            day: "numeric",
                          })
                        : date.getDate()}
                    </span>
                  </div>

                  <div className="space-y-1">
                    {events.slice(0, 3).map((entry) => (
                      <button
                        key={entry.uuid}
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          openEdit(entry);
                        }}
                        title={`${entry.name} — ${pretty(entry.activityType)}${
                          entry.owner ? ` · ${entry.owner.name}` : ""
                        }`}
                        className={`block w-full truncate rounded px-1.5 py-0.5 text-left text-xs font-semibold text-white ${tintFor(
                          entry.activityType,
                        )} ${entry.status === "cancelled" ? "opacity-50 line-through" : ""}`}
                      >
                        {entry.overdue ? "⚠ " : ""}
                        {entry.name}
                      </button>
                    ))}

                    {events.length > 3 ? (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setView("table");
                        }}
                        className="block w-full px-1.5 text-left text-xs font-semibold text-slate-500 hover:underline"
                      >
                        {events.length - 3} more
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          {/* What the colours mean, so the grid is readable without
              clicking anything. */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-200 px-4 py-3 text-xs text-[#667085]">
            {types.map((type) => (
              <span key={type} className="inline-flex items-center gap-1.5">
                <span
                  className={`h-2.5 w-2.5 rounded-sm ${tintFor(type)}`}
                />
                {pretty(type)}
              </span>
            ))}
          </div>
        </div>
      ) : view !== "table" ? null : visible.length === 0 ? (
        <div className="mx-auto max-w-3xl rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          {entries.length === 0
            ? "Nothing is scheduled yet. Add the first activity to start the workplan."
            : "No activity matches these filters."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm shadow-slate-200/50">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-semibold text-slate-500">
                <th className="px-5 py-4">Activity</th>
                <th className="px-5 py-4">Type</th>
                <th className="px-5 py-4">Scheduled</th>
                <th className="px-5 py-4">Due</th>
                <th className="px-5 py-4">Owner</th>
                <th className="px-5 py-4">Evidence</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Action</th>
              </tr>
            </thead>

            <tbody>
              {visible.map((entry) => (
                <tr
                  key={entry.uuid}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70"
                >
                  <td className="px-5 py-4">
                    <span className="font-bold text-[#082d77]">{entry.name}</span>
                    {entry.deliverables ? (
                      <span className="mt-0.5 block max-w-xs truncate text-xs text-[#8a8f98]">
                        {entry.deliverables}
                      </span>
                    ) : null}
                  </td>

                  <td className="px-5 py-4 text-[#6f6f72]">
                    {pretty(entry.activityType)}
                  </td>

                  <td className="px-5 py-4 text-[#6f6f72]">
                    {day(entry.activityDate)}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={
                        entry.overdue ? "font-bold text-rose-600" : "text-[#6f6f72]"
                      }
                    >
                      {day(entry.dueDate)}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-[#6f6f72]">
                    {entry.owner?.name || (
                      <span className="text-slate-400">Unassigned</span>
                    )}
                  </td>

                  <td className="px-5 py-4 text-[#6f6f72]">
                    {entry.evidenceCount ? (
                      <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
                        <FaCheckCircle /> {entry.evidenceCount}
                      </span>
                    ) : (
                      <span className="text-slate-400">None</span>
                    )}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold ${
                        entry.overdue
                          ? STATUS_CHIP.overdue
                          : STATUS_CHIP[entry.status] || STATUS_CHIP.planned
                      }`}
                    >
                      {entry.overdue ? "Overdue" : pretty(entry.status)}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <span className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => openEdit(entry)}
                        aria-label={`Edit ${entry.name}`}
                        className="text-[#082d77] transition hover:opacity-70"
                      >
                        <FaPen />
                      </button>

                      <button
                        type="button"
                        onClick={() => setConfirming(entry)}
                        aria-label={`Remove ${entry.name}`}
                        className="text-rose-600 transition hover:opacity-70"
                      >
                        <FaTrash />
                      </button>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* EDITOR */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={onSave}
            className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <h3 className="text-xl font-black tracking-tight text-slate-950">
                {editing === "new" ? "Add activity" : "Edit activity"}
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
                  <label className={labelClass} htmlFor="cal-name">
                    Activity
                  </label>
                  <input
                    id="cal-name"
                    className={inputClass}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className={labelClass} htmlFor="cal-type">
                    Type
                  </label>
                  <select
                    id="cal-type"
                    className={inputClass}
                    value={form.activityType}
                    onChange={(e) =>
                      setForm({ ...form, activityType: e.target.value })
                    }
                  >
                    {types.map((type) => (
                      <option key={type} value={type}>
                        {pretty(type)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass} htmlFor="cal-status">
                    Status
                  </label>
                  <select
                    id="cal-status"
                    className={inputClass}
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {pretty(status)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass} htmlFor="cal-date">
                    Scheduled for
                  </label>
                  <input
                    id="cal-date"
                    type="date"
                    className={inputClass}
                    value={form.activityDate}
                    onChange={(e) =>
                      setForm({ ...form, activityDate: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className={labelClass} htmlFor="cal-due">
                    Due by
                  </label>
                  <input
                    id="cal-due"
                    type="date"
                    className={inputClass}
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  />
                  <p className="mt-1.5 text-xs text-[#8a8f98]">
                    Left blank, the scheduled date is the deadline.
                  </p>
                </div>

                <div>
                  <label className={labelClass} htmlFor="cal-owner">
                    Owner
                  </label>
                  <select
                    id="cal-owner"
                    className={inputClass}
                    value={form.ownerUuid}
                    onChange={(e) =>
                      setForm({ ...form, ownerUuid: e.target.value })
                    }
                  >
                    <option value="">Unassigned</option>
                    {owners.map((person) => (
                      <option key={person.uuid} value={person.uuid}>
                        {person.name} · {person.role}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass} htmlFor="cal-location">
                    Location
                  </label>
                  <input
                    id="cal-location"
                    className={inputClass}
                    value={form.location}
                    onChange={(e) =>
                      setForm({ ...form, location: e.target.value })
                    }
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass} htmlFor="cal-deliverables">
                    Deliverables
                  </label>
                  <textarea
                    id="cal-deliverables"
                    rows={3}
                    className={inputClass}
                    placeholder="What this activity must produce"
                    value={form.deliverables}
                    onChange={(e) =>
                      setForm({ ...form, deliverables: e.target.value })
                    }
                  />
                  <p className="mt-1.5 text-xs text-[#8a8f98]">
                    Evidence is filed against this activity from the M&amp;E
                    workspace and is counted in the Evidence column.
                  </p>
                </div>
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
                {saving ? "Saving..." : "Save activity"}
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
              Remove {confirming.name}?
            </h3>
            <p className="mt-3 text-sm leading-6 text-[#667085]">
              The activity and its attendance records are deleted. Evidence
              already filed against it stays in the M&amp;E workspace.
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

export default ProgramCalendar;
