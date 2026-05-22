"use client";
import {
  getDocuments,
  uploadPitchMaterial,
} from "../../../controllers/pitch_material_controller";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Loader from "../../../components/common/Loader";
import Breadcrumb from "../../../components/Breadcrumbs/Breadcrumb";
import Spinner from "../../../components/spinner";
import { uploadFile } from "../../../controllers/file_upload_controller";
import { useTranslation } from "../../../locales";

const UploadMaterialWithType = () => {
  const { type } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const categories = [
    "Finance & Fundraising",
    "Marketing & Sales",
    "Technology & Innovation",
    "Leadership & Personal Development",
    "Impact & Sustainability",
    "Legal & Compliance",
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let payload = {
        description: e.target.description.value,
        type,
        fileName: e.target.fileName.value,
        category: e.target.category.value,
        materialUrl: null,
        thumbnailUrl: null,
      };

      if (type === "video") {
        payload.materialUrl = e.target.url.value;
        await uploadPitchMaterial(payload);
        navigate(-1);
      } else {
        // Upload material file
        let formData = new FormData();
        formData.append("file", e.target.file.files[0]);
        const materialUrl = await uploadFile(formData);
        payload.materialUrl = materialUrl;

        // Upload thumbnail image
        let thumbnailFormData = new FormData();
        thumbnailFormData.append("file", e.target.thumbnail.files[0]);
        const thumbnailUrl = await uploadFile(thumbnailFormData);
        payload.thumbnailUrl = thumbnailUrl;

        // Create material record
        await uploadPitchMaterial(payload);
        navigate(-1);
      }
    } catch (error) {
      console.error("Error uploading material:", error);
      alert(
        t("pitchMaterials.errorUploadingMaterial", "Error uploading material")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Breadcrumb
        prevLink="/dashboard/pitchMaterials"
        prevPage={t("common.back", "Back")}
        pageName={t("pitchMaterials.uploadMaterial", "Upload Material")}
      />
      <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <form onSubmit={handleSubmit} className="py-6 px-4 md:px-6 xl:px-7.5">
          <h4 className="text-xl font-semibold text-black dark:text-white">
            {t("pitchMaterials.uploadNewMaterial", "Upload new material")}
          </h4>

          <div className="grid grid-cols-2 gap-y-3 gap-x-3 mt-4">
            <div>
              <label className="mb-2.5 block font-medium text-black dark:text-white">
                {t("pitchMaterials.title", "Title")}
              </label>
              <input
                name="fileName"
                required
                className="form-style disabled:opacity-75"
                placeholder={t(
                  "pitchMaterials.enterMaterialTitle",
                  "Enter material title"
                )}
                type="text"
              />
            </div>

            <div>
              <label className="mb-2.5 block font-medium text-black dark:text-white">
                {t("pitchMaterials.category", "Category")}
              </label>
              <select
                name="category"
                required
                className="form-style disabled:opacity-75"
                placeholder={t(
                  "pitchMaterials.selectCategory",
                  "Select category"
                )}
              >
                <option value="">
                  {t("pitchMaterials.selectCategory", "Select category")}
                </option>
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {t(
                      `pitchMaterials.categories.${item
                        .replace(/[^a-zA-Z0-9]/g, "")
                        .toLowerCase()}`,
                      item
                    )}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2.5 block font-medium text-black dark:text-white">
                {t("pitchMaterials.materialThumbnail", "Material Thumbnail")}
              </label>
              <input
                name="thumbnail"
                required
                className="form-style disabled:opacity-75"
                type="file"
                accept="image/*"
              />
            </div>

            {type !== "video" ? (
              <div>
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                  {t(
                    "pitchMaterials.uploadMaterialDocument",
                    "Upload material document (pdf,docx/doc)"
                  )}
                </label>
                <input
                  name="file"
                  required
                  className="form-style disabled:opacity-75"
                  type="file"
                  accept=".pdf,.doc,.docx"
                />
              </div>
            ) : (
              <div>
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                  {t("pitchMaterials.videoUrl", "Video URL")}
                </label>
                <input
                  name="url"
                  placeholder={t(
                    "pitchMaterials.enterVideoUrl",
                    "Enter video URL"
                  )}
                  required
                  className="form-style"
                  type="url"
                />
              </div>
            )}
          </div>

          <div className="mt-3">
            <label className="mb-2.5 block font-medium text-black dark:text-white">
              {t("pitchMaterials.materialDescription", "Material description")}
            </label>
            <textarea
              name="description"
              required
              className="form-style"
              placeholder={t(
                "pitchMaterials.writeMaterialDescription",
                "Write material description"
              )}
              rows={4}
            />
          </div>

          <div className="flex mt-6">
            <button
              type="submit"
              disabled={loading}
              className="py-3 px-4 w-40 flex justify-center bg-primary cursor-pointer text-white rounded hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div>
                {loading ? (
                  <Spinner />
                ) : (
                  t("pitchMaterials.uploadMaterial", "Upload Material")
                )}
              </div>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadMaterialWithType;
