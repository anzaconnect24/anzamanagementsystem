"use client";

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FaBell,
  FaClipboardCheck,
  FaExclamationTriangle,
  FaPaperPlane,
  FaTimes,
  FaUserClock,
} from "react-icons/fa";
import Loader from "@/components/common/Loader";
import StatCard from "@/components/tracker/StatCard";
import {
  getProgramAlerts,
  getProgramAnnouncements,
  raiseProgramAlerts,
  sendProgramAnnouncement,
} from "@/controllers/cohort_controller";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-[#111a2e] outline-none focus:border-[#082d77] focus:ring-2 focus:ring-[#082d77]/20";

const labelClass = "mb-1.5 block text-sm font-semibold text-[#344054]";

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

const AUDIENCE_LABEL = {
  cohort: "Everyone on the programme",
  selected: "Selected enterprises",
  behind: "Only those falling behind",
};

// What the programme says to its cohort, and what it needs the team to look
// at. Sending is the lead's; reading is open to whoever reports on the
// programme.
const ProgramComms = () => {
  const { uuid } = useParams();

  const [payload, setPayload] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [raising, setRaising] = useState(false);
  const [form, setForm] = useState({
    messageType: "announcement",
    audience: "cohort",
    subject: "",
    body: "",
  });

  const load = () =>
    Promise.all([
      getProgramAnnouncements(uuid).then(setPayload),
      getProgramAlerts(uuid).then(setAlerts).catch(() => setAlerts(null)),
    ])
      .catch((error) => {
        toast.error(
          error?.response?.status === 403
            ? "This program is not yours"
            : "Failed to load communications",
        );
        setPayload(null);
      })
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uuid]);

  const onSend = async (event) => {
    event.preventDefault();

    if (!form.subject.trim() || !form.body.trim()) {
      toast.error("A subject and a message are required");
      return;
    }

    setSaving(true);
    const response = await sendProgramAnnouncement(uuid, form);
    setSaving(false);

    if (response?.status === false) {
      toast.error(response.message || "Failed to send");
      return;
    }

    const reached = (response.body || response).recipientCount;
    toast.success(`Sent to ${reached} ${reached === 1 ? "person" : "people"}`);
    setForm({ ...form, subject: "", body: "" });
    setComposing(false);
    load();
  };

  const onRaise = async () => {
    setRaising(true);
    const response = await raiseProgramAlerts(uuid);
    setRaising(false);

    if (response?.status === false) {
      toast.error(response.message || "Failed to raise");
      return;
    }

    const body = response.body || response;
    toast.success(body.raised ? body.message : "Nothing needs attention");
  };

  if (loading) return <Loader />;

  if (!payload) {
    return (
      <div className="px-6 py-10">
        <div className="mx-auto max-w-3xl rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          These communications are not open to you.
        </div>
      </div>
    );
  }

  const { program, types, audiences, canSend, data } = payload;
  const summary = alerts?.summary;

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
            Communications
          </span>

          <h1 className="mb-3 text-3xl font-bold leading-tight drop-shadow-lg md:text-4xl">
            {program?.title || "Program"}
          </h1>

          <p className="max-w-2xl text-sm leading-6 text-white/85 drop-shadow-md">
            Cohort announcements, workshop and milestone reminders, surveys and
            reporting requests — and what needs the team&rsquo;s attention.
          </p>
        </div>
      </div>

      {/* NEEDS ATTENTION */}
      {summary ? (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-extrabold tracking-tight text-[#111a2e]">
              Needs attention
            </h2>

            {canSend ? (
              <button
                type="button"
                onClick={onRaise}
                disabled={raising}
                className="inline-flex items-center gap-2 rounded-lg border border-[#082d77]/20 px-4 py-2.5 text-sm font-semibold text-[#082d77] transition hover:bg-slate-50 disabled:opacity-60"
              >
                <FaBell />
                {raising ? "Notifying..." : "Notify the team"}
              </button>
            ) : null}
          </div>

          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={<FaExclamationTriangle />}
              label="Overdue activities"
              value={summary.overdueActivities}
              tone={summary.overdueActivities ? "text-rose-600" : "text-emerald-600"}
              sub={
                <p className="mt-1 text-xs text-slate-400">Past their due date</p>
              }
            />
            <StatCard
              icon={<FaClipboardCheck />}
              label="Awaiting review"
              value={summary.awaitingReview}
              tone="text-amber-500"
              sub={<p className="mt-1 text-xs text-slate-400">Reports submitted</p>}
            />
            <StatCard
              icon={<FaUserClock />}
              label="Falling behind"
              value={summary.fallingBehind}
              tone={summary.fallingBehind ? "text-amber-500" : "text-emerald-600"}
              sub={
                <p className="mt-1 text-xs text-slate-400">
                  Participant reports overdue
                </p>
              }
            />
            <StatCard
              icon={<FaExclamationTriangle />}
              label="Open risks"
              value={summary.openRisks}
              tone={summary.escalated ? "text-rose-600" : "text-[#0b2b5c]"}
              sub={
                <p className="mt-1 text-xs text-slate-400">
                  {summary.escalated} escalated
                </p>
              }
            />
          </div>

          {/* The detail behind the figures, so a lead can act rather than
              only count. */}
          {(alerts.overdueActivities.length ||
            alerts.fallingBehind.length ||
            alerts.risks.length) > 0 ? (
            <div className="mb-8 grid gap-4 lg:grid-cols-3">
              {[
                ["Overdue activities", alerts.overdueActivities, (row) => `${row.name} · due ${day(row.due)}`],
                ["Falling behind", alerts.fallingBehind, (row) => `${row.business || "Unknown"} · ${row.reportingPeriod}`],
                ["Open risks", alerts.risks, (row) => `${row.business || "Unknown"} · ${pretty(row.riskLevel)}`],
              ].map(([title, rows, line]) => (
                <section
                  key={title}
                  className="rounded-2xl bg-white p-5 shadow-sm shadow-slate-200/50"
                >
                  <h3 className="mb-3 text-sm font-bold text-slate-900">
                    {title}
                    <span className="ml-2 text-xs font-semibold text-slate-400">
                      {rows.length}
                    </span>
                  </h3>

                  {rows.length === 0 ? (
                    <p className="text-sm text-slate-400">Nothing outstanding.</p>
                  ) : (
                    <ul className="space-y-2 text-sm text-[#667085]">
                      {rows.slice(0, 6).map((row) => (
                        <li key={row.uuid} className="truncate">
                          {line(row)}
                        </li>
                      ))}
                      {rows.length > 6 ? (
                        <li className="text-xs text-slate-400">
                          and {rows.length - 6} more
                        </li>
                      ) : null}
                    </ul>
                  )}
                </section>
              ))}
            </div>
          ) : null}
        </>
      ) : null}

      {/* SENT */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-extrabold tracking-tight text-[#111a2e]">
          Sent to the cohort
        </h2>

        {canSend ? (
          <button
            type="button"
            onClick={() => setComposing(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#16a34a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#15803d]"
          >
            <FaPaperPlane />
            New Message
          </button>
        ) : null}
      </div>

      {data.length === 0 ? (
        <div className="mx-auto max-w-3xl rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          Nothing has been sent to this cohort yet.
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((row) => (
            <article
              key={row.uuid}
              className="rounded-2xl bg-white p-5 shadow-sm shadow-slate-200/50"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h3 className="text-base font-black text-[#082d77]">
                  {row.subject}
                </h3>

                <span className="text-xs text-[#8a8f98]">
                  {day(row.createdAt)}
                  {row.sentBy ? ` · ${row.sentBy}` : ""}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-slate-600">
                  {pretty(row.messageType)}
                </span>
                <span className="rounded-md bg-blue-50 px-2 py-0.5 font-semibold text-blue-700">
                  {AUDIENCE_LABEL[row.audience] || pretty(row.audience)}
                </span>
                <span className="rounded-md bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700">
                  Reached {row.recipientCount}
                </span>
              </div>

              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#667085]">
                {row.body}
              </p>
            </article>
          ))}
        </div>
      )}

      {/* COMPOSE */}
      {composing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={onSend}
            className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <h3 className="text-xl font-black tracking-tight text-slate-950">
                New message
              </h3>
              <button
                type="button"
                onClick={() => setComposing(false)}
                aria-label="Close"
                className="text-slate-400 transition hover:text-slate-600"
              >
                <FaTimes />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className={labelClass} htmlFor="msg-type">
                    Type
                  </label>
                  <select
                    id="msg-type"
                    className={inputClass}
                    value={form.messageType}
                    onChange={(e) =>
                      setForm({ ...form, messageType: e.target.value })
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
                  <label className={labelClass} htmlFor="msg-audience">
                    Send to
                  </label>
                  <select
                    id="msg-audience"
                    className={inputClass}
                    value={form.audience}
                    onChange={(e) =>
                      setForm({ ...form, audience: e.target.value })
                    }
                  >
                    {audiences.map((audience) => (
                      <option key={audience} value={audience}>
                        {AUDIENCE_LABEL[audience] || pretty(audience)}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1.5 text-xs text-[#8a8f98]">
                    &ldquo;Falling behind&rdquo; means an open risk flag or an
                    overdue reporting period — not a guess.
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass} htmlFor="msg-subject">
                    Subject
                  </label>
                  <input
                    id="msg-subject"
                    className={inputClass}
                    value={form.subject}
                    onChange={(e) =>
                      setForm({ ...form, subject: e.target.value })
                    }
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass} htmlFor="msg-body">
                    Message
                  </label>
                  <textarea
                    id="msg-body"
                    rows={6}
                    className={inputClass}
                    value={form.body}
                    onChange={(e) => setForm({ ...form, body: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 p-6">
              <button
                type="button"
                onClick={() => setComposing(false)}
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
                {saving ? "Sending..." : "Send message"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ProgramComms;
