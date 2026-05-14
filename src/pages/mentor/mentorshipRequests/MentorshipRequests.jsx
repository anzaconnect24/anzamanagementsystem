"use client";

import { useContext, useEffect, useState } from "react";
import { UserContext } from "../../../layouts/DashboardLayout";

import Loader from "@/components/common/Loader";
import { timeAgo } from "@/utils/time_ago";
import {
  getUnapprovedMentorEntreprenuers,
  updateMentorshipApplication,
} from "@/controllers/mentorEntreprenuerController";
import Link from "@/utils/link";
import toast from "react-hot-toast";
import NoData from "@/component/noData";
import { useTranslation } from "../../../locales";

import {
  FaArrowRight,
  FaCheckCircle,
  FaClock,
  FaEnvelope,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaSearch,
  FaTimes,
  FaUserGraduate,
} from "react-icons/fa";

const MentorEntreprenuer = () => {
  const { t } = useTranslation();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [keyword, setKeyword] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);

  const { userDetails } = useContext(UserContext);

  useEffect(() => {
    getData();
  }, []);

  const getData = () => {
    getUnapprovedMentorEntreprenuers().then((res) => {
      setData(res);
      setLoading(false);
    });
  };

  const handleApprove = async (uuid) => {
    setProcessing(uuid);

    try {
      await updateMentorshipApplication(uuid, {
        status: "ACCEPTED",
      });

      toast.success("Mentorship request approved successfully");

      getData();
    } catch (error) {
      toast.error("Failed to approve request");
      console.error(error);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (uuid) => {
    setProcessing(uuid);

    try {
      await updateMentorshipApplication(uuid, {
        status: "REJECTED",
      });

      toast.success("Mentorship request rejected");

      getData();
    } catch (error) {
      toast.error("Failed to reject request");
      console.error(error);
    } finally {
      setProcessing(null);
    }
  };

  const filteredData = data.filter(
    (e) =>
      e.entrepreneur?.name
        ?.toLowerCase()
        .includes(keyword.toLowerCase()) ||
      e.entrepreneur?.Business?.name
        ?.toLowerCase()
        .includes(keyword.toLowerCase()) ||
      e.entrepreneur?.Business?.BusinessSector?.name
        ?.toLowerCase()
        .includes(keyword.toLowerCase()),
  );

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen px-6 py-4">
      <div className="relative mb-10 min-h-[320px] overflow-hidden rounded-2xl bg-black shadow-sm">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/images/mentor_hero.svg')",
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-[#c9672b]/30" />

        <div className="relative z-10 max-w-3xl p-10 text-white">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-sm font-medium shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#f08a3c]" />
            Mentorship Management
          </span>

          <h1 className="mb-3 text-4xl font-bold leading-tight drop-shadow-lg">
            Mentorship Requests
          </h1>

          <p className="mb-6 text-lg text-white/85 drop-shadow-md">
            Review entrepreneur mentorship applications, assess business needs,
            and approve mentoring relationships across accelerator programs.
          </p>

          <div className="flex flex-wrap items-center gap-6 text-sm text-white/85">
            <span className="flex items-center gap-2">
              <FaUserGraduate />
              Entrepreneur Applications
            </span>

            <span className="flex items-center gap-2">
              <FaClock />
              Review & Approval Workflow
            </span>
          </div>
        </div>
      </div>

      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#172033]">
            Pending Applications
          </h2>

          <p className="mt-1 text-sm text-[#6f6f72]">
            Review and manage entrepreneur mentorship requests.
          </p>
        </div>

        <div className="relative w-full md:w-[320px]">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8a8f98]" />

          <input
            onChange={(e) => {
              setKeyword(e.target.value);
            }}
            className="w-full rounded-xl border border-black/10 bg-transparent py-3 pl-11 pr-4 text-sm outline-none backdrop-blur-sm transition focus:border-green-600 focus:ring-1 focus:ring-green-600"
            placeholder={t("mentorship.searchHere", "Search here")}
          />
        </div>
      </div>

      {filteredData.length < 1 ? (
        <NoData />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {filteredData.map((item) => {
            const isProcessing = processing === item.uuid;

            return (
              <div
                key={item.uuid}
                className="group rounded-2xl border border-black/10 p-6 backdrop-blur-sm transition duration-200 hover:shadow-lg"
              >
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
                          item.status === "ACCEPTED"
                            ? "bg-green-50 text-green-700"
                            : item.status === "REJECTED"
                              ? "bg-red-50 text-red-700"
                              : "bg-yellow-50 text-yellow-700"
                        }`}
                      >
                        {item.status === "ACCEPTED" ? (
                          <FaCheckCircle />
                        ) : item.status === "REJECTED" ? (
                          <FaTimes />
                        ) : (
                          <FaClock />
                        )}

                        {item.status}
                      </span>

                      <span className="text-xs text-[#8a8f98]">
                        {timeAgo(item.createdAt)}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-[#172033]">
                      {item.entrepreneur?.name}
                    </h3>

                    <p className="mt-1 text-sm text-[#6f6f72]">
                      {item.entrepreneur?.Business?.name}
                    </p>
                  </div>
                </div>

                <div className="mb-6 space-y-3">
                  <div className="flex items-center gap-3 text-sm text-[#6f6f72]">
                    <FaEnvelope className="text-[#8a8f98]" />
                    <span>{item.entrepreneur?.email}</span>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-[#6f6f72]">
                    <FaPhoneAlt className="text-[#8a8f98]" />
                    <span>{item.entrepreneur?.phone}</span>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-[#6f6f72]">
                    <FaMapMarkerAlt className="text-[#8a8f98]" />
                    <span>
                      {item.entrepreneur?.Business?.location ||
                        "Location not provided"}
                    </span>
                  </div>
                </div>

                <div className="mb-6 rounded-xl border border-black/10 p-4">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[#8a8f98]">
                    Mentorship Areas
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {item.mentorshipAreas &&
                    Object.values(item.mentorshipAreas).length > 0 ? (
                      Object.values(item.mentorshipAreas).map((area, idx) => (
                        <span
                          key={idx}
                          className="rounded-full bg-[#f8f8f6] px-3 py-1 text-xs font-medium text-[#172033]"
                        >
                          {area}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-[#6f6f72]">
                        No mentorship areas specified
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 border-t border-black/10 pt-5">
                  <button
                    onClick={() => setSelectedRequest(item)}
                    className="rounded-lg border border-black/10 bg-transparent px-5 py-3 text-sm font-medium text-[#172033] transition hover:border-green-600 hover:text-green-700"
                  >
                    View Details
                  </button>

                  {item.status === "PENDING" && (
                    <>
                      <button
                        onClick={() => handleApprove(item.uuid)}
                        disabled={isProcessing}
                        className="rounded-lg border border-green-600 bg-transparent px-5 py-3 text-sm font-medium text-green-700 transition hover:bg-green-50 disabled:border-gray-300 disabled:text-gray-400"
                      >
                        {isProcessing ? "Processing..." : "Approve"}
                      </button>

                      <button
                        onClick={() => handleReject(item.uuid)}
                        disabled={isProcessing}
                        className="rounded-lg border border-red-600 bg-transparent px-5 py-3 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:border-gray-300 disabled:text-gray-400"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-8 shadow-xl">
            <div className="mb-8 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-[#172033]">
                  Request Details
                </h2>

                <p className="mt-1 text-sm text-[#6f6f72]">
                  Review entrepreneur application and mentorship requirements.
                </p>
              </div>

              <button
                onClick={() => setSelectedRequest(null)}
                className="rounded-full p-2 text-[#8a8f98] transition hover:bg-[#f8f8f6] hover:text-[#172033]"
              >
                <FaTimes />
              </button>
            </div>

            <div className="space-y-8">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-black/10 p-5">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[#8a8f98]">
                    Entrepreneur
                  </p>

                  <h3 className="text-xl font-bold text-[#172033]">
                    {selectedRequest.entrepreneur?.name}
                  </h3>

                  <div className="mt-4 space-y-3 text-sm text-[#6f6f72]">
                    <p>{selectedRequest.entrepreneur?.email}</p>
                    <p>{selectedRequest.entrepreneur?.phone}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-black/10 p-5">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[#8a8f98]">
                    Business
                  </p>

                  <h3 className="text-xl font-bold text-[#172033]">
                    {selectedRequest.entrepreneur?.Business?.name}
                  </h3>

                  <div className="mt-4 space-y-3 text-sm text-[#6f6f72]">
                    <p>
                      Sector:{" "}
                      {selectedRequest.entrepreneur?.Business?.BusinessSector
                        ?.name || "Not provided"}
                    </p>

                    <p>
                      Location:{" "}
                      {selectedRequest.entrepreneur?.Business?.location ||
                        "Not provided"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-black/10 p-6">
                <h3 className="mb-3 text-xl font-bold text-[#172033]">
                  Challenges
                </h3>

                <p className="whitespace-pre-wrap leading-7 text-[#6f6f72]">
                  {selectedRequest.challenges || "Not provided"}
                </p>
              </div>

              <div className="rounded-2xl border border-black/10 p-6">
                <h3 className="mb-4 text-xl font-bold text-[#172033]">
                  Mentorship Areas
                </h3>

                <div className="flex flex-wrap gap-3">
                  {selectedRequest.mentorshipAreas &&
                  Object.values(selectedRequest.mentorshipAreas).length > 0 ? (
                    Object.values(selectedRequest.mentorshipAreas).map(
                      (area, idx) => (
                        <span
                          key={idx}
                          className="rounded-full bg-[#f8f8f6] px-4 py-2 text-sm font-medium text-[#172033]"
                        >
                          {area}
                        </span>
                      ),
                    )
                  ) : (
                    <p className="text-[#6f6f72]">Not provided</p>
                  )}
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-black/10 p-5">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[#8a8f98]">
                    Availability
                  </p>

                  <p className="text-[#6f6f72]">
                    {selectedRequest.availability || "Not provided"}
                  </p>
                </div>

                <div className="rounded-2xl border border-black/10 p-5">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[#8a8f98]">
                    Mentorship Mode
                  </p>

                  <p className="text-[#6f6f72]">
                    {selectedRequest.mentorshipMode || "Not provided"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 border-t border-black/10 pt-6">
                <Link
                  href={`/dashboard/mentorEntreprenuers/businessDetailsByMentor/${selectedRequest.entrepreneur?.Business?.uuid}`}
                  className="inline-flex items-center gap-2 rounded-lg border border-black/10 bg-transparent px-5 py-3 text-sm font-medium text-[#172033] transition hover:border-green-600 hover:text-green-700"
                >
                  View Business Profile
                  <FaArrowRight />
                </Link>

                {selectedRequest.status === "PENDING" && (
                  <>
                    <button
                      onClick={() => {
                        handleApprove(selectedRequest.uuid);
                        setSelectedRequest(null);
                      }}
                      disabled={processing === selectedRequest.uuid}
                      className="rounded-lg border border-green-600 bg-transparent px-5 py-3 text-sm font-medium text-green-700 transition hover:bg-green-50 disabled:border-gray-300 disabled:text-gray-400"
                    >
                      {processing === selectedRequest.uuid
                        ? "Approving..."
                        : "Approve"}
                    </button>

                    <button
                      onClick={() => {
                        handleReject(selectedRequest.uuid);
                        setSelectedRequest(null);
                      }}
                      disabled={processing === selectedRequest.uuid}
                      className="rounded-lg border border-red-600 bg-transparent px-5 py-3 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:border-gray-300 disabled:text-gray-400"
                    >
                      {processing === selectedRequest.uuid
                        ? "Rejecting..."
                        : "Reject"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorEntreprenuer;