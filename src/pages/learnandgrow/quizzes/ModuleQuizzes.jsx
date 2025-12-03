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
} from "react-icons/bs";
import {
  getQuizzesByModule,
  deleteQuiz,
  togglePublishQuiz,
} from "@/controllers/quiz_controller";
import { getModule } from "@/controllers/modules_controller";
import { useParams } from "react-router-dom";
import { toast } from "react-hot-toast";

const ModuleQuizzesPage = () => {
  const { moduleId } = useParams();
  const [quizzes, setQuizzes] = useState([]);
  const [module, setModule] = useState(null);
  const { userDetails } = useContext(UserContext);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const router = useRouter();

  useEffect(() => {
    loadData();
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
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load quizzes");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (uuid) => {
    if (!confirm("Are you sure you want to delete this quiz?")) return;

    try {
      await deleteQuiz(uuid);
      toast.success("Quiz deleted successfully");
      loadData();
    } catch (error) {
      console.error("Error deleting quiz:", error);
      toast.error("Failed to delete quiz");
    }
  };

  const handleTogglePublish = async (uuid) => {
    try {
      const result = await togglePublishQuiz(uuid);
      toast.success(result.message);
      loadData();
    } catch (error) {
      console.error("Error toggling publish:", error);
      toast.error("Failed to update quiz");
    }
  };

  const isAdmin = ["Admin", "Staff"].includes(userDetails?.role);

  const filteredQuizzes = quizzes.filter((quiz) => {
    if (activeTab === "published") return quiz.isPublished;
    if (activeTab === "draft") return !quiz.isPublished;
    return true;
  });

  return loading ? (
    <Loader />
  ) : (
    <div>
      <Breadcrumb
        prevLink={`/learn-and-grow/modules/${module?.course}`}
        pageName={`${module?.title || "Module"} - Quizzes`}
        prevPage="Back to Module"
      />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Module Quizzes</h1>
        {isAdmin && (
          <button
            onClick={() =>
              router.push(`/dashboard/learn-and-grow/quizzes/${moduleId}/new`)
            }
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90"
          >
            <BsPlus size={20} />
            Create New Quiz
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-black/10 mb-6">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "all"
              ? "border-b-2 border-primary text-primary"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          All Quizzes ({quizzes.length})
        </button>
        <button
          onClick={() => setActiveTab("published")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "published"
              ? "border-b-2 border-primary text-primary"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Published ({quizzes.filter((q) => q.isPublished).length})
        </button>
        <button
          onClick={() => setActiveTab("draft")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "draft"
              ? "border-b-2 border-primary text-primary"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Draft ({quizzes.filter((q) => !q.isPublished).length})
        </button>
      </div>

      {/* Quizzes List */}
      {filteredQuizzes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-black/10 shadow-sm">
          <p className="text-gray-500 mb-4">No quizzes found</p>
          {isAdmin && (
            <button
              onClick={() =>
                router.push(`/dashboard/learn-and-grow/quizzes/${moduleId}/new`)
              }
              className="text-primary hover:underline"
            >
              Create your first quiz
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
                  <span className="text-gray-500">Questions:</span>
                  <span className="font-medium">
                    {quiz.questions?.length || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Passing Score:</span>
                  <span className="font-medium">{quiz.passingScore}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status:</span>
                  <span
                    className={`font-medium ${
                      quiz.isPublished ? "text-green-600" : "text-orange-600"
                    }`}
                  >
                    {quiz.isPublished ? "Published" : "Draft"}
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
                    Edit
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
                    Attempts
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
                  {quiz.isPublished && (
                    <button
                      onClick={() =>
                        router.push(
                          `/dashboard/learn-and-grow/quizzes/${moduleId}/take/${quiz.uuid}`
                        )
                      }
                      className="flex-1 bg-primary text-white px-4 py-2 rounded hover:bg-primary/90"
                    >
                      Take Quiz
                    </button>
                  )}
                  <button
                    onClick={() =>
                      router.push(
                        `/dashboard/learn-and-grow/quizzes/${moduleId}/my-attempts/${quiz.uuid}`
                      )
                    }
                    className="flex-1 flex items-center justify-center gap-2 bg-gray-500 text-white px-3 py-2 rounded hover:bg-gray-600"
                  >
                    <BsEye size={14} />
                    My Attempts
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
