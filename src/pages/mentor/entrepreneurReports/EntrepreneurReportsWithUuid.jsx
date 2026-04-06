"use client";
import { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Loader from "@/components/common/Loader";
import { timeAgo } from "@/utils/time_ago";
import { getMentorEntrepreneurReports } from "@/controllers/mentorReportsController";
import Link from "@/utils/link";
import NoData from "@/component/noData";
import { useTranslation } from "@/locales";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { UserContext } from "../../../layouts/DashboardLayout";

const EntrepreneurReportsPage = () => {
  const { t } = useTranslation();
  const { uuid } = useParams(); // This is the entrepreneur's user UUID
  const { userDetails } = useContext(UserContext);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const fetchReports = (page = 1) => {
    if (!userDetails?.uuid) return;

    setLoading(true);
    getMentorEntrepreneurReports(userDetails.uuid, uuid, page, pagination.limit)
      .then((res) => {
        setData(res.reports || []);
        setPagination(res.pagination || pagination);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching reports:", error);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (userDetails?.uuid) {
      fetchReports(1);
    }
  }, [uuid, userDetails]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchReports(newPage);
    }
  };

  return loading ? (
    <Loader />
  ) : (
    <div>
      <Breadcrumb
        prevLink="/dashboard/mentorEntreprenuers"
        prevPage={t("common.back", "Back")}
        pageName={t("mentorship.entrepreneurReports", "Entrepreneur Reports")}
      />

      <div className="bg-white min-h-[30vh] py-6 shadow mt-6 px-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">
              {t("mentorship.mentorReports", "Mentor Reports")}
            </h1>
            {data.length > 0 && data[0]?.Entreprenuer && (
              <p className="text-gray-600 mt-1">
                {t("mentorship.reportsFor", "Reports for")}{" "}
                <span className="font-semibold">
                  {data[0].Entreprenuer.name}
                </span>
                {data[0].Entreprenuer.Business?.name && (
                  <span> ({data[0].Entreprenuer.Business.name})</span>
                )}
              </p>
            )}
          </div>
          <Link
            href={`/dashboard/addEntreprenuerReport/${uuid}`}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-all duration-300"
          >
            {t("mentorship.submitNewReport", "Submit New Report")}
          </Link>
        </div>

        {data.length < 1 ? (
          <NoData
            message={t(
              "mentorship.noReportsYet",
              "No reports submitted for this entrepreneur yet",
            )}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="mt-8 w-full">
              <thead>
                <tr className="border-b border-black/10">
                  <th className="text-left py-3 px-4">
                    {t("mentorship.reported", "Reported")}
                  </th>
                  <th className="text-left py-3 px-4">
                    {t("mentorship.mentor", "Mentor")}
                  </th>
                  <th className="text-left py-3 px-4">
                    {t("mentorship.reportTitle", "Report Title")}
                  </th>
                  <th className="text-left py-3 px-4">
                    {t("mentorship.meetingDate", "Meeting Date")}
                  </th>
                  <th className="text-left py-3 px-4">
                    {t("common.actions", "Actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => {
                  return (
                    <tr key={item.uuid} className="border-b border-black/10">
                      <td className="py-3 px-4">{timeAgo(item.createdAt)}</td>
                      <td className="py-3 px-4">
                        {item.Mentor?.name || t("common.notProvided", "N/A")}
                      </td>
                      <td className="py-3 px-4">{item.title}</td>
                      <td className="py-3 px-4">
                        {item.meetingDate
                          ? new Date(item.meetingDate).toLocaleDateString()
                          : t("common.notProvided", "N/A")}
                      </td>
                      <td className="py-3 px-4">
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
          </div>
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
    </div>
  );
};

export default EntrepreneurReportsPage;
