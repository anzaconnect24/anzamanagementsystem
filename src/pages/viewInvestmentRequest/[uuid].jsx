"use client";
import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getInvestmentRequestDetails } from "@/controllers/investment_requests_controller";
import { timeAgo } from "@/utils/time_ago";
import Loader from "@/components/common/Loader";
import { UserContext } from "../../layouts/DashboardLayout";

const ViewInvestmentRequest = () => {
  const router = useRouter();
  const { uuid } = router.query;
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const { userDetails } = useContext(UserContext);

  useEffect(() => {
    if (uuid) {
      getInvestmentRequestDetails(uuid)
        .then((data) => {
          console.log("Investment request details:", data);
          setRequest(data);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching request details:", error);
          setLoading(false);
        });
    }
  }, [uuid]);

  if (loading) {
    return <Loader />;
  }

  if (!request) {
    return (
      <div className="rounded-sm border border-stroke bg-white px-7.5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark">
        <h4 className="text-xl font-semibold text-black dark:text-white">
          Investment Request Not Found
        </h4>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-sm border border-stroke bg-white px-7.5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="flex items-center justify-between">
          <h4 className="text-xl font-semibold text-black dark:text-white">
            Investment Request Details
          </h4>
          <span
            className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
              request.status === "accepted"
                ? "bg-success text-white"
                : request.status === "rejected"
                  ? "bg-danger text-white"
                  : request.status === "waiting"
                    ? "bg-warning text-white"
                    : "bg-bodydark1 text-black"
            }`}
          >
            {request.status}
          </span>
        </div>
      </div>

      {/* Business Information */}
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="border-b border-stroke px-7.5 py-4 dark:border-strokedark">
          <h3 className="font-medium text-black dark:text-white">
            Business Information
          </h3>
        </div>
        <div className="p-7.5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                Business Name
              </label>
              <p className="text-black dark:text-white">
                {request.Business?.name || "N/A"}
              </p>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                Business Sector
              </label>
              <p className="text-black dark:text-white">
                {request.Business?.sector || "N/A"}
              </p>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                Business Location
              </label>
              <p className="text-black dark:text-white">
                {request.Business?.location || "N/A"}
              </p>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                Business Description
              </label>
              <p className="text-black dark:text-white">
                {request.Business?.description || "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Investment Details */}
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="border-b border-stroke px-7.5 py-4 dark:border-strokedark">
          <h3 className="font-medium text-black dark:text-white">
            Investment Details
          </h3>
        </div>
        <div className="p-7.5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                Investment Amount
              </label>
              <p className="text-black dark:text-white">
                {request.currency}{" "}
                {request.investmentAmount?.toLocaleString() || "N/A"}
              </p>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                Investment Type
              </label>
              <p className="text-black dark:text-white capitalize">
                {request.investmentType || "N/A"}
              </p>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                Due Diligence Date
              </label>
              <p className="text-black dark:text-white">
                {request.dueDiligenceDate
                  ? new Date(request.dueDiligenceDate).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                Help From Anza
              </label>
              <p className="text-black dark:text-white">
                {request.helpFromAnza || "N/A"}
              </p>
            </div>
            {request.additionalInfo && (
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                  Additional Information
                </label>
                <p className="text-black dark:text-white">
                  {request.additionalInfo}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Investor Information */}
      {request.investor && (
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="border-b border-stroke px-7.5 py-4 dark:border-strokedark">
            <h3 className="font-medium text-black dark:text-white">
              Investor Information
            </h3>
          </div>
          <div className="p-7.5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                  Name
                </label>
                <p className="text-black dark:text-white">
                  {request.investor.firstName} {request.investor.lastName}
                </p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                  Email
                </label>
                <p className="text-black dark:text-white">
                  {request.investor.email || "N/A"}
                </p>
              </div>
              {request.investor.InvestorProfile && (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                      Investment Range
                    </label>
                    <p className="text-black dark:text-white">
                      {request.investor.InvestorProfile.investmentRange ||
                        "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                      Investment Approach
                    </label>
                    <p className="text-black dark:text-white">
                      {request.investor.InvestorProfile.investmentApproach ||
                        "N/A"}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="border-b border-stroke px-7.5 py-4 dark:border-strokedark">
          <h3 className="font-medium text-black dark:text-white">Timeline</h3>
        </div>
        <div className="p-7.5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                Request Sent
              </label>
              <p className="text-black dark:text-white">
                {new Date(request.createdAt).toLocaleString()} (
                {timeAgo(request.createdAt)})
              </p>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                Last Updated
              </label>
              <p className="text-black dark:text-white">
                {new Date(request.updatedAt).toLocaleString()} (
                {timeAgo(request.updatedAt)})
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center justify-center rounded-md bg-meta-3 py-3 px-6 text-center font-medium text-white hover:bg-meta-3/90"
        >
          Back
        </button>
      </div>
    </div>
  );
};

export default ViewInvestmentRequest;
