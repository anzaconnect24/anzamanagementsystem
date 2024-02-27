"use client"
import { useContext, useEffect, useState } from "react";
import {getApprovedBusinesses, getPendingBusinesses} from "@/app/controllers/business_controller"
import {timeAgo} from "@/app/utils/time_ago"
import Link from "next/link"
import { deletePitchMaterial, getDocuments } from "@/app/controllers/pitch_material_controller";
import { UserContext } from "../../layout";
import NoData from "@/app/component/noData";

const Page = () => {
  const [documents, setDocuments] = useState([]);
  const [ShowOptions, setShowOptions] = useState(false);
  const {userDetails}  = useContext(UserContext)
  const [refresh, setRefresh] = useState(0);

  const [loading, setloading] = useState(true);
  useEffect(() => {
        getDocuments(1,5).then((body)=>setDocuments(body.data))
  }, [refresh]);
    return (
    <div>
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="py-6 px-4 md:px-6 xl:px-7.5 ">
        <div className="flex justify-between">
<h4 className="text-xl font-semibold text-black dark:text-white">
          Documents
        </h4>
        {
        ["Admin"].includes(userDetails.role)&&
        <Link className="px-4 py-2 rounded bg-primary text-white hover:opacity-95" href={"/uploadPitchMaterial"}>Add</Link>

        }
      
        </div>
        {documents.length<1?<NoData/>: <div className="grid grid-cols-4 gap-3 ">
           {documents.map((item,key)=>{
        return <a href={item.link} target="_blank" key={key} className="py-8 px-5 border border-stroke cursor-pointer  flex flex-col justify-center items-center rounded hover:shadow-lg">
            <div>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
</svg>

            </div>
            <div>{item.fileName}</div>
            {["Admin"].includes(userDetails.role)&&
            <div className="flex space-x-2 justify-between mt-3">
            <Link href={`/viewer/${item.uuid}`} className="text-base font-bold text-success">Visibility</Link>
            <h1 onClick={()=>{
              deletePitchMaterial(item.uuid).then((data)=>{
                setRefresh(refresh+1)
              })
            }} className="text-base  cursor-pointer font-bold text-danger">Delete</h1>

          </div>
            }
            
        </a>
       })}
</div>}
       
      </div>
     


     
    </div>
       
       
    </div>
    );
}
 
export default Page;