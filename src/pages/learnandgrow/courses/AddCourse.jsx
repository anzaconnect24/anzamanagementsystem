"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FaCheck, FaChevronDown } from "react-icons/fa";
import { createCourse } from "@/controllers/course_controller";
import { getCohortProgramOptions } from "@/controllers/cohort_controller";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-[#111a2e] outline-none focus:border-[#082d77] focus:ring-2 focus:ring-[#082d77]/20";

const labelClass = "mb-1.5 block text-sm font-semibold text-[#344054]";

const emptyForm = {
  title: "",
  description: "",
  estimatedHours: "",
  status: "draft",
  programUuids: [],
};

// Write a course once and choose which programmes it appears on. The first
// programme picked is its home - the one that owns it - and the rest are
// shared access, which is how the API stores the relationship.
const AddCourse = () => {
  const navigate = useNavigate();

  const [programs, setPrograms] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [programsOpen, setProgramsOpen] = useState(false);

  useEffect(() => {
    getCohortProgramOptions()
      .then((options) => setPrograms(Array.isArray(options) ? options : []))
      .catch(() => setPrograms([]));
  }, []);

  const toggleProgram = (uuid) => {
    setForm((prev) => ({
      ...prev,
      programUuids: prev.programUuids.includes(uuid)
        ? prev.programUuids.filter((item) => item !== uuid)
        : [...prev.programUuids, uuid],
    }));
  };

  const onSave = async (event) => {
    event.preventDefault();

    if (!form.title.trim()) {
      toast.error("A course title is required");
      return;
    }

    // The course has to live somewhere: the first programme picked owns it.
    if (!form.programUuids.length) {
      toast.error("Choose at least one program for this course");
      return;
    }

    setSaving(true);

    const [home] = form.programUuids;

    const response = await createCourse(home, {
      title: form.title.trim(),
      description: form.description.trim(),
      estimatedHours: form.estimatedHours ? Number(form.estimatedHours) : null,
      status: form.status,
      // Every programme picked, home included — the API drops the home one so
      // it is not stored twice.
      programUuids: form.programUuids,
    });

    setSaving(false);

    if (response?.status === false) {
      toast.error(response.message || "Failed to create the course");
      return;
    }

    toast.success("Course created");
    navigate("/dashboard/courses/library");
  };

  return (
    <div className="min-h-screen px-6 py-4">
      {/* HERO */}
      <div className="relative mb-10 min-h-[200px] overflow-hidden rounded-2xl bg-black shadow-sm">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/mentor_hero.svg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-[#c9672b]/30" />

        <div className="relative z-10 max-w-3xl p-10 text-white">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-sm font-medium shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#f08a3c]" />
            New Course
          </span>

          <h1 className="mb-3 text-4xl font-bold leading-tight drop-shadow-lg">
            Add a course
          </h1>

          <p className="max-w-2xl text-sm leading-6 text-white/85 drop-shadow-md">
            Give the course a title and choose the programs it appears on. You
            can add its modules once it is created.
          </p>
        </div>
      </div>

      <form
        onSubmit={onSave}
        className="rounded-2xl bg-white p-6 shadow-sm shadow-slate-200/50"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="course-title">
              Title
            </label>
            <input
              id="course-title"
              className={inputClass}
              value={form.title}
              onChange={(event) =>
                setForm({ ...form, title: event.target.value })
              }
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="course-hours">
              Estimated hours
            </label>
            <input
              id="course-hours"
              type="number"
              min="0"
              className={inputClass}
              value={form.estimatedHours}
              onChange={(event) =>
                setForm({ ...form, estimatedHours: event.target.value })
              }
            />
          </div>

          <div className="md:col-span-2">
            <label className={labelClass} htmlFor="course-description">
              Description
            </label>
            <textarea
              id="course-description"
              rows={3}
              className={inputClass}
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="course-status">
              Status
            </label>
            <select
              id="course-status"
              className={inputClass}
              value={form.status}
              onChange={(event) =>
                setForm({ ...form, status: event.target.value })
              }
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
            <p className="mt-1.5 text-xs text-[#8a8f98]">
              A draft is visible to staff only. Publishing announces it to the
              startups on every program selected.
            </p>
          </div>

          {/* PROGRAM VISIBILITY */}
          <div>
            <p className={labelClass}>Visible to these programs</p>

            {programs.length === 0 ? (
              <p className="text-sm text-[#8a8f98]">No programs available yet.</p>
            ) : (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProgramsOpen((open) => !open)}
                  aria-expanded={programsOpen}
                  className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-300 px-4 py-2.5 text-left text-sm text-[#111a2e] transition hover:border-[#082d77]"
                >
                  <span
                    className={form.programUuids.length ? "" : "text-[#98A2B3]"}
                  >
                    {form.programUuids.length === 0
                      ? "Select programs..."
                      : `${form.programUuids.length} program${
                          form.programUuids.length === 1 ? "" : "s"
                        } selected`}
                  </span>
                  <FaChevronDown className="shrink-0 text-xs text-[#98A2B3]" />
                </button>

                {programsOpen && (
                  <>
                    {/* Clicking anywhere else closes the panel. */}
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setProgramsOpen(false)}
                    />

                    <div className="absolute left-0 z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-black/10 bg-white p-1 shadow-lg">
                      {programs.map((program) => {
                        const picked = form.programUuids.includes(program.uuid);
                        const isHome = form.programUuids[0] === program.uuid;

                        return (
                          <button
                            key={program.uuid}
                            type="button"
                            onClick={() => toggleProgram(program.uuid)}
                            aria-pressed={picked}
                            className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm font-medium transition ${
                              picked
                                ? "bg-[#f0fdf4] text-[#16a34a]"
                                : "text-[#475467] hover:bg-slate-50"
                            }`}
                          >
                            <span
                              className={`grid h-4 w-4 shrink-0 place-items-center rounded border text-[10px] text-white ${
                                picked
                                  ? "border-[#16a34a] bg-[#16a34a]"
                                  : "border-slate-300"
                              }`}
                            >
                              {picked ? <FaCheck /> : null}
                            </span>

                            <span className="min-w-0 flex-1 truncate">
                              {program.title}
                            </span>

                            {isHome ? (
                              <span className="shrink-0 rounded-md bg-[#16a34a]/10 px-2 py-0.5 text-xs font-bold text-[#16a34a]">
                                Home
                              </span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}

            <p className="mt-2 text-xs text-[#8a8f98]">
              The first program picked owns the course; the rest get access to
              it. Startups on any of them will see it in their course list.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[#082d77] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#061f54] disabled:opacity-60"
          >
            {saving ? "Creating..." : "Create course"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/dashboard/courses/library")}
            className="rounded-lg bg-slate-100 px-6 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddCourse;
