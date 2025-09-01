"use client";
import { useContext, useEffect, useState } from "react";
import { timeAgo } from "@/app/utils/time_ago";
import Link from "next/link";
import Loader from "@/components/common/Loader";
import { deleteSector, getSectors } from "@/app/controllers/sector_controller";
import toast from "react-hot-toast";
import { useTranslation } from "../../../locales";

const Page = () => {
  const { t } = useTranslation();
  const [applications, setApplications] = useState([]);
  const [ShowOptions, setShowOptions] = useState(false);
  const [sectors, setSectors] = useState([]);
  const [refresh, setrefresh] = useState(0);
  const [loading, setloading] = useState(true);
  useEffect(() => {
    getSectors().then((data) => {
      setSectors(data);
      setloading(false);
    });
  }, [refresh]);
  return loading ? (
    <Loader />
  ) : (
    <div>
      <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="py-6 px-4 md:px-6 xl:px-7.5 flex justify-between">
          <h4 className="text-xl font-semibold text-black dark:text-white">
            {t("sectors.businessSectors", "Business sectors")}
          </h4>
          <Link
            href="/addSector"
            className="py-2 px-4 bg-primary text-white cursor-pointer rounded "
          >
            {t("common.add", "Add")}
          </Link>
        </div>

        <div className="grid grid-cols-6 border-t border-stroke py-4.5 px-4 dark:border-strokedark sm:grid-cols-8 md:px-6 2xl:px-7.5">
          <div className="col-span-2 flex items-center">
            <p className="font-medium">
              {t("common.createdAt", "Created at")}{" "}
            </p>
          </div>
          <div className="col-span-5 hidden items-center sm:flex">
            <p className="font-medium">
              {t("sectors.sectorName", "Sector name")}
            </p>
          </div>

          <div className="col-span-1 flex items-center">
            <p className="font-medium"></p>
          </div>
        </div>

        {sectors.map((item, key) => (
          <div
            className="grid grid-cols-6 border-t border-stroke py-4.5 px-4 dark:border-strokedark sm:grid-cols-8 md:px-6 2xl:px-7.5"
            key={key}
          >
            <div className="col-span-2 hidden items-center sm:flex">
              <p className="text-sm text-black dark:text-white">
                {timeAgo(item.createdAt)}
              </p>
            </div>
            <div className="col-span-4 flex items-center">
              <p className="text-sm text-black dark:text-white">{item.name}</p>
            </div>

            <div className="col-span-2 space-x-2 flex items-center">
              <Link
                href={`/editSector/${item.uuid}`}
                className="bg-secondary hover:bg-opacity-90 rounded text-white py-2 px-3 cursor-pointer  text-sm relative"
              >
                {t("common.edit", "Edit")}
              </Link>
              <Link
                href={`/sectorBusinesses/${item.uuid}`}
                className=" bg-primary hover:bg-opacity-90 rounded text-white py-2 px-3 cursor-pointer  text-sm relative"
              >
                {t("sectors.viewBusinesses", "View businesses")}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Page;
