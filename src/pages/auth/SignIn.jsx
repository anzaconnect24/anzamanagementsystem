"use client";

import React, { useState } from "react";
import Link from "@/utils/link";
import { Formik } from "formik";
import * as yup from "yup";
import toast from "react-hot-toast";
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

  const handleSubmit = async (values) => {
    setIsLoading(true);
    toast.dismiss();

    try {
      const data = await login(values);
      if (!data.status) {
        toast.error(data?.message || "Unable to sign in", { duration: 3000 });
      } else {
        toast.success("Logged in successfully");

        setTimeout(() => {
          router.push("/");
        }, 1000);
      }
    } catch (error) {
      toast.error("Unable to sign in. Please try again.", { duration: 3000 });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="mb-3 text-center">
        <h1 className="text-3xl font-bold text-[#10198f]">Welcome Back</h1>

        <p className="mt-1 text-gray-500">Sign in to your account</p>
      </div>

      <div className="rounded-2xl bg-white p-6">
        <Formik
          initialValues={{
            email: "",
            password: "",
          }}
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
                  <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-black">
                  Password <span className="text-black">*</span>
                </label>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={values.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-11 text-sm text-black outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#10198f]"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 transition hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {errors.password && touched.password && (
                  <p className="mt-1 text-sm text-red-500">{errors.password}</p>
                )}
              </div>

              <div className="flex justify-end">
                <Link
                  href="/auth/forgot-password"
                  className="text-sm font-normal text-gray-500 transition-colors hover:text-[#082d77]"
                >
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-lg bg-[#10198f] py-2.5 font-medium text-white transition-colors hover:bg-[#0c147a] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </button>
            </form>
          )}
        </Formik>
        
          <p className="mt-3 text-center text-[10px] font-extralight text-gray-400">
            By signing in, you agree to our{" "}
            <Link
              href="/terms"
              className="text-[#082d77] hover:opacity-80"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="text-[#082d77] hover:opacity-80"
            >
              Privacy Policy
            </Link>.
          </p>

        <p className="mt-4 text-center text-sm text-gray-500">
          Don't have an account?{" "}
          <Link
            href="/auth/signup"
            className="font-medium text-[#10198f] hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

const Page = () => {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <SignInForm />
    </main>
  );
};

export default Page;
