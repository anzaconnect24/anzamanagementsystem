"use client";
import { useContext, useEffect, useState } from "react";
import {
  deleteModule,
  getModules,
} from "../../../../controllers/modules_controller";
import Link from "next/link";
import { UserContext } from "../../../layout";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { BsPlus, BsTrash } from "react-icons/bs";
import Image from "next/image";
import Loader from "@/components/common/Loader";

const Page = ({ params }) => {
  const { course } = params;
  const [modules, setModules] = useState([]);
  const { userDetails } = useContext(UserContext);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);
  const loadData = () => {
    getModules({ course }).then((res) => {
      console.log(res);
      setModules(res.data);
      setLoading(false);
    });
  };
  return loading ? (
    <Loader />
  ) : (
    <div>
      <Breadcrumb
        prevLink={""}
        pageName={`${decodeURIComponent(course)} Modules`}
        prevPage={"Back"}
      />

      <div className="flex justify-between">
        <h1 className="text-2xl font-bold"></h1>
      </div>

      <div className="grid grid-cols-3 gap-6 pt-4">
        {modules.map((item) => {
          return (
            <div
              key={item.uuid}
              className="border border-black/10 bg-white rounded-lg p-5 flex flex-col items-start space-y-4"
            >
              <Image
                className="h-48 w-full"
                alt="adf"
                width={1000}
                height={1000}
                src={item.image}
              />
              <div>
                <h1 className="font-bold text-lg line-clamp-1">{item.title}</h1>
                <p className="mb-3 line-clamp-3">{item.description}</p>
                <div className="flex space-x-2 mt-2 items-center">
                  <Link
                    href={`/slides/${item.uuid}`}
                    className="bg-primary px-4 py-2 rounded-lg text-white "
                  >
                    Start Learning
                  </Link>
                  {["Admin"].includes(userDetails.role) && (
                    <BsTrash
                      className="hover:text-red-400"
                      onClick={() => {
                        deleteModule(item.uuid).then((res) => {
                          loadData();
                        });
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {["Admin"].includes(userDetails.role) && (
          <Link
            href={`/modules/add/?course=${course}`}
            className="bg-white hover:bg-primary/5 transition-all duration-200 rounded-lg p-5 flex flex-col justify-center items-center border border-black/10 "
          >
            <BsPlus className="text-4xl" />
            <p>Add Module</p>
          </Link>
        )}
      </div>
    </div>
  );
};

export default Page;
