"use client";

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FaClock,
  FaGraduationCap,
  FaLayerGroup,
  FaPlus,
  FaSearch,
  FaTrash,
} from "react-icons/fa";
import Loader from "@/components/common/Loader";
import CourseCard from "@/components/learning/CourseCard";
import {
  archiveCourse,
  deleteCourse,
  getAllCourses,
} from "@/controllers/course_controller";
import { getCohortProgramOptions } from "@/controllers/cohort_controller";

// Every course on the platform and the programmes each one reaches. Writing a
// course is its own page (AddCourse), so this stays a library rather than a
// form with a list underneath it.
const CourseLibrary = () => {
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");

  // The course awaiting confirmation; null closes the dialog.
  const [confirming, setConfirming] = useState(null);
  const [removing, setRemoving] = useState(false);

  const load = () =>
    getAllCourses()
      .then((body) => setCourses(Array.isArray(body?.data) ? body.data : []))
      .catch(() => {
        toast.error("Failed to load the course library");
        setCourses([]);
      })
      .finally(() => setLoading(false));

  useEffect(() => {
    load();

    getCohortProgramOptions()
      .then((options) => setPrograms(Array.isArray(options) ? options : []))
      .catch(() => setPrograms([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Archiving keeps the content and every learner’s progress; deleting
  // destroys both. The dialog offers each one by name rather than hiding
  // the difference behind a single "remove".
  const run = async (action, message) => {
    setRemoving(true);
    const response = await action(confirming.uuid);
    setRemoving(false);

    if (response?.status === false) {
      toast.error(response.message || "That did not work");
      return;
    }

    toast.success(message);
    setConfirming(null);
    load();
  };

  const visible = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return courses;

    return courses.filter((course) =>
      [
        course.title,
        course.description,
        ...(course.programs || []).map((program) => program.title),
      ]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(q)),
    );
  }, [courses, keyword]);

  if (loading) return <Loader />;

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
            Course Library
          </span>

          <h1 className="mb-3 text-4xl font-bold leading-tight drop-shadow-lg">
            Create a course once, offer it to many
          </h1>

          <p className="mb-4 max-w-2xl text-sm leading-6 text-white/85 drop-shadow-md">
            Every course on the platform, and the programs each one appears on.
            Startups on any of those programs see it in their own course list.
          </p>

          <div className="flex flex-wrap items-center gap-6 text-sm text-white/85">
            <span className="flex items-center gap-2">
              <FaLayerGroup />
              {courses.length} {courses.length === 1 ? "course" : "courses"}
            </span>

            <span className="flex items-center gap-2">
              <FaGraduationCap />
              {programs.length} {programs.length === 1 ? "program" : "programs"}
            </span>

            <span className="flex items-center gap-2">
              <FaClock />
              Shared across cohorts
            </span>
          </div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-[#111a2e]">
            Available courses
          </h2>
          <p className="mt-1 text-sm text-[#8a8f98]">
            Every course on the platform and the programs it is visible to.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#98A2B3]" />
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Search courses..."
              className="w-64 rounded-lg border border-slate-300 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-[#082d77]"
            />
          </div>

          <button
            type="button"
            onClick={() => navigate("/dashboard/courses/library/new")}
            className="inline-flex items-center gap-2 rounded-lg bg-[#16a34a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#15803d]"
          >
            <FaPlus />
            Add Course
          </button>
        </div>
      </div>

      {/* LIBRARY */}
      {visible.length === 0 ? (
        <div className="mx-auto max-w-3xl rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          {courses.length === 0
            ? "No course has been created yet."
            : "No course matches your search."}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((course) => (
            // The card is one big link, so the remove control sits beside it
            // rather than inside it — a button within a link is invalid markup.
            <div key={course.uuid} className="relative">
              <CourseCard course={course} program={course.home} />

              <button
                type="button"
                onClick={() => setConfirming(course)}
                aria-label={`Remove ${course.title}`}
                title="Remove this course"
                className="absolute right-4 top-[13.5rem] z-10 grid h-9 w-9 place-items-center rounded-full bg-white text-sm text-rose-600 shadow-md transition hover:bg-rose-50"
              >
                <FaTrash />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* CONFIRM */}
      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-xl font-black tracking-tight text-slate-950">
              Remove {confirming.title}?
            </h3>

            <p className="mt-3 text-sm leading-6 text-[#667085]">
              <b className="text-slate-900">Archive</b> hides the course from
              every program it is on, and keeps its modules, content and each
              startup’s progress. It can be brought back.
            </p>

            <p className="mt-2 text-sm leading-6 text-[#667085]">
              <b className="text-rose-700">Delete</b> destroys the course and
              everything under it — modules, content, workshops, recordings,
              resources, enrolments and every learner’s progress. This cannot
              be undone.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirming(null)}
                disabled={removing}
                className="rounded-lg bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-200 disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => run(archiveCourse, "Course archived")}
                disabled={removing}
                className="rounded-lg bg-[#082d77] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#061f54] disabled:opacity-60"
              >
                Archive
              </button>

              <button
                type="button"
                onClick={() => run(deleteCourse, "Course deleted")}
                disabled={removing}
                className="rounded-lg bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
              >
                {removing ? "Working..." : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseLibrary;
