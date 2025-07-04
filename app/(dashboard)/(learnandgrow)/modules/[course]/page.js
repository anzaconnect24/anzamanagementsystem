"use client";
import { useContext, useEffect, useState } from "react";
import {
  deleteModule,
  editModule,
  getModules,
} from "../../../../controllers/modules_controller";
import Link from "next/link";
import { UserContext } from "../../../layout";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { BsPencil, BsPlus, BsTrash } from "react-icons/bs";
import Image from "next/image";
import Loader from "@/components/common/Loader";
import { editComment } from "@/app/controllers/comment_controllers";
import { useRouter } from "next/navigation";

const Page = ({ params }) => {
  const { course } = params;
  const [modules, setModules] = useState([]);
  const { userDetails } = useContext(UserContext);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  useEffect(() => {
    loadData();
  }, []);
  const loadData = () => {
    getModules({ course: decodeURIComponent(course) }).then((res) => {
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
          let length = item.Slides.length;
          let progress = item.Slides.reduce(
            (prev, curr) => prev + (curr.SlideReaders.length > 0 ? 1 : 0),
            0
          );
          let percentage = length > 0 ? (progress / length) * 100 : 0;
          return (
            <div
              key={item.uuid}
              className="border border-black/10 bg-white rounded-lg p-5 flex flex-col items-start space-y-4"
            >
              <Image
                className="h-48 w-full object-cover"
                alt="adf"
                width={1000}
                height={1000}
                src={item.image}
              />
              <div>
                {percentage > 0 && (
                  <div>
                    <p className="text-sm mb-1">
                      {progress}/{length} slides completed
                    </p>
                    <div className="w-full bg-black/10 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                <h1 className="font-bold text-lg line-clamp-1 mt-2">
                  {item.title}
                </h1>
                <p className="mb-3 line-clamp-3">{item.description}</p>
                <div className="flex space-x-2 mt-2 items-center">
                  {percentage > 0 ? (
                    <Link
                      href={`/slides/${item.uuid}`}
                      className="bg-primary px-4 py-2 rounded-lg text-white "
                    >
                      Resume
                    </Link>
                  ) : (
                    <Link
                      href={`/slides/${item.uuid}`}
                      className="bg-primary px-4 py-2 rounded-lg text-white "
                    >
                      Start Learning
                    </Link>
                  )}
                  {["Admin"].includes(userDetails.role) && (
                    <button
                      className="bg-red-100 text-red-500 py-2 px-4 rounded-lg"
                      onClick={() => {
                        deleteModule(item.uuid).then((res) => {
                          loadData();
                        });
                      }}
                    >
                      Delete
                    </button>
                  )}
                  {["Admin"].includes(userDetails.role) && (
                    <BsPencil
                      className="hover:text-blue-400"
                      onClick={() => {
                        router.push(`/modules/edit/?uuid=${item.uuid}`);
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
