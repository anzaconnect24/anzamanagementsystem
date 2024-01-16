"use client"
import { useContext, useEffect, useState } from "react";
import {getBFAPrograms, getIRAPrograms} from "@/app/controllers/program_controller"
import {timeAgo} from "@/app/utils/time_ago"
import Link from "next/link"
import { UserContext } from "../../layout";


const Page = () => {
  const [programs, setPrograms] = useState([]);
  const [ShowOptions, setShowOptions] = useState(false);
  const {userDetails} = useContext(UserContext)
  useEffect(() => {
    getBFAPrograms(1,5).then((body)=>{
      setPrograms(body.data)
    })
}, []);
    return (
      <div className="">    
      <div>
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="py-6 px-4 md:px-6 xl:px-7.5 flex justify-between">
        <h4 className="text-xl font-semibold text-black dark:text-white">
        Business foundation accelerator programs
        </h4>
        {
           ["Admin"].includes(userDetails.role)&&
          <Link href="/newProgram" className="text-white bg-primary py-2 px-3 cursor-pointer rounded">Add</Link>
        }
      </div>
      <div className="grid grid-cols-6 border-t border-stroke py-4.5 px-4 dark:border-strokedark sm:grid-cols-8 md:px-6 2xl:px-7.5">
        <div className="col-span-2 flex items-center">
          <p className="font-medium">Created </p>
        </div>
        <div className="col-span-2 hidden items-center sm:flex">
          <p className="font-medium">Program title</p>
        </div>
        <div className="col-span-2 hidden items-center sm:flex">
          <p className="font-medium">Status</p>
        </div>
       
        <div className="col-span-1 flex items-center">
          <p className="font-medium">More</p>
        </div>
      </div>

      {programs.map((item, key) => (
        <div
          className="grid grid-cols-6 border-t border-stroke py-4.5 px-4 dark:border-strokedark sm:grid-cols-8 md:px-6 2xl:px-7.5"
          key={key}
        >
          <div className="col-span-2 hidden items-center sm:flex">
            <p className="text-sm text-black dark:text-white">
            {timeAgo(item.createdAt)}
            </p>
          </div>
          <div className="col-span-2 flex items-center">
            <p className="text-sm text-black dark:text-white">
            {item.title}
            </p>
          </div>
          <div className="col-span-2 flex items-center">
            <p className={`text-sm text-black py-2 px-3 rounded-full ${item.applied?"bg-success text-white":"bg-bodydark1"} dark:text-white`}>
              {item.applied?"Applied":"Not applied"}
            </p>
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
                   Options
                   <div className={`absolute z-1 transition-all ${ShowOptions == item.uuid?" scale-100 ":" scale-0 "} -translate-x-4 bg-white shadow-lg   left-0 w-50 space-y-2 rounded-lg py-2 px-4 top-10`}>
                    {[
                      {title:"Program details",path:`/programDetails/${item.uuid}`,visible:true, role:["Admin","Enterprenuer"]},
                    
                      {title:"My application",path:`/userProgramApplication/${item.uuid}`,visible:item.applied, role:["Admin","Enterprenuer"]},
                      {title:"Program updates",path:`/programUpdates/${item.uuid}`,visible:item.applied, role:["Admin","Enterprenuer"]},

                      {title:"Pending applications",path:`/pendingProgramApplications/`,visible:true, role:["Admin"]},
                      {title:"Accepted applications",path:`/acceptedProgramApplications/`,visible:true, role:["Admin"]},
                      {title:"Rejected applications",path:`/rejectedProgramApplications/`,visible:true, role:["Admin"]},
                      {title:"Edit details",path:`/pendingprograms/${item.uuid}`,visible:true, role:["Admin"]},
                    ].map((item)=>{
                      return item.role.includes(userDetails.role)&& item.visible &&<div key={item.title}> 
                      
                      <Link  className="text-black text-base hover:text-primary text-center " href={item.path}>{item.title}</Link>
                      
                      </div>
                    })}
                   </div>
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