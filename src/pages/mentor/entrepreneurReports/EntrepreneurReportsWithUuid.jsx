"use client";

import { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Loader from "@/components/common/Loader";
import { timeAgo } from "@/utils/time_ago";
import { getMentorEntrepreneurReports } from "@/controllers/mentorReportsController";
import Link from "@/utils/link";
import NoData from "@/component/noData";
import { UserContext } from "../../../layouts/DashboardLayout";

const EntrepreneurReportsPage = () => {
  const { uuid } = useParams();
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

    getMentorEntrepreneurReports(
      userDetails.uuid,
      uuid,
      page,
      pagination.limit,
    )
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
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl min-h-[320px] shadow-xl">
        <img
          src="/images/mentor_hero.svg"
          alt="Mentor Reports"
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/30" />

        <div className="relative z-10 flex h-full items-center px-8 py-14 md:px-14">
          <div className="max-w-3xl text-white">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur-md">
              <span className="h-2.5 w-2.5 rounded-full bg-orange-400" />
              Mentor Management
            </div>

            <h1 className="mt-8 text-4xl font-bold tracking-tight leading-tight">
              Mentor Reports
            </h1>

            <p className="mt-6 text-lg md:text-xl leading-relaxed text-white/90 max-w-2xl">
              Track entrepreneur progress, review mentorship engagement,
              monitor submitted reports, and maintain visibility into mentoring
              activities across the ecosystem.
            </p>

            <div className="mt-8 flex flex-wrap gap-6 text-sm md:text-base text-white/90">
              <div className="flex items-center gap-2">
                <span className="text-lg">📊</span>
                <span>Entrepreneur Progress Tracking</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-lg">📝</span>
                <span>Mentorship Reporting</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white min-h-[30vh] py-6 shadow mt-6 px-6 rounded-2xl">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Mentor Reports
            </h1>

            {data.length > 0 && data[0]?.Entreprenuer && (
              <p className="text-gray-600 mt-2">
                Reports for{" "}
                <span className="font-semibold text-gray-900">
                  {data[0].Entreprenuer.name}
                </span>

                {data[0].Entreprenuer.Business?.name && (
                  <span className="text-primary">
                    {" "}
                    ({data[0].Entreprenuer.Business.name})
                  </span>
                )}
              </p>
            )}
          </div>

          <Link
            href={`/dashboard/addEntreprenuerReport/${uuid}`}
            className="inline-flex items-center justify-center px-5 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all duration-300 font-medium shadow-md"
          >
            + Submit New Report
          </Link>
        </div>

        {data.length < 1 ? (
          <NoData message="No reports submitted for this entrepreneur yet" />
        ) : (
          <div className="overflow-x-auto rounded-2xl shadow-sm">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">
                    Reported
                  </th>

                  <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">
                    Mentor
                  </th>

                  <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">
                    Report Title
                  </th>

                  <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">
                    Meeting Date
                  </th>

                  <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {data.map((item) => {
                  return (
                    <tr
                      key={item.uuid}
                      className="hover:bg-gray-50/80 transition-all"
                    >
                      <td className="py-4 px-4 text-gray-700">
                        {timeAgo(item.createdAt)}
                      </td>

                      <td className="py-4 px-4 text-gray-700">
                        {item.Mentor?.name || "N/A"}
                      </td>

                      <td className="py-4 px-4 font-medium text-gray-900">
                        {item.title}
                      </td>

                      <td className="py-4 px-4 text-gray-700">
                        Not Specified
                      </td>

                      <td className="py-4 px-4">
                        <Link
                          className="inline-flex items-center text-primary font-semibold hover:underline"
                          href={`/dashboard/mentorReport/${item.uuid}`}
                        >
                          View Report
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data.length > 0 && (
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6 pt-4">
            <div className="text-sm text-gray-600">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
              {Math.min(
                pagination.page * pagination.limit,
                pagination.total,
              )}{" "}
              of {pagination.total} results
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => handlePageChange(1)}
                disabled={pagination.page === 1}
                className="px-3 py-2 rounded-lg bg-white shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                First
              </button>

              <button
                onClick={() =>
                  handlePageChange(pagination.page - 1)
                }
                disabled={pagination.page === 1}
                className="px-3 py-2 rounded-lg bg-white shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Previous
              </button>

              <div className="flex items-center gap-1">
                {[...Array(pagination.totalPages)].map((_, index) => {
                  const pageNumber = index + 1;

                  if (
                    pageNumber === 1 ||
                    pageNumber === pagination.totalPages ||
                    (pageNumber >= pagination.page - 1 &&
                      pageNumber <= pagination.page + 1)
                  ) {
                    return (
                      <button
                        key={pageNumber}
                        onClick={() =>
                          handlePageChange(pageNumber)
                        }
                        className={`px-4 py-2 rounded-lg transition-all ${
                          pagination.page === pageNumber
                            ? "bg-primary text-white font-semibold shadow"
                            : "bg-white shadow-sm hover:bg-gray-50"
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  }

                  if (
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
                onClick={() =>
                  handlePageChange(pagination.page + 1)
                }
                disabled={
                  pagination.page === pagination.totalPages
                }
                className="px-3 py-2 rounded-lg bg-white shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Next
              </button>

              <button
                onClick={() =>
                  handlePageChange(pagination.totalPages)
                }
                disabled={
                  pagination.page === pagination.totalPages
                }
                className="px-3 py-2 rounded-lg bg-white shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Last
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EntrepreneurReportsPage;