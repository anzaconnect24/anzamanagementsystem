"use client";

import { useContext, useEffect, useState } from "react";
import { deleteProgram, getPrograms } from "@/controllers/program_controller";
import Link from "@/utils/link";
import { UserContext } from "../../../layouts/DashboardLayout";
import Image from "@/utils/image";
import Loader from "@/components/common/Loader";
import { useRouter } from "@/utils/navigation";
import { useTranslation } from "@/locales";
import { useParams } from "react-router-dom";

const ProgramsPage = () => {
  const { course } = useParams();
  const [programs, setPrograms] = useState([]);
  const { userDetails } = useContext(UserContext);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [limit] = useState(20);
  const [page] = useState(1);
  const { t } = useTranslation();

  const isAdmin = ["Admin"].includes(userDetails?.role);

  const formatCourseName = (value) => {
    return decodeURIComponent(value || "")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const courseName = formatCourseName(course);

  const getFallbackImage = () => {
    const name = courseName.toLowerCase();

    if (name.includes("investment")) {
      return "/images/investment_readiness_classes.svg";
    }

    if (name.includes("business")) {
      return "/images/business_foundation_classes.svg";
    }

    return "/images/ideation-classes.svg";
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getPrograms(page, limit, courseName);
      setPrograms(Array.isArray(res?.data) ? res.data : []);
    } catch (error) {
      setPrograms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (programUuid) => {
    if (
      window.confirm(
        t(
          "common.confirmDelete",
          "Are you sure you want to delete this course?",
        ),
      )
    ) {
      deleteProgram(programUuid).then(() => {
        loadData();
      });
    }
  };

  return loading ? (
    <Loader />
  ) : (
    <div className="min-h-screen px-6 py-6">
      {programs.length > 0 && (
        <div className="relative mb-10 min-h-[360px] overflow-hidden rounded-3xl shadow-sm">
          <Image
            src={programs[0]?.image || getFallbackImage()}
            alt={programs[0]?.title || "Featured course"}
            width={1600}
            height={700}
            className="absolute inset-0 h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/25" />

          <div className="relative z-10 flex min-h-[360px] items-center p-8 text-white lg:p-12">
            <div className="max-w-3xl">
              <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
                <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
                Featured Courses
              </span>

              <h2 className="mb-4 text-3xl font-bold leading-tight md:text-4xl">
                {programs[0].title}
              </h2>

              <p className="max-w-2xl text-base leading-7 text-white/85 line-clamp-3">
                {programs[0].description}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-[#101828]">Explore Courses</h2>

        {isAdmin && (
          <button
            className="rounded-xl bg-[#2563EB] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1D4ED8]"
            onClick={() => {
              router.push(`/dashboard/programs/add/?course=${course}`);
            }}
          >
            Add Course
          </button>
        )}
      </div>

      {programs.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#D0D5DD] bg-white p-10 text-center">
          <h3 className="text-xl font-semibold text-[#101828]">
            No courses available
          </h3>

          <p className="mt-2 text-sm text-[#667085]">
            There are no courses under this category yet.
          </p>

          {isAdmin && (
            <button
              className="mt-6 rounded-xl bg-[#2563EB] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1D4ED8]"
              onClick={() => {
                router.push(`/dashboard/programs/add/?course=${course}`);
              }}
            >
              Add Course
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {programs.map((item) => (
            <div
              key={item.uuid}
              className="group overflow-hidden rounded-3xl border border-[#EAECF0] bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <Link href={`/dashboard/programs/details/${item.uuid}`}>
                <div className="relative h-52 overflow-hidden">
                  <Image
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    alt={item.title}
                    width={1000}
                    height={1000}
                    src={item.image || getFallbackImage()}
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                </div>
              </Link>

              <div className="p-6">
                <h3 className="mb-3 line-clamp-2 text-xl font-bold leading-snug text-[#101828]">
                  {item.title}
                </h3>

                <p className="mb-6 min-h-[72px] text-sm leading-7 text-[#667085] line-clamp-3">
                  {item.description || "COMING SOON"}
                </p>

                <div className="flex items-center justify-between border-t border-[#EAECF0] pt-5">
                  <span className="rounded-full bg-[#F9FAFB] px-3 py-1 text-sm text-[#667085]">
                    Flexible Learning
                  </span>

                  {!isAdmin && (
                    <Link
                      href={`/dashboard/programs/details/${item.uuid}`}
                      className="text-sm font-semibold text-[#F59E0B] transition hover:text-[#D97706]"
                    >
                      Explore Course →
                    </Link>
                  )}
                </div>

                {isAdmin && (
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      href={`/dashboard/programs/details/${item.uuid}`}
                      className="rounded-xl bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1D4ED8]"
                    >
                      View
                    </Link>

                    <button
                      className="rounded-xl bg-[#EEF4FF] px-5 py-2.5 text-sm font-semibold text-[#2563EB] transition hover:bg-[#DCE7FF]"
                      onClick={() => {
                        router.push(
                          `/dashboard/programs/edit?uuid=${item.uuid}&course=${course}`,
                        );
                      }}
                    >
                      {t("common.edit", "Edit")}
                    </button>

                    <button
                      className="rounded-xl bg-[#FEF3F2] px-5 py-2.5 text-sm font-semibold text-[#B42318] transition hover:bg-[#FEE4E2]"
                      onClick={() => handleDelete(item.uuid)}
                    >
                      {t("common.delete", "Delete")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProgramsPage;
