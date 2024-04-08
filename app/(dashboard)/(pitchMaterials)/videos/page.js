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
        ["Admin","Reviewer"].includes(userDetails.role)&&
        <Link href={"/uploadPitchMaterial/video"} className="text-white bg-primary py-2 px-3 cursor-pointer rounded">Add</Link>
        }
        </div>
        {videos.length<1?<NoData/>:<div>
        <div className="grid grid-cols-4 gap-3 ">
           {videos.map((item,key)=>{
        return <a  key={key} className="py-5 px-5 border border-stroke cursor-pointer flex flex-col items-center justify-center rounded hover:shadow-lg">
            <a href={item.link} target="_blank">
              <img height={1000} width={1000} alt={`${item.title}`} className="w-12" src="/video.png"/>
</a>
            <div className="mt-1">{item.fileName}</div>
            {["Admin"].includes(userDetails.role)&&
            <div className="flex space-x-2 justify-between mt-3">
            <Link href={`/viewer/${item.uuid}`} className="text-sm font-bold text-slate-300 opacity-30">Visibility</Link>
            <h1 onClick={()=>{
              deletePitchMaterial(item.uuid).then((data)=>{
                setRefresh(refresh+1)
              })
            }} className="text-sm  cursor-pointer font-bold text-danger">Delete</h1>

          </div>
            }
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