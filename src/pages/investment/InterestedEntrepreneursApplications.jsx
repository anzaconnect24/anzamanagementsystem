"use client";

import { useEffect, useState } from "react";
import { getMyInvestmentApplications } from "@/controllers/investment_application_controller";
import Link from "@/utils/link";
import Loader from "@/components/common/Loader";
import NoData from "@/component/noData";
import {
  HiOutlineSearch,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
} from "react-icons/hi";
import { RiMoneyDollarCircleLine } from "react-icons/ri";
import { BiUser } from "react-icons/bi";
import { timeAgo } from "@/utils/time_ago";
import { useTranslation } from "@/locales";

const InterestedStartupsApplications = () => {
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
      const searchLower = searchTerm.toLowerCase();

      filtered = filtered.filter((app) => {
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
        className: "bg-yellow-50 text-yellow-700",
        icon: <HiOutlineClock className="h-4 w-4" />,
        label: t("investment.pending", "Pending"),
      },
      interested: {
        className: "bg-blue-50 text-blue-700",
        icon: <HiOutlineCheckCircle className="h-4 w-4" />,
        label: t("investment.interested", "Interested"),
      },
      approved: {
        className: "bg-green-50 text-green-700",
        icon: <HiOutlineCheckCircle className="h-4 w-4" />,
        label: t("investment.approved", "Approved"),
      },
      rejected: {
        className: "bg-red-50 text-red-700",
        icon: <HiOutlineXCircle className="h-4 w-4" />,
        label: t("investment.rejected", "Rejected"),
      },
    };

    const config = statusConfig[statusLower] || statusConfig.pending;

    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${config.className}`}
      >
        {config.icon}
        {config.label}
      </span>
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

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-4">
      <div className="relative mb-10 min-h-[320px] overflow-hidden rounded-2xl bg-black shadow-sm">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/images/startups_hero_page.svg')",
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-[#c9672b]/30" />

        <div className="relative z-10 max-w-3xl p-10 text-white">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-sm font-medium shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#f08a3c]" />
            Investor Pipeline
          </span>

          <h1 className="mb-3 text-4xl font-bold leading-tight drop-shadow-lg">
            Interested Entrepreneurs
          </h1>

          <p className="mb-6 text-lg text-white/85 drop-shadow-md">
            Review entrepreneurs who have submitted investment applications,
            assess their funding requests, and open the relevant application
            details for follow-up.
          </p>
        </div>
      </div>

      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#172033]">
            {t("investment.interestedStartups", "Interested Entrepreneurs")}
          </h2>

          <p className="mt-1 text-sm text-[#6f6f72]">
            {t(
              "investment.entrepreneursDescription",
              "Entrepreneurs who have sent you investment applications",
            )}
          </p>
        </div>

        <div className="relative w-full md:w-[360px]">
          <HiOutlineSearch className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8a8f98]" />

          <input
            type="text"
            placeholder={t(
              "investment.searchEntrepreneurs",
              "Search by entrepreneur name, email, or amount...",
            )}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-black/10 bg-transparent py-3 pl-12 pr-4 text-sm text-[#172033] outline-none backdrop-blur-sm transition focus:border-green-600 focus:ring-1 focus:ring-green-600"
          />
        </div>
      </div>

      {entrepreneurs.length < 1 ? (
        <NoData />
      ) : (
        <div className="space-y-6">
          {entrepreneurs.map(({ entrepreneur, applications, totalAmount }) => (
            <div
              key={entrepreneur.uuid}
              className="rounded-2xl border border-black/10 p-6 backdrop-blur-sm transition duration-200 hover:shadow-lg"
            >
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-green-50 text-green-700">
                    {entrepreneur.profile_picture ? (
                      <img
                        src={entrepreneur.profile_picture}
                        alt={entrepreneur.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <BiUser className="text-3xl" />
                    )}
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-[#172033]">
                      {entrepreneur.name ||
                        t(
                          "investment.unknownEntrepreneur",
                          "Unknown Entrepreneur",
                        )}
                    </h3>

                    <p className="mt-1 text-sm text-[#6f6f72]">
                      {entrepreneur.email || "No email provided"}
                    </p>

                    <p className="mt-1 text-sm text-[#6f6f72]">
                      {entrepreneur.phone || "No phone provided"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 md:min-w-[260px]">
                  <div className="rounded-xl border border-black/10 p-4 text-center">
                    <p className="text-xs font-medium uppercase tracking-wide text-[#8a8f98]">
                      {t("investment.applications", "Applications")}
                    </p>

                    <p className="mt-2 text-2xl font-bold text-[#172033]">
                      {applications.length}
                    </p>
                  </div>

                  <div className="rounded-xl border border-black/10 p-4 text-center">
                    <p className="text-xs font-medium uppercase tracking-wide text-[#8a8f98]">
                      {t("investment.totalRequested", "Total Requested")}
                    </p>

                    <p className="mt-2 text-lg font-bold text-green-700">
                      {formatCurrency(totalAmount)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-black/10 pt-5">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {applications.map((app, idx) => (
                    <Link
                      key={app.uuid || idx}
                      href={`/dashboard/investmentApplications/${app.uuid}`}
                      className="group flex items-center justify-between gap-4 rounded-xl border border-black/10 bg-transparent p-4 transition hover:border-green-600 hover:bg-green-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-700">
                          <RiMoneyDollarCircleLine className="text-xl" />
                        </div>

                        <div>
                          <p className="text-sm font-bold text-[#172033]">
                            {formatCurrency(app.amount)}
                          </p>

                          <p className="mt-1 text-xs text-[#8a8f98]">
                            {timeAgo(app.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        {getInvestorStatusBadge(app.investorStatus)}

                        <span className="text-sm font-medium text-green-700 opacity-0 transition group-hover:opacity-100">
                          View
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {totalPages > 1 && (
            <div className="mt-10 rounded-2xl border border-black/10 px-6 py-5 backdrop-blur-sm">
              <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                <p className="text-sm text-[#6f6f72]">
                  {t("investment.showing", "Showing")}{" "}
                  {(currentPage - 1) * itemsPerPage + 1} -{" "}
                  {Math.min(currentPage * itemsPerPage, totalCount)}{" "}
                  {t("investment.of", "of")} {totalCount}{" "}
                  {t("investment.applications", "applications")}
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1}
                    className="rounded-lg border border-black/10 bg-transparent px-5 py-2.5 text-sm text-[#6f6f72] transition hover:border-green-600 hover:text-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {t("investment.previous", "Previous")}
                  </button>

                  {[...Array(Math.min(5, totalPages))].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                        currentPage === i + 1
                          ? "border border-green-600 bg-green-50 text-green-700"
                          : "border border-black/10 bg-transparent text-[#6f6f72] hover:border-green-600 hover:text-green-700"
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
                    className="rounded-lg border border-black/10 bg-transparent px-5 py-2.5 text-sm text-[#6f6f72] transition hover:border-green-600 hover:text-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {t("investment.next", "Next")}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InterestedStartupsApplications;