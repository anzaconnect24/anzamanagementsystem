"use client"
import { useContext, useEffect, useState } from "react";
import {getApprovedBusinesses, getPendingBusinesses} from "@/app/controllers/business_controller"
import {timeAgo} from "@/app/utils/time_ago"
import Link from "next/link"
import { getDocuments } from "@/app/controllers/pitch_material_controller";

const Page = () => {
  const [documents, setDocuments] = useState([]);
  const [ShowOptions, setShowOptions] = useState(false);
  useEffect(() => {
        getDocuments(1,5).then((body)=>setDocuments(body.data))
  }, []);
    return (
    <div>
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="py-6 px-4 md:px-6 xl:px-7.5 ">
        <div className="flex justify-between">
<h4 className="text-xl font-semibold text-black dark:text-white">
          Documents
        </h4>
        <Link className="px-4 py-2 rounded bg-primary text-white hover:opacity-95" href={"/uploadPitchMaterial"}>Add</Link>
      
        </div>
        <div className="grid grid-cols-3 gap-3 ">
           {documents.map((item,key)=>{
        return <div key={key} className="py-5 px-5 border border-stroke cursor-pointer  rounded hover:shadow-lg">
            <div>{item.fileName}</div>
        </div>
       })}
</div>
      </div>
     


     
    </div>
       
       
    </div>
    );
}
 
export default Page;