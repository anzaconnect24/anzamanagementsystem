"use client";
import { useContext, useEffect, useState } from "react";
import { timeAgo } from "@/utils/time_ago";
import Loader from "@/components/common/Loader";
import { UserContext } from "../../../layouts/DashboardLayout";
import { getMyInvestmentRequests } from "@/controllers/investment_requests_controller";
import NoData from "@/component/noData";

const Page = () => {
  const [requests, setRequests] = useState([]);
  const { userDetails } = useContext(UserContext);
  const [loading, setloading] = useState(true);

  useEffect(() => {
    getMyInvestmentRequests(1, 10)
      .then((body) => {
        console.log("Investment requests response:", body);
        setRequests(body?.data || []);
        setloading(false);
      })
      .catch((error) => {
        console.error("Error fetching investment requests:", error);
        setRequests([]);
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
            Investment Requests
          </h4>
        </div>
        {requests.length < 1 ? (
          <NoData />
        ) : (
          <div>
            <div className="grid grid-cols-12 border-t border-stroke py-4.5 px-4 dark:border-strokedark md:px-6 2xl:px-7.5">
              <div className="col-span-2 flex items-center">
                <p className="font-medium">Sent</p>
              </div>
              <div className="col-span-2 flex items-center">
                <p className="font-medium">Business</p>
              </div>
              {/* <div className="col-span-2 flex items-center">
                <p className="font-medium">Investor</p>
              </div> */}
              <div className="col-span-2 flex items-center">
                <p className="font-medium">Amount</p>
              </div>
              <div className="col-span-2 flex items-center">
                <p className="font-medium">Type</p>
              </div>
              <div className="col-span-2 flex items-center">
                <p className="font-medium">Due Diligence</p>
              </div>
              {/* <div className="col-span-2 flex items-center">
                <p className="font-medium">Help Needed</p>
              </div> */}
              <div className="col-span-1 flex items-center">
                <p className="font-medium">Status</p>
              </div>
            </div>

            {requests.map((item, key) => (
              <div
                className="grid grid-cols-12 border-t border-stroke py-4.5 px-4 dark:border-strokedark md:px-6 2xl:px-7.5 hover:bg-gray-2 dark:hover:bg-meta-4 cursor-pointer"
                key={key}
                onClick={() => {
                  window.location.href = `/dashboard/viewInvestmentRequest/${item.uuid}`;
                }}
              >
                <div className="col-span-2 flex items-center">
                  <p className="text-sm text-black dark:text-white">
                    {timeAgo(item.createdAt)}
                  </p>
                </div>
                <div className="col-span-2 flex items-center">
                  <p className="text-sm text-black dark:text-white">
                    {item.Business?.name || "N/A"}
                  </p>
                </div>
                {/* <div className="col-span-2 flex items-center">
                  <p className="text-sm text-black dark:text-white">
                    {item.investor?.firstName || "N/A"}{" "}
                    {item.investor?.lastName || ""}
                  </p>
                </div> */}
                <div className="col-span-2 flex items-center">
                  <p className="text-sm text-black dark:text-white">
                    {item.currency}{" "}
                    {item.investmentAmount?.toLocaleString() || "N/A"}
                  </p>
                </div>
                <div className="col-span-2 flex items-center">
                  <p className="text-sm text-black dark:text-white capitalize">
                    {item.investmentType || "N/A"}
                  </p>
                </div>
                <div className="col-span-2 flex items-center">
                  <p className="text-sm text-black dark:text-white">
                    {item.dueDiligenceDate
                      ? new Date(item.dueDiligenceDate).toLocaleDateString()
                      : "Not set"}
                  </p>
                </div>
                {/* <div className="col-span-2 flex items-center">
                  <p className="text-sm text-black dark:text-white truncate">
                    {item.helpFromAnza || "None"}
                  </p>
                </div> */}
                <div className="col-span-1 flex items-center">
                  <p
                    className={`text-xs dark:text-white py-1.5 px-2 rounded-full text-center ${
                      item.status == "accepted"
                        ? "bg-success text-white"
                        : item.status == "rejected"
                          ? "bg-danger text-white"
                          : "bg-bodydark1 text-black"
                    }`}
                  >
                    {item.status}
                  </p>
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
