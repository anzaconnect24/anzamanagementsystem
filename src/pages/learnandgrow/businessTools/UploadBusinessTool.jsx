"use client";
import { createBusinessTool } from "../../../controllers/business_tools_controller";
import { useState } from "react";
import { useRouter } from "@/utils/navigation";
import Loader from "../../../components/common/Loader";
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

      if (!file) {
        toast.error(
          t("businessTools.pleaseSelectFile", "Please select a file"),
        );
        setLoading(false);
        return;
      }

      // Upload file
      let formData = new FormData();
      formData.append("file", file);
      const fileUrl = await uploadFile(formData);

      // Prepare payload
      const payload = {
        fileName: e.target.fileName.value,
        description: e.target.description.value,
        fileType,
        fileUrl,
        fileSize: file.size,
      };

      // Create business tool record
      await createBusinessTool(payload);
      toast.success(
        t("businessTools.uploadSuccess", "Business tool uploaded successfully"),
      );
      router.push("/dashboard/businessTools");
    } catch (error) {
      console.error("Error uploading business tool:", error);
      toast.error(
        t("businessTools.errorUploading", "Error uploading business tool"),
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
        <form onSubmit={handleSubmit} className="py-6 px-4 md:px-6 xl:px-7.5">
          <h4 className="text-xl font-semibold text-black dark:text-white">
            {t("businessTools.uploadNewTool", "Upload new business tool")}
          </h4>

          <div className="grid grid-cols-2 gap-y-3 gap-x-3 mt-4">
            <div>
              <label className="mb-2.5 block font-medium text-black dark:text-white">
                {t("businessTools.fileName", "File Name")}
              </label>
              <input
                name="fileName"
                required
                className="form-style disabled:opacity-75"
                placeholder={t(
                  "businessTools.enterFileName",
                  "Enter file name",
                )}
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
                  const fileInput =
                    document.querySelector('input[name="file"]');
                  if (fileInput) {
                    fileInput.accept = getAcceptedFileExtensions(
                      e.target.value,
                    );
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

            <div className="col-span-2">
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
              <p className="text-sm text-gray-500 mt-1">
                {t(
                  "businessTools.supportedFormats",
                  "Supported formats: Word (.doc, .docx), Excel (.xls, .xlsx), PowerPoint (.ppt, .pptx), PDF (.pdf)",
                )}
              </p>
            </div>
          </div>

          <div className="mt-3">
            <label className="mb-2.5 block font-medium text-black dark:text-white">
              {t("businessTools.description", "Description")}
            </label>
            <textarea
              name="description"
              required
              className="form-style"
              placeholder={t(
                "businessTools.writeDescription",
                "Write a brief description of this tool",
              )}
              rows={4}
            />
          </div>

          <div className="flex gap-4 mt-6">
            <button
              type="submit"
              disabled={loading}
              className="py-3 px-4 w-40 flex justify-center bg-primary cursor-pointer text-white rounded hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div>
                {loading ? <Spinner /> : t("businessTools.upload", "Upload")}
              </div>
            </button>
            <button
              type="button"
              onClick={() => router.push("/dashboard/businessTools")}
              className="py-3 px-4 w-40 flex justify-center bg-gray-500 cursor-pointer text-white rounded hover:opacity-95"
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
