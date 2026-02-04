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
import { BiUser } from "react-icons/bi";
import { timeAgo } from "@/utils/time_ago";
import { useTranslation } from "@/locales";

const InterestedEntrepreneursApplications = () => {
  const { t } = useTranslation();
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchApplications();
  }, [currentPage]);

  useEffect(() => {
    filterApplications();
  }, [searchTerm, applications]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      // For investors, this will get applications sent to them
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

    if (searchTerm) {
      filtered = filtered.filter((app) => {
        const searchLower = searchTerm.toLowerCase();
        return (
          app.Entrepreneur?.name?.toLowerCase().includes(searchLower) ||
          app.Entrepreneur?.email?.toLowerCase().includes(searchLower) ||
          app.amount?.toString().includes(searchLower) ||
          app.purposeOfInvestment?.toLowerCase().includes(searchLower)
        );
      });
    }

    setFilteredApplications(filtered);
  };

  const getInvestorStatusBadge = (status) => {
    const statusLower = status?.toLowerCase() || "pending";

    const statusConfig = {
      pending: {
        bg: "bg-warning/10",
        text: "text-warning",
        icon: <HiOutlineClock className="w-4 h-4" />,
        label: t("investment.pending", "Pending"),
      },
      interested: {
        bg: "bg-blue-100",
        text: "text-blue-600",
        icon: <HiOutlineCheckCircle className="w-4 h-4" />,
        label: t("investment.interested", "Interested"),
      },
      approved: {
        bg: "bg-success/10",
        text: "text-success",
        icon: <HiOutlineCheckCircle className="w-4 h-4" />,
        label: t("investment.approved", "Approved"),
      },
      rejected: {
        bg: "bg-danger/10",
        text: "text-danger",
        icon: <HiOutlineXCircle className="w-4 h-4" />,
        label: t("investment.rejected", "Rejected"),
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

  // Group applications by entrepreneur
  const entrepreneursMap = new Map();
  filteredApplications.forEach((app) => {
    const entrepreneurId = app.Entrepreneur?.uuid;
    if (entrepreneurId) {
      if (!entrepreneursMap.has(entrepreneurId)) {
        entrepreneursMap.set(entrepreneurId, {
          entrepreneur: app.Entrepreneur,
          applications: [],
          totalAmount: 0,
        });
      }
      const data = entrepreneursMap.get(entrepreneurId);
      data.applications.push(app);
      data.totalAmount += parseFloat(app.amount || 0);
    }
  });

  const entrepreneurs = Array.from(entrepreneursMap.values());

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
                <BiUser className="text-3xl text-primary" />
              </div>
              <div>
                <h4 className="text-xl font-semibold text-black dark:text-white flex items-center gap-3 mb-2">
                  {t(
                    "investment.interestedEntrepreneurs",
                    "Interested Entrepreneurs",
                  )}
                  <span className="px-3 py-1 text-sm bg-primary/10 text-primary rounded-full font-medium">
                    {entrepreneurs.length}{" "}
                    {t("investment.entrepreneurs", "Entrepreneurs")}
                  </span>
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t(
                    "investment.entrepreneursDescription",
                    "Entrepreneurs who have sent you investment applications",
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-6">
            <div className="relative">
              <input
                type="text"
                placeholder={t(
                  "investment.searchEntrepreneurs",
                  "Search by entrepreneur name, email, or amount...",
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

        {/* Entrepreneurs List */}
        {entrepreneurs.length < 1 ? (
          <NoData />
        ) : (
          <div className="p-6">
            <div className="space-y-4">
              {entrepreneurs.map(
                ({ entrepreneur, applications, totalAmount }, index) => (
                  <div
                    key={entrepreneur.uuid || index}
                    className="p-6 bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-xl hover:shadow-lg transition-all duration-200"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      {/* Entrepreneur Info */}
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                          {entrepreneur.profile_picture ? (
                            <img
                              src={entrepreneur.profile_picture}
                              alt={entrepreneur.name}
                              className="w-16 h-16 rounded-full object-cover"
                            />
                          ) : (
                            <BiUser className="text-3xl text-primary" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h5 className="text-lg font-semibold text-black dark:text-white mb-1">
                            {entrepreneur.name ||
                              t(
                                "investment.unknownEntrepreneur",
                                "Unknown Entrepreneur",
                              )}
                          </h5>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                            {entrepreneur.email}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {entrepreneur.phone}
                          </p>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                        <div className="text-center md:text-right">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            {t("investment.applications", "Applications")}
                          </p>
                          <p className="text-xl font-bold text-primary">
                            {applications.length}
                          </p>
                        </div>
                        <div className="text-center md:text-right">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            {t("investment.totalRequested", "Total Requested")}
                          </p>
                          <p className="text-xl font-bold text-success">
                            {formatCurrency(totalAmount)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Applications Summary */}
                    <div className="mt-4 pt-4 border-t border-stroke dark:border-strokedark">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {applications.map((app, idx) => (
                          <Link
                            key={app.uuid || idx}
                            href={`/dashboard/investmentApplications/${app.uuid}`}
                            className="flex items-center justify-between p-3 rounded-lg bg-gray-1 dark:bg-meta-4 hover:bg-primary/5 transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <RiMoneyDollarCircleLine className="text-xl text-primary" />
                              <div>
                                <p className="text-sm font-medium text-black dark:text-white">
                                  {formatCurrency(app.amount)}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {timeAgo(app.createdAt)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getInvestorStatusBadge(app.investorStatus)}
                              <HiOutlineEye className="text-gray-400" />
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                ),
              )}
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
                  {[...Array(Math.min(5, totalPages))].map((_, i) => (
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

export default InterestedEntrepreneursApplications;
