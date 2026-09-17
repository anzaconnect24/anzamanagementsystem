"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FaArrowLeft,
  FaGlobeAfrica,
  FaPlus,
  FaSearch,
  FaTrash,
  FaUserFriends,
} from "react-icons/fa";
import Loader from "@/components/common/Loader";
import {
  QUESTION_TYPES,
  createSurvey,
  getSurvey,
  getSurveyAudiences,
  updateSurvey,
} from "@/controllers/survey_controller";

const CHOICE_TYPES = ["single_choice", "multiple_choice"];

// Roles as people know them, for the people picker.
const ROLE_LABELS = {
  Enterprenuer: "Startup",
  Mentor: "Mentor",
  Investor: "Investor",
  BDA: "Business Development Advisor",
  Finance: "Finance Officer",
  Admin: "Admin",
  ME: "M&E Officer",
};

const roleLabel = (role) => ROLE_LABELS[role] || role;

const blankQuestion = () => ({
  key: `q-${Math.random().toString(36).slice(2)}`,
  questionText: "",
  questionType: "text",
  options: ["", ""],
  required: true,
});

const inputClass =
  "w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600";

// Writing a survey: its title, a note for respondents, who it goes to, and the
// questions.
//
// Started from a programme's Surveys tab (?program=), it belongs to that
// programme and goes to its startups, as before. Started from the M&E
// Officer's Surveys page, it goes to every startup on the platform or to the
// people chosen here.
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

  // Who receives it.
  const [audience, setAudience] = useState(cohortProgram ? "program" : "all_startups");
  const [picked, setPicked] = useState([]);
  const [people, setPeople] = useState([]);
  const [startupCount, setStartupCount] = useState(0);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const isProgramSurvey = audience === "program";

  useEffect(() => {
    if (!uuid) return;

    getSurvey(uuid)
      .then((body) => {
        setTitle(body.title || "");
        setDescription(body.description || "");
        setProgramUuid(body.program?.uuid || cohortProgram);
        setAudience(body.audience || "program");
        setPicked((body.recipients || []).map((person) => person.uuid));
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uuid]);

  // The people list is only needed for a survey that reaches beyond a
  // programme, and only fetched then.
  useEffect(() => {
    if (isProgramSurvey) return;

    getSurveyAudiences().then((body) => {
      setPeople(Array.isArray(body?.data) ? body.data : []);
      setStartupCount(body?.startups || 0);
    });
  }, [isProgramSurvey]);

  const roles = useMemo(
    () => [...new Set(people.map((person) => person.role))].sort(),
    [people],
  );

  const shown = useMemo(() => {
    const query = search.trim().toLowerCase();

    return people.filter(
      (person) =>
        (!roleFilter || person.role === roleFilter) &&
        (!query ||
          [person.name, person.business, person.email]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query))),
    );
  }, [people, search, roleFilter]);

  const pickedSet = useMemo(() => new Set(picked), [picked]);

  const toggle = (id) =>
    setPicked((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );

  const backLink = isProgramSurvey
    ? programUuid
      ? `/dashboard/programManagement/program/${programUuid}/surveys`
      : "/dashboard/programManagement"
    : "/dashboard/surveys/manage";

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

    if (audience === "users" && picked.length === 0) {
      toast.error("Choose at least one person to send this survey to");
      return;
    }

    setSaving(true);

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      questions: cleaned,
      status,
      ...(isProgramSurvey
        ? {}
        : { audience, userUuids: audience === "users" ? picked : [] }),
    };

    const response = uuid
      ? await updateSurvey(uuid, payload)
      : await createSurvey(
          isProgramSurvey
            ? { ...payload, audience: "program", cohortProgram: programUuid }
            : payload,
        );

    setSaving(false);

    if (response?.status !== true) {
      toast.error(response?.message || "Failed to save the survey");
      return;
    }

    toast.success(
      status !== "published"
        ? "Survey saved as a draft"
        : isProgramSurvey
          ? "Survey published"
          : audience === "all_startups"
            ? `Survey sent to all ${startupCount.toLocaleString()} startups`
            : `Survey sent to ${picked.length} ${picked.length === 1 ? "person" : "people"}`,
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
              className={inputClass}
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
              placeholder="Tell respondents what this survey is for"
              className={inputClass}
            />
          </div>
        </div>

        {/* WHO RECEIVES IT — only for a survey that is not a programme's own. */}
        {!isProgramSurvey && (
          <div className="mb-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black tracking-tight text-slate-950">
              Who receives this survey
            </h2>
            <p className="mb-4 mt-1 text-sm text-[#6f6f72]">
              Nobody sees it until you publish it.
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                {
                  key: "all_startups",
                  icon: <FaGlobeAfrica />,
                  label: "All startups",
                  note: `Every startup account on the platform${
                    startupCount ? ` — ${startupCount.toLocaleString()} today` : ""
                  }, including any that join later.`,
                },
                {
                  key: "users",
                  icon: <FaUserFriends />,
                  label: "Selected people",
                  note: "Only the people you choose below, of any role.",
                },
              ].map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setAudience(option.key)}
                  aria-pressed={audience === option.key}
                  className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${
                    audience === option.key
                      ? "border-[#082d77] bg-[#082d77]/5"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <span className="mt-0.5 text-[#082d77]">{option.icon}</span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-slate-950">
                      {option.label}
                    </span>
                    <span className="block text-xs leading-5 text-[#6f6f72]">
                      {option.note}
                    </span>
                  </span>
                </button>
              ))}
            </div>

            {audience === "users" && (
              <div className="mt-5 border-t border-slate-100 pt-5">
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <div className="relative min-w-[200px] flex-1">
                    <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#98A2B3]" />
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search by name, company or email"
                      aria-label="Search people"
                      className={`${inputClass} pl-9`}
                    />
                  </div>

                  <select
                    value={roleFilter}
                    onChange={(event) => setRoleFilter(event.target.value)}
                    aria-label="Filter people by role"
                    className="rounded-lg border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
                  >
                    <option value="">All roles</option>
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {roleLabel(role)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="font-semibold text-slate-950">
                    {picked.length} selected
                  </span>

                  <span className="flex flex-wrap gap-4">
                    {shown.length ? (
                      <button
                        type="button"
                        onClick={() =>
                          setPicked((current) => [
                            ...new Set([...current, ...shown.map((person) => person.uuid)]),
                          ])
                        }
                        className="font-semibold text-[#082d77] hover:underline"
                      >
                        Select all {shown.length} shown
                      </button>
                    ) : null}

                    {picked.length ? (
                      <button
                        type="button"
                        onClick={() => setPicked([])}
                        className="font-semibold text-rose-600 hover:underline"
                      >
                        Clear
                      </button>
                    ) : null}
                  </span>
                </div>

                <div className="max-h-80 overflow-y-auto rounded-xl border border-slate-200 p-2">
                  {shown.length === 0 ? (
                    <p className="p-3 text-sm text-slate-500">
                      {people.length ? "Nobody matches this search." : "Loading people…"}
                    </p>
                  ) : (
                    shown.map((person) => (
                      <label
                        key={person.uuid}
                        className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          checked={pickedSet.has(person.uuid)}
                          onChange={() => toggle(person.uuid)}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold text-slate-950">
                            {person.name}
                          </span>
                          <span className="block truncate text-xs text-[#6f6f72]">
                            {person.business || person.email}
                          </span>
                        </span>
                        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                          {roleLabel(person.role)}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

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
                className={`mb-4 ${inputClass}`}
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
            {saving ? "Saving..." : isProgramSurvey ? "Publish Survey" : "Publish and Send"}
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
