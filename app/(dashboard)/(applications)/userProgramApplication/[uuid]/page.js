"use client"
import { getUserProgramApplication } from "@/app/controllers/program_application_controller";
import { useEffect, useState } from "react";
import Link from "next/link"
import { useRouter } from "next/navigation";
import Breadcrumb from "../../../../component/Breadcrumb";
import { timeAgo } from "@/app/utils/time_ago";

const Page = ({params}) => {
    const uuid = params.uuid
    const router = useRouter()
    const [application, setApplication] = useState(null);
    const [loading, setloading] = useState(true);
  useEffect(() => {
        getUserProgramApplication(uuid).then((data)=>setApplication(data))
    }, [uuid]);

    return ( application&&<div>
               <Breadcrumb prevLink={``} prevPage="Applications" pageName="Application details" />
         <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="py-6 px-4 md:px-6 xl:px-7.5">
        <div className="space-y-3">
          {[
          {title:"Application for",value:application.Program.title},
          {title:"Submission date",value:timeAgo(application.createdAt)},
          {title:"Submitted by",value:application.User.name},
          {title:"Phone",value:application.User.phone},
          {title:"Email",value:application.User.email}
          ].map((item,key)=>{
          return <div className="flex" key={key}>
          <div className="w-4/12">
              {item.title}:
          </div>
          <div className="w-8/12 text-black">
              {item.value}
          </div>

          </div>
          })}

<div className="flex" >
          <div className="w-4/12">
              Documents:
          </div>
          <div className="w-8/12 text-black">
              <div className="grid grid-cols-3 gap-3">
                {application.ProgramApplicationDocuments.map((item,key)=>{
                  return <a key={key} href={item.fileLink} target="_blank" className="w-full py-4 cursor-pointer text-center flex flex-col items-center justify-center  px-4 border border-stroke rounded hover:shadow">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6 text-primary">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
                    {item.fileName}
                  </a>
                })}
              </div>
          </div>

          </div>
          <div className="flex" >
          <div className="w-4/12">
              Status:
          </div>
          <div className="w-8/12 text-black">
            <div className="flex">
            <div className={`
             ${application.status == "waiting"&&"bg-bodydark1"} 
             ${application.status == "accepted"&&" bg-success text-white "}
             ${application.status == "rejected"&&" bg-danger text-white "}
              py-2 px-3 rounded-full  `}>{application.status}
            </div>
            </div>
          </div>

          </div>
        </div>
      

      </div>
      
      </div>
    </div> );
}

export default Page;