"use client"
import { getProgram } from "@/app/controllers/program_controller";
import { useEffect, useState } from "react";
import Link from "next/link"
import Loader from "@/components/common/Loader";
import { useRouter } from "next/navigation";
import Breadcrumb from "../../../../component/Breadcrumb";
import { timeAgo } from "@/app/utils/time_ago";
// import {Breadcrumb} from "@/app/component/Breadcrumb"
const Page = ({params}) => {
    const uuid = params.uuid
    const router = useRouter()
    const [program, setProgram] = useState(null);
    const [loading, setloading] = useState(true);
  useEffect(() => {
        getProgram(uuid).then((data)=>setProgram(data))
    }, []);

    return ( program&&<div>
               <Breadcrumb prevLink={``} prevPage="Programs" pageName="Program details" />
         <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="py-6 px-4 md:px-6 xl:px-7.5">
      <div className="grid grid-cols-1 gap-y-4">
    {[
        {title:"Program title",value:program.title},
        {title:"Program description",value:program.description},
        {title:"Published",value:timeAgo(program.createdAt)},

   
].map((item,key)=>{
        return <div className="flex" key={key}>
            <div className="w-4/12">
                {item.title}:
            </div>
            <div className="w-8/12 text-black">
                {item.value}
            </div>

        </div>
    })}
</div>
       {program.applied == 0 &&
        <div className="flex mt-5">
        <Link href={`/sendProgramApplication/${program.uuid}`} className="py-3 px-4 bg-primary rounded hover:opacity-95 text-white mt-3 ">Apply to program</Link>
        </div>
       }
       

      </div>
      
      </div>
    </div> );
}

export default Page;