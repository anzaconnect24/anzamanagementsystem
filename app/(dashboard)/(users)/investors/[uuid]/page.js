
"use client"
import {getAdmins, getUserInfo} from "@/app/controllers/user_controller.js"
import { timeAgo } from "@/app/utils/time_ago";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { createConversation } from "@/app/controllers/conversation_controller";
import { useRouter } from "next/navigation";
import { createNotification } from "@/app/controllers/notification_controller";

const Page = ({params}) => {
    
    const uuid = params.uuid;
    const [user, setuser] = useState(null);
    const [loading, setloading] = useState(true);
    const router = useRouter()

  useEffect(() => {
        getUserInfo(uuid).then((data)=>setuser(data))
    }, []);
    return (user&&<div>
        <Breadcrumb prevLink={`/investors`} prevPage="Investors" pageName="Investor profile" />
  <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
<div className="py-6 px-4 md:px-6 xl:px-7.5">
<div className="grid grid-cols-1 gap-y-4">
    {[
        {title:"Name",value:user.name},
        {title:"Email",value:user.email},
        {title:"Phone",value:user.phone},
        {title:"Address",value:user.InvestorProfile.geography},
        {title:"Company",value:user.InvestorProfile.company},
        {title:"Role/Title",value:user.InvestorProfile.role},
        {title:"Sector",value:user.InvestorProfile.BusinessSector.name},
        {title:"Avarage ticket",value:user.InvestorProfile.ticketSize},
        {title:"Structures",value:user.InvestorProfile.structure},
        {title:"Joined",value:timeAgo(user.createdAt)},    
].map((item,key)=>{
        return <div className="flex" key={key}>
            <div className="w-4/12">
                {item.title}
            </div>
            <div className="w-auto text-black">
                {item.value}
            </div>

        </div>
    })}
</div>
<button onClick={()=>{
             const data = {
                to:user.uuid,
                type:"userToUser",
                lastMessage:""
             }
             createNotification({ user_uuid:user.uuid,to:"User", message:`You have a new message`})
             toast.success("Enabling end-to-end encryption. Please wait...")
             createConversation(data).then((data)=>{
               router.push(`/messages/${data.uuid}`)
             })
          }}  className="bg-success cursor-pointer  py-3 rounded hover:opacity-95 mt-8
         px-4 text-white">Chat with an investor</button>
</div>

</div>
</div> );
}
 
export default Page;