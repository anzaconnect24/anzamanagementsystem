"use client"
import { useContext, useEffect, useState } from "react";

import { getMyInfo, updateMyInfo, updateUser } from "@/app/controllers/user_controller";
import toast from 'react-hot-toast';
import Image from "next/image";
import Spinner from "@/components/spinner";
import { updateUserInformation } from "../../../controllers/user_controller";
import Loader from "@/components/common/Loader";

const Page = () => {
  const [user, setUser] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const [loading, setloading] = useState(true);
  const [fileImage, setfileImage] = useState(null);

  useEffect(() => {
        getMyInfo().then((data)=>{
          setUser(data)
          if(data.image){
            setfileImage(data.image)
            setloading(false)
          }
        })
  }, [refresh]);
    return  loading?<Loader/>:(
    <form onSubmit={(e)=>{
        e.preventDefault()
       let data = {
        name:e.target.name.value,
        email:e.target.email.value,
        phone:e.target.phone.value,
        file:fileImage?e.target.file.files[0]:null
       }
       console.log(data)
    //    alert("Holla")
       setloading(true)
       updateUserInformation(data).then((data)=>{
        setRefresh(refresh+1);
        setloading(false)
        toast.success("User details are updated successfully!")
        
       })
    }}>
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="py-6 px-4 md:px-6 xl:px-7.5">
        <div className="flex justify-center">
          <label for="file-upload"  className="aspect-squire h-34 w-34 flex justify-center items-center bg-graydark rounded-full cursor-pointer  ">
          {fileImage ==null ?<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" 
          className="w-12 text-white h-12">
  <path stroke-linecap="round" stroke-linejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
</svg>: <Image src={fileImage} className="rounded-full h-34 w-34 object-cover aspect-square" height={34} width={34}/>}
          

          </label>

          <input id="file-upload" onChange={(e)=>{
            setfileImage( URL.createObjectURL(e.target.files[0]))
          }} name="file"   className="form-style sr-only" placeholder="Name" type="file"/>


        </div>
        {/* {fileImage} */}

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