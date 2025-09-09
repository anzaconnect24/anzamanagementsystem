"use client";
import { useContext, useEffect, useState } from "react";
import { useTranslation } from "@/locales";
import {
  getApprovedBusinesses,
  getInvestorBusinesses,
  getPendingBusinesses,
} from "@/controllers/business_controller";
import { timeAgo } from "@/utils/time_ago";
import Link from "@/utils/link";
import Loader from "@/components/common/Loader";
import { UserContext } from "../../../layouts/DashboardLayout";

import { getReviewerInvestmentRequests } from "@/controllers/investment_requests_controller";
import NoData from "@/component/noData";

const Page = () => {
  const [requests, setRequests] = useState([]);
  const [ShowOptions, setShowOptions] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const { userDetails } = useContext(UserContext);
  const [loading, setloading] = useState(true);
  const { t } = useTranslation();
  useEffect(() => {
    getReviewerInvestmentRequests(1, 5).then((body) => {
      setRequests(body.data);
      setloading(false);
    });
  }, []);
  return loading ? (
    <Loader />
  ) : (
    <div>
      <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="py-6 px-4 md:px-6 xl:px-7.5">
          <h4 className="text-xl font-semibold text-black dark:text-white">
            {t("investment.assignedRequests", "Investment requests")}
          </h4>
        </div>
        {requests.length < 1 ? (
          <NoData />
        ) : (
          <div>
            <div className="grid grid-cols-6 border-t border-stroke py-4.5 px-4 dark:border-strokedark sm:grid-cols-8 md:px-6 2xl:px-7.5">
              <div className="col-span-1 flex items-center">
                <p className="font-medium">{t("users.sent", "Sent")} </p>
              </div>
              <div className="col-span-2 hidden items-center sm:flex">
                <p className="font-medium">
                  {t("users.investorName", "Investor name")}
                </p>
              </div>
              <div className="col-span-2 flex items-center">
                <p className="font-medium">{t("users.phone", "Phone")}</p>
              </div>
              <div className="col-span-2 flex items-center">
                <p className="font-medium">{t("users.email", "Email")}</p>
              </div>
              <div className="col-span-1 flex items-center">
                <p className="font-medium"></p>
              </div>
            </div>

            {requests.map((item, key) => (
              <div
                className="grid grid-cols-6 border-t border-stroke py-4.5 px-4 dark:border-strokedark sm:grid-cols-8 md:px-6 2xl:px-7.5"
                key={key}
              >
                <div className="col-span-1 hidden items-center sm:flex">
                  <p className="text-sm text-black dark:text-white">
                    {timeAgo(item.createdAt)}
                  </p>
                </div>
                <div className="col-span-2 flex items-center">
                  <p className="text-sm text-black dark:text-white">
                    {item.BusinessInvestmentRequest.User.name}
                  </p>
                </div>
                <div className="col-span-2 flex items-center">
                  <p className="text-sm text-black dark:text-white">
                    {item.BusinessInvestmentRequest.User.phone}
                  </p>
                </div>
                <div className="col-span-2 flex items-center">
                  <p className="text-sm text-black dark:text-white">
                    {item.BusinessInvestmentRequest.User.email}
                  </p>
                </div>
                <div className="col-span-1 flex items-center">
                  <div
                    onClick={() => {
                      if (item.uuid == ShowOptions) {
                        setShowOptions("");
                        setSelectedBusiness(item);
                      } else {
                        setShowOptions(item.uuid);
                        setSelectedBusiness(null);
                      }
                    }}
                    className="bg-primary hover:bg-opacity-90 rounded text-white py-2 px-3 cursor-pointer  text-sm relative"
                  >
                    {t("common.options", "Options")}
                    <div
                      className={`absolute z-9 transition-all ${
                        ShowOptions == item.uuid ? " scale-100 " : " scale-0 "
                      } -translate-x-4 bg-white shadow-lg   left-0 w-40 space-y-2 rounded-lg py-2 px-4 top-10`}
                    >
                      {[
                        {
                          title: t("investment.viewRequest", "View request"),
                          path: `/viewInvestmentRequest/${item.uuid}`,
                        },
                        //   {title:"Assign reviewers",path:`/assignInvestmentRequestReviewers/${item.uuid}`}
                      ].map((item) => {
                        return (
                          <div key={item.title}>
                            <Link
                              className="text-black text-base hover:text-primary text-center "
                              href={item.path}
                            >
                              {item.title}
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;
