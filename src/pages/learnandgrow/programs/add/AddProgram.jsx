"use client";

import Breadcrumb from "../../../../component/Breadcrumb";
import toast from "react-hot-toast";
import Spinner from "../../../../components/spinner";
import { useTranslation } from "../../../../locales";
import { useEffect, useState } from "react";
import { uploadFile } from "../../../../controllers/file_upload_controller";
import { addProgram } from "../../../../controllers/program_controller";
import { useRouter } from "../../../../utils/navigation";
import { useSearchParams } from "react-router-dom";
import { PROGRAM_CATEGORIES } from "@/constants/programCategories";
import { getCohortProgramOptions } from "@/controllers/cohort_controller";

const AddProgramPage = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setloading] = useState(false);
  const [searchParams] = useSearchParams();
  const course = searchParams.get("course");
  // Set when arriving from a program's course page: the new course is
  // pre-attached to that program and we return there after saving.
  const fromProgram = searchParams.get("program");

  // Which programme cohorts may open this class. None ticked = open to every
  // startup, which is how classes behaved before access control existed.
  const [cohorts, setCohorts] = useState([]);
  const [allowedCohorts, setAllowedCohorts] = useState([]);

  useEffect(() => {
    getCohortProgramOptions().then(setCohorts);
  }, []);

  useEffect(() => {
    if (fromProgram) setAllowedCohorts([fromProgram]);
  }, [fromProgram]);

  return (
    <div>
      <Breadcrumb
        prevLink={`/dashboard/programs/${course}`}
        prevPage={t("common.back", "Back")}
        pageName={t("programs.addNewCourse", "Add New Course")}
      />
      <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="py-6 px-4 md:px-6 xl:px-7.5 space-y-4">
          <h4 className="text-xl font-semibold text-black dark:text-white">
            {t("programs.addNewCourseFor", "Add new course for {{course}}", {
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
                if (typeof url !== "string" || !url) {
                  toast.error(
                    t(
                      "programs.imageUploadFailed",
                      "Cover image upload failed",
                    ),
                  );
                  setloading(false);
                  return;
                }

                const payload = {
                  image: url,
                  title: e.target.title.value,
                  description: e.target.description.value,
                  programCategory: e.target.programCategory.value,
                  startDate: e.target.startDate.value || null,
                  endDate: e.target.endDate.value || null,
                  // Empty = open to every startup.
                  cohortProgramUuids: allowedCohorts,
                };
                console.log("payload", payload);
                addProgram(payload).then((res) => {
                  // addProgram resolves to the axios error response on
                  // failure, so a truthy result is not success on its own.
                  if (res?.status !== true) {
                    toast.error(
                      res?.data?.message ||
                        res?.message ||
                        t("programs.addFailed", "Failed to add program"),
                    );
                    setloading(false);
                    return;
                  }

                  toast.success(
                    t("programs.programAdded", "Program added successfully"),
                  );
                  router.push(
                    fromProgram
                      ? `/dashboard/programManagement/program/${fromProgram}/modules`
                      : `/dashboard/programs/${course}`,
                  );
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
                    "programs.enterCourseTitle",
                    "Enter course title",
                  )}
                />
              </div>
              <div>
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                  {t("programs.courseType", "Course Type")}
                </label>
                <select
                  name="programCategory"
                  defaultValue={decodeURIComponent(course || "")}
                  required
                  className="w-full rounded border-stroke"
                >
                  <option value="">
                    {t("programs.selectProgramType", "Select program category")}
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
                  {t("programs.courseCoverImage", "Course Cover Image")}
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
                    "Enter program description",
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
                  className="w-full rounded border-stroke"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="mb-2.5 block font-medium text-black dark:text-white">
                Program that can access this class
              </label>
              <select
                value={allowedCohorts[0] || ""}
                onChange={(e) =>
                  setAllowedCohorts(e.target.value ? [e.target.value] : [])
                }
                className="w-full rounded border-stroke"
              >
                <option value="">All programs (no restriction)</option>
                {cohorts.map((cohort) => (
                  <option key={cohort.uuid} value={cohort.uuid}>
                    {cohort.title}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-[#64748b]">
                {allowedCohorts.length === 0
                  ? "Every startup will be able to open this class."
                  : "Only startups in the selected program will see it."}
              </p>
            </div>

            <button
              type="submit"
              className="py-3 px-4 mt-4 hover:opacity-95 rounded flex justify-center bg-primary text-white"
            >
              <div>
                {loading ? <Spinner /> : t("programs.addCourse", "Add Course")}
              </div>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddProgramPage;
