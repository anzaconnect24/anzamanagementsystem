"use client";

import { useEffect, useState } from "react";
import { getMyInvestmentApplications } from "@/controllers/investment_application_controller";

import Link from "@/utils/link";
import Image from "@/utils/image";

import Loader from "@/components/common/Loader";
import NoData from "@/component/noData";

import {
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaMoneyBillWave,
  FaChartLine,
} from "react-icons/fa";

import { timeAgo } from "@/utils/time_ago";
import { useTranslation } from "@/locales";

const InvestmentApplications = () => {
  const { t } = useTranslation();

  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    filterApplications();
  }, [applications, statusFilter]);

  const fetchApplications = async () => {
    setLoading(true);

    try {
      const data = await getMyInvestmentApplications(1, 100);

      setApplications(data?.data || []);
    } catch (error) {
      console.error("Error fetching applications:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterApplications = () => {
    let filtered = [...applications];

    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (app) =>
          app.status?.toLowerCase() ===
          statusFilter
      );
    }

    setFilteredApplications(filtered);
  };

  const stats = {
    all: applications.length,

    pending: applications.filter(
      (a) => a.status === "pending"
    ).length,

    in_progress: applications.filter(
      (a) => a.status === "in_progress"
    ).length,

    completed: applications.filter(
      (a) => a.status === "completed"
    ).length,

    dropped: applications.filter(
      (a) => a.status === "dropped"
    ).length,
  };

  const formatStatus = (status) => {
    if (!status) return "Pending";

    const readableStatus =
      status.replace(/_/g, " ");

    return (
      readableStatus.charAt(0).toUpperCase() +
      readableStatus.slice(1)
    );
  };

  const getStatusBadge = (status) => {
    const statusLower =
      status?.toLowerCase() || "pending";

    const styles = {
      pending:
        "bg-yellow-100 text-yellow-800",

      in_progress:
        "bg-blue-100 text-blue-700",

      completed:
        "bg-green-100 text-green-700",

      dropped:
        "bg-red-100 text-red-700",
    };

    return (
      <span
        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
          styles[statusLower] ||
          styles.pending
        }`}
      >
        {formatStatus(statusLower)}
      </span>
    );
  };

  return loading ? (
    <Loader />
  ) : (
    <div className="min-h-screen bg-[#F5F7FA] px-6 py-6">
      <div className="mx-auto max-w-7xl">
        {/* HERO SECTION */}
        <section className="relative mb-8 overflow-hidden rounded-3xl border border-[#EAECF0] bg-black shadow-sm">
          {/* Background Image */}
          <div className="absolute inset-0">
            <Image
              src="/images/investors_hero.svg"
              alt="Investment Applications"
              width={1600}
              height={900}
              className="h-full w-full object-cover"
            />
          </div>

          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/20" />

          {/* Content */}
          <div className="relative z-10 flex min-h-[300px] max-w-3xl flex-col justify-center p-8 lg:p-12">
            <span className="mb-6 inline-flex w-fit items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
              <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
              Investment Applications
            </span>

            <h1 className="mb-4 text-4xl font-bold leading-tight text-white md:text-4xl">
              Track Your Investment Requests
            </h1>

            <p className="mb-8 max-w-2xl text-base leading-8 text-white/85 md:text-lg">
              Monitor application progress
              and stay updated on
              investment opportunities.
            </p>

            <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-white/90">
              <span className="flex items-center gap-2">
                <FaMoneyBillWave />
                {applications.length}{" "}
                Applications
              </span>

              <span className="flex items-center gap-2">
                <FaCheckCircle />
                {stats.completed} Approved
              </span>

              <span className="flex items-center gap-2">
                <FaChartLine />
                Investment Tracking
              </span>
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-5">
          <div
            onClick={() =>
              setStatusFilter("all")
            }
            className={`relative cursor-pointer rounded-2xl border bg-white p-5 shadow-sm transition ${
              statusFilter === "all"
                ? "border-[#2563EB]"
                : "border-[#EAECF0]"
            }`}
          >
            <FaMoneyBillWave className="absolute right-5 top-5 text-xl text-[#2563EB]" />

            <h3 className="text-3xl font-bold text-[#101828]">
              {stats.all}
            </h3>

            <p className="mt-2 text-sm font-medium text-[#667085]">
              All Applications
            </p>
          </div>

          <div
            onClick={() =>
              setStatusFilter("pending")
            }
            className={`relative cursor-pointer rounded-2xl border bg-white p-5 shadow-sm transition ${
              statusFilter === "pending"
                ? "border-yellow-500"
                : "border-[#EAECF0]"
            }`}
          >
            <FaClock className="absolute right-5 top-5 text-xl text-yellow-500" />

            <h3 className="text-3xl font-bold text-[#101828]">
              {stats.pending}
            </h3>

            <p className="mt-2 text-sm font-medium text-[#667085]">
              Pending
            </p>
          </div>

          <div
            onClick={() =>
              setStatusFilter(
                "in_progress"
              )
            }
            className={`relative cursor-pointer rounded-2xl border bg-white p-5 shadow-sm transition ${
              statusFilter ===
              "in_progress"
                ? "border-blue-500"
                : "border-[#EAECF0]"
            }`}
          >
            <FaChartLine className="absolute right-5 top-5 text-xl text-blue-500" />

            <h3 className="text-3xl font-bold text-[#101828]">
              {stats.in_progress}
            </h3>

            <p className="mt-2 text-sm font-medium text-[#667085]">
              In progress
            </p>
          </div>

          <div
            onClick={() =>
              setStatusFilter("completed")
            }
            className={`relative cursor-pointer rounded-2xl border bg-white p-5 shadow-sm transition ${
              statusFilter ===
              "completed"
                ? "border-green-500"
                : "border-[#EAECF0]"
            }`}
          >
            <FaCheckCircle className="absolute right-5 top-5 text-xl text-green-500" />

            <h3 className="text-3xl font-bold text-[#101828]">
              {stats.completed}
            </h3>

            <p className="mt-2 text-sm font-medium text-[#667085]">
              Approved
            </p>
          </div>

          <div
            onClick={() =>
              setStatusFilter("dropped")
            }
            className={`relative cursor-pointer rounded-2xl border bg-white p-5 shadow-sm transition ${
              statusFilter === "dropped"
                ? "border-red-500"
                : "border-[#EAECF0]"
            }`}
          >
            <FaTimesCircle className="absolute right-5 top-5 text-xl text-red-500" />

            <h3 className="text-3xl font-bold text-[#101828]">
              {stats.dropped}
            </h3>

            <p className="mt-2 text-sm font-medium text-[#667085]">
              Rejected
            </p>
          </div>
        </section>

        {/* HEADER */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-[#101828]">
            My Applications
          </h2>
        </div>

        {/* TABLE */}
        {filteredApplications.length <
        1 ? (
          <NoData />
        ) : (
          <div className="overflow-hidden rounded-3xl border border-[#EAECF0] bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#EAECF0]">
                <thead className="bg-[#F9FAFB]">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#344054]">
                      Entrepreneur
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#344054]">
                      Email
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#344054]">
                      Status
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#344054]">
                      Date
                    </th>

                    <th className="px-6 py-4 text-right text-sm font-semibold text-[#344054]">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#EAECF0] bg-white">
                  {filteredApplications.map(
                    (
                      application,
                      index
                    ) => (
                      <tr
                        key={
                          application.uuid ||
                          index
                        }
                        className="transition duration-200 hover:bg-[#F9FAFB]"
                      >
                        {/* Entrepreneur */}
                        <td className="whitespace-nowrap px-6 py-5">
                          <p className="text-sm font-semibold text-[#101828]">
                            {application
                              ?.Entrepreneur
                              ?.name ||
                              application
                                ?.entrepreneur
                                ?.name ||
                              "Unknown Entrepreneur"}
                          </p>
                        </td>

                        {/* Email */}
                        <td className="whitespace-nowrap px-6 py-5 text-sm text-[#667085]">
                          {application
                            ?.Entrepreneur
                            ?.email ||
                            application
                              ?.entrepreneur
                              ?.email ||
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

                        {/* Action */}
                        <td className="whitespace-nowrap px-6 py-5 text-right">
                          <Link
                            href={`/dashboard/investmentApplications/${application.uuid}`}
                            className="inline-flex items-center justify-center rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1D4ED8]"
                          >
                            View details
                          </Link>
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

export default InvestmentApplications;