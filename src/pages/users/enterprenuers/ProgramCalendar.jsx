"use client";

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaCoins,
  FaExclamationTriangle,
  FaLayerGroup,
  FaPen,
  FaPlus,
  FaTimes,
  FaTrash,
} from "react-icons/fa";
import Loader from "@/components/common/Loader";
import StatCard from "@/components/tracker/StatCard";
import {
  deleteCohortCalendarEntry,
  getCohortCalendar,
  saveCohortCalendarEntry,
} from "@/controllers/cohort_controller";

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

const money = (value) => Number(value || 0).toLocaleString();

const emptyEntry = {
  name: "",
  activityType: "workshop",
  activityDate: "",
  dueDate: "",
  location: "",
  facilitator: "",
  ownerUuid: "",
  plannedParticipants: "",
  actualParticipants: "",
  budgetPlanned: "",
  cost: "",
  deliverables: "",
  status: "planned",
};

// The programme implementation calendar. The workplan as dated work: every
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

  const openNew = () => {
    setForm(emptyEntry);
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
      plannedParticipants: entry.plannedParticipants ?? "",
      actualParticipants: entry.actualParticipants ?? "",
      budgetPlanned: entry.budgetPlanned ?? "",
      cost: entry.cost ?? "",
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
      <button
        type="button"
        onClick={() => navigate(`/dashboard/programManagement/program/${uuid}`)}
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#082d77] transition hover:underline"
      >
        <FaArrowLeft /> Back to program
      </button>

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
            Implementation Calendar
          </span>

          <h1 className="mb-3 text-3xl font-bold leading-tight drop-shadow-lg md:text-4xl">
            {program?.title || "Program"}
          </h1>

          <p className="max-w-2xl text-sm leading-6 text-white/85 drop-shadow-md">
            Workshops, mentoring, site visits, investor events, reporting
            deadlines, grant milestones and partner meetings — each with an
            owner, a date it is due, a budget and what it must produce.
          </p>
        </div>
      </div>

      {/* HEADLINE FIGURES */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
        <StatCard
          icon={<FaCoins />}
          label="Budget spent"
          value={money(summary.budgetSpent)}
          tone="text-amber-500"
          sub={
            <p className="mt-1 text-xs text-slate-400">
              of {money(summary.budgetPlanned)} planned
            </p>
          }
        />
      </div>

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

        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-lg bg-[#16a34a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#15803d]"
        >
          <FaPlus />
          Add Activity
        </button>
      </div>

      {/* SCHEDULE */}
      {visible.length === 0 ? (
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
                <th className="px-5 py-4">Participants</th>
                <th className="px-5 py-4">Budget</th>
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
                    {entry.actualParticipants ?? entry.participants ?? 0}
                    {entry.plannedParticipants
                      ? ` / ${entry.plannedParticipants}`
                      : ""}
                  </td>

                  <td className="px-5 py-4 text-[#6f6f72]">
                    {money(entry.cost)}
                    {entry.budgetPlanned ? ` / ${money(entry.budgetPlanned)}` : ""}
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

                <div>
                  <label className={labelClass} htmlFor="cal-planned">
                    Participants expected
                  </label>
                  <input
                    id="cal-planned"
                    type="number"
                    min="0"
                    className={inputClass}
                    value={form.plannedParticipants}
                    onChange={(e) =>
                      setForm({ ...form, plannedParticipants: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className={labelClass} htmlFor="cal-actual">
                    Participants attended
                  </label>
                  <input
                    id="cal-actual"
                    type="number"
                    min="0"
                    className={inputClass}
                    value={form.actualParticipants}
                    onChange={(e) =>
                      setForm({ ...form, actualParticipants: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className={labelClass} htmlFor="cal-budget">
                    Budget planned
                  </label>
                  <input
                    id="cal-budget"
                    type="number"
                    min="0"
                    className={inputClass}
                    value={form.budgetPlanned}
                    onChange={(e) =>
                      setForm({ ...form, budgetPlanned: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className={labelClass} htmlFor="cal-cost">
                    Spent so far
                  </label>
                  <input
                    id="cal-cost"
                    type="number"
                    min="0"
                    className={inputClass}
                    value={form.cost}
                    onChange={(e) => setForm({ ...form, cost: e.target.value })}
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
