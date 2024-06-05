"use client"
import { getProgramApplicationReviewers } from "@/app/controllers/program_application_controller";
import { assignProgramApplicationReviewer, deleteProgramApplicationReviewer } from "@/app/controllers/program_application_review_controller"
import { useEffect, useState } from "react";
import { timeAgo } from "@/app/utils/time_ago";
import Link from "next/link"
import Loader from "@/components/common/Loader";
import { useRouter } from "next/navigation";
import Breadcrumb from "../../../../component/Breadcrumb";

const Page = ({params}) => {
    const uuid = params.uuid
    const router = useRouter()
    const [users, setUsers] = useState([]);
  const [ShowOptions, setShowOptions] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [loading, setloading] = useState(true);
  useEffect(() => {
        getProgramApplicationReviewers(uuid,1,5).then((body)=>{
          setloading(false)
            setUsers(body.data)
        })
  }, [refresh]);
    return loading?<Loader/>:(
        <div className="">
      <div>
        <Breadcrumb prevLink={""} pageName={"Assign application to reviewers"} prevPage={"Applications"}/>
        <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="py-6 px-4 md:px-6 xl:px-7.5">
          <h4 className="text-xl font-semibold text-black dark:text-white">
            Assign reviewers 
          </h4>
        </div>
  
        <div className="grid grid-cols-6 border-t border-stroke py-4.5 px-4 dark:border-strokedark sm:grid-cols-8 md:px-6 2xl:px-7.5">
          <div className="col-span-1 flex items-center">
            <p className="font-medium">Sent </p>
          </div>
          <div className="col-span-1 hidden items-center sm:flex">
            <p className="font-medium">Username</p>
          </div>
         
          <div className="col-span-2 flex items-center">
            <p className="font-medium">Phone</p>
          </div>
          <div className="col-span-2 flex items-center">
            <p className="font-medium">Email</p>
          </div>
          <div className="col-span-1 flex items-center">
            <p className="font-medium">Assign</p>
          </div>
        </div>
  
        {users.map((item, key) => (
          <div
            className="grid grid-cols-6 border-t border-stroke py-4.5 px-4 dark:border-strokedark sm:grid-cols-8 md:px-6 2xl:px-7.5"
            key={key}
          >
            
            <div className="col-span-1 hidden items-center sm:flex">
              <p className="text-sm text-black dark:text-white">
              {timeAgo(item.createdAt)}
              </p>
            </div>
            <div className="col-span-1 flex items-center">
              <p className="text-sm text-black dark:text-white">
                {item.name}
              </p>
            </div>
           
            <div className="col-span-2 flex items-center">
              <p className="text-sm text-black dark:text-white">{item.phone}</p>
            </div>
            <div className="col-span-2 flex items-center">
              <p className="text-sm text-black dark:text-white">{item.email}</p>
            </div>
            <div className="col-span-1 flex items-center">
            <div className="rounded text-white py-2 px-3 cursor-pointer  text-sm relative">
                    <div onClick={()=>{
                      const data = {
                        program_application_uuid:uuid ,
                        user_uuid:item.uuid
                      }
                        if(item.status <1){
                          assignProgramApplicationReviewer(data).then((data)=>{
                               setRefresh(refresh+1)
                           })
                       }else{
                           deleteProgramApplicationReviewer(item.ProgramApplicationReview.uuid).then((data)=>{
                               setRefresh(refresh+1)
                           })
                       }
                    }} className={`py-2 px-3 ${item.status <1?"bg-primary text-white":"bg-bodydark1 text-black"} cursor-pointer
                     hover:opacity-95 transition-all  rounded`}>
                      {item.status<1?"Assign":"Remove"}</div>
                  </div>
            </div>
          </div>
        ))}
      </div>
         
         
      </div>
        </div>
     
       );
}

export default Page;