"use client";

import React, { useState } from "react";
import Link from "@/utils/link";
import { Formik } from "formik";
import * as yup from "yup";
import toast from "react-hot-toast";
import Spinner from "@/components/spinner";
import { resetPassword } from "../../controllers/user_controller";

const Page = () => {
  const [isLoading, setIsLoading] = useState(false);

  const validationSchema = yup.object().shape({
    email: yup.string().email("Invalid email").required("Email is required"),
  });

  const handleSubmit = (values) => {
    setIsLoading(true);
    toast.dismiss();

    resetPassword(values).then((data) => {
      if (!data.status) {
        toast.error(data.message);
      } else {
        toast.success("We've sent a password reset link to your email");
      }

      setIsLoading(false);
    });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-3 text-center">
          <h1 className="text-3xl font-bold text-[#10198f]">
            Reset Password
          </h1>

          <p className="mt-1 text-gray-500">
            Enter your email and we’ll send you a reset link
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6">
          <Formik
            initialValues={{ email: "" }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ handleSubmit, handleChange, values, errors, touched }) => (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-black">
                    Email <span className="text-black">*</span>
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={values.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-black outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#10198f]"
                  />

                  {errors.email && touched.email && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.email}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full items-center justify-center rounded-lg bg-[#10198f] py-2.5 font-medium text-white transition-colors hover:bg-[#0c147a] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoading ? <Spinner /> : "Send Reset Link"}
                </button>
              </form>
            )}
          </Formik>

          <p className="mt-4 text-center text-sm text-gray-500">
            Remember your password?{" "}
            <Link
              href="/auth/signin"
              className="font-medium text-[#10198f] hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
};

export default Page;