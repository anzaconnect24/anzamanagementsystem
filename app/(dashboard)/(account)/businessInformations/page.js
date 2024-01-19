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
import { UserContext } from "../../layout";

const Page = () => {

  const [user, setUser] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const [loading, setloading] = useState(false);
  const [sectors, setSectors] = useState([]);
  const [business, setBusiness] = useState(null);
  const {userDetails } = useContext(UserContext)
  const [uploadingDocument, setuploadingDocument] = useState(false);
  const [loadingData, setloadingData] = useState(true);
  useEffect(() => {
  getSectors().then((data)=>{
    if(data){
      setSectors(data)
    }
  })
}, []);
  useEffect(() => {
        getBusiness(userDetails.Business.uuid).then((data)=>{
          setBusiness(data)
          setloadingData(false)
        })
  }, [refresh]);
    return  loadingData?<Loader/>: (
      <div>
 <form onSubmit={(e)=>{
        e.preventDefault()
      const  businessData = {
          name : e.target.businessName.value,
          email : e.target.businessEmail.value,
          phone : e.target.businessPhone.value,
          problem : e.target.problem.value,
          solution : e.target.solution.value,
          traction : e.target.traction.value,
          registration : e.target.registration.value,
          stage : e.target.stage.value,
          business_sector_uuid : e.target.business_sector_uuid.value,
          team : e.target.team.value,
        }
    //    alert("Holla")
       setloading(true)
       updateBusiness(businessData).then((data)=>{
        setRefresh(refresh+1);
        setloading(false)
        toast.success("User details are updated successfully!")
        
       })
    }}>
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="py-6 px-4 md:px-6 xl:px-7.5">
        <h4 className="text-xl font-semibold text-black dark:text-white pb-6">
          Business Informations
        </h4>
        <div className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-2 gap-y-2">
                  <div>
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                    Business name
                  </label>
                  <input defaultValue={business.name} required name="businessName" className=" form-style" placeholder="Company name" type="text"/>

                  </div>
                  <div>
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                    Business email adress
                  </label>
                  <input required defaultValue={business.email} name="businessEmail" className="form-style" placeholder="Company email address" type="text"/>

                  </div>
                  <div>
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                    Business phone number
                  </label>
                  <input required defaultValue={business.phone} name="businessPhone" className="form-style" placeholder="Company phone number" type="text"/>

                  </div>
                  <div>
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                  Number of people in your team
                  </label>
                  <input required defaultValue={business.team} name="team" className="form-style" placeholder="Enter number of team members" type="text"/>
                  </div>
                  <div>
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                    Registration status
                  </label>
                  <select defaultValue={business.registration} required name="registration" className="form-style">
                    <option>Registration status</option>
                    <option value="Registered with BRELA">Registered with BRELA</option>
                    <option value="Registered with TIN only">Registered with TIN only</option>
                    <option value="Have BRELA and TIN">Have BRELA and TIN</option>
                  </select>
                            </div>
                  
                  <div>
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                    Business sector
                  </label>
                  <select defaultValue={business.BusinessSector.uuid} required name="business_sector_uuid" className="form-style">
                    <option>Select business sector</option>
                    {sectors.map((item)=>{
                    return  <option key={item.id} value={item.uuid}>{item.name}</option>
                    })}
                  </select>
                  </div>
                  <div>
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                    Business stage
                  </label>
                  <select defaultValue={business.stage} required name="stage" className="form-style">
                  <option>Select business stage</option>
                    <option value="Startup">Startup</option>
                    <option value="Growth stage">Growth stage</option>
                    <option value="Expansion stage">Expansion stage</option>
                    <option value="Maturity stage">Maturity stage</option>
                  </select>
                  </div>
                  
                  
                
                
                </div>
                <div>
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                  What problems does your business solve ?
                  </label>
                  <textarea defaultValue={business.problem} name="problem" className="form-style" placeholder="What problem does your business solve ?"></textarea>
                  </div>
                  <div>
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                  What solution does your business provide ?
                  </label>
                  <textarea defaultValue={business.solution} name="solution" className="form-style" placeholder="What solution does your business provide ?"></textarea>
                  </div>
                  <div>
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                  What is your commercial traction ? (Number of paying customers or revenue per year)
                  </label>
                  <textarea defaultValue={business.traction} name="traction" className="form-style" placeholder="What is your commecial traction ?" />
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
    
      <div className="rounded-sm border mt-10 border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="py-6 px-4 md:px-6 xl:px-7.5">
        <h4 className="text-xl font-semibold text-black dark:text-white pb-6">
          Upload documents
        </h4>
        <form onSubmit={(e)=>{
           e.preventDefault()
           const data = {
            title:e.target.title.value,
            business_uuid:business.uuid,
            file:e.target.file.files[0]
           };
          setuploadingDocument(true)
           uploadBusinessDocument(data).then(()=>{
            setRefresh(refresh+1)
            e.target.title.value = "";
            e.target.file.value = ""
            toast.success("Document added successfully")

          setuploadingDocument(false)

           })
        }} className="grid grid-cols-3 gap-x-4 items-start">
          <div>
          <label className="mb-2.5 block font-medium text-black dark:text-white">
                  Document title
                  </label>
          <input required name="title" className="border-stroke w-full rounded" placeholder="Enter title"/> 
          </div>
          <div>
          <label className="mb-2.5 block font-medium text-black dark:text-white">
                Upload document file
                  </label>
          <input required name="file" type="file" className="border-stroke w-full rounded" placeholder="Business name"/> 
          </div>
          <div>
          <button type="submit" className="py-3 px-4 flex justify-center bg-primary cursor-pointer text-white rounded hover:opacity-95">
            <div>{uploadingDocument?<Spinner/>:"Upload document"}</div>
          </button>
          </div>
        </form>
        <div className="mt-10">
        <h4 className="text-xl font-semibold text-black dark:text-white pb-6">
          
          Business documents
        </h4>
        <div className="grid grid-cols-4 gap-x-4">
            {business.BusinessDocuments.map((item,key)=>{
              return <div className="">
                <a href={item.link} target="_blank" className="py-8 cursor-pointer px-4 ring-1 flex flex-col items-center justify-center  ring-stroke hover:shadow" key={key}>
                {/* {item.link} */}
                <div>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                </div>
                <div className="mt-3 text-black">
                {item.title}
                </div>
                </a>
                <div onClick={()=>{
                  deleteBusinessDocument(item.uuid).then(()=>{
                     setRefresh(refresh+1)
                     toast.success("Document deleted successfully")
                  })
                }} className=" cursor-pointer flex justify-center mt-2 ">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="w-6 h-6 hover:text-danger">
  <path stroke-linecap="round" stroke-linejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
</svg>

                </div>
              </div>
            })}
        </div>
        </div>
        
      </div>
    </div>
    </div>
  
    
    );
}
 
export default Page;