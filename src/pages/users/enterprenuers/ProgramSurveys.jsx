"use client";

import { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FaClipboardList, FaUsers } from "react-icons/fa";
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

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen px-6 py-4">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-3 text-4xl font-black tracking-tight text-slate-950">
          {program?.title || "Program"}
        </h1>

        <div className="mb-8 flex flex-wrap items-center gap-8 border-y border-slate-200 py-4 text-sm text-[#6f6f72]">
          <span className="flex items-center gap-2">
            <FaUsers className="text-slate-400" />
            <strong className="text-slate-950">{members}</strong> Enrolled
          </span>

          <span className="flex items-center gap-2">
            <FaClipboardList className="text-slate-400" />
            <strong className="text-slate-950">{surveys.length}</strong>{" "}
            {surveys.length === 1 ? "Survey" : "Surveys"}
          </span>
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
