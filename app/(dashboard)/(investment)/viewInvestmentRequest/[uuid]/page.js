"use client"
import Breadcrumb from "@/app/component/Breadcrumb";
import { sendInvestmentRequest, updateInvestmentRequest } from "@/app/controllers/investment_requests_controller"
import { useRouter } from "next/navigation";
import Link from "next/link"
import Loader from "@/components/common/Loader";
import { useContext } from "react";
import { UserContext } from "@/app/(dashboard)/layout";
const Page = ({params}) => {
    const uuid = params.uuid;
    const router  =useRouter()
    const {userDetails} = useContext(UserContext)
  
    return  ( <div>
        <Breadcrumb pageName={"Investment request"} prevLink={""} prevPage={"Businesses"}/>
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="py-6 px-4 md:px-6 xl:px-7.5">
   

   {["Admin"].includes(userDetails.role)&&<div className="flex space-x-3  pt-8">
        <Link href="" onClick={()=>{
              updateInvestmentRequest(uuid,{status:"accepted"}).then(()=>{
                router.back()
              })
        }} className="bg-primary py-3 rounded px-4  hover:opacity-95 text-white">Accept</Link>
        <Link href={`/rejectApplicationRequest/${uuid}`} className="bg-danger py-3 rounded hover:opacity-95
         px-4 text-white">Reject application</Link>

        </div>}
    
      </div>
    
      
      </div>
 </div>);
}
 
export default Page;