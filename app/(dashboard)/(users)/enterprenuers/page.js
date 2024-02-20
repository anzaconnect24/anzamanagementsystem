"use client"
import { useContext, useEffect, useState } from "react";
import { getAllUsers, getEnterprenuers } from "../../../controllers/user_controller"
import {timeAgo} from "../../../utils/time_ago"
import Link from "next/link"
import Loader from "@/components/common/Loader";
import NoData from "@/app/component/noData";
import Image from "next/image";

const Page = () => {
  const [users, setUsers] = useState([]);
  const [ShowOptions, setShowOptions] = useState(false);

  const [loading, setloading] = useState(true);
  useEffect(() => {
        getEnterprenuers(5,1).then((body)=>{
          setloading(false)
            console.log(body.data.length)

            setUsers(body.data)
        })
  }, []);
    return  loading?<Loader/>:(
      <div className="">
    <div>
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="py-6 px-4 md:px-6 xl:px-7.5">
        <h4 className="text-xl font-semibold text-black dark:text-white">
          Enterprenuers
        </h4>
      </div>
{
  users.length <1?<NoData/>:<div className="pb-8">
  <div className="grid grid-cols-6">
      {users.map((item,key)=>(
        item.image==null&&<div className="flex flex-col items-center justify-center " key={key}>
        <div className="p-5 bg-gray h-24 w-24 rounded-full">
          <Image height={200} width={200} src={item.image}/>
        </div>
        <h1 className="text-lg">{item.name}</h1>
        <p className="text-sm">{timeAgo(item.createdAt)}</p>
        
        </div>
        
      ))}

    
      </div>
  </div>
}
      
    </div>
       
       
    </div>
      </div>
   
    );
}
 
export default Page;