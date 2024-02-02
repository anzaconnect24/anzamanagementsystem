"use client"
import { useContext, useEffect, useState } from "react";
import {deleteBusinessDocument, getApprovedBusinesses, getBusiness, getPendingBusinesses, updateBusiness, uploadBusinessDocument} from "@/app/controllers/business_controller"
import {timeAgo} from "@/app/utils/time_ago"
import Link from "next/link"
import Loader from "@/components/common/Loader";
import { getMyInfo, updateMyInfo, updateUser } from "@/app/controllers/user_controller";
import toast from 'react-hot-toast';
import Spinner from "@/components/spinner";
import { getSectors } from "@/app/controllers/sector_controller";
import BusinessInformation from "@/app/component/business_information"
// import AccountDetails from "@/app/(dashboard)/(account)/accountDetails"
import { UserContext } from "../../layout";
import AccountDetails from "../accountDetails/page";
import BusinessPlan from "@/app/component/business_plan"
import FinencialInformation from "@/app/component/financial_information"
import LegalDocumentation from "@/app/component/legal_documentation"
import MarketResearch from "@/app/component/market_research"
import Services from "@/app/component/services"

const Page = () => {
  const [refresh, setRefresh] = useState(0);
  const {userDetails } = useContext(UserContext)
  const [loadingData, setloadingData] = useState(false);
const [selectedIndex, setselectedIndex] = useState(0);
  
  const tabs = [
  <AccountDetails key={1}/>, 
  <BusinessInformation  key={2}/>,
  <BusinessPlan key={5}  business={userDetails.Business}/>,
  <FinencialInformation key={4} />,
  <Services key={6}/>,
  <MarketResearch key={7} business={userDetails.Business}/>,
  <LegalDocumentation key={8}/>]
    return  loadingData?<Loader/>: (
      <div className="flex space-x-4 ">
        <div className="w-3/12 space-y-0">
          {[
          {title:"Personal informations",checked:true},
          {title:"Business informations",checked:true},
          {title:"Business plan",checked:userDetails.Business.businessPlan?true:false},
          {title:"Financial information",checked:userDetails.Business.BusinessDocuments.filter((item)=>item.type =="financialInformation").length>0},
          {title:"Product/service details",checked:userDetails.Business.BusinessDocuments.filter((item)=>item.type =="service").length>0},
          {title:"Market Research",checked:userDetails.Business.marketResearch?true:false},
          {title:"Legal Documentation",checked:userDetails.Business.BusinessDocuments.filter((item)=>item.type =="legalDocumentation").length>0},       

        ].map((item,index)=>{
            return <div key={index} onClick={()=>{
              setselectedIndex(index)
            }} className={`border ${index==selectedIndex&&"border-l-primary "} flex space-x-2 border-stroke items-center cursor-pointer bg-white rounded py-3 px-4`}>
              <div><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" 
                stroke-width="1.5" stroke="currentColor" className={`w-6 h-6 ${item.checked?"text-success":"text-stroke"} `}>
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
              </svg>
              </div>
              <div>
              {item.title}
              </div>

              </div>
          })}
        </div>
        <div className="w-9/12 rounded-sm border  border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          {tabs[selectedIndex]}

        </div>

    </div>
  
    
    );
}
 
export default Page;