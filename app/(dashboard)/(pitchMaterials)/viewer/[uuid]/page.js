"use client"
import { useContext, useEffect, useState } from "react";
import { deleteUser, getAllUsers, updateUser,getUsersWithSharedDocuments } from "../../../../controllers/user_controller"
import {timeAgo} from "../../../../utils/time_ago"
import Link from "next/link"
import Loader from "@/components/common/Loader";

import toast from "react-hot-toast"
import NoData from "@/app/component/noData";
import Spinner from "@/components/spinner";
import { addPitchMaterialViewer, deletePitchMaterialViewer } from "@/app/controllers/pitch_material_controller";
import Breadcrumb from "@/app/component/Breadcrumb";

const Page = ({params}) => {
  const [users, setUsers] = useState([]);
  const [ShowOptions, setShowOptions] = useState(false);
const [refresh, setRefresh] = useState(0);
  const [loading, setloading] = useState(true);
const [total, settotal] = useState(0);
const [limit, setlimit] = useState(7);
const [currentPage, setcurrentPage] = useState(1);
const [selectedItem, setselectedItem] = useState(null);
const [totalPages, settotalPages] = useState(1);
const [activating, setactivating] = useState(false);
const [deleting, setdeleting] = useState(false);
const [adminCount, setadminCount] = useState(0);



  useEffect(() => {
        getUsersWithSharedDocuments(limit,currentPage).then((body)=>{
          setloading(false)
            setadminCount(body.adminCount)
            settotal(body.count)
            setcurrentPage(body.page)
            settotalPages(body.totalPages)
            setUsers(body.data)
        })
  }, [refresh]);
    return  loading?<Loader/>: (
      <div className="">
        <Breadcrumb pageName="Pitch material Viewers" prevLink={""} prevPage={'Pitch materials'} />
    <div>
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="py-6 px-4 md:px-6 xl:px-7.5">
        <h4 className="text-xl font-semibold text-black dark:text-white">
          Viewers
        </h4>
      </div>
    {
      users.length<1?<NoData/>:<div>
<div className="grid grid-cols-6 border-t border-stroke py-4.5  dark:border-strokedark sm:grid-cols-8 md:px-6 2xl:px-7.5">
        <div className="col-span-1 flex items-center">
          <p className="font-medium">Sent </p>
        </div>
        <div className="col-span-1 hidden items-center sm:flex">
          <p className="font-medium">Username</p>
        </div>
        <div className="col-span-2 flex items-center">
          <p className="font-medium">Role</p>
        </div>
       
        <div className="col-span-2 flex items-center">
          <p className="font-medium">Email</p>
        </div>
        <div className="col-span-2 flex items-center">
          <p className="font-medium">Can view document</p>
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
          <div className="col-span-2 flex items-center ">
            <select disabled={["Investor","Enterprenuer"].includes(item.role)} onChange={(e)=>{
              if(e.target.value == "Investor" || e.target.value == "Enterprenuer"){
                toast.error("Sorry! You can't just change user to this role")
                e.target.value = item.role
              }
              else if(e.target.value == "Admin" && adminCount >2){
                toast.error("You have reached maximum number of admins")
                e.target.value = item.role
              }
              else{

                updateUser({role:e.target.value},item.uuid).then((data)=>{
                  setRefresh(refresh+1)
                  toast.success("Role changed")
                })
              }
             
            }} className="border-0 focus:border-stroke rounded py-1 focus:ring-stroke text-sm text-black dark:text-white "  defaultValue={item.role} >
              <option value="Admin">Admin</option>
              <option value="Staff">Staff</option>
              <option value="Investor">Investor</option>
              <option value="Enterprenuer">Enterprenuer</option>
              <option value="Reviewer">Reviewer</option>
            </select>
          </div>
         
          <div className="col-span-2 flex items-center">
            <p className="text-sm text-black dark:text-white">{item.email}</p>
          </div>
          <div className="col-span-1 flex items-center space-x-2">
            {item.PitchMaterialViewers.filter((e)=>e.PitchMaterial.uuid == params.uuid).length <1? <div onClick={()=>{
           
               addPitchMaterialViewer(params.uuid,{user_uuid:item.uuid}).then((data)=>{
                setRefresh(refresh+1)
               })
            }} className=" bg-bodydark2 hover:bg-opacity-90 rounded text-white py-2 px-3 cursor-pointer  text-sm relative">
                  {activating && selectedItem == key?<Spinner/>:"No"}
              
            </div>: <div onClick={()=>{
              var viewer = item.PitchMaterialViewers.filter((e)=>e.PitchMaterial.uuid == params.uuid);
                      //  console.log(viewer[0].uuid)
                      if(viewer.length >0){
                        deletePitchMaterialViewer(viewer[0].uuid).then((data)=>{
                          setRefresh(refresh+1)
                         })
                      }
                
                }} className="bg-primary hover:bg-opacity-90 rounded text-white py-2 px-3 cursor-pointer  text-sm relative">
                  {activating && selectedItem == key?<Spinner/>:"Yes"}
                   
                </div>}
               
          </div>
        
        </div>
      ))}
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