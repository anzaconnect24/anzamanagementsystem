"use client";

import Link from "@/utils/link";
import Image from "@/utils/image";
import {
  FaCheckCircle,
  FaChevronRight,
  FaPlayCircle,
  FaRegClock,
  FaStar,
  FaUsers,
} from "react-icons/fa";

const FALLBACK_IMAGE = "/images/ideation-classes.svg";

// One course, as a card: cover image with its category, rating and enrolment
// state, then the title, summary, a meta row, and progress for a course the
// startup is on.
//
// The whole card is the link, and it opens the course page rather than the
// player — what the course covers, its modules, and the button to enrol.
// Learning starts from there, so every entry point reaches a course the same
// way round.
//
// Lifted out of ClassRooms so Program Learning shows the same card instead of
// a second, drifting copy.
const CourseCard = ({ course, program, href }) => {
  const enrolled = !!course.myEnrollment;

  // Older API responses carry no lesson count, so the card falls back to
  // modules rather than showing a bare zero.
  const lessons = course.lessons ?? course.modules ?? 0;

  return (
    <Link
      href={href || `/dashboard/courses/${course.uuid}`}
      className="flex cursor-pointer flex-col overflow-hidden rounded-3xl bg-white shadow-[0_6px_24px_rgba(16,24,40,0.07)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(16,24,40,0.12)]"
    >
      <div className="relative h-52 shrink-0 overflow-hidden bg-slate-100">
        <Image
          className="h-full w-full object-cover"
          src={course.image || program?.image || FALLBACK_IMAGE}
          alt={course.title}
          fill
        />

        <span className="absolute left-4 top-4 rounded-full bg-[#16a34a] px-3.5 py-1 text-xs font-semibold capitalize text-white shadow-sm">
          {course.category || program?.category || "Course"}
        </span>

        <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-[#111a2e] shadow-sm">
          <FaStar className="text-[#16a34a]" />
          {course.rating || 0}
        </span>

        {enrolled && (
          <span className="absolute bottom-4 left-4 inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-green-700 shadow-sm">
            <FaCheckCircle /> Enrolled
          </span>
        )}

        {!enrolled && course.status !== "published" && (
          <span className="absolute bottom-4 left-4 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold capitalize text-amber-700 shadow-sm">
            {course.status}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3
          className={`mb-2 line-clamp-2 text-lg font-bold ${
            enrolled ? "text-[#16a34a]" : "text-[#111a2e]"
          }`}
        >
          {course.title}
        </h3>

        <p className="mb-5 line-clamp-2 flex-1 text-sm leading-6 text-[#6f7787]">
          {course.description || "No description provided."}
        </p>

        <div className="mb-5 flex items-center gap-4 text-xs text-[#98A2B3]">
          <span className="flex items-center gap-1.5">
            <FaRegClock />
            {course.estimatedHours ? `${course.estimatedHours} hrs` : "Self-paced"}
          </span>

          <span className="flex items-center gap-1.5">
            <FaPlayCircle /> {lessons} {lessons === 1 ? "Lesson" : "Lessons"}
          </span>

          <span className="ml-auto flex items-center gap-1.5">
            <FaUsers /> {course.enrolled || 0}
          </span>
        </div>

        {enrolled && (
          <div className="mb-5">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[#16a34a]"
                style={{ width: `${course.myEnrollment.progressPercent}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-[#98A2B3]">
              {course.myEnrollment.progressPercent}% complete
            </p>
          </div>
        )}

        {/* The whole card is the link, so this is styled as a button rather
            than being one — a link inside a link is invalid markup. */}
        <span className="mx-auto mt-auto inline-flex w-[90%] items-center justify-center gap-2 rounded-[5px] bg-[#16a34a] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#15803d]">
          {enrolled ? "Continue Course" : "Course Details"}
          <FaChevronRight className="text-[10px]" />
        </span>
      </div>
    </Link>
  );
};

export default CourseCard;
