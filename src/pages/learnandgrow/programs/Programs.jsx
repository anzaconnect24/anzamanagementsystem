"use client";
import { useContext, useEffect, useState } from "react";
import { deleteProgram, getPrograms } from "@/controllers/program_controller";
import Link from "@/utils/link";
import { UserContext } from "../../../layouts/DashboardLayout";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { BsPlus } from "react-icons/bs";
import Image from "@/utils/image";
import Loader from "@/components/common/Loader";
import { useRouter } from "@/utils/navigation";
import { useTranslation } from "@/locales";
import Pagination from "../../../component/pagination";
import { useParams } from "react-router-dom";

const ProgramsPage = () => {
  const { course } = useParams();
  const [programs, setPrograms] = useState([]);
  const { userDetails } = useContext(UserContext);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [limit, setLimit] = useState(20);
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const { t } = useTranslation();

  useEffect(() => {
    loadData();
  }, [page]);

  const loadData = () => {
    getPrograms(page, limit, decodeURIComponent(course)).then((res) => {
      console.log(res);
      setPrograms(res.data || []);
      setCount(res.count || 0);
      setLoading(false);
    });
  };

  return loading ? (
    <Loader />
  ) : (
    <div>
      <Breadcrumb
        prevLink={"/dashboard/classRooms"}
        pageName={`${decodeURIComponent(course)} ${t(
          "learnAndGrow.programs",
          "Programs"
        )}`}
        prevPage={t("common.back", "Back")}
      />

      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">
          {t("learnAndGrow.programs", "Programs")}
        </h1>
        {["Admin"].includes(userDetails.role) && (
          <Link
            href={`/dashboard/programs/add/?course=${course}`}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 flex items-center gap-2"
          >
            <BsPlus className="text-xl" />
            {t("learnAndGrow.addProgram", "Add Program")}
          </Link>
        )}
      </div>

      <div className="grid grid-cols-3 gap-6 pt-4">
        {programs.map((item) => {
          return (
            <div
              key={item.uuid}
              className="border border-black/10 bg-white rounded-lg p-5 flex flex-col items-start justify-between space-y-4"
            >
              <div className="space-y-4 w-full">
                <Image
                  className="h-48 w-full object-cover rounded-lg"
                  alt={item.title}
                  width={1000}
                  height={1000}
                  src={item.image}
                />
                <div>
                  <h1 className="font-bold text-lg line-clamp-1 mt-2">
                    {item.title}
                  </h1>
                  <p className="mb-3 line-clamp-3">{item.description}</p>
                </div>
              </div>
              <div className="flex flex-col space-y-2 mt-auto w-full">
                <div className="flex space-x-2 items-center">
                  <Link
                    href={`/dashboard/modules/${item.uuid}`}
                    className="bg-primary px-4 py-2 whitespace-nowrap rounded-lg text-white flex-1 text-center"
                  >
                    {t("learnAndGrow.viewModules", "View Modules")}
                  </Link>
                  {["Admin"].includes(userDetails.role) && (
                    <button
                      className="bg-green-100 text-green-500 py-2 px-4 rounded-lg"
                      onClick={() => {
                        router.push(
                          `/dashboard/programs/edit/?uuid=${item.uuid}&course=${course}`
                        );
                      }}
                    >
                      {t("common.edit", "Edit")}
                    </button>
                  )}
                  {["Admin"].includes(userDetails.role) && (
                    <button
                      className="bg-red-100 text-red-500 py-2 px-4 rounded-lg"
                      onClick={() => {
                        if (
                          window.confirm(
                            t(
                              "common.confirmDelete",
                              "Are you sure you want to delete this program?"
                            )
                          )
                        ) {
                          deleteProgram(item.uuid).then((res) => {
                            loadData();
                          });
                        }
                      }}
                    >
                      {t("common.delete", "Delete")}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {["Admin"].includes(userDetails.role) && (
          <Link
            href={`/dashboard/programs/add/?course=${course}`}
            className="bg-white hover:bg-primary/5 transition-all duration-200 rounded-lg p-5 flex flex-col justify-center items-center border border-black/10"
          >
            <BsPlus className="text-4xl" />
            <p>{t("learnAndGrow.addProgram", "Add Program")}</p>
          </Link>
        )}
      </div>
      <Pagination limit={limit} count={count} setPage={setPage} page={page} />
    </div>
  );
};

export default ProgramsPage;
