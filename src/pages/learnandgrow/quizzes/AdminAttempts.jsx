"use client";
import { useState, useEffect } from "react";
import { useRouter } from "@/utils/navigation";
import { useParams } from "react-router-dom";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Loader from "@/components/common/Loader";
import {
  getAllAttempts,
  getQuizById,
  getAttemptDetails,
  markDescriptionAnswer,
} from "@/controllers/quiz_controller";
import { toast } from "react-hot-toast";
import { BsCheckCircle, BsXCircle, BsClock, BsEye } from "react-icons/bs";

const AdminAttemptsPage = () => {
  const { moduleId, quizId } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState([]);
  const [quiz, setQuiz] = useState(null);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [markingAnswers, setMarkingAnswers] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [quizId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [attemptsResult, quizResult] = await Promise.all([
        getAllAttempts({ quizUuid: quizId, submittedOnly: "true" }),
        getQuizById(quizId),
      ]);
      setAttempts(attemptsResult.data || []);
      setQuiz(quizResult.data);
      setLoading(false);
    } catch (error) {
      console.error("Error loading attempts:", error);
      toast.error("Failed to load attempts");
    }
  };

  const loadAttemptDetails = async (attemptUuid) => {
    try {
      const result = await getAttemptDetails(attemptUuid);
      setSelectedAttempt(result.data);

      // Initialize marking state for description answers
      const markingState = {};
      result.data.answers.forEach((answer) => {
        if (answer.question.questionType === "description") {
          markingState[answer.uuid] = {
            isCorrect: answer.isCorrect ?? false,
            pointsEarned: answer.pointsEarned ?? 0,
            feedback: answer.feedback || "",
          };
        }
      });
      setMarkingAnswers(markingState);
    } catch (error) {
      console.error("Error loading attempt details:", error);
      toast.error("Failed to load attempt details");
    }
  };

  const handleMarkAnswer = async (answerUuid) => {
    const marking = markingAnswers[answerUuid];

    try {
      setSaving(true);
      await markDescriptionAnswer(answerUuid, marking);
      toast.success("Answer marked successfully");

      // Reload attempt details
      await loadAttemptDetails(selectedAttempt.uuid);
    } catch (error) {
      console.error("Error marking answer:", error);
      toast.error("Failed to mark answer");
    } finally {
      setSaving(false);
    }
  };

  const updateMarking = (answerUuid, field, value) => {
    setMarkingAnswers({
      ...markingAnswers,
      [answerUuid]: {
        ...markingAnswers[answerUuid],
        [field]: value,
      },
    });
  };

  if (loading) return <Loader />;

  const ungradedCount = attempts.reduce((count, attempt) => {
    const hasUngraded = attempt.answers?.some(
      (ans) =>
        ans.question?.questionType === "description" && ans.isCorrect === null
    );
    return count + (hasUngraded ? 1 : 0);
  }, 0);

  return (
    <div>
      <Breadcrumb
        prevLink={`/dashboard/learn-and-grow/quizzes/${moduleId}`}
        pageName="Quiz Submissions"
        prevPage="Back to Quizzes"
      />

      {!selectedAttempt ? (
        <>
          {/* Summary */}
          <div className="bg-white rounded-lg shadow-sm border border-black/10 p-6 mb-6">
            <h1 className="text-2xl font-bold mb-4">
              {quiz.title} - All Submissions
            </h1>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Submissions</p>
                <p className="text-3xl font-bold text-blue-600">
                  {attempts.length}
                </p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Needs Grading</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {ungradedCount}
                </p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Pass Rate</p>
                <p className="text-3xl font-bold text-green-600">
                  {attempts.length > 0
                    ? (
                        (attempts.filter((a) => a.isPassed).length /
                          attempts.length) *
                        100
                      ).toFixed(0)
                    : 0}
                  %
                </p>
              </div>
            </div>
          </div>

          {/* Submissions List */}
          <div className="bg-white rounded-lg shadow-sm border border-black/10 p-6">
            <h2 className="text-xl font-bold mb-4">Student Submissions</h2>

            {attempts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No submissions yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {attempts.map((attempt) => {
                  const hasUngraded = attempt.answers?.some(
                    (ans) =>
                      ans.question?.questionType === "description" &&
                      ans.isCorrect === null
                  );

                  return (
                    <div
                      key={attempt.uuid}
                      className="border border-black/20 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-bold text-lg">
                              {attempt.user?.firstname} {attempt.user?.lastname}
                            </h3>

                            {attempt.isPassed ? (
                              <span className="flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                                <BsCheckCircle />
                                Passed
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
                                <BsXCircle />
                                Not Passed
                              </span>
                            )}

                            {hasUngraded && (
                              <span className="flex items-center gap-1 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                                <BsClock />
                                Needs Grading
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-4 gap-4 text-sm mb-2">
                            <div>
                              <span className="text-gray-600">Email:</span>
                              <span className="font-medium ml-2">
                                {attempt.user?.email}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Score:</span>
                              <span className="font-bold ml-2">
                                {Number(attempt.score || 0).toFixed(1)}%
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Points:</span>
                              <span className="font-bold ml-2">
                                {attempt.earnedPoints} / {attempt.totalPoints}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Submitted:</span>
                              <span className="font-bold ml-2">
                                {new Date(
                                  attempt.submittedAt
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => loadAttemptDetails(attempt.uuid)}
                          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                        >
                          <BsEye />
                          Review & Grade
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Detailed Review View */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-2xl font-bold mb-2">
                  {selectedAttempt.user?.firstname}{" "}
                  {selectedAttempt.user?.lastname}'s Submission
                </h1>
                <p className="text-gray-600">
                  Score:{" "}
                  <span className="font-bold">
                    {Number(selectedAttempt.score || 0).toFixed(1)}%
                  </span>{" "}
                  | Points:{" "}
                  <span className="font-bold">
                    {selectedAttempt.earnedPoints}/{selectedAttempt.totalPoints}
                  </span>{" "}
                  | Status:{" "}
                  <span
                    className={`font-bold ${
                      selectedAttempt.isPassed
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {selectedAttempt.isPassed ? "Passed" : "Not Passed"}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setSelectedAttempt(null)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Back to List
              </button>
            </div>
          </div>

          {/* Answers for Grading */}
          <div className="space-y-6">
            {selectedAttempt.answers.map((answer, index) => (
              <div key={answer.uuid} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-lg">
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

                <p className="text-gray-700 mb-4">
                  {answer.question.questionText}
                </p>

                {answer.question.questionType === "description" ? (
                  <div>
                    <div className="bg-gray-50 border rounded p-4 mb-4">
                      <p className="text-sm font-medium text-gray-600 mb-2">
                        Student's Answer:
                      </p>
                      <p className="text-gray-800">{answer.answerText}</p>
                    </div>

                    {answer.isCorrect === null ? (
                      <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                        <p className="font-medium mb-3">Grade This Answer:</p>

                        <div className="space-y-3">
                          <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2">
                              <input
                                type="radio"
                                checked={
                                  markingAnswers[answer.uuid]?.isCorrect ===
                                  true
                                }
                                onChange={() =>
                                  updateMarking(answer.uuid, "isCorrect", true)
                                }
                                className="w-4 h-4"
                              />
                              <span className="text-green-600 font-medium">
                                Correct
                              </span>
                            </label>
                            <label className="flex items-center gap-2">
                              <input
                                type="radio"
                                checked={
                                  markingAnswers[answer.uuid]?.isCorrect ===
                                  false
                                }
                                onChange={() =>
                                  updateMarking(answer.uuid, "isCorrect", false)
                                }
                                className="w-4 h-4"
                              />
                              <span className="text-red-600 font-medium">
                                Incorrect
                              </span>
                            </label>
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-1">
                              Points (Max: {answer.question.points})
                            </label>
                            <input
                              type="number"
                              min="0"
                              max={answer.question.points}
                              value={
                                markingAnswers[answer.uuid]?.pointsEarned || 0
                              }
                              onChange={(e) =>
                                updateMarking(
                                  answer.uuid,
                                  "pointsEarned",
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="w-32 border rounded px-3 py-2"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-1">
                              Feedback (Optional)
                            </label>
                            <textarea
                              value={
                                markingAnswers[answer.uuid]?.feedback || ""
                              }
                              onChange={(e) =>
                                updateMarking(
                                  answer.uuid,
                                  "feedback",
                                  e.target.value
                                )
                              }
                              className="w-full border rounded px-3 py-2"
                              rows="3"
                              placeholder="Provide feedback to the student..."
                            />
                          </div>

                          <button
                            onClick={() => handleMarkAnswer(answer.uuid)}
                            disabled={saving}
                            className="bg-primary text-white px-6 py-2 rounded hover:bg-primary/90 disabled:opacity-50"
                          >
                            {saving ? "Saving..." : "Save Grade"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`${
                          answer.isCorrect
                            ? "bg-green-50 border-green-200"
                            : "bg-red-50 border-red-200"
                        } border rounded p-4`}
                      >
                        <p className="font-medium mb-2">
                          Graded:{" "}
                          {answer.isCorrect ? "✓ Correct" : "✗ Incorrect"}
                        </p>
                        {answer.feedback && (
                          <div>
                            <p className="text-sm font-medium mb-1">
                              Feedback:
                            </p>
                            <p className="text-sm">{answer.feedback}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="space-y-2">
                      {answer.question.options.map((opt) => (
                        <div
                          key={opt.uuid}
                          className={`p-3 rounded ${
                            opt.uuid === answer.option?.uuid
                              ? answer.isCorrect
                                ? "bg-green-100 border border-green-300"
                                : "bg-red-100 border border-red-300"
                              : opt.isCorrect
                              ? "bg-green-50 border border-green-200"
                              : "bg-white border border-black/10"
                          }`}
                        >
                          {opt.uuid === answer.option?.uuid && "→ "}
                          {opt.isCorrect && "✓ "}
                          {opt.optionText}
                          {opt.isCorrect && (
                            <span className="text-xs text-green-600 ml-2">
                              (Correct)
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
        </>
      )}
    </div>
  );
};

export default AdminAttemptsPage;
