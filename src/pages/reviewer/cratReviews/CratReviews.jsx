"use client";

import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import { getReviewerAssignments } from "@/controllers/crat_controller";

import Image from "@/utils/image";

import {
  FaCheckCircle,
  FaClock,
  FaClipboardCheck,
  FaChartLine,
  FaBuilding,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaArrowRight,
} from "react-icons/fa";

const TAB_KEYS = {
  active: "active",
  submitted: "submitted",
};

const ACTIVE_STATUSES = [
  "assigned",
  "in_review",
  "admin_rejected",
];

const SUBMITTED_STATUSES = [
  "review_submitted",
  "published",
];

const CratReviewsPage = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  const [assignments, setAssignments] = useState([]);

  const [activeTab, setActiveTab] =
    useState(TAB_KEYS.active);

  const loadAssignments = async () => {
    try {
      setLoading(true);

      const data =
        await getReviewerAssignments();

      console.log(
        "Reviewer Assignments:",
        data
      );

      setAssignments(data || []);
    } catch (error) {
      console.error(error);

      toast.error(
        "Failed to load reviewer assignments."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, []);

  const formatStatus = (
    status = ""
  ) =>
    String(status)
      .split("_")
      .filter(Boolean)
      .map(
        (part) =>
          part[0]?.toUpperCase() +
          part.slice(1)
      )
      .join(" ");

  const statusTone = (
    status = ""
  ) => {
    const value =
      String(status).toLowerCase();

    if (value === "assigned") {
      return "bg-violet-100 text-violet-700";
    }

    if (value === "in_review") {
      return "bg-sky-100 text-sky-700";
    }

    if (value === "admin_rejected") {
      return "bg-amber-100 text-amber-700";
    }

    if (
      value === "review_submitted"
    ) {
      return "bg-blue-100 text-blue-700";
    }

    if (value === "published") {
      return "bg-emerald-100 text-emerald-700";
    }

    return "bg-slate-100 text-slate-700";
  };

  const getEntrepreneurName = (
    assignment
  ) =>
    assignment?.Business?.name ||
    assignment?.business?.name ||
    assignment?.entrepreneur?.name ||
    assignment?.user?.name ||
    "Entrepreneur";

  const getEntrepreneurEmail = (
    assignment
  ) =>
    assignment?.Business?.email ||
    assignment?.business?.email ||
    assignment?.entrepreneur?.email ||
    assignment?.user?.email ||
    "-";

  const filteredAssignments =
    useMemo(() => {
      if (
        activeTab ===
        TAB_KEYS.submitted
      ) {
        return assignments.filter(
          (assignment) =>
            SUBMITTED_STATUSES.includes(
              String(
                assignment.status || ""
              )
            )
        );
      }

      return assignments.filter(
        (assignment) =>
          ACTIVE_STATUSES.includes(
            String(
              assignment.status || ""
            )
          )
      );
    }, [activeTab, assignments]);

  const stats = {
    total: assignments.length,

    active: assignments.filter(
      (item) =>
        ACTIVE_STATUSES.includes(
          String(item.status || "")
        )
    ).length,

    submitted:
      assignments.filter((item) =>
        SUBMITTED_STATUSES.includes(
          String(item.status || "")
        )
      ).length,

    published:
      assignments.filter(
        (item) =>
          item.status ===
          "published"
      ).length,
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] px-6 py-6">
      <div className="mx-auto max-w-7xl">
        {/* HERO */}
        <section className="relative mb-8 overflow-hidden rounded-3xl border border-[#EAECF0] bg-black shadow-sm">
          <div className="absolute inset-0">
            <Image
              src="/images/general_resources_hero.svg"
              alt="CRAT reviews"
              width={1600}
              height={900}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/20" />

          <div className="relative z-10 flex min-h-[320px] max-w-3xl flex-col justify-center p-8 lg:p-12">
            <span className="mb-6 inline-flex w-fit items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
              <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
              CRAT Reviewer Dashboard
            </span>

            <h1 className="mb-4 text-4xl font-bold leading-tight text-white md:text-5xl">
              Manage Review
              Assignments
            </h1>

            <p className="mb-8 max-w-2xl text-base leading-8 text-white/85 md:text-lg">
              Review assigned
              businesses, track
              submissions, and manage
              CRAT assessment workflows
              from one central
              workspace.
            </p>

            <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-white/90">
              <div className="flex items-center gap-2">
                <FaClipboardCheck />

                <span>
                  {stats.total}{" "}
                  Assignments
                </span>
              </div>

              <div className="flex items-center gap-2">
                <FaClock />

                <span>
                  {stats.active} Active
                </span>
              </div>

              <div className="flex items-center gap-2">
                <FaCheckCircle />

                <span>
                  {stats.submitted}{" "}
                  Submitted
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-4">
          <div className="relative rounded-2xl border border-[#EAECF0] bg-white p-5 shadow-sm">
            <FaClipboardCheck className="absolute right-5 top-5 text-xl text-[#2563EB]" />

            <h3 className="text-3xl font-bold text-[#101828]">
              {stats.total}
            </h3>

            <p className="mt-2 text-sm font-medium text-[#667085]">
              Total Assignments
            </p>
          </div>

          <div className="relative rounded-2xl border border-[#EAECF0] bg-white p-5 shadow-sm">
            <FaClock className="absolute right-5 top-5 text-xl text-yellow-500" />

            <h3 className="text-3xl font-bold text-[#101828]">
              {stats.active}
            </h3>

            <p className="mt-2 text-sm font-medium text-[#667085]">
              Active Reviews
            </p>
          </div>

          <div className="relative rounded-2xl border border-[#EAECF0] bg-white p-5 shadow-sm">
            <FaChartLine className="absolute right-5 top-5 text-xl text-blue-500" />

            <h3 className="text-3xl font-bold text-[#101828]">
              {stats.submitted}
            </h3>

            <p className="mt-2 text-sm font-medium text-[#667085]">
              Submitted Reviews
            </p>
          </div>

          <div className="relative rounded-2xl border border-[#EAECF0] bg-white p-5 shadow-sm">
            <FaCheckCircle className="absolute right-5 top-5 text-xl text-green-500" />

            <h3 className="text-3xl font-bold text-[#101828]">
              {stats.published}
            </h3>

            <p className="mt-2 text-sm font-medium text-[#667085]">
              Published Reports
            </p>
          </div>
        </section>

        {/* TABS */}
        <div className="mb-8 flex items-center gap-3">
          <button
            onClick={() =>
              setActiveTab(
                TAB_KEYS.active
              )
            }
            className={`rounded-xl px-5 py-3 text-sm font-semibold transition ${
              activeTab ===
              TAB_KEYS.active
                ? "bg-[#2563EB] text-white"
                : "border border-[#D0D5DD] bg-white text-[#344054]"
            }`}
          >
            Active Assignments
          </button>

          <button
            onClick={() =>
              setActiveTab(
                TAB_KEYS.submitted
              )
            }
            className={`rounded-xl px-5 py-3 text-sm font-semibold transition ${
              activeTab ===
              TAB_KEYS.submitted
                ? "bg-[#2563EB] text-white"
                : "border border-[#D0D5DD] bg-white text-[#344054]"
            }`}
          >
            Submitted Reviews
          </button>
        </div>

        {/* CARDS */}
        {loading ? (
          <div className="rounded-3xl border border-[#EAECF0] bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-[#667085]">
              Loading assignments...
            </p>
          </div>
        ) : filteredAssignments.length ===
          0 ? (
          <div className="rounded-3xl border border-[#EAECF0] bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-[#667085]">
              {activeTab ===
              TAB_KEYS.submitted
                ? "No submitted reviews yet."
                : "No active assignments available."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#EAECF0] bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-sm font-semibold tracking-wider text-gray-500">
                    Business Name
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-sm font-semibold tracking-wider text-gray-500">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-sm font-semibold tracking-wider text-gray-500">
                    Location
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-sm font-semibold tracking-wider text-gray-500">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-sm font-semibold tracking-wider text-gray-500">
                    Joined
                  </th>
                  <th scope="col" className="px-6 py-4 text-right text-sm font-semibold tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredAssignments.map((assignment, index) => (
                  <tr key={assignment.id || assignment.uuid || index} className="transition-colors hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm font-bold text-gray-900">{getEntrepreneurName(assignment)}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-gray-500">{getEntrepreneurEmail(assignment)}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-gray-500">
                        {assignment?.Business?.location || assignment?.business?.location || assignment?.location || "Not specified"}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusTone(assignment.status)}`}>
                        {formatStatus(assignment.status)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-gray-500">
                        {assignment?.Business?.createdAt || assignment?.business?.createdAt || assignment?.createdAt
                          ? new Date(assignment?.Business?.createdAt || assignment?.business?.createdAt || assignment?.createdAt).getFullYear()
                          : "N/A"}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <button
                        onClick={() => navigate(`/dashboard/cratReviewAssessment?businessId=${assignment.business_id}`)}
                        className="text-[#2563EB] hover:text-blue-800 font-semibold"
                      >
                        {activeTab === TAB_KEYS.submitted ? "View Review" : "Open Review"}
                      </button>
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

export default CratReviewsPage;