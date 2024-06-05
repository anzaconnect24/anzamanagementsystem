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
import CompanyProfile from "../../../component/company_profile";

const Page = () => {
  const [refresh, setRefresh] = useState(0);
  const {userDetails } = useContext(UserContext)
  const [loadingData, setloadingData] = useState(false);
const [selectedIndex, setselectedIndex] = useState(0);
  
  const tabs = [
  <AccountDetails key={1}/>, 
  <CompanyProfile  key={9}/>,
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
          {title:"Account details",checked:true},
          {title:"Company profile",checked:userDetails.Business.companyProfile?true:false},
          {title:"Business informations",checked:true},
          {title:"Business plan",checked:userDetails.Business.businessPlan?true:false},
          {title:"Financial information",checked:userDetails.Business.BusinessDocuments.filter((item)=>item.type =="financialInformation").length>0},
          {title:"Product/service details",checked:userDetails.Business.BusinessDocuments.filter((item)=>item.type =="service").length>0},
          {title:"Market Research",checked:userDetails.Business.marketResearch?true:false},
          {title:"Legal Documentation",checked:userDetails.Business.BusinessDocuments.filter((item)=>item.type =="legalDocumentation").length>0},       

        ].map((item,index)=>{
            return <div key={index} onClick={()=>{
              setselectedIndex(index)
            }} className={` border-l-6 ${index==selectedIndex&&"border-l-primary "} flex space-x-2 border-stroke items-center cursor-pointer bg-white rounded py-3 px-4`}>
              <div><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
               className={`w-6 h-6 ${item.checked?"text-success":"text-stroke"}`}>
  <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
</svg>

              </div>
              <div>
              {item.title}
              </div>

              </div>
          })}
        </div>
        <div className="w-9/12 rounded-lg border  border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          {tabs[selectedIndex]}

        </div>

    </div>
  
    
    );
}
 
export default Page;