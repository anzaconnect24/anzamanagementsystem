"use client";

import React, { useState } from "react";
import Link from "@/utils/link";
import { Formik } from "formik";
import * as yup from "yup";
import toast from "react-hot-toast";
import Spinner from "@/components/spinner";
import { login } from "../../controllers/user_controller";
import { useRouter } from "@/utils/navigation";
import { useTranslation } from "@/locales";
import AuthLayout from "@/layouts/AuthLayout";

const SignInForm = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const validationSchema = yup.object().shape({
    email: yup
      .string()
      .email(t("auth.invalidEmail", "Invalid email"))
      .required(t("auth.emailRequired", "Email is required")),
    password: yup
      .string()
      .required(t("auth.passwordRequired", "Password is required")),
  });
  const [isLoading, setisLoading] = useState(false);
  const [showPassword, setshowPassword] = useState(false);

  // Handle form submission
  const handleSubmit = (values) => {
    const data = { ...values };
    setisLoading(true);
    login(data).then((data) => {
      if (data.status == false) {
        toast.error(data.message);
      } else {
        toast.success(t("auth.loggedInSuccessfully", "Logged in successfully"));
        router.push("/");
      }
      setisLoading(false);
    });
  };

  return (
    <Formik
      initialValues={{ email: "", password: "" }}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      {({ handleSubmit, handleChange, values, touched, errors }) => (
        <form
          onSubmit={handleSubmit}
          className="space-y-6 w-10/12 md:w-6/12 2xl:w-4/12 text-start mx-auto "
        >
          {/* Email Field */}
          <h1 className="text-4xl font-bold">
            {t("auth.signInToContinue", "Sign in to continue")}
          </h1>
          <div className="flex bg-black/20 rounded-lg w-full">
            <div className=" text-center py-2 w-1/2 bg-primary rounded-lg">
              <Link
                href="/auth/signin"
                className="text-white py-2 px-6   hover:text-gray-900"
              >
                {t("common.login", "Login")}
              </Link>
            </div>
            <div className="flex-1 text-center  py-2">
              <Link
                href="/auth/signup"
                className="text-gray-700 hover:text-gray-900"
              >
                {t("auth.register", "Register")}
              </Link>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("auth.email", "Email")} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="email"
                value={values.email}
                name="email"
                onChange={handleChange}
                placeholder={t("auth.enterEmail", "Enter your email")}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("auth.password", "Password")}{" "}
              <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={values.password}
                onChange={handleChange}
                name="password"
                placeholder={t(
                  "auth.passwordHint",
                  "6+ Characters, 1 Capital letter"
                )}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setshowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
                    />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password}</p>
            )}
            <div className="flex justify-end mt-2">
              <Link href="/forgotPassword" className="text-sm text-primary">
                {t("auth.forgotPassword", "Forgot Password ?")}
              </Link>
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-white font-medium py-3 px-4 rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center"
            >
              {isLoading ? <Spinner /> : t("auth.logIn", "Log In")}
            </button>
          </div>
        </form>
      )}
    </Formik>
  );
};

const Page = () => {
  const { t } = useTranslation();

  return <SignInForm />;
};

Page.getLayout = function getLayout(page) {
  return <div>{page}</div>;
};

export default Page;
