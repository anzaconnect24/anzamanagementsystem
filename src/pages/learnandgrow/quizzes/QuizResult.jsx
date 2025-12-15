"use client";
import { useState, useEffect } from "react";
import { useRouter } from "@/utils/navigation";
import { useParams } from "react-router-dom";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Loader from "@/components/common/Loader";
import {
  getAttemptDetails,
  downloadCertificate,
} from "@/controllers/quiz_controller";
import { toast } from "react-hot-toast";
import { BsCheckCircle, BsXCircle, BsClock, BsDownload } from "react-icons/bs";
import { useTranslation } from "@/locales";

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
      setLoading(false);
    } catch (error) {
      console.error("Error loading attempt:", error);
      toast.error(t("quizzes.failedToLoadQuiz"));
      router.push(`/dashboard/learn-and-grow/quizzes/${moduleId}`);
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
      ans.question.questionType === "description" && ans.isCorrect === null
  );

  return (
    <div>
      <Breadcrumb
        prevLink={`/dashboard/learn-and-grow/quizzes/${moduleId}`}
        pageName={t("quizzes.quizResults")}
        prevPage={t("quizzes.backToQuizzes")}
      />

      {/* Results Header */}
      <div className="bg-white rounded-lg shadow-sm border border-black/10 p-6 mb-6">
        <div className="text-center mb-6">
          <div className="mb-4">
            {attempt.isPassed ? (
              <BsCheckCircle
                className="inline-block text-green-500"
                size={64}
              />
            ) : (
              <BsXCircle className="inline-block text-red-500" size={64} />
            )}
          </div>

          <h1 className="text-3xl font-bold mb-2">
            {attempt.isPassed
              ? t("quizzes.congratulations")
              : t("quizzes.tryAgain")}
          </h1>

          <p className="text-xl text-gray-600 mb-4">
            {t("quizzes.yourScore")}{" "}
            <span className="font-bold text-primary">
              {Number(attempt.score || 0).toFixed(1)}%
            </span>
          </p>

          <div className="inline-block">
            {attempt.isPassed ? (
              <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full font-medium">
                ✓ {t("quizzes.passed")}
              </span>
            ) : (
              <span className="bg-red-100 text-red-800 px-4 py-2 rounded-full font-medium">
                ✗ {t("quizzes.failed")} ({t("common.required")}:{" "}
                {attempt.quiz.passingScore}%)
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-6 border-t">
          <div className="text-center">
            <p className="text-gray-500 text-sm">{t("quizzes.totalPoints")}</p>
            <p className="text-2xl font-bold">{attempt.totalPoints}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-500 text-sm">{t("quizzes.pointsEarned")}</p>
            <p className="text-2xl font-bold text-green-600">
              {attempt.earnedPoints}
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-500 text-sm">{t("common.questions")}</p>
            <p className="text-2xl font-bold">{attempt.answers.length}</p>
          </div>
        </div>

        {hasDescriptionQuestions && (
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">
              <BsClock className="inline mr-2" />
              {t("quizzes.answersUnderReview")}
            </p>
          </div>
        )}

        {attempt.isPassed && attempt.submittedAt && (
          <div className="mt-6 text-center">
            <button
              onClick={handleDownloadCertificate}
              disabled={downloading}
              className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              <BsDownload />
              {downloading
                ? t("quizzes.downloading")
                : t("quizzes.downloadCertificate")}
            </button>
          </div>
        )}
      </div>

      {/* Quiz Details */}
      <div className="bg-white rounded-lg shadow-sm border border-black/10 p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">{attempt.quiz.title}</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">{t("quizzes.module")}</span>
            <span className="font-medium ml-2">
              {attempt.quiz.module.title}
            </span>
          </div>
          <div>
            <span className="text-gray-500">{t("quizzes.submitted")}</span>
            <span className="font-medium ml-2">
              {new Date(attempt.submittedAt).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Answer Review */}
      <div className="bg-white rounded-lg shadow-sm border border-black/10 p-6">
        <h2 className="text-xl font-bold mb-6">Your Answers</h2>

        <div className="space-y-6">
          {attempt.answers.map((answer, index) => (
            <div
              key={answer.uuid}
              className={`border rounded-lg p-4 transition-colors ${
                answer.isCorrect === true
                  ? "border-green-300 bg-green-50"
                  : answer.isCorrect === false
                  ? "border-red-300 bg-red-50"
                  : "border-yellow-300 bg-yellow-50"
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold">
                  Question {index + 1}
                  {answer.isCorrect === true && (
                    <BsCheckCircle className="inline ml-2 text-green-600" />
                  )}
                  {answer.isCorrect === false && (
                    <BsXCircle className="inline ml-2 text-red-600" />
                  )}
                  {answer.isCorrect === null && (
                    <BsClock className="inline ml-2 text-yellow-600" />
                  )}
                </h3>
                <span className="text-sm font-medium">
                  {answer.pointsEarned} / {answer.question.points} pts
                </span>
              </div>

              <p className="text-gray-700 mb-3">
                {answer.question.questionText}
              </p>

              {answer.question.questionType === "description" ? (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Your Answer:
                  </p>
                  <div className="bg-white rounded p-3 mb-2">
                    <p className="text-gray-800">{answer.answerText}</p>
                  </div>
                  {answer.feedback && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-3">
                      <p className="text-sm font-medium text-blue-900 mb-1">
                        Instructor Feedback:
                      </p>
                      <p className="text-blue-800">{answer.feedback}</p>
                    </div>
                  )}
                  {answer.isCorrect === null && (
                    <p className="text-sm text-yellow-700 mt-2">
                      ⏳ Awaiting review from instructor
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">
                    Your Answer:
                  </p>
                  <div className="space-y-1 mb-3">
                    {answer.question.options.map((opt) => (
                      <div
                        key={opt.uuid}
                        className={`p-2 rounded ${
                          opt.uuid === answer.option?.uuid
                            ? answer.isCorrect
                              ? "bg-green-100 border border-green-300"
                              : "bg-red-100 border border-red-300"
                            : opt.isCorrect
                            ? "bg-green-50 border border-green-200"
                            : "bg-white"
                        }`}
                      >
                        {opt.uuid === answer.option?.uuid && "→ "}
                        {opt.isCorrect && "✓ "}
                        {opt.optionText}
                        {opt.isCorrect && (
                          <span className="text-xs text-green-600 ml-2">
                            (Correct Answer)
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex gap-4">
        <button
          onClick={() =>
            router.push(`/dashboard/learn-and-grow/quizzes/${moduleId}`)
          }
          className="bg-gray-500 text-black/70 px-6 py-2 rounded-lg hover:bg-gray-600"
        >
          Back to Quizzes
        </button>

        {!attempt.isPassed && (
          <button
            onClick={() =>
              router.push(
                `/dashboard/learn-and-grow/quizzes/${moduleId}/take/${attempt.quiz.uuid}`
              )
            }
            className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizResultPage;
