"use client"
import { useContext, useEffect, useState } from "react";
import {getApprovedBusinesses, getPendingBusinesses} from "@/app/controllers/business_controller"
import {timeAgo} from "@/app/utils/time_ago"
import Link from "next/link"
import { getVideos } from "@/app/controllers/pitch_material_controller";
import { UserContext } from "../../layout";
import NoData from "@/app/component/noData";

const Page = () => {
  const [videos, setVideos] = useState([]);
  const [ShowOptions, setShowOptions] = useState(false);
  const {userDetails}  = useContext(UserContext)
  const [loading, setloading] = useState(true);
  useEffect(() => {
        getVideos(1,5).then((body)=>setVideos(body.data))
  }, []);
    return (
    <div>
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="py-6 px-4 md:px-6 xl:px-7.5 ">
        <div className="flex justify-between">
<h4 className="text-xl font-semibold text-black dark:text-white">
          Videos
        </h4>
        {
        ["Admin"].includes(userDetails.role)&&
        <Link href={"/uploadPitchMaterial"} className="text-white bg-primary py-2 px-3 cursor-pointer rounded">Add</Link>
          
        }
      
        </div>
        {videos.length<1?<NoData/>:<div>
        <div className="grid grid-cols-3 gap-3 ">
           {videos.map((item,key)=>{
        return <div key={key} className="py-5 px-5 border border-stroke cursor-pointer  rounded hover:shadow-lg">
            <div>{item.fileName}</div>
        </div>
       })}
</div>
          </div>}
        
      </div>
     


     
    </div>
       
       
    </div>
    );
}
 
export default Page;