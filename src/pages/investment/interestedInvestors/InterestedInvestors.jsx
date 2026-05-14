"use client";

import { useContext, useEffect, useState } from "react";

import { UserContext } from "@/layouts/DashboardLayout";
import { useTranslation } from "@/locales";

import Loader from "@/components/common/Loader";
import NoData from "@/component/noData";
import Image from "@/utils/image";

import { timeAgo } from "@/utils/time_ago";

import {
  getInterestedInvestors,
  acceptInvestorInterest,
  rejectInvestorInterest,
} from "@/controllers/investment_application_controller";

import { toast } from "react-hot-toast";

import {
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaMoneyBillWave,
  FaChartLine,
  FaUserTie,
} from "react-icons/fa";

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
      const status =
        selectedStatus === "all"
          ? ""
          : selectedStatus;

      const data =
        await getInterestedInvestors(
          1,
          100,
          status
        );

      setApplications(data?.data || []);
    } catch (error) {
      console.error(error);

      toast.error(
        "Failed to fetch interested investors"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (uuid) => {
    setActionLoading(uuid);

    try {
      await acceptInvestorInterest(uuid);

      toast.success(
        "Investment application approved successfully!"
      );

      fetchInterestedInvestors();
    } catch (error) {
      console.error(error);

      toast.error(
        "Failed to approve application"
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (uuid) => {
    setActionLoading(uuid);

    try {
      await rejectInvestorInterest(uuid);

      toast.success(
        "Investment application rejected"
      );

      fetchInterestedInvestors();
    } catch (error) {
      console.error(error);

      toast.error(
        "Failed to reject application"
      );
    } finally {
      setActionLoading(null);
    }
  };

  const stats = {
    total: applications.length,

    waiting: applications.filter(
      (app) => app.status === "waiting"
    ).length,

    accepted: applications.filter(
      (app) => app.status === "accepted"
    ).length,

    rejected: applications.filter(
      (app) => app.status === "rejected"
    ).length,
  };

  const getStatusBadge = (status) => {
    const styles = {
      waiting:
        "bg-yellow-100 text-yellow-800",

      accepted:
        "bg-green-100 text-green-700",

      rejected:
        "bg-red-100 text-red-700",
    };

    return (
      <span
        className={`rounded-full px-3 py-1 text-xs font-semibold ${
          styles[status] ||
          "bg-gray-100 text-gray-700"
        }`}
      >
        {status?.charAt(0).toUpperCase() +
          status?.slice(1)}
      </span>
    );
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] px-6 py-6">
      <div className="mx-auto max-w-7xl">
        {/* HERO */}
        <section className="relative mb-8 overflow-hidden rounded-3xl border border-[#EAECF0] bg-black shadow-sm">
          <div className="absolute inset-0">
            <Image
              src="/images/general_resources_hero.svg"
              alt="Interested investors"
              width={1600}
              height={900}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/20" />

          <div className="relative z-10 flex min-h-[320px] max-w-3xl flex-col justify-center p-8 lg:p-12">
            <span className="mb-6 inline-flex w-fit items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
              <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
              Interested Investors
            </span>

            <h1 className="mb-4 text-4xl font-bold leading-tight text-white md:text-4xl">
              Manage Investor Interest
            </h1>

            <p className="mb-8 max-w-2xl text-base leading-8 text-white/85 md:text-lg">
              Review investor requests,
              approve investment
              opportunities, and manage
              funding conversations from one
              place.
            </p>

            <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-white/90">
              <span className="flex items-center gap-2">
                <FaUserTie />
                {applications.length} Investors
              </span>

              <span className="flex items-center gap-2">
                <FaCheckCircle />
                {stats.accepted} Approved
              </span>

              <span className="flex items-center gap-2">
                <FaChartLine />
                Investment Tracking
              </span>
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-4">
          <div
            onClick={() =>
              setSelectedStatus("all")
            }
            className={`relative cursor-pointer rounded-2xl border bg-white p-5 shadow-sm transition ${
              selectedStatus === "all"
                ? "border-[#2563EB]"
                : "border-[#EAECF0]"
            }`}
          >
            <FaMoneyBillWave className="absolute right-5 top-5 text-xl text-[#2563EB]" />

            <h3 className="text-3xl font-bold text-[#101828]">
              {stats.total}
            </h3>

            <p className="mt-2 text-sm font-medium text-[#667085]">
              Total Applications
            </p>
          </div>

          <div
            onClick={() =>
              setSelectedStatus("waiting")
            }
            className={`relative cursor-pointer rounded-2xl border bg-white p-5 shadow-sm transition ${
              selectedStatus === "waiting"
                ? "border-yellow-500"
                : "border-[#EAECF0]"
            }`}
          >
            <FaClock className="absolute right-5 top-5 text-xl text-yellow-500" />

            <h3 className="text-3xl font-bold text-[#101828]">
              {stats.waiting}
            </h3>

            <p className="mt-2 text-sm font-medium text-[#667085]">
              Pending Review
            </p>
          </div>

          <div
            onClick={() =>
              setSelectedStatus("accepted")
            }
            className={`relative cursor-pointer rounded-2xl border bg-white p-5 shadow-sm transition ${
              selectedStatus ===
              "accepted"
                ? "border-green-500"
                : "border-[#EAECF0]"
            }`}
          >
            <FaCheckCircle className="absolute right-5 top-5 text-xl text-green-500" />

            <h3 className="text-3xl font-bold text-[#101828]">
              {stats.accepted}
            </h3>

            <p className="mt-2 text-sm font-medium text-[#667085]">
              Accepted
            </p>
          </div>

          <div
            onClick={() =>
              setSelectedStatus("rejected")
            }
            className={`relative cursor-pointer rounded-2xl border bg-white p-5 shadow-sm transition ${
              selectedStatus ===
              "rejected"
                ? "border-red-500"
                : "border-[#EAECF0]"
            }`}
          >
            <FaTimesCircle className="absolute right-5 top-5 text-xl text-red-500" />

            <h3 className="text-3xl font-bold text-[#101828]">
              {stats.rejected}
            </h3>

            <p className="mt-2 text-sm font-medium text-[#667085]">
              Rejected
            </p>
          </div>
        </section>

        {/* APPLICATIONS */}
        {applications.length === 0 ? (
          <NoData />
        ) : (
          <div className="overflow-hidden rounded-3xl border border-[#EAECF0] bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#EAECF0]">
                <thead className="bg-[#F9FAFB]">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-[#667085]">
                      Investor
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-[#667085]">
                      Business
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-[#667085]">
                      Investment
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-[#667085]">
                      Type
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-[#667085]">
                      Status
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-[#667085]">
                      Date
                    </th>

                    <th className="px-6 py-4 text-right text-xs font-semibold tracking-wider text-[#667085]">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#EAECF0] bg-white">
                  {applications.map(
                    (application) => (
                      <tr
                        key={
                          application.uuid
                        }
                        className="transition hover:bg-[#F9FAFB]"
                      >
                        {/* Investor */}
                        <td className="whitespace-nowrap px-6 py-5">
                          <div>
                            <h4 className="text-sm font-semibold text-[#101828]">
                              {application
                                ?.investor
                                ?.name ||
                                application
                                  ?.Investor
                                  ?.name ||
                                application
                                  ?.user
                                  ?.name ||
                                "Unknown Investor"}
                            </h4>
                          </div>
                        </td>

                        {/* Business */}
                        <td className="whitespace-nowrap px-6 py-5 text-sm font-medium text-[#344054]">
                          {application
                            .Business
                            ?.name || "N/A"}
                        </td>

                        {/* Investment */}
                        <td className="whitespace-nowrap px-6 py-5">
                          <div className="text-sm font-bold text-[#2563EB]">
                            {
                              application.currency
                            }{" "}
                            {application.investmentAmount?.toLocaleString() ||
                              "N/A"}
                          </div>
                        </td>

                        {/* Type */}
                        <td className="whitespace-nowrap px-6 py-5 text-sm text-[#344054]">
                          {application.investmentType ||
                            "N/A"}
                        </td>

                        {/* Status */}
                        <td className="whitespace-nowrap px-6 py-5">
                          {getStatusBadge(
                            application.status
                          )}
                        </td>

                        {/* Date */}
                        <td className="whitespace-nowrap px-6 py-5 text-sm text-[#667085]">
                          {timeAgo(
                            application.createdAt
                          )}
                        </td>

                        {/* Actions */}
                        <td className="whitespace-nowrap px-6 py-5 text-right">
                          {application.status ===
                          "waiting" ? (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() =>
                                  handleAccept(
                                    application.uuid
                                  )
                                }
                                disabled={
                                  actionLoading ===
                                  application.uuid
                                }
                                className="rounded-xl bg-[#16A34A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#15803D] disabled:opacity-50"
                              >
                                {actionLoading ===
                                application.uuid
                                  ? "Loading..."
                                  : "Accept"}
                              </button>

                              <button
                                onClick={() =>
                                  handleReject(
                                    application.uuid
                                  )
                                }
                                disabled={
                                  actionLoading ===
                                  application.uuid
                                }
                                className="rounded-xl bg-[#DC2626] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#B91C1C] disabled:opacity-50"
                              >
                                {actionLoading ===
                                application.uuid
                                  ? "Loading..."
                                  : "Reject"}
                              </button>
                            </div>
                          ) : (
                            <button
                              disabled
                              className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                                application.status ===
                                "accepted"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {application.status ===
                              "accepted"
                                ? "Accepted"
                                : "Rejected"}
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterestedInvestors;