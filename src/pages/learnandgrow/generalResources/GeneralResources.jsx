"use client";

import { useContext, useEffect, useState } from "react";
import { useRouter } from "@/utils/navigation";
import Link from "@/utils/link";
import Loader from "@/components/common/Loader";
import { getDocuments } from "@/controllers/pitch_material_controller";
import Image from "@/utils/image";
import toast from "react-hot-toast";
import { useTranslation } from "../../../locales";
import { UserContext } from "../../../layouts/DashboardLayout";
import {
  FaFolderOpen,
  FaLayerGroup,
  FaClock,
  FaStar,
} from "react-icons/fa";

const Page = () => {
  const { t } = useTranslation();
  const { userDetails } = useContext(UserContext);
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);

    getDocuments()
      .then((res) => {
        setData(res || []);
      })
      .catch((error) => {
        console.error(error);

        toast.error(
          t("learnAndGrow.failedToLoad", "Failed to load resources")
        );
      })
      .finally(() => setLoading(false));
  };

  const categoryMapping = {
    "Finance and Fundraising": t(
      "learnAndGrow.financeAndFundraising",
      "Finance & Fundraising"
    ),
    "Marketing & Sales": t(
      "learnAndGrow.marketingAndSales",
      "Marketing & Sales"
    ),
    "Technology & Innovation": t(
      "learnAndGrow.technologyAndInnovation",
      "Technology & Innovation"
    ),
    "Leadership & Personal Development": t(
      "learnAndGrow.leadershipAndPersonalDevelopment",
      "Leadership & Personal Development"
    ),
    "Impact & Sustainability": t(
      "learnAndGrow.impactAndSustainability",
      "Impact & Sustainability"
    ),
    "Legal & Compliance": t(
      "learnAndGrow.legalAndCompliance",
      "Legal & Compliance"
    ),
  };

  const categoryDescriptions = {
    "Finance and Fundraising":
      "Templates and guides for budgeting, financial planning, and raising capital.",

    "Marketing & Sales":
      "Resources to help you attract customers, build visibility, and grow revenue.",

    "Technology & Innovation":
      "Tools and materials for product development, digital systems, and innovation.",

    "Leadership & Personal Development":
      "Guides to strengthen leadership, productivity, communication, and personal growth.",

    "Impact & Sustainability":
      "Resources focused on social impact, ESG practices, and sustainable business models.",

    "Legal & Compliance":
      "Templates and guidance for legal setup, compliance, and regulatory requirements.",
  };

  const categoryImages = {
    "Finance & Fundraising":
      "/images/finance_fundraising_card.svg",

    "Marketing & Sales":
      "/images/marketing_sales_card.svg",

    "Technology & Innovation":
      "/images/technology_innovation_card.svg",

    "Leadership & Personal Development":
      "/images/leadership_personal_development_card.svg",

    "Impact & Sustainability":
      "/images/impact_sustainability_card.svg",

    "Legal & Compliance":
      "/images/legal_compliance_card.svg",
  };

  const categoryKeys = Object.keys(categoryMapping);
  const categories = Object.values(categoryMapping);

  const groupedDocuments = categoryKeys.reduce(
    (acc, englishCategory) => {
      const translatedCategory =
        categoryMapping[englishCategory];

      acc[translatedCategory] = data.filter(
        (doc) => doc.category === englishCategory
      );

      return acc;
    },
    {}
  );

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen px-6 py-4">
      {/* HERO */}
      <div className="relative mb-10 min-h-[320px] overflow-hidden rounded-2xl bg-black shadow-sm">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('/images/general_resources_hero.svg')",
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-[#c9672b]/30" />

        <div className="relative z-10 max-w-3xl p-10 text-white">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-sm font-medium shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#f08a3c]" />
            Resource Center
          </span>

          <h2 className="mb-3 text-4xl font-bold leading-tight drop-shadow-lg">
            {t(
              "learnAndGrow.availableResources",
              "Available Resources"
            )}
          </h2>

          <p className="mb-6 text-lg text-white/85 drop-shadow-md">
            {t(
              "learnAndGrow.welcomeMessage",
              "Welcome to your one-stop hub for actionable tools, templates, guides, and learning materials."
            )}
          </p>

          <div className="flex items-center gap-6 text-sm text-white/85">
            <span className="flex items-center gap-2">
              <FaLayerGroup />
              {categories.length} Categories
            </span>

            <span className="flex items-center gap-2">
              <FaFolderOpen />
              {data.length} Resources
            </span>

            <span className="flex items-center gap-2">
              <FaClock />
              Flexible Learning
            </span>
          </div>
        </div>
      </div>

      {/* HEADER */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-[#172033]">
          {t(
            "learnAndGrow.availableResources",
            "Available Resources"
          )}
        </h2>

        {userDetails?.role === "Admin" && (
          <Link
            href="/dashboard/uploadMaterial/document"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md active:scale-[0.98]"
          >
            <FaFolderOpen className="text-lg text-blue-200" />
            Add Resources
          </Link>
        )}
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => {
          const categoryDocs =
            groupedDocuments[category] || [];

          const hasResources =
            categoryDocs.length > 0;

          const englishCategory = Object.keys(
            categoryMapping
          ).find(
            (key) => categoryMapping[key] === category
          );

          return (
            <div
              key={category}
              onClick={() => {
                if (!hasResources) return;

                router.push(
                  `/dashboard/generalResources/category/${encodeURIComponent(
                    englishCategory || category
                  )}`
                );
              }}
              className={`group overflow-hidden rounded-xl bg-white shadow-md transition duration-200 ${
                hasResources
                  ? "cursor-pointer hover:scale-[1.02] hover:shadow-lg"
                  : "cursor-not-allowed opacity-70"
              }`}
            >
              <div className="relative h-48 overflow-hidden bg-black">
                <Image
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  src={
                    categoryImages[
                      englishCategory
                    ] ||
                    "/images/finance_fundraising_card.svg"
                  }
                  alt={category}
                  width={600}
                  height={300}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                <div className="relative z-10 flex h-full items-end p-4 text-white">
                  <h3 className="line-clamp-2 text-base font-semibold leading-tight drop-shadow-md">
                    {category}
                  </h3>
                </div>
              </div>

              <div className="p-4">
                <h3 className="mb-2 text-base font-bold text-[#111827]">
                  {category}
                </h3>

                <p className="text-sm text-[#6f6f72]">
                  {
                    categoryDescriptions[
                      englishCategory
                    ]
                  }
                </p>

                <div className="mt-4 flex items-center justify-between border-t border-black/10 pt-4 text-xs text-[#8a8f98]">
                  <span className="flex items-center gap-1">
                    <FaFolderOpen />
                    {categoryDocs.length} Items
                  </span>

                  <span className="flex items-center gap-1">
                    <FaClock />
                    Flexible Learning
                  </span>

                  <span className="flex items-center gap-1 text-[#f6b800]">
                    <FaStar />
                    0.0
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

export default Page;