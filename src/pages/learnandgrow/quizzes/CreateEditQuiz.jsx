"use client";
import { useState, useEffect } from "react";
import { useRouter } from "@/utils/navigation";
import { useParams } from "react-router-dom";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Loader from "@/components/common/Loader";
import { BsPlus, BsTrash, BsArrowLeft, BsCheckCircle } from "react-icons/bs";
import {
  createQuiz,
  addQuestion,
  getQuizById,
  updateQuiz,
  updateQuestion,
  togglePublishQuiz,
} from "@/controllers/quiz_controller";
import { getModule } from "@/controllers/modules_controller";
import { toast } from "react-hot-toast";

const CreateEditQuizPage = () => {
  const { moduleId, quizId } = useParams();
  const router = useRouter();
  const isEdit = !!quizId;

  const [loading, setLoading] = useState(isEdit);
  const [module, setModule] = useState(null);
  const [saving, setSaving] = useState(false);

  const [quizData, setQuizData] = useState({
    title: "",
    description: "",
    passingScore: 70,
  });

  const [isPublished, setIsPublished] = useState(false);

  const [questions, setQuestions] = useState([]);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState({
    questionText: "",
    questionType: "multiple_choice",
    points: 1,
    options: [
      { optionText: "", isCorrect: false },
      { optionText: "", isCorrect: false },
    ],
  });
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(null);

  useEffect(() => {
    loadData();
  }, [moduleId, quizId]);

  const loadData = async () => {
    try {
      const moduleData = await getModule(moduleId);
      setModule(moduleData);

      if (isEdit) {
        const quizData = await getQuizById(quizId);
        setQuizData({
          title: quizData.data.title,
          description: quizData.data.description || "",
          passingScore: quizData.data.passingScore,
        });
        setIsPublished(quizData.data.isPublished);
        setQuestions(quizData.data.questions || []);
        setLoading(false);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data");
    }
  };

  const handleQuizSubmit = async () => {
    if (!quizData.title.trim()) {
      toast.error("Please enter a quiz title");
      return;
    }

    try {
      setSaving(true);
      if (isEdit) {
        await updateQuiz(quizId, quizData);
        toast.success("Quiz updated successfully");
      } else {
        const result = await createQuiz({ ...quizData, moduleId });
        toast.success("Quiz created successfully");
        router.push(
          `/dashboard/learn-and-grow/quizzes/${moduleId}/edit/${result.data.uuid}`
        );
      }
    } catch (error) {
      console.error("Error saving quiz:", error);
      toast.error("Failed to save quiz");
    } finally {
      setSaving(false);
    }
  };

  const handleAddOption = () => {
    setCurrentQuestion({
      ...currentQuestion,
      options: [
        ...currentQuestion.options,
        { optionText: "", isCorrect: false },
      ],
    });
  };

  const handleRemoveOption = (index) => {
    const newOptions = currentQuestion.options.filter((_, i) => i !== index);
    setCurrentQuestion({ ...currentQuestion, options: newOptions });
  };

  const handleOptionChange = (index, field, value) => {
    const newOptions = [...currentQuestion.options];
    newOptions[index][field] = value;

    // For true/false, ensure only one correct answer
    if (
      currentQuestion.questionType === "true_false" &&
      field === "isCorrect" &&
      value
    ) {
      newOptions.forEach((opt, i) => {
        if (i !== index) opt.isCorrect = false;
      });
    }

    setCurrentQuestion({ ...currentQuestion, options: newOptions });
  };

  const handleQuestionTypeChange = (type) => {
    let options = currentQuestion.options;

    if (type === "true_false") {
      options = [
        { optionText: "True", isCorrect: false },
        { optionText: "False", isCorrect: false },
      ];
    } else if (type === "description") {
      options = [];
    }

    setCurrentQuestion({ ...currentQuestion, questionType: type, options });
  };

  const handleSaveQuestion = async () => {
    if (!currentQuestion.questionText.trim()) {
      toast.error("Please enter a question");
      return;
    }

    if (currentQuestion.questionType !== "description") {
      if (currentQuestion.options.length < 2) {
        toast.error("Please add at least 2 options");
        return;
      }
      if (!currentQuestion.options.some((opt) => opt.isCorrect)) {
        toast.error("Please mark at least one correct answer");
        return;
      }
      if (currentQuestion.options.some((opt) => !opt.optionText.trim())) {
        toast.error("Please fill in all option texts");
        return;
      }
    }

    try {
      if (!isEdit) {
        toast.error("Please save the quiz first before adding questions");
        return;
      }

      setSaving(true);

      if (editingQuestionIndex !== null) {
        // Update existing question
        const question = questions[editingQuestionIndex];
        await updateQuestion(question.uuid, currentQuestion);
        toast.success("Question updated successfully");
      } else {
        // Add new question
        await addQuestion(quizId, currentQuestion);
        toast.success("Question added successfully");
      }

      // Reload quiz data
      await loadData();

      // Reset form
      setCurrentQuestion({
        questionText: "",
        questionType: "multiple_choice",
        points: 1,
        options: [
          { optionText: "", isCorrect: false },
          { optionText: "", isCorrect: false },
        ],
      });
      setShowQuestionForm(false);
      setEditingQuestionIndex(null);
    } catch (error) {
      console.error("Error saving question:", error);
      toast.error("Failed to save question");
    } finally {
      setSaving(false);
    }
  };

  const handleEditQuestion = (index) => {
    const question = questions[index];
    setCurrentQuestion({
      questionText: question.questionText,
      questionType: question.questionType,
      points: question.points,
      options: question.options || [],
    });
    setEditingQuestionIndex(index);
    setShowQuestionForm(true);
  };

  const handleCancelQuestion = () => {
    setCurrentQuestion({
      questionText: "",
      questionType: "multiple_choice",
      points: 1,
      options: [
        { optionText: "", isCorrect: false },
        { optionText: "", isCorrect: false },
      ],
    });
    setShowQuestionForm(false);
    setEditingQuestionIndex(null);
  };

  if (loading) return <Loader />;

  return (
    <div>
      <Breadcrumb
        prevLink={`/dashboard/learn-and-grow/quizzes/${moduleId}`}
        pageName={isEdit ? "Edit Quiz" : "Create New Quiz"}
        prevPage="Back to Quizzes"
      />

      <div className="bg-white rounded-lg shadow-sm border border-black/10 p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Quiz Details</h2>
          {isEdit && (
            <button
              onClick={async () => {
                try {
                  const result = await togglePublishQuiz(quizId);
                  toast.success(result.message);
                  setIsPublished(!isPublished);
                } catch (error) {
                  console.error("Error toggling publish:", error);
                  toast.error("Failed to update quiz status");
                }
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isPublished
                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                  : "bg-orange-100 text-orange-700 hover:bg-orange-200"
              }`}
            >
              {isPublished ? (
                <>
                  <BsCheckCircle size={16} />
                  Published
                </>
              ) : (
                "📤 Publish Quiz"
              )}
            </button>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Quiz Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={quizData.title}
              onChange={(e) =>
                setQuizData({ ...quizData, title: e.target.value })
              }
              className="w-full border border-black/20 rounded-lg px-4 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
              placeholder="Enter quiz title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              value={quizData.description}
              onChange={(e) =>
                setQuizData({ ...quizData, description: e.target.value })
              }
              className="w-full border border-black/20 rounded-lg px-4 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
              rows="3"
              placeholder="Enter quiz description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Passing Score (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={quizData.passingScore}
              onChange={(e) =>
                setQuizData({
                  ...quizData,
                  passingScore: parseInt(e.target.value) || 0,
                })
              }
              className="w-full border border-black/20 rounded-lg px-4 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
            />
          </div>

          <button
            onClick={handleQuizSubmit}
            disabled={saving}
            className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? "Saving..." : isEdit ? "Update Quiz" : "Create Quiz"}
          </button>
        </div>
      </div>

      {isEdit && (
        <div className="bg-white rounded-lg shadow-sm border border-black/10 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              Questions ({questions.length})
            </h2>
            {!showQuestionForm && (
              <button
                onClick={() => setShowQuestionForm(true)}
                className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90"
              >
                <BsPlus size={20} />
                Add Question
              </button>
            )}
          </div>

          {showQuestionForm && (
            <div className="border border-black/20 rounded-lg p-4 mb-6 bg-gray-50">
              <h3 className="font-bold mb-4">
                {editingQuestionIndex !== null
                  ? "Edit Question"
                  : "New Question"}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Question Text <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={currentQuestion.questionText}
                    onChange={(e) =>
                      setCurrentQuestion({
                        ...currentQuestion,
                        questionText: e.target.value,
                      })
                    }
                    className="w-full border border-black/20 rounded-lg px-4 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                    rows="2"
                    placeholder="Enter your question"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Question Type
                    </label>
                    <select
                      value={currentQuestion.questionType}
                      onChange={(e) => handleQuestionTypeChange(e.target.value)}
                      className="w-full border border-black/20 rounded-lg px-4 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                    >
                      <option value="multiple_choice">Multiple Choice</option>
                      <option value="true_false">True/False</option>
                      <option value="description">Description</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Points
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={currentQuestion.points}
                      onChange={(e) =>
                        setCurrentQuestion({
                          ...currentQuestion,
                          points: parseInt(e.target.value) || 1,
                        })
                      }
                      className="w-full border border-black/20 rounded-lg px-4 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                    />
                  </div>
                </div>

                {currentQuestion.questionType !== "description" && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Options
                    </label>
                    <div className="space-y-2">
                      {currentQuestion.options.map((option, index) => (
                        <div key={index} className="flex gap-2 items-center">
                          <input
                            type="checkbox"
                            checked={option.isCorrect}
                            onChange={(e) =>
                              handleOptionChange(
                                index,
                                "isCorrect",
                                e.target.checked
                              )
                            }
                            className="w-5 h-5"
                            title="Mark as correct answer"
                          />
                          <input
                            type="text"
                            value={option.optionText}
                            onChange={(e) =>
                              handleOptionChange(
                                index,
                                "optionText",
                                e.target.value
                              )
                            }
                            className="flex-1 border border-black/20 rounded-lg px-4 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                            placeholder={`Option ${index + 1}`}
                            disabled={
                              currentQuestion.questionType === "true_false"
                            }
                          />
                          {currentQuestion.questionType !== "true_false" &&
                            currentQuestion.options.length > 2 && (
                              <button
                                onClick={() => handleRemoveOption(index)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <BsTrash size={18} />
                              </button>
                            )}
                        </div>
                      ))}
                    </div>
                    {currentQuestion.questionType !== "true_false" && (
                      <button
                        onClick={handleAddOption}
                        className="mt-2 text-primary hover:underline text-sm"
                      >
                        + Add Option
                      </button>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={handleSaveQuestion}
                    disabled={saving}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : editingQuestionIndex !== null
                      ? "Update"
                      : "Add"}{" "}
                    Question
                  </button>
                  <button
                    onClick={handleCancelQuestion}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Questions List */}
          <div className="space-y-4">
            {questions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No questions yet. Add your first question above.
              </p>
            ) : (
              questions.map((question, index) => (
                <div
                  key={question.uuid}
                  className="border border-black/10 rounded-lg p-4 hover:border-black/20 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <span className="text-sm text-gray-500">
                        Question {index + 1}
                      </span>
                      <h4 className="font-medium">{question.questionText}</h4>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {question.questionType.replace("_", " ")}
                      </span>
                      <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                        {question.points} pts
                      </span>
                      <button
                        onClick={() => handleEditQuestion(index)}
                        className="text-blue-500 hover:text-blue-700 text-sm"
                      >
                        Edit
                      </button>
                    </div>
                  </div>

                  {question.options && question.options.length > 0 && (
                    <div className="mt-2 ml-4 space-y-1">
                      {question.options.map((option, optIndex) => (
                        <div
                          key={optIndex}
                          className={`text-sm ${
                            option.isCorrect
                              ? "text-green-600 font-medium"
                              : "text-gray-600"
                          }`}
                        >
                          {option.isCorrect ? "✓" : "○"} {option.optionText}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="mt-6 flex gap-2">
            <button
              onClick={() =>
                router.push(`/dashboard/learn-and-grow/quizzes/${moduleId}`)
              }
              className="flex items-center gap-2 bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
            >
              <BsArrowLeft />
              Back to Quizzes
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateEditQuizPage;
