"use client";

import { useContext, useEffect, useState } from "react";
import Link from "@/utils/link";
import Image from "@/utils/image";
import Loader from "@/components/common/Loader";
import toast from "react-hot-toast";
import { useTranslation } from "@/locales";
import { UserContext } from "../../../layouts/DashboardLayout";
import { getCourses } from "@/controllers/course_controller";
import { getCohortProgramOptions } from "@/controllers/cohort_controller";
import {
  FaArrowRight,
  FaBookOpen,
  FaChalkboardTeacher,
  FaCheckCircle,
  FaClock,
  FaFolderOpen,
  FaGraduationCap,
  FaLayerGroup,
} from "react-icons/fa";

const FALLBACK_IMAGE = "/images/ideation-classes.svg";

// Class Rooms lists the courses of a programme. A startup enrols in a course
// and then works through its modules, workshops and resources.
const ClassRooms = () => {
  const { userDetails } = useContext(UserContext);
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [program, setProgram] = useState(null);
  const [programs, setPrograms] = useState([]);

  // "Staff" is stored as either "Staff" or "Reviewer" (see SignUp).
  const canAuthor = ["Admin", "Staff", "Reviewer"].includes(userDetails?.role);

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
            {t("navigation.classRooms", "Class Rooms")}
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

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#172033]">
            {t("learnAndGrow.availableCourses", "Available Courses")}
            {canAuthor && program && (
              <span className="ml-2 text-base font-medium text-[#98A2B3]">
                in {program.title}
              </span>
            )}
          </h2>
        </div>

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
            className="rounded-lg border border-black/10 bg-white px-4 py-2 text-sm font-semibold outline-none focus:border-green-600"
          >
            {programs.map((item) => (
              <option key={item.uuid} value={item.uuid}>
                {item.title}
              </option>
            ))}
          </select>
        )}
      </div>

      {courses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <FaGraduationCap className="mx-auto mb-3 text-3xl text-slate-300" />
          <p className="text-sm text-slate-500">
            {canAuthor
              ? "This program has no courses yet. Add them from Program Management."
              : "No classes have been scheduled for the program in which you were enrolled."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => {
            const enrolled = !!course.myEnrollment;

            return (
              // Every card opens the course page first — what the course
              // covers, its modules, and the button to enrol. Learning starts
              // from there, not from here.
              <Link
                key={course.uuid}
                href={`/dashboard/courses/${course.uuid}`}
                className="flex min-h-[380px] cursor-pointer flex-col overflow-hidden rounded-xl bg-white shadow-md transition duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="relative h-44 shrink-0 overflow-hidden bg-black">
                  <Image
                    className="h-full w-full object-cover"
                    src={course.image || program?.image || FALLBACK_IMAGE}
                    alt={course.title}
                    fill
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                  {enrolled && (
                    <span className="absolute bottom-4 left-4 inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 shadow-sm">
                      <FaCheckCircle /> Enrolled
                    </span>
                  )}

                  {!enrolled && course.status !== "published" && (
                    <span className="absolute bottom-4 left-4 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold capitalize text-amber-700 shadow-sm">
                      {course.status}
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <h3 className="mb-2 line-clamp-2 text-lg font-bold text-[#111827]">
                    {course.title}
                  </h3>

                  <p className="mb-4 line-clamp-2 flex-1 text-sm leading-6 text-[#6f6f72]">
                    {course.description || "No description provided."}
                  </p>

                  <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-[#8a8f98]">
                    <span className="flex items-center gap-1">
                      <FaBookOpen /> {course.modules}{" "}
                      {course.modules === 1 ? "module" : "modules"}
                    </span>
                    <span className="flex items-center gap-1">
                      <FaChalkboardTeacher /> {course.workshops}
                    </span>
                    <span className="flex items-center gap-1">
                      <FaFolderOpen /> {course.resources}
                    </span>
                  </div>

                  {enrolled && (
                    <div className="mb-4">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-[#16a34a]"
                          style={{
                            width: `${course.myEnrollment.progressPercent}%`,
                          }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-[#98A2B3]">
                        {course.myEnrollment.progressPercent}% complete
                      </p>
                    </div>
                  )}

                  <div className="mt-auto border-t border-black/10 pt-4">
                    {/* The whole card is the link, so this is styled as a
                        button rather than being one — a link inside a link is
                        invalid markup. */}
                    <span className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#16a34a] px-4 py-2.5 text-sm font-semibold text-white">
                      {enrolled ? "Continue" : "View course"}{" "}
                      <FaArrowRight className="text-xs" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ClassRooms;
