"use client";
import { useContext, useEffect, useState } from "react";

import Loader from "@/components/common/Loader";

// import AccountDetails from "@/app/(dashboard)/(account)/accountDetails"
import { UserContext } from "@/layouts/DashboardLayout";
import CompanyProfile from "../../component/company_profile";
import BusinessInformation from "../../component/business_information";
import BusinessPlan from "../../component/business_plan";
import FinancialInformation from "../../component/financial_information";
import Services from "../../component/services";
import MarketResearch from "../../component/market_research";
import LegalDocumentation from "../../component/legal_documentation";
import EditAccountDetails from "./editAccount/editAccountDetails";
import Breadcrumb from "../../component/Breadcrumb";

const EntrepreneurProfile = () => {
  const [refresh, setRefresh] = useState(0);
  const { userDetails } = useContext(UserContext);
  const [loadingData, setloadingData] = useState(false);
  const [selectedIndex, setselectedIndex] = useState(0);

  const tabs = [
    <EditAccountDetails key={1} />,
    <CompanyProfile key={9} />,
    <BusinessInformation key={2} />,
    <BusinessPlan key={5} business={userDetails.Business} />,
    <FinancialInformation key={4} />,
    <Services key={6} />,
    <MarketResearch key={7} business={userDetails.Business} />,
    <LegalDocumentation key={8} />,
  ];
  return loadingData ? (
    <Loader />
  ) : (
    <div>
      <Breadcrumb
        pageName={"Entrepreneur Profile"}
        prevLink={""}
        prevPage={"Back"}
      />
      <div className="flex space-x-4 ">
        <div className="w-3/12 space-y-0">
          {[
            { title: "Account details", checked: true },
            {
              title: "Company profile",
              checked: userDetails.Business.companyProfile ? true : false,
            },
            { title: "Business informations", checked: true },
            {
              title: "Business plan",
              checked: userDetails.Business.businessPlan ? true : false,
            },
            {
              title: "Financial information",
              checked:
                userDetails.Business.BusinessDocuments.filter(
                  (item) => item.type == "financialInformation"
                ).length > 0,
            },
            {
              title: "Product/service details",
              checked:
                userDetails.Business.BusinessDocuments.filter(
                  (item) => item.type == "service"
                ).length > 0,
            },
            {
              title: "Market Information",
              checked: userDetails.Business.marketResearch ? true : false,
            },
            {
              title: "Legal and Compliance Documents",
              checked:
                userDetails.Business.BusinessDocuments.filter(
                  (item) => item.type == "legalDocumentation"
                ).length > 0,
            },
          ].map((item, index) => {
            return (
              <div
                key={index}
                onClick={() => {
                  setselectedIndex(index);
                }}
                className={` border-l-6 ${
                  index == selectedIndex && "border-l-primary "
                } flex space-x-2 border-stroke items-center cursor-pointer bg-white rounded py-3 px-4`}
              >
                <div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className={`w-6 h-6 ${
                      item.checked ? "text-success" : "text-stroke"
                    }`}
                  >
                    <path
                      fillRule="evenodd"
                      d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>{item.title}</div>
              </div>
            );
          })}
        </div>
        <div className="w-9/12 rounded-lg border  border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          {tabs[selectedIndex]}
        </div>
      </div>
    </div>
  );
};

export default EntrepreneurProfile;
