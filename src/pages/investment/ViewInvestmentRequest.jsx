"use client";
import { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getInvestmentRequestDetails } from "@/controllers/investment_requests_controller";
import Loader from "@/components/common/Loader";
import Link from "@/utils/link";
import { UserContext } from "@/layouts/DashboardLayout";
import { HiOutlineArrowLeft } from "react-icons/hi";
import { RiMoneyDollarCircleLine } from "react-icons/ri";
import { BiUser, BiEnvelope, BiPhone, BiBriefcase } from "react-icons/bi";
import { useTranslation } from "@/locales";

const ViewInvestmentRequest = () => {
  const { t } = useTranslation();
  const { uuid } = useParams();
  const { userDetails } = useContext(UserContext);
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequestDetails();
  }, [uuid]);

  const fetchRequestDetails = async () => {
    setLoading(true);
    try {
      const data = await getInvestmentRequestDetails(uuid);
      console.log("Investment request details:", data);
      setRequest(data);
    } catch (error) {
      console.error("Error fetching request details:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  if (!request) {
    return (
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6">
        <p className="text-center text-black dark:text-white">
          Investment request not found
        </p>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "accepted":
        return "bg-success text-white";
      case "rejected":
        return "bg-danger text-white";
      case "waiting":
        return "bg-warning text-white";
      default:
        return "bg-bodydark1 text-black";
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/dashboard/myInvestmentRequests"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-stroke bg-white hover:bg-gray-2 dark:border-strokedark dark:bg-boxdark"
        >
          <HiOutlineArrowLeft className="text-xl text-black dark:text-white" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-black dark:text-white">
            Investment Request Details
          </h2>
          <p className="text-sm text-bodydark">
            View complete information about this investment request
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Status and Basic Info Card */}
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="border-b border-stroke px-6 py-4 dark:border-strokedark">
            <h3 className="font-semibold text-black dark:text-white">
              Request Status
            </h3>
          </div>
          <div className="p-6">
            <div className="mb-6 flex items-center gap-3">
              <span
                className={`inline-flex rounded-full px-4 py-2 text-sm font-medium ${getStatusColor(request.status)}`}
              >
                {request.status?.toUpperCase() || "PENDING"}
              </span>
              <span className="text-sm text-bodydark">
                Created {new Date(request.createdAt).toLocaleDateString()}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-bodydark">Request ID</p>
                <p className="font-medium text-black dark:text-white">
                  {request.uuid}
                </p>
              </div>
              <div>
                <p className="text-sm text-bodydark">Last Updated</p>
                <p className="font-medium text-black dark:text-white">
                  {new Date(request.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Investment Details Card */}
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="border-b border-stroke px-6 py-4 dark:border-strokedark">
            <h3 className="font-semibold text-black dark:text-white flex items-center gap-2">
              <RiMoneyDollarCircleLine className="text-xl" />
              Investment Details
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-sm text-bodydark">Investment Amount</p>
                <p className="text-2xl font-bold text-primary">
                  {request.currency}{" "}
                  {request.investmentAmount?.toLocaleString() || "0"}
                </p>
              </div>
              <div>
                <p className="mb-2 text-sm text-bodydark">Investment Type</p>
                <p className="text-lg font-semibold text-black dark:text-white capitalize">
                  {request.investmentType || "N/A"}
                </p>
              </div>
              <div>
                <p className="mb-2 text-sm text-bodydark">Due Diligence Date</p>
                <p className="font-medium text-black dark:text-white">
                  {request.dueDiligenceDate
                    ? new Date(request.dueDiligenceDate).toLocaleDateString()
                    : "Not set"}
                </p>
              </div>
              <div>
                <p className="mb-2 text-sm text-bodydark">Help from Anza</p>
                <p className="font-medium text-black dark:text-white">
                  {request.helpFromAnza || "N/A"}
                </p>
              </div>
            </div>

            {request.additionalInfo && (
              <div className="mt-6">
                <p className="mb-2 text-sm text-bodydark">
                  Additional Information
                </p>
                <p className="rounded-lg bg-gray-2 p-4 text-black dark:bg-meta-4 dark:text-white">
                  {request.additionalInfo}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Business Information Card */}
        {request.Business && (
          <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke px-6 py-4 dark:border-strokedark">
              <h3 className="font-semibold text-black dark:text-white flex items-center gap-2">
                <BiBriefcase className="text-xl" />
                Business Information
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-bodydark">Business Name</p>
                  <p className="font-medium text-black dark:text-white">
                    {request.Business.name || "N/A"}
                  </p>
                </div>
                {request.Business.sector && (
                  <div>
                    <p className="text-sm text-bodydark">Sector</p>
                    <p className="font-medium text-black dark:text-white">
                      {request.Business.sector}
                    </p>
                  </div>
                )}
                {request.Business.description && (
                  <div className="col-span-full">
                    <p className="mb-2 text-sm text-bodydark">Description</p>
                    <p className="rounded-lg bg-gray-2 p-4 text-black dark:bg-meta-4 dark:text-white">
                      {request.Business.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Investor Information Card */}
        {request.investor && (
          <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke px-6 py-4 dark:border-strokedark">
              <h3 className="font-semibold text-black dark:text-white flex items-center gap-2">
                <BiUser className="text-xl" />
                Investor Information
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-bodydark">Name</p>
                  <p className="font-medium text-black dark:text-white">
                    {request.investor.firstName} {request.investor.lastName}
                  </p>
                </div>
                {request.investor.email && (
                  <div>
                    <p className="text-sm text-bodydark flex items-center gap-1">
                      <BiEnvelope /> Email
                    </p>
                    <p className="font-medium text-black dark:text-white">
                      {request.investor.email}
                    </p>
                  </div>
                )}
                {request.investor.phoneNumber && (
                  <div>
                    <p className="text-sm text-bodydark flex items-center gap-1">
                      <BiPhone /> Phone
                    </p>
                    <p className="font-medium text-black dark:text-white">
                      {request.investor.phoneNumber}
                    </p>
                  </div>
                )}
                {request.investor.InvestorProfile && (
                  <>
                    {request.investor.InvestorProfile.investmentRange && (
                      <div>
                        <p className="text-sm text-bodydark">
                          Investment Range
                        </p>
                        <p className="font-medium text-black dark:text-white">
                          {request.investor.InvestorProfile.investmentRange}
                        </p>
                      </div>
                    )}
                    {request.investor.InvestorProfile.sectors && (
                      <div className="col-span-full">
                        <p className="mb-2 text-sm text-bodydark">
                          Investment Sectors
                        </p>
                        <p className="font-medium text-black dark:text-white">
                          {request.investor.InvestorProfile.sectors}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Documents Card (if any) */}
        {request.BusinessInvestmentRequestDocuments &&
          request.BusinessInvestmentRequestDocuments.length > 0 && (
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              <div className="border-b border-stroke px-6 py-4 dark:border-strokedark">
                <h3 className="font-semibold text-black dark:text-white">
                  Attached Documents
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-2">
                  {request.BusinessInvestmentRequestDocuments.map(
                    (doc, index) => (
                      <a
                        key={index}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-lg border border-stroke p-3 hover:bg-gray-2 dark:border-strokedark dark:hover:bg-meta-4"
                      >
                        <span className="text-primary">📄</span>
                        <span className="text-black dark:text-white">
                          {doc.name || `Document ${index + 1}`}
                        </span>
                      </a>
                    ),
                  )}
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default ViewInvestmentRequest;
