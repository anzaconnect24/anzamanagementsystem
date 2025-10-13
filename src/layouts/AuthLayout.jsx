"use client";

import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Image from "@/utils/image";
import { useTranslation } from "@/locales";

const AuthLayout = ({ children, title, subtitle }) => {
  const { t } = useTranslation();

  // Carousel state
  const [activeFeature, setActiveFeature] = useState(0);

  // Features data
  const features = [
    {
      title: t("auth.investorsMentors", "Investors & Mentors"),
      description: t(
        "auth.investorsMentorsDesc",
        "Build connections with investors and experienced mentors who can guide you on your entrepreneurial journey."
      ),
    },
    {
      title: t("auth.learningMaterials", "Learning Materials"),
      description: t(
        "auth.learningDescription",
        "Access a rich library of resources, toolkits, and insights designed to help you strengthen your business skills and scale your venture."
      ),
    },
    {
      title: t("auth.cratTool", "Capital Readiness Assessment Tool"),
      description: t(
        "auth.cratToolDesc",
        "Evaluate your Investment Readiness with CRAT and identify the steps you need to take to become investment ready."
      ),
    },
    {
      title: t("auth.programOpportunities", "Program Opportunities"),
      description: t(
        "auth.programOpportunitiesDesc",
        "Discover and apply for tailored programs, accelerators and initiatives that can help you unlock growth."
      ),
    },
  ];

  // Auto-rotate carousel every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [features.length]);

  // Handle dot click
  const handleDotClick = (index) => {
    setActiveFeature(index);
  };

  return (
    <div className="min-h-screen flex">
      <Toaster position="top-right" />

      {/* Left Panel - Blue Welcome Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#424daf] fixed h-screen text-white flex-col justify-between p-12 text-center items-center">
        <div>
          {/* Logo */}

          {/* Welcome Content */}
          <div>
            <h1 className="text-2xl lg:text-4xl font-bold mb-6">
              {t("auth.welcome", "Welcome to Anza Connect")}
            </h1>
            <p className="text-lg text-blue-100 mb-12 leading-relaxed">
              {t(
                "auth.gatewayText",
                "Your gateway to growth, Learning and Investment opportunities"
              )}
            </p>
          </div>
        </div>
        <img className=" h-100" src="/signup-photo.png" />
        {/* Feature Carousel Section */}
        <div className="space-y-1">
          <div className="min-h-[160px] flex flex-col justify-center">
            <div className="transition-all duration-500 ease-in-out">
              <h2 className="text-2xl font-bold mb-2">
                {features[activeFeature].title}
              </h2>
              <p className="text-blue-100 leading-relaxed">
                {features[activeFeature].description}
              </p>
            </div>
          </div>

          {/* Pagination dots */}
          <div className="flex space-x-3 justify-center">
            {features.map((_, index) => (
              <button
                key={index}
                onClick={() => handleDotClick(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 hover:scale-110 ${
                  index === activeFeature
                    ? "bg-white"
                    : index <= activeFeature
                    ? "bg-white/60"
                    : "bg-white/30"
                }`}
                aria-label={`Go to feature ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Form Section */}
      <div className="w-full lg:w-1/2  ms-auto  flex items-center justify-center  ">
        <div className="w-full text-center ">
          {/* Mobile Logo */}
          {/* <div className="lg:hidden flex justify-center mb-8">
            <Image
              height={80}
              width={200}
              alt="Anza Logo"
              src="https://anzaentrepreneurs.co.tz/wp-content/uploads/2023/08/cropped-White-Version-300x92.png"
              className="h-auto"
            />
          </div> */}

          {/* Form Header */}
          {/* <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {title || t("auth.signInToContinue", "Sign In to Continue")}
            </h2>
            {subtitle && <p className="text-gray-600">{subtitle}</p>}
          </div> */}

          {/* Form Content */}
          <div className="  ">{children || <Outlet />}</div>

          {/* Footer Links */}
          {/* <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              {t("auth.termsText", "By continuing, you agree to our")}{" "}
              <a href="#" className="text-blue-600 hover:text-blue-700">
                {t("auth.termsOfService", "Terms of Service")}
              </a>{" "}
              {t("common.and", "and")}{" "}
              <a href="#" className="text-blue-600 hover:text-blue-700">
                {t("auth.privacyPolicy", "Privacy Policy")}
              </a>
            </p>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
