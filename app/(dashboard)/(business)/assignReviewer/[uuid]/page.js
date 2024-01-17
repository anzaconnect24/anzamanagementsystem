"use client"
import { useContext, useEffect, useState } from "react";
import {getAllUsers} from "@/app/controllers/user_controller"
import {createBusinessReview, deleteBusinessReview, getReviewers} from "@/app/controllers/business_review_controller"

import {timeAgo} from "@/app/utils/time_ago"
import Link from "next/link"
import Loader from "@/components/common/Loader";
import Breadcrumb from "@/app/component/Breadcrumb";


const Page = ({params}) => {
    const uuid = params.uuid;
  const [users, setUsers] = useState([]);
  const [ShowOptions, setShowOptions] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [loading, setloading] = useState(true);
const [total, settotal] = useState(0);
const [limit, setlimit] = useState(7);
const [currentPage, setcurrentPage] = useState(1);
const [totalPages, settotalPages] = useState(1);
  useEffect(() => {
        getReviewers(uuid,currentPage,limit).then((body)=>{
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
      <Breadcrumb pageName={"Assign reviewer"} prevLink={""} prevPage={"Businesses"}/>
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="py-6 px-4 md:px-6 xl:px-7.5">
        <h4 className="text-xl font-semibold text-black dark:text-white">
          Reviewers ({total})
        </h4>
      </div>

      <div className="grid grid-cols-6 border-t border-stroke py-4.5 px-4 dark:border-strokedark sm:grid-cols-8 md:px-6 2xl:px-7.5">
        <div className="col-span-1 flex items-center">
          <p className="font-medium">Sent </p>
        </div>
        <div className="col-span-1 hidden items-center sm:flex">
          <p className="font-medium">Username</p>
        </div>
        <div className="col-span-1 flex items-center">
          <p className="font-medium">Role</p>
        </div>
        <div className="col-span-2 flex items-center">
          <p className="font-medium">Phone</p>
        </div>
        <div className="col-span-2 flex items-center">
          <p className="font-medium">Email</p>
        </div>
        <div className="col-span-1 flex items-center">
          <p className="font-medium">Assign</p>
        </div>
      </div>

      {users.map((item, key) => (
        <div
          className="grid grid-cols-6 border-t border-stroke py-4.5 px-4 dark:border-strokedark sm:grid-cols-8 md:px-6 2xl:px-7.5"
          key={key}
        >
          
          <div className="col-span-1 hidden items-center sm:flex">
            <p className="text-sm text-black dark:text-white">
            {timeAgo(item.createdAt)}
            </p>
          </div>
          <div className="col-span-1 flex items-center">
            <p className="text-sm text-black dark:text-white">
              {item.name}
            </p>
          </div>
          <div className="col-span-1 flex items-center">
            <p className="text-sm text-black dark:text-white">
              {item.role}
            </p>
          </div>
          <div className="col-span-2 flex items-center">
            <p className="text-sm text-black dark:text-white">{item.phone}</p>
          </div>
          <div className="col-span-2 flex items-center">
            <p className="text-sm text-black dark:text-white">{item.email}</p>
          </div>
          <div className="col-span-1 flex items-center">
          <div onClick={()=>{
                      const data = {
                        business_uuid:uuid ,
                        user_uuid:item.uuid
                      }
                        if(item.status <1){
                          createBusinessReview(data).then((data)=>{
                               setRefresh(refresh+1)
                           })
                       }else{
                           deleteBusinessReview(item.BusinessReview.uuid).then((data)=>{
                               setRefresh(refresh+1)
                           })
                       }
                    }} className={`py-2 px-3 ${item.status <1?"bg-primary text-white":"bg-bodydark1 text-black"} cursor-pointer
                     hover:opacity-95 transition-all  rounded`}>
                      {item.status<1?"Assign":"Remove"}</div>
          </div>
        </div>
      ))}

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