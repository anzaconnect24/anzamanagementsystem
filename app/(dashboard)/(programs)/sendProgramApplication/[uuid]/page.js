"use client"
import { sendProgramApplication, sendProgramApplicationDocument } from "@/app/controllers/program_application_controller";
import { useEffect, useState } from "react";
import {getProgram} from "@/app/controllers/program_controller"
import Link from "next/link"
import { useRouter } from "next/navigation";
import Breadcrumb from "../../../../component/Breadcrumb";
import Spinner from "@/components/spinner";
// import {Breadcrumb} from "@/app/component/Breadcrumb"
const Page = ({params}) => {
    const uuid = params.uuid
    const router = useRouter()
    const [program, setProgram] = useState(null);
    const [data, setData] = useState([]);
    const [loading, setloading] = useState(false);
    useEffect(() => {
        getProgram(uuid).then((data)=>{
          setProgram(data)
          setData(data.ProgramRequirements.map((item)=>{
            return {program_requirement_uuid:item.uuid,file:null}
          }))
        })
    }, []);

    return ( program&&<div>
               <Breadcrumb prevLink={``} prevPage="Programs" pageName="Program details" />
         <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="py-6 px-4 md:px-6 xl:px-7.5">
        <h4 className="text-xl font-semibold text-black dark:text-white">
        Send your application for {program.title}
        </h4>
       <div>The following are the required documents</div>
       <form onSubmit={(e)=>{
        e.preventDefault()
        setloading(true)
          sendProgramApplication({program_uuid:uuid}).then((response)=>{
            data.forEach(async(item) => {
            await sendProgramApplicationDocument(response.uuid,item).then((data)=>{
            })
            });
            setloading(false)
            router.back()

          })
       }}>
       <div className="space-y-3 pt-2">
       {program.ProgramRequirements.map((item,index)=>{
        return <div key={index} className="space-y-1">
          <div className="font-bold">
          {item.name}
          </div>
          <div>
          <input onChange={(e)=>{
             let file = e.target.files[0];
             let tempData= data;
             tempData[index].file = file;
             setData(tempData);
          }} required type="file"/>
          </div>
        </div>
       })}
       </div>
     
       <div>
       <button type="submit" className="py-3 mt-5 px-4 flex justify-center bg-primary cursor-pointer text-white rounded hover:opacity-95">
           <div>{loading?<Spinner/>:"Send application"}</div>
            </button>
      </div>
       </form>
       
      </div>
      
      </div>
    </div> );
}

export default Page;