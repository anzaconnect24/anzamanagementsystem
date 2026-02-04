"use client";
import { useEffect, useState } from "react";
import { getMyInvestmentApplications } from "@/controllers/investment_application_controller";
import Link from "@/utils/link";
import Loader from "@/components/common/Loader";
import NoData from "@/component/noData";
import {
  HiOutlineSearch,
  HiOutlineEye,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
} from "react-icons/hi";
import { RiMoneyDollarCircleLine } from "react-icons/ri";
import { BiFilterAlt } from "react-icons/bi";
import { timeAgo } from "@/utils/time_ago";
import { useTranslation } from "@/locales";

const InvestmentApplications = () => {
  const { t } = useTranslation();
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchApplications();
  }, [currentPage]);

  useEffect(() => {
    filterApplications();
  }, [searchTerm, applications, statusFilter]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const data = await getMyInvestmentApplications(currentPage, itemsPerPage);
      setApplications(data?.data || []);
      setTotalCount(data?.count || 0);
    } catch (error) {
      console.error("Error fetching applications:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterApplications = () => {
    let filtered = [...applications];

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((app) => app.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter((app) => {
        const searchLower = searchTerm.toLowerCase();
        return (
          app.amount?.toString().includes(searchLower) ||
          app.purposeOfInvestment?.toLowerCase().includes(searchLower) ||
          app.Investor?.name?.toLowerCase().includes(searchLower)
        );
      });
    }

    setFilteredApplications(filtered);
  };

  const getStatusBadge = (status) => {
    const statusLower = status?.toLowerCase() || "pending";

    const statusConfig = {
      pending: {
        bg: "bg-warning/10",
        text: "text-warning",
        icon: <HiOutlineClock className="w-4 h-4" />,
        label: t("investment.pending", "Pending"),
      },
      in_progress: {
        bg: "bg-blue-100",
        text: "text-blue-600",
        icon: <HiOutlineClock className="w-4 h-4" />,
        label: t("investment.inProgress", "In Progress"),
      },
      completed: {
        bg: "bg-success/10",
        text: "text-success",
        icon: <HiOutlineCheckCircle className="w-4 h-4" />,
        label: t("investment.completed", "Completed"),
      },
      dropped: {
        bg: "bg-danger/10",
        text: "text-danger",
        icon: <HiOutlineXCircle className="w-4 h-4" />,
        label: t("investment.dropped", "Dropped"),
      },
    };

    const config = statusConfig[statusLower] || statusConfig.pending;

    return (
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${config.bg} ${config.text}`}
      >
        {config.icon}
        <span className="text-sm font-medium">{config.label}</span>
      </div>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "TZS",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const stats = {
    all: applications.length,
    pending: applications.filter((a) => a.status === "pending").length,
    in_progress: applications.filter((a) => a.status === "in_progress").length,
    completed: applications.filter((a) => a.status === "completed").length,
    dropped: applications.filter((a) => a.status === "dropped").length,
  };

  return loading ? (
    <div className="flex items-center justify-center min-h-[400px] bg-white">
      <Loader />
    </div>
  ) : (
    <div className="container mx-auto px-4 py-8">
      <div className="rounded-2xl border border-stroke bg-white shadow-default min-h-[80vh] dark:border-strokedark dark:bg-boxdark overflow-hidden">
        {/* Header Section */}
        <div className="relative p-6 border-b border-stroke dark:border-strokedark bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <RiMoneyDollarCircleLine className="text-3xl text-primary" />
              </div>
              <div>
                <h4 className="text-xl font-semibold text-black dark:text-white flex items-center gap-3 mb-2">
                  {t(
                    "investment.investmentApplications",
                    "Investment Applications",
                  )}
                  <span className="px-3 py-1 text-sm bg-primary/10 text-primary rounded-full font-medium">
                    {totalCount} {t("investment.total", "Total")}
                  </span>
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t(
                    "investment.manageApplicationsDescription",
                    "View and manage your investment applications to investors",
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
            <div
              onClick={() => setStatusFilter("all")}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                statusFilter === "all"
                  ? "border-primary bg-primary/5"
                  : "border-stroke bg-white dark:border-strokedark dark:bg-boxdark"
              }`}
            >
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                {t("investment.allApplications", "All")}
              </p>
              <p className="text-2xl font-bold text-black dark:text-white">
                {stats.all}
              </p>
            </div>
            <div
              onClick={() => setStatusFilter("pending")}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                statusFilter === "pending"
                  ? "border-warning bg-warning/5"
                  : "border-stroke bg-white dark:border-strokedark dark:bg-boxdark"
              }`}
            >
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                {t("investment.pending", "Pending")}
              </p>
              <p className="text-2xl font-bold text-warning">{stats.pending}</p>
            </div>
            <div
              onClick={() => setStatusFilter("in_progress")}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                statusFilter === "in_progress"
                  ? "border-blue-600 bg-blue-50"
                  : "border-stroke bg-white dark:border-strokedark dark:bg-boxdark"
              }`}
            >
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                {t("investment.inProgress", "In Progress")}
              </p>
              <p className="text-2xl font-bold text-blue-600">
                {stats.in_progress}
              </p>
            </div>
            <div
              onClick={() => setStatusFilter("completed")}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                statusFilter === "completed"
                  ? "border-success bg-success/5"
                  : "border-stroke bg-white dark:border-strokedark dark:bg-boxdark"
              }`}
            >
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                {t("investment.completed", "Completed")}
              </p>
              <p className="text-2xl font-bold text-success">
                {stats.completed}
              </p>
            </div>
            <div
              onClick={() => setStatusFilter("dropped")}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                statusFilter === "dropped"
                  ? "border-danger bg-danger/5"
                  : "border-stroke bg-white dark:border-strokedark dark:bg-boxdark"
              }`}
            >
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                {t("investment.dropped", "Dropped")}
              </p>
              <p className="text-2xl font-bold text-danger">{stats.dropped}</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-6">
            <div className="relative">
              <input
                type="text"
                placeholder={t(
                  "investment.searchPlaceholder",
                  "Search by investor name, amount, or purpose...",
                )}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-stroke bg-white/80 backdrop-blur-sm py-3 pl-12 pr-4 outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark/80"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2">
                <HiOutlineSearch className="h-5 w-5 text-body dark:text-bodydark" />
              </span>
            </div>
          </div>
        </div>

        {/* Applications List */}
        {filteredApplications.length < 1 ? (
          <NoData />
        ) : (
          <div className="p-6">
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 mb-4 px-4 py-3 bg-gray-1 dark:bg-meta-4 rounded-lg">
              <div className="col-span-2">
                <p className="text-sm font-semibold text-black dark:text-white">
                  {t("investment.status", "Status")}
                </p>
              </div>
              <div className="col-span-3">
                <p className="text-sm font-semibold text-black dark:text-white">
                  {t("investment.investor", "Investor")}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-sm font-semibold text-black dark:text-white">
                  {t("investment.amount", "Amount")}
                </p>
              </div>
              <div className="col-span-3">
                <p className="text-sm font-semibold text-black dark:text-white">
                  {t("investment.purpose", "Purpose")}
                </p>
              </div>
              <div className="col-span-1">
                <p className="text-sm font-semibold text-black dark:text-white">
                  {t("investment.date", "Date")}
                </p>
              </div>
              <div className="col-span-1">
                <p className="text-sm font-semibold text-black dark:text-white text-right">
                  {t("investment.actions", "Actions")}
                </p>
              </div>
            </div>

            {/* Table Body */}
            <div className="space-y-3">
              {filteredApplications.map((application, index) => (
                <div
                  key={application.uuid || index}
                  className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-lg hover:shadow-md transition-all duration-200"
                >
                  {/* Status */}
                  <div className="col-span-1 md:col-span-2 flex items-center">
                    {getStatusBadge(application.status)}
                  </div>

                  {/* Investor */}
                  <div className="col-span-1 md:col-span-3 flex items-center">
                    <div>
                      <p className="text-sm font-medium text-black dark:text-white">
                        {application.Investor?.name ||
                          t("investment.unknownInvestor", "Unknown Investor")}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {application.Investor?.email || ""}
                      </p>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="col-span-1 md:col-span-2 flex items-center">
                    <p className="text-sm font-semibold text-primary">
                      {formatCurrency(application.amount)}
                    </p>
                  </div>

                  {/* Purpose */}
                  <div className="col-span-1 md:col-span-3 flex items-center">
                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                      {application.purposeOfInvestment ||
                        t("investment.noPurpose", "No purpose provided")}
                    </p>
                  </div>

                  {/* Date */}
                  <div className="col-span-1 md:col-span-1 flex items-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {timeAgo(application.createdAt)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 md:col-span-1 flex items-center justify-end">
                    <Link
                      href={`/dashboard/investmentApplications/${application.uuid}`}
                      className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all duration-200"
                    >
                      <HiOutlineEye className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-stroke dark:border-strokedark">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t("investment.showing", "Showing")}{" "}
                  {(currentPage - 1) * itemsPerPage + 1} -{" "}
                  {Math.min(currentPage * itemsPerPage, totalCount)}{" "}
                  {t("investment.of", "of")} {totalCount}{" "}
                  {t("investment.applications", "applications")}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-1 dark:hover:bg-meta-4 transition-all"
                  >
                    {t("investment.previous", "Previous")}
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        currentPage === i + 1
                          ? "bg-primary text-white"
                          : "border border-stroke dark:border-strokedark bg-white dark:bg-boxdark hover:bg-gray-1 dark:hover:bg-meta-4"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-1 dark:hover:bg-meta-4 transition-all"
                  >
                    {t("investment.next", "Next")}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InvestmentApplications;
