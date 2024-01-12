"use client"
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

import { Metadata } from "next";
import toast from "react-hot-toast";
import { login, register } from "@/app/controllers/user_controller";
import { createBusiness } from "@/app/controllers/business_controller";
import { getSectors } from "@/app/controllers/sector_controller";
import {createInvestorProfile} from "@/app/controllers/investor_profile_controller"

import { redirect,useRouter } from "next/navigation";
import Spinner from "@/components/spinner";

// export const metadata: Metadata = {
//   title: "Signup Page | Next.js E-commerce Dashboard Template",
//   description: "This is Signup page for TailAdmin Next.js",
//   // other metadata
// };
const SignUp = () => {
const [role, setRole] = useState("");
const [sectors, setSectors] = useState([]);
const router = useRouter()
const [loading, setloading] = useState(false);

useEffect(() => {
  getSectors().then((data)=>{
    if(data){
      setSectors(data)
    }
  })
}, []);
  return (
    <div className="bg-white min-h-screen">
      <form onSubmit={(e)=>{
        e.preventDefault()
        setloading(true)
          const userData = {
              name : e.target.userName.value,
              email: e.target.userEmail.value,
              phone: e.target.userPhone.value,
              role: e.target.role.value,
              password: e.target.password.value,
          }
          let businessData;
          if(role == "Enterprenuer"){
             businessData = {
              name : e.target.businessName.value,
              email : e.target.businessEmail.value,
              phone : e.target.businessPhone.value,
              problem : e.target.problem.value,
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
                    if(data.status){
                      if(role == "Enterprenuer"){
                        createBusiness(businessData).then((data)=>{
                      router.push("/signin")
                      setloading(false)

                        })
                      }
                      else if(role == "Investor"){
                        setTimeout(()=>{
                          createInvestorProfile(investorData).then((data)=>{
                            router.push("/signin")
                      setloading(false)

                             })
                        },3000)
                      
                      }
                      else{
                      router.push("/signin")
                      setloading(false)

                      }
                    }
                  })
          }
          else{
            toast.error("Passwords don't match")
          }
      }} className=" w-11/12 md:w-6/12 mx-auto py-12 ">
        <span className="mb-1.5 block text-center text-primary font-bold">Register to anza </span>
        <div className="text-4xl font-bold text-black pb-2 text-center">Create Anza account</div>
        <div>
        <div className=" text-2xl text-black pt-8 pb-4">Personal details</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-2 gap-y-2">
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
          <div className="flex space-x-4 items-center ">
            {["Enterprenuer","Investor","Staff"].map((item)=>
              <div key={item} className="flex items-center space-x-2">
              <input required name="role" value={item} onChange={(e)=>{
                
                    setRole(e.target.value);
              }}   type="radio"/>
              <div>{item}</div>
              </div>
            )}
        
          </div>
          
          </div>
          <div>
          <label className="mb-2.5 block font-medium text-black dark:text-white">
            Create password
          </label>
          <input name="password"  required className="form-style" placeholder="Enter password" type="password"/>

          </div>
          <div>
          <label className="mb-2.5 block font-medium text-black dark:text-white">
            Repeat password
          </label>
          <input name="repeatPassword" required className="form-style" placeholder="Repeat password" type="password"/>

          </div>


          <div>
          
        </div>
        </div>

        </div>
        <div>
          {role == "Enterprenuer" &&<div>
          <div className=" text-2xl text-black pt-8 pb-4">Company details</div>
        <div className="space-y-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-2 gap-y-2">
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
          <div className=" text-2xl text-black pt-8 pb-4">Investor profile</div>
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
            <option value="Registered with BRELA">Equity</option>
            <option value="Registered with TIN only">Dept</option>
            <option value="Have BRELA and TIN">Mezanine</option>
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
       
      </form>
    </div>
  );
};

export default SignUp;
