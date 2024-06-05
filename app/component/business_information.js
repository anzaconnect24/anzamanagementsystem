import { useContext, useEffect, useState } from "react";
import { getSectors } from "@/app/controllers/sector_controller";
import {getBusiness, updateBusiness} from "@/app/controllers/business_controller"
import { UserContext } from "../(dashboard)/layout";
import Loader from "@/components/common/Loader";
import Spinner from "../../components/spinner"
import {toast} from "react-hot-toast"

const BusinessInformation = () => {
    const [user, setUser] = useState(null);
    const [refresh, setRefresh] = useState(0);
    const [loading, setloading] = useState(false);
    const [sectors, setSectors] = useState([]);
    const [business, setBusiness] = useState(null);
    const {userDetails } = useContext(UserContext)
    const [uploadingDocument, setuploadingDocument] = useState(false);
    const [loadingData, setloadingData] = useState(true);
    const [updatingInvestmentDetails, setupdatingInvestmentDetails] = useState(false);
    const [selectedOption, setselectedOption] = useState(0);
  
    useEffect(() => {
        getSectors().then((data)=>{
            if(data){
              setSectors(data)
            }
          })
    }, []);

    useEffect(() => {
        getBusiness(userDetails.Business.uuid).then((data)=>{
          setBusiness(data)
          setloadingData(false)
        })
  }, [refresh]);
    return ( loadingData?<Loader/>: <div>
        <form onSubmit={(e)=>{
        e.preventDefault()
      const  businessData = {
          name : e.target.businessName.value,
          email : e.target.businessEmail.value,
          phone : e.target.businessPhone.value,
          problem : e.target.problem.value,
          facebook: e.target.facebook.value,
          linkedin : e.target.linkedin.value,
          twitter : e.target.twitter.value,
          instagram : e.target.instagram.value,
          solution : e.target.solution.value,
          traction : e.target.traction.value,
          registration : e.target.registration.value,
          stage : e.target.stage.value,
          business_sector_uuid : e.target.business_sector_uuid.value,
          team : e.target.team.value,
        }
    //    alert("Holla")
       setloading(true)
       updateBusiness(businessData,business.uuid).then((data)=>{
        setRefresh(refresh+1);
        setloading(false)
        toast.success("User details are updated successfully!")
        
       })
    }}>
      <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="py-6 px-4 md:px-6 xl:px-7.5">
        <h4 className="text-xl font-semibold text-black dark:text-white pb-6">
          Business Informations
        </h4>
        <div className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-2 gap-y-2">
                  <div>
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                    Business name
                  </label>
                  <input defaultValue={business.name} required name="businessName" className=" form-style" placeholder="Company name" type="text"/>

                  </div>
                  <div>
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                    Business email adress
                  </label>
                  <input required defaultValue={business.email} name="businessEmail" className="form-style" placeholder="Company email address" type="text"/>

                  </div>
                  <div>
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                    Business phone number
                  </label>
                  <input required defaultValue={business.phone} name="businessPhone" className="form-style" placeholder="Company phone number" type="text"/>

                  </div>
                  <div>
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                     Facebook link
                  </label>
                  <input required defaultValue={business.facebook} name="facebook" className="form-style"  type="text"/>

                  </div>
                  <div>
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                     Instagram link
                  </label>
                  <input required defaultValue={business.instagram} name="instagram" className="form-style" type="text"/>

                  </div>
                  <div>
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                     Twitter link
                  </label>
                  <input required defaultValue={business.twitter} name="twitter" className="form-style" type="text"/>

                  </div>
                  <div>
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                    Linkedin link
                  </label>
                  <input required defaultValue={business.linkedin} name="linkedin" className="form-style" type="text"/>

                  </div>
                  <div>
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                  Number of people in your team
                  </label>
                  <input required defaultValue={business.team} name="team" className="form-style" placeholder="Enter number of team members" type="text"/>
                  </div>
                  <div>
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                    Registration status
                  </label>
                  <select defaultValue={business.registration} required name="registration" className="form-style">
                    <option>Registration status</option>
                    <option value="Registered with BRELA">Registered with BRELA</option>
                    <option value="Registered with TIN only">Registered with TIN only</option>
                    <option value="Have BRELA and TIN">Have BRELA and TIN</option>
                  </select>
                            </div>
                  
                  <div>
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                    Business sector
                  </label>
                  <select defaultValue={business.BusinessSector.uuid} required name="business_sector_uuid" className="form-style">
                    <option>Select business sector</option>
                    {sectors.map((item)=>{
                    return  <option key={item.id} value={item.uuid}>{item.name}</option>
                    })}
                  </select>
                  </div>
                  <div>
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                    Business stage
                  </label>
                  <select defaultValue={business.stage} required name="stage" className="form-style">
                  <option>Select business stage</option>
                    <option value="Startup">Startup</option>
                    <option value="Growth stage">Growth stage</option>
                    <option value="Expansion stage">Expansion stage</option>
                    <option value="Maturity stage">Maturity stage</option>
                  </select>
                  </div>
                  
                  
                
                
                </div>
                <div>
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                  What problems does your business solve ?
                  </label>
                  <textarea defaultValue={business.problem} name="problem" className="form-style" placeholder="What problem does your business solve ?"></textarea>
                  </div>
                  <div>
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                  What solution does your business provide ?
                  </label>
                  <textarea defaultValue={business.solution} name="solution" className="form-style" placeholder="What solution does your business provide ?"></textarea>
                  </div>
                  <div>
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                  What is your commercial traction ? (Number of paying customers or revenue per year)
                  </label>
                  <textarea defaultValue={business.traction} name="traction" className="form-style" placeholder="What is your commecial traction ?" />
                  </div>
                </div>
        <div className="flex pt-8">
        <button type="submit" className="py-3 px-4 flex justify-center bg-primary cursor-pointer text-white rounded hover:opacity-95">
           <div>{loading?<Spinner/>:"Update details"}</div>
            </button>

        </div>
      </div>
     
    
    </div>
       
       
    </form>
    <div className="rounded-lg border mt-10 border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="py-6 px-4 md:px-6 xl:px-7.5">
        <h4 className="text-xl font-semibold text-black dark:text-white pb-6">
          About investment
        </h4>
        <form onSubmit={(e)=>{
           e.preventDefault()
          
           const data = {
            lookingForInvestment:e.target.lookingForInvestment.checked,
            investmentAmount:e.target.investmentAmount.value,
            investmentCurrency:e.target.investmentCurrency.value
           };
          setupdatingInvestmentDetails(true)
          updateBusiness(data,business.uuid).then((data)=>{
            setRefresh(refresh+1);
            setupdatingInvestmentDetails(false);
            toast.success("Updated successfully!")
           })
        }} className="grid grid-cols-4 gap-x-4 items-end">
          <div>
          <label className="mb-2.5 block font-medium text-black dark:text-white">
              Are you looking an investment ?
                  </label>
            <input name="lookingForInvestment" defaultChecked={business.lookingForInvestment} className="h-10 w-10 rounded " type="checkbox"/>
          </div>
          <div>
          <label className="mb-2.5 block font-medium text-black dark:text-white">
              Amount you need ?
                  </label>
          <input required name="investmentAmount" defaultValue={business.investmentAmount} type="number" className="border-stroke w-full rounded" placeholder="Amount"/> 
          </div>
          <div>
          <label className="mb-2.5 block font-medium text-black dark:text-white">
              Select currency
          </label>
          <select required name="investmentCurrency" defaultValue={business.investmentCurrency} type="number" className="border-stroke w-full rounded" >
            <option>Select currency</option>
            <option value="TSH">TSH</option>
            <option value="USD">USD</option>
          </select>
          </div>
          <div>
          <button type="submit" className="py-3 px-4 flex justify-center bg-primary cursor-pointer text-white rounded hover:opacity-95">
            <div>{updatingInvestmentDetails?<Spinner/>:"Update"}</div>
          </button>
          </div>
        </form>
        
        
      </div>
    </div>
      
    </div> );
}
 
export default BusinessInformation;