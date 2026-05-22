"use client";

import { useContext, useEffect, useState } from "react";
import { UserContext } from "../../../layouts/DashboardLayout";

import Loader from "@/components/common/Loader";
import { timeAgo } from "@/utils/time_ago";
import NoData from "@/component/noData";
import { useTranslation } from "../../../locales";

import Image from "@/utils/image";

import { getEntreprenuerMentorshipApplications } from "@/controllers/mentorship_applications_controllers";

import {
  FaUserTie,
  FaClock,
  FaCheckCircle,
  FaHourglassHalf,
  FaTimesCircle,
} from "react-icons/fa";

const MentorshipApplications = () => {
  const { t } = useTranslation();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const { userDetails } = useContext(UserContext);

  useEffect(() => {
    getData();
  }, []);

  const getData = () => {
    setLoading(true);

    getEntreprenuerMentorshipApplications(
      userDetails.uuid,
      1,
      100,
      "",
    ).then((res) => {
      setData(res.data || []);
      setLoading(false);
    });
  };

  const pendingCount = data.filter(
    (item) => item.status === "PENDING",
  ).length;

  const acceptedCount = data.filter(
    (item) => item.status === "ACCEPTED",
  ).length;

  const rejectedCount = data.filter(
    (item) => item.status === "REJECTED",
  ).length;

  const getStatusBadge = (status) => {
    const statusConfig = {
      PENDING: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        label: "Pending",
      },

      ACCEPTED: {
        bg: "bg-green-100",
        text: "text-green-800",
        label: "Accepted",
      },

      REJECTED: {
        bg: "bg-red-100",
        text: "text-red-800",
        label: "Rejected",
      },
    };

    const config =
      statusConfig[status] ||
      statusConfig.PENDING;

    return (
      <span
        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${config.bg} ${config.text}`}
      >
        {config.label}
      </span>
    );
  };

  return loading ? (
    <Loader />
  ) : (
    <div className="min-h-screen bg-[#F5F7FA] px-6 py-6">
      <div className="mx-auto max-w-7xl">
        {/* HERO */}
        <section className="relative mb-8 overflow-hidden rounded-3xl border border-[#EAECF0] bg-black shadow-sm">
          <div className="absolute inset-0">
            <Image
              src="/images/general_resources_hero.svg"
              alt="Mentorship Applications"
              width={1600}
              height={900}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/20" />

          <div className="relative z-10 flex min-h-[320px] max-w-3xl flex-col justify-center p-8 lg:p-12">
            <span className="mb-6 inline-flex w-fit items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
              <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
              Mentorship Applications
            </span>

            <h1 className="mb-4 text-4xl font-bold leading-tight text-white md:text-4xl">
              Track Your Mentorship Requests
            </h1>

            <p className="mb-8 max-w-2xl text-base leading-8 text-white/85 md:text-lg">
              Monitor your mentorship
              applications, view application
              statuses, and stay updated on
              your mentorship journey.
            </p>

            <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-white/90">
              <span className="flex items-center gap-2">
                <FaUserTie />
                {data.length} Applications
              </span>

              <span className="flex items-center gap-2">
                <FaCheckCircle />
                {acceptedCount} Accepted
              </span>

              <span className="flex items-center gap-2">
                <FaClock />
                Ongoing Tracking
              </span>
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-3">
          <div className="relative rounded-2xl border border-[#EAECF0] bg-white p-5 shadow-sm">
            <FaHourglassHalf className="absolute right-5 top-5 text-xl text-yellow-500" />

            <h3 className="text-3xl font-bold text-[#101828]">
              {pendingCount}
            </h3>

            <p className="mt-2 text-sm font-medium text-[#667085]">
              Pending Applications
            </p>
          </div>

          <div className="relative rounded-2xl border border-[#EAECF0] bg-white p-5 shadow-sm">
            <FaCheckCircle className="absolute right-5 top-5 text-xl text-green-500" />

            <h3 className="text-3xl font-bold text-[#101828]">
              {acceptedCount}
            </h3>

            <p className="mt-2 text-sm font-medium text-[#667085]">
              Accepted Applications
            </p>
          </div>

          <div className="relative rounded-2xl border border-[#EAECF0] bg-white p-5 shadow-sm">
            <FaTimesCircle className="absolute right-5 top-5 text-xl text-red-500" />

            <h3 className="text-3xl font-bold text-[#101828]">
              {rejectedCount}
            </h3>

            <p className="mt-2 text-sm font-medium text-[#667085]">
              Rejected Applications
            </p>
          </div>
        </section>

        {/* HEADER */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-[#101828]">
            My Applications
          </h2>
        </div>

        {/* TABLE */}
        {data.length < 1 ? (
          <NoData />
        ) : (
          <div className="overflow-hidden rounded-3xl border border-[#EAECF0] bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#EAECF0]">
                <thead className="bg-[#F9FAFB]">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#344054]">
                      Mentor
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#344054]">
                      Position
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#344054]">
                      Status
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#344054]">
                      Applied
                    </th>

                    <th className="px-6 py-4 text-right text-sm font-semibold text-[#344054]">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#EAECF0] bg-white">
                  {data.map((application) => (
                    <tr
                      key={application.uuid}
                      className="transition hover:bg-[#F9FAFB]"
                    >
                      {/* Mentor */}
                      <td className="whitespace-nowrap px-6 py-5">
                        <div className="flex items-center gap-4">
                          <img
                            className="h-12 w-12 rounded-full object-cover"
                            src={
                              application.mentor?.image ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                application.mentor?.name || "M",
                              )}&background=6366f1&color=fff`
                            }
                            alt={application.mentor?.name}
                          />

                          <div>
                            <p className="text-sm font-semibold text-[#101828]">
                              {application.mentor?.name ||
                                "Unknown Mentor"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Position */}
                      <td className="whitespace-nowrap px-6 py-5 text-sm text-[#667085]">
                        {application.mentor
                          ?.MentorProfile
                          ?.position ||
                          "Business Mentor"}
                      </td>

                      {/* Status */}
                      <td className="whitespace-nowrap px-6 py-5">
                        {getStatusBadge(
                          application.status,
                        )}
                      </td>

                      {/* Applied */}
                      <td className="whitespace-nowrap px-6 py-5 text-sm text-[#667085]">
                        {timeAgo(
                          application.createdAt,
                        )}
                      </td>

                      {/* Action */}
                      <td className="whitespace-nowrap px-6 py-5 text-right">
                        <button className="rounded-xl bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1D4ED8]">
                          View Application
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MentorshipApplications;