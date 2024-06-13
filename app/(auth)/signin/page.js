
"use client";

import React, { useContext, useState } from "react";
import Link from "next/link"
import Loader from "@/components/common/Loader";;
import Image from "next/image";

// import login from "../../../controllers/user_controller"
import { Formik } from 'formik';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { Metadata } from "next";
import axios from "axios"
import { server_url } from "@/app/utils/endpoint";
import Spinner from "../../../components/spinner"
import {login, register} from "../../controllers/user_controller"
import { useRouter } from "next/navigation";


const Page = () => {
 const router = useRouter()
  const validationSchema = yup.object().shape({
    email: yup.string().email('Invalid email').required('Email is required'),
    password: yup.string().required('Password is required'),
  });
  const [isLoading, setisLoading] = useState(false);
  const [showPassword, setshowPassword] = useState(false);



  // Handle form submission
  const handleSubmit = (values) => {
    const data = {...values};
        setisLoading(true)
        login(data).then((data)=>{
        
          if(data.status == false){
          toast.error(data.message)
          }else{
            toast.success("Logged in successfully")
            router.push("/")
          }
          setisLoading(false)
        })
  };

  return (
    <>
      <div className="rounded-lg  min-h-screen flex items-center justify-center w-screen bg-slate-800 dark:border-strokedark dark:bg-boxdark">
        <div className="md:w-4/12 w-11/12 py-18">
        <div className="flex justify-center">
              <Image height={100} width={100} alt="" src={"https://anzaentrepreneurs.co.tz/wp-content/uploads/2023/08/cropped-White-Version-300x92.png"}/>

              </div>
              <div className=" bg-white border ring-1 px-10  rounded-lg py-10 mt-8 ">
              
              {/* <span className="mb-1.5 block text-center text-primary font-bold">Sign in to anza </span> */}
              <h2 className="mb-2  text-center font-bold text-black dark:text-white sm:text-title-lg ">
                Sign In to continue
              </h2>
              <p className="text-slate-500 text-center mb-8">Provide your credentials to Sign In</p>
              <Formik
        initialValues={{ email: '', password: '' }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      > 
        {({ handleSubmit, handleChange, values, touched, errors }) => (
  <form onSubmit={handleSubmit} >
  <div className="mb-4">
    <label className="mb-2.5 block font-sm text-black dark:text-white">
      Email
    </label>
    <div className="relative">
      <input
        type="email"
        value={values.email}
        name="email"
        onChange={handleChange}
        // aria-invalid={touched.email && !!errors.email}   
        placeholder="Enter your email"
        className=" form-style"
      />

  
    </div>
    <p className="text-danger">
    {errors.email}
    </p>
  </div>

  <div className="mb-6">
    <label className="mb-2.5 block font-medium text-black dark:text-white">
      Re-type Password
    </label>
    <div className="relative">
      <input
        type={`${showPassword?"text":"password"}`}
        
        value={values.password}
        onChange={handleChange}
        name="password"
        // aria-invalid={touched.password && !!errors.password} 
        placeholder="6+ Characters, 1 Capital letter"
        className={` form-style`}
      />

      <span onClick={()=>setshowPassword(!showPassword)} className="absolute right-4 top-4 cursor-pointer">
      {showPassword?<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      </svg>:<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
      </svg>}
      </span>
    </div>
    <p className=" text-danger pt-3">
    {errors.password}
    </p>
    <div className="flex justify-end py-3">
    <Link href="/forgotPassword" className="italic text-slate-500">
    Forgot password ?
    </Link>
  </div>
    
    
  </div>
  

  <div className="mb-5">
    <button
      type="submit"
      className="w-full cursor-pointer rounded-lg border flex justify-center border-primary bg-primary p-4 text-white transition hover:bg-opacity-90"
    >
      {isLoading?<Spinner/>:"Sign in"}
      
    </button>
  </div>


  <div className="mt-6 text-center">
    <p>
      Don’t have any account?{" "}
      <Link href="/signup" className="text-primary font-bold">
        Sign Up
      </Link>
    </p>
  </div>
</form>
        )}</Formik>
              </div>
              
            
            </div>
          </div>
       
    </>
  );
};

Page.getLayout = function getLayout(page){
  return <div>{page}</div>
}
export default Page;


