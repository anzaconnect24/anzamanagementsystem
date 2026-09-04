"use client";

import { useContext, useEffect, useState } from "react";
import { useRouter } from "@/utils/navigation";
import { UserContext } from "../../../layouts/DashboardLayout";
import Loader from "@/components/common/Loader";
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

// Rendered as its own page (module uuid from the route) and embedded in the
// Quizzes tab of a module, where the uuid comes in as a prop and the hero is
// left off because the module record already carries a header.
const ModuleQuizzesPage = ({ moduleId: moduleIdProp, embedded = false }) => {
  const { t } = useTranslation();
  const params = useParams();
  const moduleId = moduleIdProp || params.moduleId;

  const [quizzes, setQuizzes] = useState([]);
  const [module, setModule] = useState(null);
  const { userDetails } = useContext(UserContext);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [userAttempts, setUserAttempts] = useState([]);

  const router = useRouter();
  // "Staff" is stored as either "Staff" or "Reviewer" (see SignUp).
  const isAdmin = ["Admin", "Staff", "Reviewer"].includes(userDetails?.role);

  useEffect(() => {
    loadData();
  }, [moduleId, activeTab]);

  useEffect(() => {
    const handleFocus = () => {
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

      if (!isAdmin) {
        try {
          const attemptsData = await getUserAttempts();
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

  const getUserLastAttempt = (quizUuid) => {
    const attempts = userAttempts.filter(
      (attempt) => attempt.quiz?.uuid === quizUuid && attempt.submittedAt,
    );

    if (attempts.length === 0) return null;

    return attempts.sort(
      (a, b) => new Date(b.submittedAt) - new Date(a.submittedAt),
    )[0];
  };

  const filteredQuizzes = quizzes.filter((quiz) => {
    if (isAdmin) {
      if (activeTab === "published") return quiz.isPublished;
      if (activeTab === "draft") return !quiz.isPublished;
      return true;
    }

    if (activeTab === "attempted") {
      return quiz.isPublished && getUserLastAttempt(quiz.uuid) !== null;
    }

    return quiz.isPublished;
  });

  const publishedCount = quizzes.filter((quiz) => quiz.isPublished).length;
  const draftCount = quizzes.filter((quiz) => !quiz.isPublished).length;
  const attemptedCount = quizzes.filter(
    (quiz) => quiz.isPublished && getUserLastAttempt(quiz.uuid) !== null,
  ).length;

  if (loading) {
    return embedded ? (
      <div className="rounded-2xl border border-[#EAECF0] bg-white p-10 text-center text-sm text-[#667085]">
        Loading quizzes...
      </div>
    ) : (
      <Loader />
    );
  }

  return (
    <div className={embedded ? "" : "min-h-screen bg-[#F5F7FA] px-6 py-6"}>
      <div className={embedded ? "" : "mx-auto max-w-7xl"}>
        {!embedded && (
          <section className="relative mb-8 overflow-hidden rounded-3xl border border-[#EAECF0] bg-black shadow-sm">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: "url('/images/business_tools_hero.svg')",
              }}
            />

            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/20" />

            <div className="relative z-10 flex min-h-[300px] flex-col justify-end gap-6 p-8 text-white md:flex-row md:items-end md:justify-between lg:p-12">
              <div className="max-w-3xl">
                <span className="mb-5 inline-flex items-center rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
                  Learning Assessment
                </span>

                <h1 className="mb-4 text-4xl font-bold leading-tight tracking-tight md:text-5xl">
                  {module?.title || t("quizzes.moduleQuizzes")}
                </h1>

                <p className="max-w-2xl text-sm leading-7 text-white/85 md:text-base">
                  Review available quizzes, track attempts, manage published
                  assessments, and continue measuring learning progress.
                </p>
              </div>

              {isAdmin && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      router.push(
                        `/dashboard/learn-and-grow/quizzes/${moduleId}/new`,
                      )
                    }
                    className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100"
                  >
                    Create Quiz
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {embedded && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-black tracking-tight text-[#101828]">
              Quizzes
            </h2>

            {isAdmin && (
              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/dashboard/learn-and-grow/quizzes/${moduleId}/new`,
                  )
                }
                className="inline-flex items-center gap-2 rounded-lg bg-[#16a34a] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#15803d]"
              >
                Add Quiz
              </button>
            )}
          </div>
        )}

        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-[#EAECF0] bg-white p-5 shadow-sm">
            <p className="text-3xl font-bold text-[#101828]">
              {quizzes.length}
            </p>

            <p className="mt-2 text-sm font-medium text-[#667085]">
              {t("quizzes.allQuizzes")}
            </p>
          </div>

          <div className="rounded-2xl border border-[#EAECF0] bg-white p-5 shadow-sm">
            <p className="text-3xl font-bold text-[#101828]">
              {publishedCount}
            </p>

            <p className="mt-2 text-sm font-medium text-[#667085]">
              {t("quizzes.published")}
            </p>
          </div>

          <div className="rounded-2xl border border-[#EAECF0] bg-white p-5 shadow-sm">
            <p className="text-3xl font-bold text-[#101828]">
              {isAdmin ? draftCount : attemptedCount}
            </p>

            <p className="mt-2 text-sm font-medium text-[#667085]">
              {isAdmin ? t("quizzes.draft") : t("quizzes.attempted")}
            </p>
          </div>

          <div className="rounded-2xl border border-[#EAECF0] bg-white p-5 shadow-sm">
            <p className="text-3xl font-bold text-[#101828]">
              {filteredQuizzes.length}
            </p>

            <p className="mt-2 text-sm font-medium text-[#667085]">
              Visible Now
            </p>
          </div>
        </section>

        <section className="mb-8 rounded-3xl border border-[#EAECF0] bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            {isAdmin ? (
              <>
                <button
                  onClick={() => setActiveTab("all")}
                  className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                    activeTab === "all"
                      ? "bg-[#2563EB] text-white"
                      : "bg-[#F9FAFB] text-[#667085] hover:bg-[#EEF4FF] hover:text-[#2563EB]"
                  }`}
                >
                  {t("quizzes.allQuizzes")} ({quizzes.length})
                </button>

                <button
                  onClick={() => setActiveTab("published")}
                  className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                    activeTab === "published"
                      ? "bg-[#2563EB] text-white"
                      : "bg-[#F9FAFB] text-[#667085] hover:bg-[#EEF4FF] hover:text-[#2563EB]"
                  }`}
                >
                  {t("quizzes.published")} ({publishedCount})
                </button>

                <button
                  onClick={() => setActiveTab("draft")}
                  className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                    activeTab === "draft"
                      ? "bg-[#2563EB] text-white"
                      : "bg-[#F9FAFB] text-[#667085] hover:bg-[#EEF4FF] hover:text-[#2563EB]"
                  }`}
                >
                  {t("quizzes.draft")} ({draftCount})
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setActiveTab("all")}
                  className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                    activeTab === "all"
                      ? "bg-[#2563EB] text-white"
                      : "bg-[#F9FAFB] text-[#667085] hover:bg-[#EEF4FF] hover:text-[#2563EB]"
                  }`}
                >
                  {t("quizzes.allQuizzes")} ({publishedCount})
                </button>

                <button
                  onClick={() => setActiveTab("attempted")}
                  className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                    activeTab === "attempted"
                      ? "bg-[#2563EB] text-white"
                      : "bg-[#F9FAFB] text-[#667085] hover:bg-[#EEF4FF] hover:text-[#2563EB]"
                  }`}
                >
                  {t("quizzes.attempted")} ({attemptedCount})
                </button>
              </>
            )}
          </div>
        </section>

        {filteredQuizzes.length === 0 ? (
          <section className="rounded-3xl border border-[#EAECF0] bg-white p-12 text-center shadow-sm">
            <p className="mb-4 text-sm text-[#667085]">
              {t("quizzes.noQuizzesFound")}
            </p>

            {isAdmin && (
              <button
                onClick={() =>
                  router.push(
                    `/dashboard/learn-and-grow/quizzes/${moduleId}/new`,
                  )
                }
                className="inline-flex items-center rounded-2xl bg-[#2563EB] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1D4ED8]"
              >
                Create First Quiz
              </button>
            )}
          </section>
        ) : (
          <section className="space-y-4">
            {filteredQuizzes.map((quiz) => {
              const lastAttempt = !isAdmin
                ? getUserLastAttempt(quiz.uuid)
                : null;

              return (
                <article
                  key={quiz.uuid}
                  className="rounded-3xl border border-[#EAECF0] bg-white p-6 shadow-sm transition duration-300 hover:shadow-md"
                >
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 flex-1">
                      {isAdmin && (
                        <span
                          className={`mb-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            quiz.isPublished
                              ? "bg-[#ECFDF3] text-[#027A48]"
                              : "bg-[#FFFAEB] text-[#B54708]"
                          }`}
                        >
                          {quiz.isPublished
                            ? t("quizzes.published")
                            : t("quizzes.draft")}
                        </span>
                      )}

                      <h3 className="text-xl font-bold text-[#101828]">
                        {quiz.title}
                      </h3>

                      <p className="mt-2 line-clamp-2 text-sm leading-7 text-[#667085]">
                        {quiz.description || "No description"}
                      </p>
                    </div>

                    <div className="flex shrink-0 gap-3">
                      <div className="min-w-[120px] rounded-2xl bg-[#F9FAFB] p-4">
                        <p className="text-xs text-[#98A2B3]">
                          {t("quizzes.questions")}
                        </p>

                        <p className="mt-1 text-lg font-bold text-[#101828]">
                          {quiz.questions?.length || 0}
                        </p>
                      </div>

                      <div className="min-w-[120px] rounded-2xl bg-[#F9FAFB] p-4">
                        <p className="text-xs text-[#98A2B3]">
                          {t("quizzes.passingScore")}
                        </p>

                        <p className="mt-1 text-lg font-bold text-[#101828]">
                          {quiz.passingScore}%
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 border-t border-[#EAECF0] pt-5">
                    {isAdmin ? (
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          onClick={() =>
                            router.push(
                              `/dashboard/learn-and-grow/quizzes/${moduleId}/edit/${quiz.uuid}`,
                            )
                          }
                          className="inline-flex items-center rounded-xl bg-[#EEF4FF] px-4 py-2 text-sm font-semibold text-[#2563EB] transition hover:bg-[#DCE7FF]"
                        >
                          Edit Quiz
                        </button>

                        <button
                          onClick={() =>
                            router.push(
                              `/dashboard/learn-and-grow/quizzes/${moduleId}/attempts/${quiz.uuid}`,
                            )
                          }
                          className="inline-flex items-center rounded-xl bg-[#ECFDF3] px-4 py-2 text-sm font-semibold text-[#027A48] transition hover:bg-[#D1FADF]"
                        >
                          View Attempts
                        </button>

                        <button
                          onClick={() => handleTogglePublish(quiz.uuid)}
                          className="inline-flex items-center rounded-xl bg-[#FFFAEB] px-4 py-2 text-sm font-semibold text-[#B54708] transition hover:bg-[#FEF0C7]"
                        >
                          {quiz.isPublished ? "Move to Draft" : "Publish Quiz"}
                        </button>

                        <button
                          onClick={() => handleDelete(quiz.uuid)}
                          className="inline-flex items-center rounded-xl bg-[#FEF3F2] px-4 py-2 text-sm font-semibold text-[#B42318] transition hover:bg-[#FEE4E2]"
                        >
                          Delete
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-3">
                        {quiz.isPublished && lastAttempt ? (
                          lastAttempt.gradingStatus === "pending_grading" ? (
                            <button
                              disabled
                              className="inline-flex items-center rounded-xl bg-[#FFFAEB] px-4 py-2 text-sm font-semibold text-[#B54708]"
                            >
                              Pending Grading
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                router.push(
                                  `/dashboard/learn-and-grow/quizzes/${moduleId}/result/${lastAttempt.uuid}`,
                                )
                              }
                              className="inline-flex items-center rounded-xl bg-[#ECFDF3] px-4 py-2 text-sm font-semibold text-[#027A48] transition hover:bg-[#D1FADF]"
                            >
                              View Result
                            </button>
                          )
                        ) : (
                          <button
                            onClick={() =>
                              router.push(
                                `/dashboard/learn-and-grow/quizzes/${moduleId}/take/${quiz.uuid}`,
                              )
                            }
                            className="inline-flex items-center rounded-xl bg-[#082d77] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#082d77]"
                          >
                            Start Quiz
                          </button>
                        )}

                        <button
                          onClick={() =>
                            router.push(
                              `/dashboard/learn-and-grow/quizzes/${moduleId}/my-attempts/${quiz.uuid}`,
                            )
                          }
                          className="inline-flex items-center rounded-xl bg-[#EEF4FF] px-4 py-2 text-sm font-semibold text-[#2563EB] transition hover:bg-[#DCE7FF]"
                        >
                          My Attempts
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </div>
  );
};

export default ModuleQuizzesPage;
