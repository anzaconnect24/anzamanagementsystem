"use client";
import { useContext, useEffect, useState } from "react";
import {
  deleteModule,
  editModule,
  getModules,
} from "@/controllers/modules_controller";
import {
  checkProgramCompletion,
  downloadProgramCertificate,
} from "@/controllers/quiz_controller";
import Link from "@/utils/link";
import { UserContext } from "../../../layouts/DashboardLayout";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { BsPencil, BsPlus, BsTrash, BsLock } from "react-icons/bs";
import Image from "@/utils/image";
import Loader from "@/components/common/Loader";
import { editComment } from "@/controllers/comment_controllers";
import { useRouter } from "@/utils/navigation";
import { useTranslation } from "@/locales";
import Pagination from "../../../component/pagination";
import { useParams } from "react-router-dom";

const Page = ({ params }) => {
  const { programId } = useParams();
  const [modules, setModules] = useState([]);
  const { userDetails } = useContext(UserContext);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [limit, setLimit] = useState(20);
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const { t } = useTranslation();
  const [programCompletion, setProgramCompletion] = useState(null);
  const [completionLoading, setCompletionLoading] = useState(false);
  const [certificateLoading, setCertificateLoading] = useState(false);

  useEffect(() => {
    loadData();
    loadProgramCompletion();
  }, []);

  const loadData = () => {
    getModules({ program_uuid: programId, page, limit }).then((res) => {
      console.log(res);
      setModules(res.data);
      setCount(res.count);
      setLoading(false);
    });
  };

  const loadProgramCompletion = async () => {
    if (["Admin"].includes(userDetails.role)) return; // Skip for admin

    try {
      setCompletionLoading(true);
      const completion = await checkProgramCompletion(programId);
      setProgramCompletion(completion);
    } catch (error) {
      console.error("Error loading program completion:", error);
    } finally {
      setCompletionLoading(false);
    }
  };

  const handleDownloadCertificate = async () => {
    try {
      setCertificateLoading(true);
      await downloadProgramCertificate(
        programId,
        programCompletion?.program?.title || "Program"
      );
    } catch (error) {
      console.error("Error downloading certificate:", error);
      alert(error.response?.data?.message || "Failed to download certificate");
    } finally {
      setCertificateLoading(false);
    }
  };
  return loading ? (
    <Loader />
  ) : (
    <div>
      <Breadcrumb
        prevLink={"/dashboard/classRooms"}
        pageName={`${t("learnAndGrow.modules", "Modules")}`}
        prevPage={t("common.back", "Back")}
      />

      <div className="flex justify-between">
        <h1 className="text-2xl font-bold"></h1>
      </div>

      {/* Program Completion Status and Certificate */}
      {!["Admin"].includes(userDetails.role) && programCompletion && (
        <div className="bg-white rounded-lg border border-black/10 p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">
            {t("learnAndGrow.programProgress", "Program Progress")}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">
                {t("learnAndGrow.modulesCompleted", "Modules")}
              </p>
              <p className="text-2xl font-bold text-blue-600">
                {programCompletion.totalModules}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">
                {t("learnAndGrow.quizzesPassed", "Quizzes Passed")}
              </p>
              <p className="text-2xl font-bold text-green-600">
                {programCompletion.passedQuizzes} /{" "}
                {programCompletion.totalQuizzes}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">
                {t("learnAndGrow.averageScore", "Average Score")}
              </p>
              <p className="text-2xl font-bold text-purple-600">
                {programCompletion.averageScore?.toFixed(1) || 0}%
              </p>
            </div>
          </div>

          {programCompletion.isCompleted ? (
            <div className="bg-green-100 border border-green-300 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <h3 className="font-bold text-green-800">
                      {t(
                        "learnAndGrow.congratulations",
                        "Congratulations! Program Completed"
                      )}
                    </h3>
                    <p className="text-sm text-green-700">
                      {t(
                        "learnAndGrow.allQuizzesPassed",
                        "You have successfully passed all quizzes in this program"
                      )}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDownloadCertificate}
                  disabled={certificateLoading}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {certificateLoading ? (
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
                      {t("common.loading", "Loading...")}
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      {t(
                        "learnAndGrow.downloadCertificate",
                        "Download Certificate"
                      )}
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <svg
                  className="w-6 h-6 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <h3 className="font-semibold text-yellow-800">
                    {t("learnAndGrow.programInProgress", "Program In Progress")}
                  </h3>
                  <p className="text-sm text-yellow-700">
                    {t(
                      "learnAndGrow.completeAllQuizzes",
                      "Complete and pass all quizzes to earn your certificate"
                    )}
                  </p>
                  {programCompletion.quizzes && (
                    <p className="text-sm text-yellow-700 mt-1">
                      {
                        programCompletion.quizzes.filter((q) => !q.isPassed)
                          .length
                      }{" "}
                      {t(
                        "learnAndGrow.quizzesRemaining",
                        "quiz(zes) remaining"
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-3 gap-6 pt-4">
        {modules.map((item, idx) => {
          let length = item.Slides.length;
          let progress = item.Slides.reduce(
            (prev, curr) => prev + (curr.SlideReaders.length > 0 ? 1 : 0),
            0
          );
          let percentage = length > 0 ? (progress / length) * 100 : 0;

          // Determine if this module should be locked (only for non-Admin users)
          let isLocked = false;
          if (idx > 0 && !["Admin"].includes(userDetails.role)) {
            // Previous module must be completed
            let prev = modules[idx - 1];
            let prevLength = prev.Slides.length;
            let prevProgress = prev.Slides.reduce(
              (prev, curr) => prev + (curr.SlideReaders.length > 0 ? 1 : 0),
              0
            );
            let prevPercentage =
              prevLength > 0 ? (prevProgress / prevLength) * 100 : 0;
            isLocked = prevPercentage < 100;
          }

          return (
            <div
              key={item.uuid}
              className={`border border-black/10 bg-white rounded-lg p-5 flex flex-col items-start justify-between space-y-4 ${
                isLocked ? "opacity-60" : ""
              }`}
            >
              <div className="space-y-4">
                <Image
                  className="h-48 w-full object-cover"
                  alt="adf"
                  width={1000}
                  height={1000}
                  src={item.image}
                />
                <div className="">
                  {percentage > 0 && (
                    <div>
                      <p className="text-sm mb-1">
                        {progress}/{length}{" "}
                        {t("learnAndGrow.slidesCompleted", "slides completed")}
                      </p>
                      <div className="w-full bg-black/10 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  <h1 className="font-bold text-lg line-clamp-1 mt-2 flex items-center gap-2">
                    {item.title}
                    {isLocked && (
                      <BsLock
                        className="text-gray-400"
                        title={t(
                          "learnAndGrow.completePrevious",
                          "Complete previous module to unlock"
                        )}
                      />
                    )}
                  </h1>
                  <p className="mb-3 line-clamp-3">{item.description}</p>
                </div>
              </div>
              <div className="flex flex-col space-y-2 mt-auto">
                <div className="flex space-x-2 items-center">
                  {["Admin"].includes(userDetails.role) ? (
                    <Link
                      href={`/dashboard/slides/${item.uuid}`}
                      className="bg-primary px-4 py-2 whitespace-nowrap rounded-lg text-white flex-1 text-center"
                    >
                      {t("learnAndGrow.manageSlides", "Manage Slides")}
                    </Link>
                  ) : isLocked ? (
                    <button
                      className="bg-gray-200 text-gray-400 px-4 py-2 rounded-lg flex items-center justify-center cursor-not-allowed flex-1"
                      disabled
                      title={t(
                        "learnAndGrow.completePrevious",
                        "Complete previous module to unlock"
                      )}
                    >
                      <BsLock className="mr-2" />{" "}
                      {t("learnAndGrow.locked", "Locked")}
                    </button>
                  ) : percentage > 0 ? (
                    <Link
                      href={`/dashboard/slides/${item.uuid}`}
                      className="bg-primary px-4 py-2 rounded-lg text-white flex-1 text-center"
                    >
                      {percentage == 100
                        ? t("learnAndGrow.completed", "Completed")
                        : t("learnAndGrow.resume", "Resume")}
                    </Link>
                  ) : (
                    <Link
                      href={`/dashboard/slides/${item.uuid}`}
                      className="bg-primary px-4 py-2 rounded-lg text-white flex-1 text-center"
                    >
                      {t("learnAndGrow.startLearning", "Start Learning")}
                    </Link>
                  )}
                  {["Admin"].includes(userDetails.role) && (
                    <button
                      className="bg-green-100 text-green-500 py-2 px-4 rounded-lg"
                      onClick={() => {
                        router.push(
                          `/dashboard/modules/edit/?uuid=${item.uuid}`
                        );
                      }}
                    >
                      {t("common.edit", "Edit")}
                    </button>
                  )}
                  {["Admin"].includes(userDetails.role) && (
                    <button
                      className="bg-red-100 text-red-500 py-2 px-4 rounded-lg"
                      onClick={() => {
                        deleteModule(item.uuid).then((res) => {
                          loadData();
                        });
                      }}
                    >
                      {t("common.delete", "Delete")}
                    </button>
                  )}

                  {(percentage === 100 || userDetails.role === "Admin") && (
                    <Link
                      href={`/dashboard/learn-and-grow/quizzes/${item.uuid}`}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-2 rounded-lg text-center w-full"
                    >
                      {t("learnAndGrow.quizzes", "Quizzes")}
                    </Link>
                  )}
                </div>
                {/* Quizzes Button */}
              </div>
            </div>
          );
        })}
        {["Admin"].includes(userDetails.role) && (
          <Link
            href={`/dashboard/modules/add/?programId=${programId}`}
            className="bg-white hover:bg-primary/5 transition-all duration-200 rounded-lg p-5 flex flex-col justify-center items-center border border-black/10 "
          >
            <BsPlus className="text-4xl" />
            <p>{t("learnAndGrow.addModule", "Add Module")}</p>
          </Link>
        )}
      </div>
      <Pagination limit={limit} count={count} setPage={setPage} page={page} />
    </div>
  );
};

export default Page;
