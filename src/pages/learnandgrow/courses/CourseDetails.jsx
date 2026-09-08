"use client";

import { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FaArrowLeft,
  FaArrowRight,
  FaBookOpen,
  FaChalkboardTeacher,
  FaCheckCircle,
  FaClock,
  FaFolderOpen,
  FaLock,
  FaPlayCircle,
  FaRegFileAlt,
  FaUsers,
} from "react-icons/fa";
import Loader from "@/components/common/Loader";
import { UserContext } from "../../../layouts/DashboardLayout";
import { getCourse, enrollInCourse } from "@/controllers/course_controller";

const FALLBACK_IMAGE = "/images/ideation-classes.svg";

const formatDay = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// What a startup sees before committing to a course: what it covers, the
// modules inside it, and the button to enrol. The slides themselves stay
// behind enrolment — this page is the decision, not the content.
const CourseDetails = () => {
  const { courseUuid } = useParams();
  const navigate = useNavigate();
  const { userDetails } = useContext(UserContext);

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [enrolling, setEnrolling] = useState(false);

  const canAuthor = ["Admin", "Staff", "Reviewer"].includes(userDetails?.role);

  const load = () => {
    setLoading(true);
    getCourse(courseUuid)
      .then(setCourse)
      .catch((error) => {
        toast.error(
          error?.response?.status === 403
            ? "This course is not open to you"
            : "Failed to load this course",
        );
        setCourse(null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [courseUuid]);

  const enroll = async () => {
    setEnrolling(true);
    const response = await enrollInCourse(courseUuid);
    setEnrolling(false);

    if (response?.status !== true) {
      toast.error(response?.message || "Could not enroll in this course");
      return;
    }

    toast.success(`You are enrolled in ${course.title}`);
    // Straight into the course — enrolling is the last step before learning.
    navigate(`/dashboard/learn/course/${courseUuid}`);
  };

  if (loading) return <Loader />;

  if (!course) {
    return (
      <div className="min-h-screen px-6 py-6">
        <div className="mx-auto max-w-3xl rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          This course is not available.
        </div>
      </div>
    );
  }

  const enrolled = !!course.myEnrollment;
  const openable = canAuthor || enrolled;
  const starts = formatDay(course.startDate);
  const ends = formatDay(course.endDate);

  const facts = [
    {
      key: "modules",
      icon: FaBookOpen,
      label: course.modules === 1 ? "Module" : "Modules",
      value: course.modules,
    },
    {
      key: "workshops",
      icon: FaChalkboardTeacher,
      label: course.workshops === 1 ? "Workshop" : "Workshops",
      value: course.workshops,
    },
    {
      key: "resources",
      icon: FaFolderOpen,
      label: course.resources === 1 ? "Resource" : "Resources",
      value: course.resources,
    },
    {
      key: "enrolled",
      icon: FaUsers,
      label: "Enrolled",
      value: course.enrolled,
    },
  ];

  return (
    <div className="min-h-screen px-6 py-4">
      <button
        type="button"
        onClick={() => navigate("/dashboard/classRooms")}
        className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-[#082d77] transition hover:text-blue-700"
      >
        <FaArrowLeft className="text-xs" /> All courses
      </button>

      {/* HERO */}
      <div className="relative mb-8 min-h-[240px] overflow-hidden rounded-2xl bg-black shadow-sm">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('${
              course.image || course.program?.image || FALLBACK_IMAGE
            }')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-[#c9672b]/30" />

        <div className="relative z-10 max-w-3xl p-10 text-white">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-sm font-medium shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#f08a3c]" />
            {course.program?.title || "Course"}
          </span>

          <h1 className="mb-3 text-3xl font-bold leading-tight drop-shadow-lg md:text-4xl">
            {course.title}
          </h1>

          {course.description && (
            <p className="mb-4 max-w-2xl text-sm leading-6 text-white/85 drop-shadow-md">
              {course.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-6 text-sm text-white/85">
            {course.estimatedHours ? (
              <span className="flex items-center gap-2">
                <FaClock />
                {course.estimatedHours}h of learning
              </span>
            ) : null}

            {(starts || ends) && (
              <span className="flex items-center gap-2">
                {starts || "—"} &ndash; {ends || "—"}
              </span>
            )}

            {enrolled && (
              <span className="inline-flex items-center gap-2 rounded-full bg-green-500/20 px-3 py-1 font-semibold">
                <FaCheckCircle /> Enrolled ·{" "}
                {course.myEnrollment.progressPercent}% complete
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* WHAT IS IN THE COURSE */}
        <div>
          {course.objectives && (
            <div className="mb-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <h2 className="mb-2 text-lg font-black tracking-tight text-slate-950">
                What you will learn
              </h2>
              <p className="whitespace-pre-line text-sm leading-7 text-[#667085]">
                {course.objectives}
              </p>
            </div>
          )}

          <h2 className="mb-1 text-2xl font-black tracking-tight text-slate-950">
            Modules in this course
          </h2>
          <p className="mb-5 text-sm text-[#8a8f98]">
            {course.modules === 0
              ? "No modules have been added yet."
              : enrolled || canAuthor
                ? "Open the course to work through these."
                : "Enroll to open these modules."}
          </p>

          {course.syllabus?.length > 0 && (
            <div className="space-y-3">
              {course.syllabus.map((module, index) => {
                // A module opens once it is unlocked and the startup is on the
                // course. Locked or not enrolled, the row stays inert rather
                // than leading to a page that would refuse them.
                const canOpen = openable && !module.locked && module.items > 0;

                return (
                <div
                  key={module.uuid}
                  onClick={
                    canOpen
                      ? () => navigate(`/dashboard/slides/${module.uuid}`)
                      : undefined
                  }
                  role={canOpen ? "button" : undefined}
                  tabIndex={canOpen ? 0 : undefined}
                  onKeyDown={
                    canOpen
                      ? (event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            navigate(`/dashboard/slides/${module.uuid}`);
                          }
                        }
                      : undefined
                  }
                  className={`flex items-center gap-4 rounded-2xl border border-[#E4E7EC] bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] ${
                    module.locked ? "opacity-60" : ""
                  } ${
                    canOpen
                      ? "cursor-pointer transition hover:border-[#082d77]/30 hover:shadow-md"
                      : ""
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                      module.complete
                        ? "bg-[#DCFAE6] text-[#079455]"
                        : module.locked
                          ? "bg-[#F2F4F7] text-[#98A2B3]"
                          : "bg-[#F2F4F7] text-[#475467]"
                    }`}
                  >
                    {module.locked ? (
                      <FaLock className="text-xs" />
                    ) : module.complete ? (
                      <FaCheckCircle />
                    ) : (
                      index + 1
                    )}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="min-w-0 truncate text-base font-bold text-slate-900">
                        {module.title}
                      </span>

                      {module.locked && (
                        <span className="shrink-0 rounded-full bg-[#F2F4F7] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#98A2B3]">
                          Locked
                        </span>
                      )}
                    </span>

                    {module.description && (
                      <span className="mt-0.5 line-clamp-1 block text-sm text-[#6f6f72]">
                        {module.description}
                      </span>
                    )}

                    <span className="mt-1 flex flex-wrap items-center gap-4 text-xs text-[#98A2B3]">
                      <span className="flex items-center gap-1">
                        <FaRegFileAlt />
                        {module.items} {module.items === 1 ? "item" : "items"}
                      </span>

                      {module.videos > 0 && (
                        <span className="flex items-center gap-1">
                          <FaPlayCircle />
                          {module.videos}{" "}
                          {module.videos === 1 ? "video" : "videos"}
                        </span>
                      )}

                      {module.minutes && (
                        <span className="flex items-center gap-1">
                          <FaClock />
                          {module.minutes} min
                        </span>
                      )}

                      {/* Progress is only worth showing once there is some. */}
                      {!module.locked &&
                        module.items > 0 &&
                        module.completedItems > 0 && (
                          <span className="flex items-center gap-1 font-semibold text-[#079455]">
                            {module.completedItems}/{module.items} done
                          </span>
                        )}
                    </span>

                    {module.locked && (
                      <span className="mt-1 block text-xs text-[#98A2B3]">
                        Finish{" "}
                        {index > 0
                          ? course.syllabus[index - 1].title
                          : "the previous module"}{" "}
                        to unlock this.
                      </span>
                    )}
                  </span>

                  {canOpen && (
                    <FaArrowRight className="shrink-0 text-xs text-[#98A2B3]" />
                  )}
                </div>
                );
              })}
            </div>
          )}
        </div>

        {/* THE DECISION */}
        <aside>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="mb-5 space-y-4">
              {facts.map((fact) => {
                const Icon = fact.icon;

                return (
                  <p
                    key={fact.key}
                    className="flex items-center gap-3 text-sm text-[#344054]"
                  >
                    <Icon className="shrink-0 text-[#98A2B3]" />
                    <span className="flex-1">{fact.label}</span>
                    <span className="font-bold text-slate-950">
                      {fact.value}
                    </span>
                  </p>
                );
              })}
            </div>

            {enrolled && (
              <div className="mb-5">
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
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

            {openable ? (
              <button
                type="button"
                onClick={() =>
                  navigate(`/dashboard/learn/course/${courseUuid}`)
                }
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#16a34a] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#15803d]"
              >
                {enrolled ? "Continue learning" : "Open course"}{" "}
                <FaArrowRight className="text-xs" />
              </button>
            ) : course.selfEnroll ? (
              <button
                type="button"
                disabled={enrolling || course.modules === 0}
                onClick={enroll}
                title={
                  course.modules === 0
                    ? "This course has no modules yet"
                    : undefined
                }
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#082d77] px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {enrolling ? "Enrolling..." : "Enroll in this course"}
              </button>
            ) : (
              <p className="text-center text-xs text-[#98A2B3]">
                Staff enroll startups on this course.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CourseDetails;
