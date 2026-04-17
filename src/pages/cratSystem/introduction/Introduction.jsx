import React from "react";
import Breadcrumb from "@/component/Breadcrumb";

const IntroductionPage = () => {
  return (
    <div>
      <Breadcrumb pageName="CRAT Introduction" />
      <div className="w-full ">
        <div className="rounded-xl bg-primary px-5 py-6 text-white mb-4">
          <p className="mt-2 text-sm leading-6 text-slate-100 md:text-base">
            The tool seeks to assess the status of target investees on four key
            due diligence domains:{" "}
            <span className="capitalize">
              Market, Financials, Operations,{" "}
              <span className="lowercase">and</span> Legal.
            </span>
          </p>
        </div>
        <div className="bg-white px-1 py-2 md:px-2">
          <div className="mt-6 px-1">
            <h2 className="text-lg font-semibold text-slate-900">
              Assessment Structure
            </h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
              <li className="flex items-start gap-2">
                <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                  ✓
                </span>
                The domains are each subdivided into sub-domains, each focusing
                on one particular area.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                  ✓
                </span>
                Scores are binary: assess whether the company is strong or weak
                on any particular element investigated.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                  ✓
                </span>
                The assessment is organised across four weighted domains:
                Financial (35%), Commercial & Market (25%), Legal & Compliance
                (25%), and Operations (15%).
              </li>
            </ul>
          </div>

          <div className="mt-6 px-1">
            <h2 className="text-lg font-semibold text-slate-900">
              How it Works
            </h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
              <li className="flex items-start gap-2">
                <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                  ✓
                </span>
                Under each domain, you will encounter a set of focused questions
                that probe the depth and maturity of your business in that area.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                  ✓
                </span>
                For each question, you are required to upload the corresponding
                supporting document that evidences your current position.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                  ✓
                </span>
                You are also invited to provide a brief commentary to
                contextualise the materials submitted.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                  ✓
                </span>
                Upon completion, a qualified reviewer will conduct a thorough
                evaluation of all submitted documentation and generate a
                comprehensive Capital Readiness Report.
              </li>
            </ul>
          </div>

          <div className="mt-6  bg-primary/10  p-5 rounded-lg ">
            <p className="text-sm leading-6 text-slate-700">
              The report provides a weighted score across all four domains,
              identifies material gaps in your business, and outlines a
              prioritised path to investment readiness.
            </p>
            <p className="mt-3 text-sm font-semibold text-slate-900">
              A business is considered Investment Ready upon achieving an
              overall weighted score of 70% or above across all four domains.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntroductionPage;
