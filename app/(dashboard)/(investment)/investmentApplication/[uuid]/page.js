"use client"
import Breadcrumb from "@/app/component/Breadcrumb";
import { sendInvestmentRequest } from "@/app/controllers/investment_requests_controller"
import Spinner from "@/components/spinner";
import { useRouter } from "next/navigation";
import { useState } from "react";
const Page = ({params}) => {
    const uuid = params.uuid;
    const router  =useRouter()
    const [loading, setloading] = useState(false);
    return ( <div>
        <Breadcrumb pageName={"Investment application"} prevLink={""} prevPage={"Businesses"}/>
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="py-6 px-4 md:px-6 xl:px-7.5">
      <form onSubmit={(e)=>{
             e.preventDefault();
             setloading(true)
            const data = {
                business_uuid:uuid,
                investmentAmount:e.target.investmentAmount.value,
                investmentType:e.target.investmentType.value,
                dueDiligenceDate:e.target.dueDiligenceDate.value,
                helpFromAnza:e.target.helpFromAnza.value,
                currency:e.target.currency.value
             }
             sendInvestmentRequest(data).then(()=>{
             setloading(false)
              router.back()
            })
        }}>
        <div className="grid grid-cols-2 gap-x-3 gap-y-3">
            <div>
            <label className="mb-2.5 block font-medium text-black dark:text-white">
           Enter amount you intend to invest
            </label>
         <input name="investmentAmount" type="number" className="w-full rounded border-stroke" placeholder="Enter amount"/>
            </div>
            <div>
            <label className="mb-2.5 block font-medium text-black dark:text-white">
           Select currency
            </label>
            <select name="currency" className="w-full rounded border-stroke" placeholder="">
            <option>Choose currency</option>
            <option value="TSH">TSH</option>
            <option value="USD">USD</option>
             </select>
            </div>
            
            <div>
            <label className="mb-2.5 block font-medium text-black dark:text-white">
             How are you going to invest ?
            </label>
            <select name="investmentType" className="w-full rounded border-stroke" placeholder="">
            <option>Select type of investment</option>
            <option value="equity">Equity</option>
            <option value="debt">Debt</option>
            <option value="mezzanine">Mezzanine</option>

           </select>
            </div>
            <div>
            <label className="mb-2.5 block font-medium text-black dark:text-white">
           When are you ready to start due diligence process ?
            </label>
         <input name="dueDiligenceDate" type="date" className="w-full rounded border-stroke" placeholder="Enter amount"/>
            </div>
         </div>
         <div className="mt-3">
         <label  className="mb-2.5 block font-medium text-black dark:text-white">
             What sort of support would you like to get from Anza ?
            </label>
         <textarea name="helpFromAnza" placeholder="Write description" className="border-stroke w-full rounded"></textarea>

         </div>
         
        
       
     <button type="submit" className="py-2 px-3 mt-4 rounded flex justify-center bg-primary text-white">
         {loading?<Spinner/>:"Send application"}
        
        </button>
       
        </form>
    
    </div>
      
      </div>
 </div>);
}
 
export default Page;