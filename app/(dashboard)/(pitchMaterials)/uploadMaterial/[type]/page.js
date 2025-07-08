"use client";
import {
  getDocuments,
  uploadPitchMaterial,
} from "@/app/controllers/pitch_material_controller";
import { useEffect, useState } from "react";
import Link from "next/link";
import Loader from "@/components/common/Loader";
import { useRouter } from "next/navigation";
import Breadcrumb from "@/app/component/Breadcrumb";
import Spinner from "@/components/spinner";
import { uploadFile } from "@/app/controllers/file_upload_controller";

const Page = ({ params }) => {
  const type = params.type;
  const router = useRouter();
  const [loading, setloading] = useState(false);

  return (
    <div>
      <Breadcrumb prevLink={``} prevPage={`Back`} pageName="Upload Material" />
      <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setloading(true);
            let payload = {
              description: e.target.description.value,
              type,
              fileName: e.target.fileName.value,
              category: e.target.category.value,
              materialUrl: null,
              thumbnailUrl: null,
            };
            if (type == "video") {
              payload.materialUrl = e.target.url.value;
              uploadPitchMaterial(payload).then((data) => {
                router.back();
              });
            } else {
              //upload material file
              let formData = new FormData();
              formData.append("file", e.target.file.files[0]);
              uploadFile(formData).then((url) => {
                payload.materialUrl = url;
                //upload thumbnail image
                let formData = new FormData();
                formData.append("file", e.target.thumbnail.files[0]);
                uploadFile(formData).then((url) => {
                  payload.thumbnailUrl = url;
                  //create material record
                  uploadPitchMaterial(payload).then((data) => {
                    router.back();
                  });
                });
              });
            }
          }}
          className="py-6 px-4 md:px-6 xl:px-7.5"
        >
          <h4 className="text-xl font-semibold text-black dark:text-white">
            Upload new material
          </h4>
          <div className="grid grid-cols-2 gap-y-3 gap-x-3 mt-4">
            <div>
              <label className="mb-2.5 block font-medium text-black dark:text-white">
                Title
              </label>
              <input
                name="fileName"
                required
                className="form-style disabled:opacity-75"
                placeholder="Enter material title"
                type="text"
              />
            </div>
            <div>
              <label className="mb-2.5 block font-medium text-black dark:text-white">
                Category
              </label>
              <select
                name="category"
                required
                className="form-style disabled:opacity-75"
                placeholder="Enter material title"
                type="text"
              >
                {[
                  "Finance and Fundraising",
                  "Marketing & Sales",
                  "Technology & Innovation",
                  "Leadership & Personal Development",
                  "Impact & Sustainability",
                  "Legal & Compliance",
                ].map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2.5 block font-medium text-black dark:text-white">
                Material Thumbnail
              </label>
              <input
                name="thumbnail"
                required
                className="form-style disabled:opacity-75"
                placeholder="Enter material title"
                type="file"
              />
            </div>
            {type != "video" ? (
              <div>
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                  Upload material document (pdf,docx/doc)
                </label>
                <input
                  name="file"
                  onChange={(e) => {}}
                  required
                  className="form-style disabled:opacity-75"
                  placeholder="Enter email address"
                  type="file"
                />
              </div>
            ) : (
              <div>
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                  Video URL
                </label>
                <input
                  name="url"
                  placeholder="Enter video URL"
                  required
                  className="form-style"
                />
              </div>
            )}
          </div>
          <div className="mt-3">
            <label className="mb-2.5 block font-medium text-black dark:text-white">
              Material description
            </label>
            <textarea
              name="description"
              required
              className="form-style"
              placeholder="Write material description"
              type="file"
            />
          </div>

          <div className="flex">
            <button
              type="submit"
              className="py-3 px-4 w-40 flex justify-center bg-primary cursor-pointer text-white rounded hover:opacity-95"
            >
              <div>{loading ? <Spinner /> : "Upload Material"}</div>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Page;
