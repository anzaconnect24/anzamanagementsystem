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
import { useTranslation } from "../../../locales";
import { UserContext } from "../../../layouts/DashboardLayout";
import {
  FaFileWord,
  FaFileExcel,
  FaFilePowerpoint,
  FaFilePdf,
  FaDownload,
  FaEdit,
  FaTrash,
} from "react-icons/fa";

const BusinessTools = () => {
  const { t } = useTranslation();
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
        console.log(res);
        setTools(res.body || []);
      })
      .catch((error) => {
        console.error(error);
        toast.error(
          t("businessTools.failedToLoad", "Failed to load business tools"),
        );
      })
      .finally(() => setLoading(false));
  };

  const getFileIcon = (fileType) => {
    switch (fileType?.toLowerCase()) {
      case "word":
        return <FaFileWord className="text-4xl text-blue-600" />;
      case "excel":
        return <FaFileExcel className="text-4xl text-green-600" />;
      case "ppt":
        return <FaFilePowerpoint className="text-4xl text-orange-600" />;
      case "pdf":
        return <FaFilePdf className="text-4xl text-red-600" />;
      default:
        return <FaFilePdf className="text-4xl text-gray-600" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "N/A";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const handleDelete = async (tool) => {
    const confirmed = confirm(
      t(
        "businessTools.deleteConfirm",
        `Are you sure you want to delete "${tool.fileName}"? This action cannot be undone.`,
      ),
    );
    if (!confirmed) return;

    try {
      await deleteBusinessTool(tool.uuid);
      toast.success(
        t("businessTools.deleteSuccess", "Business tool deleted successfully"),
      );
      setTools((prev) => prev.filter((t) => t.uuid !== tool.uuid));
    } catch (error) {
      console.error(error);
      toast.error(
        t("businessTools.deleteFailed", "Failed to delete business tool"),
      );
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

  return loading ? (
    <Loader />
  ) : (
    <div>
      {/* Header Section */}
      <div className="flex justify-between ">
        <h1 className="text-2xl font-bold">
          {t("businessTools.title", "Business Tools")}
        </h1>
        {["Admin"].includes(userDetails.role) && (
          <div className="mb-4">
            <Link
              href={"/dashboard/uploadBusinessTool"}
              className="text-white bg-primary py-2 px-3 cursor-pointer rounded hover:bg-primary/90"
            >
              {t("businessTools.uploadTool", "Upload Business Tool")}
            </Link>
          </div>
        )}
      </div>

      <div className="bg-primary/10 p-6 rounded-xl mb-4 mt-4">
        <p>
          {t(
            "businessTools.pageDescription",
            "Access essential business templates and tools including Word documents, Excel spreadsheets, PowerPoint presentations, and PDF guides to help you manage and grow your startup.",
          )}
        </p>
      </div>

      {/* Add Button for Admin */}

      {/* Tools List */}
      {tools.length === 0 ? (
        <div className="text-center py-20 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-black/10">
          <div className="flex flex-col items-center justify-center">
            <FaFilePdf className="text-6xl text-black/30 mb-4" />
            <h3 className="text-xl font-semibold text-black/70 mb-2">
              {t("businessTools.noTools", "No business tools available yet")}
            </h3>
            <p className="text-gray-500 mb-6 max-w-md">
              {["Admin"].includes(userDetails.role)
                ? t(
                    "businessTools.noToolsAdminMessage",
                    "Get started by uploading your first business template or tool to share with your community.",
                  )
                : t(
                    "businessTools.noToolsUserMessage",
                    "Business templates and tools will appear here once they are uploaded by administrators.",
                  )}
            </p>
            {["Admin"].includes(userDetails.role) && (
              <Link
                href="/dashboard/uploadBusinessTool"
                className="bg-primary text-white py-3 px-6 rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                {t("businessTools.uploadFirstTool", "Upload Your First Tool")}
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
          {tools.map((tool) => (
            <div
              key={tool.uuid}
              className="border border-black/10 bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow"
            >
              {/* File Icon */}
              <div className="flex items-center justify-center mb-4">
                {getFileIcon(tool.fileType)}
              </div>

              {/* File Info */}
              <div className="flex flex-col space-y-2">
                <h3
                  className="font-bold text-lg text-gray-800 truncate"
                  title={tool.fileName}
                >
                  {tool.fileName}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {tool.description ||
                    t(
                      "businessTools.noDescription",
                      "No description available",
                    )}
                </p>
                <p className="text-xs text-gray-500">
                  {t("businessTools.fileSize", "Size")}:{" "}
                  {formatFileSize(tool.fileSize)}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleDownload(tool.fileUrl, tool.fileName)}
                  className="flex-1 bg-primary text-white py-2 px-4 rounded hover:bg-primary/90 flex items-center justify-center gap-2"
                >
                  <FaDownload />
                  {t("businessTools.openFile", "Open File")}
                </button>

                {["Admin"].includes(userDetails.role) && (
                  <>
                    <button
                      onClick={() =>
                        router.push(`/dashboard/editBusinessTool/${tool.uuid}`)
                      }
                      className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 flex items-center justify-center"
                      title={t("businessTools.edit", "Edit")}
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(tool)}
                      className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 flex items-center justify-center"
                      title={t("businessTools.delete", "Delete")}
                    >
                      <FaTrash />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BusinessTools;
