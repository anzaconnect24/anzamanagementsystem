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
      
               <Breadcrumb prevLink="" prevPage="Businesses" pageName="Business details" />
         <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="py-6 px-4 md:px-6 xl:px-7.5">
      <div className="space-y-3">
          {[
          {title:"Name",value:business.name},
          {title:"Company phone",value:business.phone},
          {title:"Company email",value:business.email},
          {title:"Business sector",value:business.BusinessSector.name},
          {title:"Registration",value:business.registration},
          {title:"Growth stage",value:business.stage},
          {title:"Problem",value:business.problem},
          {title:"Solution",value:business.solution},
          {title:"Traction",value:business.traction},

          ].map((item,key)=>{
          return <div className="flex" key={key}>
          <div className="w-4/12">
              {item.title}:
          </div>
          <div className="w-8/12 text-black">
              {item.value}
          </div>

          </div>
          })}
        </div>

        {business.status == "waiting" && 
        <div className="flex space-x-3  pt-8">
        <Link href="" onClick={()=>{
              updateBusiness({status:"accepted"},uuid).then(()=>{
                router.back()
              })
        }} className="bg-primary py-3 rounded px-4  hover:opacity-95 text-white">Accept</Link>
        <Link href={`/applicationRejection/${uuid}`} className="bg-danger py-3 rounded hover:opacity-95
         px-4 text-white">Reject application</Link>

        </div>
        }
        
       
      </div>
      </div>

    </div> );
}
 
export default Page;