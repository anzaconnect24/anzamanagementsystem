
"use client";

import React, { useContext, useState } from "react";
import Link from "next/link";
import Image from "next/image";

// import login from "../../../controllers/user_controller"
import { Formik } from 'formik';
import * as yup from 'yup';
import toast from 'react-hot-toast';

import Spinner from "../../../components/spinner"
import {login, register, resetPassword} from "../../controllers/user_controller"
import { useRouter } from "next/navigation";


const Page = () => {
 const router = useRouter()
  const validationSchema = yup.object().shape({
    email: yup.string().email('Invalid email').required('Email is required'),
    // password: yup.string().required('Password is required'),
  });
  const [isLoading, setisLoading] = useState(false);


  // Handle form submission
  const handleSubmit = (values) => {
    const data = {...values};
        setisLoading(true)
        resetPassword(data).then((data)=>{
        
          if(data.status == false){
          toast.error(data.message)
          }else{
            toast.success("We`ve sent you the link to your email to reset your password")
          }
          setisLoading(false)
        })
  };

  return (
    <>
      <div className="rounded-sm border h-screen items-center border-stroke bg-bodydark1 min-w-screen dark:border-strokedark dark:bg-boxdark">
        <div className="flex flex-wrap">
         
          <div className="w-full mx-auto  xl:w-1/2  ">
            <div className="w-full p-4 sm:p-12.5 xl:p-17.5">
              <div className="shadow-2xl px-8 py-10 ring-1 bg-white ring-stroke rounded-lg">
              <div className="flex justify-center">
              <Image height={100} width={100} src={"/anza.png"}/>

              </div>
              {/* <span className="mb-1.5 block text-center text-primary font-bold">Forgot password ?</span> */}
              <h2 className="mb-9 text-2xl text-center font-bold text-black dark:text-white sm:text-title-xl2">
                Get password reset link
              </h2>
              <Formik
        initialValues={{ email: ''}}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      > 
        {({ handleSubmit, handleChange, values, touched, errors }) => (
  <form onSubmit={handleSubmit} >
  <div className="mb-4">
    <label className="mb-2.5 block font-medium text-black dark:text-white">
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
        className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
      />

      <span className="absolute right-4 top-4">
        <svg
          className="fill-current"
          width="22"
          height="22"
          viewBox="0 0 22 22"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g opacity="0.5">
            <path
              d="M19.2516 3.30005H2.75156C1.58281 3.30005 0.585938 4.26255 0.585938 5.46567V16.6032C0.585938 17.7719 1.54844 18.7688 2.75156 18.7688H19.2516C20.4203 18.7688 21.4172 17.8063 21.4172 16.6032V5.4313C21.4172 4.26255 20.4203 3.30005 19.2516 3.30005ZM19.2516 4.84692C19.2859 4.84692 19.3203 4.84692 19.3547 4.84692L11.0016 10.2094L2.64844 4.84692C2.68281 4.84692 2.71719 4.84692 2.75156 4.84692H19.2516ZM19.2516 17.1532H2.75156C2.40781 17.1532 2.13281 16.8782 2.13281 16.5344V6.35942L10.1766 11.5157C10.4172 11.6875 10.6922 11.7563 10.9672 11.7563C11.2422 11.7563 11.5172 11.6875 11.7578 11.5157L19.8016 6.35942V16.5688C19.8703 16.9125 19.5953 17.1532 19.2516 17.1532Z"
              fill=""
            />
          </g>
        </svg>
      </span>
    </div>
    <p className="text-danger">
    {errors.email}
    </p>
  </div>

 
  <div className="mb-5">
    <button
      type="submit"
      className="w-full cursor-pointer rounded-lg border flex justify-center border-primary bg-primary p-4 text-white transition hover:bg-opacity-90"
    >
      {isLoading?<Spinner/>:"Send request"}
      
    </button>
  </div>


  <div className="mt-6 text-center">
    <p>
     <div className="flex justify-center space-x-2">I will do it later ?  <Link href="/signin" className="text-primary font-bold">
        Go back
      </Link></div>
     
    </p>
  </div>
</form>
        )}</Formik>
              </div>
             
            
            </div>
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


