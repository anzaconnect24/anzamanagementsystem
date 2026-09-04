"use client";

import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { FaArrowLeft, FaPlus, FaTrash } from "react-icons/fa";
import Loader from "@/components/common/Loader";
import {
  QUESTION_TYPES,
  createSurvey,
  getSurvey,
  updateSurvey,
} from "@/controllers/survey_controller";

const CHOICE_TYPES = ["single_choice", "multiple_choice"];

const blankQuestion = () => ({
  key: `q-${Math.random().toString(36).slice(2)}`,
  questionText: "",
  questionType: "text",
  options: ["", ""],
  required: true,
});

// Writing a survey: its title, a note for respondents, and the questions.
// Reached from the Surveys tab of a program, and returns there when saved.
const SurveyBuilder = () => {
  // uuid is present when editing an existing survey.
  const { uuid } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const cohortProgram = searchParams.get("program");

  const [loading, setLoading] = useState(!!uuid);
  const [saving, setSaving] = useState(false);
  const [programUuid, setProgramUuid] = useState(cohortProgram);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState([blankQuestion()]);

  useEffect(() => {
    if (!uuid) return;

    getSurvey(uuid)
      .then((body) => {
        setTitle(body.title || "");
        setDescription(body.description || "");
        setProgramUuid(body.program?.uuid || cohortProgram);
        setQuestions(
          (body.questions || []).map((question, index) => ({
            key: `q-${index}`,
            questionText: question.questionText,
            questionType: question.questionType,
            options: question.options?.length ? question.options : ["", ""],
            required: question.required,
          })),
        );
      })
      .catch(() => toast.error("Failed to load this survey"))
      .finally(() => setLoading(false));
  }, [uuid]);

  const backLink = programUuid
    ? `/dashboard/programManagement/program/${programUuid}/surveys`
    : "/dashboard/programManagement";

  const patch = (key, changes) =>
    setQuestions((current) =>
      current.map((question) =>
        question.key === key ? { ...question, ...changes } : question,
      ),
    );

  const setOption = (key, index, value) =>
    setQuestions((current) =>
      current.map((question) =>
        question.key === key
          ? {
              ...question,
              options: question.options.map((option, i) =>
                i === index ? value : option,
              ),
            }
          : question,
      ),
    );

  const save = async (status) => {
    if (!title.trim()) {
      toast.error("Give the survey a title");
      return;
    }

    const cleaned = questions
      .filter((question) => question.questionText.trim())
      .map((question) => ({
        questionText: question.questionText.trim(),
        questionType: question.questionType,
        options: CHOICE_TYPES.includes(question.questionType)
          ? question.options.map((option) => option.trim()).filter(Boolean)
          : [],
        required: question.required,
      }));

    if (cleaned.length === 0) {
      toast.error("Add at least one question");
      return;
    }

    const missingChoices = cleaned.find(
      (question) =>
        CHOICE_TYPES.includes(question.questionType) &&
        question.options.length < 2,
    );

    if (missingChoices) {
      toast.error(
        `"${missingChoices.questionText}" needs at least two choices`,
      );
      return;
    }

    setSaving(true);

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      questions: cleaned,
      status,
    };

    const response = uuid
      ? await updateSurvey(uuid, payload)
      : await createSurvey({ ...payload, cohortProgram: programUuid });

    setSaving(false);

    if (response?.status !== true) {
      toast.error(response?.message || "Failed to save the survey");
      return;
    }

    toast.success(
      status === "published" ? "Survey published" : "Survey saved as a draft",
    );
    navigate(backLink);
  };

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen px-6 py-6">
      <div className="mx-auto max-w-4xl">
        <button
          type="button"
          onClick={() => navigate(backLink)}
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-[#082d77] transition hover:text-blue-700"
        >
          <FaArrowLeft /> Back to surveys
        </button>

        <h1 className="mb-6 text-3xl font-black tracking-tight text-slate-950">
          {uuid ? "Edit Survey" : "New Survey"}
        </h1>

        <div className="mb-6 space-y-5 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-900">
              Survey title
            </label>

            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Enter survey title"
              className="w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-900">
              Description
            </label>

            <textarea
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Tell the startups what this survey is for"
              className="w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
            />
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-black tracking-tight text-slate-950">
            Questions
          </h2>

          <button
            type="button"
            onClick={() =>
              setQuestions((current) => [...current, blankQuestion()])
            }
            className="inline-flex items-center gap-2 rounded-lg bg-[#16a34a] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#15803d]"
          >
            <FaPlus className="text-xs" />
            Add Question
          </button>
        </div>

        <div className="space-y-4">
          {questions.map((question, index) => (
            <div
              key={question.key}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <span className="text-sm font-bold text-[#98A2B3]">
                  Question {index + 1}
                </span>

                {questions.length > 1 && (
                  <button
                    type="button"
                    title="Remove this question"
                    onClick={() =>
                      setQuestions((current) =>
                        current.filter((item) => item.key !== question.key),
                      )
                    }
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                  >
                    <FaTrash className="text-sm" />
                  </button>
                )}
              </div>

              <input
                type="text"
                value={question.questionText}
                onChange={(event) =>
                  patch(question.key, { questionText: event.target.value })
                }
                placeholder="What do you want to ask?"
                className="mb-4 w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
              />

              <div className="flex flex-wrap items-center gap-4">
                <select
                  value={question.questionType}
                  onChange={(event) =>
                    patch(question.key, { questionType: event.target.value })
                  }
                  className="rounded-lg border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
                >
                  {QUESTION_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>

                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={question.required}
                    onChange={(event) =>
                      patch(question.key, { required: event.target.checked })
                    }
                  />
                  Required
                </label>
              </div>

              {CHOICE_TYPES.includes(question.questionType) && (
                <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                  {question.options.map((option, optionIndex) => (
                    <div
                      key={`${question.key}-${optionIndex}`}
                      className="flex items-center gap-3"
                    >
                      <input
                        type="text"
                        value={option}
                        onChange={(event) =>
                          setOption(
                            question.key,
                            optionIndex,
                            event.target.value,
                          )
                        }
                        placeholder={`Choice ${optionIndex + 1}`}
                        className="flex-1 rounded-lg border border-black/10 px-4 py-2 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
                      />

                      {question.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() =>
                            patch(question.key, {
                              options: question.options.filter(
                                (_, i) => i !== optionIndex,
                              ),
                            })
                          }
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                        >
                          <FaTrash className="text-xs" />
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() =>
                      patch(question.key, {
                        options: [...question.options, ""],
                      })
                    }
                    className="text-sm font-semibold text-[#082d77] hover:underline"
                  >
                    + Add choice
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={() => save("published")}
            className="inline-flex items-center gap-2 rounded-lg bg-[#16a34a] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#15803d] disabled:opacity-60"
          >
            {saving ? "Saving..." : "Publish Survey"}
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => save("draft")}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            Save as Draft
          </button>
        </div>
      </div>
    </div>
  );
};

export default SurveyBuilder;
