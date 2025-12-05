"use client";
import { useState, useEffect } from "react";
import { useRouter } from "@/utils/navigation";
import { useParams } from "react-router-dom";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Loader from "@/components/common/Loader";
import { getUserAttempts } from "@/controllers/quiz_controller";
import { getQuizById } from "@/controllers/quiz_controller";
import { toast } from "react-hot-toast";
import { BsCheckCircle, BsXCircle, BsClock, BsEye } from "react-icons/bs";

const UserAttemptsPage = () => {
  const { moduleId, quizId } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState([]);
  const [quiz, setQuiz] = useState(null);

  useEffect(() => {
    loadData();
  }, [quizId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [attemptsResult, quizResult] = await Promise.all([
        getUserAttempts(quizId),
        getQuizById(quizId),
      ]);
      console.log("attemptsResult", attemptsResult);
      setAttempts(attemptsResult.data || []);
      setQuiz(quizResult.data);
      setLoading(false);
    } catch (error) {
      console.error("Error loading attempts:", error);
      toast.error("Failed to load attempts");
    }
  };

  if (loading) return <Loader />;

  const bestScore = attempts.reduce(
    (max, attempt) =>
      attempt.submittedAt && attempt.score > max ? attempt.score : max,
    0
  );

  const passedAttempts = attempts.filter((a) => a.isPassed).length;
  console.log(attemptsResult);
  return (
    <div>
      <Breadcrumb
        prevLink={`/dashboard/learn-and-grow/quizzes/${moduleId}`}
        pageName="My Quiz Attempts"
        prevPage="Back to Quizzes"
      />

      {/* Summary */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h1 className="text-2xl font-bold mb-4">{quiz.title}</h1>

        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Total Attempts</p>
            <p className="text-3xl font-bold text-blue-600">
              {attempts.length}
            </p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Passed</p>
            <p className="text-3xl font-bold text-green-600">
              {passedAttempts}
            </p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Best Score</p>
            <p className="text-3xl font-bold text-purple-600">
              {bestScore.toFixed(1)}%
            </p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Passing Score</p>
            <p className="text-3xl font-bold text-orange-600">
              {quiz.passingScore}%
            </p>
          </div>
        </div>
      </div>

      {/* Attempts List */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Attempt History</h2>

        {attempts.length === 0 ? (
          <div className="text-center py-12 border border-black/10 rounded-lg bg-gray-50">
            <p className="text-gray-500 mb-4">
              You haven't attempted this quiz yet
            </p>
            <button
              onClick={() =>
                router.push(
                  `/dashboard/learn-and-grow/quizzes/${moduleId}/take/${quizId}`
                )
              }
              className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90"
            >
              Take Quiz Now
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {attempts.map((attempt, index) => {
              const hasUngraded = attempt.answers?.some(
                (ans) =>
                  ans.question?.questionType === "description" &&
                  ans.isCorrect === null
              );

              return (
                <div
                  key={attempt.uuid}
                  className={`border border-black/10 rounded-lg p-4 ${
                    attempt.isPassed
                      ? "border-green-300 bg-green-50"
                      : attempt.submittedAt
                      ? "border-red-300 bg-red-50"
                      : "border-black/20"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-lg">
                          Attempt #{attempts.length - index}
                        </h3>

                        {attempt.submittedAt ? (
                          attempt.isPassed ? (
                            <span className="flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                              <BsCheckCircle />
                              Passed
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
                              <BsXCircle />
                              Not Passed
                            </span>
                          )
                        ) : (
                          <span className="flex items-center gap-1 bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                            <BsClock />
                            In Progress
                          </span>
                        )}

                        {hasUngraded && (
                          <span className="flex items-center gap-1 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                            <BsClock />
                            Under Review
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-gray-600">Score:</span>
                          <span className="font-bold ml-2">
                            {attempt.submittedAt
                              ? `${attempt.score?.toFixed(1)}%`
                              : "Not submitted"}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Points:</span>
                          <span className="font-bold ml-2">
                            {attempt.earnedPoints || 0} /{" "}
                            {attempt.totalPoints ||
                              quiz.questions?.reduce(
                                (sum, q) => sum + q.points,
                                0
                              )}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Started:</span>
                          <span className="font-bold ml-2">
                            {new Date(attempt.startedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {attempt.submittedAt && (
                        <div className="text-sm text-gray-600">
                          Submitted:{" "}
                          {new Date(attempt.submittedAt).toLocaleString()}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      {attempt.submittedAt && (
                        <button
                          onClick={() =>
                            router.push(
                              `/dashboard/learn-and-grow/quizzes/${moduleId}/result/${attempt.uuid}`
                            )
                          }
                          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm"
                        >
                          <BsEye />
                          View Results
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 flex gap-4">
          <button
            onClick={() =>
              router.push(`/dashboard/learn-and-grow/quizzes/${moduleId}`)
            }
            className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
          >
            Back to Quizzes
          </button>

          {quiz.isPublished && (
            <button
              onClick={() =>
                router.push(
                  `/dashboard/learn-and-grow/quizzes/${moduleId}/take/${quizId}`
                )
              }
              className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90"
            >
              Take Quiz Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserAttemptsPage;
