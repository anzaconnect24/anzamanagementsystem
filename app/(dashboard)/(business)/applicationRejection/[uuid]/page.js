"use client"
import { getBusiness, updateBusiness } from "@/app/controllers/business_controller";
import { useEffect, useState } from "react";
import Link from "next/link"
import Loader from "@/components/common/Loader";
import { useRouter } from "next/navigation";
import Breadcrumb from "../../../../component/Breadcrumb";
// import {Breadcrumb} from "@/app/component/Breadcrumb"
const Page = ({params}) => {
    const uuid = params.uuid
    const router = useRouter()
    const [business, setBusiness] = useState(null);
    const [loading, setloading] = useState(true);
  useEffect(() => {
        getBusiness(uuid).then((data)=>setBusiness(data))
    }, []);

    return ( business&&<div>
      
               <Breadcrumb prevLink={``} prevPage="Application details" pageName="Application rejection" />
         <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="py-6 px-4 md:px-6 xl:px-7.5">
        <h4 className="text-xl font-semibold text-black dark:text-white">
           Rejection feedback
        </h4>

        <form onSubmit={(e)=>{
            e.preventDefault()
           const data = {status:"rejected",feedbackMessage:e.target.message.value}
            updateBusiness(data,uuid).then(()=>{
               router.back();
               router.back();

            })
        }}>
            <textarea required name="message" className=" bg-stroke w-full" placeholder="Write reasons for rejection"/>
            <button className="bg-primary py-3 px-4 text-white" type="submit">Send feedback</button>
        </form>
  

      </div>
      </div>

    </div> );
}
 
export default Page;