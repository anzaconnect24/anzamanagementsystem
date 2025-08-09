"use client";

import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Loader from "@/components/common/Loader";
import { UserContext } from "@/app/(dashboard)/layout";
import {
  deletePitchMaterial,
  getDocuments,
} from "@/app/controllers/pitch_material_controller";
import Image from "next/image";
import { BsTrash } from "react-icons/bs";
import { deleteBusinessDocument } from "@/app/controllers/business_controller";
import toast from "react-hot-toast";
import { FaFilePdf } from "react-icons/fa";

const Page = ({ params }) => {
  const { uuid } = params;
  const { userDetails } = useContext(UserContext);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  // Modal state for viewing resources by category
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedDocs, setSelectedDocs] = useState([]);

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
    "Finance and Fundraising",
    "Marketing & Sales",
    "Technology & Innovation",
    "Leadership & Personal Development",
    "Impact & Sustainability",
    "Legal & Compliance",
  ];

  // Group documents by category
  const groupedDocuments = categories.reduce((acc, category) => {
    acc[category] = data.filter((doc) => doc.category === category);
    return acc;
  }, {});

  // Helper to open modal for a given category
  const openCategoryModal = (category, docs) => {
    setSelectedCategory(category);
    setSelectedDocs(docs);
    setIsModalOpen(true);
  };
  const closeCategoryModal = () => {
    setIsModalOpen(false);
    setSelectedCategory("");
    setSelectedDocs([]);
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
      // Remove from overall data and currently selected docs
      setData((prev) => prev.filter((d) => d.uuid !== doc.uuid));
      setSelectedDocs((prev) => prev.filter((d) => d.uuid !== doc.uuid));
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete resource");
    }
  };

  return loading ? (
    <Loader />
  ) : (
    <div>
      {/* Stats Section - Full Width */}
      <h1 className="text-2xl font-bold">Welcome back {userDetails.name}!</h1>
      <div className="bg-primary/10 p-6 rounded-xl mb-4 mt-4">
        <p>
          Welcome to your one-stop hub for actionable tools, templates, guides,
          and learning materials. Whether you're validating an idea, scaling
          your business, or preparing for investment, these resources are
          designed to support every stage of your entrepreneurial journey.
        </p>
      </div>

      {["Admin"].includes(userDetails.role) && (
        <div className="mb-4">
          <Link
            href={"/uploadMaterial/document"}
            className="text-white bg-primary py-2 px-3 cursor-pointer rounded"
          >
            Add Material
          </Link>
        </div>
      )}

      <h1 className="text-xl font-bold">Available Resources</h1>

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
                    ? `${categoryDocs.length} resource${
                        categoryDocs.length > 1 ? "s" : ""
                      } available in this category`
                    : "No materials available in this category"}
                </p>
                <button
                  type="button"
                  onClick={() => openCategoryModal(category, categoryDocs)}
                  disabled={categoryDocs.length === 0}
                  className={`bg-primary px-4 py-2 rounded-lg text-white mt-0 ${
                    categoryDocs.length === 0
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-primary/90"
                  }`}
                >
                  View Resources
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Category Resources */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeCategoryModal}
          ></div>
          {/* Modal Panel */}
          <div className="relative z-10 w-[90vw] max-w-3xl max-h-[80vh] overflow-hidden rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="text-xl font-bold">
                {selectedCategory} Resources ({selectedDocs.length})
              </h2>
              <button
                onClick={closeCategoryModal}
                className="text-2xl leading-none px-2 hover:text-primary"
                aria-label="Close"
                title="Close"
              >
                ×
              </button>
            </div>
            <div className="p-5 overflow-y-auto max-h-[70vh]">
              {selectedDocs.length === 0 ? (
                <p className="text-gray-600">No resources available.</p>
              ) : (
                <ul className="space-y-4">
                  {selectedDocs.map((doc) => (
                    <li
                      key={doc.uuid}
                      className="flex items-center gap-4 border border-black/10 rounded-lg p-4 hover:shadow-sm"
                    >
                      {isPdf(doc) ? (
                        <FaFilePdf
                          size={36}
                          className="text-red-600 flex-shrink-0"
                          aria-label="PDF document"
                        />
                      ) : (
                        <Image
                          src={doc.thumbnailUrl || "/discussion.avif"}
                          alt={doc.fileName}
                          width={64}
                          height={64}
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-semibold line-clamp-1">
                          {doc.fileName}
                        </p>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {doc.description}
                        </p>
                      </div>
                      {["Admin"].includes(userDetails.role) && (
                        <button
                          onClick={() => handleDeleteDoc(doc)}
                          className="text-red-600 hover:text-red-700 px-3 py-2 rounded flex items-center gap-1 border border-red-200 hover:bg-red-50"
                          title="Delete resource"
                          aria-label="Delete resource"
                        >
                          <BsTrash />
                          Delete
                        </button>
                      )}
                      <a
                        href={doc.materialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90"
                        title="Open PDF"
                      >
                        Open PDF
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Page;
