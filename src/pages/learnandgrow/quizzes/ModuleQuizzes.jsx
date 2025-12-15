"use client";
import { useContext, useEffect, useState } from "react";
import { useRouter } from "@/utils/navigation";
import { UserContext } from "../../../layouts/DashboardLayout";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Loader from "@/components/common/Loader";
import {
  BsPlus,
  BsPencil,
  BsTrash,
  BsEye,
  BsCheckCircle,
  BsArrowClockwise,
} from "react-icons/bs";
import {
  getQuizzesByModule,
  deleteQuiz,
  togglePublishQuiz,
  getUserAttempts,
} from "@/controllers/quiz_controller";
import { getModule } from "@/controllers/modules_controller";
import { useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useTranslation } from "@/locales";

const ModuleQuizzesPage = () => {
  const { t } = useTranslation();
  const { moduleId } = useParams();
  const [quizzes, setQuizzes] = useState([]);
  const [module, setModule] = useState(null);
  const { userDetails } = useContext(UserContext);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [userAttempts, setUserAttempts] = useState([]);
  const router = useRouter();

  const isAdmin = ["Admin", "Staff"].includes(userDetails?.role);

  useEffect(() => {
    loadData();
  }, [moduleId, activeTab]);

  // Reload data when component comes back into focus (e.g., after navigating back)
  useEffect(() => {
    const handleFocus = () => {
      console.log("Window focused, reloading data...");
      loadData();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [moduleId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [moduleData, quizzesData] = await Promise.all([
        getModule(moduleId),
        getQuizzesByModule(moduleId),
      ]);
      setModule(moduleData);
      setQuizzes(quizzesData.data || []);

      // Load user attempts if not admin
      if (!isAdmin) {
        try {
          const attemptsData = await getUserAttempts();
          console.log("Loaded user attempts:", attemptsData.data);
          setUserAttempts(attemptsData.data || []);
        } catch (error) {
          console.error("Error loading user attempts:", error);
          setUserAttempts([]);
        }
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error(t("quizzes.failedToLoadQuizzes"));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (uuid) => {
    if (!confirm(t("quizzes.deleteQuizConfirm"))) return;

    try {
      await deleteQuiz(uuid);
      toast.success(t("quizzes.quizDeleted"));
      loadData();
    } catch (error) {
      console.error("Error deleting quiz:", error);
      toast.error(t("quizzes.failedToDeleteQuiz"));
    }
  };

  const handleTogglePublish = async (uuid) => {
    try {
      const result = await togglePublishQuiz(uuid);
      toast.success(result.message);
      loadData();
    } catch (error) {
      console.error("Error toggling publish:", error);
      toast.error(t("quizzes.failedToUpdateQuiz"));
    }
  };

  // Check if user has completed a quiz
  const getUserLastAttempt = (quizUuid) => {
    const attempts = userAttempts.filter(
      (attempt) => attempt.quiz?.uuid === quizUuid && attempt.submittedAt
    );
    if (attempts.length === 0) return null;
    // Return the most recent attempt
    const lastAttempt = attempts.sort(
      (a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)
    )[0];
    console.log(
      `Quiz ${quizUuid} - Last attempt status:`,
      lastAttempt.gradingStatus
    );
    return lastAttempt;
  };

  const filteredQuizzes = quizzes.filter((quiz) => {
    if (isAdmin) {
      if (activeTab === "published") return quiz.isPublished;
      if (activeTab === "draft") return !quiz.isPublished;
      return true;
    } else {
      // For entrepreneurs
      if (activeTab === "attempted") {
        return getUserLastAttempt(quiz.uuid) !== null;
      }
      return quiz.isPublished; // Show only published quizzes in "all" tab
    }
  });

  return loading ? (
    <Loader />
  ) : (
    <div>
      <Breadcrumb
        prevLink={``}
        pageName={`${module?.title || "Module"} - ${t(
          "quizzes.moduleQuizzes"
        )}`}
        prevPage={t("quizzes.backToModule")}
      />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t("quizzes.moduleQuizzes")}</h1>
        <div className="flex gap-2">
          {!isAdmin && (
            <button
              onClick={() => {
                toast.success(t("common.refresh") + "...");
                loadData();
              }}
              className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
            >
              <BsArrowClockwise size={16} />
              {t("common.refresh")}
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() =>
                router.push(`/dashboard/learn-and-grow/quizzes/${moduleId}/new`)
              }
              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90"
            >
              <BsPlus size={20} />
              {t("quizzes.createQuiz")}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-black/10 mb-6">
        {isAdmin ? (
          <>
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "all"
                  ? "border-b-2 border-primary text-primary"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t("quizzes.allQuizzes")} ({quizzes.length})
            </button>
            <button
              onClick={() => setActiveTab("published")}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "published"
                  ? "border-b-2 border-primary text-primary"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t("quizzes.published")} (
              {quizzes.filter((q) => q.isPublished).length})
            </button>
            <button
              onClick={() => setActiveTab("draft")}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "draft"
                  ? "border-b-2 border-primary text-primary"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t("quizzes.draft")} (
              {quizzes.filter((q) => !q.isPublished).length})
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "all"
                  ? "border-b-2 border-primary text-primary"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t("quizzes.allQuizzes")} (
              {quizzes.filter((q) => q.isPublished).length})
            </button>
            <button
              onClick={() => setActiveTab("attempted")}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "attempted"
                  ? "border-b-2 border-primary text-primary"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t("quizzes.attempted")} (
              {
                quizzes.filter(
                  (q) => q.isPublished && getUserLastAttempt(q.uuid) !== null
                ).length
              }
              )
            </button>
          </>
        )}
      </div>

      {/* Quizzes List */}
      {filteredQuizzes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-black/10 shadow-sm">
          <p className="text-gray-500 mb-4">{t("quizzes.noQuizzesFound")}</p>
          {isAdmin && (
            <button
              onClick={() =>
                router.push(`/dashboard/learn-and-grow/quizzes/${moduleId}/new`)
              }
              className="text-primary hover:underline"
            >
              {t("quizzes.createFirstQuiz")}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuizzes.map((quiz) => (
            <div
              key={quiz.uuid}
              className="bg-white border border-black/10 rounded-lg p-6 hover:shadow-lg transition-all duration-200 hover:border-black/20"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2">{quiz.title}</h3>
                  <p className="text-gray-600 text-sm line-clamp-2">
                    {quiz.description || "No description"}
                  </p>
                </div>
                {quiz.isPublished && (
                  <BsCheckCircle
                    className="text-green-500 flex-shrink-0 ml-2"
                    size={20}
                  />
                )}
              </div>

              <div className="space-y-2 mb-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">
                    {t("quizzes.questions")}:
                  </span>
                  <span className="font-medium">
                    {quiz.questions?.length || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">
                    {t("quizzes.passingScore")}:
                  </span>
                  <span className="font-medium">{quiz.passingScore}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t("common.status")}:</span>
                  <span
                    className={`font-medium ${
                      quiz.isPublished ? "text-green-600" : "text-orange-600"
                    }`}
                  >
                    {quiz.isPublished
                      ? t("quizzes.published")
                      : t("quizzes.draft")}
                  </span>
                </div>
              </div>

              {isAdmin ? (
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      router.push(
                        `/dashboard/learn-and-grow/quizzes/${moduleId}/edit/${quiz.uuid}`
                      )
                    }
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 text-sm transition-colors"
                  >
                    <BsPencil size={14} />
                    {t("common.edit")}
                  </button>
                  <button
                    onClick={() =>
                      router.push(
                        `/dashboard/learn-and-grow/quizzes/${moduleId}/attempts/${quiz.uuid}`
                      )
                    }
                    className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 text-sm transition-colors"
                  >
                    <BsEye size={14} />
                    {t("quizzes.viewAttempts")}
                  </button>
                  <button
                    onClick={() => handleDelete(quiz.uuid)}
                    className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    <BsTrash size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  {quiz.isPublished &&
                    (() => {
                      const lastAttempt = getUserLastAttempt(quiz.uuid);

                      if (lastAttempt) {
                        // Check if quiz is pending grading
                        if (lastAttempt.gradingStatus === "pending_grading") {
                          return (
                            <button
                              disabled
                              className="flex-1 flex items-center justify-center gap-2 bg-yellow-500 text-white px-4 py-2 rounded-lg cursor-not-allowed"
                            >
                              <BsCheckCircle size={16} />
                              {t("quizzes.pendingGrading")}
                            </button>
                          );
                        }

                        // Show view results for graded quizzes
                        return (
                          <button
                            onClick={() =>
                              router.push(
                                `/dashboard/learn-and-grow/quizzes/${moduleId}/result/${lastAttempt.uuid}`
                              )
                            }
                            className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                          >
                            <BsCheckCircle size={16} />
                            {t("quizzes.viewResult")}
                          </button>
                        );
                      }

                      // Show take quiz if no attempts
                      return (
                        <button
                          onClick={() =>
                            router.push(
                              `/dashboard/learn-and-grow/quizzes/${moduleId}/take/${quiz.uuid}`
                            )
                          }
                          className="flex-1 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                        >
                          {t("quizzes.startQuiz")}
                        </button>
                      );
                    })()}
                  <button
                    onClick={() =>
                      router.push(
                        `/dashboard/learn-and-grow/quizzes/${moduleId}/my-attempts/${quiz.uuid}`
                      )
                    }
                    className="flex-1 flex items-center justify-center gap-2 bg-gray-500 text-white px-3 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    <BsEye size={14} />
                    {t("quizzes.myQuizAttempts")}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ModuleQuizzesPage;
