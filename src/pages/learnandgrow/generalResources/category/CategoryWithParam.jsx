"use client";

import { useContext, useEffect, useState } from "react";
import { useRouter } from "@/utils/navigation";
import { useParams } from "react-router-dom";

import Loader from "@/components/common/Loader";
import Image from "@/utils/image";

import { UserContext } from "@/layouts/DashboardLayout";

import {
  deletePitchMaterial,
  getDocuments,
} from "@/controllers/pitch_material_controller";

import toast from "react-hot-toast";

import {
  FaArrowLeft,
  FaBookOpen,
  FaFilePdf,
  FaStar,
} from "react-icons/fa";

import { BsTrash } from "react-icons/bs";

import { useTranslation } from "../../../../locales";

const CategoryResourcesPage = () => {
  const { t } = useTranslation();

  const { category } = useParams();

  const router = useRouter();

  const { userDetails } = useContext(UserContext);

  const [loading, setLoading] = useState(false);

  const [documents, setDocuments] = useState([]);

  const decodedCategory = decodeURIComponent(category);

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
      "Practical templates, guides, and tools for budgeting, financial planning, investor readiness, and raising capital.",

    "Marketing & Sales":
      "Resources to help you attract customers, build visibility, improve sales execution, and grow revenue.",

    "Technology & Innovation":
      "Tools and materials for product development, digital transformation, systems design, and innovation.",

    "Leadership & Personal Development":
      "Guides to strengthen leadership, productivity, communication, decision-making, and personal growth.",

    "Impact & Sustainability":
      "Resources focused on social impact, ESG practices, sustainability, and responsible business models.",

    "Legal & Compliance":
      "Templates and guidance for legal setup, compliance, governance, contracts, and regulatory requirements.",
  };

  const categoryImages = {
    "Finance and Fundraising":
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

  const resourceImages = [
    "/images/finance_fundraising_card.svg",
    "/images/marketing_sales_card.svg",
    "/images/technology_innovation_card.svg",
    "/images/leadership_personal_development_card.svg",
    "/images/impact_sustainability_card.svg",
    "/images/legal_compliance_card.svg",
  ];

  const displayCategoryName =
    categoryMapping[decodedCategory] || decodedCategory;

  const categoryDescription =
    categoryDescriptions[decodedCategory] ||
    "Explore practical business resources, templates, and guides.";

  const categoryImage =
    categoryImages[decodedCategory] ||
    "/images/finance_fundraising_card.svg";

  useEffect(() => {
    loadData();
  }, [category]);

  const loadData = () => {
    setLoading(true);

    getDocuments()
      .then((res) => {
        const categoryDocs = (res || []).filter(
          (doc) => doc.category === decodedCategory
        );

        setDocuments(categoryDocs);
      })
      .catch((error) => {
        console.error(error);

        toast.error(
          t(
            "learnAndGrow.failedToLoad",
            "Failed to load resources"
          )
        );
      })
      .finally(() => setLoading(false));
  };

  const isPdf = (doc) => {
    if (!doc) return false;

    if (
      doc.type &&
      doc.type.toLowerCase() === "document"
    ) {
      return true;
    }

    return /\.pdf(\?.*)?$/i.test(
      doc.materialUrl || ""
    );
  };

  const getFileType = (doc) => {
    if (isPdf(doc)) return "PDF";

    const url = doc?.materialUrl || "";

    const extension = url
      .split(".")
      .pop()
      ?.split("?")[0]
      ?.toUpperCase();

    return extension || "Document";
  };

  const handleDeleteDoc = async (doc) => {
    const confirmed = confirm(
      t(
        "learnAndGrow.deleteResourceConfirm",
        "Delete this resource? This action cannot be undone."
      )
    );

    if (!confirmed) return;

    try {
      await deletePitchMaterial(doc.uuid);

      toast.success(
        t(
          "learnAndGrow.resourceDeleted",
          "Resource deleted"
        )
      );

      setDocuments((prev) =>
        prev.filter((d) => d.uuid !== doc.uuid)
      );
    } catch (e) {
      console.error(e);

      toast.error(
        t(
          "learnAndGrow.failedToDelete",
          "Failed to delete resource"
        )
      );
    }
  };

  return loading ? (
    <Loader />
  ) : (
    <div className="min-h-screen bg-[#f5f7fb] px-3 py-6 lg:px-6">
      <div className="mx-auto w-full max-w-[1600px]">
        {/* TOP BAR */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#4b5563] transition hover:text-black"
          >
            <FaArrowLeft />
            Back
          </button>

          <div className="text-sm font-medium text-[#111827]">
            General Resources

            <span className="mx-2 text-[#9ca3af]">
              /
            </span>

            <span className="text-blue-600">
              {displayCategoryName}
            </span>
          </div>
        </div>

        {/* HERO */}
        <div className="relative mb-12 overflow-hidden rounded-3xl bg-black shadow-lg">
          <div className="absolute inset-0">
            <Image
              src={categoryImage}
              alt={displayCategoryName}
              width={1800}
              height={420}
              className="h-full w-full object-cover opacity-70"
            />
          </div>

          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/30" />

          <div className="relative z-10 flex min-h-[300px] items-center px-8 py-10 md:px-14">
            <div className="max-w-4xl text-white">
              <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-sm font-medium backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-orange-500" />
                Featured Category
              </span>

              <h1 className="mb-5 text-4xl font-bold leading-tight md:text-5xl">
                {displayCategoryName}
              </h1>

              <p className="mb-7 max-w-3xl text-base leading-7 text-white/85 md:text-lg">
                {categoryDescription}
              </p>

              <div className="flex flex-wrap items-center gap-6 text-sm text-white/80">
                <span className="inline-flex items-center gap-2">
                  <FaBookOpen />
                  {documents.length} Resources
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* HEADER */}
        <div className="mb-7">
          <h2 className="text-xl font-semibold text-[#111827]">
            Explore Resources
          </h2>
        </div>

        {/* EMPTY STATE */}
        {documents.length === 0 ? (
          <div className="rounded-3xl bg-white p-16 text-center shadow-sm">
            <div className="mb-5 text-6xl">
              📚
            </div>

            <h3 className="mb-2 text-2xl font-bold text-[#111827]">
              No Resources Found
            </h3>

            <p className="text-[#6b7280]">
              No materials have been uploaded
              for this category yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
            {documents.map((doc, index) => {
              const fileType =
                getFileType(doc);

              const cardImage =
                resourceImages[
                  index %
                    resourceImages.length
                ];

              return (
                <div
                  key={doc.uuid}
                  onClick={() => {
                    window.open(
                      doc.materialUrl,
                      "_blank",
                      "noopener,noreferrer"
                    );
                  }}
                  className="group cursor-pointer overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5 transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  {/* IMAGE */}
                  <div className="relative h-44 overflow-hidden bg-black">
                    <Image
                      src={cardImage}
                      alt={
                        doc.fileName ||
                        "Resource"
                      }
                      width={700}
                      height={260}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />

                    {/* FILE TYPE */}
                    <div className="absolute right-4 top-4">
                      <span className="inline-flex items-center gap-1 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white">
                        <FaFilePdf />
                        {fileType}
                      </span>
                    </div>
                  </div>

                  {/* CONTENT */}
                  <div className="p-6">
                    <h3 className="mb-3 line-clamp-2 text-xl font-bold text-[#111827]">
                      {doc.fileName}
                    </h3>

                    <p className="mb-6 line-clamp-3 text-sm leading-6 text-[#6b7280]">
                      {doc.description ||
                        t(
                          "learnAndGrow.noDescriptionAvailable",
                          "No description available"
                        )}
                    </p>

                    {/* FOOTER */}
                    <div className="border-t border-black/10 pt-5">
                      <div className="grid grid-cols-3 items-center text-xs text-[#6b7280]">
                        {/* LEFT */}
                        <div className="flex items-center gap-2">
                          <FaBookOpen />
                          <span>Resource</span>
                        </div>

                        {/* CENTER */}
                        <div className="flex items-center justify-center gap-2">
                          <FaFilePdf />
                          <span>{fileType}</span>
                        </div>

                        {/* RIGHT */}
                        <div className="flex justify-end">
                          {["Admin"].includes(
                            userDetails?.role
                          ) ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();

                                handleDeleteDoc(
                                  doc
                                );
                              }}
                              className="inline-flex items-center gap-1 text-red-500 transition hover:text-red-600"
                            >
                              <BsTrash className="text-sm" />
                              <span>Delete</span>
                            </button>
                          ) : (
                            <div className="flex items-center gap-1 text-yellow-500">
                              <FaStar className="text-xs" />
                              <span>0.0</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryResourcesPage;