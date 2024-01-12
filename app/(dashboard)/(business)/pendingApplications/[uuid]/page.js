"use client"
import { getBusiness, updateBusiness } from "@/app/controllers/business_controller";
import { useEffect, useState } from "react";
import {useRouter}from "next/navigation"
import Link from "next/link"
import Breadcrumb from "../../../../component/Breadcrumb";
// import {Breadcrumb} from "@/app/component/Breadcrumb"
const Page = ({params}) => {
    const uuid = params.uuid
    const [business, setBusiness] = useState(null);
    const router = useRouter()
    useEffect(() => {
        getBusiness(uuid).then((data)=>setBusiness(data))
    }, []);

    return ( business&&<div>
      
               <Breadcrumb prevLink="/pendingApplications" prevPage="Pending applications" pageName="Application details" />
         <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="py-6 px-4 md:px-6 xl:px-7.5">
        <h4 className="text-xl font-semibold text-black dark:text-white">
        { business.name}
        
        
        </h4>
        <button onClick={()=>{
              updateBusiness({status:"accepted"},uuid).then(()=>{
                router.back()
              })
        }} className="bg-primary py-3 px-4  text-white">Accept</button>
        <Link href={`/applicationRejection/${uuid}`} className="bg-danger py-3 px-4 text-white">Reject application</Link>

      </div>
      </div>

    </div> );
}
 
export default Page;