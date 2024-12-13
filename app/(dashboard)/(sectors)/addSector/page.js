"use client";
import { createSector } from "@/app/controllers/sector_controller";
import { useEffect, useState } from "react";
import Link from "next/link";
import Loader from "@/components/common/Loader";
import { useRouter } from "next/navigation";
import Breadcrumb from "@/app/component/Breadcrumb";
import toast from "react-hot-toast";
import Spinner from "@/components/spinner";

// import {Breadcrumb} from "@/app/component/Breadcrumb"
const Page = () => {
  const [fields, setFields] = useState([]);
  const [requirement, setRequirement] = useState("");
  const router = useRouter();
  const [loading, setloading] = useState(false);

  return (
    <div>
      <Breadcrumb prevLink={``} prevPage="Sectors" pageName="New sector" />
      <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="py-6 px-4 md:px-6 xl:px-7.5 space-y-4 ">
          <h4 className="text-xl font-semibold text-black dark:text-white">
            Create new sector
          </h4>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setloading(true);
              const data = {
                name: e.target.name.value,
              };
              createSector(data).then(() => {
                router.push("/mentorReports");
              });
            }}
          >
            <div className="grid grid-cols-2 gap-x-3">
              <div>
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                  Sector name
                </label>
                <input
                  name="name"
                  className="w-full rounded border-stroke"
                  placeholder="Enter sector name"
                />
              </div>
            </div>

            <button
              type="submit"
              className="py-3 px-4 mt-4 hover:opacity-95 rounded flex justify-center
      bg-primary text-white"
            >
              <div>{loading ? <Spinner /> : "Add sector"}</div>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Page;
