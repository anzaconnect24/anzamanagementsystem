"use client";

import Breadcrumb from "../../../../component/Breadcrumb";
import toast from "react-hot-toast";
import Spinner from "../../../../components/spinner";
import { useTranslation } from "../../../../locales";
import { useEffect, useState } from "react";
import { uploadFile } from "../../../../controllers/file_upload_controller";
import {
  createModule,
  editModule,
  getModule,
} from "../../../../controllers/modules_controller";
import { useRouter } from "../../../../utils/navigation";
import { useSearchParams } from "react-router-dom";

const Page = () => {
  const { t } = useTranslation();bu
  const router = useRouter();
  const [searchParams] = useSearchParams();
  const uuid = searchParams.get("uuid");

  const [module, setModule] = useState(null);
  const [loading, setloading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null); // ✅ Preview selected image

  useEffect(() => {
    getModule(uuid).then((res) => {
      setModule(res);
      setPreviewImage(res?.image); // ✅ Set initial preview image
    });
  }, [uuid]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const localUrl = URL.createObjectURL(file);
      setPreviewImage(localUrl); // ✅ Show local preview
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setloading(true);

    const file = e.target.image.files[0];
    let imageUrl = module.image;

    // ✅ Upload new image if selected
    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      imageUrl = await uploadFile(formData);
    }

    const payload = {
      image: imageUrl,
      title: e.target.title.value,
      description: e.target.description.value,
    };

    try {
      await editModule(uuid, payload);
      toast.success(t("modules.moduleUpdated", "Module updated"));
      router.back();
    } catch (err) {
      toast.error(t("modules.updateFailed", "Update failed"));
    } finally {
      setloading(false);
    }
  };

  return (
    module && (
      <div>
        <Breadcrumb
          prevLink={``}
          prevPage={t("common.back", "Back")}
          pageName={t("modules.editModule", "Edit Module")}
        />
        <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="py-6 px-4 md:px-6 xl:px-7.5 space-y-4">
            <h4 className="text-xl font-semibold text-black dark:text-white">
              {t("modules.editModule", "Edit module")}
            </h4>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-x-3">
                <div>
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                    {t("modules.title", "Title")}
                  </label>
                  <input
                    name="title"
                    defaultValue={module.title}
                    className="w-full rounded border-stroke"
                    placeholder={t(
                      "modules.enterModuleTitle",
                      "Enter module title"
                    )}
                  />
                </div>

                <div>
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                    {t("modules.moduleCoverImage", "Module Cover Image")}
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
                      alt={t("modules.preview", "Preview")}
                      className="mt-2 h-32 object-cover rounded"
                    />
                  )}
                </div>

                <div className="col-span-2">
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                    {t("modules.description", "Description")}
                  </label>
                  <textarea
                    name="description"
                    defaultValue={module.description}
                    className="w-full rounded border-stroke"
                    placeholder={t(
                      "modules.enterModuleDescription",
                      "Enter description"
                    )}
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
                  t("modules.saveChanges", "Save Changes")
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  );
};

export default Page;
