"use client";

import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FaArrowLeft,
  FaChevronDown,
  FaChevronRight,
  FaExclamationTriangle,
  FaLock,
  FaTasks,
  FaUserTie,
  FaUsers,
} from "react-icons/fa";
import Loader from "@/components/common/Loader";
import StatCard from "@/components/tracker/StatCard";
import { UserContext } from "@/layouts/DashboardLayout";
import {
  getCohortCoaching,
  setCohortCoaching,
} from "@/controllers/cohort_controller";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-[#111a2e] outline-none focus:border-[#082d77] focus:ring-2 focus:ring-[#082d77]/20";

const labelClass = "mb-1.5 block text-sm font-semibold text-[#344054]";

// The coach's own read on how the enterprise is doing. Reserved status
// colours, always beside the word.
const FLAG = {
  green: { label: "On track", chip: "bg-emerald-50 text-emerald-700", dot: "#1baf7a" },
  amber: { label: "Needs attention", chip: "bg-amber-50 text-amber-700", dot: "#eda100" },
  red: { label: "At risk", chip: "bg-rose-50 text-rose-700", dot: "#e34948" },
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

// Who coaches whom on a programme, what they agreed to work on, and how each
// enterprise is going. The Program Lead assigns; coaches keep the record.
const ProgramCoaching = () => {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const { userDetails } = useContext(UserContext);

  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ mentorUuid: "", advisorUuid: "", supportAreas: "" });
  const [saving, setSaving] = useState(false);

  // Assignment is the lead's call; a coach reads the page and keeps their own
  // session records, which they do from the tracker.
  const canAssign = ["Admin", "BDA"].includes(userDetails?.role);

  const load = () =>
    getCohortCoaching(uuid)
      .then(setPayload)
      .catch((error) => {
        toast.error(
          error?.response?.status === 403
            ? "You do not coach anyone on this program"
            : "Failed to load the coaching roster",
        );
        setPayload(null);
      })
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uuid]);

  const openEditor = (row) => {
    setForm({
      mentorUuid: row.mentor?.uuid || "",
      advisorUuid: row.advisor?.uuid || "",
      supportAreas: row.supportAreas || "",
    });
    setEditing(row);
  };

  const onSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    const response = await setCohortCoaching(uuid, editing.business.uuid, form);
    setSaving(false);

    if (response?.status === false) {
      toast.error(response.message || "Failed to save");
      return;
    }

    toast.success("Coaching assignment saved");
    setEditing(null);
    load();
  };

  if (loading) return <Loader />;

  if (!payload) {
    return (
      <div className="px-6 py-10">
        <div className="mx-auto max-w-3xl rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          This coaching roster is not open to you.
        </div>
      </div>
    );
  }

  const { summary, mentors, advisors, program, data } = payload;

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
            Coaching &amp; Mentorship
          </span>

          <h1 className="mb-3 text-3xl font-bold leading-tight drop-shadow-lg md:text-4xl">
            {program?.title || "Program"}
          </h1>

          <p className="max-w-2xl text-sm leading-6 text-white/85 drop-shadow-md">
            Who is coaching each enterprise, what they agreed to work on, when
            they next meet, and what came out of the last visit.
          </p>
        </div>
      </div>

      {/* HEADLINE FIGURES */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<FaUsers />}
          label="Enterprises"
          value={summary.enterprises}
          tone="text-[#0b2b5c]"
          sub={
            <p className="mt-1 text-xs text-slate-400">
              {summary.withMentor} with a coach
            </p>
          }
        />
        <StatCard
          icon={<FaUserTie />}
          label="Without a coach"
          value={summary.withoutMentor}
          tone={summary.withoutMentor ? "text-amber-500" : "text-emerald-600"}
          sub={<p className="mt-1 text-xs text-slate-400">Awaiting assignment</p>}
        />
        <StatCard
          icon={<FaTasks />}
          label="Open action items"
          value={summary.openActions}
          tone="text-[#0b2b5c]"
          sub={<p className="mt-1 text-xs text-slate-400">Across all sessions</p>}
        />
        <StatCard
          icon={<FaExclamationTriangle />}
          label="At risk"
          value={summary.atRisk}
          tone="text-rose-600"
          sub={
            <p className="mt-1 text-xs text-slate-400">Last flagged red by a coach</p>
          }
        />
      </div>

      {/* ROSTER */}
      {data.length === 0 ? (
        <div className="mx-auto max-w-3xl rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          No enterprise on this program yet.
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((row) => {
            const open = expanded === row.business.uuid;
            const flag = FLAG[row.flag] || null;

            return (
              <div
                key={row.business.uuid}
                className="overflow-hidden rounded-2xl bg-white shadow-sm shadow-slate-200/50"
              >
                <div className="flex flex-wrap items-start justify-between gap-4 p-5">
                  <button
                    type="button"
                    onClick={() => setExpanded(open ? null : row.business.uuid)}
                    className="flex min-w-0 flex-1 items-start gap-3 text-left"
                  >
                    <span className="mt-1 text-xs text-slate-400">
                      {open ? <FaChevronDown /> : <FaChevronRight />}
                    </span>

                    <span className="min-w-0">
                      <span className="block truncate text-base font-black text-[#082d77]">
                        {row.business.name}
                      </span>

                      <span className="mt-1 block text-sm text-[#667085]">
                        {row.mentor ? (
                          <>Coach: <b className="text-slate-900">{row.mentor.name}</b></>
                        ) : (
                          <span className="font-semibold text-amber-600">
                            No coach assigned
                          </span>
                        )}
                        {row.advisor ? ` · Advisor: ${row.advisor.name}` : ""}
                      </span>

                      {row.supportAreas ? (
                        <span className="mt-1 block text-sm text-[#667085]">
                          Support areas: {row.supportAreas}
                        </span>
                      ) : null}
                    </span>
                  </button>

                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <span className="text-[#667085]">
                      <span className="block text-xs text-slate-400">Next session</span>
                      {day(row.nextSession)}
                    </span>

                    <span className="text-[#667085]">
                      <span className="block text-xs text-slate-400">Sessions</span>
                      {row.sessionCount}
                    </span>

                    <span className="text-[#667085]">
                      <span className="block text-xs text-slate-400">Open actions</span>
                      {row.openActions}
                    </span>

                    {flag ? (
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold ${flag.chip}`}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: flag.dot }}
                        />
                        {flag.label}
                      </span>
                    ) : null}

                    {canAssign ? (
                      <button
                        type="button"
                        onClick={() => openEditor(row)}
                        className="rounded-lg border border-[#082d77]/20 px-3 py-2 text-xs font-semibold text-[#082d77] transition hover:bg-slate-50"
                      >
                        {row.mentor ? "Reassign" : "Assign coach"}
                      </button>
                    ) : null}
                  </div>
                </div>

                {open ? (
                  <div className="border-t border-slate-100 bg-slate-50/60 p-5">
                    {row.sessions.length === 0 ? (
                      <p className="text-sm text-slate-500">
                        No session has been logged with this enterprise yet.
                      </p>
                    ) : (
                      <ul className="space-y-3">
                        {row.sessions.map((session) => (
                          <li
                            key={session.uuid}
                            className="rounded-xl bg-white p-4 shadow-sm shadow-slate-200/50"
                          >
                            <div className="flex flex-wrap items-baseline justify-between gap-3">
                              <span className="text-sm font-bold text-slate-900">
                                {day(session.sessionDate)}
                                {session.topic ? ` · ${session.topic}` : ""}
                              </span>

                              <span className="text-xs text-[#8a8f98]">
                                {pretty(session.sessionType)}
                                {session.mentor ? ` · ${session.mentor.name}` : ""}
                              </span>
                            </div>

                            {session.issuesDiscussed ? (
                              <p className="mt-2 text-sm leading-6 text-[#667085]">
                                {session.issuesDiscussed}
                              </p>
                            ) : null}

                            {session.actionsAgreed ? (
                              <p className="mt-2 text-sm leading-6 text-slate-900">
                                <b>Action:</b> {session.actionsAgreed}
                                {session.actionDeadline
                                  ? ` · due ${day(session.actionDeadline)}`
                                  : ""}
                                {session.actionStatus
                                  ? ` · ${pretty(session.actionStatus)}`
                                  : ""}
                              </p>
                            ) : null}

                            {/* A withheld note is said out loud: the reader
                                knows something exists and that it is not
                                theirs, rather than seeing an empty field. */}
                            {session.notesWithheld ? (
                              <p className="mt-2 inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500">
                                <FaLock />
                                Private notes — visible to the coach who wrote
                                them
                              </p>
                            ) : session.notes ? (
                              <p className="mt-2 rounded-lg bg-slate-50 p-3 text-sm leading-6 text-[#667085]">
                                {session.notes}
                              </p>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {/* ASSIGN */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={onSave}
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
          >
            <h3 className="text-xl font-black tracking-tight text-slate-950">
              {editing.business.name}
            </h3>
            <p className="mt-1 text-sm text-[#667085]">
              Who supports this enterprise, and what they agreed to work on.
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <label className={labelClass} htmlFor="coach">
                  Mentor / business coach
                </label>
                <select
                  id="coach"
                  className={inputClass}
                  value={form.mentorUuid}
                  onChange={(e) => setForm({ ...form, mentorUuid: e.target.value })}
                >
                  <option value="">Unassigned</option>
                  {mentors.map((person) => (
                    <option key={person.uuid} value={person.uuid}>
                      {person.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass} htmlFor="advisor">
                  Business development advisor
                </label>
                <select
                  id="advisor"
                  className={inputClass}
                  value={form.advisorUuid}
                  onChange={(e) =>
                    setForm({ ...form, advisorUuid: e.target.value })
                  }
                >
                  <option value="">Unassigned</option>
                  {advisors.map((person) => (
                    <option key={person.uuid} value={person.uuid}>
                      {person.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass} htmlFor="areas">
                  Agreed support areas
                </label>
                <textarea
                  id="areas"
                  rows={3}
                  className={inputClass}
                  placeholder="Financial modelling; investor readiness; route to market"
                  value={form.supportAreas}
                  onChange={(e) =>
                    setForm({ ...form, supportAreas: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
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
                {saving ? "Saving..." : "Save assignment"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ProgramCoaching;
