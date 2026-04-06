import React from "react";

const IntroductionPage = () => {
  const domains = [
    {
      name: "Financial",
      weight: "35%",
      description:
        "Evaluates financial records, controls, and evidence of sustainable performance.",
    },
    {
      name: "Commercial & Marketing",
      weight: "25%",
      description:
        "Assesses market traction, customer strategy, and commercial positioning.",
    },
    {
      name: "Legal & Compliance",
      weight: "25%",
      description:
        "Reviews legal structure, compliance documentation, and governance readiness.",
    },
    {
      name: "Operations",
      weight: "15%",
      description:
        "Measures operational systems, delivery capacity, and execution consistency.",
    },
  ];

  const processSteps = [
    "Under each domain, you will encounter a set of focused questions that probe the depth and maturity of your business in that area.",
    "For each question, you are required to upload the corresponding supporting document that evidences your current position.",
    "You are also invited to provide a brief commentary to contextualise the materials submitted.",
    "Upon completion, a qualified reviewer will conduct a thorough evaluation of all submitted documentation and generate a comprehensive Capital Readiness Report.",
  ];

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-stroke bg-gradient-to-br from-white to-blue-50/80 p-5 shadow-default dark:border-strokedark dark:from-boxdark dark:to-boxdark-2 md:p-7">
        <h4 className="text-2xl font-semibold text-black dark:text-white">
          Welcome to the Capital Readiness Assessment Tool (CRAT)
        </h4>
        <p className="mt-3 text-base leading-relaxed text-black/90 dark:text-white/90">
          CRAT is a structured due diligence framework designed to evaluate your
          business against the standards applied by professional investors
          during the capital raising process.
        </p>
      </section>

      <section className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="border-b border-stroke px-5 py-4 dark:border-strokedark md:px-7">
          <h5 className="text-lg font-semibold text-black dark:text-white">
            Weighted Assessment Domains
          </h5>
          <p className="mt-1 text-sm text-black/70 dark:text-white/70">
            The assessment is organised across four weighted domains.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 md:p-7">
          {domains.map((domain) => (
            <div
              key={domain.name}
              className="rounded-md border border-stroke bg-gray-50 p-4 dark:border-strokedark dark:bg-boxdark-2"
            >
              <div className="flex items-start justify-between gap-3">
                <h6 className="text-sm font-semibold text-black dark:text-white">
                  {domain.name}
                </h6>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                  {domain.weight}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-black/70 dark:text-white/70">
                {domain.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="border-b border-stroke px-5 py-4 dark:border-strokedark md:px-7">
          <h5 className="text-lg font-semibold text-black dark:text-white">
            Assessment Submission Flow
          </h5>
        </div>

        <div className="space-y-3 p-5 md:p-7">
          {processSteps.map((step, index) => (
            <div
              key={step}
              className="flex items-start gap-3 rounded-md border border-stroke p-3 dark:border-strokedark"
            >
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
                {index + 1}
              </div>
              <p className="text-sm leading-relaxed text-black/85 dark:text-white/85">
                {step}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-black/10 bg-primary/5 p-5 shadow-default dark:border-strokedark dark:bg-primary/10 md:p-7">
        <p className="text-sm leading-relaxed text-black/90 dark:text-white/90">
          The report provides a weighted score across all four domains,
          identifies material gaps in your business, and outlines a prioritised
          path to investment readiness.
        </p>

        <div className="mt-4 rounded-md border border-black/10 bg-white p-4 dark:border-strokedark dark:bg-boxdark">
          <p className="text-sm font-medium text-primary">
            Investment Readiness Threshold
          </p>
          <p className="mt-1 text-base font-semibold text-black dark:text-white">
            A business is considered Investment Ready upon achieving an overall
            weighted score of 70% or above across all four domains.
          </p>
        </div>
      </section>
    </div>
  );
};

export default IntroductionPage;
