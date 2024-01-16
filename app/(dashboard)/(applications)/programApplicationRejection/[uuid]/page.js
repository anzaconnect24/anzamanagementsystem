"use client"
import { getBusiness, updateBusiness } from "@/app/controllers/business_controller";
import { useEffect, useState } from "react";
import Link from "next/link"
import { useRouter } from "next/navigation";
import Breadcrumb from "../../../../component/Breadcrumb";
import { updateProgramApplication } from "@/app/controllers/program_application_controller";
// import {Breadcrumb} from "@/app/component/Breadcrumb"
const Page = ({params}) => {
    const uuid = params.uuid
    const router = useRouter()
 
    useEffect(() => {
        
    }, []);

    return ( <div>
      
               <Breadcrumb prevLink={``} prevPage="Application details" pageName="Application rejection" />
         <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="py-6 px-4 md:px-6 xl:px-7.5">
        <h4 className="text-xl font-semibold text-black dark:text-white">
           Rejection feedback
        </h4>

        <form onSubmit={(e)=>{
            e.preventDefault()
           const data = {status:"rejected",feedback:e.target.message.value}
            updateProgramApplication(data,uuid).then(()=>{
               router.back();
               router.back();
            })
        }}>
            <textarea required name="message" className=" border-stroke rounded py-3 w-full" placeholder="Write reasons for rejection"/>
            <button className="bg-primary py-3 mt-3 rounded hover:opacity-95 px-4 text-white" type="submit">Send feedback</button>
        </form>
      </div>
      </div>

    </div> );
}
 
export default Page;