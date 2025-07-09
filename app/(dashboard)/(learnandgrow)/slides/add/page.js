"use client";

import Breadcrumb from "@/app/component/Breadcrumb";
import toast from "react-hot-toast";
import Spinner from "@/components/spinner";
import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { uploadFile } from "@/app/controllers/file_upload_controller";
import { createModule } from "../../../../controllers/modules_controller";
import { createSlide } from "../../../../controllers/slides_controller";

const Page = () => {
  const router = useRouter();
  const [loading, setloading] = useState(false);
  const params = useSearchParams();
  const uuid = params.get("uuid");
  const [isFile, setIsFile] = useState(false);

  return (
    <div>
      <Breadcrumb prevLink={``} prevPage="Back" pageName="New module" />
      <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="py-6 px-4 md:px-6 xl:px-7.5 space-y-4 ">
          <h4 className="text-xl font-semibold text-black dark:text-white">
            Add new slide
          </h4>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setloading(true);

              let payload = {
                module_uuid: uuid,
                title: e.target.title.value,
                type: isFile ? "file" : "text",
              };
              if (isFile) {
                var formData = new FormData();
                formData.append("file", e.target.file.files[0]);
                uploadFile(formData)
                  .then((url) => {
                    payload.file = url;
                    createSlide(payload).then((res) => {
                      router.back();
                      setloading(false);
                    });
                  })
                  .catch((err) => {
                    console.error(err);
                    toast.error("File upload failed");
                    setloading(false);
                    return;
                  });
              } else {
                payload.content = e.target.content.value;
                createSlide(payload).then((res) => {
                  router.back();
                  setloading(false);
                });
              }
              console.log(payload);
            }}
          >
            <div className="grid grid-cols-2 gap-x-3 gap-y-3">
              <div>
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                  Title
                </label>
                <input
                  name="title"
                  className="w-full rounded border-stroke"
                  placeholder="Enter slide title"
                />
              </div>
              <div>
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                  Type
                </label>
                <select
                  onChange={(e) => {
                    setIsFile(e.target.value === "file");
                  }}
                  className="w-full rounded border-stroke"
                  placeholder="Enter module title"
                >
                  <option value="text">Text</option>
                  <option value="file">File</option>
                </select>
              </div>
              {isFile ? (
                <div>
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                    File (PDF)
                  </label>
                  <input
                    name="file"
                    type="file"
                    className="w-full rounded border-stroke"
                    placeholder="Enter module title"
                  />
                </div>
              ) : (
                <div className=" col-span-2">
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                    Description
                  </label>
                  <textarea
                    name="content"
                    className="w-full rounded border-stroke"
                    placeholder="Enter sector name"
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              className="py-3 px-4 mt-4 hover:opacity-95 rounded flex justify-center bg-primary text-white"
            >
              <div>{loading ? <Spinner /> : "Add slide"}</div>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Page;
