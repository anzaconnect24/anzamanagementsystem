"use client"
import { getBusiness, updateBusiness } from "@/app/controllers/business_controller";
import { useEffect, useState } from "react";
import {useRouter}from "next/navigation"
import Link from "next/link"
import Loader from "@/components/common/Loader";
import Breadcrumb from "../../../../component/Breadcrumb";
import { updateUser } from "@/app/controllers/user_controller";
import {toast} from "react-hot-toast"
import { createConversation } from "@/app/controllers/conversation_controller";
// import {Breadcrumb} from "@/app/component/Breadcrumb"

const Page = ({params}) => {
    const uuid = params.uuid
    const [business, setBusiness] = useState(null);
    const router = useRouter()
    const [loading, setloading] = useState(true);
  useEffect(() => {
        getBusiness(uuid).then((data)=>{
          setloading(false)
          setBusiness(data)
        })
    }, []);

    return loading?<Loader/>:(<div>
      
               <Breadcrumb prevLink="" prevPage="Businesses" pageName="Business details" />
         <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="py-6 px-4 md:px-6 xl:px-7.5">
      <div className="space-y-3">
          {[
          {title:"Enterprenuer name",value:business.User.name},
          {title:"Is alumni ?",value:business.isAlumni?"Yes":"false"},
          {title:"Attended (program)",value:business.completedProgram},
          {title:"Name",value:business.name},
          {title:"Company phone",value:business.phone},
          {title:"Company email",value:business.email},
          {title:"Business sector",value:business.BusinessSector.name},
          {title:"Registration",value:business.registration},
          {title:"Growth stage",value:business.stage},
          {title:"Problem",value:business.problem},
          {title:"Solution",value:business.solution},
          {title:"Traction",value:business.traction},

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
        <div className="flex mt-4" >
          <div className="w-4/12">
            Documents:
          </div>
          <div className="w-8/12 text-black">
          <div className="grid grid-cols-3 gap-4">
            {business.BusinessDocuments.map((item,key)=>{
              return <div key={key} className="h-full">
                <a href={item.link} target="_blank" className="py-8 cursor-pointer px-4 ring-1 flex flex-col items-center justify-center  ring-stroke hover:shadow" key={key}>
                {/* {item.link} */}
                <div>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                </div>
                <div className="mt-3 text-black text-center">
                {item.title}
                </div>
                </a>
                
              </div>
            })}
        </div>
          </div>

          </div>
         

          <div className="flex space-x-2">
          <div onClick={()=>{
             const data = {
              to:business.User.uuid,
              type:"userToUser",
              lastMessage:""
              
             }
             toast.success("Enabling end-to-end encryption. Please wait...")
             createConversation(data).then((data)=>{
               router.push(`/messages/${data.uuid}`)
             })
          }}  className="bg-success cursor-pointer  py-3 rounded hover:opacity-95
         px-4 text-white">Chat with Enterprenuer</div>
          <Link href={`/investmentApplication/${uuid}`} className="bg-black  py-3 rounded hover:opacity-95
         px-4 text-white">Apply to invest</Link>
          </div>
        {business.status == "waiting" && 
        <div className="flex space-x-3  pt-8">
        <div onClick={()=>{
          
              updateBusiness({status:"accepted"},uuid).then(()=>{
                updateUser({activated:true},business.User.uuid).then((data)=>{
                  router.back()
                })
              })
              
        }} className="bg-primary py-3 rounded px-4 cursor-pointer  hover:opacity-95 text-white">Accept</div>
        <Link href={`/applicationRejection/${uuid}`} className="bg-danger py-3 rounded hover:opacity-95
         px-4 text-white">Reject application</Link>

        </div>
        }
        
       
      </div>
      </div>

    </div> );
}
 
export default Page;