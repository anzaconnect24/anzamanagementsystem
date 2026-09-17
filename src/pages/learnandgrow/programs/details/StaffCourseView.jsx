"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FaBookOpen,
  FaCheckCircle,
  FaClock,
  FaPlus,
  FaRegStar,
  FaUsers,
} from "react-icons/fa";
import { getModules } from "@/controllers/modules_controller";
import { getQuizzesByModule } from "@/controllers/quiz_controller";
import { getCourseEnrollments } from "@/controllers/enrollment_controller";
import { getCourseRating } from "@/controllers/program_controller";
import Link from "@/utils/link";
import Image from "@/utils/image";

const TABS = [
  { key: "details", label: "Details" },
  { key: "enrollment", label: "Enrollment" },
  { key: "quizzes", label: "Quizzes" },
];

const formatDate = (value) => {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// A course is "Approved" once it has been opened for learners — it has at
// least one module with content. Before that it is still a draft.
const approvalLabel = (lessons, modules) => {
  if (lessons > 0) return "Approved";
  if (modules > 0) return "In review";
  return "Draft";
};

const StaffCourseView = ({ uuid, program }) => {
  const [tab, setTab] = useState("details");

  const [modules, setModules] = useState([]);
  const [modulesLoading, setModulesLoading] = useState(true);

  const [enrollments, setEnrollments] = useState([]);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(true);

  const [rating, setRating] = useState({ average: 0, count: 0 });

  const [quizzes, setQuizzes] = useState(null);
  const [quizzesLoading, setQuizzesLoading] = useState(false);

  useEffect(() => {
    if (!uuid) return;

    setModulesLoading(true);
    getModules({ program_uuid: uuid, page: 1, limit: 100 })
      .then((body) => setModules(Array.isArray(body?.data) ? body.data : []))
      .catch(() => setModules([]))
      .finally(() => setModulesLoading(false));

    setEnrollmentsLoading(true);
    getCourseEnrollments(uuid)
      .then(setEnrollments)
      .finally(() => setEnrollmentsLoading(false));

    getCourseRating(uuid).then(setRating);
  }, [uuid]);

  // Quizzes hang off modules, so they are only worth fetching once the tab is
  // opened and the module list has arrived.
  useEffect(() => {
    if (tab !== "quizzes" || quizzes !== null || modulesLoading) return;

    setQuizzesLoading(true);
    Promise.all(
      modules.map(async (module) => {
        try {
          const response = await getQuizzesByModule(module.uuid);
          return {
            module,
            quizzes: Array.isArray(response?.data) ? response.data : [],
          };
        } catch {
          return { module, quizzes: [] };
        }
      }),
    )
      .then(setQuizzes)
      .finally(() => setQuizzesLoading(false));
  }, [tab, quizzes, modules, modulesLoading]);

  const lessons = useMemo(
    () =>
      modules.reduce(
        (total, module) => total + (module.Slides?.length || 0),
        0,
      ),
    [modules],
  );

  // Modules and their slides are created on the existing learn-and-grow
  // pages; the course record just links into them for this course.
  const addModuleHref = `/dashboard/modules/add?programId=${uuid}`;

  const creator = program?.creator;

  const stats = [
    {
      key: "enrolled",
      icon: <FaUsers className="text-[#98A2B3]" />,
      value: enrollments.length,
      label: "Enrolled",
    },
    {
      key: "lessons",
      icon: <FaBookOpen className="text-[#98A2B3]" />,
      value: lessons,
      label: "Lessons",
    },
    {
      key: "rating",
      icon: <FaRegStar className="text-[#F59E0B]" />,
      value: rating.average.toFixed(1),
      label: "Rating",
    },
    {
      key: "duration",
      icon: <FaClock className="text-[#98A2B3]" />,
      value: program?.duration || "Flexible",
      label: "Duration",
    },
  ];

  return (
    <div className="min-h-screen px-6 py-6">
      <div className="mx-auto max-w-7xl">
        {/* TABS */}
        <div className="mb-8 inline-flex rounded-xl bg-[#F2F4F7] p-1.5">
          {TABS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={`rounded-lg px-10 py-2.5 text-sm font-semibold transition ${
                tab === item.key
                  ? "bg-white text-[#101828] shadow-sm"
                  : "text-[#667085] hover:text-[#101828]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
          {/* MAIN COLUMN */}
          <div>
            {tab === "details" && (
              <>
                <div className="mb-5 flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-[#EEF4FF] px-3 py-1 text-xs font-semibold text-[#3538CD]">
                    {program?.category || "General"}
                  </span>

                  <span className="rounded-full border border-[#EAECF0] px-3 py-1 text-xs font-semibold text-[#344054]">
                    {approvalLabel(lessons, modules.length)}
                  </span>
                </div>

                <h1 className="mb-5 text-4xl font-black leading-tight tracking-tight text-[#101828]">
                  {program?.title}
                </h1>

                <p className="max-w-3xl whitespace-pre-line text-lg leading-9 text-[#475467]">
                  {program?.description}
                </p>

                <div className="my-7 border-t border-[#EAECF0]" />

                <div className="flex flex-wrap items-center gap-x-9 gap-y-4 text-sm">
                  {stats.map((stat) => (
                    <span key={stat.key} className="flex items-center gap-2">
                      {stat.icon}
                      <span className="font-bold text-[#101828]">
                        {stat.value}
                      </span>
                      <span className="text-[#667085]">{stat.label}</span>
                    </span>
                  ))}
                </div>

                <div className="my-7 border-t border-[#EAECF0]" />

                <h2 className="mb-4 text-2xl font-black tracking-tight text-[#101828]">
                  About this course
                </h2>

                <p className="max-w-3xl whitespace-pre-line text-sm leading-7 text-[#667085]">
                  {program?.about}
                </p>

                <div className="mb-5 mt-10 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-2xl font-black tracking-tight text-[#101828]">
                    Modules
                  </h2>

                  <Link
                    href={addModuleHref}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#16a34a] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#15803d]"
                  >
                    <FaPlus className="text-xs" />
                    Add Module
                  </Link>
                </div>

                {modulesLoading ? (
                  <div className="rounded-2xl border border-[#EAECF0] bg-white p-8 text-center text-sm text-[#667085]">
                    Loading modules...
                  </div>
                ) : modules.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#EAECF0] bg-white p-8 text-center">
                    <p className="text-sm text-[#667085]">
                      No modules have been added to this course yet.
                    </p>

                    <Link
                      href={addModuleHref}
                      className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#082d77] hover:underline"
                    >
                      <FaPlus className="text-xs" />
                      Add the first module
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {modules.map((module, index) => (
                      <div
                        key={module.uuid}
                        className="flex items-center gap-5 rounded-2xl border border-[#EAECF0] bg-white p-5 transition hover:border-[#082d77]/30 hover:shadow-sm"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F2F4F7] text-sm font-semibold text-[#475467]">
                          {index + 1}
                        </span>

                        <Link
                          href={`/dashboard/modules/${uuid}`}
                          className="flex-1"
                        >
                          <span className="block text-base leading-7 text-[#101828]">
                            {module.title}
                          </span>

                          <span className="mt-1 block text-xs text-[#98A2B3]">
                            {module.Slides?.length || 0}{" "}
                            {module.Slides?.length === 1 ? "slide" : "slides"}
                          </span>
                        </Link>

                        {/* Slides are the lessons inside a module. */}
                        <Link
                          href={`/dashboard/slides/add?uuid=${module.uuid}`}
                          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-[#EAECF0] px-4 py-2 text-xs font-semibold text-[#082d77] transition hover:bg-[#F9FAFB]"
                        >
                          <FaPlus className="text-[10px]" />
                          Add Slide
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {tab === "enrollment" && (
              <>
                <h2 className="mb-5 text-2xl font-black tracking-tight text-[#101828]">
                  Enrolled Startups
                </h2>

                {enrollmentsLoading ? (
                  <div className="rounded-2xl border border-[#EAECF0] bg-white p-10 text-center text-sm text-[#667085]">
                    Loading enrollments...
                  </div>
                ) : enrollments.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#EAECF0] bg-white p-10 text-center text-sm text-[#667085]">
                    Nobody has enrolled in this course yet.
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-[#EAECF0] bg-white shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[640px] text-left text-sm">
                        <thead>
                          <tr className="border-b border-[#EAECF0] text-[#667085]">
                            <th className="px-6 py-4 font-medium">Startup</th>
                            <th className="px-6 py-4 font-medium">
                              Enrolled by
                            </th>
                            <th className="px-6 py-4 font-medium">
                              Enrollment Date
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {enrollments.map((row) => (
                            <tr
                              key={row.id}
                              className="border-b border-[#F2F4F7] last:border-0"
                            >
                              <td className="px-6 py-4">
                                <span className="font-bold text-[#082d77]">
                                  {row.businessName ||
                                    row.userName ||
                                    "Unnamed Business"}
                                </span>
                              </td>

                              <td className="px-6 py-4 text-[#475467]">
                                {row.userName || "—"}
                              </td>

                              <td className="px-6 py-4 text-[#475467]">
                                {formatDate(row.enrolledAt)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}

            {tab === "quizzes" && (
              <>
                <h2 className="mb-5 text-2xl font-black tracking-tight text-[#101828]">
                  Quizzes
                </h2>

                {quizzesLoading || quizzes === null ? (
                  <div className="rounded-2xl border border-[#EAECF0] bg-white p-10 text-center text-sm text-[#667085]">
                    Loading quizzes...
                  </div>
                ) : quizzes.every((entry) => entry.quizzes.length === 0) ? (
                  <div className="rounded-2xl border border-dashed border-[#EAECF0] bg-white p-10 text-center text-sm text-[#667085]">
                    No quizzes have been added to this course yet.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {quizzes
                      .filter((entry) => entry.quizzes.length > 0)
                      .map((entry) => (
                        <div key={entry.module.uuid}>
                          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#98A2B3]">
                            {entry.module.title}
                          </p>

                          <div className="space-y-3">
                            {entry.quizzes.map((quiz) => (
                              <div
                                key={quiz.uuid}
                                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#EAECF0] bg-white p-5"
                              >
                                <div>
                                  <p className="font-semibold text-[#101828]">
                                    {quiz.title}
                                  </p>

                                  <p className="mt-1 text-xs text-[#98A2B3]">
                                    {quiz.questions?.length || 0}{" "}
                                    {quiz.questions?.length === 1
                                      ? "question"
                                      : "questions"}
                                  </p>
                                </div>

                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                    quiz.isPublished
                                      ? "bg-emerald-50 text-emerald-700"
                                      : "bg-[#F2F4F7] text-[#667085]"
                                  }`}
                                >
                                  {quiz.isPublished ? "Published" : "Draft"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* SIDEBAR */}
          <aside className="space-y-6">
            <div className="overflow-hidden rounded-2xl border border-[#EAECF0] bg-white shadow-sm">
              <Image
                src={program?.image}
                alt={program?.title || "Course cover"}
                width={760}
                height={440}
                className="h-56 w-full object-cover"
              />

              <div className="p-6">
                <p className="text-3xl font-black tracking-tight text-[#101828]">
                  Free
                </p>

                <div className="my-5 border-t border-[#EAECF0]" />

                <div className="space-y-4">
                  {(program?.benefits || []).map((benefit, index) => (
                    <p
                      key={`${benefit}-${index}`}
                      className="flex items-center gap-3 text-sm text-[#344054]"
                    >
                      <FaCheckCircle className="shrink-0 text-[#12B76A]" />
                      {benefit}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#EAECF0] bg-white p-6 shadow-sm">
              <h3 className="mb-5 text-lg font-black tracking-tight text-[#101828]">
                Lead Instructor
              </h3>

              {creator ? (
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#F59E0B] text-lg font-bold uppercase text-white">
                    {(creator.name || creator.email || "?").charAt(0)}
                  </span>

                  <span>
                    <span className="block break-all font-bold text-[#101828]">
                      {creator.name || creator.email}
                    </span>

                    <span className="mt-0.5 block text-xs text-[#98A2B3]">
                      Course Expert
                    </span>
                  </span>
                </div>
              ) : (
                <p className="text-sm text-[#667085]">
                  No instructor was recorded when this course was created.
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default StaffCourseView;
