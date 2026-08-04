import React from "react";
import {
  FaChartLine,
  FaBalanceScale,
  FaCogs,
  FaFileAlt,
  FaCheckCircle,
} from "react-icons/fa";

const domainCards = [
  {
    title: "Commercial & Market Domain",
    weight: "25%",
    icon: FaFileAlt,
    tint: "bg-emerald-50 text-emerald-600",
    note: "Market position, customer demand, growth evidence, and competitive advantage.",
  },
  {
    title: "Financial Domain",
    weight: "35%",
    icon: FaChartLine,
    tint: "bg-blue-50 text-blue-600",
    note: "Revenue quality, financial controls, forecasts, and funding readiness.",
  },
  {
    title: "Operations Domain",
    weight: "15%",
    icon: FaCogs,
    tint: "bg-amber-50 text-amber-600",
    note: "Systems, governance, operational resilience, and execution capability.",
  },
  {
    title: "Legal & Compliance Domain",
    weight: "25%",
    icon: FaBalanceScale,
    tint: "bg-violet-50 text-violet-600",
    note: "Corporate records, contracts, regulatory exposure, and compliance posture.",
  },
];

const steps = [
  "Complete focused questions across each readiness domain.",
  "Upload supporting evidence and documentation.",
  "Submit your completed assessment for reviewer evaluation and scoring.",
  "Receive your Capital Readiness results, scores, and tailored recommendations.",
];

const IntroductionPage = () => {
  return (
    <div className="min-h-screen p-4 md:px-6 md:pb-6">
      {/* HERO SECTION */}
      <div className="relative overflow-hidden rounded-[28px] shadow-sm">
        <img
          src="/images/general_resources_hero.svg"
          alt="Capital readiness"
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="absolute inset-0 bg-black/70" />

        <div className="relative z-10 px-5 py-7 lg:px-8 lg:py-10">
          <div className="max-w-3xl">
            <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold tracking-wide text-white backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-[#f08a3c]" />
              Capital Readiness Framework
            </span>

            <h1 className="text-3xl font-bold leading-tight tracking-tight text-white lg:text-5xl">
              Welcome to the Capital Readiness Assessment Tool
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/85 lg:text-base">
              The Capital Readiness Assessment Tool (CRAT) helps startups and
              growth-stage businesses evaluate their preparedness to access
              financing and investment opportunities.
            </p>
          </div>
        </div>
      </div>

      {/* DOMAIN CARDS */}
      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-4">
        {domainCards.map(({ title, weight, icon: Icon, tint, note }) => (
          <div
            key={title}
            className="rounded-2xl border border-[#e8edf5] bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md"
          >
            <div className="mb-4 flex items-center justify-between">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl text-lg ${tint}`}
              >
                <Icon />
              </div>

              <span className="rounded-full bg-[#082d77]/10 px-3 py-1 text-xs font-bold text-[#082d77]">
                {weight}
              </span>
            </div>

            <h3 className="text-base font-semibold text-[#172033]">
              {title}
            </h3>

            <p className="mt-2 text-sm leading-6 text-[#6f6f72]">{note}</p>
          </div>
        ))}
      </div>

      {/* ASSESSMENT MODEL */}
      <div className="mt-6 rounded-[24px] border border-[#e8edf5] bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold tracking-wide text-[#082d77]">
          Assessment Model
        </p>

        <h2 className="mt-2 text-2xl font-bold text-[#172033]">
          Structured, weighted, and evidence-based.
        </h2>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {[
            "Each domain is divided into focused sub-domains aligned to investor due diligence.",
            "Reviewer scoring validates each submission against consistent capital readiness criteria.",
            "Weighted scoring provides visibility into readiness gaps and priority actions.",
          ].map((item) => (
            <div
              key={item}
              className="flex gap-4 rounded-2xl bg-[#f7f9fc] p-5"
            >
              <FaCheckCircle className="mt-1 shrink-0 text-[#082d77]" />

              <p className="text-sm leading-6 text-[#6f6f72]">{item}</p>
            </div>
          ))}
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div className="mt-6 rounded-[24px] border border-[#e8edf5] bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold tracking-wide text-[#082d77]">
          Process
        </p>

        <h2 className="mt-2 text-2xl font-bold text-[#172033]">
          How it works
        </h2>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {steps.map((step, index) => (
            <div
              key={step}
              className="flex gap-4 rounded-2xl bg-[#f7f9fc] p-5"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#082d77]/10 text-sm font-bold text-[#082d77]">
                {index + 1}
              </span>

              <p className="text-sm leading-6 text-[#6f6f72]">{step}</p>
            </div>
          ))}
        </div>
      </div>

      {/* READINESS SECTION */}
      <div className="mt-6 rounded-[24px] border border-[#e8edf5] bg-white p-6 shadow-sm">
        <div>
          <p className="text-xs font-semibold tracking-wide text-[#082d77]">
            Readiness Threshold
          </p>

          <h2 className="mt-2 text-2xl font-bold text-[#172033]">
            Startups scoring above 70% are considered Investment Ready.
          </h2>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#6f6f72]">
            The final report consolidates weighted scoring, highlights
            material business gaps, and recommends priority actions before
            investor engagement.
          </p>
        </div>
      </div>
    </div>
  );
};

export default IntroductionPage;