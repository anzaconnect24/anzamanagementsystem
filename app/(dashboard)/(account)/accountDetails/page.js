"use client"
import { useContext, useEffect, useState } from "react";
import {getApprovedBusinesses, getPendingBusinesses} from "@/app/controllers/business_controller"
import {timeAgo} from "@/app/utils/time_ago"
import Link from "next/link"
import Loader from "@/components/common/Loader";
import { getMyInfo, updateMyInfo, updateUser } from "@/app/controllers/user_controller";
import toast from 'react-hot-toast';
import Spinner from "@/components/spinner";

const Page = () => {

  const [user, setUser] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const [loading, setloading] = useState(false);
  const [loading, setloading] = useState(true);
  useEffect(() => {
        getMyInfo().then((data)=>setUser(data))
  }, [refresh]);
    return user&&(
    <form onSubmit={(e)=>{
        e.preventDefault()
       let data = {
        name:e.target.name.value,
        email:e.target.email.value,
        phone:e.target.phone.value,
       }
    //    alert("Holla")
       setloading(true)
       updateMyInfo(data).then((data)=>{
        setRefresh(refresh+1);
        setloading(false)
        toast.success("User details are updated successfully!")
        
       })
    }}>
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="py-6 px-4 md:px-6 xl:px-7.5">
        <h4 className="text-xl font-semibold text-black dark:text-white">
          Account infromations
        </h4>
        <div className="grid grid-cols-2 gap-y-3 gap-x-3 pt-4">
        <div>
            <label className="mb-2.5 block font-medium text-black dark:text-white">
                Name
            </label>
            <input name="name" defaultValue={user.name} required className="form-style" placeholder="Name" type="tel"/>
        </div>
        <div>
            <label className="mb-2.5 block font-medium text-black dark:text-white">
                Email address
            </label>
            <input name="email" disabled value={user.email} required className="form-style disabled:opacity-75" placeholder="Enter email address" type="tel"/>
        </div>
        <div>
            <label className="mb-2.5 block font-medium text-black dark:text-white">
                Phone number
            </label>
            <input name="phone" defaultValue={user.phone} required className="form-style" placeholder="Enter phone number" type="tel"/>
        </div>
        </div>
        <div className="flex pt-8">
        <button type="submit" className="py-3 px-4 flex justify-center bg-primary cursor-pointer text-white rounded hover:opacity-95">
           <div>{loading?<Spinner/>:"Update details"}</div>
            </button>
        </div>
      </div>
     
    
    </div>
       
       
    </form>
    );
}
 
export default Page;