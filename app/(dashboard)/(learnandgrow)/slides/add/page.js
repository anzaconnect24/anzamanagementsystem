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

              const payload = {
                module_uuid: uuid,
                content: e.target.content.value,
                title: e.target.title.value,
              };
              console.log(payload);
              createSlide(payload).then((res) => {
                router.back();
                setloading(false);
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
