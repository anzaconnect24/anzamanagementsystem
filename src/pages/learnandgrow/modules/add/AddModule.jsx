"use client";

import Breadcrumb from "../../../../component/Breadcrumb";
import toast from "react-hot-toast";
import Spinner from "../../../../components/spinner";
import { useTranslation } from "../../../../locales";
import { useState } from "react";
import { uploadFile } from "../../../../controllers/file_upload_controller";
import { createModule } from "../../../../controllers/modules_controller";
import { useRouter } from "../../../../utils/navigation";
import { useParams, useSearchParams } from "react-router-dom";

const Page = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setloading] = useState(false);
  const [searchParams] = useSearchParams();
  // A module now belongs to a program. programId is the older course-scoped
  // form, still honoured for the modules authored that way.
  const cohortProgram = searchParams.get("cohortProgram");
  const programId = searchParams.get("programId");

  const backLink = cohortProgram
    ? `/dashboard/programManagement/program/${cohortProgram}/modules`
    : `/dashboard/modules/${programId}`;

  return (
    <div>
      <Breadcrumb
        prevLink={backLink}
        prevPage={t("common.back", "Back")}
        pageName={t("modules.newModule", "New module")}
      />
      <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="py-6 px-4 md:px-6 xl:px-7.5 space-y-4 ">
          <h4 className="text-xl font-semibold text-black dark:text-white">
            {t("modules.addNewModule", "Add new module")}
          </h4>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setloading(true);
              const formData = new FormData();
              formData.append("file", e.target.image.files[0]);
              uploadFile(formData).then((url) => {
                const payload = {
                  image: url,
                  cohort_program_uuid: cohortProgram || undefined,
                  program_uuid: cohortProgram ? undefined : programId,
                  title: e.target.title.value,
                  description: e.target.description.value,
                };

                createModule(payload).then(() => {
                  router.push(backLink);
                  setloading(false);
                });
              });
            }}
          >
            <div className="grid grid-cols-2 gap-x-3">
              <div>
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                  {t("modules.title", "Title")}
                </label>
                <input
                  name="title"
                  className="w-full rounded border-stroke"
                  placeholder={t(
                    "modules.enterModuleTitle",
                    "Enter module title",
                  )}
                />
              </div>
              <div>
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                  {t("modules.moduleCoverImage", "Module Cover image")}
                </label>
                <input
                  name="image"
                  type="file"
                  className="w-full rounded border-stroke"
                />
              </div>
              <div className=" col-span-2">
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                  {t("modules.description", "Description")}
                </label>
                <textarea
                  name="description"
                  className="w-full rounded border-stroke"
                  placeholder={t(
                    "modules.enterModuleDescription",
                    "Enter module description",
                  )}
                />
              </div>
            </div>

            <button
              type="submit"
              className="py-3 px-4 mt-4 hover:opacity-95 rounded flex justify-center bg-primary text-white"
            >
              <div>
                {loading ? <Spinner /> : t("modules.addModule", "Add module")}
              </div>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Page;
