"use client";

import Breadcrumb from "@/app/component/Breadcrumb";
import toast from "react-hot-toast";
import Spinner from "@/components/spinner";
import { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { uploadFile } from "@/app/controllers/file_upload_controller";
import { createModule } from "../../../../controllers/modules_controller";

const Page = () => {
  const router = useRouter();
  const [loading, setloading] = useState(false);
  const params = useSearchParams();
  const course = params.get("course");
  return (
    <div>
      <Breadcrumb prevLink={``} prevPage="Back" pageName="New module" />
      <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="py-6 px-4 md:px-6 xl:px-7.5 space-y-4 ">
          <h4 className="text-xl font-semibold text-black dark:text-white">
            Add new {course} module
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
                  course,
                  title: e.target.title.value,
                  description: e.target.description.value,
                };
                console.log(payload);
                createModule(payload).then((res) => {
                  router.back();
                  setloading(false);
                });
              });
            }}
          >
            <div className="grid grid-cols-2 gap-x-3">
              <div>
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                  Title
                </label>
                <input
                  name="title"
                  className="w-full rounded border-stroke"
                  placeholder="Enter module title"
                />
              </div>
              <div>
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                  Module Cover image
                </label>
                <input
                  name="image"
                  type="file"
                  className="w-full rounded border-stroke"
                />
              </div>
              <div className=" col-span-2">
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                  Description
                </label>
                <textarea
                  name="description"
                  className="w-full rounded border-stroke"
                  placeholder="Enter sector name"
                />
              </div>
            </div>

            <button
              type="submit"
              className="py-3 px-4 mt-4 hover:opacity-95 rounded flex justify-center bg-primary text-white"
            >
              <div>{loading ? <Spinner /> : "Add module"}</div>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Page;
