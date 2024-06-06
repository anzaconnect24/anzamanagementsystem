"use client"
import React, { useEffect, useState } from "react";
import Link from "next/link"
import Loader from "@/components/common/Loader";;
import Image from "next/image";

import { Metadata } from "next";
import toast from "react-hot-toast";
import { login, register } from "@/app/controllers/user_controller";
import { createBusiness } from "@/app/controllers/business_controller";
import { getSectors } from "@/app/controllers/sector_controller";
import {createInvestorProfile} from "@/app/controllers/investor_profile_controller"

import { redirect,useRouter } from "next/navigation";
import Spinner from "@/components/spinner";
import { createNotification } from "@/app/controllers/notification_controller";


// export const metadata: Metadata = {
//   title: "Signup Page | Next.js E-commerce Dashboard Template",
//   description: "This is Signup page for TailAdmin Next.js",
//   // other metadata
// };
const SignUp = () => {
const [role, setRole] = useState("");
const router = useRouter()
const [loading, setloading] = useState(false);
const [sectors, setSectors] = useState([]);
const [showPassword, setshowPassword] = useState(false);
const [showPassword2, setshowPassword2] = useState(false);
const [file, setfile] = useState(null);

const [isAlumni, setisAlumni] = useState(false);
  useEffect(() => {
  getSectors().then((data)=>{
    if(data){
      setSectors(data)
    }
  })
}, []);
  return (
    <div className=" bg-bodydark1 min-h-screen flex items-center">
      <form onSubmit={(e)=>{
        e.preventDefault()
        setloading(true)
          const userData = {
              name : e.target.userName.value,
              file: e.target.file.files[0],
              email: e.target.userEmail.value,
              phone: e.target.userPhone.value,
              role: e.target.role.value,
              password: e.target.password.value,
          }
          let businessData;
          if(role == "Enterprenuer"){
             businessData = {
              name : e.target.businessName.value,
              sdg:e.target.sdg.value,
              email : e.target.businessEmail.value,
              phone : e.target.businessPhone.value,
              problem : e.target.problem.value,
              isAlumni: isAlumni,
              completedProgram:e.target.completedProgram.value,
              solution : e.target.solution.value,
              traction : e.target.traction.value,
              registration : e.target.registration.value,
              stage : e.target.stage.value,
              business_sector_uuid : e.target.business_sector_uuid.value,
              team : e.target.team.value,
            }
  

          }
          let investorData;
          if(role == "Investor"){
            investorData= {
              role:e.target.investorRole.value,
              company:e.target.investorCompany.value,
              sector:e.target.investorSector.value,
              ticketSize:e.target.investorTicketSize.value,
              geography:e.target.investorGeography.value,
              structure:e.target.investorStructure.value
            }
          }
          if(e.target.password.value == e.target.repeatPassword.value){
                  register(userData).then((data)=>{
                    if(data.status == true){
                      createNotification({
                        message:`${userData.name} has joined as ${userData.role}`,
                        for:"Admin"
                      })
                     
                      if(role == "Enterprenuer"){
                        createNotification({
                          message:`${userData.name} has joined as ${userData.role}, waiting for confirmation`,
                          for:"Reviewer"
                        })
                        createBusiness(businessData).then((data)=>{
                      router.push("/confirmEmail")
                      setloading(false)

                        })
                      }
                      else if(role == "Investor"){
                        setTimeout(()=>{
                          createInvestorProfile(investorData).then((data)=>{
                            router.push("/confirmEmail")
                      setloading(false)

                             })
                        },3000)
                      
                      }
                      else{
                      router.push("/confirmEmail")
                      setloading(false)

                      }
                    }
                    else{
                      toast.error(data.message)
                      setloading(false)
                    }
                  })
          }
          else{
            toast.error("Passwords don't match")
            setloading(false)

          }
              }} className=" w-11/12 md:w-5/12  mx-auto py-12 ">
                <div className="px-8 bg-white  hover:shadow py-10 border border-black border-opacity-25 rounded-lg  ring-1 ring-stroke ">
                <div className="flex justify-center">
                      <Image height={100} width={100} alt="" src={"/anza.png"}/>

                      </div>
                {/* <span className="mb-1.5 block text-center text-primary font-bold">Register to anza </span> */}
                <div className="text-4xl font-bold text-black pb-10 text-center">Create Anza account</div>
                <div>
                {/* <div className=" text-2xl text-black pt-8 pb-4">Personal details</div> */}
                <div className="flex justify-center ">
                  <label for="file">
                    {file != null ? <Image width={1000} height={1000} alt="" className="h-16 w-16 object-cover rounded-full" src={URL.createObjectURL(file)}/>:<div className="h-16 w-16 rounded-full flex justify-center items-center bg-opacity-10 bg-primary ">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                    </svg>
                    </div>}
                  </label>
                  <input required onChange={(e)=>{
                    setfile(e.target.files[0])
                  }} name="file" type="file" className="sr-only" id="file"/>
                </div>
                <div className="grid grid-cols-1 mt-3 md:grid-cols-2 gap-x-2 gap-y-2">
                <div>
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                    Full name
                  </label>
                  <input name="userName" required className=" form-style" placeholder="Username" type="text"/>

                  </div>
                  <div>
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                    Email address
                  </label>
                  <input name="userEmail" required className="form-style" placeholder="Email address" type="email"/>

                  </div>
                  <div>
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                    Phone number
                  </label>
                  <input name="userPhone" required className="form-style" placeholder="Phone number" type="tel"/>

                  </div>
                  <div>
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                    Registering as
                  </label>
                  {/* <div>Register as</div> */}
                  <div className="flex flex-col  space-y-2  ">
                    {["Enterprenuer","Investor","Staff"].map((item)=>
                      <div key={item} className="flex items-center space-x-2">
                      <input required name="role" value={item=="Staff"?"Reviewer":item} onChange={(e)=>{
                            setRole(e.target.value);
                      }} type="radio"/>
                      <div>{item}</div>
                      </div>
                    )}
                

                  </div>
                  
                  </div>
                  <div>
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                    Create password
                  </label>
                  <div className="relative">
                  <input
                    type={`${showPassword?"text":"password"}`}
                    name="password"
                    // aria-invalid={touched.password && !!errors.password} 
                    placeholder="Enter password"
                    className={`w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary`}
                  />

                  <span onClick={()=>setshowPassword(!showPassword)} className="absolute right-4 top-4 cursor-pointer">
                  {showPassword?<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>:<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>}
                  </span>
                </div>

                  </div>
                  <div>
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                    Re-enter password
                  </label>
                  <div className="relative">
                  <input
                    type={`${showPassword2?"text":"password"}`}
                    name="repeatPassword"
                    // aria-invalid={touched.password && !!errors.password} 
                    placeholder="Re-enter password"
                    className={`w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary`}
                  />

                  <span onClick={()=>setshowPassword2(!showPassword2)} className="absolute right-4 top-4 cursor-pointer">
                  {showPassword2?<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>:<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>}
                  </span>
                </div>

                  </div>


                  <div>
                  
                </div>
                </div>

                </div>
                <div>
                  {role == "Enterprenuer" &&<div>
                  {/* <div className=" text-2xl text-black pt-8 pb-4">Company details</div> */}
                <div className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-2 gap-y-2">
                <div>
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                    Select Sustainable Development Goals
                  </label>
                  <select onChange={(e)=>{
                    // alert(e.target.value)
                       setisAlumni(e.target.value == "true"?true:false)
                  }} required name="sdg" className="form-style">
                    { [
    "No Poverty",
    "Zero Hunger",
    "Good Health and Well-being",
    "Quality Education",
    "Gender Equality",
    "Clean Water and Sanitation",
    "Affordable and Clean Energy",
    "Decent Work and Economic Growth",
    "Industry, Innovation, and Infrastructure",
    "Reduced Inequalities",
    "Sustainable Cities and Communities",
    "Responsible Consumption and Production",
    "Climate Action",
    "Life Below Water",
    "Life on Land",
    "Peace, Justice, and Strong Institutions",
    "Partnerships for the Goals"
].map((item,index)=> <option key={index} value={item}>{item}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                    Are you an Anza alumni ?
                  </label>
                  <select onChange={(e)=>{
                    // alert(e.target.value)
                       setisAlumni(e.target.value == "true"?true:false)
                  }} required name="isAlumni" className="form-style">
                    <option value={false}>No</option>
                    <option value={true}>Yes</option>
                  </select>
                </div>
                      {
                         isAlumni && 
                         <div>
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                    What program did you complete ?
                  </label>
                  <select required name="completedProgram" className="form-style">
                    <option>Select program</option>
                    <option value="BFA">BFA</option>
                    <option value="IR program">IR program</option>
                  </select>
                            </div>
                      }

                            
                  <div>
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                    Business name
                  </label>
                  <input required name="businessName" className=" form-style" placeholder="Company name" type="text"/>

                  </div>
                  <div>
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                    Business email adress
                  </label>
                  <input required name="businessEmail" className="form-style" placeholder="Company email address" type="text"/>

                  </div>
                  <div>
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                    Business phone number
                  </label>
                  <input required name="businessPhone" className="form-style" placeholder="Company phone number" type="text"/>

                  </div>
                  <div>
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                  Number of people in your team
                  </label>
                  <input required name="team" className="form-style" placeholder="Enter number of team members" type="text"/>
                  </div>
                  <div>
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                    Registration status
                  </label>
                  <select required name="registration" className="form-style">
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
                  <select required name="business_sector_uuid" className="form-style">
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
                  <select required name="stage" className="form-style">
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
                  <textarea name="problem" className="form-style" placeholder="What problem does your business solve ?"></textarea>

                  </div>
                  <div>
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                  What solution does your business provide ?
                  </label>
                  <textarea name="solution" className="form-style" placeholder="What solution does your business provide ?"></textarea>

                  </div>
                  <div>
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                  What is your commercial traction ? (Number of paying customers or revenue per year)
                  </label>
                  <textarea name="traction" className="form-style" placeholder="What is your commecial traction ?" />

                  </div>
                </div>
                  </div>
                  }

                  {role == "Investor" &&<div>
                  {/* <div className=" text-2xl text-black pt-8 pb-4">Investor profile</div> */}
                <div className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-2 gap-y-2">
                  <div>
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                    Company name (optional)
                  </label>
                  <input  name="investorCompany" className=" form-style" placeholder="Company name" type="text"/>

                  </div>
                  <div>
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                    Role/title
                  </label>
                  <input required name="investorRole" className="form-style" placeholder="Enter your role/title" type="text"/>

                  </div>
                  <div>
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                    Current address
                  </label>
                  <input required name="investorGeography" className="form-style" placeholder="Write your address" type="text"/>
                  </div>
                  <div>
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                    Avarage ticket size
                  </label>
                  <input required name="investorTicketSize" className="form-style" placeholder="Tell us your avarage ticket size" type="text"/>

                  </div>
                  
                  <div>
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                    Structures
                  </label>
                  <select required name="investorStructure" className="form-style">
                    <option>Select structure</option>
                    <option value="equity">Equity</option>
                    <option value="dept">Dept</option>
                    <option value="mezzanine">Mezzanine</option>
                  </select>
                            </div>
                  
                  <div>
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                    Business sector
                  </label>
                  <select required name="investorSector" className="form-style">
                    <option>Select business sector</option>
                    {sectors.map((item)=>{
                    return  <option key={item.id} value={item.uuid}>{item.name}</option>
                    })}
                  </select>
                  </div>
                
                </div>
                </div>
                  </div>
                  }
                </div>
                <div className="  flex justify-center py-4 ">
                <button
                  type="submit"
                  className="w-full cursor-pointer rounded-lg border flex justify-center border-primary bg-primary p-4 text-white transition hover:bg-opacity-90">
                  {loading?<Spinner/>:"Submit details for review"}
                </button>
                </div>
                <div className="mt-0 text-center">
            <p>
              Already registered ?{" "}
              <Link href="/signin" className="text-primary font-bold">
                Sign in
              </Link>
            </p>
          </div>
                </div>
        
       
      </form>
    </div>
  );
};

export default SignUp;
