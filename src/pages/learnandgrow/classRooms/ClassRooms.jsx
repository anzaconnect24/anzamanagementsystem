"use client";

import { useContext, useState } from "react";
import Link from "@/utils/link";
import Loader from "@/components/common/Loader";
import { useTranslation } from "@/locales";
import { UserContext } from "../../../layouts/DashboardLayout";
import {
  FaLayerGroup,
  FaClock,
  FaGraduationCap,
} from "react-icons/fa";

const Page = () => {
  const { userDetails } = useContext(UserContext);
  const [loading] = useState(false);
  const { t } = useTranslation();

  const classes = [
    {
      icon: "/images/ideation-classes.svg",
      englishKey: "Ideation",
      label: t("learnAndGrow.ideationClasses", "Ideation Classes"),
      description: t(
        "learnAndGrow.ideationDescription",
        "Learn how to validate business ideas, understand customer needs, and turn early concepts into practical opportunities."
      ),
    },
    {
      icon: "/images/business_foundation_classes.svg",
      englishKey: "Business Foundation",
      label: t(
        "learnAndGrow.businessFoundationClasses",
        "Business Foundation Classes"
      ),
      description: t(
        "learnAndGrow.businessFoundationDescription",
        "Build the core systems your business needs, including planning, operations, finance, sales, and customer management."
      ),
    },
    {
      icon: "/images/investment_readiness_classes.svg",
      englishKey: "Investment Readiness",
      label: t(
        "learnAndGrow.investmentReadinessClasses",
        "Investment Readiness Classes"
      ),
      description: t(
        "learnAndGrow.investmentReadinessDescription",
        "Prepare your business for funding by strengthening your financials, pitch, growth strategy, and investor documentation."
      ),
    },
  ];

  return loading ? (
    <Loader />
  ) : (
    <div className="min-h-screen px-6 py-4">
      {/* HERO */}
      <div className="relative mb-10 min-h-[200px] overflow-hidden rounded-2xl bg-black shadow-sm">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/images/business-class-hero.svg')",
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-[#c9672b]/30" />

        <div className="relative z-10 max-w-3xl p-7 text-white">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-sm font-medium shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#f08a3c]" />
            Learning Center
          </span>

          <h2 className="mb-3 text-4xl font-bold leading-tight drop-shadow-lg">
            {t("learnAndGrow.classRooms", "Class Rooms")}
          </h2>

          <p className="mb-6 text-lg text-white/85 drop-shadow-md line-clamp-3 max-w-xl">
            {t(
              "learnAndGrow.classRoomsWelcome",
              "Track your progress, access curated classes, and grow your business step by step."
            )}
          </p>

          <div className="flex flex-wrap items-center gap-6 text-sm text-white/85">
            <span className="flex items-center gap-2">
              <FaLayerGroup />
              {classes.length} Classes
            </span>

            <span className="flex items-center gap-2">
              <FaGraduationCap />
              Guided Learning
            </span>

            <span className="flex items-center gap-2">
              <FaClock />
              Flexible Learning
            </span>
          </div>
        </div>
      </div>

      {/* SECTION TITLE */}
      <h2 className="mb-6 text-2xl font-bold text-[#172033]">
        {t("learnAndGrow.availableClasses", "Available Classes")}
      </h2>

      {/* CARDS */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {classes.map((item) => (
          <Link
            key={item.englishKey}
            href={`/dashboard/programs/${encodeURIComponent(item.englishKey)}`}
            className="group flex min-h-[430px] flex-col overflow-hidden rounded-xl bg-white shadow-md transition duration-200 hover:scale-[1.01] hover:shadow-lg"
          >
            <div className="relative h-60 shrink-0 overflow-hidden bg-black">
              <img
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                src={item.icon}
                alt={item.label}
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            </div>

            <div className="flex flex-1 flex-col p-5">
              <h3 className="mb-3 text-lg font-bold text-[#111827]">
                {item.label}
              </h3>

              <p className="mb-6 flex-1 text-sm text-[#6f6f72]">
                {item.description}
              </p>

              <div className="mt-auto flex items-center justify-between border-t border-black/10 pt-4 text-xs text-[#8a8f98]">
                <span className="flex items-center gap-1">
                  <FaGraduationCap />
                  Classes
                </span>

                <span className="flex items-center gap-1">
                  <FaClock />
                  Flexible Learning
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Page;