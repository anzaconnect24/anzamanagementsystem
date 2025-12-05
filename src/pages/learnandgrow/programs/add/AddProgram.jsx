"use client";

import Breadcrumb from "../../../../component/Breadcrumb";
import toast from "react-hot-toast";
import Spinner from "../../../../components/spinner";
import { useTranslation } from "../../../../locales";
import { useState } from "react";
import { uploadFile } from "../../../../controllers/file_upload_controller";
import { addProgram } from "../../../../controllers/program_controller";
import { useRouter } from "../../../../utils/navigation";
import { useSearchParams } from "react-router-dom";

const AddProgramPage = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setloading] = useState(false);
  const [searchParams] = useSearchParams();
  const course = searchParams.get("course");

  return (
    <div>
      <Breadcrumb
        prevLink={`/dashboard/programs/${course}`}
        prevPage={t("common.back", "Back")}
        pageName={t("programs.newProgram", "New Program")}
      />
      <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="py-6 px-4 md:px-6 xl:px-7.5 space-y-4">
          <h4 className="text-xl font-semibold text-black dark:text-white">
            {t("programs.addNewProgram", "Add new program for {{course}}", {
              course: decodeURIComponent(course),
            })}
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
                  title: e.target.title.value,
                  description: e.target.description.value,
                  programCategory: decodeURIComponent(course),
                };
                console.log("payload", payload);
                addProgram(payload).then((res) => {
                  toast.success(
                    t("programs.programAdded", "Program added successfully")
                  );
                  router.push(`/dashboard/programs/${course}`);
                  setloading(false);
                });
              });
            }}
          >
            <div className="grid grid-cols-2 gap-x-3">
              <div>
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                  {t("programs.title", "Title")}
                </label>
                <input
                  name="title"
                  required
                  className="w-full rounded border-stroke"
                  placeholder={t(
                    "programs.enterProgramTitle",
                    "Enter program title"
                  )}
                />
              </div>
              <div>
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                  {t("programs.programCoverImage", "Program Cover Image")}
                </label>
                <input
                  name="image"
                  type="file"
                  required
                  className="w-full rounded border-stroke"
                />
              </div>
              <div className="col-span-2">
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                  {t("programs.description", "Description")}
                </label>
                <textarea
                  name="description"
                  required
                  className="w-full rounded border-stroke"
                  placeholder={t(
                    "programs.enterProgramDescription",
                    "Enter program description"
                  )}
                />
              </div>
            </div>

            <button
              type="submit"
              className="py-3 px-4 mt-4 hover:opacity-95 rounded flex justify-center bg-primary text-white"
            >
              <div>
                {loading ? (
                  <Spinner />
                ) : (
                  t("programs.addProgram", "Add Program")
                )}
              </div>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddProgramPage;
