"use client";

import { createBusinessTool } from "../../../controllers/business_tools_controller";
import { useState } from "react";
import { useRouter } from "@/utils/navigation";
import Breadcrumb from "../../../components/Breadcrumbs/Breadcrumb";
import Spinner from "../../../components/spinner";
import { uploadFile } from "../../../controllers/file_upload_controller";
import { useTranslation } from "../../../locales";
import toast from "react-hot-toast";

const UploadBusinessTool = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const fileTypes = [
    { value: "word", label: "Word Document (.doc, .docx)" },
    { value: "excel", label: "Excel Spreadsheet (.xls, .xlsx)" },
    { value: "ppt", label: "PowerPoint Presentation (.ppt, .pptx)" },
    { value: "pdf", label: "PDF Document (.pdf)" },
  ];

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

      if (!file) {
        toast.error(t("businessTools.pleaseSelectFile", "Please select a file"));
        setLoading(false);
        return;
      }

      if (!thumbnail) {
        toast.error(
          t("businessTools.pleaseSelectThumbnail", "Please select a thumbnail image")
        );
        setLoading(false);
        return;
      }

      const fileFormData = new FormData();
      fileFormData.append("file", file);
      const fileUrl = await uploadFile(fileFormData);

      const thumbnailFormData = new FormData();
      thumbnailFormData.append("file", thumbnail);
      const thumbnailUrl = await uploadFile(thumbnailFormData);

      const payload = {
        fileName: e.target.fileName.value,
        description: e.target.description.value,
        fileType,
        fileUrl,
        fileSize: file.size,
        thumbnailUrl,
      };

      await createBusinessTool(payload);

      toast.success(
        t("businessTools.uploadSuccess", "Business tool uploaded successfully")
      );

      router.push("/dashboard/businessTools");
    } catch (error) {
      console.error("Error uploading business tool:", error);
      toast.error(
        t("businessTools.errorUploading", "Error uploading business tool")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Breadcrumb
        prevLink="/dashboard/businessTools"
        prevPage={t("common.back", "Back")}
        pageName={t("businessTools.uploadTool", "Upload Business Tool")}
      />

      <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <form onSubmit={handleSubmit} className="px-4 py-6 md:px-6 xl:px-7.5">
          <h4 className="text-xl font-semibold text-black dark:text-white">
            {t("businessTools.uploadNewTool", "Upload new business tool")}
          </h4>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2.5 block font-medium text-black dark:text-white">
                {t("businessTools.fileName", "File Name")}
              </label>
              <input
                name="fileName"
                required
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
                {t("businessTools.thumbnailImage", "Thumbnail Image")}
              </label>
              <input
                name="thumbnail"
                required
                className="form-style disabled:opacity-75"
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
              />
              <p className="mt-1 text-sm text-gray-500">
                {t(
                  "businessTools.thumbnailHelp",
                  "This image will appear on the business tool card."
                )}
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="mb-2.5 block font-medium text-black dark:text-white">
                {t("businessTools.uploadFile", "Upload File")}
              </label>
              <input
                name="file"
                required
                className="form-style disabled:opacity-75"
                type="file"
                accept=".doc,.docx,.xls,.xlsx,.ppt,.pptx,.pdf"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-2.5 block font-medium text-black dark:text-white">
              {t("businessTools.description", "Description")}
            </label>
            <textarea
              name="description"
              required
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
              className="flex w-40 justify-center rounded bg-primary px-4 py-3 text-white hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? <Spinner /> : t("businessTools.upload", "Upload")}
            </button>

            <button
              type="button"
              onClick={() => router.push("/dashboard/businessTools")}
              className="flex w-40 justify-center rounded bg-gray-500 px-4 py-3 text-white hover:opacity-95"
            >
              {t("common.cancel", "Cancel")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadBusinessTool;