"use client"
import { useContext, useEffect, useState } from "react";
import {getApprovedBusinesses, getInvestorBusinesses, getPendingBusinesses} from "@/app/controllers/business_controller"
import {timeAgo} from "@/app/utils/time_ago"
import Link from "next/link"
import Loader from "@/components/common/Loader";
import { UserContext } from "../../layout";
import NoData from "@/app/component/noData";
import toast from "react-hot-toast"
import { sendInvestmentInterest } from "@/app/controllers/investment_interest_controller";

const Page = () => {
  const [applications, setApplications] = useState([]);
  const [ShowOptions, setShowOptions] = useState(false);
  const {userDetails} = useContext(UserContext)
  const [loading, setloading] = useState(true);
  useEffect(() => {
        getInvestorBusinesses(1,5).then((body)=>{
          setApplications(body.data)
          setloading(false)
        })
  }, []);
    return loading?<Loader/>: (
    <div>
      <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="py-6 px-4 md:px-6 xl:px-7.5">
        <h4 className="text-xl font-semibold text-black dark:text-white">
          Alumni
        </h4>
      </div>
  { applications.length <0?<NoData/>:
     <div>
<div className="grid grid-cols-6 border-t border-stroke py-4.5 px-4 dark:border-strokedark sm:grid-cols-8 md:px-6 2xl:px-7.5">
<div className="col-span-1 hidden items-center sm:flex">
          <p className="font-medium">Joined</p>
        </div>
      
        <div className="col-span-1 hidden items-center sm:flex">
          <p className="font-medium">Name</p>
        </div>
      
        <div className="col-span-2 flex items-center">
          <p className="font-medium">Business sector</p>
        </div>
        <div className="col-span-2 flex items-center">
          <p className="font-medium">Stage</p>
        </div>
        <div className="col-span-1 flex items-center">
          <p className="font-medium">Seeking</p>
        </div>
        <div className="col-span-1 flex items-center">
          <p className="font-medium"></p>
        </div>
      </div>

      {applications.map((item, key) => (
        <div
          className="grid grid-cols-6 border-t border-stroke py-4.5 px-4 dark:border-strokedark sm:grid-cols-8 md:px-6 2xl:px-7.5"
          key={key}
        >
           <div className="col-span-1 flex items-center">
            <p className="text-sm text-black dark:text-white">
              {timeAgo(item.createdAt)}
            </p>
          </div>
          
          <div className="col-span-1 flex items-center">
            <p className="text-sm text-black dark:text-white">
              {item.name}
            </p>
          </div>
          <div className="col-span-2 flex items-center">
            <p className="text-sm text-black dark:text-white">{item.BusinessSector.name}</p>
          </div>
          <div className="col-span-3 flex items-center">
            <p className="text-sm text-black dark:text-white">{item.stage}</p>
          </div>
          
          <div className="col-span-1 flex items-center">
          <div onClick={()=>{
                  if(item.uuid == ShowOptions){
                    setShowOptions("")
                    setSelectedBusiness(item)
                  }else{
                  setShowOptions(item.uuid)
                  setSelectedBusiness(null)
                }
                }} className="bg-primary hover:bg-opacity-90 rounded text-white py-2 px-3 cursor-pointer  text-sm relative">
                   Options
                   <div className={`absolute z-9 transition-all ${ShowOptions == item.uuid?" scale-100 ":" scale-0 "} -translate-x-4 bg-white shadow-lg   left-0 w-40 space-y-2 rounded-lg py-2 px-4 top-10`}>
                    {[
                      {title:"View details",path:`/businessDetails/${item.uuid}`},
                      {title:"Apply for investment",path:`/investmentApplication/${item.uuid}`},
                    ].map((item)=>{
                      return <div key={item.title}> 
                      <Link  className="text-black text-base hover:text-primary text-center " href={item.path}>{item.title}</Link>
                      </div>
                    })}
                     <div > 
                      <div onClick={()=>{
                        const data = {
                         from:"investor",
                         user_uuid:userDetails.uuid,
                         business_uuid:item.uuid
                        }
                        sendInvestmentInterest(data).then(()=>{
                          toast.success("Your interest is sent successfully")
                        })
                      }} className="text-black text-base hover:text-primary 
                      cursor-pointer " href="">Interested ?</div>
                      </div>
                   </div>
                </div>
          </div>
        </div>
      ))}
     </div>
  }
      
    </div>
       
       
    </div>
    );
}
 
export default Page;