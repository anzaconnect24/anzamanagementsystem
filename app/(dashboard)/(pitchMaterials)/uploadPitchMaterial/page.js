"use client"
import { uploadPitchMaterial } from "@/app/controllers/pitch_material_controller";
import { useEffect, useState } from "react";
import Link from "next/link"
import { useRouter } from "next/navigation";
import Breadcrumb from "@/app/component/Breadcrumb";
import Spinner from "@/components/spinner";

const Page = ({params}) => {
    const uuid = params.uuid
    const router = useRouter()
    const [loading, setloading] = useState(false);
    return ( <div>
               <Breadcrumb prevLink={``} prevPage="video/documents" pageName="Material upload" />
         <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <form onSubmit={(e)=>{
        e.preventDefault()
        setloading(true)
        const data = {
            fileName : e.target.fileName.value,
            file:e.target.file.files[0],
            type:e.target.type.value,
            description:e.target.description.value,
        }
        console.log(data)
        uploadPitchMaterial(data).then((data)=>{
           router.back()
        })
      }} className="py-6 px-4 md:px-6 xl:px-7.5">
        <h4 className="text-xl font-semibold text-black dark:text-white">
        Upload new pitch material
        </h4>
        <div className="grid grid-cols-2 gap-y-3 gap-x-3 mt-4">
        <div>
            <label className="mb-2.5 block font-medium text-black dark:text-white">
               Title
            </label>
            <input name="fileName"  required className="form-style disabled:opacity-75" placeholder="Enter material title" type="text"/>
        </div>
        <div>
            <label className="mb-2.5 block font-medium text-black dark:text-white">
               Material type
            </label>
            <select name="type"  required className="form-style disabled:opacity-75" placeholder="Enter email address" type="text">
                <option>Select type</option>
                <option value="document">Document</option>
                <option value="video">Video</option>

            </select>
        </div>
        <div>
            <label className="mb-2.5 block font-medium text-black dark:text-white">
                File
            </label>
            <input name="file" onChange={(e)=>{
                
            }}  required className="form-style disabled:opacity-75" placeholder="Enter email address" 
            type="file"/>
        </div>
        </div>
        <div className="mt-3">
            <label className="mb-2.5 block font-medium text-black dark:text-white">
                Material description
            </label>
        <textarea name="description"  required className="form-style" placeholder="Write material description" type="file"/>

        </div>
        
        
        <div className="flex">
        <button type="submit" className="py-3 px-4 flex justify-center bg-primary cursor-pointer text-white rounded hover:opacity-95">
           <div>{loading?<Spinner/>:"Upload"}</div>
            </button>
        </div>

      </form>
      
      </div>
    </div> );
}

export default Page;