"use client";

import { useContext, useEffect, useState } from "react";
import Link from "@/utils/link";
import { UserContext } from "../../../layouts/DashboardLayout";
import {
  deleteSlide,
  getSlides,
  markRead,
} from "@/controllers/slides_controller";
import {
  BsTrash,
  BsCheckCircle,
  BsPlus,
  BsArrowRight,
} from "react-icons/bs";
import Loader from "@/components/common/Loader";
import toast from "react-hot-toast";
import { useTranslation } from "../../../locales";
import { useParams } from "react-router-dom";

const fallbackImage = "/images/ideation-classes.svg";

const Page = () => {
  const { t } = useTranslation();
  const { userDetails } = useContext(UserContext);
  const { uuid } = useParams();

  const [modules, setModules] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [module, setModule] = useState(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);

    getSlides({ module_uuid: uuid })
      .then((res) => {
        const slides = Array.isArray(res.data) ? res.data : [];

        setModules(slides);
        setModule(res.module || null);

        setProgress(
          slides.reduce(
            (prev, curr) => prev + (curr.SlideReaders?.length > 0 ? 1 : 0),
            0
          )
        );
      })
      .catch(() => {
        toast.error("Failed to load slides");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const progressPercentage =
    modules.length > 0 ? (progress / modules.length) * 100 : 0;

  const isModuleCompleted = modules.length > 0 && progress >= modules.length;

  const courseImage =
    module?.Program?.image ||
    module?.program?.image ||
    module?.Course?.image ||
    module?.course?.image ||
    module?.image ||
    fallbackImage;

  const handleSlideClick = (index) => {
    const selectedSlide = modules[index];
    const isRead = selectedSlide.SlideReaders?.length > 0;

    if (isRead || index === currentSlide) {
      setCurrentSlide(index);
      return;
    }

    if (index === currentSlide + 1) {
      if (modules[currentSlide].SlideReaders?.length === 0) {
        setCurrentSlide(index);

        markRead({
          slide_uuid: modules[currentSlide].uuid,
        }).then(() => {
          loadData();
        });
      } else {
        setCurrentSlide(index);
      }

      return;
    }

    toast.error(t("learnAndGrow.readInOrder", "You need to read in order"));
  };

  const handleNext = () => {
    if (modules[currentSlide].SlideReaders?.length === 0) {
      markRead({
        slide_uuid: modules[currentSlide].uuid,
      }).then(() => {
        loadData();
      });
    }

    setCurrentSlide((prev) =>
      prev < modules.length - 1 ? prev + 1 : prev
    );
  };

  const handleCompleteModule = () => {
    markRead({
      slide_uuid: modules[currentSlide].uuid,
    }).then(() => {
      toast.success(
        t("learnAndGrow.completedSuccessfully", "Completed successfully")
      );

      loadData();
    });
  };

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-[#F5F7FA] px-6 py-6">
      <div className="mx-auto w-full max-w-none">
        <section className="relative mb-8 min-h-[300px] overflow-hidden rounded-3xl border border-[#EAECF0] bg-black shadow-sm">
          <img
            src={courseImage}
            alt={module?.title || "Learning module"}
            className="absolute inset-0 h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/25" />

          <div className="relative z-10 flex min-h-[300px] max-w-3xl flex-col justify-center p-8 text-white lg:p-12">
            <span className="mb-5 inline-flex w-fit items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md">
              <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
              Interactive Learning
            </span>

            <h1 className="mb-4 text-3xl font-bold leading-tight tracking-tight text-white md:text-4xl">
              {module?.title}
            </h1>

            <p className="max-w-2xl text-sm leading-7 text-white/85 md:text-base">
              {module?.description ||
                "Progress through each learning slide in sequence, complete the module, and unlock the assessment quiz."}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-5 text-xs font-medium text-white/90 md:text-sm">
              <span>📚 {modules.length} Slides</span>

              <span>
                ✅ {progress}/{modules.length} Completed
              </span>

              <span>
                📈 {Math.round(progressPercentage)}% Progress
              </span>
            </div>
          </div>
        </section>

        <section className="mb-6 rounded-3xl border border-[#EAECF0] bg-white p-6 shadow-sm">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-[#667085]">Progress</span>

            <span className="font-bold text-[#101828]">
              {progress}/{modules.length}
            </span>
          </div>

          <div className="h-2.5 overflow-hidden rounded-full bg-[#EAECF0]">
            <div
              className="h-full rounded-full bg-[#22C55E] transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          <p className="mt-3 text-xs font-medium text-[#667085]">
            {Math.round(progressPercentage)}% completed
          </p>
        </section>

        <section className="grid min-h-[72vh] grid-cols-1 gap-6 lg:grid-cols-[25%_75%]">
          <aside className="rounded-3xl border border-[#EAECF0] bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#101828]">
                Slides
              </h2>

              {["Admin"].includes(userDetails?.role) && (
                <Link
                  href={`/dashboard/slides/add/?uuid=${uuid}`}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2563EB] text-white transition hover:bg-[#1D4ED8]"
                  title={t("learnAndGrow.addSlide", "Add Slide")}
                >
                  <BsPlus className="text-xl" />
                </Link>
              )}
            </div>

            <div className="space-y-3">
              {modules.map((item, index) => {
                const isRead = item.SlideReaders?.length > 0;
                const isActive = index === currentSlide;

                return (
                  <button
                    key={item.uuid}
                    type="button"
                    onClick={() => handleSlideClick(index)}
                    className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                      isActive
                        ? "border-[#2563EB] bg-[#EEF4FF]"
                        : "border-[#EAECF0] bg-white hover:bg-[#F9FAFB]"
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                        isRead
                          ? "bg-[#2563EB] text-white"
                          : isActive
                          ? "bg-[#2563EB] text-white"
                          : "bg-[#F2F4F7] text-[#667085]"
                      }`}
                    >
                      {isRead ? <BsCheckCircle /> : index + 1}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-1 text-sm font-semibold text-[#101828]">
                        {item.title}
                      </span>
                    </span>

                    {["Admin"].includes(userDetails?.role) && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();

                          deleteSlide(item.uuid).then(() => {
                            loadData();
                          });
                        }}
                        className="text-[#B42318] hover:text-red-700"
                        title="Delete slide"
                      >
                        <BsTrash />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {isModuleCompleted && (
              <Link
                href={`/dashboard/learn-and-grow/quizzes/${uuid}`}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2563EB] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1D4ED8]"
              >
                Take Quiz
                <BsArrowRight />
              </Link>
            )}
          </aside>

          <main className="flex min-h-[72vh] flex-col overflow-hidden rounded-3xl border border-[#EAECF0] bg-white shadow-sm">
            <div className="px-8 py-5">
              <h2 className="mt-1 text-2xl font-bold text-[#101828]">
                {modules[currentSlide]?.title}
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto px-10 py-8">
              {modules[currentSlide]?.type === "file" ? (
                <iframe
                  src={`https://docs.google.com/gview?url=${encodeURIComponent(
                    modules[currentSlide]?.file
                  )}&embedded=true`}
                  className="h-full min-h-[560px] w-full rounded-2xl border border-[#EAECF0] bg-white"
                  frameBorder="0"
                />
              ) : (
                <div className="mx-auto w-full max-w-5xl text-[16px] leading-8 text-[#344054]">
                  {modules[currentSlide]?.content}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 px-8 py-5">
              {isModuleCompleted ? (
                <Link
                  href={`/dashboard/learn-and-grow/quizzes/${uuid}`}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#2563EB] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1D4ED8]"
                >
                  Take Quiz
                  <BsArrowRight />
                </Link>
              ) : modules.length === currentSlide + 1 ? (
                <button
                  onClick={handleCompleteModule}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#22C55E] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#16A34A]"
                >
                  {t(
                    "learnAndGrow.completeModule",
                    "Complete Module"
                  )}

                  <BsCheckCircle />
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  disabled={currentSlide === modules.length - 1}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#2563EB] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:bg-[#D0D5DD]"
                >
                  {t("common.next", "Next")}

                  <BsArrowRight />
                </button>
              )}
            </div>
          </main>
        </section>
      </div>
    </div>
  );
};

export default Page;