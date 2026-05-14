"use client";

import { useContext, useEffect, useState } from "react";
import { deleteModule, getModules } from "@/controllers/modules_controller";
import {
  checkProgramCompletion,
  downloadProgramCertificate,
} from "@/controllers/quiz_controller";

import Link from "@/utils/link";
import { UserContext } from "../../../layouts/DashboardLayout";
import { BsPlus, BsLock } from "react-icons/bs";

import {
  FaDownload,
  FaLayerGroup,
  FaClock,
  FaBookOpen,
  FaCheckCircle,
  FaChartLine,
} from "react-icons/fa";

import Image from "@/utils/image";
import Loader from "@/components/common/Loader";
import { useRouter } from "@/utils/navigation";
import { useTranslation } from "@/locales";
import { useParams } from "react-router-dom";

const Page = () => {
  const { programId } = useParams();

  const [modules, setModules] = useState([]);

  const { userDetails } = useContext(UserContext);

  const [loading, setLoading] = useState(true);

  const router = useRouter();

  const { t } = useTranslation();

  const [programCompletion, setProgramCompletion] =
    useState(null);

  const [certificateLoading, setCertificateLoading] =
    useState(false);

  useEffect(() => {
    loadData();
    loadProgramCompletion();
  }, []);

  const loadData = () => {
    getModules({
      program_uuid: programId,
      page: 1,
      limit: 100,
    }).then((res) => {
      setModules(res.data);
      setLoading(false);
    });
  };

  const loadProgramCompletion = async () => {
    if (["Admin"].includes(userDetails.role)) return;

    try {
      const completion =
        await checkProgramCompletion(programId);

      setProgramCompletion(completion);
    } catch (error) {
      console.error(error);
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
      console.error(error);
    } finally {
      setCertificateLoading(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-[#F5F7FA] px-6 py-6">
      <div className="mx-auto max-w-7xl">
        {/* HERO */}
        <section className="relative mb-8 overflow-hidden rounded-3xl border border-[#EAECF0] bg-black shadow-sm">
          <div className="absolute inset-0">
            <Image
              src="/images/general_resources_hero.svg"
              alt="Learning modules"
              width={1600}
              height={800}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/20" />

          <div className="relative z-10 flex min-h-[320px] max-w-3xl flex-col justify-center p-8 lg:p-12">
            <span className="mb-6 inline-flex w-fit items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
              <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
              Learning Modules
            </span>

            <h1 className="mb-4 text-4xl font-bold leading-tight text-white md:text-4xl">
              Continue Your Learning Journey
            </h1>

            <p className="mb-8 max-w-2xl text-base leading-8 text-white/85 md:text-lg">
              Access structured learning modules,
              quizzes, downloadable resources, and
              progress tracking to support your learning
              experience.
            </p>

            <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-white/90">
              <span className="flex items-center gap-2">
                <FaLayerGroup />
                {modules.length} Modules
              </span>

              <span className="flex items-center gap-2">
                <FaDownload />
                Certificates Available
              </span>

              <span className="flex items-center gap-2">
                <FaClock />
                Flexible Learning
              </span>
            </div>
          </div>
        </section>

        {/* PROGRAM PROGRESS */}
        {!["Admin"].includes(userDetails.role) &&
          programCompletion && (
            <section className="mb-8 rounded-3xl border border-[#EAECF0] bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-[#101828]">
                    Program Progress
                  </h2>
                </div>

                {programCompletion.isCompleted && (
                  <button
                    onClick={
                      handleDownloadCertificate
                    }
                    disabled={certificateLoading}
                    className="rounded-xl bg-[#2563EB] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1D4ED8] disabled:opacity-50"
                  >
                    {certificateLoading
                      ? "Loading..."
                      : "Download Certificate"}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                <div className="relative rounded-2xl border border-[#EAECF0] bg-white p-5 shadow-sm">
                  <FaBookOpen className="absolute right-5 top-5 text-xl text-[#2563EB]" />

                  <h3 className="text-3xl font-bold text-[#101828]">
                    {
                      programCompletion.totalModules
                    }
                  </h3>

                  <p className="mt-2 text-sm font-medium text-[#667085]">
                    Modules
                  </p>
                </div>

                <div className="relative rounded-2xl border border-[#EAECF0] bg-white p-5 shadow-sm">
                  <FaCheckCircle className="absolute right-5 top-5 text-xl text-[#039855]" />

                  <h3 className="text-3xl font-bold text-[#101828]">
                    {
                      programCompletion.passedQuizzes
                    }
                    /
                    {
                      programCompletion.totalQuizzes
                    }
                  </h3>

                  <p className="mt-2 text-sm font-medium text-[#667085]">
                    Quizzes Passed
                  </p>
                </div>

                <div className="relative rounded-2xl border border-[#EAECF0] bg-white p-5 shadow-sm">
                  <FaChartLine className="absolute right-5 top-5 text-xl text-[#7A5AF8]" />

                  <h3 className="text-3xl font-bold text-[#101828]">
                    {programCompletion.averageScore?.toFixed(
                      1
                    ) || 0}
                    %
                  </h3>

                  <p className="mt-2 text-sm font-medium text-[#667085]">
                    Average Score
                  </p>
                </div>
              </div>
            </section>
          )}

        {/* HEADER */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-[#101828]">
              Available Modules
            </h2>
          </div>

          {["Admin"].includes(userDetails.role) && (
            <Link
              href={`/dashboard/modules/add/?programId=${programId}`}
              className="rounded-xl bg-[#2563EB] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1D4ED8]"
            >
              Add Module
            </Link>
          )}
        </div>

        {/* MODULES */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {modules.map((item, idx) => {
            const length = item.Slides.length;

            const progress = item.Slides.reduce(
              (prev, curr) =>
                prev +
                (curr.SlideReaders.length > 0
                  ? 1
                  : 0),
              0
            );

            const percentage =
              length > 0
                ? (progress / length) * 100
                : 0;

            let isLocked = false;

            if (
              idx > 0 &&
              !["Admin"].includes(userDetails.role)
            ) {
              const prev = modules[idx - 1];

              const prevLength = prev.Slides.length;

              const prevProgress =
                prev.Slides.reduce(
                  (prevValue, curr) =>
                    prevValue +
                    (curr.SlideReaders.length > 0
                      ? 1
                      : 0),
                  0
                );

              const prevPercentage =
                prevLength > 0
                  ? (prevProgress / prevLength) *
                    100
                  : 0;

              isLocked = prevPercentage < 100;
            }

            return (
              <div
                key={item.uuid}
                className={`overflow-hidden rounded-3xl border border-[#EAECF0] bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg ${
                  isLocked ? "opacity-60" : ""
                }`}
              >
                {/* IMAGE */}
                <div className="relative h-56 overflow-hidden">
                  <Image
                    className="h-full w-full object-cover"
                    alt={item.title}
                    width={1000}
                    height={1000}
                    src={item.image}
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                  <div className="absolute bottom-4 left-4">
                    <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#101828] shadow-sm backdrop-blur-sm">
                      Business
                    </span>
                  </div>

                  {isLocked && (
                    <div className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
                      <BsLock className="text-gray-500" />
                    </div>
                  )}
                </div>

                {/* CONTENT */}
                <div className="flex min-h-[270px] flex-col p-6">
                  {percentage > 0 && (
                    <div className="mb-5">
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="text-[#667085]">
                          Progress
                        </span>

                        <span className="font-semibold text-[#101828]">
                          {progress}/{length}
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-[#EAECF0]">
                        <div
                          className="h-full rounded-full bg-[#22C55E]"
                          style={{
                            width: `${percentage}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <h3 className="mb-3 line-clamp-2 text-xl font-bold text-[#101828]">
                    {item.title}
                  </h3>

                  <p className="mb-6 line-clamp-3 text-sm leading-7 text-[#667085]">
                    {item.description}
                  </p>

                  {/* FOOTER */}
                  <div className="mt-auto border-t border-[#EAECF0] pt-5">
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-wrap items-center gap-5 text-sm text-[#667085]">
                        <div className="flex items-center gap-2">
                          <FaLayerGroup className="text-[#98A2B3]" />

                          <span>
                            {item.Slides.length} Lessons
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <FaClock className="text-[#98A2B3]" />

                          <span>
                            Flexible Learning
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        {isLocked ? (
                          <button
                            disabled
                            className="rounded-xl bg-[#F2F4F7] px-4 py-2 text-sm font-semibold text-[#98A2B3]"
                          >
                            Locked
                          </button>
                        ) : (
                          <Link
                            href={`/dashboard/slides/${item.uuid}`}
                            className="rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1D4ED8]"
                          >
                            {percentage === 100
                              ? "Completed"
                              : percentage > 0
                              ? "Resume"
                              : "Start"}
                          </Link>
                        )}

                        {(percentage === 100 ||
                          userDetails.role ===
                            "Admin") && (
                          <Link
                            href={`/dashboard/learn-and-grow/quizzes/${item.uuid}`}
                            className="rounded-xl bg-[#EEF4FF] px-4 py-2 text-sm font-semibold text-[#2563EB] transition hover:bg-[#DCE7FF]"
                          >
                            Quiz
                          </Link>
                        )}

                        {["Admin"].includes(
                          userDetails.role
                        ) && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                router.push(
                                  `/dashboard/modules/edit/?uuid=${item.uuid}`
                                );
                              }}
                              className="rounded-xl bg-[#ECFDF3] px-4 py-2 text-sm font-semibold text-[#027A48] transition hover:bg-[#D1FADF]"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                deleteModule(
                                  item.uuid
                                ).then(() => {
                                  loadData();
                                });
                              }}
                              className="rounded-xl bg-[#FEF3F2] px-4 py-2 text-sm font-semibold text-[#B42318] transition hover:bg-[#FEE4E2]"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Page;