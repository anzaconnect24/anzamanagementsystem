"use client";
import { useContext, useEffect, useState } from "react";
import { UserContext } from "../../../layouts/DashboardLayout";

import Loader from "@/components/common/Loader";
import { timeAgo } from "@/utils/time_ago";
import {
  getAllReports,
  getSpecificEntreprenuerReports,
  getSpecificMentorReports,
} from "@/controllers/mentorReportsController";
import Link from "@/utils/link";
import NoData from "@/component/noData";
import { useTranslation } from "@/locales";

const Page = () => {
  const { t } = useTranslation();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const { userDetails } = useContext(UserContext);

  const fetchReports = (page = 1) => {
    setLoading(true);
    if (userDetails.role == "Mentor") {
      getSpecificMentorReports(userDetails.uuid, page, pagination.limit).then(
        (res) => {
          setData(res.reports || []);
          setPagination(res.pagination || pagination);
          setLoading(false);
        },
      );
    } else if (userDetails.role == "Enterprenuer") {
      getSpecificEntreprenuerReports(
        userDetails.uuid,
        page,
        pagination.limit,
      ).then((res) => {
        setData(res.reports || []);
        setPagination(res.pagination || pagination);
        setLoading(false);
      });
    } else {
      getAllReports(page, pagination.limit).then((res) => {
        setData(res.reports || []);
        setPagination(res.pagination || pagination);
        setLoading(false);
      });
    }
  };

  useEffect(() => {
    fetchReports(1);
  }, []);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchReports(newPage);
    }
  };
  return loading ? (
    <Loader />
  ) : (
    <div className="bg-white min-h-[30vh] py-6 shadow mt-6 px-6 ">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {t("mentorship.mentorReports", "Mentor Reports")}
        </h1>
        {userDetails.role === "Mentor" && (
          <Link
            href="/dashboard/mentorEntreprenuers"
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-opacity-90 transition-all duration-300"
          >
            {t("mentorship.submitNewReport", "Submit New Report")}
          </Link>
        )}
      </div>
      {data.length < 1 ? (
        <NoData />
      ) : (
        <table className="mt-8">
          <thead>
            <tr>
              <th>{t("mentorship.reported", "Reported")}</th>
              <th>
                {userDetails.role == "Enterprenuer"
                  ? t("mentorship.mentor", "Mentor")
                  : t("mentorship.entrepreneur", "Entreprenuer")}
              </th>
              <th>{t("mentorship.reportTitle", "Report title")}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => {
              return (
                <tr key={item.uuid}>
                  <td>{timeAgo(item.createdAt)}</td>
                  <td>
                    {userDetails.role === "Enterprenuer"
                      ? item.Mentor?.name || t("common.notProvided", "N/A")
                      : item.Entreprenuer?.name ||
                        t("common.notProvided", "N/A")}
                  </td>
                  <td>{item.title}</td>
                  <td>
                    <Link
                      className="text-primary font-bold hover:scale-105 transition-all"
                      href={`/dashboard/mentorReport/${item.uuid}`}
                    >
                      {t("mentorship.viewReport", "View Report")}
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Pagination Controls */}
      {data.length > 0 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-black/10">
          <div className="text-sm text-gray-600">
            {t("common.showing", "Showing")}{" "}
            {(pagination.page - 1) * pagination.limit + 1}{" "}
            {t("common.to", "to")}{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
            {t("common.of", "of")} {pagination.total}{" "}
            {t("common.results", "results")}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(1)}
              disabled={pagination.page === 1}
              className="px-3 py-1 rounded border border-black/10 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {t("common.first", "First")}
            </button>
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-3 py-1 rounded border border-black/10 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {t("common.previous", "Previous")}
            </button>

            <div className="flex items-center gap-1">
              {[...Array(pagination.totalPages)].map((_, index) => {
                const pageNumber = index + 1;
                // Show first page, last page, current page, and pages around current
                if (
                  pageNumber === 1 ||
                  pageNumber === pagination.totalPages ||
                  (pageNumber >= pagination.page - 1 &&
                    pageNumber <= pagination.page + 1)
                ) {
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => handlePageChange(pageNumber)}
                      className={`px-3 py-1 rounded transition-all ${
                        pagination.page === pageNumber
                          ? "bg-primary text-white font-semibold"
                          : "border border-black/10 hover:bg-gray-50"
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                } else if (
                  pageNumber === pagination.page - 2 ||
                  pageNumber === pagination.page + 2
                ) {
                  return (
                    <span key={pageNumber} className="px-2">
                      ...
                    </span>
                  );
                }
                return null;
              })}
            </div>

            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="px-3 py-1 rounded border border-black/10 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {t("common.next", "Next")}
            </button>
            <button
              onClick={() => handlePageChange(pagination.totalPages)}
              disabled={pagination.page === pagination.totalPages}
              className="px-3 py-1 rounded border border-black/10 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {t("common.last", "Last")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Page;
