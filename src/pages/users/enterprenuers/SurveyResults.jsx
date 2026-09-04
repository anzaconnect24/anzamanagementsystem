"use client";

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FaArrowLeft } from "react-icons/fa";
import Loader from "@/components/common/Loader";
import {
  getSurveyResults,
  questionTypeLabel,
} from "@/controllers/survey_controller";

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

// What the programme's startups answered. Tallies for the choice and rating
// questions, and the written answers verbatim.
const SurveyResults = () => {
  const { uuid } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState(null);

  useEffect(() => {
    getSurveyResults(uuid)
      .then(setResults)
      .catch(() => toast.error("Failed to load the responses"))
      .finally(() => setLoading(false));
  }, [uuid]);

  if (loading) return <Loader />;

  if (!results) {
    return (
      <div className="min-h-screen px-6 py-6">
        <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200/80 bg-white p-6 text-sm text-[#667085]">
          Survey not found.
        </div>
      </div>
    );
  }

  const rate = results.members
    ? Math.round((results.responded / results.members) * 100)
    : 0;

  return (
    <div className="min-h-screen px-6 py-6">
      <div className="mx-auto max-w-5xl">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-[#082d77] transition hover:text-blue-700"
        >
          <FaArrowLeft /> Back
        </button>

        <h1 className="mb-6 text-3xl font-black tracking-tight text-slate-950">
          {results.title}
        </h1>

        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { key: "sent", label: "Startups", value: results.members },
            { key: "got", label: "Responses", value: results.responded },
            { key: "rate", label: "Response Rate", value: `${rate}%` },
            {
              key: "status",
              label: "Status",
              value:
                results.status.charAt(0).toUpperCase() +
                results.status.slice(1),
            },
          ].map((tile) => (
            <div
              key={tile.key}
              className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm"
            >
              <p className="text-2xl font-black leading-tight text-slate-950">
                {tile.value}
              </p>
              <p className="mt-1 text-xs font-medium text-[#667085]">
                {tile.label}
              </p>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          {results.results.map((question, index) => (
            <div
              key={question.uuid}
              className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-[#98A2B3]">
                Question {index + 1} ·{" "}
                {questionTypeLabel(question.questionType)}
              </p>

              <h3 className="mb-4 mt-1 text-lg font-black text-slate-950">
                {question.questionText}
              </h3>

              {question.questionType === "text" && (
                <>
                  {question.answers.length === 0 ? (
                    <p className="text-sm text-slate-500">No answers yet.</p>
                  ) : (
                    <ul className="space-y-2">
                      {question.answers.map((answer, answerIndex) => (
                        <li
                          key={answerIndex}
                          className="rounded-xl bg-[#F9FAFB] px-4 py-3 text-sm leading-6 text-slate-700"
                        >
                          {answer}
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}

              {question.questionType === "rating" && (
                <p className="text-sm text-slate-700">
                  {question.average === null ? (
                    <span className="text-slate-500">No ratings yet.</span>
                  ) : (
                    <>
                      <span className="text-2xl font-black text-slate-950">
                        {question.average}
                      </span>{" "}
                      average from {question.count}{" "}
                      {question.count === 1 ? "rating" : "ratings"}
                    </>
                  )}
                </p>
              )}

              {(question.questionType === "single_choice" ||
                question.questionType === "multiple_choice") && (
                <div className="space-y-3">
                  {question.counts.map((row) => {
                    const percent = results.responded
                      ? Math.round((row.count / results.responded) * 100)
                      : 0;

                    return (
                      <div key={row.option}>
                        <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                          <span className="text-slate-700">{row.option}</span>
                          <span className="font-semibold text-slate-950">
                            {row.count} ({percent}%)
                          </span>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-teal-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        <h2 className="mb-4 mt-10 text-xl font-black tracking-tight text-slate-950">
          Who responded
        </h2>

        {results.respondents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
            No startup has answered this survey yet.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-[#667085]">
                  <th className="px-6 py-4 font-medium">Startup</th>
                  <th className="px-6 py-4 font-medium">Email</th>
                  <th className="px-6 py-4 font-medium">Submitted</th>
                </tr>
              </thead>

              <tbody>
                {results.respondents.map((row) => (
                  <tr
                    key={row.uuid}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="px-6 py-4 font-bold text-[#082d77]">
                      {row.name || "Unnamed Business"}
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {row.email || "—"}
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {formatDate(row.submittedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SurveyResults;
