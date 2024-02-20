"use client"
import { useContext, useState } from "react";
import Spinner from "@/components/spinner";
import { updateBusinessWithFile } from "../controllers/business_controller";
import toast from "react-hot-toast"
import { UserContext } from "../(dashboard)/layout";
const BusinessPlan = ({business}) => {
    const [uploadingDocument, setuploadingDocument] = useState(false);
    const {userDetails,setUserDetails} = useContext(UserContext)
    return ( <div className="py-6 px-8">
        <div className="font-bold text-2xl text-black mb-4">Business plan</div>
        
        <form onSubmit={(e)=>{
           e.preventDefault()
           const data = {
            title:e.target.title.value,
            documentName:"businessPlan",
            file:e.target.file.files[0]
           };
          setuploadingDocument(true)
           updateBusinessWithFile(business.uuid,data).then((response)=>{
            let newData = userDetails;
            newData.Business = response.body
            setUserDetails(newData)
            e.target.file.value = ""
            toast.success("Uploaded successfully")
            setuploadingDocument(false)
           })
        }} className="grid grid-cols-2  gap-4 items-start ">
          <div>
          <label className="mb-2.5 block font-medium text-black dark:text-white">
                  Document title
                  </label>
          <input required disabled defaultValue="Business Plan" name="title" className="border-stroke w-full rounded" placeholder="Enter title"/> 
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
        {userDetails.Business.businessPlan && <div className="py-4 mt-8 px-4 shadow border-stroke ring-stroke rounded ring-1 flex flex-col justify-center text-lg font-bold items-center">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
         stroke="currentColor" class="w-15 h-15">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>

          Business plan
        </div> }
       
    </div> );
}
 
export default BusinessPlan;