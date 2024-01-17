"use client"
import { createProgramUpdate } from "@/app/controllers/program_update_controller";
import { useEffect, useState } from "react";
import Link from "next/link"
import Loader from "@/components/common/Loader";
import { useRouter } from "next/navigation";
import Breadcrumb from "@/app/component/Breadcrumb";
import toast from 'react-hot-toast';

// import {Breadcrumb} from "@/app/component/Breadcrumb"
const Page = ({params}) => {
    const uuid = params.uuid;
    const [fields, setFields] = useState([]);
    const [requirement, setRequirement] = useState("");
    const router = useRouter()

    return ( <div>
      
               <Breadcrumb prevLink={``} prevPage="Programs" pageName="New program" />
         <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="py-6 px-4 md:px-6 xl:px-7.5 space-y-4 ">
        <h4 className="text-xl font-semibold text-black dark:text-white">
           New update
        </h4>
        <form onSubmit={(e)=>{
             e.preventDefault();
            const data = {
                title:e.target.title.value,
                description:e.target.description.value,
                program_uuid:uuid
             }
           createProgramUpdate(data).then(()=>{
            router.back()
           })
        }}>
        <div className="grid grid-cols-2 gap-x-3">
            <div>
            <label className="mb-2.5 block font-medium text-black dark:text-white">
             Title
            </label>
         <input name="title" className="w-full rounded border-stroke" placeholder="Enter title"/>

            </div>
        
         </div>
         <div className="mt-3">
         <label  className="mb-2.5 block font-medium text-black dark:text-white">
             Description
            </label>
         <textarea name="description" placeholder="Write description" className="border-stroke w-full rounded"></textarea>

         </div>
        
        
       
     <button type="submit" className="py-2 px-3 rounded bg-primary text-white">Publish</button>
       
        </form>
        
      

      </div>
      </div>

    </div> );
}
 
export default Page;