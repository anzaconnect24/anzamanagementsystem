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
          <h6 className="mt-2">The tool seeks to assess the status of the target investees on four key due diligence domains of market, financials, operations and legal</h6>
        </div>
        <hr className="border-stroke dark:border-strokedark" />
      </div>

      <div className="mt-4 rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="py-6 px-4 md:px-6 xl:px-7.5">
          <h4 className="text-xl font-semibold text-black dark:text-white">
            Things to be consider
          </h4>
        </div>
        <hr className="border-stroke dark:border-strokedark" />
        <div className="px-4 py-2 space-y-6"> {/* Added space-y-4 for spacing between checkboxes */}
          <CheckboxTwo id="checkbox1" label="The businesses will be supplied with due delligence checklist to organise the required docs in a google folder then share a google link to the folder" clickable={false} defaultChecked={true} />
          <CheckboxTwo id="checkbox2" label="You will do the assessment based on the supplied documents and interview with the business owners/top leaders" clickable={false} defaultChecked={true} />
          <CheckboxTwo id="checkbox3" label="The domains are each subdivided into sub-domains, each focusing on one particular area" clickable={false} defaultChecked={true} />
          <CheckboxTwo id="checkbox4" label="Scores are binary i.e. assess whether the company is strong or weak on any particular element investigated" clickable={false} defaultChecked={true} />
          <CheckboxTwo id="checkbox5" label="The highest score is 2 and the lowest is 0; you shall score 2 if it's a 'YES' on any particular element, 1 if it's a 'MAYBE/SOMEWHAT' and 0 if it's a 'NO/NOTHING'" clickable={false} defaultChecked={true} />
          <CheckboxTwo id="checkbox6" label="The number of sub-domains and thus rules for the same might increase or decrease depending on the nature of the business under assessment" clickable={false} defaultChecked={true} />
          <CheckboxTwo id="checkbox7" label="For elements where a document can be made available as evidence, objectivity should be exercised and the converse" clickable={false} defaultChecked={true} />
          <CheckboxTwo id="checkbox8" label="If an element is not relevant for assessing the business, it can be deleted" clickable={false} defaultChecked={true} />
          <CheckboxTwo id="checkbox9" label="The 'Scores & Readiness Test Tab' contains formulas and should not be edited. The subsequent tabs are editable" clickable={false} defaultChecked={true} />
        </div>
      </div>
    </div>
  );
};

export default Page;
