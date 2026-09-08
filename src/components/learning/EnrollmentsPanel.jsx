"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  enrollmentMeta,
  formatDay,
  updateEnrollment,
} from "@/controllers/workshop_controller";
import {
  getCourseEnrollments,
  setCourseEnrollments,
} from "@/controllers/course_controller";
import { FaPlus } from "react-icons/fa";
import { Field, Modal, inputClass } from "./formBits";

// The learning roster. Progress is never typed in — it is recomputed from
// lessons and workshop attendance every time this loads, so the figures cannot
// drift away from what learners actually did.
const EnrollmentsPanel = ({ courseUuid, canManage }) => {
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState(null);
  const [picker, setPicker] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    getCourseEnrollments(courseUuid)
      .then(setBody)
      .catch(() => toast.error("Failed to load the course roster"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [courseUuid]);

  // Staff choose which of the programme's startups are on this course.
  const saveRoster = async () => {
    setSaving(true);
    const response = await setCourseEnrollments(courseUuid, picker.chosen);
    setSaving(false);

    if (response?.status !== true) {
      toast.error(response?.message || "Failed to update the roster");
      return;
    }

    toast.success("Roster updated");
    setPicker(null);
    load();
  };

  const setDueDate = async (row) => {
    const answer = window.prompt(
      `Learning deadline for ${row.name} (YYYY-MM-DD). Leave blank to clear it.`,
      row.dueAt ? String(row.dueAt).slice(0, 10) : "",
    );

    if (answer === null) return;

    const response = await updateEnrollment(row.uuid, {
      dueAt: answer.trim() || null,
    });

    if (response?.status !== true) {
      toast.error(response?.message || "Failed to save the deadline");
      return;
    }

    toast.success("Deadline saved");
    load();
  };

  if (loading || !body) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-10 text-center text-sm text-slate-500">
        Loading the learning roster...
      </div>
    );
  }

  const cards = [
    { key: "learners", label: "Enrolled", value: body.learners },
    {
      key: "average",
      label: "Average progress",
      value: body.averageProgress === null ? "—" : `${body.averageProgress}%`,
    },
    { key: "completed", label: "Completed", value: body.completed },
    { key: "notStarted", label: "Not started", value: body.notStarted },
  ];

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-950">
            Enrollment
          </h2>
          <p className="mt-1 text-sm text-[#667085]">
            Who is on this course and how far through it they are. Completion
            needs all {body.requiredLessons} required{" "}
            {body.requiredLessons === 1 ? "lesson" : "lessons"}
            {body.requiredWorkshops > 0 &&
              ` and ${body.requiredWorkshops} required ${
                body.requiredWorkshops === 1 ? "workshop" : "workshops"
              }`}
            .
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={() =>
              setPicker({
                chosen: body.data.map((row) => row.businessUuid),
              })
            }
            className="inline-flex items-center gap-2 rounded-lg bg-[#16a34a] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#15803d]"
          >
            <FaPlus className="text-xs" />
            Manage Roster
          </button>
        )}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.key}
            className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm"
          >
            <p className="text-2xl font-black leading-tight text-slate-950">
              {card.value}
            </p>
            <p className="mt-1 text-xs font-medium text-[#6f6f72]">
              {card.label}
            </p>
          </div>
        ))}
      </div>

      {body.data.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          Nobody is enrolled in this course yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-bold tracking-wide text-slate-500">
                  <th className="px-5 py-4">Startup</th>
                  <th className="px-5 py-4">Enrolled</th>
                  <th className="px-5 py-4">Started</th>
                  <th className="px-5 py-4">Lessons</th>
                  <th className="px-5 py-4">Workshops</th>
                  <th className="px-5 py-4">Progress</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Deadline</th>
                </tr>
              </thead>

              <tbody>
                {body.data.map((row) => {
                  const meta = enrollmentMeta(row.status);

                  return (
                    <tr
                      key={row.businessUuid}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-5 py-4">
                        <p className="font-bold text-[#082d77]">{row.name}</p>
                        <p className="text-xs text-[#98A2B3]">{row.email}</p>
                      </td>

                      <td className="px-5 py-4 text-[#6f6f72]">
                        {formatDay(row.enrolledAt)}
                      </td>

                      <td className="px-5 py-4 text-[#6f6f72]">
                        {row.startedAt ? formatDay(row.startedAt) : "—"}
                      </td>

                      <td className="px-5 py-4 text-[#6f6f72]">
                        {row.lessonsCompleted} / {row.lessonsTotal}
                      </td>

                      <td className="px-5 py-4 text-[#6f6f72]">
                        {row.workshopsAttended}
                        {row.requiredWorkshops > 0 &&
                          ` / ${row.requiredWorkshops} req`}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">
                            {row.progressPercent}%
                          </span>
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-teal-500"
                              style={{ width: `${row.progressPercent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${meta.className}`}
                        >
                          {meta.label}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        {canManage ? (
                          <button
                            type="button"
                            onClick={() => setDueDate(row)}
                            className="text-sm font-semibold text-[#082d77] hover:underline"
                          >
                            {row.dueAt ? formatDay(row.dueAt) : "Set"}
                          </button>
                        ) : (
                          <span className="text-[#6f6f72]">
                            {row.dueAt ? formatDay(row.dueAt) : "—"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {picker && (
        <Modal title="Manage Roster" onClose={() => setPicker(null)}>
          <p className="mb-4 text-sm text-[#667085]">
            Every startup on this program. Unticking one takes them off the
            course; their progress against its lessons is kept.
          </p>

          <div className="max-h-[50vh] space-y-2 overflow-y-auto">
            {[
              ...body.data.map((row) => ({
                uuid: row.businessUuid,
                name: row.name,
                email: row.email,
              })),
              ...body.available,
            ].map((startup) => {
              const on = picker.chosen.includes(startup.uuid);

              return (
                <button
                  key={startup.uuid}
                  type="button"
                  onClick={() =>
                    setPicker({
                      chosen: on
                        ? picker.chosen.filter((id) => id !== startup.uuid)
                        : [...picker.chosen, startup.uuid],
                    })
                  }
                  className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${
                    on
                      ? "border-[#16a34a] bg-[#ECFDF3] font-semibold text-[#027A48]"
                      : "border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span
                    className={`h-4 w-4 shrink-0 rounded border ${
                      on ? "border-[#16a34a] bg-[#16a34a]" : "border-slate-300"
                    }`}
                  />

                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{startup.name}</span>
                    <span className="text-xs text-[#98A2B3]">
                      {startup.email}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={saveRoster}
            className="mt-5 w-full rounded-lg bg-[#16a34a] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#15803d] disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save roster"}
          </button>
        </Modal>
      )}
    </>
  );
};

export default EnrollmentsPanel;
