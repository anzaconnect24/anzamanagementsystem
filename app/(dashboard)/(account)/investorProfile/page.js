"use client"
import { useContext, useEffect, useState } from "react";
import {getApprovedBusinesses, getPendingBusinesses} from "@/app/controllers/business_controller"
import {timeAgo} from "@/app/utils/time_ago"
import Link from "next/link"
import toast from 'react-hot-toast';
import Spinner from "@/components/spinner";
import { getSectors } from "@/app/controllers/sector_controller";
import { getMyInvestorProfile, updateInvestorProfile } from "@/app/controllers/investor_profile_controller";

const Page = () => {

  const [profile, setProfile] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const [loading, setloading] = useState(false);
  const [sectors, setSectors] = useState([]);
useEffect(() => {
  getSectors().then((data)=>{
    if(data){
      setSectors(data)
    }
  })
}, []);
  useEffect(() => {
        getMyInvestorProfile().then((data)=>setProfile(data))
  }, [refresh]);
    return profile&&(
    <form onSubmit={(e)=>{
        e.preventDefault()
       let  investorData= {
        role:e.target.investorRole.value,
        company:e.target.investorCompany.value,
        sector:e.target.investorSector.value,
        ticketSize:e.target.investorTicketSize.value,
        geography:e.target.investorGeography.value,
        structure:e.target.investorStructure.value
      }
    //    alert("Holla")
       setloading(true)
       updateInvestorProfile(investorData).then((data)=>{
        setRefresh(refresh+1);
        setloading(false)
        toast.success("Profile details are updated successfully!")
        
       })
    }}>
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="py-6 px-4 md:px-6 xl:px-7.5">
        <h4 className="text-xl font-semibold text-black dark:text-white">
          Investor profile
        </h4>
        <div className="grid mt-5 grid-cols-1 md:grid-cols-2 gap-x-2 gap-y-2">
          <div>
          <label className="mb-2.5 block font-medium text-black dark:text-white">
            Company name (optional)
          </label>
          <input  name="investorCompany" defaultValue={profile.company} className=" form-style" placeholder="Company name" type="text"/>

          </div>
          <div>
          <label className="mb-2.5 block font-medium text-black dark:text-white">
            Role/title
          </label>
          <input required name="investorRole" defaultValue={profile.role} className="form-style" placeholder="Enter your role/title" type="text"/>

          </div>
          <div>
          <label className="mb-2.5 block font-medium text-black dark:text-white">
            Current address
          </label>
          <input required defaultValue={profile.geography} name="investorGeography" className="form-style" placeholder="Write your address" type="text"/>
          </div>
          <div>
          <label className="mb-2.5 block font-medium text-black dark:text-white">
            Avarage ticket size
          </label>
          <input required defaultValue={profile.ticketSize} name="investorTicketSize" className="form-style" placeholder="Tell us your avarage ticket size" type="text"/>

          </div>
          
          <div>
          <label className="mb-2.5 block font-medium text-black dark:text-white">
            Structures
          </label>
          
          <select defaultValue={profile.structure} required name="investorStructure" className="form-style">
            <option>Select structure</option>
            <option value="equity">Equity</option>
            <option value="dept">Dept</option>
            <option value="mezzanine">Mezzanine</option>
          </select>
                    </div>
          
          <div>
          <label className="mb-2.5 block font-medium text-black dark:text-white">
            Business sector
          </label>
          <select defaultValue={profile.BusinessSector.uuid} required name="investorSector" className="form-style">
            <option>Select business sector</option>
            {sectors.map((item)=>{
            return  <option key={item.id} value={item.uuid}>{item.name}</option>
            })}
          </select>
          </div>
         
        </div>
        <div className="flex pt-8">
        <button type="submit" className="py-3 px-4 flex justify-center bg-primary cursor-pointer text-white rounded hover:opacity-95">
           <div>{loading?<Spinner/>:"Update details"}</div>
            </button>
        </div>
      </div>
     
    
    </div>
       
       
    </form>
    );
}
 
export default Page;