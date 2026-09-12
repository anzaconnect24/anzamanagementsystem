"use client";

import { Fragment, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { FaPlus, FaTimes, FaTrash } from "react-icons/fa";
import Loader from "@/components/common/Loader";
import {
  getProgramWorkplan,
  saveProgramWorkplan,
} from "@/controllers/cohort_controller";

const cellInput =
  "w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm text-[#111a2e] outline-none focus:border-[#082d77]";

// The bar colour carries the activity's state, and the status word is in the
// row beside it — so the plan is still readable if the colours are not.
const BAR = {
  planned: "bg-[#4285f4]",
  in_progress: "bg-amber-500",
  completed: "bg-emerald-600",
  cancelled: "bg-slate-300",
};

const pretty = (value) =>
  String(value || "")
    .replace(/[_-]/g, " ")
    .replace(/^./, (c) => c.toUpperCase());

// Does this activity run during this week column? Dates are ISO strings on
// both sides, so they compare directly.
const runsIn = (activity, week) =>
  !!activity.startDate &&
  !!activity.endDate &&
  activity.startDate <= week.end &&
  activity.endDate >= week.start;

const emptyActivity = () => ({
  title: "",
  startDate: "",
  endDate: "",
  ownerUuid: "",
  status: "planned",
});

// The programme workplan: outputs down the left, their activities beside them,
// and a month-by-week grid showing when each runs.
const ProgramWorkplan = () => {
  const { uuid } = useParams();

  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  // The working copy while editing; the saved plan is re-read afterwards.
  const [draft, setDraft] = useState([]);

  const load = () =>
    getProgramWorkplan(uuid)
      .then((body) => {
        setPayload(body);
        setDraft(
          (body.data || []).map((output) => ({
            title: output.title,
            description: output.description || "",
            activities: (output.activities || []).map((activity) => ({
              title: activity.title,
              startDate: activity.startDate || "",
              endDate: activity.endDate || "",
              ownerUuid: activity.owner?.uuid || "",
              status: activity.status || "planned",
            })),
          })),
        );
      })
      .catch((error) => {
        toast.error(
          error?.response?.status === 403
            ? "This workplan is not open to you"
            : "Failed to load the workplan",
        );
        setPayload(null);
      })
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uuid]);

  const setOutput = (index, patch) =>
    setDraft((prev) =>
      prev.map((output, i) => (i === index ? { ...output, ...patch } : output)),
    );

  const setActivity = (outputIndex, activityIndex, patch) =>
    setDraft((prev) =>
      prev.map((output, i) =>
        i !== outputIndex
          ? output
          : {
              ...output,
              activities: output.activities.map((activity, j) =>
                j === activityIndex ? { ...activity, ...patch } : activity,
              ),
            },
      ),
    );

  const onSave = async () => {
    if (draft.some((output) => !output.title.trim())) {
      toast.error("Every output needs a title");
      return;
    }

    if (
      draft.some((output) =>
        output.activities.some((activity) => !activity.title.trim()),
      )
    ) {
      toast.error("Every activity needs a title");
      return;
    }

    setSaving(true);
    const response = await saveProgramWorkplan(uuid, draft);
    setSaving(false);

    if (response?.status === false) {
      toast.error(response.message || "Failed to save the workplan");
      return;
    }

    const body = response.body || response;
    toast.success(
      `${body.outputs} output${body.outputs === 1 ? "" : "s"}, ${body.activities} activities saved`,
    );
    setEditing(false);
    load();
  };

  if (loading) return <Loader />;

  if (!payload) {
    return (
      <div className="px-6 py-10">
        <div className="mx-auto max-w-3xl rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          This workplan is not open to you.
        </div>
      </div>
    );
  }

  const { program, months, statuses, owners, canEdit, data } = payload;
  const weeks = months.flatMap((month) => month.weeks);

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
            Workplan
          </span>

          <h1 className="mb-3 text-3xl font-bold leading-tight drop-shadow-lg md:text-4xl">
            {program?.title || "Program"}
          </h1>

          <p className="max-w-2xl text-sm leading-6 text-white/85 drop-shadow-md">
            Outputs, the activities that deliver each, and when they run —
            week by week across the life of the programme.
          </p>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        {/* The plan's name, where the tally of outputs and activities used to
            be. The counts are visible in the table itself; the name is not. */}
        <h2 className="text-lg font-bold text-slate-900">
          {program?.title ? `${program.title} workplan` : "Workplan"}
        </h2>

        {canEdit ? (
          <div className="flex flex-wrap items-center gap-3">
            {editing ? (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setDraft((prev) => [
                      ...prev,
                      { title: "", description: "", activities: [emptyActivity()] },
                    ])
                  }
                  className="inline-flex items-center gap-2 rounded-lg border border-[#082d77]/20 px-4 py-2.5 text-sm font-semibold text-[#082d77] transition hover:bg-slate-50"
                >
                  <FaPlus /> Add output
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    load();
                  }}
                  disabled={saving}
                  className="rounded-lg bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-200 disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={onSave}
                  disabled={saving}
                  className="rounded-lg bg-[#16a34a] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#15803d] disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save workplan"}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="rounded-lg bg-[#16a34a] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#15803d]"
              >
                {data.length === 0 ? "Create workplan" : "Edit workplan"}
              </button>
            )}
          </div>
        ) : null}
      </div>

      {/* EDITOR */}
      {editing ? (
        <div className="space-y-4">
          {draft.map((output, outputIndex) => (
            <section
              key={outputIndex}
              className="rounded-2xl bg-white p-5 shadow-sm shadow-slate-200/50"
            >
              <div className="mb-4 flex items-start gap-3">
                <div className="flex-1 space-y-2">
                  <input
                    className={cellInput}
                    placeholder="Output name, e.g. Recruitment & Mobilization"
                    value={output.title}
                    onChange={(e) =>
                      setOutput(outputIndex, { title: e.target.value })
                    }
                  />
                  <textarea
                    rows={2}
                    className={cellInput}
                    placeholder="Output 1: Recruitment and onboarding of 200 SMEs…"
                    value={output.description}
                    onChange={(e) =>
                      setOutput(outputIndex, { description: e.target.value })
                    }
                  />
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setDraft((prev) => prev.filter((_, i) => i !== outputIndex))
                  }
                  aria-label="Remove output"
                  className="mt-1 text-rose-600 transition hover:opacity-70"
                >
                  <FaTrash />
                </button>
              </div>

              <div className="space-y-2">
                {/* Names the unlabelled fields below, so "Responsible" reads
                    the same in the editor as it does in the plan. */}
                {output.activities.length > 0 ? (
                  <div className="hidden gap-2 px-3 text-xs font-semibold uppercase tracking-wide text-[#8a8f98] md:grid md:grid-cols-[1fr_140px_140px_160px_130px_32px]">
                    <span>Activity</span>
                    <span>Start</span>
                    <span>End</span>
                    <span>Responsible</span>
                    <span>Status</span>
                    <span />
                  </div>
                ) : null}

                {output.activities.map((activity, activityIndex) => (
                  <div
                    key={activityIndex}
                    className="grid gap-2 rounded-xl bg-slate-50 p-3 md:grid-cols-[1fr_140px_140px_160px_130px_32px]"
                  >
                    <input
                      className={cellInput}
                      placeholder="Activity"
                      value={activity.title}
                      onChange={(e) =>
                        setActivity(outputIndex, activityIndex, {
                          title: e.target.value,
                        })
                      }
                    />

                    <input
                      type="date"
                      className={cellInput}
                      value={activity.startDate}
                      onChange={(e) =>
                        setActivity(outputIndex, activityIndex, {
                          startDate: e.target.value,
                        })
                      }
                    />

                    <input
                      type="date"
                      className={cellInput}
                      value={activity.endDate}
                      onChange={(e) =>
                        setActivity(outputIndex, activityIndex, {
                          endDate: e.target.value,
                        })
                      }
                    />

                    <select
                      className={cellInput}
                      value={activity.ownerUuid}
                      onChange={(e) =>
                        setActivity(outputIndex, activityIndex, {
                          ownerUuid: e.target.value,
                        })
                      }
                    >
                      <option value="">Unassigned</option>
                      {owners.map((person) => (
                        <option key={person.uuid} value={person.uuid}>
                          {person.name}
                        </option>
                      ))}
                    </select>

                    <select
                      className={cellInput}
                      value={activity.status}
                      onChange={(e) =>
                        setActivity(outputIndex, activityIndex, {
                          status: e.target.value,
                        })
                      }
                    >
                      {statuses.map((status) => (
                        <option key={status} value={status}>
                          {pretty(status)}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() =>
                        setOutput(outputIndex, {
                          activities: output.activities.filter(
                            (_, j) => j !== activityIndex,
                          ),
                        })
                      }
                      aria-label="Remove activity"
                      className="text-slate-400 transition hover:text-rose-600"
                    >
                      <FaTimes />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() =>
                  setOutput(outputIndex, {
                    activities: [...output.activities, emptyActivity()],
                  })
                }
                className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#082d77] hover:underline"
              >
                <FaPlus /> Add activity
              </button>
            </section>
          ))}

          {draft.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
              Add the first output to start the plan.
            </div>
          ) : null}
        </div>
      ) : data.length === 0 ? (
        <div className="mx-auto max-w-3xl rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          No workplan has been created for this program yet.
        </div>
      ) : (
        /* THE PLAN */
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm shadow-slate-200/50">
          {/* table-fixed, so the shares below are obeyed rather than treated
              as suggestions the widest cell can overrule. The min-width keeps
              a long programme scrollable instead of crushing its weeks to a
              hairline: the shares are of the table, not of the viewport. */}
          <table className="w-full min-w-[1000px] table-fixed border-collapse text-left text-sm">
            <thead>
              <tr>
                {/* Half the table is the schedule, which is what a workplan is
                    for. The other half is split 20/20/10 between the three
                    columns of prose. */}
                <th className="sticky left-0 z-10 w-[20%] bg-[#4285f4] px-4 py-3 text-white">
                  Outputs
                </th>
                <th className="w-[20%] bg-[#4285f4] px-4 py-3 text-white">
                  Activities
                </th>
                <th className="w-[10%] bg-[#4285f4] px-4 py-3 text-white">
                  Responsible
                </th>

                {months.map((month) => (
                  <th
                    key={month.key}
                    colSpan={month.weeks.length}
                    // The months divide the schedule's 50% between them, and
                    // each spreads its share across its own weeks. Under
                    // table-fixed the header row is what sets every column's
                    // width, so this is the only place it can be said.
                    style={{
                      width: `${months.length ? 50 / months.length : 50}%`,
                    }}
                    className="border-l border-white/30 bg-[#4285f4] px-3 py-3 text-center text-white"
                  >
                    {month.label}
                    <span className="ml-1 text-xs font-normal text-white/70">
                      {month.year}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {data.map((output) => (
                // An output renders as several sibling rows, so the fragment
                // is the keyed element — a bare <> cannot carry one.
                <Fragment key={output.uuid}>
                  {/* The output banner, spanning the whole width. */}
                  <tr>
                    <td
                      colSpan={3 + weeks.length}
                      className="bg-[#4285f4]/90 px-4 py-2.5 font-bold text-white"
                    >
                      {output.title}
                    </td>
                  </tr>

                  {output.activities.length === 0 ? (
                    <tr>
                      <td className="break-words border border-slate-200 px-4 py-3 align-top text-sm text-[#475467]">
                        {output.description}
                      </td>
                      <td
                        colSpan={2 + weeks.length}
                        className="border border-slate-200 px-4 py-3 text-sm text-slate-400"
                      >
                        No activities under this output yet.
                      </td>
                    </tr>
                  ) : (
                    output.activities.map((activity, index) => (
                      <tr key={activity.uuid}>
                        {/* The output statement sits once, beside its rows. */}
                        {index === 0 ? (
                          <td
                            rowSpan={output.activities.length}
                            className="break-words border border-slate-200 px-4 py-3 align-top text-sm leading-6 text-[#475467]"
                          >
                            {output.description}
                          </td>
                        ) : null}

                        <td className="break-words border border-slate-200 px-4 py-2.5 align-top text-sm leading-6 text-[#111a2e]">
                          {activity.title}
                          {activity.status !== "planned" ? (
                            <span className="mt-0.5 block text-xs text-[#8a8f98]">
                              {pretty(activity.status)}
                            </span>
                          ) : null}
                        </td>

                        {/* Who is answerable for this activity. Unassigned is
                            said plainly rather than left blank — a gap in the
                            plan reads the same as a missing column. */}
                        <td className="break-words border border-slate-200 px-4 py-2.5 align-top text-sm leading-6 text-[#111a2e]">
                          {activity.owner ? (
                            activity.owner.name
                          ) : (
                            <span className="text-slate-400">Unassigned</span>
                          )}
                        </td>

                        {weeks.map((week) => (
                          <td
                            key={week.start}
                            title={`Week of ${week.start}`}
                            className="border border-slate-200 p-0"
                          >
                            {runsIn(activity, week) ? (
                              <span
                                className={`block h-8 w-full ${BAR[activity.status] || BAR.planned}`}
                              />
                            ) : (
                              <span className="block h-8 w-full" />
                            )}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!editing && data.length > 0 ? (
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-[#667085]">
          {Object.entries(BAR).map(([status, colour]) => (
            <span key={status} className="inline-flex items-center gap-2">
              <span className={`h-3 w-5 rounded-sm ${colour}`} />
              {pretty(status)}
            </span>
          ))}
          <span className="text-slate-400">Each column is one week.</span>
        </div>
      ) : null}
    </div>
  );
};

export default ProgramWorkplan;
