
"use client"
import {getAdmins, getUserInfo} from "@/app/controllers/user_controller.js"
import { timeAgo } from "@/app/utils/time_ago";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useEffect, useState } from "react";

const Page = ({params}) => {
    
    const uuid = params.uuid;
    const [user, setuser] = useState(null);
    const [loading, setloading] = useState(true);
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

</div>

</div>
</div> );
}
 
export default Page;