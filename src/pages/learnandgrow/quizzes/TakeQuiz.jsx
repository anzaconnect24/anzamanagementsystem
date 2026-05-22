"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/utils/navigation";
import { useParams } from "react-router-dom";
import Loader from "@/components/common/Loader";
import {
  getQuizById,
  startQuizAttempt,
  submitQuiz,
} from "@/controllers/quiz_controller";
import { toast } from "react-hot-toast";
import { useTranslation } from "@/locales";

import {
  BsCheckCircle,
  BsClock,
  BsQuestionCircle,
  BsPatchCheck,
  BsArrowRight,
} from "react-icons/bs";

const TakeQuizPage = () => {
  const { t } = useTranslation();

  const { moduleId, quizId } = useParams();

  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState(null);
  const [attemptUuid, setAttemptUuid] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [startTime, setStartTime] = useState(null);

  useEffect(() => {
    loadQuiz();
  }, [quizId]);

  const loadQuiz = async () => {
    try {
      setLoading(true);

      const result = await getQuizById(quizId);

      setQuiz(result.data);

      const attemptResult = await startQuizAttempt(quizId);

      setAttemptUuid(attemptResult.data.uuid);

      setStartTime(new Date());

      setLoading(false);
    } catch (error) {
      console.error("Error loading quiz:", error);

      toast.error(t("quizzes.failedToLoadQuiz"));

      router.push(`/dashboard/learn-and-grow/quizzes/${moduleId}`);
    }
  };

  const handleAnswerChange = (questionUuid, value) => {
    setAnswers({
      ...answers,
      [questionUuid]: value,
    });
  };

  const handleSubmit = async () => {
    const unansweredQuestions = quiz.questions.filter(
      (q) =>
        !answers[q.uuid] ||
        (q.questionType === "description" &&
          !answers[q.uuid].trim())
    );

    if (unansweredQuestions.length > 0) {
      toast.error(
        t("quizzes.answerAllQuestions", "", {
          count: unansweredQuestions.length,
        })
      );

      return;
    }

    if (!confirm(t("quizzes.submitConfirm"))) {
      return;
    }

    try {
      setSubmitting(true);

      const formattedAnswers = quiz.questions.map((question) => {
        const answer = answers[question.uuid];

        if (question.questionType === "description") {
          return {
            questionUuid: question.uuid,
            answerText: answer,
          };
        }

        return {
          questionUuid: question.uuid,
          optionUuid: answer,
        };
      });

      const result = await submitQuiz(
        attemptUuid,
        formattedAnswers
      );

      const gradingStatus = result.data.gradingStatus;

      if (gradingStatus === "pending_grading") {
        toast.success(t("quizzes.quizSubmittedForReview"));

        router.push(
          `/dashboard/learn-and-grow/quizzes/${moduleId}`
        );
      } else {
        toast.success(t("quizzes.quizSubmittedSuccess"));

        router.push(
          `/dashboard/learn-and-grow/quizzes/${moduleId}/result/${attemptUuid}`
        );
      }
    } catch (error) {
      console.error("Error submitting quiz:", error);

      toast.error(t("quizzes.failedToSubmitQuiz"));
    } finally {
      setSubmitting(false);
    }
  };

  const getElapsedTime = () => {
    if (!startTime) return "00:00";

    const now = new Date();

    const diff = Math.floor((now - startTime) / 1000);

    const minutes = Math.floor(diff / 60);

    const seconds = diff % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      seconds
    ).padStart(2, "0")}`;
  };

  if (loading) return <Loader />;

  const answeredCount = Object.keys(answers).filter(
    (key) =>
      answers[key] &&
      (typeof answers[key] !== "string" ||
        answers[key].trim())
  ).length;

  const progress =
    quiz.questions.length > 0
      ? Math.round(
          (answeredCount / quiz.questions.length) * 100
        )
      : 0;

  return (
    <div className="min-h-screen bg-[#F5F7FA] px-6 py-6">
      <div className="mx-auto max-w-7xl">
        {/* HERO */}
        <section className="relative mb-8 overflow-hidden rounded-3xl border border-[#EAECF0] bg-black shadow-sm">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                "url('/images/business_tools_hero.svg')",
            }}
          />

          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/20" />

          <div className="relative z-10 flex min-h-[300px] flex-col justify-end p-8 text-white lg:p-12">
            <span className="mb-5 inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
              <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
              Learning Assessment
            </span>

            <h1 className="max-w-4xl text-4xl font-bold leading-tight tracking-tight md:text-5xl">
              {quiz.title}
            </h1>

            {quiz.description && (
              <p className="mt-5 max-w-3xl text-sm leading-7 text-white/85 md:text-base">
                {quiz.description}
              </p>
            )}

            <div className="mt-8 flex flex-wrap items-center gap-6 text-sm font-medium text-white/90">
              <span className="flex items-center gap-2">
                <BsQuestionCircle />
                {quiz.questions.length} Questions
              </span>

              <span className="flex items-center gap-2">
                <BsPatchCheck />
                {quiz.passingScore}% Passing Score
              </span>

              <span className="flex items-center gap-2">
                <BsClock />
                {getElapsedTime()}
              </span>
            </div>
          </div>
        </section>

        {/* STATUS CARDS */}
        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="relative rounded-2xl border border-[#EAECF0] bg-white p-5 shadow-sm">
            <BsQuestionCircle className="absolute right-5 top-5 text-xl text-blue-500" />

            <p className="text-3xl font-bold text-[#101828]">
              {quiz.questions.length}
            </p>

            <p className="mt-2 text-sm font-medium text-[#667085]">
              Total Questions
            </p>
          </div>

          <div className="relative rounded-2xl border border-[#EAECF0] bg-white p-5 shadow-sm">
            <BsCheckCircle className="absolute right-5 top-5 text-xl text-emerald-500" />

            <p className="text-3xl font-bold text-[#101828]">
              {answeredCount}
            </p>

            <p className="mt-2 text-sm font-medium text-[#667085]">
              Answered
            </p>
          </div>

          <div className="relative rounded-2xl border border-[#EAECF0] bg-white p-5 shadow-sm">
            <BsPatchCheck className="absolute right-5 top-5 text-xl text-amber-500" />

            <p className="text-3xl font-bold text-[#101828]">
              {quiz.passingScore}%
            </p>

            <p className="mt-2 text-sm font-medium text-[#667085]">
              Passing Score
            </p>
          </div>

          <div className="relative rounded-2xl border border-[#EAECF0] bg-white p-5 shadow-sm">
            <BsClock className="absolute right-5 top-5 text-xl text-sky-500" />

            <p className="text-3xl font-bold text-[#101828]">
              {progress}%
            </p>

            <p className="mt-2 text-sm font-medium text-[#667085]">
              Completion
            </p>
          </div>
        </section>

        {/* PROGRESS */}
        <section className="mb-8 rounded-3xl border border-[#EAECF0] bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="font-medium text-[#667085]">
              Quiz Progress
            </span>

            <span className="font-bold text-[#101828]">
              {progress}%
            </span>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-[#EAECF0]">
            <div
              className="h-full rounded-full bg-[#2563EB] transition-all duration-300"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </section>

        {/* QUESTIONS */}
        <section className="space-y-6">
          {quiz.questions.map((question, index) => (
            <article
              key={question.uuid}
              className="rounded-3xl border border-[#EAECF0] bg-white p-6 shadow-sm"
            >
              <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <span className="mb-4 inline-flex rounded-full bg-[#EEF4FF] px-3 py-1 text-xs font-semibold text-[#2563EB]">
                    Question {index + 1}
                  </span>

                  <h3 className="max-w-4xl text-lg font-semibold leading-8 text-[#101828]">
                    {question.questionText}
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  {answers[question.uuid] && (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ECFDF3] text-[#027A48]">
                      <BsCheckCircle />
                    </div>
                  )}

                  <div className="rounded-full bg-[#FFFAEB] px-4 py-2 text-sm font-semibold text-[#B54708]">
                    {question.points}{" "}
                    {question.points === 1
                      ? t("quizzes.point")
                      : t("quizzes.points")}
                  </div>
                </div>
              </div>

              {/* MULTIPLE CHOICE */}
              {question.questionType ===
                "multiple_choice" && (
                <div className="space-y-3">
                  {question.options.map((option) => (
                    <label
                      key={option.uuid}
                      className={`flex cursor-pointer items-center gap-4 rounded-2xl border p-4 transition ${
                        answers[question.uuid] ===
                        option.uuid
                          ? "border-[#2563EB] bg-[#EEF4FF]"
                          : "border-[#EAECF0] hover:bg-[#F9FAFB]"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${question.uuid}`}
                        value={option.uuid}
                        checked={
                          answers[question.uuid] ===
                          option.uuid
                        }
                        onChange={(e) =>
                          handleAnswerChange(
                            question.uuid,
                            e.target.value
                          )
                        }
                        className="h-4 w-4 text-[#2563EB]"
                      />

                      <span className="text-sm font-medium text-[#344054]">
                        {option.optionText}
                      </span>
                    </label>
                  ))}
                </div>
              )}

              {/* TRUE FALSE */}
              {question.questionType === "true_false" && (
                <div className="space-y-3">
                  {question.options.map((option) => (
                    <label
                      key={option.uuid}
                      className={`flex cursor-pointer items-center gap-4 rounded-2xl border p-4 transition ${
                        answers[question.uuid] ===
                        option.uuid
                          ? "border-[#2563EB] bg-[#EEF4FF]"
                          : "border-[#EAECF0] hover:bg-[#F9FAFB]"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${question.uuid}`}
                        value={option.uuid}
                        checked={
                          answers[question.uuid] ===
                          option.uuid
                        }
                        onChange={(e) =>
                          handleAnswerChange(
                            question.uuid,
                            e.target.value
                          )
                        }
                        className="h-4 w-4 text-[#2563EB]"
                      />

                      <span className="text-sm font-medium text-[#344054]">
                        {option.optionText}
                      </span>
                    </label>
                  ))}
                </div>
              )}

              {/* DESCRIPTION */}
              {question.questionType ===
                "description" && (
                <textarea
                  value={answers[question.uuid] || ""}
                  onChange={(e) =>
                    handleAnswerChange(
                      question.uuid,
                      e.target.value
                    )
                  }
                  className="w-full rounded-2xl border border-[#D0D5DD] bg-white px-5 py-4 text-sm leading-7 text-[#101828] outline-none transition placeholder:text-[#98A2B3] focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100"
                  rows="6"
                  placeholder={t("quizzes.yourAnswer")}
                />
              )}
            </article>
          ))}
        </section>

        {/* SUBMIT */}
        <section className="sticky bottom-4 mt-8 rounded-3xl border border-[#EAECF0] bg-white p-5 shadow-xl backdrop-blur-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-[#101828]">
                {answeredCount} {t("common.of")}{" "}
                {quiz.questions.length}{" "}
                {t("quizzes.questions")} answered
              </p>

              {answeredCount < quiz.questions.length && (
                <p className="mt-1 text-sm text-[#B54708]">
                  {quiz.questions.length - answeredCount}{" "}
                  {t("common.remaining")}
                </p>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={
                submitting ||
                answeredCount < quiz.questions.length
              }
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#2563EB] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:bg-[#D0D5DD]"
            >
              {submitting
                ? t("quizzes.submitting")
                : t("quizzes.submitQuiz")}

              {!submitting && <BsArrowRight />}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default TakeQuizPage;