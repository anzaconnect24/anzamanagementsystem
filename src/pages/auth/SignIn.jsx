"use client";

import React, { useState } from "react";
import Link from "@/utils/link";
import { Formik } from "formik";
import * as yup from "yup";
import toast from "react-hot-toast";
import Spinner from "@/components/spinner";
import { login } from "../../controllers/user_controller";
import { useRouter } from "@/utils/navigation";
import { Eye, EyeOff } from "lucide-react";

const SignInForm = () => {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validationSchema = yup.object().shape({
    email: yup.string().email("Invalid email").required("Email is required"),
    password: yup.string().required("Password is required"),
  });

  const handleSubmit = (values) => {
    setIsLoading(true);
    toast.dismiss();

    login(values).then((data) => {
      if (!data.status) {
        toast.error(data.message, {
          duration: 3000,
        });
      } else {
        toast.success("Logged in successfully", {
          duration: 3000,
        });

        router.push("/");
      }

      setIsLoading(false);
    });
  };

  return (
    <Formik
      initialValues={{ email: "", password: "" }}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      {({ handleSubmit, handleChange, values, errors }) => (
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-[420px] text-left"
        >
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-semibold text-blue-600 dark:text-blue-400">
                Welcome Back
              </h1>
              <p className="text-sm text-gray-500">
                Sign in to your account to continue
              </p>
            </div>

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

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-800">
                  Password
                </label>

                <Link
                  href="/forgotPassword"
                  className="text-sm text-blue-600 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={values.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="h-12 w-full rounded-md border border-gray-200 px-4 pr-12 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {errors.password && (
                <p className="text-sm text-red-500">{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex h-12 w-full items-center justify-center rounded-md bg-blue-600 font-semibold text-white hover:bg-blue-700 disabled:opacity-70"
            >
              {isLoading ? <Spinner /> : "Sign In"}
            </button>

            <div className="text-center text-sm text-gray-600">
              Don&apos;t have an account?
            </div>

            <Link
              href="/auth/signup"
              className="flex h-12 w-full items-center justify-center rounded-md border border-blue-600 bg-white text-sm font-medium text-blue-600 hover:bg-blue-50"
            >
              Sign Up
            </Link>
          </div>
        </form>
      )}
    </Formik>
  );
};

const Page = () => {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4">
      <SignInForm />
    </main>
  );
};

export default Page;