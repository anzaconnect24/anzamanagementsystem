"use client";

import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useTranslation } from "@/locales";

const AuthLayout = ({ children }) => {
  const { t } = useTranslation();

  const [activeFeature, setActiveFeature] =
    useState(0);

  const features = [
    {
      title: "Anza Connect",

      description:
        "Manage your business, track performance, and scale with ease using Anza Connect.",
    },

    {
      title: t(
        "auth.investorsMentors",
        "Investors & Mentors"
      ),

      description: t(
        "auth.investorsMentorsDesc",
        "Build connections with investors and experienced mentors who can guide you on your entrepreneurial journey."
      ),
    },

    {
      title: t(
        "auth.learningMaterials",
        "Learning Materials"
      ),

      description:
        "Access resources, toolkits, and insights designed to help you strengthen your business skills.",
    },

    {
      title: t(
        "auth.programOpportunities",
        "Program Opportunities"
      ),

      description: t(
        "auth.programOpportunitiesDesc",
        "Discover and apply for tailored programs, accelerators, and initiatives that can help you unlock growth."
      ),
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature(
        (prev) =>
          (prev + 1) % features.length
      );
    }, 4000);

    return () => clearInterval(interval);
  }, [features.length]);

  const active =
    features[activeFeature];

  return (
    <div className="flex min-h-screen bg-white">
      <Toaster position="top-right" />

      {/* LEFT PANEL */}
      <div
        className="fixed hidden h-screen w-1/2 overflow-hidden bg-cover bg-center lg:block"
        style={{
          backgroundImage:
            "url('/images/business-class-hero.svg')",
        }}
      >
        {/* OVERLAYS */}
        <div className="absolute inset-0 bg-black/50" />

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        {/* CONTENT */}
        <div className="relative z-10 flex h-full flex-col justify-end px-16 pb-16 text-white">
          {/* DYNAMIC CONTENT */}
          <div
            key={activeFeature}
            className="transition-all duration-500 ease-in-out"
          >
            <h1 className="max-w-2xl text-3xl font-bold leading-snug tracking-tight lg:text-4xl">
              {active.title}
            </h1>

            <p className="mt-6 max-w-xl text-lg font-light leading-relaxed text-white/90 lg:text-xl">
              {active.description}
            </p>
          </div>

          {/* SLIDER DOTS */}
          <div className="mt-10 flex items-center gap-3">
            {features.map(
              (_, index) => (
                <button
                  key={index}
                  onClick={() =>
                    setActiveFeature(
                      index
                    )
                  }
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index ===
                    activeFeature
                      ? "w-24 bg-white"
                      : "w-10 bg-white/40 hover:bg-white/70"
                  }`}
                  aria-label={`Go to slide ${
                    index + 1
                  }`}
                />
              )
            )}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="ml-auto flex min-h-screen w-full items-center justify-center px-6 py-10 lg:w-1/2">
        <div className="w-full max-w-md">
          {children || <Outlet />}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;