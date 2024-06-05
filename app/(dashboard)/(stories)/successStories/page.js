"use client"
import { useContext, useEffect, useState } from "react";
import { deleteUser, getAllUsers, updateUser } from "../../../controllers/user_controller"
import {timeAgo} from "../../../utils/time_ago"
import Link from "next/link"
import Loader from "@/components/common/Loader";

import toast from "react-hot-toast"
import NoData from "@/app/component/noData";
import Spinner from "@/components/spinner";
import { getLogs } from "@/app/controllers/log_controller";
import { getSuccessStory } from "@/app/controllers/stories_controller";
import { UserContext } from "../../layout";
import Image from "next/image";
// import { getSuccessStory } from "../../../controllers/story_controller.jfx";

const Page = () => {
  const [users, setUsers] = useState([]);
  const [ShowOptions, setShowOptions] = useState(false);
const [refresh, setRefresh] = useState(0);
  const [loading, setloading] = useState(true);
const [total, settotal] = useState(0);
const [limit, setlimit] = useState(6);
const [currentPage, setcurrentPage] = useState(1);
const [selectedItem, setselectedItem] = useState(null);
const [totalPages, settotalPages] = useState(1);
const [activating, setactivating] = useState(false);
const [deleting, setdeleting] = useState(false);

const {userDetails} = useContext(UserContext)

  useEffect(() => {
        getSuccessStory(currentPage,limit).then((body)=>{
          console.log(body.data)
          setloading(false)
            settotal(body.count)
            setcurrentPage(body.page)
            settotalPages(body.totalPages)
            setUsers(body.data)
        })
  }, [refresh]);
    return  loading?<Loader/>: (
      <div className="">
    <div>
      <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="py-6 px-4 md:px-6 xl:px-7.5 flex justify-between ">
        <h4 className="text-xl font-semibold text-black dark:text-white">
          Success stories
        </h4>
        {["Admin"].includes(userDetails.role)&&
        <Link href="/newStory" className="py-2 px-3 bg-primary text-white rounded hover:opacity-95 cursor-pointer">New story</Link>
      }
      </div>
    {
      users.length<1?<NoData/>:<div>

        <div className="grid gap-4 grid-cols-3 px-8">
        {users.map((item, key) => (
        <Link className="w-full border p-8 rounded border-bodydark2 border-opacity-30 hover:shadow-lg" href={`/readStory/${item.uuid}`} key={key}>
          <div className="flex items-center space-x-2">
          <Image height={1000} width={1000} className="h-10 w-10 aspect-square rounded-full object-cover" src={item.Business.User.image}/>

            <div>
            <div className="font-bold text-lg line-clamp-1">{item.title}</div>
             <div className=" text-bodydark2 ">{timeAgo(item.createdAt)}</div>
            </div>
          </div>
          <div className=" line-clamp-2 mt-2">{item.story}</div>
          <div className="border border-primary py-2 w-full rounded font-bold text-primary flex justify-center mt-4">Read story</div>

        </Link>
      ))}
        </div>
       <div  className="flex px-5 py-8 justify-between">
        <div>Page {currentPage} of {totalPages} pages</div>
        <div className="flex space-x-3 ">
         <div onClick={()=>{
          if(currentPage >1){
            setcurrentPage(currentPage-1)
            setRefresh(refresh+1)
          }
         }} className="ring-1 ring-stroke hover:bg-primary hover:text-white py-2 px-4 cursor-pointer rounded ">Prev</div>
         <div onClick={()=>{
          if(currentPage<totalPages){
            setcurrentPage(currentPage+1)
            setRefresh(refresh+1)
          }
         }} className="ring-1 ring-stroke hover:bg-primary hover:text-white py-2 px-4 cursor-pointer rounded ">Next</div>
        </div>
      </div>
      </div>
    }
      
     

    </div>
       
       
    </div>
      </div>
   
    );
}
 
export default Page;