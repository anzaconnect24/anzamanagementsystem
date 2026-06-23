"use client";
import { useContext, useState } from "react";

import Loader from "@/components/common/Loader";
import { UserContext } from "@/layouts/DashboardLayout";
import BusinessInformation from "../../component/business_information";
import EditAccountDetails from "./editAccount/editAccountDetails";
import Breadcrumb from "../../component/Breadcrumb";
import UpdateInvestorProfile from "@/component/updateInvestorProfile";
import UpdateMentorProfile from "@/component/updateMentorProfile";

const StartupProfile = () => {
  const { userDetails } = useContext(UserContext);

  const [loadingData] = useState(false);
  const [selectedIndex, setselectedIndex] = useState(0);

  const isMentor = userDetails?.role === "Mentor";
  const isInvestor = userDetails?.role === "Investor";
  const isStartup = !isMentor && !isInvestor;

  // Startups, investors and mentors each get a single, full-width edit
  // form (hero + form card) with no tab sidebar — they edit the same
  // "tell us about your profile" form they filled during sign up;
  // account details (name, email, phone, password) live under Settings.
  const fullWidth = isStartup || isInvestor || isMentor;

  const tabs = isStartup
    ? [<BusinessInformation key={1} />]
    : isInvestor
    ? [<UpdateInvestorProfile key={1} user={userDetails} />]
    : [<UpdateMentorProfile key={1} user={userDetails} />];

  const menuItems = [
    { title: "Account details", checked: true },
    {
      title: isMentor ? "Mentor details" : "Business informations",
      checked: true,
    },
  ];

  return loadingData ? (
    <Loader />
  ) : (
    <div>
      {!fullWidth && (
        <Breadcrumb
          pageName={
            userDetails?.role === "Mentor" ? "Mentor Profile" : "Investor Profile"
          }
          prevLink={""}
          prevPage={"Back"}
        />
      )}

      <div className="flex space-x-4">
        {!fullWidth && (
          <div className="w-3/12 space-y-0">
            {menuItems.map((item, index) => {
              return (
                <div
                  key={index}
                  onClick={() => {
                    setselectedIndex(index);
                  }}
                  className={`border-l-6 ${
                    index === selectedIndex && "border-l-primary"
                  } flex cursor-pointer items-center space-x-2 rounded bg-white px-4 py-3 border-stroke`}
                >
                  <div>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className={`h-6 w-6 ${
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
        )}

        <div
          className={
            fullWidth
              ? "w-full"
              : "w-9/12 rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark"
          }
        >
          {tabs[selectedIndex]}
        </div>
      </div>
    </div>
  );
};

export default StartupProfile;