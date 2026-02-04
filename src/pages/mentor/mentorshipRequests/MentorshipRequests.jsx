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
      console.log(res);
      setData(res);
      setLoading(false);
    });
  };

  const handleApprove = async (uuid) => {
    setProcessing(uuid);
    try {
      await updateMentorshipApplication(uuid, { status: "ACCEPTED" });
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
      await updateMentorshipApplication(uuid, { status: "REJECTED" });
      toast.success("Mentorship request rejected");
      getData();
    } catch (error) {
      toast.error("Failed to reject request");
      console.error(error);
    } finally {
      setProcessing(null);
    }
  };
  return loading ? (
    <Loader />
  ) : (
    <div className="bg-white py-6 shadow mt-6 px-6 ">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">
          {t("mentorship.mentorshipRequests", "Mentorship requests")}
        </h1>
        <input
          onChange={(e) => {
            setKeyword(e.target.value);
          }}
          className="py-1 rounded border-bodydark border-opacity-40 "
          placeholder={t("mentorship.searchHere", "Search here")}
        />
      </div>
      {data.length < 1 ? (
        <NoData />
      ) : (
        <table className="mt-8 w-full">
          <thead>
            <tr>
              <th className="text-left px-3">
                {t("mentorship.assigned", "Assigned")}
              </th>
              <th className="text-left px-3">
                {t("mentorship.entrepreneur", "Entrepreneur")}
              </th>
              <th className="text-left px-3">
                {t("mentorship.company", "Company")}
              </th>
              <th className="text-left px-3">{t("common.email", "Email")}</th>
              <th className="text-left px-3">{t("common.phone", "Phone")}</th>
              <th className="text-left px-3">
                {t("common.actions", "Actions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {data
              .filter(
                (e) =>
                  e.entrepreneur?.name
                    .toLowerCase()
                    .includes(keyword.toLowerCase()) ||
                  e.entrepreneur?.Business?.name
                    .toLowerCase()
                    .includes(keyword.toLowerCase()) ||
                  e.entrepreneur?.Business?.BusinessSector?.name
                    .toLowerCase()
                    .includes(keyword.toLowerCase()),
              )
              .map((item, index) => {
                const isProcessing = processing === item.uuid;
                return (
                  <tr key={item.uuid} className="border-b border-black/10">
                    <td className="py-3 px-3">{timeAgo(item.createdAt)}</td>
                    <td className="py-3 px-3">{item.entrepreneur?.name}</td>
                    <td className="py-3 px-3">
                      {item.entrepreneur?.Business?.name}
                    </td>
                    <td className="py-3 px-3">{item.entrepreneur?.email}</td>
                    <td className="py-3 px-3">{item.entrepreneur?.phone}</td>
                    <td className="py-3 px-3">
                      <div className="flex gap-2 flex-wrap">
                        <Link
                          href={`/dashboard/mentorEntreprenuers/businessDetailsByMentor/${item.entrepreneur?.Business?.uuid}`}
                          className="py-2 px-3 text-sm bg-blue-500 text-white hover:bg-blue-600 transition-all duration-300 rounded"
                        >
                          {t("common.viewDetails", "View Details")}
                        </Link>
                        {item.status === "PENDING" && (
                          <>
                            <button
                              onClick={() => handleApprove(item.uuid)}
                              disabled={isProcessing}
                              className="py-2 px-3 text-sm bg-green-500 text-white hover:bg-green-600 disabled:bg-gray-400 transition-all duration-300 rounded"
                            >
                              {isProcessing
                                ? t("mentorship.approving", "Approving...")
                                : t("mentorship.approve", "Approve")}
                            </button>
                            <button
                              onClick={() => handleReject(item.uuid)}
                              disabled={isProcessing}
                              className="py-2 px-3 text-sm bg-red-500 text-white hover:bg-red-600 disabled:bg-gray-400 transition-all duration-300 rounded"
                            >
                              {isProcessing
                                ? t("mentorship.rejecting", "Rejecting...")
                                : t("mentorship.reject", "Reject")}
                            </button>
                          </>
                        )}
                        {item.status === "ACCEPTED" && (
                          <span className="py-2 px-3 text-sm bg-green-100 text-green-800 rounded">
                            {t("mentorship.accepted", "Accepted")}
                          </span>
                        )}
                        {item.status === "REJECTED" && (
                          <span className="py-2 px-3 text-sm bg-red-100 text-red-800 rounded">
                            {t("mentorship.rejected", "Rejected")}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      )}

      {/* Request Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">
                {t("mentorship.requestDetails", "Request Details")}
              </h2>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">
                  {t("mentorship.entrepreneurInfo", "Entrepreneur Information")}
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded">
                  <div>
                    <p className="text-sm text-gray-600">
                      {t("common.name", "Name")}
                    </p>
                    <p className="font-medium">
                      {selectedRequest.entrepreneur?.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">
                      {t("common.email", "Email")}
                    </p>
                    <p className="font-medium">
                      {selectedRequest.entrepreneur?.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">
                      {t("common.phone", "Phone")}
                    </p>
                    <p className="font-medium">
                      {selectedRequest.entrepreneur?.phone}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">
                      {t("mentorship.company", "Company")}
                    </p>
                    <p className="font-medium">
                      {selectedRequest.entrepreneur?.Business?.name}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">
                  {t("mentorship.challenges", "Challenges")}
                </h3>
                <p className="bg-gray-50 p-4 rounded">
                  {selectedRequest.challenges ||
                    t("common.notProvided", "Not provided")}
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">
                  {t("mentorship.mentorshipAreas", "Mentorship Areas")}
                </h3>
                <div className="bg-gray-50 p-4 rounded">
                  {selectedRequest.mentorshipAreas &&
                  Object.values(selectedRequest.mentorshipAreas).length > 0 ? (
                    <ul className="list-disc list-inside space-y-1">
                      {Object.values(selectedRequest.mentorshipAreas).map(
                        (area, idx) => (
                          <li key={idx}>{area}</li>
                        ),
                      )}
                    </ul>
                  ) : (
                    <p>{t("common.notProvided", "Not provided")}</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">
                  {t("mentorship.availability", "Availability")}
                </h3>
                <p className="bg-gray-50 p-4 rounded">
                  {selectedRequest.availability ||
                    t("common.notProvided", "Not provided")}
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">
                  {t("mentorship.mentorshipMode", "Mentorship Mode")}
                </h3>
                <p className="bg-gray-50 p-4 rounded">
                  {selectedRequest.mentorshipMode ||
                    t("common.notProvided", "Not provided")}
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Link
                  href={`/dashboard/enterprenuers/businessDetails/${selectedRequest.entrepreneur?.Business?.uuid}`}
                  className="py-2 px-4 bg-blue-500 text-white hover:bg-blue-600 transition-all duration-300 rounded"
                >
                  {t("mentorship.viewBusinessProfile", "View Business Profile")}
                </Link>
                {selectedRequest.status === "PENDING" && (
                  <>
                    <button
                      onClick={() => {
                        handleApprove(selectedRequest.uuid);
                        setSelectedRequest(null);
                      }}
                      disabled={processing === selectedRequest.uuid}
                      className="py-2 px-4 bg-green-500 text-white hover:bg-green-600 disabled:bg-gray-400 transition-all duration-300 rounded"
                    >
                      {t("mentorship.approve", "Approve")}
                    </button>
                    <button
                      onClick={() => {
                        handleReject(selectedRequest.uuid);
                        setSelectedRequest(null);
                      }}
                      disabled={processing === selectedRequest.uuid}
                      className="py-2 px-4 bg-red-500 text-white hover:bg-red-600 disabled:bg-gray-400 transition-all duration-300 rounded"
                    >
                      {t("mentorship.reject", "Reject")}
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
