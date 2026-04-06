import React from "react";
import Breadcrumb from "@/component/Breadcrumb";

const IntroductionPage = () => {
  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6">
      <Breadcrumb pageName="CRAT Introduction" />
      <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm md:p-7">
        <div className="rounded-xl bg-primary to-slate-700 px-5 py-6 text-white">
          <h1 className="text-2xl font-semibold md:text-3xl">
            Welcome to the Capital Readiness Assessment Tool (CRAT)
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-100 md:text-base">
            The tool seeks to assess the status of target investees on four key
            due diligence domains: market, financials, operations, and legal.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-black/10 bg-slate-50 p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-800">
              Assessment Structure
            </h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
              <li>
                The domains are each subdivided into sub-domains, each focusing
                on one particular area.
              </li>
              <li>
                Scores are binary: assess whether the company is strong or weak
                on any particular element investigated.
              </li>
              <li>
                The assessment is organised across four weighted domains:
                Financial (35%), Commercial & Marketing (25%), Legal &
                Compliance (25%), and Operations (15%).
              </li>
            </ul>
          </div>

          <div className="rounded-xl border border-black/10 bg-slate-50 p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-800">
              How It Works
            </h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
              <li>
                Under each domain, you will encounter a set of focused questions
                that probe the depth and maturity of your business in that area.
              </li>
              <li>
                For each question, you are required to upload the corresponding
                supporting document that evidences your current position.
              </li>
              <li>
                You are also invited to provide a brief commentary to
                contextualise the materials submitted.
              </li>
              <li>
                Upon completion, a qualified reviewer will conduct a thorough
                evaluation of all submitted documentation and generate a
                comprehensive Capital Readiness Report.
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm leading-6 text-slate-700">
            The report provides a weighted score across all four domains,
            identifies material gaps in your business, and outlines a
            prioritised path to investment readiness.
          </p>
          <p className="mt-3 text-sm font-semibold text-slate-900">
            A business is considered Investment Ready upon achieving an overall
            weighted score of 70% or above across all four domains.
          </p>
        </div>
      </div>
    </div>
  );
};

export default IntroductionPage;
