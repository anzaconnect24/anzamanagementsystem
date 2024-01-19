"use client"
import { useContext, useEffect, useState } from "react";
import {getApprovedBusinesses, getPendingBusinesses} from "@/app/controllers/business_controller"
import {timeAgo} from "@/app/utils/time_ago"
import Link from "next/link"
import { getVideos } from "@/app/controllers/pitch_material_controller";
import { UserContext } from "../../layout";
import NoData from "@/app/component/noData";
import Loader from "@/components/common/Loader";

const Page = () => {
  const [videos, setVideos] = useState([]);
  const [ShowOptions, setShowOptions] = useState(false);
  const {userDetails}  = useContext(UserContext)
  const [loading, setloading] = useState(true);
  useEffect(() => {
        getVideos(1,5).then((body)=>{
          setloading(false)
          setVideos(body.data)
        })
  }, []);
    return loading?<Loader/>:(
    <div>
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="py-8 px-5 md:px-6 xl:px-7.5 ">
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
        <div className="grid grid-cols-4 gap-3 ">
           {videos.map((item,key)=>{
        return <a href={item.link} target="_blank" key={key} className="py-5 px-5 border border-stroke cursor-pointer flex flex-col items-center justify-center rounded hover:shadow-lg">
            <div><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
</svg>
</div>
            <div>{item.fileName}</div>
        </a>
       })}
</div>
          </div>}
        
      </div>
     


     
    </div>
       
       
    </div>
    );
}
 
export default Page;