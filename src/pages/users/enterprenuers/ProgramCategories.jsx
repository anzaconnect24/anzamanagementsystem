"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Loader from "@/components/common/Loader";
import { getCohortPrograms } from "@/controllers/cohort_controller";
import {
  PROGRAM_CATEGORIES,
  UNCATEGORISED_KEY,
  UNCATEGORISED_LABEL,
  CATEGORY_META,
} from "@/constants/programCategories";
import {
  FaLayerGroup,
  FaUsers,
  FaArrowRight,
} from "react-icons/fa";

// First level of Startups: category -> program -> startups.
const ProgramCategories = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [programs, setPrograms] = useState([]);

  useEffect(() => {
    getCohortPrograms()
      .then(({ programs: list }) => {
        setPrograms(list);
      })
      .catch(() => {
        toast.error("Failed to load programs");
        setPrograms([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const inCategory = (category) =>
    programs.filter((program) => (program.category || "") === category);

  const uncategorised = programs.filter(
    (program) => !PROGRAM_CATEGORIES.includes(program.category || ""),
  );

  const startupsIn = (list) =>
    list.reduce((sum, program) => sum + (program.startupCount || 0), 0);

  const openCategory = (category) =>
    navigate(
      `/dashboard/programManagement/category/${encodeURIComponent(category)}`,
    );

  const tiles = [
    ...PROGRAM_CATEGORIES.map((category) => ({
      key: category,
      label: category,
      programs: inCategory(category),
    })),
    ...(uncategorised.length
      ? [
          {
            key: UNCATEGORISED_KEY,
            label: UNCATEGORISED_LABEL,
            programs: uncategorised,
          },
        ]
      : []),
  ];

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen px-6 py-4">
      {/* HERO */}
      <div className="relative mb-10 min-h-[320px] overflow-hidden rounded-2xl bg-black shadow-sm">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/mentor_hero.svg')" }}
        />

        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-[#c9672b]/30" />

        <div className="relative z-10 max-w-3xl p-10 text-white">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-sm font-medium shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#f08a3c]" />
            Startups by Program
          </span>

          <h2 className="mb-3 text-4xl font-bold leading-tight drop-shadow-lg">
            Program Categories
          </h2>

          <p className="mb-6 text-lg text-white/85 drop-shadow-md">
            Pick a category to see its programs, then the startups taking part.
          </p>

          <div className="flex flex-wrap items-center gap-6 text-sm text-white/85">
            <span className="flex items-center gap-2">
              <FaLayerGroup />
              {programs.length} Programs
            </span>

            <span className="flex items-center gap-2">
              <FaUsers />
              {startupsIn(programs)} Startups enrolled
            </span>

          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-[#172033]">Browse by Category</h2>

        <button
          type="button"
          onClick={() => navigate("/dashboard/enterprenuers")}
          className="inline-flex items-center gap-2 rounded-lg bg-[#082d77] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md active:scale-[0.98]"
        >
          <FaUsers className="text-lg text-blue-200" />
          View all startups
        </button>
      </div>

      {/* CATEGORY TILES */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((tile) => {
          const meta = CATEGORY_META[tile.label] || {};
          const programCount = tile.programs.length;
          const startupCount = startupsIn(tile.programs);

          return (
            <div
              key={tile.key}
              onClick={() => openCategory(tile.label)}
              className="group cursor-pointer overflow-hidden rounded-xl bg-white shadow-md transition duration-200 hover:scale-[1.02] hover:shadow-lg"
            >
              <div className="relative h-40 overflow-hidden bg-black">
                <img
                  src={meta.image || "/images/ideation-classes.svg"}
                  alt={tile.label}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                <span className="absolute bottom-4 left-4 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 shadow-sm">
                  {programCount} {programCount === 1 ? "program" : "programs"}
                </span>
              </div>

              <div className="flex min-h-[170px] flex-col p-5">
                <h3 className="mb-2 line-clamp-2 text-lg font-bold text-[#111827]">
                  {tile.label}
                </h3>

                <p className="mb-4 line-clamp-2 text-sm leading-6 text-[#6f6f72]">
                  {meta.description || ""}
                </p>

                <div className="flex items-center gap-2 text-sm text-[#6f6f72]">
                  <FaUsers className="shrink-0" />
                  <span>
                    {startupCount} {startupCount === 1 ? "startup" : "startups"}
                  </span>
                </div>

                <div className="mt-auto flex items-center justify-between border-t border-black/10 pt-4 text-xs text-[#8a8f98]">
                  <span className="flex items-center gap-1">
                    <FaLayerGroup />
                    Category
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-green-700">
                    View programs <FaArrowRight />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgramCategories;
