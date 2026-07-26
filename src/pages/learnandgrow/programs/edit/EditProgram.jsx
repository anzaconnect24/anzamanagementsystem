"use client";

import Breadcrumb from "../../../../component/Breadcrumb";
import toast from "react-hot-toast";
import Spinner from "../../../../components/spinner";
import { useTranslation } from "../../../../locales";
import { useEffect, useState } from "react";
import { uploadFile } from "../../../../controllers/file_upload_controller";
import {
  editProgram,
  getProgram,
} from "../../../../controllers/program_controller";
import { cleanProgramDescription } from "@/utils/programMeta";
import { useRouter } from "../../../../utils/navigation";
import { useSearchParams } from "react-router-dom";

const PROGRAM_CATEGORIES = [
  "Ideation",
  "Business Foundation",
  "Investment Readiness",
];

const EditProgramPage = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const [searchParams] = useSearchParams();
  const uuid = searchParams.get("uuid");
  const course = searchParams.get("course");

  const [program, setProgram] = useState(null);
  const [loading, setloading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    getProgram(uuid).then((res) => {
      setProgram(res);
      setPreviewImage(res?.image);
    });
  }, [uuid]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const localUrl = URL.createObjectURL(file);
      setPreviewImage(localUrl);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setloading(true);

    const file = e.target.image.files[0];
    let imageUrl = program.image;

    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      imageUrl = await uploadFile(formData);
    }

    const payload = {
      image: imageUrl,
      title: e.target.title.value,
      description: e.target.description.value,
      programCategory: e.target.programCategory.value,
      startDate: e.target.startDate.value || null,
      endDate: e.target.endDate.value || null,
    };

    try {
      await editProgram(uuid, payload);
      toast.success(t("programs.programUpdated", "Program updated"));
      router.push(`/dashboard/programs/${course}`);
    } catch (err) {
      toast.error(t("programs.updateFailed", "Update failed"));
    } finally {
      setloading(false);
    }
  };

  return (
    program && (
      <div>
        <Breadcrumb
          prevLink={`/dashboard/programs/${course}`}
          prevPage={t("common.back", "Back")}
          pageName={t("programs.editProgram", "Edit Program")}
        />
        <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="py-6 px-4 md:px-6 xl:px-7.5 space-y-4">
            <h4 className="text-xl font-semibold text-black dark:text-white">
              {t("programs.editProgram", "Edit Program")}
            </h4>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-x-3">
                <div>
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                    {t("programs.title", "Title")}
                  </label>
                  <input
                    name="title"
                    defaultValue={program.title}
                    required
                    className="w-full rounded border-stroke"
                    placeholder={t(
                      "programs.enterProgramTitle",
                      "Enter program title",
                    )}
                  />
                </div>

                <div>
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                    {t("programs.programType", "Program category")}
                  </label>
                  <select
                    name="programCategory"
                    defaultValue={
                      program.programCategory ||
                      decodeURIComponent(course || "")
                    }
                    required
                    className="w-full rounded border-stroke"
                  >
                    <option value="">
                      {t(
                        "programs.selectProgramType",
                        "Select program category",
                      )}
                    </option>
                    {PROGRAM_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                    {t("programs.programCoverImage", "Program Cover Image")}
                  </label>
                  <input
                    name="image"
                    type="file"
                    onChange={handleImageChange}
                    className="w-full rounded border-stroke"
                  />
                  {previewImage && (
                    <img
                      src={previewImage}
                      alt={t("programs.preview", "Preview")}
                      className="mt-2 h-32 object-cover rounded"
                    />
                  )}
                </div>

                <div className="col-span-2">
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                    {t("programs.description", "Description")}
                  </label>
                  <textarea
                    name="description"
                    defaultValue={cleanProgramDescription(program.description)}
                    required
                    className="w-full rounded border-stroke"
                    placeholder={t(
                      "programs.enterProgramDescription",
                      "Enter description",
                    )}
                  />
                </div>

                <div>
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                    {t("programs.timelineStart", "Timeline start")}
                  </label>
                  <input
                    name="startDate"
                    type="date"
                    defaultValue={program.startDate || ""}
                    className="w-full rounded border-stroke"
                  />
                </div>

                <div>
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                    {t("programs.timelineEnd", "Timeline end")}
                  </label>
                  <input
                    name="endDate"
                    type="date"
                    defaultValue={program.endDate || ""}
                    className="w-full rounded border-stroke"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="py-3 px-4 mt-4 hover:opacity-95 rounded flex justify-center bg-primary text-white"
              >
                {loading ? (
                  <Spinner />
                ) : (
                  t("programs.saveChanges", "Save Changes")
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  );
};

export default EditProgramPage;
