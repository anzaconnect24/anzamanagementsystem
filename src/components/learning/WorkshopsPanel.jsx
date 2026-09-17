"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  FaCalendarAlt,
  FaChalkboardTeacher,
  FaExternalLinkAlt,
  FaMapMarkerAlt,
  FaPlus,
  FaTrash,
  FaVideo,
} from "react-icons/fa";
import {
  ATTENDANCE_STATUSES,
  DELIVERY_MODES,
  addRecording,
  attendanceMeta,
  createWorkshop,
  deleteRecording,
  deleteWorkshop,
  formatWhen,
  getAttendance,
  getWorkshops,
  joinWindowState,
  joinWorkshop,
  publishRecording,
  recordAttendance,
} from "@/controllers/workshop_controller";
import { getCourseOutline } from "@/controllers/lesson_controller";
import { uploadFile } from "@/controllers/file_upload_controller";
import { Field, Modal, inputClass } from "./formBits";

// Workshops a programme runs, with the register and the recordings. Staff get
// the full set of controls; a learner sees what is coming and can join it.
const WorkshopsPanel = ({ programUuid, courseUuid, canManage }) => {
  const [loading, setLoading] = useState(true);
  const [workshops, setWorkshops] = useState([]);

  const [form, setForm] = useState(null);
  const [register, setRegister] = useState(null);
  const [recordingForm, setRecordingForm] = useState(null);
  const [publishForm, setPublishForm] = useState(null);
  const [modules, setModules] = useState([]);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    getWorkshops(programUuid, courseUuid)
      .then((body) => setWorkshops(Array.isArray(body?.data) ? body.data : []))
      .catch(() => toast.error("Failed to load the workshops"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [programUuid, courseUuid]);

  const save = async () => {
    if (!form.title.trim()) {
      toast.error("Give the workshop a title");
      return;
    }

    if (!form.startsAt) {
      toast.error("Set when it starts");
      return;
    }

    setSaving(true);
    const response = await createWorkshop(programUuid, {
      ...form,
      title: form.title.trim(),
      courseUuid,
    });
    setSaving(false);

    if (response?.status !== true) {
      toast.error(response?.message || "Failed to create the workshop");
      return;
    }

    toast.success("Workshop scheduled");
    setForm(null);
    load();
  };

  const remove = async (workshop) => {
    if (
      !window.confirm(
        `Delete "${workshop.title}"? Its register and recordings go with it.`,
      )
    )
      return;

    const response = await deleteWorkshop(workshop.uuid);

    if (response?.status !== true) {
      toast.error(response?.message || "Failed to delete the workshop");
      return;
    }

    toast.success("Workshop deleted");
    load();
  };

  const openRegister = async (workshop) => {
    try {
      const body = await getAttendance(workshop.uuid);
      setRegister({ workshop, ...body, rows: body.data });
    } catch {
      toast.error("Failed to load the register");
    }
  };

  const saveRegister = async () => {
    setSaving(true);
    const response = await recordAttendance(
      register.workshop.uuid,
      register.rows.map((row) => ({
        businessUuid: row.businessUuid,
        status: row.status || undefined,
        minutes: row.minutes === "" ? undefined : row.minutes,
        notes: row.notes,
      })),
    );
    setSaving(false);

    if (response?.status !== true) {
      toast.error(response?.message || "Failed to save the register");
      return;
    }

    toast.success("Register saved");
    setRegister(null);
    load();
  };

  const join = async (workshop) => {
    const response = await joinWorkshop(workshop.uuid);

    if (response?.status !== true) {
      toast.error(response?.message || "Could not join");
      return;
    }

    // Recorded as joined, then the meeting opens in a new tab.
    window.open(response.body.meetingLink, "_blank", "noreferrer");
    load();
  };

  const saveRecording = async () => {
    const shape = recordingForm;

    if (!shape.url.trim() && !shape.file) {
      toast.error("Add a link or choose a file");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        title: shape.title.trim() || undefined,
        durationSeconds: shape.durationSeconds || undefined,
      };

      if (shape.file) {
        const data = new FormData();
        data.append("file", shape.file);
        payload.file = await uploadFile(data);
      } else {
        payload.url = shape.url.trim();
      }

      const response = await addRecording(shape.workshopUuid, payload);
      setSaving(false);

      if (response?.status !== true) {
        toast.error(response?.message || "Failed to add the recording");
        return;
      }

      toast.success("Recording added");
      setRecordingForm(null);
      load();
    } catch {
      setSaving(false);
      toast.error("The file could not be uploaded");
    }
  };

  const openPublish = async (recording) => {
    try {
      const outline = await getCourseOutline(courseUuid || programUuid);
      const all = outline.modules || [];

      if (all.length === 0) {
        toast.error("Add a module first — a recording is published into one");
        return;
      }

      setModules(all);
      setPublishForm({ recording, moduleUuid: all[0].uuid });
    } catch {
      toast.error("Failed to load the modules");
    }
  };

  const publish = async () => {
    setSaving(true);
    const response = await publishRecording(
      publishForm.recording.uuid,
      publishForm.moduleUuid,
    );
    setSaving(false);

    if (response?.status !== true) {
      toast.error(response?.message || "Failed to publish");
      return;
    }

    toast.success("Recording added to the module");
    setPublishForm(null);
    load();
  };

  const removeRecording = async (recording) => {
    if (!window.confirm(`Delete the recording "${recording.title}"?`)) return;

    const response = await deleteRecording(recording.uuid);

    if (response?.status !== true) {
      toast.error(response?.message || "Failed to delete the recording");
      return;
    }

    toast.success("Recording deleted");
    load();
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-10 text-center text-sm text-slate-500">
        Loading workshops...
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-950">
            Workshops
          </h2>
          <p className="mt-1 text-sm text-[#667085]">
            Sessions run for this program, with attendance and recordings.
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={() =>
              setForm({
                title: "",
                description: "",
                objectives: "",
                facilitatorName: "",
                startsAt: "",
                endsAt: "",
                deliveryMode: "online",
                venue: "",
                meetingLink: "",
                joinWindowMinutes: 15,
                attendanceThresholdPercent: 75,
                attendanceRequired: false,
              })
            }
            className="inline-flex items-center gap-2 rounded-lg bg-[#16a34a] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#15803d]"
          >
            <FaPlus className="text-xs" />
            Schedule Workshop
          </button>
        )}
      </div>

      {workshops.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          No workshops have been scheduled for this program yet.
        </div>
      ) : (
        <div className="space-y-4">
          {workshops.map((workshop) => {
            const state = joinWindowState(workshop);
            const mode = DELIVERY_MODES.find(
              (item) => item.value === workshop.deliveryMode,
            );

            return (
              <div
                key={workshop.uuid}
                className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#EEF4FF] px-3 py-1 text-xs font-bold text-[#3538CD]">
                        {mode?.label || workshop.deliveryMode}
                      </span>

                      {workshop.attendanceRequired && (
                        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                          Attendance required
                        </span>
                      )}

                      {workshop.status !== "scheduled" && (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold capitalize text-slate-600">
                          {workshop.status}
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-black leading-snug text-slate-950">
                      {workshop.title}
                    </h3>

                    {workshop.description && (
                      <p className="mt-1 text-sm text-[#6f6f72]">
                        {workshop.description}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-5 text-xs text-[#667085]">
                      <span className="flex items-center gap-2">
                        <FaCalendarAlt className="text-[#98A2B3]" />
                        {formatWhen(workshop.startsAt)}
                      </span>

                      {workshop.facilitator && (
                        <span className="flex items-center gap-2">
                          <FaChalkboardTeacher className="text-[#98A2B3]" />
                          {workshop.facilitator}
                        </span>
                      )}

                      {workshop.venue && (
                        <span className="flex items-center gap-2">
                          <FaMapMarkerAlt className="text-[#98A2B3]" />
                          {workshop.venue}
                        </span>
                      )}
                    </div>

                    {workshop.objectives && (
                      <p className="mt-3 whitespace-pre-line rounded-xl bg-[#F9FAFB] p-3 text-xs leading-6 text-[#475467]">
                        {workshop.objectives}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 gap-3">
                    <div className="min-w-[120px] rounded-2xl bg-[#F9FAFB] p-4">
                      <p className="text-xs text-[#98A2B3]">Attended</p>
                      <p className="mt-1 text-lg font-bold text-slate-950">
                        {workshop.attendance.present}/
                        {workshop.attendance.expected}
                      </p>
                    </div>

                    <div className="min-w-[120px] rounded-2xl bg-[#F9FAFB] p-4">
                      <p className="text-xs text-[#98A2B3]">Rate</p>
                      <p className="mt-1 text-lg font-bold text-slate-950">
                        {workshop.attendance.ratePercent === null
                          ? "—"
                          : `${workshop.attendance.ratePercent}%`}
                      </p>
                    </div>
                  </div>
                </div>

                {workshop.recordings.length > 0 && (
                  <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                    {workshop.recordings.map((recording) => (
                      <div
                        key={recording.uuid}
                        className="flex flex-wrap items-center gap-3 rounded-xl bg-[#F9FAFB] px-4 py-3"
                      >
                        <FaVideo className="text-[#98A2B3]" />

                        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800">
                          {recording.title}
                        </span>

                        {recording.publishedToCourse ? (
                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                            In a module
                          </span>
                        ) : (
                          canManage && (
                            <button
                              type="button"
                              onClick={() => openPublish(recording)}
                              className="rounded-lg bg-[#EEF4FF] px-3 py-1.5 text-xs font-semibold text-[#2563EB] transition hover:bg-[#DCE7FF]"
                            >
                              Add to a module
                            </button>
                          )
                        )}

                        <a
                          href={recording.file || recording.url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[#082d77] transition hover:bg-white"
                        >
                          Watch
                        </a>

                        {canManage && !recording.publishedToCourse && (
                          <button
                            type="button"
                            onClick={() => removeRecording(recording)}
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                          >
                            <FaTrash className="text-xs" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
                  {canManage ? (
                    <>
                      <button
                        type="button"
                        onClick={() => openRegister(workshop)}
                        className="rounded-xl bg-[#ECFDF3] px-4 py-2 text-sm font-semibold text-[#027A48] transition hover:bg-[#D1FADF]"
                      >
                        Take register
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setRecordingForm({
                            workshopUuid: workshop.uuid,
                            title: `${workshop.title} Recording`,
                            url: "",
                            file: null,
                            durationSeconds: "",
                          })
                        }
                        className="rounded-xl bg-[#EEF4FF] px-4 py-2 text-sm font-semibold text-[#2563EB] transition hover:bg-[#DCE7FF]"
                      >
                        Add recording
                      </button>

                      {workshop.meetingLink && (
                        <a
                          href={workshop.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-[#082d77] transition hover:bg-slate-50"
                        >
                          Meeting link{" "}
                          <FaExternalLinkAlt className="text-[10px]" />
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => remove(workshop)}
                        className="rounded-xl bg-[#FEF3F2] px-4 py-2 text-sm font-semibold text-[#B42318] transition hover:bg-[#FEE4E2]"
                      >
                        Delete
                      </button>
                    </>
                  ) : (
                    <>
                      {workshop.myAttendance && (
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            attendanceMeta(workshop.myAttendance.status)
                              .className
                          }`}
                        >
                          {attendanceMeta(workshop.myAttendance.status).label}
                        </span>
                      )}

                      {["online", "hybrid"].includes(workshop.deliveryMode) && (
                        <button
                          type="button"
                          disabled={state !== "open"}
                          onClick={() => join(workshop)}
                          title={
                            state === "early"
                              ? `Opens ${workshop.joinWindowMinutes} minutes before the start`
                              : state === "finished"
                                ? "This workshop has finished"
                                : undefined
                          }
                          className="inline-flex items-center gap-2 rounded-lg bg-[#16a34a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#15803d] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {state === "finished"
                            ? "Workshop finished"
                            : state === "early"
                              ? "Not open yet"
                              : "Join Workshop"}
                        </button>
                      )}

                      {workshop.slides && (
                        <a
                          href={workshop.slides}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-[#082d77] transition hover:bg-slate-50"
                        >
                          View slides
                        </a>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SCHEDULE ------------------------------------------------------- */}
      {form && (
        <Modal title="Schedule Workshop" onClose={() => setForm(null)} wide>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Title">
              <input
                type="text"
                value={form.title}
                onChange={(event) =>
                  setForm({ ...form, title: event.target.value })
                }
                className={inputClass}
              />
            </Field>

            <Field label="Facilitator">
              <input
                type="text"
                value={form.facilitatorName}
                onChange={(event) =>
                  setForm({ ...form, facilitatorName: event.target.value })
                }
                className={inputClass}
              />
            </Field>

            <Field label="Starts">
              <input
                type="datetime-local"
                value={form.startsAt}
                onChange={(event) =>
                  setForm({ ...form, startsAt: event.target.value })
                }
                className={inputClass}
              />
            </Field>

            <Field label="Ends">
              <input
                type="datetime-local"
                value={form.endsAt}
                onChange={(event) =>
                  setForm({ ...form, endsAt: event.target.value })
                }
                className={inputClass}
              />
            </Field>

            <Field label="Delivery mode">
              <select
                value={form.deliveryMode}
                onChange={(event) =>
                  setForm({ ...form, deliveryMode: event.target.value })
                }
                className={inputClass}
              >
                {DELIVERY_MODES.map((mode) => (
                  <option key={mode.value} value={mode.value}>
                    {mode.label}
                  </option>
                ))}
              </select>
            </Field>

            {["physical", "hybrid"].includes(form.deliveryMode) && (
              <Field label="Venue">
                <input
                  type="text"
                  value={form.venue}
                  onChange={(event) =>
                    setForm({ ...form, venue: event.target.value })
                  }
                  className={inputClass}
                />
              </Field>
            )}

            {["online", "hybrid"].includes(form.deliveryMode) && (
              <Field label="Meeting link">
                <input
                  type="url"
                  value={form.meetingLink}
                  onChange={(event) =>
                    setForm({ ...form, meetingLink: event.target.value })
                  }
                  placeholder="https://meet.google.com/..."
                  className={inputClass}
                />
              </Field>
            )}

            <Field label="Join opens (minutes before)">
              <input
                type="number"
                value={form.joinWindowMinutes}
                onChange={(event) =>
                  setForm({ ...form, joinWindowMinutes: event.target.value })
                }
                className={inputClass}
              />
            </Field>

            <Field label="Attendance threshold %">
              <input
                type="number"
                value={form.attendanceThresholdPercent}
                onChange={(event) =>
                  setForm({
                    ...form,
                    attendanceThresholdPercent: event.target.value,
                  })
                }
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Description">
            <textarea
              rows={2}
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
              className={inputClass}
            />
          </Field>

          <Field label="Learning objectives">
            <textarea
              rows={3}
              value={form.objectives}
              onChange={(event) =>
                setForm({ ...form, objectives: event.target.value })
              }
              className={inputClass}
            />
          </Field>

          <label className="mb-4 flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.attendanceRequired}
              onChange={(event) =>
                setForm({ ...form, attendanceRequired: event.target.checked })
              }
            />
            Attending this is required to complete the course
          </label>

          <button
            type="button"
            disabled={saving}
            onClick={save}
            className="w-full rounded-lg bg-[#16a34a] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#15803d] disabled:opacity-60"
          >
            {saving ? "Saving..." : "Schedule workshop"}
          </button>
        </Modal>
      )}

      {/* REGISTER ------------------------------------------------------- */}
      {register && (
        <Modal
          title={`Register · ${register.workshop.title}`}
          onClose={() => setRegister(null)}
          wide
        >
          <p className="mb-4 text-sm text-[#667085]">
            {register.scheduledMinutes
              ? `Scheduled for ${register.scheduledMinutes} minutes. Leave the status blank and enter minutes to have it worked out at the ${register.workshop.attendanceThresholdPercent}% threshold.`
              : "This workshop has no end time, so enter each status directly."}
          </p>

          <div className="max-h-[50vh] overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-bold text-slate-500">
                  <th className="py-3">Startup</th>
                  <th className="py-3">Minutes</th>
                  <th className="py-3">Status</th>
                  <th className="py-3">Note</th>
                </tr>
              </thead>

              <tbody>
                {register.rows.map((row, index) => (
                  <tr
                    key={row.businessUuid}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="py-3 pr-3 font-semibold text-slate-900">
                      {row.name}
                    </td>

                    <td className="py-3 pr-3">
                      <input
                        type="number"
                        value={row.minutes ?? ""}
                        onChange={(event) => {
                          const rows = [...register.rows];
                          rows[index] = {
                            ...row,
                            minutes: event.target.value,
                          };
                          setRegister({ ...register, rows });
                        }}
                        className="w-24 rounded-lg border border-black/10 px-3 py-1.5 text-sm outline-none focus:border-green-600"
                      />
                    </td>

                    <td className="py-3 pr-3">
                      <select
                        value={row.status || ""}
                        onChange={(event) => {
                          const rows = [...register.rows];
                          rows[index] = {
                            ...row,
                            status: event.target.value || null,
                          };
                          setRegister({ ...register, rows });
                        }}
                        className="rounded-lg border border-black/10 px-3 py-1.5 text-sm outline-none focus:border-green-600"
                      >
                        <option value="">Work it out</option>
                        {ATTENDANCE_STATUSES.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="py-3">
                      <input
                        type="text"
                        value={row.notes || ""}
                        onChange={(event) => {
                          const rows = [...register.rows];
                          rows[index] = { ...row, notes: event.target.value };
                          setRegister({ ...register, rows });
                        }}
                        className="w-full rounded-lg border border-black/10 px-3 py-1.5 text-sm outline-none focus:border-green-600"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={saveRegister}
            className="mt-5 w-full rounded-lg bg-[#16a34a] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#15803d] disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save register"}
          </button>
        </Modal>
      )}

      {/* RECORDING ------------------------------------------------------ */}
      {recordingForm && (
        <Modal title="Add Recording" onClose={() => setRecordingForm(null)}>
          <Field label="Title">
            <input
              type="text"
              value={recordingForm.title}
              onChange={(event) =>
                setRecordingForm({
                  ...recordingForm,
                  title: event.target.value,
                })
              }
              className={inputClass}
            />
          </Field>

          <Field label="Recording link">
            <input
              type="url"
              value={recordingForm.url}
              onChange={(event) =>
                setRecordingForm({ ...recordingForm, url: event.target.value })
              }
              placeholder="https://"
              className={inputClass}
            />
          </Field>

          <Field label="or upload the file">
            <input
              type="file"
              accept="video/*"
              onChange={(event) =>
                setRecordingForm({
                  ...recordingForm,
                  file: event.target.files[0],
                })
              }
              className={inputClass}
            />
          </Field>

          <Field label="Duration in seconds">
            <input
              type="number"
              value={recordingForm.durationSeconds}
              onChange={(event) =>
                setRecordingForm({
                  ...recordingForm,
                  durationSeconds: event.target.value,
                })
              }
              className={inputClass}
            />
          </Field>

          <button
            type="button"
            disabled={saving}
            onClick={saveRecording}
            className="w-full rounded-lg bg-[#16a34a] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#15803d] disabled:opacity-60"
          >
            {saving ? "Saving..." : "Add recording"}
          </button>
        </Modal>
      )}

      {/* PUBLISH -------------------------------------------------------- */}
      {publishForm && (
        <Modal
          title="Add recording to a module"
          onClose={() => setPublishForm(null)}
        >
          <p className="mb-4 text-sm text-[#667085]">
            The lesson will point at this same recording — the file is not
            uploaded again.
          </p>

          <Field label="Module">
            <select
              value={publishForm.moduleUuid}
              onChange={(event) =>
                setPublishForm({
                  ...publishForm,
                  moduleUuid: event.target.value,
                })
              }
              className={inputClass}
            >
              {modules.map((module) => (
                <option key={module.uuid} value={module.uuid}>
                  {module.title}
                </option>
              ))}
            </select>
          </Field>

          <button
            type="button"
            disabled={saving}
            onClick={publish}
            className="w-full rounded-lg bg-[#16a34a] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#15803d] disabled:opacity-60"
          >
            {saving ? "Publishing..." : "Add to module"}
          </button>
        </Modal>
      )}
    </>
  );
};

export default WorkshopsPanel;
