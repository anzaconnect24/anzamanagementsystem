"use client";
import { useContext, useEffect, useState } from "react";
import {
  deleteModule,
  editModule,
  getModules,
} from "@/controllers/modules_controller";
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
  const { course } = useParams();
  const [modules, setModules] = useState([]);
  const { userDetails } = useContext(UserContext);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [limit, setLimit] = useState(20);
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const { t } = useTranslation();
  useEffect(() => {
    loadData();
  }, []);
  const loadData = () => {
    getModules({ course: decodeURIComponent(course), page, limit }).then(
      (res) => {
        console.log(res);
        setModules(res.data);
        setCount(res.count);
        setLoading(false);
      }
    );
  };
  return loading ? (
    <Loader />
  ) : (
    <div>
      <Breadcrumb
        prevLink={""}
        pageName={`${decodeURIComponent(course)} ${t(
          "learnAndGrow.modules",
          "Modules"
        )}`}
        prevPage={t("common.back", "Back")}
      />

      <div className="flex justify-between">
        <h1 className="text-2xl font-bold"></h1>
      </div>

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
                      className="bg-primary px-4 py-2 rounded-lg text-white flex-1 text-center"
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
                </div>
                {/* Quizzes Button */}
                <Link
                  href={`/dashboard/learn-and-grow/quizzes/${item.uuid}`}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-center w-full"
                >
                  📝 {t("learnAndGrow.quizzes", "Quizzess")}
                </Link>
              </div>
            </div>
          );
        })}
        {["Admin"].includes(userDetails.role) && (
          <Link
            href={`/dashboard/modules/add/?course=${course}`}
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
