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
  const [total, settotal] = useState(0);
  const [limit, setlimit] = useState(12);
  const [currentPage, setcurrentPage] = useState(1);
  const [selectedItem, setselectedItem] = useState(null);
  const [totalPages, settotalPages] = useState(1);
  const [loading, setloading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
        getEnterprenuers(limit,currentPage,keyword).then((body)=>{
            setUsers(body.data)
            settotal(body.count)
            setcurrentPage(body.page)
            settotalPages(body.totalPages)
            setloading(false)
        })
  }, [refresh]);
    return  loading?<Loader/>:(
      <div className="">
    <div>
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="flex justify-between py-6 px-4 md:px-6 xl:px-7.5">
      <div className=" ">
        <h4 className="text-xl font-semibold text-black dark:text-white">
         Enterprenuers
        </h4>
      </div>
      <input onChange={(e)=>{
        setKeyword(e.target.value)
        setrefresh(refresh+1)
      }} className="py-1 rounded border-bodydark border-opacity-40 " placeholder="Search here"/>
      </div>
     
{
  users.length <1?<NoData/>:<div className="pb-8">
  <div className="grid grid-cols-4">
      {users.map((item,key)=>(
        <div  className="flex flex-col items-center justify-center " key={key}>
        <Link href={`businessDetails/${item.Business.uuid}`} className=" bg-gray h-24 w-24 rounded-full">
          <Image height={200} width={200} className=" object-cover rounded-full" src={item.image}/>
        </Link>
        <h1 className="text-lg  text-black">{item.name}</h1>
        <Link href={`businessDetails/${item.Business.uuid}`} className="flex space-x-1 hover:underline hover:text-primary cursor-pointer items-center">
        <p className="text-sm text-black">{item.Business.name}</p>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25" />
        </svg>
        </Link>
        <div className="flex space-x-3 mt-3">
          <a target="__blank" href={item.Business.facebook}>
          <Image height={1000} width={1000} className="w-6 h-6" src={'/facebook.svg'}/>
          </a>
          <a target="__blank" href={item.Business.linkedin}>
          <Image height={1000} width={1000} className="w-6 h-6" src={'/linkedin.png'}/>
          </a>
          <a target="__blank" href={item.Business.instagram}>
          <Image height={1000} width={1000} className="w-6 h-6" src={'/instagram.png'}/>
          </a>
          <a target="__blank" href={item.Business.twitter}>
          <Image height={1000} width={1000} className="w-6 h-6" src={'/twitter.webp'}/>
          </a>

        </div>
        </div>
        
      ))}

    
      </div>
  </div>
}
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
       
       
    </div>
      </div>
   
    );
}
 
export default Page;