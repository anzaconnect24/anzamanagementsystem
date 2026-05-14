"use client";

import { useContext, useEffect, useState } from "react";
import { useRouter } from "@/utils/navigation";
import Link from "@/utils/link";
import Loader from "@/components/common/Loader";
import {
  deleteBusinessTool,
  getAllBusinessTools,
} from "@/controllers/business_tools_controller";
import toast from "react-hot-toast";
import { UserContext } from "../../../layouts/DashboardLayout";
import {
  FaEdit,
  FaTrash,
  FaStar,
  FaDownload,
  FaLayerGroup,
  FaClock,
} from "react-icons/fa";

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

      setTools((prev) =>
        prev.filter((item) => item.uuid !== tool.uuid)
      );
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
      {tools[0] && (
        <div
          onClick={() =>
            handleDownload(tools[0].fileUrl, tools[0].fileName)
          }
          className="relative mb-10 min-h-[320px] cursor-pointer overflow-hidden rounded-2xl bg-black shadow-sm"
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url('${
                tools[0].thumbnailUrl ||
                "/images/business_tools_hero.svg"
              }')`,
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
              Download ready-to-use templates, documents, and tools
              to help you manage, structure, and grow your business
              more effectively.
            </p>

            <div className="flex flex-wrap items-center gap-6 text-sm text-white/85">
              <span className="flex items-center gap-2">
                <FaLayerGroup />
                {tools.length} Tools
              </span>

              <span className="flex items-center gap-2">
                <FaDownload />
                Downloadable Resources
              </span>

              <span className="flex items-center gap-2">
                <FaClock />
                Practical Support
              </span>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-[#172033]">
          Available Tools
        </h2>

        {["Admin"].includes(userDetails.role) && (
          <Link
            href="/dashboard/uploadBusinessTool"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md active:scale-[0.98]"
          >
            <FaDownload className="text-lg text-blue-200" />
            Add Business Tool
          </Link>
        )}
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <div
            key={tool.uuid}
            onClick={() =>
              handleDownload(tool.fileUrl, tool.fileName)
            }
            className="group cursor-pointer overflow-hidden rounded-xl bg-white shadow-md transition duration-200 hover:scale-[1.02] hover:shadow-lg"
          >
            <div className="relative h-40 overflow-hidden bg-black">
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                style={{
                  backgroundImage: `url('${
                    tool.thumbnailUrl ||
                    "/images/business-tool-card.jpg"
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
                  <span className="flex items-center gap-1 text-[#f6b800]">
                    <FaStar />
                    0.0
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BusinessTools;