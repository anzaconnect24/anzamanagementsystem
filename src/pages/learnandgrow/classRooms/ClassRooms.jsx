"use client";

import { useContext, useEffect, useMemo, useState } from "react";
import Link from "@/utils/link";
import Image from "@/utils/image";
import Loader from "@/components/common/Loader";
import CourseCard from "@/components/learning/CourseCard";
import toast from "react-hot-toast";
import { useTranslation } from "@/locales";
import { UserContext } from "../../../layouts/DashboardLayout";
import { getCourses } from "@/controllers/course_controller";
import { getCohortProgramOptions } from "@/controllers/cohort_controller";
import {
  FaCheckCircle,
  FaChevronRight,
  FaClock,
  FaFilter,
  FaGraduationCap,
  FaLayerGroup,
  FaPlayCircle,
  FaRegClock,
  FaSearch,
  FaStar,
  FaUsers,
} from "react-icons/fa";

const FALLBACK_IMAGE = "/images/ideation-classes.svg";

const TABS = [
  { value: "all", label: "All Courses" },
  { value: "mine", label: "My Courses" },
];

// The funnel next to the tabs narrows the grid by where the learner stands
// with each course.
const PROGRESS_FILTERS = [
  { value: "all", label: "All" },
  { value: "not-started", label: "Not started" },
  { value: "in-progress", label: "In progress" },
  { value: "completed", label: "Completed" },
];

