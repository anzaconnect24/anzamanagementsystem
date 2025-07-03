"use client";
import { useContext, useEffect, useState } from "react";
import { getModules } from "../../../../controllers/modules_controller";
import Link from "next/link";
import { UserContext } from "../../../layout";
import { deleteSlide, getSlides } from "@/app/controllers/slides_controller";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { BsTrash } from "react-icons/bs";
import { TbFlagCancel } from "react-icons/tb";
import Loader from "@/components/common/Loader";

const Page = ({ params }) => {
  const { uuid } = params;
  const [modules, setModules] = useState([]);
  const { userDetails } = useContext(UserContext);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [module, setModule] = useState(null);
  useEffect(() => {
    loadData();
  }, []);
  let loadData = () => {
    getSlides({ module_uuid: uuid }).then((res) => {
      console.log(res);
      setModules(res.data);
      setModule(res.module);
      setLoading(false);
    });
  };
  return loading ? (
    <Loader />
  ) : (
    <div>
      <Breadcrumb prevLink={""} pageName={module.title} prevPage={"Back"} />

      <div className="bg-primary/10 p-6 rounded-lg mb-4 mt-4">
        <p>{module.description}</p>
      </div>

      <div className="bg-white flex mt-2 rounded-lg border h-[70vh] w-full border-gray/10">
        <div className=" w-3/12 border-r-2 border-black/10 p-5 h-[70vh] overflow-y-auto ">
          <div className="space-y-4">
            {modules.map((item, index) => {
              return (
                <div
                  className={`${
                    index == currentSlide ? "text-primary" : "text-graydark"
                  } flex space-x-3 items-center justify-between w-full `}
                  key={item.uuid}
                >
                  <p>
                    {index + 1}. {item.title}
                  </p>
                  <div>
                    {["Admin"].includes(userDetails.role) && (
                      <BsTrash
                        className="hover:text-red-400 cursor-pointer text-sm"
                        onClick={() => {
                          deleteSlide(item.uuid).then((res) => {
                            loadData();
                          });
                        }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8">
            {["Admin"].includes(userDetails.role) && (
              <Link
                href={`/slides/add/?uuid=${uuid}`}
                className="text-white bg-primary py-2 px-3 cursor-pointer rounded "
              >
                Add Slide
              </Link>
            )}
          </div>
        </div>
        <div className=" w-9/12  ml-auto py-5 h-full justify-between flex flex-col text-lg ">
          <div className="px-6">
            <h1 className="font-bold text-xl mb-2">
              {modules[currentSlide]?.title}
            </h1>
            {modules[currentSlide]?.content}
          </div>

          <div className="flex justify-end space-x-5 mt-auto p-5">
            <button
              onClick={() =>
                setCurrentSlide((prev) => (prev > 0 ? prev - 1 : prev))
              }
              disabled={currentSlide === 0}
              className={`py-2 px-3 rounded ${
                currentSlide === 0
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-primary/10 text-black cursor-pointer"
              }`}
            >
              Previous
            </button>
            <button
              onClick={() =>
                setCurrentSlide((prev) =>
                  prev < modules.length - 1 ? prev + 1 : prev
                )
              }
              disabled={currentSlide === modules.length - 1}
              className={`py-2 px-3 rounded ${
                currentSlide === modules.length - 1
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-primary text-white cursor-pointer"
              }`}
            >
              Next
            </button>
          </div>
        </div>
        <div className=" col-span-4"></div>
      </div>
    </div>
  );
};

export default Page;
