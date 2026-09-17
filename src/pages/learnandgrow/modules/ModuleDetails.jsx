"use client";

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FaBookOpen,
  FaCheckCircle,
  FaLayerGroup,
  FaPlus,
  FaQuestionCircle,
  FaUsers,
} from "react-icons/fa";
import Loader from "@/components/common/Loader";
import Link from "@/utils/link";
import Image from "@/utils/image";
import { getModuleOverview } from "@/controllers/modules_controller";
import LessonBuilder from "@/components/learning/LessonBuilder";
import ModuleQuizzes from "@/pages/learnandgrow/quizzes/ModuleQuizzes";

const TABS = [
  { key: "details", label: "Details" },
  { key: "enrollment", label: "Enrollment" },
  { key: "quizzes", label: "Quizzes" },
];

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// A module is "Approved" once it has slides for learners to read. Before that
// it is still a draft — there is no separate approval workflow to read from.
const approvalLabel = (slides) => (slides > 0 ? "Approved" : "Draft");

const ModuleDetails = () => {
  const { uuid } = useParams();

  const [tab, setTab] = useState("details");
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);

  useEffect(() => {
    setLoading(true);
    getModuleOverview(uuid)
      .then(setOverview)
      .catch((error) => {
        console.error(error);
        toast.error(
          error?.response?.status === 404
            ? "Module not found"
            : "Failed to load this module",
        );
        setOverview(null);
      })
      .finally(() => setLoading(false));
  }, [uuid]);

  if (loading) return <Loader />;

  if (!overview?.module) {
    return (
      <div className="min-h-screen px-6 py-6">
        <div className="mx-auto max-w-7xl rounded-2xl border border-[#EAECF0] bg-white p-6 shadow-sm">
          <p className="text-sm text-[#667085]">Module not found.</p>
        </div>
      </div>
    );
  }

  const { module, program, slides = [], quizzes = [], members = [] } = overview;

  const stats = [
    {
      key: "enrolled",
      icon: <FaUsers className="text-[#98A2B3]" />,
      value: members.length,
      label: "Enrolled",
    },
    {
      key: "slides",
      icon: <FaBookOpen className="text-[#98A2B3]" />,
      value: slides.length,
      label: slides.length === 1 ? "Slide" : "Slides",
    },
    {
      key: "quizzes",
      icon: <FaQuestionCircle className="text-[#98A2B3]" />,
      value: quizzes.length,
      label: quizzes.length === 1 ? "Quiz" : "Quizzes",
    },
    {
      key: "created",
      icon: <FaLayerGroup className="text-[#98A2B3]" />,
      value: formatDate(module.createdAt),
      label: "Created",
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
                  {program?.category && (
                    <span className="rounded-md bg-[#EEF4FF] px-3 py-1 text-xs font-semibold text-[#3538CD]">
                      {program.category}
                    </span>
                  )}

                  <span className="rounded-full border border-[#EAECF0] px-3 py-1 text-xs font-semibold text-[#344054]">
                    {approvalLabel(slides.length)}
                  </span>
                </div>

                <h1 className="mb-5 text-4xl font-black leading-tight tracking-tight text-[#101828]">
                  {module.title}
                </h1>

                <p className="max-w-3xl whitespace-pre-line text-lg leading-9 text-[#475467]">
                  {module.description || "No description provided."}
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

                <div className="mt-10">
                  <LessonBuilder moduleUuid={module.uuid} canManage />
                </div>
              </>
            )}

            {tab === "enrollment" && (
              <>
                <h2 className="mb-5 text-2xl font-black tracking-tight text-[#101828]">
                  Enrolled Startups
                </h2>

                {members.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#EAECF0] bg-white p-10 text-center text-sm text-[#667085]">
                    No startups are enrolled in this program yet.
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-[#EAECF0] bg-white shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[720px] text-left text-sm">
                        <thead>
                          <tr className="border-b border-[#EAECF0] text-[#667085]">
                            <th className="px-6 py-4 font-medium">Startup</th>
                            <th className="px-6 py-4 font-medium">Email</th>
                            <th className="px-6 py-4 font-medium">
                              Enrollment Date
                            </th>
                            <th className="px-6 py-4 font-medium">Progress</th>
                          </tr>
                        </thead>

                        <tbody>
                          {members.map((member) => {
                            const percent = member.slidesTotal
                              ? Math.round(
                                  (member.slidesRead / member.slidesTotal) *
                                    100,
                                )
                              : 0;

                            return (
                              <tr
                                key={member.uuid}
                                className="border-b border-[#F2F4F7] last:border-0"
                              >
                                <td className="px-6 py-4">
                                  <span className="font-bold text-[#082d77]">
                                    {member.name || "Unnamed Business"}
                                  </span>
                                </td>

                                <td className="px-6 py-4 text-[#475467]">
                                  {member.email || "—"}
                                </td>

                                <td className="px-6 py-4 text-[#475467]">
                                  {formatDate(member.enrolledAt)}
                                </td>

                                <td className="px-6 py-4">
                                  <p className="mb-1 text-sm text-[#475467]">
                                    {percent}%{" "}
                                    <span className="text-xs text-[#98A2B3]">
                                      ({member.slidesRead}/{member.slidesTotal}{" "}
                                      slides)
                                    </span>
                                  </p>

                                  <div className="h-1.5 w-full max-w-[220px] overflow-hidden rounded-full bg-[#F2F4F7]">
                                    <div
                                      className="h-full rounded-full bg-teal-500"
                                      style={{ width: `${percent}%` }}
                                    />
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}

            {tab === "quizzes" && (
              <ModuleQuizzes moduleId={module.uuid} embedded />
            )}
          </div>

          {/* SIDEBAR */}
          <aside className="space-y-6">
            <div className="overflow-hidden rounded-2xl border border-[#EAECF0] bg-white shadow-sm">
              {module.image ? (
                <Image
                  src={module.image}
                  alt={module.title || "Module cover"}
                  width={760}
                  height={440}
                  className="h-56 w-full object-cover"
                />
              ) : (
                <div className="flex h-56 items-center justify-center bg-slate-950 text-center text-white/50">
                  <div>
                    <FaLayerGroup className="mx-auto mb-2 text-3xl" />
                    <p className="text-sm">Module Overview</p>
                  </div>
                </div>
              )}

              <div className="p-6">
                <p className="text-3xl font-black leading-tight tracking-tight text-[#101828]">
                  Free
                </p>

                <div className="my-5 border-t border-[#EAECF0]" />

                <div className="space-y-4">
                  <p className="flex items-center gap-3 text-sm text-[#344054]">
                    <FaCheckCircle className="shrink-0 text-[#12B76A]" />
                    Lifetime access
                  </p>

                  <p className="flex items-center gap-3 text-sm text-[#344054]">
                    <FaCheckCircle className="shrink-0 text-[#12B76A]" />
                    {quizzes.length > 0
                      ? "Certification on passing the quiz"
                      : "Certification"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#EAECF0] bg-white p-6 shadow-sm">
              <h3 className="mb-5 text-lg font-black tracking-tight text-[#101828]">
                Program
              </h3>

              {program ? (
                <>
                  <div className="mb-5 flex items-center gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#F59E0B] text-lg font-bold uppercase text-white">
                      {(program.title || "?").charAt(0)}
                    </span>

                    <span>
                      <Link
                        href={`/dashboard/programManagement/program/${program.uuid}/modules`}
                        className="block font-bold text-[#101828] hover:underline"
                      >
                        {program.title}
                      </Link>

                      <span className="mt-0.5 block text-xs text-[#98A2B3]">
                        {program.category || "Program"}
                      </span>
                    </span>
                  </div>

                  <dl className="space-y-3 border-t border-[#EAECF0] pt-4 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-[#667085]">Starts</dt>
                      <dd className="font-semibold text-[#101828]">
                        {formatDate(program.startDate)}
                      </dd>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-[#667085]">Ends</dt>
                      <dd className="font-semibold text-[#101828]">
                        {formatDate(program.endDate)}
                      </dd>
                    </div>
                  </dl>
                </>
              ) : (
                <p className="text-sm text-[#667085]">
                  This module is not attached to any program yet.
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default ModuleDetails;
