"use client";

import { useContext, useEffect, useState } from "react";
import { useRouter } from "@/utils/navigation";
import Link from "@/utils/link";
import Loader from "@/components/common/Loader";
import { getAllBusinessTools } from "@/controllers/business_tools_controller";
import toast from "react-hot-toast";
import { UserContext } from "../../../layouts/DashboardLayout";
import { BUSINESS_TOOL_CATEGORIES } from "../../../constants/learnAndGrowCategories";

import { FaFolderOpen, FaLayerGroup, FaDownload, FaClock } from "react-icons/fa";

const UNCATEGORIZED = "Uncategorized";

const BusinessTools = () => {
  const { userDetails } = useContext(UserContext);
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [tools, setTools] = useState([]);

  useEffect(() => {
    loadTools();
  }, []);

  const loadTools = () => {
    setLoading(true);

    getAllBusinessTools()
      .then((res) => {
        setTools(res.body || []);
      })
      .catch((error) => {
        console.error(error);
        toast.error("Failed to load business tools");
      })
      .finally(() => setLoading(false));
  };

  const knownCategoryNames = BUSINESS_TOOL_CATEGORIES.map((category) => category.name);

  const uncategorizedCount = tools.filter(
    (tool) => !tool.category || !knownCategoryNames.includes(tool.category)
  ).length;

  const categoryTiles = [
    ...BUSINESS_TOOL_CATEGORIES.map((category) => ({
      ...category,
      count: tools.filter((tool) => tool.category === category.name).length,
    })),
    ...(uncategorizedCount > 0
      ? [
          {
            name: UNCATEGORIZED,
            description: "Templates that haven't been assigned a category yet",
            image: "/images/business-tool-card.jpg",
            count: uncategorizedCount,
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
          style={{
            backgroundImage: "url('/images/business_tools_hero.svg')",
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-[#c9672b]/30" />

        <div className="relative z-10 max-w-3xl p-10 text-white">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-sm font-medium shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#f08a3c]" />
            Business Toolkit
          </span>

          <h2 className="mb-3 text-4xl font-bold leading-tight drop-shadow-lg">
            Business Tools
          </h2>

          <p className="mb-6 text-lg text-white/85 drop-shadow-md">
            Browse practical business templates organized by category.
          </p>

          <div className="flex flex-wrap items-center gap-6 text-sm text-white/85">
            <span className="flex items-center gap-2">
              <FaLayerGroup />
              {BUSINESS_TOOL_CATEGORIES.length} Categories
            </span>

            <span className="flex items-center gap-2">
              <FaDownload />
              {tools.length} Templates
            </span>

            <span className="flex items-center gap-2">
              <FaClock />
              Practical Support
            </span>
          </div>
        </div>
      </div>

      {/* HEADER */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-[#172033]">
          Browse by Category
        </h2>

        {["Admin"].includes(userDetails.role) && (
          <Link
            href="/dashboard/uploadBusinessTool"
            className="inline-flex items-center gap-2 rounded-lg bg-[#082d77] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md active:scale-[0.98]"
          >
            <FaDownload className="text-lg text-blue-200" />
            Add Business Tool
          </Link>
        )}
      </div>

      {/* CATEGORY TILES */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {categoryTiles.map((category) => {
          const hasTemplates = category.count > 0;

          return (
            <div
              key={category.name}
              onClick={() => {
                if (!hasTemplates) return;

                router.push(
                  `/dashboard/businessTools/category/${encodeURIComponent(
                    category.name
                  )}`
                );
              }}
              className={`group overflow-hidden rounded-xl bg-white shadow-md transition duration-200 ${
                hasTemplates
                  ? "cursor-pointer hover:scale-[1.02] hover:shadow-lg"
                  : "cursor-not-allowed opacity-70"
              }`}
            >
              <div className="relative h-48 overflow-hidden bg-black">
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                  style={{ backgroundImage: `url('${category.image}')` }}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                <div className="relative z-10 flex h-full items-end p-4 text-white">
                  <h3 className="line-clamp-2 text-base font-semibold leading-tight drop-shadow-md">
                    {category.name}
                  </h3>
                </div>
              </div>

              <div className="p-4">
                <p className="text-sm text-[#6f6f72]">
                  {category.description}
                </p>

                <div className="mt-4 flex items-center justify-between border-t border-black/10 pt-4 text-xs text-[#8a8f98]">
                  <span className="flex items-center gap-1">
                    <FaFolderOpen />
                    {category.count} Templates
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

export default BusinessTools;