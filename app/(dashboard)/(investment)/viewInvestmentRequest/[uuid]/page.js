"use client"
import Breadcrumb from "@/app/component/Breadcrumb";
import { investmentRequestDetails, sendInvestmentRequest, updateInvestmentRequest } from "@/app/controllers/investment_requests_controller"
import { useRouter } from "next/navigation";
import Link from "next/link"
import Loader from "@/components/common/Loader";
import { useContext, useEffect, useState } from "react";
import { UserContext } from "@/app/(dashboard)/layout";
import { timeAgo } from "@/app/utils/time_ago";
const Page = ({params}) => {
    const uuid = params.uuid;
    const router  =useRouter()
    const {userDetails} = useContext(UserContext)
    const [request, setrequest] = useState(null);
    const [loading, setloading] = useState(true);
    useEffect(() => {
      investmentRequestDetails(uuid).then((data)=>{
        setrequest(data)
        setloading(false)
      })
    }, []);
  
    return  ( loading?<Loader/>: <div>
        <Breadcrumb pageName={"Investment request"} prevLink={""} prevPage={"Requests"}/>
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="py-6 px-4 md:px-6 xl:px-7.5">
        <div className="space-y-3">
        {[
          {title:"Investor name",value:request.User.name},
          {title:"Investor email",value:request.User.email},
          {title:"Investor ticket size",value:request.User.InvestorProfile.ticketSize},
          {title:"Address",value:request.User.InvestorProfile.geography},
          {title:"Want to invest to",value:request.Business.name},
          {title:"Amount",value:`${request.investmentAmount} ${request.currency}`},
          {title:"Investment type",value:request.investmentType},
          {title:"Due diligance start date",value:request.dueDiligenceDate},
          {title:"Help request to Anza",value:request.helpFromAnza},
          {title:"Request sent",value:timeAgo(request.createdAt)},].map((item,key)=>{
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