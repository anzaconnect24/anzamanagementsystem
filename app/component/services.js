"use client"
import { useContext, useState } from "react";
import Spinner from "@/components/spinner";
import { deleteBusinessDocument, updateBusinessWithFile, uploadBusinessDocument } from "../controllers/business_controller";
import toast from "react-hot-toast"
import { UserContext } from "../(dashboard)/layout";
import Image from "next/image"
const Services = () => {
    const [uploadingDocument, setuploadingDocument] = useState(false);
    const {userDetails,setUserDetails} = useContext(UserContext)
    return ( <div className="py-6 px-8">
        <div className="font-bold text-2xl text-black mb-4">Business services/products</div>
        <form onSubmit={(e)=>{
           e.preventDefault()
           const data = {
            title:e.target.title.value,
            type:"service",
            business_uuid:userDetails.Business.uuid,
            file:e.target.file.files[0]
           };
          setuploadingDocument(true)
           uploadBusinessDocument(data).then((response)=>{
            let newData = userDetails;
            newData.Business = response.body
            setUserDetails({...newData})
            e.target.file.value = ""
            e.target.title.value = ""

            toast.success("Uploaded successfully")
            setuploadingDocument(false)
           })
        }} className="grid grid-cols-2  gap-4 items-start ">
          <div>
          <label className="mb-2.5 block font-medium text-black dark:text-white">
                  Service/product name
                  </label>
          <input required   name="title" className="border-stroke w-full rounded" placeholder="Enter a name"/> 
          </div>
          <div>
          <label className="mb-2.5 block font-medium text-black dark:text-white">
                Upload an image
                  </label>
          <input required name="file" type="file" className="border-stroke w-full rounded" placeholder="Business name"/> 
          </div>
          <div>
          <button type="submit" className="py-3 px-4 flex justify-center bg-primary cursor-pointer text-white rounded hover:opacity-95">
            <div>{uploadingDocument?<Spinner/>:"Upload service/product"}</div>
          </button>
          </div>

        </form>
        <div className="grid grid-cols-3 gap-4 mt-8">
        {userDetails.Business.BusinessDocuments.filter((item)=>item.type =="service").map((item,key)=>  {
            return <div key={key} className="p-4 flex rounded shadow cursor-pointer text-center border border-stroke flex-col justify-start items-center text-lg font-bold">
                <div><Image src={item.link} className="w-full aspect-video object-cover rounded " height={1000} width={1000}  /></div>
                <div className="mt-2">{item.title}</div>
                <div className="flex space-x-2">
                 <div onClick={()=>{
                    window.open(item.link,'__blank')
                     
                  }} className="font-bold bg-success text-white border border-bodydark border-opacity-60 cursor-pointer rounded p-1 mt-2 text-sm">
                    Open file
                </div>
                <h1 onClick={()=>{
                    deleteBusinessDocument(item.uuid).then((data)=>{
                      let businessDocs = userDetails.Business.BusinessDocuments.filter((e)=>e.uuid != item.uuid)
                      let newData = {...userDetails,Business:{...userDetails.Business,BusinessDocuments:businessDocs}}
                      toast.success("Deleted successfully")
                      setUserDetails({...newData})
                    }) 
                  }} className="font-bold text-danger border border-bodydark border-opacity-60 cursor-pointer rounded p-1 mt-2 text-sm">
                    Delete file
                </h1>
             </div>
                </div>
        })}
        </div>
        
       
    </div> );
}
 
export default Services;