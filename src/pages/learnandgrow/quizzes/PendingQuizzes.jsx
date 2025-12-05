"use client";
import { useState, useEffect, useContext } from "react";
import { useRouter } from "@/utils/navigation";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Loader from "@/components/common/Loader";
import axios from "axios";
import { toast } from "react-hot-toast";
import moment from "moment";
import { UserContext } from "../../../layouts/DashboardLayout";
import { server_url } from "../../../utils/endpoint";

const PendingQuizzes = () => {
  const router = useRouter();
  const { userDetails } = useContext(UserContext);
  const [loading, setLoading] = useState(true);
  const [pendingAttempts, setPendingAttempts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    // Check if user is admin/instructor
    if (userDetails?.role !== "Admin" && userDetails?.role !== "Instructor") {
      toast.error("You don't have permission to access this page");
      router.push("/dashboard");
      return;
    }
    loadPendingQuizzes();
  }, [page]);

  const loadPendingQuizzes = async () => {
    try {
      setLoading(true);
      const user = getUser();
      const response = await axios.get(
        `${server_url}/quiz/admin/pending-grading?page=${page}&limit=20`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user && user.ACCESS_TOKEN}`,
          },
        }
      );

      setPendingAttempts(response.data.data);
      setTotalPages(response.data.pagination.pages);
      setLoading(false);
    } catch (error) {
      console.error("Error loading pending quizzes:", error);
      toast.error("Failed to load pending quizzes");
      setLoading(false);
    }
  };

  const handleGrade = (attemptUuid) => {
    router.push(`/dashboard/learn-and-grow/quizzes/grade/${attemptUuid}`);
  };

  if (loading) return <Loader />;

  return (
    <div>
      <Breadcrumb
        prevLink="/dashboard"
        pageName="Pending Quiz Grading"
        prevPage="Dashboard"
      />

      <div className="bg-white rounded-lg shadow-sm border border-black/10 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            Quizzes Pending Grading ({pendingAttempts.length})
          </h2>
        </div>

        {pendingAttempts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              No quizzes pending grading at the moment.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4">Student</th>
                  <th className="text-left py-3 px-4">Quiz</th>
                  <th className="text-left py-3 px-4">Module</th>
                  <th className="text-left py-3 px-4">Submitted</th>
                  <th className="text-center py-3 px-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingAttempts.map((attempt) => (
                  <tr
                    key={attempt.uuid}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium">{attempt.user.name}</p>
                        <p className="text-sm text-gray-500">
                          {attempt.user.email}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-medium">{attempt.quiz.title}</p>
                      {attempt.quiz.description && (
                        <p className="text-sm text-gray-500">
                          {attempt.quiz.description}
                        </p>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <p>{attempt.quiz.module?.title || "N/A"}</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm">
                        {moment(attempt.submittedAt).format(
                          "MMM DD, YYYY HH:mm"
                        )}
                      </p>
                      <p className="text-xs text-gray-500">
                        {moment(attempt.submittedAt).fromNow()}
                      </p>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => handleGrade(attempt.uuid)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                      >
                        Grade Quiz
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-4 py-2">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingQuizzes;
