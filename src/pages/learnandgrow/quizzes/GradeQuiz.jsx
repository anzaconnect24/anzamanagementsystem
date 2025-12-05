"use client";
import { useState, useEffect, useContext } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Loader from "@/components/common/Loader";
import axios from "axios";
import { toast } from "react-hot-toast";
import moment from "moment";
import { UserContext } from "../../../layouts/DashboardLayout";
import { server_url } from "../../../utils/endpoint";
import { getUser } from "../../../utils/local_storage";
import { useParams } from "react-router-dom";
import { useRouter } from "../../../utils/navigation";
import { BsCheckCircle, BsXCircle, BsClock } from "react-icons/bs";

const GradeQuiz = () => {
  const router = useRouter();
  const { attemptUuid } = useParams();
  const { userDetails } = useContext(UserContext);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(null);
  const [grades, setGrades] = useState({}); // {answerUuid: {isCorrect, pointsEarned, feedback}}
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Check if user is admin/instructor
    if (userDetails?.role !== "Admin" && userDetails?.role !== "Staff") {
      toast.error("You don't have permission to access this page");
      router.push("/dashboard");
      return;
    }
    loadAttemptDetails();
  }, [attemptUuid]);

  const loadAttemptDetails = async () => {
    try {
      const user = getUser();

      setLoading(true);
      const response = await axios.get(
        `${server_url}/quiz/admin/attempts/${attemptUuid}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user && user.ACCESS_TOKEN}`,
          },
        }
      );

      setAttempt(response.data.data);

      // Initialize grades object for description questions only
      const initialGrades = {};
      response.data.data.answers.forEach((answer) => {
        if (answer.question.questionType === "description") {
          initialGrades[answer.uuid] = {
            isCorrect: answer.isCorrect !== null ? answer.isCorrect : false,
            pointsEarned:
              answer.pointsEarned !== null
                ? answer.pointsEarned
                : answer.question.points,
            feedback: answer.feedback || "",
          };
        }
      });
      setGrades(initialGrades);

      setLoading(false);
    } catch (error) {
      console.error("Error loading attempt details:", error);
      toast.error("Failed to load quiz attempt");
      setLoading(false);
    }
  };

  const handleGradeChange = (answerUuid, field, value) => {
    setGrades({
      ...grades,
      [answerUuid]: {
        ...grades[answerUuid],
        [field]: value,
      },
    });
  };

  const authHeaders = () => {
    const user = getUser();
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${user && user.ACCESS_TOKEN}`,
    };
  };

  const handleSubmitGrades = async () => {
    try {
      setSubmitting(true);

      // Get only description answers that need grading
      const descriptionAnswers = attempt.answers.filter(
        (answer) => answer.question.questionType === "description"
      );

      // Validate that all description answers have been graded
      const missingGrades = descriptionAnswers.filter(
        (answer) => !grades[answer.uuid]
      );

      if (missingGrades.length > 0) {
        toast.error("Please grade all description questions before submitting");
        setSubmitting(false);
        return;
      }

      // Format grades for submission - only send description answers
      const formattedGrades = descriptionAnswers.map((answer) => ({
        answerUuid: answer.uuid,
        isCorrect: grades[answer.uuid].isCorrect,
        pointsEarned: parseFloat(grades[answer.uuid].pointsEarned) || 0,
        feedback: grades[answer.uuid].feedback || "",
      }));

      console.log("Submitting grades:", formattedGrades);

      await axios.post(
        `${server_url}/quiz/admin/attempts/${attemptUuid}/grade`,
        { answers: formattedGrades },
        { headers: authHeaders() }
      );

      toast.success("Quiz graded successfully! Status updated to 'Graded'");
      router.back();
    } catch (error) {
      console.error("Error grading quiz:", error);
      toast.error(
        error.response?.data?.message ||
          "Failed to grade quiz. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader />;
  if (!attempt) return <div>Attempt not found</div>;

  return (
    <div>
      <Breadcrumb prevLink="" pageName="Grade Quiz Attempt" prevPage="Back" />

      {/* Student Info Card */}
      <div className="bg-white rounded-lg shadow-sm border border-black/10 p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">{attempt.quiz.title}</h1>
            <p className="text-gray-600 mb-1">
              <span className="font-medium">Student:</span> {attempt.user.name}
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Email:</span> {attempt.user.email}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 mb-1">Submitted</p>
            <p className="font-medium">
              {moment(attempt.submittedAt).format("MMM DD, YYYY")}
            </p>
            <p className="text-sm text-gray-500">
              {moment(attempt.submittedAt).format("HH:mm")}
            </p>
          </div>
        </div>

        {/* Current Score */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Current Score</p>
            <p className="text-2xl font-bold text-blue-600">
              {Number(attempt.score || 0).toFixed(1)}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Points</p>
            <p className="text-2xl font-bold">
              {attempt.earnedPoints} / {attempt.totalPoints}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Status</p>
            <p
              className={`text-lg font-bold ${
                attempt.isPassed ? "text-green-600" : "text-red-600"
              }`}
            >
              {attempt.isPassed ? "Passed" : "Not Passed"}
            </p>
          </div>
        </div>
      </div>

      {/* All Questions */}
      <div className="space-y-6">
        {attempt.answers.map((answer, index) => {
          const isDescription = answer.question.questionType === "description";
          const maxPoints = answer.question.points;

          return (
            <div
              key={answer.uuid}
              className="bg-white rounded-lg shadow-sm border border-black/10 p-6"
            >
              {/* Question Header */}
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  Question {index + 1}
                  {answer.isCorrect === true && (
                    <BsCheckCircle className="text-green-600" />
                  )}
                  {answer.isCorrect === false && (
                    <BsXCircle className="text-red-600" />
                  )}
                  {answer.isCorrect === null && isDescription && (
                    <BsClock className="text-yellow-600" />
                  )}
                </h3>
                <span className="text-sm font-medium">
                  {answer.pointsEarned || 0} / {maxPoints} pts
                </span>
              </div>

              {/* Question Text */}
              <p className="text-gray-700 mb-4">
                {answer.question.questionText}
              </p>

              {/* Answer Section */}
              {isDescription ? (
                /* Description Type Question */
                <div>
                  <div className="bg-gray-50 border rounded-lg p-4 mb-4">
                    <p className="text-sm font-medium text-gray-600 mb-2">
                      Student's Answer:
                    </p>
                    <p className="text-gray-800">{answer.answerText}</p>
                  </div>

                  {/* Grading Interface */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="font-medium mb-3 text-gray-800">
                      Grade This Answer:
                    </p>

                    <div className="space-y-3">
                      {/* Correct/Incorrect Radio */}
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            checked={grades[answer.uuid]?.isCorrect === true}
                            onChange={() =>
                              handleGradeChange(answer.uuid, "isCorrect", true)
                            }
                            className="w-4 h-4"
                          />
                          <span className="text-green-600 font-medium">
                            ✓ Correct
                          </span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            checked={grades[answer.uuid]?.isCorrect === false}
                            onChange={() =>
                              handleGradeChange(answer.uuid, "isCorrect", false)
                            }
                            className="w-4 h-4"
                          />
                          <span className="text-red-600 font-medium">
                            ✗ Incorrect
                          </span>
                        </label>
                      </div>

                      {/* Points Input */}
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Points Earned (Max: {maxPoints})
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={maxPoints}
                          step="0.5"
                          value={grades[answer.uuid]?.pointsEarned || 0}
                          onChange={(e) =>
                            handleGradeChange(
                              answer.uuid,
                              "pointsEarned",
                              Math.min(
                                parseFloat(e.target.value) || 0,
                                maxPoints
                              )
                            )
                          }
                          className="w-32 border border-gray-300 rounded-lg px-3 py-2"
                        />
                      </div>

                      {/* Feedback Textarea */}
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Feedback (Optional)
                        </label>
                        <textarea
                          value={grades[answer.uuid]?.feedback || ""}
                          onChange={(e) =>
                            handleGradeChange(
                              answer.uuid,
                              "feedback",
                              e.target.value
                            )
                          }
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          rows="3"
                          placeholder="Provide feedback to the student..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Multiple Choice/True-False Question */
                <div className="space-y-2">
                  {answer.question.options?.map((opt) => {
                    const isSelected = opt.uuid === answer.option?.uuid;
                    const isCorrectOption = opt.isCorrect;

                    return (
                      <div
                        key={opt.uuid}
                        className={`p-3 rounded-lg border ${
                          isSelected && answer.isCorrect
                            ? "bg-green-100 border-green-300"
                            : isSelected && !answer.isCorrect
                            ? "bg-red-100 border-red-300"
                            : isCorrectOption
                            ? "bg-green-50 border-green-200"
                            : "bg-white border-gray-200"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isSelected && <span className="font-bold">→</span>}
                          {isCorrectOption && (
                            <BsCheckCircle className="text-green-600" />
                          )}
                          <span>{opt.optionText}</span>
                          {isCorrectOption && (
                            <span className="text-xs text-green-600 ml-auto">
                              (Correct Answer)
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Show existing feedback if graded */}
              {!isDescription && answer.feedback && (
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-blue-900 mb-1">
                    Feedback:
                  </p>
                  <p className="text-sm text-blue-800">{answer.feedback}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Finish Grading Section */}
      <div className="mt-8 bg-white rounded-lg shadow-sm border border-black/10 p-6">
        <div className="mb-4">
          <h3 className="text-lg font-bold mb-2">Complete Grading</h3>
          <p className="text-gray-600 text-sm">
            Review all your grades above. Once you click "Finish Grading", the
            quiz status will be updated to "Graded" and the student will be able
            to view their results with your feedback.
          </p>
        </div>

        <div className="flex justify-end items-center gap-4">
          <button
            onClick={() => router.back()}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmitGrades}
            disabled={submitting}
            className="px-8 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {submitting ? (
              <>
                <svg
                  className="animate-spin h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Submitting Grades...
              </>
            ) : (
              "Finish Grading"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GradeQuiz;
