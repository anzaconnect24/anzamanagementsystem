"use client";
import { useContext, useEffect, useState } from "react";
import { UserContext } from "../../../layouts/DashboardLayout";

import Loader from "@/components/common/Loader";
import { timeAgo } from "@/utils/time_ago";
import NoData from "@/component/noData";
import { useTranslation } from "../../../locales";
import { getEntreprenuerMentorshipApplications } from "@/controllers/mentorship_applications_controllers";

const MentorshipApplications = () => {
  const { t } = useTranslation();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [limit] = useState(10);
  const [keyword, setKeyword] = useState("");
  const { userDetails } = useContext(UserContext);

  useEffect(() => {
    getData();
  }, [page, keyword]);

  const getData = () => {
    setLoading(true);
    getEntreprenuerMentorshipApplications(
      userDetails.uuid,
      page,
      limit,
      keyword,
    ).then((res) => {
      console.log(res);
      setData(res.data || []);
      setCount(res.count || 0);
      setLoading(false);
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      PENDING: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        label: t("common.pending", "Pending"),
      },
      ACCEPTED: {
        bg: "bg-green-100",
        text: "text-green-800",
        label: t("common.accepted", "Accepted"),
      },
      REJECTED: {
        bg: "bg-red-100",
        text: "text-red-800",
        label: t("common.rejected", "Rejected"),
      },
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    return (
      <span
        className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
      >
        {config.label}
      </span>
    );
  };

  return loading ? (
    <Loader />
  ) : (
    <div className="bg-white py-6 shadow mt-6 px-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            {t(
              "mentorship.myMentorshipApplications",
              "My Mentorship Applications",
            )}
          </h1>
          <p className="text-gray-600 mt-1">
            {t(
              "mentorship.applicationDesc",
              "Track the status of your mentorship requests",
            )}
          </p>
        </div>
        <input
          onChange={(e) => {
            setKeyword(e.target.value);
          }}
          className="py-2 px-4 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder={t("mentorship.searchMentor", "Search by mentor name...")}
        />
      </div>

      {data.length < 1 ? (
        <NoData />
      ) : (
        <div className="overflow-x-auto">
          <table className="mt-4 w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">
                  {t("mentorship.mentor", "Mentor")}
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">
                  {t("mentorship.expertise", "Expertise")}
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">
                  {t("mentorship.appliedOn", "Applied On")}
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">
                  {t("common.status", "Status")}
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">
                  {t("mentorship.mentorshipAreas", "Mentorship Areas")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {data.map((application) => (
                <tr key={application.uuid} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <img
                          className="h-10 w-10 rounded-full object-cover"
                          src={
                            application.mentor?.image ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              application.mentor?.name || "M",
                            )}&background=6366f1&color=fff`
                          }
                          alt={application.mentor?.name}
                        />
                      </div>
                      <div className="ml-4">
                        <div className="font-medium text-gray-900">
                          {application.mentor?.name ||
                            t("common.notProvided", "N/A")}
                        </div>
                        <div className="text-sm text-gray-500">
                          {application.mentor?.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-900">
                      {application.mentor?.MentorProfile?.areasOfExperties
                        ? Object.values(
                            application.mentor.MentorProfile.areasOfExperties,
                          )
                            .slice(0, 2)
                            .join(", ")
                        : t("common.notProvided", "N/A")}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500">
                    {timeAgo(application.createdAt)}
                  </td>
                  <td className="px-4 py-4">
                    {getStatusBadge(application.status)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-900">
                      {application.mentorshipAreas
                        ? Object.values(application.mentorshipAreas)
                            .slice(0, 3)
                            .join(", ")
                        : t("common.notProvided", "N/A")}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {count > limit && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t">
          <div className="text-sm text-gray-600">
            {t("common.showing", "Showing")} {(page - 1) * limit + 1}{" "}
            {t("common.to", "to")} {Math.min(page * limit, count)}{" "}
            {t("common.of", "of")} {count} {t("common.results", "results")}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {t("common.previous", "Previous")}
            </button>

            <span className="px-3 py-1">
              {t("common.page", "Page")} {page} {t("common.of", "of")}{" "}
              {Math.ceil(count / limit)}
            </span>

            <button
              onClick={() =>
                setPage(Math.min(Math.ceil(count / limit), page + 1))
              }
              disabled={page === Math.ceil(count / limit)}
              className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {t("common.next", "Next")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorshipApplications;
