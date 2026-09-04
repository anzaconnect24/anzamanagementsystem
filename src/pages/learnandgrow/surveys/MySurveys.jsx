"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FaArrowRight, FaCheckCircle, FaClipboardList } from "react-icons/fa";
import Loader from "@/components/common/Loader";
import { getSurveys } from "@/controllers/survey_controller";

// The published surveys of the programme a startup is enrolled in. The API
// filters by the caller's own programme, so nothing is filtered again here.
const MySurveys = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [surveys, setSurveys] = useState([]);
  const [program, setProgram] = useState(null);

  useEffect(() => {
    getSurveys()
      .then((body) => {
        setSurveys(Array.isArray(body?.data) ? body.data : []);
        setProgram(body?.program || null);
      })
      .catch(() => {
        toast.error("Failed to load surveys");
        setSurveys([]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  const outstanding = surveys.filter((survey) => !survey.answered).length;

  return (
    <div className="min-h-screen px-6 py-4">
      <div className="relative mb-10 min-h-[180px] overflow-hidden rounded-2xl bg-black shadow-sm">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/mentor_hero.svg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-[#c9672b]/30" />

        <div className="relative z-10 max-w-3xl p-10 text-white">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-sm font-medium shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#f08a3c]" />
            {program?.title || "Surveys"}
          </span>

          <h2 className="mb-3 text-4xl font-bold leading-tight drop-shadow-lg">
            Surveys
          </h2>

          <p className="text-sm text-white/85">
            {surveys.length === 0
              ? "Nothing to answer right now."
              : `${outstanding} of ${surveys.length} still to answer.`}
          </p>
        </div>
      </div>

      {surveys.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <FaClipboardList className="mx-auto mb-3 text-3xl text-slate-300" />
          <p className="text-sm text-slate-500">
            No surveys have been shared with the program in which you were
            enrolled.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {surveys.map((survey) => (
            <div
              key={survey.uuid}
              className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-black leading-snug text-slate-950">
                  {survey.title}
                </h3>

                {survey.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-[#6f6f72]">
                    {survey.description}
                  </p>
                )}

                <p className="mt-2 text-xs text-[#98A2B3]">
                  {survey.questions}{" "}
                  {survey.questions === 1 ? "question" : "questions"}
                </p>
              </div>

              {survey.answered ? (
                <span className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-[#ECFDF3] px-4 py-2.5 text-sm font-semibold text-[#027A48]">
                  <FaCheckCircle /> Answered
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    navigate(`/dashboard/surveys/${survey.uuid}/take`)
                  }
                  className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-[#16a34a] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#15803d]"
                >
                  Answer Survey <FaArrowRight className="text-xs" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MySurveys;
