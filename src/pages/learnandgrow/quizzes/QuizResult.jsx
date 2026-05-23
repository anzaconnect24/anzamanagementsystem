"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/utils/navigation";
import { useParams } from "react-router-dom";
import Loader from "@/components/common/Loader";

import {
  getAttemptDetails,
  downloadCertificate,
} from "@/controllers/quiz_controller";

import { toast } from "react-hot-toast";

import {
  BsCheckCircle,
  BsXCircle,
  BsClock,
  BsDownload,
  BsAward,
  BsQuestionCircle,
  BsArrowRight,
  BsArrowRepeat,
} from "react-icons/bs";

import { useTranslation } from "@/locales";

const PRIMARY_COLOR = "#082d77";
const PRIMARY_HOVER = "#061f52";
const PRIMARY_SOFT = "#082d770d";

const QuizResultPage = () => {
  const { t } = useTranslation();
  const { moduleId, attemptId } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    loadAttempt();
  }, [attemptId]);

  const loadAttempt = async () => {
    try {
      setLoading(true);
      const result = await getAttemptDetails(attemptId);
      setAttempt(result.data);
    } catch (error) {
      console.error("Error loading attempt:", error);
      toast.error(t("quizzes.failedToLoadQuiz"));
      router.push(`/dashboard/learn-and-grow/quizzes/${moduleId}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCertificate = async () => {
    try {
      setDownloading(true);
      await downloadCertificate(attemptId);
      toast.success(t("quizzes.downloadCertificate"));
    } catch (error) {
      console.error("Error downloading certificate:", error);
      toast.error(t("quizzes.failedToDownloadCertificate"));
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <Loader />;

  const hasDescriptionQuestions = attempt.answers.some(
    (ans) =>
      ans.question.questionType === "description" &&
      ans.isCorrect === null
  );

  const score = Number(attempt.score || 0).toFixed(1);

  const resultBadge = attempt.isPassed
    ? "bg-emerald-100 text-emerald-700"
    : "bg-red-100 text-red-700";

  const resultIcon = attempt.isPassed ? (
    <BsCheckCircle className="text-6xl text-emerald-400" />
  ) : (
    <BsXCircle className="text-6xl text-red-400" />
  );

  return (
    <div className="min-h-screen bg-[#F5F7FA] px-6 py-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* HERO */}
        <section className="relative overflow-hidden rounded-[28px] border border-[#EAECF0] bg-black shadow-sm">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: "url('/images/business_tools_hero.svg')",
            }}
          />

          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/20" />

          <div className="relative z-10 flex min-h-[320px] flex-col justify-end gap-6 p-8 text-white lg:p-12">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
              <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
              Quiz Results
            </span>

            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="max-w-3xl">
                <div className="mb-5">{resultIcon}</div>

                <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl">
                  {attempt.isPassed
                    ? t("quizzes.congratulations")
                    : t("quizzes.tryAgain")}
                </h1>

                <p className="mt-5 max-w-3xl text-sm leading-7 text-white/85 md:text-base">
                  {attempt.isPassed
                    ? "You successfully completed the assessment and achieved the required passing score."
                    : "Review your quiz performance, identify improvement areas, and retake the assessment when ready."}
                </p>

                <div className="mt-7 flex flex-wrap items-center gap-6 text-sm font-medium text-white/90">
                  <span className="flex items-center gap-2">
                    <BsAward />
                    {score}% Score
                  </span>

                  <span className="flex items-center gap-2">
                    <BsQuestionCircle />
                    {attempt.answers.length} Questions
                  </span>

                  <span className="flex items-center gap-2">
                    <BsClock />
                    {new Date(attempt.submittedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <span
                className={`inline-flex w-fit rounded-full px-5 py-3 text-sm font-semibold ${resultBadge}`}
              >
                {attempt.isPassed
                  ? `✓ ${t("quizzes.passed")}`
                  : `✗ ${t("quizzes.failed")}`}
              </span>
            </div>
          </div>
        </section>

        {/* KPI CARDS */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="relative rounded-2xl border border-[#EAECF0] bg-white p-5 shadow-sm">
            <BsAward
              className="absolute right-5 top-5 text-xl"
              style={{ color: PRIMARY_COLOR }}
            />

            <p
              className={`text-3xl font-bold ${
                attempt.isPassed ? "text-emerald-600" : "text-red-500"
              }`}
            >
              {score}%
            </p>

            <p className="mt-2 text-sm font-medium text-[#667085]">
              Final Score
            </p>
          </div>

          <div className="relative rounded-2xl border border-[#EAECF0] bg-white p-5 shadow-sm">
            <BsCheckCircle className="absolute right-5 top-5 text-xl text-emerald-500" />

            <p className="text-3xl font-bold text-[#101828]">
              {attempt.earnedPoints}
            </p>

            <p className="mt-2 text-sm font-medium text-[#667085]">
              Points Earned
            </p>
          </div>

          <div className="relative rounded-2xl border border-[#EAECF0] bg-white p-5 shadow-sm">
            <BsQuestionCircle className="absolute right-5 top-5 text-xl text-amber-500" />

            <p className="text-3xl font-bold text-[#101828]">
              {attempt.answers.length}
            </p>

            <p className="mt-2 text-sm font-medium text-[#667085]">
              Questions
            </p>
          </div>

          <div className="relative rounded-2xl border border-[#EAECF0] bg-white p-5 shadow-sm">
            <BsClock
              className="absolute right-5 top-5 text-xl"
              style={{ color: PRIMARY_COLOR }}
            />

            <p className="text-3xl font-bold text-[#101828]">
              {attempt.quiz.passingScore}%
            </p>

            <p className="mt-2 text-sm font-medium text-[#667085]">
              Passing Score
            </p>
          </div>
        </section>

        {/* REVIEW NOTICE */}
        {hasDescriptionQuestions && (
          <section className="rounded-3xl border border-yellow-200 bg-yellow-50 p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <BsClock className="mt-1 text-xl text-yellow-600" />

              <div>
                <h3 className="font-semibold text-yellow-900">
                  Answers Under Review
                </h3>

                <p className="mt-1 text-sm leading-6 text-yellow-800">
                  Some descriptive answers are pending instructor review. Final
                  scores may update after grading is completed.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* OVERVIEW */}
        <section className="rounded-[26px] border border-[#EAECF0] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <p
                className="text-xs font-semibold tracking-wide"
                style={{ color: PRIMARY_COLOR }}
              >
                Quiz Overview
              </p>

              <h2 className="mt-2 text-2xl font-bold text-[#101828]">
                {attempt.quiz.title}
              </h2>

              <p className="mt-3 max-w-3xl text-sm leading-7 text-[#667085]">
                Review your submitted answers, scoring breakdown, and instructor
                feedback below.
              </p>
            </div>

            {attempt.isPassed && attempt.submittedAt && (
              <button
                onClick={handleDownloadCertificate}
                disabled={downloading}
                className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white transition disabled:opacity-50"
                style={{ backgroundColor: PRIMARY_COLOR }}
              >
                <BsDownload />
                {downloading
                  ? t("quizzes.downloading")
                  : t("quizzes.downloadCertificate")}
              </button>
            )}
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              ["Module", attempt.quiz.module.title],
              ["Submitted", new Date(attempt.submittedAt).toLocaleString()],
              ["Total Points", attempt.totalPoints],
              ["Earned Points", attempt.earnedPoints],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-[#F9FAFB] p-5">
                <p className="text-sm text-[#667085]">{label}</p>
                <p className="mt-2 font-semibold text-[#101828]">{value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ANSWERS */}
        <section className="rounded-[26px] border border-[#EAECF0] bg-white p-6 shadow-sm">
          <div className="mb-8">
            <p
              className="text-xs font-semibold tracking-wide"
              style={{ color: PRIMARY_COLOR }}
            >
              Answer Review
            </p>

            <h2 className="mt-2 text-2xl font-bold text-[#101828]">
              Your Submitted Answers
            </h2>
          </div>

          <div className="space-y-6">
            {attempt.answers.map((answer, index) => (
              <article
                key={answer.uuid}
                className={`rounded-3xl border p-6 ${
                  answer.isCorrect === true
                    ? "border-emerald-200 bg-emerald-50"
                    : answer.isCorrect === false
                    ? "border-red-200 bg-red-50"
                    : "border-yellow-200 bg-yellow-50"
                }`}
              >
                <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <span
                      className="mb-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold shadow-sm"
                      style={{
                        backgroundColor: "white",
                        color: PRIMARY_COLOR,
                      }}
                    >
                      {index + 1}
                    </span>

                    <h3 className="max-w-4xl text-lg font-semibold leading-8 text-[#101828]">
                      {answer.question.questionText}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3">
                    {answer.isCorrect === true && (
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                        <BsCheckCircle />
                      </div>
                    )}

                    {answer.isCorrect === false && (
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-100 text-red-600">
                        <BsXCircle />
                      </div>
                    )}

                    {answer.isCorrect === null && (
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
                        <BsClock />
                      </div>
                    )}

                    <div className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#344054] shadow-sm">
                      {answer.pointsEarned} / {answer.question.points} pts
                    </div>
                  </div>
                </div>

                {answer.question.questionType === "description" ? (
                  <div>
                    <div className="rounded-2xl bg-white p-5 shadow-sm">
                      <p className="mb-2 text-sm font-semibold text-[#667085]">
                        Your Answer
                      </p>

                      <p className="text-sm leading-7 text-[#101828]">
                        {answer.answerText}
                      </p>
                    </div>

                    {answer.feedback && (
                      <div
                        className="mt-4 rounded-2xl border p-5"
                        style={{
                          borderColor: `${PRIMARY_COLOR}33`,
                          backgroundColor: PRIMARY_SOFT,
                        }}
                      >
                        <p
                          className="mb-2 text-sm font-semibold"
                          style={{ color: PRIMARY_COLOR }}
                        >
                          Instructor Feedback
                        </p>

                        <p className="text-sm leading-7 text-[#344054]">
                          {answer.feedback}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {answer.question.options.map((opt) => (
                      <div
                        key={opt.uuid}
                        className={`rounded-2xl border p-4 text-sm font-medium transition ${
                          opt.uuid === answer.option?.uuid
                            ? answer.isCorrect
                              ? "border-emerald-300 bg-emerald-100 text-emerald-900"
                              : "border-red-300 bg-red-100 text-red-900"
                            : opt.isCorrect
                            ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                            : "border-white bg-white text-[#344054]"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {opt.uuid === answer.option?.uuid && <span>→</span>}
                          {opt.isCorrect && <span>✓</span>}

                          <span>{opt.optionText}</span>

                          {opt.isCorrect && (
                            <span className="ml-2 text-xs font-semibold text-emerald-700">
                              (Correct Answer)
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>

        {/* ACTIONS */}
        <section className="flex flex-wrap gap-4">
          <button
            onClick={() =>
              router.push(`/dashboard/learn-and-grow/quizzes/${moduleId}`)
            }
            className="inline-flex items-center gap-2 rounded-2xl bg-[#101828] px-6 py-3 text-sm font-semibold text-white transition hover:bg-black"
          >
            <BsArrowRight />
            Back to Quizzes
          </button>

          {!attempt.isPassed && (
            <button
              onClick={() =>
                router.push(
                  `/dashboard/learn-and-grow/quizzes/${moduleId}/take/${attempt.quiz.uuid}`
                )
              }
              className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold text-white transition"
              style={{ backgroundColor: PRIMARY_COLOR }}
            >
              <BsArrowRepeat />
              Try Again
            </button>
          )}
        </section>
      </div>
    </div>
  );
};

export default QuizResultPage;