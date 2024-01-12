"use client"
import { getMyInfo } from "@/app/controllers/user_controller";
import Spinner from "@/components/spinner";
import { useRouter } from "next/navigation";
import { useState } from "react";

const Page = () => {
const [loading, setloading] = useState(false);
const router  = useRouter()    
    return ( <div>
        <div className="text-center w-5/12 mx-auto h-screen flex items-center justify-center">
            <div className="">
            <div className="text-primary font-bold text-base">Account review</div>
            <div className="text-4xl font-bold text-black pb-3 pt-2">Review on progress</div>
            <div className=" text-base ">We are currently reviewing your account informations, we will let you know via email when we are done.</div>
          
            <div onClick={()=>{
                setloading(true)
                getMyInfo().then((data)=>{
                    if(data.activated){
                     router.push("/")
                setloading(false)
                   
                    }
                    else{
                    
                setloading(false)
                  
                    }
                   })
            }} className="py-3 px-4 mt-5 bg-primary text-white rounded
             hover:opacity-95 cursor-pointer flex justify-center">

                {loading?<Spinner/>:"Refresh"}
              
                </div>
            </div>
         
        </div>
    </div> );
}
 
export default Page;