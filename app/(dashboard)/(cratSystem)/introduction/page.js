"use client";
import CheckboxTwo from "@/components/Checkboxes/CheckboxTwo";

const Page = () => {
  return (
    <div>
      <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="py-6 px-4 md:px-6 xl:px-7.5">
          <h4 className="text-xl font-semibold text-black dark:text-white">
            Capital Readiness Assessment Tool (CRAT)
          </h4>
          <h6 className="mt-2">
          This tool seeks to assess the status of  investee on four key due diligence domains of market, financials, operations and legal            </h6>
        </div>
        <hr className="border-stroke dark:border-strokedark" />
      </div>

      <div className="mt-4 rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="py-6 px-4 md:px-6 xl:px-7.5">
          <h4 className="text-xl font-semibold text-black dark:text-white">
            Things to be considered
          </h4>
        </div>
        <hr className="border-stroke dark:border-strokedark" />
        <div className="px-4 py-2 space-y-6"> {/* Added space-y-6 for spacing between checkboxes */}
  <CheckboxTwo id="checkbox1" label="Each domain is divided into sub-domains, with each sub-domain focusing on a specific theme or area." clickable={false} defaultChecked={true} />
  <CheckboxTwo id="checkbox2" label="The scoring system is linear, ranging from 0 to 2, corresponding to the following categories: 'NO' (0), 'MAYBE' (1), and 'YES' (2)." clickable={false} defaultChecked={true} />
  <CheckboxTwo id="checkbox3" label="The maximum score for any element is 2 if a 'YES' response is provided when there is an attached supporting document, 1 for 'MAYBE' and 0 for 'NO.'" clickable={false} defaultChecked={true} />
  <CheckboxTwo id="checkbox4" label="The number of sub-domains and assessment criteria may vary based on the nature of the business." clickable={false} defaultChecked={true} />
  <CheckboxTwo id="checkbox5" label="A business is considered 'Ready' if it achieves a minimum readiness score of 70%." clickable={false} defaultChecked={true} />
</div>

      </div>
    </div>
  );
};

export default Page;
