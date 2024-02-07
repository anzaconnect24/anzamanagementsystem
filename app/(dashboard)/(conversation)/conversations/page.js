"use client"
import { useContext, useEffect, useState } from "react";
import {getApprovedBusinesses, getInvestorBusinesses, getPendingBusinesses} from "@/app/controllers/business_controller"
import {timeAgo} from "@/app/utils/time_ago"
import Link from "next/link"
import Loader from "@/components/common/Loader";
import { UserContext } from "../../layout";
import NoData from "@/app/component/noData";
import Image from "next/image"
import toast from "react-hot-toast"
import { sendInvestmentInterest } from "@/app/controllers/investment_interest_controller";
import { getConversations } from "@/app/controllers/conversation_controller";
import { useRouter } from "next/navigation";

const Page = () => {
  const [conversations, setConversations] = useState([]);
  const [ShowOptions, setShowOptions] = useState(false);
  const {userDetails} = useContext(UserContext)
  const router = useRouter()
  const [loading, setloading] = useState(true);
  useEffect(() => {
        getConversations(1,5).then((body)=>{
          setConversations(body)
          setloading(false)
        })
  }, []);
    return loading?<Loader/>: (
    <div>
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="py-6 px-4 md:px-6 xl:px-7.5">
        <h4 className="text-xl font-semibold text-black dark:text-white">
          Conversations
        </h4>
        <div className="mt-6">
        {
        conversations.map((item,key)=>{
            const showUser1 = item.user1.email != userDetails.email;
            return <div onClick={()=>{
                toast.success("Enabling end-to-end encryption. Please wait...")
                  router.push(`/messages/${item.uuid}`)

            }} key={key} className="flex space-x-4 cursor-pointer">
                <div>
                    <div className="h-6 w-6 rounded-full flex justify-center bg-opacity-60 items-center bg-bodydark1  p-6">
                    {showUser1?item.user1.image==null?<div><svg xmlns="http://www.w3.org/2000/svg" fill="none" 
                    viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 text-primary">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                        </svg>
                        </div>:<Image height={40} width={40} className="rounded-full" src={item.user1.image}/> 
                        
                        :item.user2.image==null?<div><svg xmlns="http://www.w3.org/2000/svg" fill="none" 
                        viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 text-primary">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                        </svg>
                        </div>:<Image height={40} width={40} className="rounded-full" src={item.user2.image}/>}
                       
                    </div>
                </div>
                <div>
                    <div>{showUser1?item.user1.name:item.user2.name}</div>
                    <div>{showUser1?item.user1.email:item.user2.email}</div>

                </div>

            </div>
        })
      }
        </div>
       
      
      </div>
      
    </div>
       
       
    </div>
    );
}
 
export default Page;