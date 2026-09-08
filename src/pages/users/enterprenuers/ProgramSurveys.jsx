"use client";

import { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FaCalendarAlt,
  FaCheckCircle,
  FaClipboardList,
  FaInbox,
  FaPencilAlt,
  FaPercent,
  FaUsers,
} from "react-icons/fa";
import Loader from "@/components/common/Loader";
import { UserContext } from "../../../layouts/DashboardLayout";
import {
  getSurveys,
  deleteSurvey,
  setSurveyStatus,
} from "@/controllers/survey_controller";

// Staff write the surveys a programme runs. "Staff" is stored as either
// "Staff" or "Reviewer" (see SignUp).
const CAN_MANAGE_ROLES = ["Admin", "Staff", "Reviewer"];

const formatDate = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-GB");
};

const statusStyle = (status) =>
  status === "published"
    ? "bg-[#ECFDF3] text-[#027A48]"
    : status === "closed"
      ? "bg-slate-100 text-slate-600"
      : "bg-[#FFFAEB] text-[#B54708]";

const ProgramSurveys = () => {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const { userDetails } = useContext(UserContext);
  const canManage = CAN_MANAGE_ROLES.includes(userDetails?.role);

  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState(null);
  const [members, setMembers] = useState(0);
  const [surveys, setSurveys] = useState([]);

  const load = () => {
    setLoading(true);
    getSurveys(uuid)
      .then((body) => {
        setProgram(body?.program || null);
        setMembers(body?.members || 0);
        setSurveys(Array.isArray(body?.data) ? body.data : []);
      })
      .catch((error) => {
        console.error(error);
        toast.error(
          error?.response?.status === 404
            ? "Program not found"
            : "Failed to load this program's surveys",
        );
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [uuid]);

  const remove = async (survey) => {
    if (
      !window.confirm(
        `Delete "${survey.title}"? Any answers already given are deleted with it.`,
      )
    )
      return;

    const response = await deleteSurvey(survey.uuid);

    if (response?.status !== true) {
      toast.error(response?.message || "Failed to delete the survey");
      return;
    }

    toast.success("Survey deleted");
    load();
  };

  const changeStatus = async (survey, status) => {
    const response = await setSurveyStatus(survey.uuid, status);

    if (response?.status !== true) {
      toast.error(response?.message || "Failed to update the survey");
      return;
    }

    toast.success(
      status === "published"
        ? "Survey published"
        : status === "closed"
          ? "Survey closed"
          : "Survey moved back to draft",
    );
    load();
  };

  // A response rate needs a denominator: every startup on the programme times
  // every survey actually sent to them. Null while nothing is published.
  const published = surveys.filter((survey) => survey.status !== "draft");
  const possible = members * published.length;

  const stats = {
    total: surveys.length,
    published: surveys.filter((survey) => survey.status === "published").length,
    draft: surveys.filter((survey) => survey.status === "draft").length,
    closed: surveys.filter((survey) => survey.status === "closed").length,
    responses: surveys.reduce(
      (sum, survey) => sum + (survey.responses || 0),
      0,
    ),
    rate: null,
  };

  if (possible > 0) {
    const answered = published.reduce(
      (sum, survey) => sum + (survey.responses || 0),
      0,
    );
    stats.rate = Math.round((answered / possible) * 100);
  }

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen px-6 py-4">
      <div>
        {/* HERO */}
        <div className="relative mb-8 min-h-[240px] overflow-hidden rounded-2xl bg-black shadow-sm">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url('${program?.image || "/images/mentor_hero.svg"}')`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-[#c9672b]/30" />

          <div className="relative z-10 max-w-3xl p-10 text-white">
            {program?.category && (
              <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-sm font-medium shadow-sm">
                <span className="h-2 w-2 rounded-full bg-[#f08a3c]" />
                {program.category}
              </span>
            )}

            <h2 className="mb-3 text-3xl font-bold leading-tight drop-shadow-lg md:text-4xl">
              {program?.title || "Program"}
            </h2>

            {program?.description && (
              <p className="mb-4 max-w-2xl text-sm leading-6 text-white/85 drop-shadow-md">
                {program.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-6 text-sm text-white/85">
              <span className="flex items-center gap-2">
                <FaUsers />
                {members} {members === 1 ? "startup" : "startups"} in this
                program
              </span>

              {(program?.startDate || program?.endDate) && (
                <span className="flex items-center gap-2">
                  <FaCalendarAlt />
                  {formatDate(program?.startDate)} &ndash;{" "}
                  {formatDate(program?.endDate)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* SURVEY DASHBOARD */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            {
              key: "total",
              label: "Total surveys",
              icon: FaClipboardList,
              tone: "text-[#082d77]",
              ring: "bg-[#082d77]/5",
              value: stats.total,
            },
            {
              key: "published",
              label: "Published",
              icon: FaCheckCircle,
              tone: "text-emerald-600",
              ring: "bg-emerald-50",
              value: stats.published,
            },
            {
              key: "draft",
              label: "Drafts",
              icon: FaPencilAlt,
              tone: "text-amber-600",
              ring: "bg-amber-50",
              value: stats.draft,
            },
            {
              key: "closed",
              label: "Closed",
              icon: FaInbox,
              tone: "text-slate-600",
              ring: "bg-slate-100",
              value: stats.closed,
            },
            {
              key: "responses",
              label: "Responses",
              icon: FaUsers,
              tone: "text-[#082d77]",
              ring: "bg-[#082d77]/5",
              value: stats.responses,
            },
            {
              key: "rate",
              label: "Response rate",
              icon: FaPercent,
              tone: "text-emerald-600",
              ring: "bg-emerald-50",
              // Nothing published means there is no rate to quote yet.
              value: stats.rate === null ? "—" : `${stats.rate}%`,
              hint:
                stats.rate === null
                  ? "No published survey has been sent to the startups yet"
                  : "Answers received out of every startup-survey pairing there could be",
            },
          ].map((tile) => {
            const Icon = tile.icon;

            return (
              <div
                key={tile.key}
                className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm"
                title={tile.hint || undefined}
              >
                <span
                  className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full ${tile.ring} ${tile.tone}`}
                >
                  <Icon className="text-sm" />
                </span>

                <p className="break-words text-lg font-black leading-tight text-slate-950">
                  {tile.value}
                </p>
                <p className="mt-1 text-xs font-medium leading-snug text-[#6f6f72]">
                  {tile.label}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-2xl font-black tracking-tight text-slate-950">
            Surveys in this Program
          </h2>

          {canManage && (
            <button
              type="button"
              onClick={() =>
                navigate(
                  `/dashboard/surveys/new?program=${encodeURIComponent(uuid)}`,
                )
              }
              className="inline-flex items-center gap-2 rounded-lg bg-[#16a34a] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#15803d]"
            >
              <FaClipboardList className="text-sm" />
              Create Survey
            </button>
          )}
        </div>

        {surveys.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
            No surveys have been created for this program yet.
          </div>
        ) : (
          <div className="space-y-4">
            {surveys.map((survey) => (
              <div
                key={survey.uuid}
                className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <span
                      className={`mb-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(
                        survey.status,
                      )}`}
                    >
                      {survey.status.charAt(0).toUpperCase() +
                        survey.status.slice(1)}
                    </span>

                    <h3 className="text-lg font-black leading-snug text-slate-950">
                      {survey.title}
                    </h3>

                    {survey.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-[#6f6f72]">
                        {survey.description}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 gap-3">
                    <div className="min-w-[120px] rounded-2xl bg-[#F9FAFB] p-4">
                      <p className="text-xs text-[#98A2B3]">Questions</p>
                      <p className="mt-1 text-lg font-bold text-slate-950">
                        {survey.questions}
                      </p>
                    </div>

                    <div className="min-w-[120px] rounded-2xl bg-[#F9FAFB] p-4">
                      <p className="text-xs text-[#98A2B3]">Responses</p>
                      <p className="mt-1 text-lg font-bold text-slate-950">
                        {survey.responses}
                      </p>
                    </div>
                  </div>
                </div>

                {canManage && (
                  <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/dashboard/surveys/${survey.uuid}/results`)
                      }
                      className="rounded-xl bg-[#ECFDF3] px-4 py-2 text-sm font-semibold text-[#027A48] transition hover:bg-[#D1FADF]"
                    >
                      View Responses
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/dashboard/surveys/${survey.uuid}/edit`)
                      }
                      className="rounded-xl bg-[#EEF4FF] px-4 py-2 text-sm font-semibold text-[#2563EB] transition hover:bg-[#DCE7FF]"
                    >
                      Edit Survey
                    </button>

                    {survey.status !== "published" ? (
                      <button
                        type="button"
                        onClick={() => changeStatus(survey, "published")}
                        className="rounded-xl bg-[#FFFAEB] px-4 py-2 text-sm font-semibold text-[#B54708] transition hover:bg-[#FEF0C7]"
                      >
                        Publish Survey
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => changeStatus(survey, "closed")}
                        className="rounded-xl bg-[#FFFAEB] px-4 py-2 text-sm font-semibold text-[#B54708] transition hover:bg-[#FEF0C7]"
                      >
                        Close Survey
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => remove(survey)}
                      className="rounded-xl bg-[#FEF3F2] px-4 py-2 text-sm font-semibold text-[#B42318] transition hover:bg-[#FEE4E2]"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgramSurveys;
