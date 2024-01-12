"use client"
import { getProgram } from "@/app/controllers/program_controller";
import { useEffect, useState } from "react";
import Link from "next/link"
import { useRouter } from "next/navigation";
import Breadcrumb from "../../../../component/Breadcrumb";
// import {Breadcrumb} from "@/app/component/Breadcrumb"
const Page = ({params}) => {
    const uuid = params.uuid
    const router = useRouter()
    const [program, setProgram] = useState(null);
    useEffect(() => {
        getProgram(uuid).then((data)=>setProgram(data))
    }, []);

    return ( program&&<div>
               <Breadcrumb prevLink={``} prevPage="Programs" pageName="Program details" />
         <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="py-6 px-4 md:px-6 xl:px-7.5">
        <h4 className="text-xl font-semibold text-black dark:text-white">
        {program.title}
        </h4>
        <div className="text">
        {program.description}
        </div>
        <div className="flex">
        <Link href={`/sendProgramApplication/${program.uuid}`} className="py-3 px-4 bg-primary text-white mt-3 ">Apply to program</Link>
        </div>

      </div>
      
      </div>
    </div> );
}

export default Page;