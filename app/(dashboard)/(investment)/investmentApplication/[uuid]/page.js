"use client"
import Breadcrumb from "@/app/component/Breadcrumb";
import { sendInvestmentRequest } from "@/app/controllers/investment_requests_controller"
import { useRouter } from "next/navigation";
const Page = ({params}) => {
    const uuid = params.uuid;
    const router  =useRouter()
    return ( <div>
        <Breadcrumb pageName={"Investment application"} prevLink={""} prevPage={"Businesses"}/>
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="py-6 px-4 md:px-6 xl:px-7.5">
    <div className="flex">
    <div className="py-3 px-4 bg-primary cursor-pointer rounded text-white hover:opacity-95" onClick={()=>{
        var data = {
           business_uuid:uuid
        }
        sendInvestmentRequest(data).then(()=>{
          router.back()
        })
      }}>Send application</div>
      </div>
    </div>
      
      </div>
 </div>);
}
 
export default Page;