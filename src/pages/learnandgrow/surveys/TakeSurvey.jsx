"use client";

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FaArrowLeft, FaCheckCircle } from "react-icons/fa";
import Loader from "@/components/common/Loader";
import {
  getSurvey,
  submitSurveyResponse,
} from "@/controllers/survey_controller";

const RATINGS = [1, 2, 3, 4, 5];

// A startup answering one survey. Answers are submitted once; the API rejects
// a second submission rather than quietly overwriting the first.
const TakeSurvey = () => {
  const { uuid } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [survey, setSurvey] = useState(null);
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    getSurvey(uuid)
      .then(setSurvey)
      .catch((error) => {
        toast.error(
          error?.response?.data?.message || "Failed to load this survey",
        );
        setSurvey(null);
      })
      .finally(() => setLoading(false));
  }, [uuid]);

  const setAnswer = (questionUuid, value) =>
    setAnswers((current) => ({ ...current, [questionUuid]: value }));

  const toggleChoice = (question, option) => {
    const current = answers[question.uuid]?.selectedOptions || [];

    if (question.questionType === "single_choice") {
      setAnswer(question.uuid, { selectedOptions: [option] });
      return;
    }

    setAnswer(question.uuid, {
      selectedOptions: current.includes(option)
        ? current.filter((item) => item !== option)
        : [...current, option],
    });
  };

  const submit = async () => {
    const payload = (survey.questions || []).map((question) => ({
      questionUuid: question.uuid,
      ...(answers[question.uuid] || {}),
    }));

    setSaving(true);
    const response = await submitSurveyResponse(uuid, payload);
    setSaving(false);

    if (response?.status !== true) {
      toast.error(response?.message || "Failed to submit your answers");
      return;
    }

    toast.success("Thank you — your answers have been submitted");
    navigate("/dashboard/surveys");
  };

  if (loading) return <Loader />;

  if (!survey) {
    return (
      <div className="min-h-screen px-6 py-6">
        <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200/80 bg-white p-6 text-sm text-[#667085]">
          This survey is not available to you.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-6">
      <div className="mx-auto max-w-3xl">
        <button
          type="button"
          onClick={() => navigate("/dashboard/surveys")}
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-[#082d77] transition hover:text-blue-700"
        >
          <FaArrowLeft /> Back to surveys
        </button>

        <h1 className="mb-2 text-3xl font-black tracking-tight text-slate-950">
          {survey.title}
        </h1>

        {survey.description && (
          <p className="mb-8 text-sm leading-7 text-[#667085]">
            {survey.description}
          </p>
        )}

        {survey.answered ? (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-10 text-center">
            <FaCheckCircle className="mx-auto mb-3 text-3xl text-[#12B76A]" />
            <p className="text-sm text-slate-600">
              You have already answered this survey.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {survey.questions.map((question, index) => (
                <div
                  key={question.uuid}
                  className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#98A2B3]">
                    Question {index + 1}
                    {question.required && (
                      <span className="ml-1 text-[#B42318]">*</span>
                    )}
                  </p>

                  <h3 className="mb-4 mt-1 text-lg font-bold text-slate-950">
                    {question.questionText}
                  </h3>

                  {question.questionType === "text" && (
                    <textarea
                      rows={4}
                      value={answers[question.uuid]?.answerText || ""}
                      onChange={(event) =>
                        setAnswer(question.uuid, {
                          answerText: event.target.value,
                        })
                      }
                      placeholder="Type your answer"
                      className="w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
                    />
                  )}

                  {question.questionType === "rating" && (
                    <div className="flex flex-wrap gap-3">
                      {RATINGS.map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() =>
                            setAnswer(question.uuid, { rating: value })
                          }
                          className={`h-11 w-11 rounded-full text-sm font-bold transition ${
                            answers[question.uuid]?.rating === value
                              ? "bg-[#16a34a] text-white"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  )}

                  {(question.questionType === "single_choice" ||
                    question.questionType === "multiple_choice") && (
                    <div className="space-y-2">
                      {question.options.map((option) => {
                        const picked = (
                          answers[question.uuid]?.selectedOptions || []
                        ).includes(option);

                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => toggleChoice(question, option)}
                            className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${
                              picked
                                ? "border-[#16a34a] bg-[#ECFDF3] font-semibold text-[#027A48]"
                                : "border-slate-200 text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <span
                              className={`flex h-4 w-4 shrink-0 items-center justify-center border ${
                                question.questionType === "single_choice"
                                  ? "rounded-full"
                                  : "rounded"
                              } ${
                                picked
                                  ? "border-[#16a34a] bg-[#16a34a]"
                                  : "border-slate-300"
                              }`}
                            />
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              disabled={saving}
              onClick={submit}
              className="mt-8 inline-flex items-center gap-2 rounded-lg bg-[#16a34a] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#15803d] disabled:opacity-60"
            >
              {saving ? "Submitting..." : "Submit Answers"}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default TakeSurvey;
