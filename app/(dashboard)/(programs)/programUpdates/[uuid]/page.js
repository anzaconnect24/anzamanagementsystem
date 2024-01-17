"use client"
import { useContext, useEffect, useState } from "react";
import {getProgramUpdates} from "@/app/controllers/program_update_controller"
import {timeAgo} from "@/app/utils/time_ago"
import Link from "next/link"
import Loader from "@/components/common/Loader";
import { UserContext } from "../../../layout";
import Breadcrumb from "@/app/component/Breadcrumb";


const Page = ({params}) => {
    const uuid = params.uuid;
  const [updates, setUpdates] = useState([]);
  const [ShowOptions, setShowOptions] = useState(false);
  const {userDetails} = useContext(UserContext)
  const [loading, setloading] = useState(true);
  useEffect(() => {
    getProgramUpdates(uuid,1,5).then((body)=>{
          setloading(false)
      setUpdates(body.data)
    })
}, []);
    return (
      <div className="">
       
      <Breadcrumb pageName={"Program updates"} prevLink={""} prevPage={"Programs"}/>   
 <div>
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="py-6 px-4 md:px-6 xl:px-7.5 flex justify-between">
        <h4 className="text-xl font-semibold text-primary dark:text-white">
        Program updates list
        </h4>
        {
           ["Admin"].includes(userDetails.role)&&
          <Link href={`/newProgramUpdate/${uuid}`} className="text-white bg-primary py-2 px-3 cursor-pointer rounded">Add</Link>
        }
      </div>
     

      {updates.map((item, key) => (
        <div
          className=" w-9/12 py-4.5 px-4 dark:border-strokedark sm:grid-cols-8 md:px-6 2xl:px-7.5"
          key={key}
        >
          <div className="font-bold text-lg text-black">{item.title}</div>
          <div>{timeAgo(item.createdAt)}</div>
          <div className="text-black pt-3">{item.description}</div>
          
          
          
        </div>
      ))}
    </div>
       
       
    </div>
      </div>
   
    );
}
 
export default Page;