// Class Rooms lists the courses of a programme. A startup enrols in a course
// and then works through its modules, workshops and resources.
const ClassRooms = () => {
  const { userDetails } = useContext(UserContext);
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [program, setProgram] = useState(null);
  const [programs, setPrograms] = useState([]);

  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [progressFilter, setProgressFilter] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);

  const canAuthor = ["Admin", "BDA"].includes(userDetails?.role);

  const load = (programUuid) => {
    setLoading(true);
    getCourses(programUuid)
      .then((body) => {
        setCourses(Array.isArray(body?.data) ? body.data : []);
        if (body?.program) setProgram(body.program);
      })
      .catch(() => {
        toast.error("Failed to load courses");
        setCourses([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // Staff see every module here, so they pick which programme they mean; a
    // learner has exactly one, which the API resolves from "mine".
    if (canAuthor) {
      getCohortProgramOptions().then((options) => {
        setPrograms(options);

        if (options.length) {
          setProgram(options[0]);
          load(options[0].uuid);
        } else {
          setLoading(false);
        }
      });
    } else {
      load("mine");
    }
  }, [canAuthor]);

  // What the grid actually shows: the tab, the funnel and the search box all
  // narrow the same list.
  const visibleCourses = useMemo(() => {
    const term = search.trim().toLowerCase();

    return courses.filter((course) => {
      const enrolled = !!course.myEnrollment;
      const percent = course.myEnrollment?.progressPercent || 0;

      if (tab === "mine" && !enrolled) return false;

      if (progressFilter === "not-started" && enrolled && percent > 0)
        return false;
      if (progressFilter === "in-progress" && !(percent > 0 && percent < 100))
        return false;
      if (progressFilter === "completed" && percent < 100) return false;

      if (!term) return true;

      return `${course.title} ${course.description || ""}`
        .toLowerCase()
        .includes(term);
    });
  }, [courses, tab, progressFilter, search]);

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen px-6 py-4">
      {/* HERO */}
      <div className="relative mb-10 min-h-[200px] overflow-hidden rounded-2xl bg-black shadow-sm">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('${program?.image || "/images/mentor_hero.svg"}')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-[#c9672b]/30" />

        <div className="relative z-10 max-w-3xl p-10 text-white">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-sm font-medium shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#f08a3c]" />
            {t("navigation.classRooms", "Courses")}
          </span>

          <h2 className="mb-3 text-4xl font-bold leading-tight drop-shadow-lg">
            {t(
              "learnAndGrow.recommendedCourses",
              "Recommended Courses for You",
            )}
          </h2>

          <p className="mb-4 max-w-2xl text-sm leading-6 text-white/85 drop-shadow-md">
            {t(
              "learnAndGrow.recommendedCoursesIntro",
              "Explore courses recommended for you based on your selected program and discover learning options that support your academic journey.",
            )}
          </p>

          <div className="flex flex-wrap items-center gap-6 text-sm text-white/85">
            <span className="flex items-center gap-2">
              <FaLayerGroup />
              {courses.length} {courses.length === 1 ? "course" : "courses"}
            </span>

            <span className="flex items-center gap-2">
              <FaGraduationCap />
              Guided Learning
            </span>

            <span className="flex items-center gap-2">
              <FaClock />
              Flexible Learning
            </span>
          </div>
        </div>
      </div>

      {/* AVAILABLE COURSES */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-[#111a2e]">
            {t("learnAndGrow.availableCourses", "Available Courses")}
          </h2>

          <p className="mt-1 text-sm text-[#6f7787]">
            {canAuthor && program
              ? `Courses in ${program.title}.`
              : t(
                  "learnAndGrow.availableCoursesIntro",
                  "Upgrade your skills and grow your business with Somo Academy.",
                )}
          </p>
        </div>

        <div className="relative w-full max-w-sm">
          <FaSearch className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-[#98A2B3]" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("learnAndGrow.searchCourses", "Search courses...")}
            className="w-full rounded-[5px] border border-black/10 bg-white py-3.5 pl-12 pr-5 text-sm text-[#111a2e] shadow-sm outline-none placeholder:text-[#98A2B3] focus:border-[#16a34a]"
          />
        </div>
      </div>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="inline-flex items-center gap-1 rounded-full bg-[#f1f2f4] p-1">
          {TABS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setTab(item.value)}
              className={`rounded-full px-7 py-2.5 text-sm font-semibold transition ${
                tab === item.value
                  ? "bg-white text-[#16a34a] shadow-sm"
                  : "text-[#6f7787] hover:text-[#111a2e]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {canAuthor && programs.length > 0 && (
            <select
              value={program?.uuid || ""}
              onChange={(event) => {
                const next = programs.find(
                  (item) => item.uuid === event.target.value,
                );
                setProgram(next || null);
                if (next) load(next.uuid);
              }}
              className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-[#111a2e] shadow-sm outline-none focus:border-[#16a34a]"
            >
              {programs.map((item) => (
                <option key={item.uuid} value={item.uuid}>
                  {item.title}
                </option>
              ))}
            </select>
          )}

          <div className="relative">
            <button
              type="button"
              onClick={() => setFilterOpen((open) => !open)}
              aria-label="Filter courses"
              className={`flex h-12 w-12 items-center justify-center rounded-2xl border bg-white shadow-sm transition ${
                progressFilter === "all"
                  ? "border-black/10 text-[#111a2e]"
                  : "border-[#16a34a] text-[#16a34a]"
              }`}
            >
              <FaFilter />
            </button>

            {filterOpen && (
              <>
                {/* Clicking anywhere else closes the panel. */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setFilterOpen(false)}
                />

                <div className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-2xl border border-black/10 bg-white p-1 shadow-lg">
                  {PROGRESS_FILTERS.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => {
                        setProgressFilter(item.value);
                        setFilterOpen(false);
                      }}
                      className={`block w-full rounded-xl px-4 py-2.5 text-left text-sm font-medium transition ${
                        progressFilter === item.value
                          ? "bg-[#f0fdf4] text-[#16a34a]"
                          : "text-[#475467] hover:bg-slate-50"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {visibleCourses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <FaGraduationCap className="mx-auto mb-3 text-3xl text-slate-300" />
          <p className="text-sm text-slate-500">
            {courses.length === 0
              ? canAuthor
                ? "This program has no courses yet. Add them from Program Management."
                : "No classes have been scheduled for the program in which you were enrolled."
              : "No courses match your search."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visibleCourses.map((course) => (
            <CourseCard key={course.uuid} course={course} program={program} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ClassRooms;
