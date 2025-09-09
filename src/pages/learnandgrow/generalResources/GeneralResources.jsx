"use client";

import { useContext, useEffect, useState } from "react";
import { useRouter } from "@/utils/navigation";
import Link from "@/utils/link";
import Loader from "@/components/common/Loader";
import {
  deletePitchMaterial,
  getDocuments,
} from "@/controllers/pitch_material_controller";
import Image from "@/utils/image";
import toast from "react-hot-toast";
import { useTranslation } from "../../../locales";
import { UserContext } from "../../../layouts/DashboardLayout";

const Page = ({ params }) => {
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
        console.log(res);
        setData(res);
      })
      .finally(() => setLoading(false));
  };
  // Define categories
  const categories = [
    t("learnAndGrow.financeAndFundraising", "Finance and Fundraising"),
    t("learnAndGrow.marketingAndSales", "Marketing & Sales"),
    t("learnAndGrow.technologyAndInnovation", "Technology & Innovation"),
    t(
      "learnAndGrow.leadershipAndPersonalDevelopment",
      "Leadership & Personal Development"
    ),
    t("learnAndGrow.impactAndSustainability", "Impact & Sustainability"),
    t("learnAndGrow.legalAndCompliance", "Legal & Compliance"),
  ];

  // Group documents by category
  const groupedDocuments = categories.reduce((acc, category) => {
    acc[category] = data.filter((doc) => doc.category === category);
    return acc;
  }, {});

  // Helper to determine if a doc/url is a PDF
  const isPdf = (doc) => {
    if (!doc) return false;
    if (doc.type && doc.type.toLowerCase() === "document") return true;
    return /\.pdf(\?.*)?$/i.test(doc.materialUrl || "");
  };

  // Admin: delete a resource and update lists
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
      toast.success(t("learnAndGrow.resourceDeleted", "Resource deleted"));
      // Remove from overall data
      setData((prev) => prev.filter((d) => d.uuid !== doc.uuid));
    } catch (e) {
      console.error(e);
      toast.error(
        t("learnAndGrow.failedToDelete", "Failed to delete resource")
      );
    }
  };

  return loading ? (
    <Loader />
  ) : (
    <div>
      {/* Stats Section - Full Width */}
      <h1 className="text-2xl font-bold">
        {t("learnAndGrow.welcomeBack", "Welcome back")} {userDetails.name}!
      </h1>
      <div className="bg-primary/10 p-6 rounded-xl mb-4 mt-4">
        <p>
          {t(
            "learnAndGrow.welcomeMessage",
            "Welcome to your one-stop hub for actionable tools, templates, guides, and learning materials. Whether you're validating an idea, scaling your business, or preparing for investment, these resources are designed to support every stage of your entrepreneurial journey."
          )}
        </p>
      </div>

      {["Admin"].includes(userDetails.role) && (
        <div className="mb-4">
          <Link
            href={"/uploadMaterial/document"}
            className="text-white bg-primary py-2 px-3 cursor-pointer rounded"
          >
            {t("learnAndGrow.addMaterial", "Add Material")}
          </Link>
        </div>
      )}

      <h1 className="text-xl font-bold">
        {t("learnAndGrow.availableResources", "Available Resources")}
      </h1>

      <div className="grid grid-cols-3 gap-6 pt-4">
        {categories.map((category) => {
          const categoryDocs = groupedDocuments[category] || [];
          const firstDoc = categoryDocs[0];

          return (
            <div
              key={category}
              className="border border-black/10 bg-white rounded-lg p-5 flex flex-col items-center"
            >
              {/* Always show thumbnail in the grid; PDF icon will be used only in the modal list */}
              <Image
                className="h-48 w-auto object-contain"
                src={firstDoc?.thumbnailUrl || "/discussion.avif"}
                alt={category}
                width={600}
                height={300}
              />
              <div className="flex flex-col items-start w-full mt-3">
                <h1 className="font-bold text-lg">{category}</h1>
                <p className="mb-4">
                  {categoryDocs.length > 0
                    ? `${categoryDocs.length} ${t(
                        "learnAndGrow.resource",
                        "resource"
                      )}${categoryDocs.length > 1 ? "s" : ""} ${t(
                        "learnAndGrow.availableInCategory",
                        "available in this category"
                      )}`
                    : t(
                        "learnAndGrow.noMaterialsAvailable",
                        "No materials available in this category"
                      )}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/generalResources/category/${encodeURIComponent(
                        category
                      )}`
                    )
                  }
                  disabled={categoryDocs.length === 0}
                  className={`bg-primary px-4 py-2 rounded-lg text-white mt-0 ${
                    categoryDocs.length === 0
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-primary/90"
                  }`}
                >
                  {t("learnAndGrow.viewResources", "View Resources")}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Page;
