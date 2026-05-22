"use client";

import {
  updateBusinessTool,
  getBusinessTool,
} from "../../../controllers/business_tools_controller";
import { useState, useEffect } from "react";
import { useRouter } from "@/utils/navigation";
import { useParams } from "react-router-dom";
import Loader from "../../../components/common/Loader";
import Breadcrumb from "../../../components/Breadcrumbs/Breadcrumb";
import Spinner from "../../../components/spinner";
import { uploadFile } from "../../../controllers/file_upload_controller";
import { useTranslation } from "../../../locales";
import toast from "react-hot-toast";

const EditBusinessTool = () => {
  const { uuid } = useParams();
  const router = useRouter();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [toolData, setToolData] = useState(null);

  const fileTypes = [
    { value: "word", label: "Word Document (.doc, .docx)" },
    { value: "excel", label: "Excel Spreadsheet (.xls, .xlsx)" },
    { value: "ppt", label: "PowerPoint Presentation (.ppt, .pptx)" },
    { value: "pdf", label: "PDF Document (.pdf)" },
  ];

  useEffect(() => {
    loadToolData();
  }, [uuid]);

  const loadToolData = async () => {
    setInitialLoading(true);

    try {
      const response = await getBusinessTool(uuid);
      setToolData(response.body || response.data);
    } catch (error) {
      console.error(error);
      toast.error(
        t("businessTools.failedToLoad", "Failed to load business tool")
      );
      router.push("/dashboard/businessTools");
    } finally {
      setInitialLoading(false);
    }
  };

  const getAcceptedFileExtensions = (fileType) => {
    switch (fileType) {
      case "word":
        return ".doc,.docx";
      case "excel":
        return ".xls,.xlsx";
      case "ppt":
        return ".ppt,.pptx";
      case "pdf":
        return ".pdf";
      default:
        return ".doc,.docx,.xls,.xlsx,.ppt,.pptx,.pdf";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const fileType = e.target.fileType.value;
      const file = e.target.file.files[0];
      const thumbnail = e.target.thumbnail.files[0];

      let fileUrl = toolData.fileUrl;
      let fileSize = toolData.fileSize;
      let thumbnailUrl = toolData.thumbnailUrl;

      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        fileUrl = await uploadFile(formData);
        fileSize = file.size;
      }

      if (thumbnail) {
        const thumbnailFormData = new FormData();
        thumbnailFormData.append("file", thumbnail);
        thumbnailUrl = await uploadFile(thumbnailFormData);
      }

      const payload = {
        fileName: e.target.fileName.value,
        description: e.target.description.value,
        fileType,
        fileUrl,
        fileSize,
        thumbnailUrl,
      };

      await updateBusinessTool(uuid, payload);

      toast.success(
        t("businessTools.updateSuccess", "Business tool updated successfully")
      );

      router.push("/dashboard/businessTools");
    } catch (error) {
      console.error("Error updating business tool:", error);
      toast.error(
        t("businessTools.errorUpdating", "Error updating business tool")
      );
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return <Loader />;
  if (!toolData) return null;

  return (
    <div>
      <Breadcrumb
        prevLink="/dashboard/businessTools"
        prevPage={t("common.back", "Back")}
        pageName={t("businessTools.editTool", "Edit Business Tool")}
      />

      <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <form onSubmit={handleSubmit} className="px-4 py-6 md:px-6 xl:px-7.5">
          <h4 className="text-xl font-semibold text-black dark:text-white">
            {t("businessTools.editTool", "Edit business tool")}
          </h4>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2.5 block font-medium text-black dark:text-white">
                {t("businessTools.fileName", "File Name")}
              </label>
              <input
                name="fileName"
                required
                defaultValue={toolData.fileName}
                className="form-style disabled:opacity-75"
                placeholder={t("businessTools.enterFileName", "Enter file name")}
                type="text"
              />
            </div>

            <div>
              <label className="mb-2.5 block font-medium text-black dark:text-white">
                {t("businessTools.fileType", "File Type")}
              </label>
              <select
                name="fileType"
                required
                defaultValue={toolData.fileType}
                className="form-style disabled:opacity-75"
                onChange={(e) => {
                  const fileInput = document.querySelector('input[name="file"]');
                  if (fileInput) {
                    fileInput.accept = getAcceptedFileExtensions(e.target.value);
                  }
                }}
              >
                <option value="">
                  {t("businessTools.selectFileType", "Select file type")}
                </option>

                {fileTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-2.5 block font-medium text-black dark:text-white">
                {t(
                  "businessTools.thumbnailImage",
                  "Thumbnail Image"
                )}
              </label>

              {toolData.thumbnailUrl && (
                <div className="mb-3 h-40 w-full max-w-sm overflow-hidden rounded-lg bg-black">
                  <img
                    src={toolData.thumbnailUrl}
                    alt={toolData.fileName}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}

              <input
                name="thumbnail"
                className="form-style disabled:opacity-75"
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
              />

              <p className="mt-1 text-sm text-gray-500">
                {t(
                  "businessTools.thumbnailHelp",
                  "Upload a new image only if you want to replace the current card image."
                )}
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="mb-2.5 block font-medium text-black dark:text-white">
                {t(
                  "businessTools.uploadFile",
                  "Upload File (Optional - leave empty to keep current file)"
                )}
              </label>
              <input
                name="file"
                className="form-style disabled:opacity-75"
                type="file"
                accept={getAcceptedFileExtensions(toolData.fileType)}
              />

              <p className="mt-1 text-sm text-gray-500">
                {t("businessTools.currentFile", "Current file:")}{" "}
                <a
                  href={toolData.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {toolData.fileName}
                </a>
              </p>
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-2.5 block font-medium text-black dark:text-white">
              {t("businessTools.description", "Description")}
            </label>
            <textarea
              name="description"
              required
              defaultValue={toolData.description}
              className="form-style"
              placeholder={t(
                "businessTools.writeDescription",
                "Write a brief description of this tool"
              )}
              rows={4}
            />
          </div>

          <div className="mt-6 flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex w-40 cursor-pointer justify-center rounded bg-primary px-4 py-3 text-white hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? <Spinner /> : t("businessTools.update", "Update")}
            </button>

            <button
              type="button"
              onClick={() => router.push("/dashboard/businessTools")}
              className="flex w-40 cursor-pointer justify-center rounded bg-gray-500 px-4 py-3 text-white hover:opacity-95"
            >
              {t("common.cancel", "Cancel")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditBusinessTool;