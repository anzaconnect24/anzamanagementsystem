"use client";
import { useContext, useEffect, useState } from "react";
import {
  getApprovedBusinesses,
  getPendingBusinesses,
} from "@/app/controllers/business_controller";
import { timeAgo } from "@/app/utils/time_ago";
import Link from "next/link";
import {
  getDocuments,
  deletePitchMaterial,
} from "@/app/controllers/pitch_material_controller";
import { UserContext } from "../../layout";
import NoData from "@/app/component/noData";
import Image from "next/image";
import toast from "react-hot-toast";
import Loader from "@/components/common/Loader";

const Page = () => {
  const [documents, setDocuments] = useState([]);
  const [ShowOptions, setShowOptions] = useState(false);
  const { userDetails } = useContext(UserContext);
  const [refresh, setRefresh] = useState(0);

  const [loading, setloading] = useState(true);
  useEffect(() => {
    setloading();
    getDocuments(1, 100).then((body) => {
      setDocuments(body.data);
      setloading(false);
    });
  }, [refresh]);
  return loading ? (
    <Loader />
  ) : (
    <div>
      <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="py-6 px-4 md:px-6 xl:px-7.5 ">
          <div className="flex justify-between">
            <h4 className="text-xl font-semibold text-black dark:text-white">
              Documents
            </h4>
            {["Admin", "Reviewer"].includes(userDetails.role) && (
              <Link
                className="px-4 py-2 rounded bg-primary text-white hover:opacity-95"
                href={"/uploadPitchMaterial/document"}
              >
                Add
              </Link>
            )}
          </div>
          {documents.length < 1 ? (
            <NoData />
          ) : (
            <div className="grid grid-cols-1 2xl:grid-cols-4 gap-3  mt-4">
              {documents.map((item, key) => {
                return (
                  <a
                    key={key}
                    className="py-8  px-5 border border-stroke cursor-pointer  flex flex-col justify-center items-center rounded hover:shadow-lg"
                  >
                    <a href={item.link} target="_blank">
                      <Image
                        height={1000}
                        width={1000}
                        alt=""
                        className="w-16"
                        src="/pdf.png"
                      />
                    </a>
                    <div className="mt-1">{item.fileName}</div>
                    {["Admin"].includes(userDetails.role) && (
                      <div className="flex space-x-2 justify-between mt-3">
                        {/* <Link
                          href={`/viewer/${item.uuid}`}
                          className="text-sm font-bold "
                        >
                          Viewers
                        </Link> */}
                        <h1
                          onClick={() => {
                            deletePitchMaterial(item.uuid).then((data) => {
                              setRefresh(refresh + 1);
                              toast.success("Deleted successfully");
                            });
                          }}
                          className="text-sm  cursor-pointer font-bold text-danger"
                        >
                          Delete
                        </h1>
                      </div>
                    )}
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Page;
