"use client";
import { getSpecificReport } from "@/app/controllers/mentorReportsController";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Loader from "@/components/common/Loader";
import { useEffect, useState } from "react";

const Page = ({ params }) => {
  const uuid = params.uuid;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    getSpecificReport(uuid).then((res) => {
      console.log(res);
      setLoading(false);
      setData(res);
    });
  }, []);
  return loading ? (
    <Loader />
  ) : (
    <div className="">
      <Breadcrumb
        prevLink={"/mentorReports"}
        pageName={"Reports"}
        prevPage={"Mentors reports"}
      />
      <div className="bg-white p-5 w-full">
        <h1 className="font-bold text-2xl">Entreprenuer report</h1>
        <p className="text-muted ">View entreprenuer report</p>

        <div className="space-y-2 mt-4">
          <div className="flex space-x-2 ">
            <h1 className="text-muted w-3/12">Mentor name:</h1>
            <p className="text-muted font-bold ">{data.Mentor.name}</p>
          </div>
          <div className="flex space-x-2 ">
            <h1 className="text-muted w-3/12">Entreprenuer name:</h1>
            <p className="text-muted font-bold ">{data.Entreprenuer.name}</p>
          </div>
          <div className="flex space-x-2 ">
            <h1 className="text-muted w-3/12">Report title:</h1>
            <p className="text-muted font-bold ">{data.title}</p>
          </div>
          <div className="flex space-x-2 ">
            <h1 className="text-muted w-3/12">Report description:</h1>
            <p className="text-muted font-bold ">{data.description}</p>
          </div>
        </div>
        <button
          onClick={() => {
            window.open(data.url, "_blank");
          }}
          className="py-2 px-4 mt-8 bg-primary w-38 flex justify-center text-white hover:bg-opacity-90 transition-all duration-300 rounded"
        >
          Open Report
        </button>
      </div>
    </div>
  );
};

export default Page;
