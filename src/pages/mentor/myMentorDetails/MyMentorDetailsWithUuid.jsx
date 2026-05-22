"use client";

import { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Link from "@/utils/link";
import Loader from "@/components/common/Loader";
import Image from "@/utils/image";
import { getUserInfo } from "@/controllers/user_controller";
import { UserContext } from "@/layouts/DashboardLayout";
import { useTranslation } from "../../../locales";
import { FaUserTie, FaFileAlt, FaFolderOpen } from "react-icons/fa";

const Page = () => {
  const { t } = useTranslation();
  const { uuid } = useParams();
  const { userDetails } = useContext(UserContext);

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    getUserInfo(uuid)
      .then((data) => setUser(data))
      .catch((error) => console.error("Error fetching user:", error))
      .finally(() => setLoading(false));
  }, [uuid]);

  if (loading) return <Loader />;

  const cards = [
    {
      icon: FaUserTie,
      label: t("mentorDetails.viewProfile", "View Profile"),
      description: "View mentor background, expertise, and profile details.",
      path: `/dashboard/mentors/${uuid}`,
    },
    {
      icon: FaFolderOpen,
      label: t("mentorDetails.resources", "Resources"),
      description: "Access shared materials, guides, and useful resources.",
      path: "#",
    },
    {
      icon: FaFileAlt,
      label: t("mentorDetails.reports", "Reports"),
      description: "Review reports, feedback, and mentorship session updates.",
      path: "#",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5F7FA] px-6 py-6">
      <div className="mx-auto max-w-7xl">
        <section className="relative mb-8 overflow-hidden rounded-3xl border border-[#EAECF0] bg-black shadow-sm">
          <div className="absolute inset-0">
            <Image
              src="/images/general_resources_hero.svg"
              alt="Mentor hub"
              width={1600}
              height={900}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/20" />

          <div className="relative z-10 flex min-h-[320px] max-w-3xl flex-col justify-center p-8 lg:p-12">
            <span className="mb-6 inline-flex w-fit items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
              <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
              Mentor Hub
            </span>

            <h1 className="mb-4 text-4xl font-bold leading-tight text-white md:text-5xl">
              Dear {userDetails?.name || "Entrepreneur"}!
            </h1>

            <p className="mb-8 max-w-2xl text-base leading-8 text-white/85 md:text-lg">
              View your mentor profile, access shared resources, and review
              mentoring reports from one workspace.
            </p>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {cards.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.label}
                href={item.path}
                className="group rounded-3xl border border-[#EAECF0] bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF4FF] text-[#2563EB]">
                  <Icon className="text-2xl" />
                </div>

                <h3 className="text-xl font-bold text-[#101828]">
                  {item.label}
                </h3>

                <p className="mt-3 text-sm leading-7 text-[#667085]">
                  {item.description}
                </p>

                <div className="mt-6 border-t border-[#EAECF0] pt-5">
                  <span className="inline-flex rounded-xl bg-[#2563EB] px-5 py-3 text-sm font-semibold text-white">
                    Open
                  </span>
                </div>
              </Link>
            );
          })}
        </section>
      </div>
    </div>
  );
};

export default Page;