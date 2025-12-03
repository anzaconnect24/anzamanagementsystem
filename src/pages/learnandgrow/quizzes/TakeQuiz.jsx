"use client";
import { useState, useEffect } from "react";
import { useRouter } from "@/utils/navigation";
import { useParams } from "react-router-dom";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Loader from "@/components/common/Loader";
import {
  getQuizById,
  startQuizAttempt,
  submitQuiz,
} from "@/controllers/quiz_controller";
import { toast } from "react-hot-toast";

const TakeQuizPage = () => {
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

      // Start attempt
      const attemptResult = await startQuizAttempt(quizId);
      setAttemptUuid(attemptResult.data.uuid);
      setStartTime(new Date());

      setLoading(false);
    } catch (error) {
      console.error("Error loading quiz:", error);
      toast.error("Failed to load quiz");
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
    // Validate all questions are answered
    const unansweredQuestions = quiz.questions.filter(
      (q) =>
        !answers[q.uuid] ||
        (q.questionType === "description" && !answers[q.uuid].trim())
    );

    if (unansweredQuestions.length > 0) {
      toast.error(
        `Please answer all questions (${unansweredQuestions.length} remaining)`
      );
      return;
    }

    if (
      !confirm(
        "Are you sure you want to submit? You cannot change your answers after submission."
      )
    ) {
      return;
    }

    try {
      setSubmitting(true);

      // Format answers for submission
      const formattedAnswers = quiz.questions.map((question) => {
        const answer = answers[question.uuid];

        if (question.questionType === "description") {
          return {
            questionUuid: question.uuid,
            answerText: answer,
          };
        } else {
          return {
            questionUuid: question.uuid,
            optionUuid: answer,
          };
        }
      });

      const result = await submitQuiz(attemptUuid, formattedAnswers);

      toast.success("Quiz submitted successfully!");

      // Navigate to results page
      router.push(
        `/dashboard/learn-and-grow/quizzes/${moduleId}/result/${attemptUuid}`
      );
    } catch (error) {
      console.error("Error submitting quiz:", error);
      toast.error("Failed to submit quiz");
    } finally {
      setSubmitting(false);
    }
  };

  const getElapsedTime = () => {
    if (!startTime) return "00:00";
    const now = new Date();
    const diff = Math.floor((now - startTime) / 1000); // seconds
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
      2,
      "0"
    )}`;
  };

  if (loading) return <Loader />;

  const answeredCount = Object.keys(answers).filter(
    (key) =>
      answers[key] && (typeof answers[key] !== "string" || answers[key].trim())
  ).length;

  return (
    <div>
      <Breadcrumb
        prevLink={`/dashboard/learn-and-grow/quizzes/${moduleId}`}
        pageName={quiz.title}
        prevPage="Back to Quizzes"
      />

      {/* Quiz Header */}
      <div className="bg-white rounded-lg shadow-sm border border-black/10 p-6 mb-6">
        <h1 className="text-2xl font-bold mb-2">{quiz.title}</h1>
        {quiz.description && (
          <p className="text-gray-600 mb-4">{quiz.description}</p>
        )}

        <div className="flex gap-6 text-sm">
          <div>
            <span className="text-gray-500">Total Questions:</span>
            <span className="font-medium ml-2">{quiz.questions.length}</span>
          </div>
          <div>
            <span className="text-gray-500">Passing Score:</span>
            <span className="font-medium ml-2">{quiz.passingScore}%</span>
          </div>
          <div>
            <span className="text-gray-500">Progress:</span>
            <span className="font-medium ml-2">
              {answeredCount} / {quiz.questions.length} answered
            </span>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-6 mb-6">
        {quiz.questions.map((question, index) => (
          <div key={question.uuid} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-lg">
                Question {index + 1}
                {answers[question.uuid] && (
                  <span className="ml-2 text-green-500 text-sm">✓</span>
                )}
              </h3>
              <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded">
                {question.points} {question.points === 1 ? "point" : "points"}
              </span>
            </div>

            <p className="text-gray-700 mb-4">{question.questionText}</p>

            {question.questionType === "multiple_choice" && (
              <div className="space-y-2">
                {question.options.map((option) => (
                  <label
                    key={option.uuid}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                      answers[question.uuid] === option.uuid
                        ? "border-primary bg-primary/5"
                        : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${question.uuid}`}
                      value={option.uuid}
                      checked={answers[question.uuid] === option.uuid}
                      onChange={(e) =>
                        handleAnswerChange(question.uuid, e.target.value)
                      }
                      className="w-4 h-4 text-primary"
                    />
                    <span className="ml-3">{option.optionText}</span>
                  </label>
                ))}
              </div>
            )}

            {question.questionType === "true_false" && (
              <div className="space-y-2">
                {question.options.map((option) => (
                  <label
                    key={option.uuid}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                      answers[question.uuid] === option.uuid
                        ? "border-primary bg-primary/5"
                        : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${question.uuid}`}
                      value={option.uuid}
                      checked={answers[question.uuid] === option.uuid}
                      onChange={(e) =>
                        handleAnswerChange(question.uuid, e.target.value)
                      }
                      className="w-4 h-4 text-primary"
                    />
                    <span className="ml-3">{option.optionText}</span>
                  </label>
                ))}
              </div>
            )}

            {question.questionType === "description" && (
              <textarea
                value={answers[question.uuid] || ""}
                onChange={(e) =>
                  handleAnswerChange(question.uuid, e.target.value)
                }
                className="w-full border rounded-lg px-4 py-3"
                rows="5"
                placeholder="Type your answer here..."
              />
            )}
          </div>
        ))}
      </div>

      {/* Submit Section */}
      <div className="bg-white rounded-lg shadow p-6 sticky bottom-0">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            <p>
              <span className="font-medium">{answeredCount}</span> of{" "}
              <span className="font-medium">{quiz.questions.length}</span>{" "}
              questions answered
            </p>
            {answeredCount < quiz.questions.length && (
              <p className="text-orange-600">
                {quiz.questions.length - answeredCount} question(s) remaining
              </p>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting || answeredCount < quiz.questions.length}
            className="bg-primary text-white px-8 py-3 rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {submitting ? "Submitting..." : "Submit Quiz"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TakeQuizPage;
