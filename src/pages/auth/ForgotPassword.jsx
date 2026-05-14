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

    resetPassword(values).then((data) => {
      if (!data.status) {
        toast.error(data.message);
      } else {
        toast.success(
          "We've sent a password reset link to your email"
        );
      }

      setIsLoading(false);
    });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4">
      <Formik
        initialValues={{ email: "" }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ handleSubmit, handleChange, values, errors }) => (
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-[420px] text-left"
          >
            <div className="space-y-6">
              {/* Header */}
              <div className="space-y-2 text-center">
                <h1 className="text-3xl font-semibold text-blue-600 dark:text-blue-400">
                  Reset Password
                </h1>
                <p className="text-sm text-gray-500">
                  Enter your email and we’ll send you a reset link
                </p>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-800">
                  Email
                </label>

                <input
                  type="email"
                  name="email"
                  value={values.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  className="h-12 w-full rounded-md border border-gray-200 px-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />

                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email}</p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="flex h-12 w-full items-center justify-center rounded-md bg-blue-600 font-semibold text-white hover:bg-blue-700 disabled:opacity-70"
              >
                {isLoading ? <Spinner /> : "Send Reset Link"}
              </button>

              {/* Back to sign in */}
              <div className="text-center text-sm text-gray-600">
                Remember your password?
              </div>

              <Link
                href="/signin"
                className="flex h-12 w-full items-center justify-center rounded-md border border-blue-600 bg-white text-sm font-medium text-blue-600 hover:bg-blue-50"
              >
                Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </Formik>
    </main>
  );
};

export default Page;