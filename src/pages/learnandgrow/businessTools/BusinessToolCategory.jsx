"use client";

import { useContext, useEffect, useState } from "react";
import { useRouter } from "@/utils/navigation";
import { useParams } from "react-router-dom";
import Link from "@/utils/link";
import Loader from "@/components/common/Loader";
import {
  deleteBusinessTool,
  getAllBusinessTools,
} from "@/controllers/business_tools_controller";
import toast from "react-hot-toast";
import { UserContext } from "../../../layouts/DashboardLayout";
import { BUSINESS_TOOL_CATEGORIES } from "../../../constants/learnAndGrowCategories";

import { FaEdit, FaTrash, FaDownload, FaArrowLeft, FaMagic } from "react-icons/fa";

const UNCATEGORIZED = "Uncategorized";

const BusinessToolCategory = () => {
  const { category } = useParams();
  const { userDetails } = useContext(UserContext);
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [tools, setTools] = useState([]);

  const decodedCategory = decodeURIComponent(category);

  const categoryMeta = BUSINESS_TOOL_CATEGORIES.find(
    (item) => item.name === decodedCategory
  );

  useEffect(() => {
    loadTools();
  }, [category]);

  const loadTools = () => {
    setLoading(true);

    getAllBusinessTools()
      .then((res) => {
        const allTools = res.body || [];

        const knownCategoryNames = BUSINESS_TOOL_CATEGORIES.map(
          (item) => item.name
        );

        const filtered =
          decodedCategory === UNCATEGORIZED
            ? allTools.filter(
                (tool) =>
                  !tool.category || !knownCategoryNames.includes(tool.category)
              )
            : allTools.filter((tool) => tool.category === decodedCategory);

        setTools(filtered);
      })
      .catch((error) => {
        console.error(error);
        toast.error("Failed to load business tools");
      })
      .finally(() => setLoading(false));
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "N/A";

    if (bytes < 1024) return `${bytes} B`;

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatFileType = (type) => {
    if (!type) return "File";

    return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  };

  const handleDelete = async (tool) => {
    const confirmed = confirm(
      `Are you sure you want to delete "${tool.fileName}"?`
    );

    if (!confirmed) return;

    try {
      await deleteBusinessTool(tool.uuid);

      toast.success("Deleted successfully");

      setTools((prev) => prev.filter((item) => item.uuid !== tool.uuid));
    } catch (error) {
      console.error(error);
      toast.error("Delete failed");
    }
  };

  const handleDownload = (fileUrl, fileName) => {
    const link = document.createElement("a");

    link.href = fileUrl;
    link.download = fileName;
    link.target = "_blank";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen px-6 py-4">
      {/* HERO */}
      <div className="relative mb-10 min-h-[220px] overflow-hidden rounded-2xl bg-black shadow-sm">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('${
              categoryMeta?.image || "/images/business_tools_hero.svg"
            }')`,
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-[#c9672b]/30" />

        <div className="relative z-10 max-w-3xl p-10 text-white">
          <Link
            href="/dashboard/businessTools"
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-white/85 hover:text-white"
          >
            <FaArrowLeft />
            Back to Business Tools
          </Link>

          <h2 className="mb-2 text-3xl font-bold leading-tight drop-shadow-lg">
            {decodedCategory}
          </h2>

          <p className="text-white/85 drop-shadow-md">
            {categoryMeta?.description ||
              "Business templates that haven't been assigned a category yet."}
          </p>
        </div>
      </div>

      {/* CARDS */}
      {tools.length === 0 ? (
        <div className="rounded-2xl bg-white p-16 text-center shadow-sm">
          <p className="text-[#6b7280]">
            No templates in this category yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <div
              key={tool.uuid}
              onClick={() => handleDownload(tool.fileUrl, tool.fileName)}
              className="group cursor-pointer overflow-hidden rounded-xl bg-white shadow-md transition duration-200 hover:scale-[1.02] hover:shadow-lg"
            >
              <div className="relative h-40 overflow-hidden bg-black">
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                  style={{
                    backgroundImage: `url('${
                      tool.thumbnailUrl || "/images/business-tool-card.jpg"
                    }')`,
                  }}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              </div>

              <div className="p-4">
                <h3
                  className="mb-2 line-clamp-1 text-base font-bold text-[#111827]"
                  title={tool.fileName}
                >
                  {tool.fileName}
                </h3>

                <p className="mb-6 line-clamp-2 text-sm text-[#6f6f72]">
                  {tool.description || "No description available"}
                </p>

                <div className="mb-3 flex items-center justify-between text-xs text-[#8a8f98]">
                  <span>{formatFileSize(tool.fileSize)}</span>
                  <span>{formatFileType(tool.fileType)}</span>
                </div>

                <div className="flex items-center justify-between border-t border-black/10 pt-4 text-xs text-[#8a8f98]">
                  <span className="flex items-center gap-2">
                    <FaDownload />
                    Downloadable
                  </span>

                  {["Admin"].includes(userDetails.role) ? (
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();

                          router.push(
                            `/dashboard/editBusinessTool/${tool.uuid}`
                          );
                        }}
                        className="flex items-center gap-1 text-green-600 hover:text-green-700"
                      >
                        <FaEdit />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(tool);
                        }}
                        className="flex items-center gap-1 text-red-600 hover:text-red-700"
                      >
                        <FaTrash />
                        Delete
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(tool.fileUrl, tool.fileName);
                        }}
                        className="flex items-center gap-2 font-medium text-[#f08a3c] transition hover:text-[#d97706]"
                      >
                        <FaDownload />
                        Download
                      </button>

                      {tool.aiEnabled && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(
                              `/dashboard/businessTools/generate/${tool.uuid}`
                            );
                          }}
                          className="flex items-center gap-2 font-medium text-[#082d77] transition hover:text-[#061f54]"
                        >
                          <FaMagic />
                          Generate with AI
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BusinessToolCategory;
