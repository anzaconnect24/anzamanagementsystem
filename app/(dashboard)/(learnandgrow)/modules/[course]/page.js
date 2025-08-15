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
import { BsPencil, BsPlus, BsTrash, BsLock } from "react-icons/bs";
import Image from "next/image";
import Loader from "@/components/common/Loader";
import { editComment } from "@/app/controllers/comment_controllers";
import { useRouter } from "next/navigation";
import Pagination from "../../../../component/pagination";

const Page = ({ params }) => {
  const { course } = params;
  const [modules, setModules] = useState([]);
  const { userDetails } = useContext(UserContext);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [limit, setLimit] = useState(20);
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  useEffect(() => {
    loadData();
  }, []);
  const loadData = () => {
    getModules({ course: decodeURIComponent(course), page, limit }).then(
      (res) => {
        console.log(res);
        setModules(res.data);
        setCount(res.count);
        setLoading(false);
      }
    );
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
        {modules.map((item, idx) => {
          let length = item.Slides.length;
          let progress = item.Slides.reduce(
            (prev, curr) => prev + (curr.SlideReaders.length > 0 ? 1 : 0),
            0
          );
          let percentage = length > 0 ? (progress / length) * 100 : 0;

          // Determine if this module should be locked (only for non-Admin users)
          let isLocked = false;
          if (idx > 0 && !["Admin"].includes(userDetails.role)) {
            // Previous module must be completed
            let prev = modules[idx - 1];
            let prevLength = prev.Slides.length;
            let prevProgress = prev.Slides.reduce(
              (prev, curr) => prev + (curr.SlideReaders.length > 0 ? 1 : 0),
              0
            );
            let prevPercentage =
              prevLength > 0 ? (prevProgress / prevLength) * 100 : 0;
            isLocked = prevPercentage < 100;
          }

          return (
            <div
              key={item.uuid}
              className={`border border-black/10 bg-white rounded-lg p-5 flex flex-col items-start justify-between space-y-4 ${
                isLocked ? "opacity-60" : ""
              }`}
            >
              <div className="space-y-4">
                <Image
                  className="h-48 w-full object-cover"
                  alt="adf"
                  width={1000}
                  height={1000}
                  src={item.image}
                />
                <div className="">
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
                  <h1 className="font-bold text-lg line-clamp-1 mt-2 flex items-center gap-2">
                    {item.title}
                    {isLocked && (
                      <BsLock
                        className="text-gray-400"
                        title="Complete previous module to unlock"
                      />
                    )}
                  </h1>
                  <p className="mb-3 line-clamp-3">{item.description}</p>
                </div>
              </div>
              <div className="flex space-x-2  items-center mt-auto">
                {["Admin"].includes(userDetails.role) ? (
                  <Link
                    href={`/slides/${item.uuid}`}
                    className="bg-primary px-4 py-2 rounded-lg text-white "
                  >
                    Modules
                  </Link>
                ) : isLocked ? (
                  <button
                    className="bg-gray-200 text-gray-400 px-4 py-2 rounded-lg flex items-center cursor-not-allowed"
                    disabled
                    title="Complete previous module to unlock"
                  >
                    <BsLock className="mr-2" /> Locked
                  </button>
                ) : percentage > 0 ? (
                  <Link
                    href={`/slides/${item.uuid}`}
                    className="bg-primary px-4 py-2 rounded-lg text-white "
                  >
                    {percentage == 100 ? "Completed" : "Resume"}
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
                  <button
                    className="bg-green-100 text-green-500 py-2 px-4 rounded-lg"
                    onClick={() => {
                      router.push(`/modules/edit/?uuid=${item.uuid}`);
                    }}
                  >
                    Edit
                  </button>
                )}
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
      <Pagination limit={limit} count={count} setPage={setPage} page={page} />
    </div>
  );
};

export default Page;
