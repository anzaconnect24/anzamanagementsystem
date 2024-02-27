"use client"
import { createSector,getSector,editSector} from "@/app/controllers/sector_controller"
import { useEffect, useState } from "react";
import Link from "next/link"
import Loader from "@/components/common/Loader";
import { useRouter } from "next/navigation";
import Breadcrumb from "@/app/component/Breadcrumb";
import toast from 'react-hot-toast';
import Spinner from "@/components/spinner";

// import {Breadcrumb} from "@/app/component/Breadcrumb"
const Page = ({params}) => {
    const [fields, setFields] = useState([]);
    const [sector, setsector] = useState("");
    const router = useRouter()
    const [loading, setloading] = useState(false);
    useEffect(()=>{
       getSector(params.uuid).then((data)=>setsector(data))
    },[])
    return ( sector&& <div>
      
               <Breadcrumb prevLink={``} prevPage="Sectors" pageName="Edit sector" />
         <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="py-6 px-4 md:px-6 xl:px-7.5 space-y-4 ">
        <h4 className="text-xl font-semibold text-black dark:text-white">
           Edit sector
        </h4>
        <form onSubmit={(e)=>{
             e.preventDefault();
             setloading(true)
            const data = {
                name:e.target.name.value
             }
           editSector(params.uuid,data).then(()=>{
            router.back()
           })
        }}>
        <div className="grid grid-cols-2 gap-x-3">
            <div>
            <label className="mb-2.5 block font-medium text-black dark:text-white">
            Sector name
            </label>
         <input name="name" defaultValue={sector.name} className="w-full rounded border-stroke" 
         placeholder="Enter sector name"/>

            </div>
            </div>

            
        
        
     <button type="submit" className="py-3 px-4 mt-4 hover:opacity-95 rounded flex justify-center
      bg-primary text-white">
        <div>{loading?<Spinner/>:"Edit sector"}</div>
        </button>
       
        </form>
        
      

      </div>
      </div>

    </div> );
}
 
export default Page;