"use client";
import { useContext, useEffect, useState } from "react";
import { UserContext } from "@/layouts/DashboardLayout";
import { useTranslation } from "@/locales";
import Loader from "@/components/common/Loader";
import NoData from "@/component/noData";
import { timeAgo } from "@/utils/time_ago";
import {
  getInterestedInvestors,
  acceptInvestorInterest,
  rejectInvestorInterest,
} from "@/controllers/investment_application_controller";
import { toast } from "react-hot-toast";

const InterestedInvestors = () => {
  const { t } = useTranslation();
  const { userDetails } = useContext(UserContext);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("all");

  useEffect(() => {
    fetchInterestedInvestors();
  }, [selectedStatus]);

  const fetchInterestedInvestors = async () => {
    setLoading(true);
    try {
      const status = selectedStatus === "all" ? "" : selectedStatus;
      console.log("Fetching interested investors with status:", status);
      const data = await getInterestedInvestors(1, 100, status);
      console.log("Received data:", data);
      console.log("Applications count:", data?.data?.length);
      setApplications(data?.data || []);
    } catch (error) {
      console.error("Error fetching interested investors:", error);
      toast.error("Failed to fetch interested investors");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (uuid) => {
    setActionLoading(uuid);
    try {
      await acceptInvestorInterest(uuid);
      toast.success("Investment application approved successfully!");
      fetchInterestedInvestors();
    } catch (error) {
      console.error("Error accepting application:", error);
      toast.error("Failed to approve application");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (uuid) => {
    setActionLoading(uuid);
    try {
      await rejectInvestorInterest(uuid);
      toast.success("Investment application rejected");
      fetchInterestedInvestors();
    } catch (error) {
      console.error("Error rejecting application:", error);
      toast.error("Failed to reject application");
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "accepted":
        return "bg-success text-white";
      case "rejected":
        return "bg-danger text-white";
      case "waiting":
        return "bg-warning text-white";
      case "in-progress":
        return "bg-primary text-white";
      case "completed":
        return "bg-success text-white";
      default:
        return "bg-bodydark1 text-black";
    }
  };

  const stats = {
    total: applications.length,
    waiting: applications.filter((app) => app.status === "waiting").length,
    accepted: applications.filter((app) => app.status === "accepted").length,
    rejected: applications.filter((app) => app.status === "rejected").length,
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-black dark:text-white">
          {t("navigation.interestedInvestors", "Interested Investors")}
        </h2>
        <p className="text-sm text-bodydark dark:text-bodydark1 mt-1">
          Manage investors who have shown interest in your business
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div
          className={`rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark cursor-pointer ${
            selectedStatus === "all" ? "ring-2 ring-primary" : ""
          }`}
          onClick={() => setSelectedStatus("all")}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-bodydark dark:text-bodydark1">
                Total Applications
              </p>
              <h4 className="text-2xl font-bold text-black dark:text-white mt-1">
                {stats.total}
              </h4>
            </div>
          </div>
        </div>

        <div
          className={`rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark cursor-pointer ${
            selectedStatus === "waiting" ? "ring-2 ring-warning" : ""
          }`}
          onClick={() => setSelectedStatus("waiting")}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-bodydark dark:text-bodydark1">
                Pending Review
              </p>
              <h4 className="text-2xl font-bold text-warning mt-1">
                {stats.waiting}
              </h4>
            </div>
          </div>
        </div>

        <div
          className={`rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark cursor-pointer ${
            selectedStatus === "accepted" ? "ring-2 ring-success" : ""
          }`}
          onClick={() => setSelectedStatus("accepted")}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-bodydark dark:text-bodydark1">
                Accepted
              </p>
              <h4 className="text-2xl font-bold text-success mt-1">
                {stats.accepted}
              </h4>
            </div>
          </div>
        </div>

        <div
          className={`rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark cursor-pointer ${
            selectedStatus === "rejected" ? "ring-2 ring-danger" : ""
          }`}
          onClick={() => setSelectedStatus("rejected")}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-bodydark dark:text-bodydark1">
                Rejected
              </p>
              <h4 className="text-2xl font-bold text-danger mt-1">
                {stats.rejected}
              </h4>
            </div>
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="py-6 px-4 md:px-6 xl:px-7.5">
          <h4 className="text-xl font-semibold text-black dark:text-white">
            Investment Applications
            {selectedStatus !== "all" && (
              <span className="ml-2 text-sm font-normal text-bodydark capitalize">
                ({selectedStatus})
              </span>
            )}
          </h4>
          {stats.interested === 0 && selectedStatus === "all" && (
            <p className="mt-2 text-sm text-bodydark dark:text-bodydark1">
              No pending investor interest requests at the moment. When
              investors show interest in your investment applications, they will
              appear here for your review.
            </p>
          )}
        </div>

        {applications.length === 0 ? (
          <NoData />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-2 text-left dark:bg-meta-4">
                  <th className="py-4 px-4 font-medium text-black dark:text-white xl:pl-11">
                    Investor
                  </th>
                  <th className="py-4 px-4 font-medium text-black dark:text-white">
                    Amount
                  </th>
                  <th className="py-4 px-4 font-medium text-black dark:text-white">
                    Business
                  </th>
                  <th className="py-4 px-4 font-medium text-black dark:text-white">
                    Type
                  </th>
                  <th className="py-4 px-4 font-medium text-black dark:text-white">
                    Status
                  </th>
                  <th className="py-4 px-4 font-medium text-black dark:text-white">
                    Date
                  </th>
                  <th className="py-4 px-4 font-medium text-black dark:text-white">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {applications.map((application) => (
                  <tr
                    key={application.uuid}
                    className="border-b border-stroke dark:border-strokedark"
                  >
                    <td className="py-5 px-4 pl-9 xl:pl-11">
                      <div>
                        <p className="text-sm font-medium text-black dark:text-white">
                          {application.investor?.name}
                        </p>
                        <p className="text-xs text-bodydark dark:text-bodydark1">
                          {application.investor?.email}
                        </p>
                      </div>
                    </td>
                    <td className="py-5 px-4">
                      <p className="text-sm text-black dark:text-white">
                        {application.currency}{" "}
                        {application.investmentAmount?.toLocaleString() ||
                          "N/A"}
                      </p>
                    </td>
                    <td className="py-5 px-4">
                      <p className="text-sm text-black dark:text-white">
                        {application.Business?.name || "N/A"}
                      </p>
                    </td>
                    <td className="py-5 px-4">
                      <p className="text-sm text-black dark:text-white line-clamp-2">
                        {application.investmentType || "N/A"}
                      </p>
                    </td>
                    <td className="py-5 px-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
                          application.status,
                        )}`}
                      >
                        {application.status}
                      </span>
                    </td>
                    <td className="py-5 px-4">
                      <p className="text-sm text-black dark:text-white">
                        {timeAgo(application.createdAt)}
                      </p>
                    </td>
                    <td className="py-5 px-4">
                      {application.status === "waiting" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAccept(application.uuid)}
                            disabled={actionLoading === application.uuid}
                            className="inline-flex items-center justify-center rounded-md bg-success py-2 px-4 text-center font-medium text-white hover:bg-opacity-90 disabled:opacity-50"
                          >
                            {actionLoading === application.uuid
                              ? "..."
                              : "Accept"}
                          </button>
                          <button
                            onClick={() => handleReject(application.uuid)}
                            disabled={actionLoading === application.uuid}
                            className="inline-flex items-center justify-center rounded-md bg-danger py-2 px-4 text-center font-medium text-white hover:bg-opacity-90 disabled:opacity-50"
                          >
                            {actionLoading === application.uuid
                              ? "..."
                              : "Reject"}
                          </button>
                        </div>
                      )}
                      {application.status === "accepted" && (
                        <span className="text-sm text-success">Accepted</span>
                      )}
                      {application.status === "rejected" && (
                        <span className="text-sm text-danger">Rejected</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterestedInvestors;
