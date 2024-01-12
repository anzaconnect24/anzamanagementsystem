"use client"
import { getProgramApplication } from "@/app/controllers/program_application_controller";
import { useEffect, useState } from "react";
import Link from "next/link"
import { useRouter } from "next/navigation";
import Breadcrumb from "../../../../component/Breadcrumb";

const Page = ({params}) => {
    const uuid = params.uuid
    const router = useRouter()
    const [application, setApplication] = useState(null);
    useEffect(() => {
        getProgramApplication(uuid).then((data)=>setApplication(data))
    }, []);

    return ( application&&<div>
               <Breadcrumb prevLink={``} prevPage="Applications" pageName="Application details" />
         <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="py-6 px-4 md:px-6 xl:px-7.5">
        <h4 className="text-xl font-semibold text-black dark:text-white">
        {application.title}
        </h4>
        <div className="text">
        {application.description}
        </div>
        <div className="flex">
        <Link href={`/sendApplicationApplication/${application.uuid}`} className="py-3 px-4 bg-primary text-white mt-3 ">Apply to application</Link>
        </div>

      </div>
      
      </div>
    </div> );
}

export default Page;