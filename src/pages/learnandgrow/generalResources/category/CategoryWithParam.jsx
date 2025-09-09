"use client";

import { useContext, useEffect, useState } from "react";
import { useRouter } from "@/utils/navigation";
import { useParams } from "react-router-dom";
import Link from "@/utils/link";
import Loader from "@/components/common/Loader";
import { UserContext } from "@/layouts/DashboardLayout";
import {
  deletePitchMaterial,
  getDocuments,
} from "@/controllers/pitch_material_controller";
import Image from "@/utils/image";
import { BsTrash } from "react-icons/bs";
import toast from "react-hot-toast";
import { FaFilePdf, FaArrowLeft } from "react-icons/fa";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";

const CategoryResourcesPage = () => {
  const { category } = useParams();
  const { userDetails } = useContext(UserContext);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState([]);

  // Decode the category from URL
  const decodedCategory = decodeURIComponent(category);

  useEffect(() => {
    loadData();
  }, [category]);

  const loadData = () => {
    setLoading(true);
    getDocuments()
      .then((res) => {
        // Filter documents by category
        const categoryDocs = res.filter(
          (doc) => doc.category === decodedCategory
        );
        setDocuments(categoryDocs);
      })
      .finally(() => setLoading(false));
  };

  // Helper to determine if a doc/url is a PDF
  const isPdf = (doc) => {
    if (!doc) return false;
    if (doc.type && doc.type.toLowerCase() === "document") return true;
    return /\.pdf(\?.*)?$/i.test(doc.materialUrl || "");
  };

  // Admin: delete a resource and update lists
  const handleDeleteDoc = async (doc) => {
    const confirmed = confirm(
      "Delete this resource? This action cannot be undone."
    );
    if (!confirmed) return;
    try {
      await deletePitchMaterial(doc.uuid);
      toast.success("Resource deleted");
      // Remove from documents list
      setDocuments((prev) => prev.filter((d) => d.uuid !== doc.uuid));
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete resource");
    }
  };

  return loading ? (
    <Loader />
  ) : (
    <div className="container mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Breadcrumb
          prevLink="/generalResources"
          prevPage="General Resources"
          pageName={decodedCategory}
        />
      </div>

      {/* Header */}
      {/* <div className="rounded-xl border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-6">
        <div className="p-6 border-b border-stroke dark:border-strokedark">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <FaArrowLeft />
                Back
              </button>
              <div>
                <h1 className="text-2xl font-bold text-black dark:text-white">
                  {decodedCategory}
                </h1>
                <p className="mt-1 text-bodydark2">
                  {documents.length} resource{documents.length !== 1 ? "s" : ""}{" "}
                  available in this category
                </p>
              </div>
            </div>
            {["Admin"].includes(userDetails.role) && (
              <Link
                href="/uploadMaterial/document"
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Add Material
              </Link>
            )}
          </div>
        </div>
      </div> */}

      {/* Documents Grid */}
      {documents.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-boxdark rounded-xl border border-stroke dark:border-strokedark">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No Resources Found
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            No materials have been uploaded for this category yet.
          </p>
          {["Admin"].includes(userDetails.role) && (
            <Link
              href="/uploadMaterial/document"
              className="inline-block mt-4 bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Add First Material
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {documents.map((doc) => (
            <div
              key={doc.uuid}
              className="group bg-white dark:bg-boxdark flex flex-col justify-between rounded-xl border border-stroke dark:border-strokedark shadow-sm hover:shadow-lg transition-all duration-300"
            >
              {/* Document Thumbnail */}
              <div>
                <div className="relative aspect-[4/3] overflow-hidden rounded-t-xl">
                  {
                    <Image
                      src={doc.thumbnailUrl || "/discussion.avif"}
                      alt={doc.fileName}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  }
                  {/* Document Type Badge */}
                  <div className="absolute top-3 right-3">
                    <span className="px-2 py-1 bg-black/70 text-white text-xs rounded-full">
                      {isPdf(doc) ? "PDF" : "Document"}
                    </span>
                  </div>
                </div>

                {/* Document Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {doc.fileName}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                    {doc.description || "No description available"}
                  </p>

                  {/* Action Buttons */}
                </div>
              </div>
              <div className="flex flex-col gap-2 mt-auto px-4 pb-4">
                <a
                  href={doc.materialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors text-center font-medium"
                >
                  Open Resource
                </a>

                {["Admin"].includes(userDetails.role) && (
                  <button
                    onClick={() => handleDeleteDoc(doc)}
                    className="w-full text-red-600 hover:text-red-700 px-4 py-2 rounded-lg flex items-center justify-center gap-2 border border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <BsTrash />
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryResourcesPage;
