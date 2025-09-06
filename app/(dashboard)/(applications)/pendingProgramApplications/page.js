"use client"
import { useContext, useEffect, useState } from "react";
import {getWaitingProgramApplications} from "@/app/controllers/program_application_controller"
import {timeAgo} from "@/app/utils/time_ago"
import Link from "next/link"
import Loader from "@/components/common/Loader";
import Breadcrumb from "@/app/component/Breadcrumb"
import { useTranslation } from "@/app/locales";
const Page = () => {
  const { t } = useTranslation();
  const [applications, setApplications] = useState([]);
  const [ShowOptions, setShowOptions] = useState(false);
  const [loading, setloading] = useState(true);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  useEffect(() => {
        getWaitingProgramApplications(1,5).then((body)=>{
          setloading(false)
            setApplications(body.data)
        })
  }, []);
    return applications && (
    <div>
               <Breadcrumb prevLink={``} prevPage={t("programs.programs", "Programs")} pageName={t("programs.pendingApplications", "Pending applications")} />
        <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="py-6 px-4 md:px-6 xl:px-7.5">
        <h4 className="text-xl font-semibold text-black dark:text-white">
          {t("programs.applicationsList", "Applications list")}
        </h4>
      </div>
      <div className="grid grid-cols-6 border-t border-stroke py-4.5 px-4 dark:border-strokedark sm:grid-cols-8 md:px-6 2xl:px-7.5">
        <div className="col-span-1 flex items-center">
          <p className="font-medium">{t("programs.sent", "Sent")} </p>
        </div>
        <div className="col-span-2 hidden items-center sm:flex">
          <p className="font-medium">{t("programs.program", "Program")}</p>
        </div>
        <div className="col-span-2 flex items-center">
          <p className="font-medium">{t("programs.name", "Name")}</p>
        </div>
        <div className="col-span-2 flex items-center">
          <p className="font-medium">{t("programs.phone", "Phone")}</p>
        </div>
        <div className="col-span-1 flex items-center">
          <p className="font-medium">{t("common.more", "More")}</p>
        </div>
      </div>
      {applications.map((item, key) => (
        <div
          className="grid grid-cols-6 border-t border-stroke py-4.5 px-4 dark:border-strokedark sm:grid-cols-8 md:px-6 2xl:px-7.5"
          key={key}
        >
          <div className="col-span-1 hidden items-center sm:flex">
            <p className="text-sm text-black dark:text-white">
            {timeAgo(item.createdAt)}
            </p>
          </div>
          <div className="col-span-2 flex items-center">
            <p className="text-sm text-black dark:text-white">
              {item.Program.title}
            </p>
          </div>
          <div className="col-span-2 flex items-center">
            <p className="text-sm text-black dark:text-white">{item.User.name}</p>
          </div>
          <div className="col-span-2 flex items-center">
            <p className="text-sm text-black dark:text-white">{item.User.phone}</p>
          </div>
          <div className="col-span-1 flex items-center">
          <div onClick={()=>{
                  if(item.uuid == ShowOptions){
                    setShowOptions("")
                    setSelectedBusiness(item)
                  }else{
                  setShowOptions(item.uuid)
                  setSelectedBusiness(null)
                  }
                }} className="bg-primary hover:bg-opacity-90 rounded text-white py-2 px-3 cursor-pointer  text-sm relative">
                   {t("common.options", "Options")}
                   <div className={`absolute z-9 transition-all 
                   ${ShowOptions == item.uuid?" scale-100 ":" scale-0 "} 
                   -translate-x-4 bg-white shadow-lg   left-0 w-40 space-y-2 rounded-lg py-2 px-4 top-10`}>
                    {[
                      {title:t("programs.viewApplication", "View application"),path:`/viewProgramApplication/${item.uuid}`},
                      {title:t("programs.assignReviewers", "Assign reviewers"),path:`/assignProgramApplicationReviewers/${item.uuid}`},
                    ].map((sub)=>{
                      return <div key={sub.title}> 
                      <Link  className="text-black text-base hover:text-primary text-center " 
                      href={sub.path}>{sub.title}</Link>
                      </div>
                    })}
                   </div>
                </div>
          </div>
        </div>
      ))}
    </div>
    </div>
    );
}
 
export default Page;