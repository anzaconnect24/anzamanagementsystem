"use client";

import { useContext, useEffect, useState, useCallback } from "react";
import { getInvestors } from "@/controllers/user_controller";
import Loader from "@/components/common/Loader";
import NoData from "@/component/noData";
import Image from "@/utils/image";
import { useRouter } from "@/utils/navigation";
import { useTranslation } from "../../../locales";
import { UserContext } from "../../../layouts/DashboardLayout";
import {
  FaLayerGroup,
  FaSearch,
  FaMoneyBillWave,
  FaFileContract,
  FaMapMarkerAlt,
  FaArrowRight,
} from "react-icons/fa";

const Page = () => {
  const { t, isSwahili } = useTranslation();
  const router = useRouter();
  const { userDetails } = useContext(UserContext);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [keyword, setKeyword] = useState("");
  const [filters, setFilters] = useState({
    sector: "All Sectors",
    ticketSize: "All Ticket Sizes",
    structure: "All Structures",
  });

  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "asc",
  });

  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [count, setCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [openDropdown, setOpenDropdown] = useState(null);

  const filterOptions = {
    sector: {
      label: t("users.sector", "Sector"),
      options: [
        "All Sectors",
        "Technology",
        "Healthcare",
        "Education",
        "Agriculture",
        "Clean Energy",
        "Water Sanitation and Hygiene",
        "Fintech",
      ],
    },
    ticketSize: {
      label: t("users.ticketSize", "Ticket Size"),
      options: [
        "All Ticket Sizes",
        "100K - 200K",
        "300K - 400K",
        "500K - 600K",
        "700K - 800K",
        "900K+",
      ],
    },
    structure: {
      label: t("users.structure", "Structure"),
      options: [
        "All Structures",
        "Equity",
        "Debt",
        "Grant",
        "Convertible Note",
        "Revenue Share",
      ],
    },
  };

  const sortOptions = [
    { value: "name", label: t("users.name", "Name") },
    { value: "sector", label: t("users.sector", "Sector") },
    { value: "ticketSize", label: t("users.ticketSize", "Ticket Size") },
    { value: "structure", label: t("users.structure", "Structure") },
  ];

  const displayFilterValue = useCallback(
    (type, value) => {
      if (type === "sector") {
        const map = {
          "All Sectors": t("users.allSectors", "All Sectors"),
          Technology: t("users.technology", "Technology"),
          Healthcare: t("users.healthcare", "Healthcare"),
          Education: t("users.education", "Education"),
          Agriculture: t("users.agriculture", "Agriculture"),
          "Clean Energy": t("users.cleanEnergy", "Clean Energy"),
          "Water Sanitation and Hygiene": t(
            "users.waterSanitationHygiene",
            "Water Sanitation and Hygiene"
          ),
          Fintech: t("users.fintech", "Fintech"),
        };

        return map[value] || value;
      }

      if (type === "ticketSize") {
        if (value === "All Ticket Sizes") {
          return t("users.allTicketSizes", "All Ticket Sizes");
        }

        return value;
      }

      if (type === "structure") {
        const map = {
          "All Structures": t("users.allStructures", "All Structures"),
          Equity: t("users.equity", "Equity"),
          Debt: t("users.debt", "Debt"),
          Grant: t("users.grant", "Grant"),
          "Convertible Note": t("users.convertibleNote", "Convertible Note"),
          "Revenue Share": t("users.revenueShare", "Revenue Share"),
        };

        return map[value] || value;
      }

      return value;
    },
    [t]
  );

  const getDefaultFilterValue = (key) => {
    return filterOptions[key]?.options?.[0] || "";
  };

  const isFiltering =
    Object.values(filters).some((value) => !value.startsWith("All")) || keyword;

  const fetchData = async () => {
    setLoading(true);

    try {
      setError(null);

      const response = await getInvestors(limit, page, keyword);

      if (!response || !response.data) {
        throw new Error("Failed to fetch investors data");
      }

      let processedData = [...response.data];

      if (isFiltering) {
        if (filters.sector !== "All Sectors") {
          processedData = processedData.filter(
            (item) => item.sector === filters.sector
          );
        }

        if (filters.ticketSize !== "All Ticket Sizes") {
          processedData = processedData.filter(
            (item) => item.ticketSize === filters.ticketSize
          );
        }

        if (filters.structure !== "All Structures") {
          processedData = processedData.filter(
            (item) => item.structure === filters.structure
          );
        }
      }

      processedData.sort((a, b) => {
        const direction = sortConfig.direction === "asc" ? 1 : -1;

        switch (sortConfig.key) {
          case "name":
            return direction * ((a.name || "").localeCompare(b.name || "") || 0);

          case "sector":
            return (
              direction * ((a.sector || "").localeCompare(b.sector || "") || 0)
            );

          case "ticketSize": {
            const getTicketValue = (ticket) => {
              if (!ticket) return 0;
              const match = ticket.match(/(\d+)K/);
              return match ? parseInt(match[1], 10) : 0;
            };

            return (
              direction *
              (getTicketValue(a.ticketSize) - getTicketValue(b.ticketSize))
            );
          }

          case "structure":
            return (
              direction *
              ((a.structure || "").localeCompare(b.structure || "") || 0)
            );

          default:
            return 0;
        }
      });

      setUsers(processedData);
      setCount(response.count || 0);
      setTotalPages(isFiltering ? 1 : response.totalPages || 1);
    } catch (err) {
      setError(err.message || "An error occurred while fetching data");
      console.error("Error fetching investors:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, limit, filters, sortConfig, keyword]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdown && !event.target.closest(".dropdown-container")) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdown]);

  const toggleDropdown = (name) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  const handleFilterChange = (type, value) => {
    setFilters((prev) => ({
      ...prev,
      [type]: value,
    }));

    setPage(1);
    setOpenDropdown(null);
  };

  const handleSortChange = (key) => {
    setSortConfig((prev) => ({
      key,
      direction:
        prev.key === key ? (prev.direction === "asc" ? "desc" : "asc") : "asc",
    }));

    setOpenDropdown(null);
  };

  const handleSearch = (e) => {
    setKeyword(e.target.value);
    setPage(1);
  };

  const handleInvestorClick = (uuid) => {
    if (!uuid) return;

    if (userDetails.role === "Enterprenuer") {
      router.push(`/dashboard/investors/details/${uuid}`);
    } else {
      router.push(`/dashboard/investors/${uuid}`);
    }
  };

  const getInvestmentType = (investor) => {
    const values = Object.values(
      investor?.InvestorProfile?.investmentType || {}
    );

    return values.length > 0
      ? values.join(", ")
      : t("users.structureNotSpecified", "Structure not specified");
  };

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#ffffff] p-6">
        <div className="rounded-2xl bg-white p-8 text-center shadow-md">
          <h3 className="mb-2 text-xl font-bold text-[#172033]">
            Something went wrong
          </h3>

          <p className="mb-5 text-[#6f6f72]">{error}</p>

          <button
            onClick={fetchData}
            className="rounded-lg bg-[#c9672b] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#b85a22]"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (loading) return <Loader />;

  const totalPaginationPages = Math.ceil(count / limit);

  return (
    <div className="min-h-screen px-6 py-4">
      {/* HERO */}
      <div className="relative mb-10 min-h-[320px] overflow-hidden rounded-2xl bg-black shadow-sm">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/images/investors_hero.svg')",
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-[#c9672b]/30" />

        <div className="relative z-10 max-w-3xl p-10 text-white">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-sm font-medium shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#f08a3c]" />
            Investor Network
          </span>

          <h2 className="mb-3 text-4xl font-bold leading-tight drop-shadow-lg">
            Investors
          </h2>

          <p className="mb-6 text-lg text-white/85 drop-shadow-md">
            Discover investors supporting growth-focused businesses through
            equity, debt, grants, convertible notes, and revenue-share financing.
          </p>

          <div className="flex flex-wrap items-center gap-6 text-sm text-white/85">
            <span className="flex items-center gap-2">
              <FaLayerGroup />
              Investors
            </span>

            <span className="flex items-center gap-2">
              <FaMoneyBillWave />
              Funding Profiles
            </span>
          </div>
        </div>
      </div>

      <h2 className="mb-6 text-2xl font-bold text-[#172033]">
        Available Investors
      </h2>

      <div className="mb-8 rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            {Object.entries(filterOptions).map(([key, value]) => (
              <div
                key={key}
                className="dropdown-container relative inline-block"
              >
                <button
                  onClick={() => toggleDropdown(key)}
                  className={`inline-flex items-center gap-2 rounded-md border px-4 py-3 text-sm transition-colors ${
                    filters[key] !== getDefaultFilterValue(key)
                      ? "border-green-600 bg-green-50 text-green-700"
                      : "border-black/10 bg-white text-[#6f6f72] hover:border-green-600"
                  }`}
                >
                  <span>{displayFilterValue(key, filters[key])}</span>
                  <span>{openDropdown === key ? "⌃" : "⌄"}</span>
                </button>

                {openDropdown === key && (
                  <div className="absolute z-20 mt-2 max-h-64 w-64 overflow-y-auto rounded-xl border border-black/10 bg-white shadow-lg">
                    {value.options.map((option) => (
                      <button
                        key={option}
                        onClick={() => handleFilterChange(key, option)}
                        className={`block w-full px-4 py-2 text-left text-sm ${
                          filters[key] === option
                            ? "bg-green-50 text-green-700"
                            : "text-[#6f6f72] hover:bg-[#ffffff]"
                        }`}
                      >
                        {displayFilterValue(key, option)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <div className="dropdown-container relative inline-block">
              <button
                onClick={() => toggleDropdown("sort")}
                className="inline-flex items-center gap-2 rounded-md border border-black/10 bg-white px-4 py-3 text-sm text-[#6f6f72] transition-colors hover:border-green-600"
              >
                <span>
                  {t("users.sortBy", "Sort By")}:{" "}
                  {sortOptions.find((opt) => opt.value === sortConfig.key)
                    ?.label || "Name"}
                </span>
                <span>{openDropdown === "sort" ? "⌃" : "⌄"}</span>
              </button>

              {openDropdown === "sort" && (
                <div className="absolute z-20 mt-2 w-56 rounded-xl border border-black/10 bg-white shadow-lg">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleSortChange(option.value)}
                      className={`block w-full px-4 py-2 text-left text-sm ${
                        sortConfig.key === option.value
                          ? "bg-green-50 text-green-700"
                          : "text-[#6f6f72] hover:bg-[#ffffff]"
                      }`}
                    >
                      {option.label}

                      {sortConfig.key === option.value && (
                        <span className="float-right">
                          {sortConfig.direction === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="relative ml-auto w-full sm:w-72">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8f98]" />

            <input
              type="text"
              placeholder={t("users.searchInvestors", "Search investors...")}
              value={keyword}
              onChange={handleSearch}
              className="w-full rounded-md border border-black/10 bg-[#ffffff] px-4 py-3 pl-10 text-sm text-[#172033] outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
            />
          </div>
        </div>
      </div>

      <div className="relative z-0">
        {users.length < 1 ? (
          <NoData />
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {users.map((investor, index) => (
              <div
                key={investor.uuid || index}
                onClick={() => handleInvestorClick(investor.uuid)}
                className="group cursor-pointer overflow-hidden rounded-xl bg-white shadow-md transition duration-200 hover:scale-[1.02] hover:shadow-lg"
              >
                <div className="relative h-56 overflow-hidden bg-black">
                  <Image
                    src={investor.image || "/images/default-avatar.png"}
                    alt={investor.name || "Investor profile"}
                    fill
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                  <div className="absolute bottom-4 left-4">
                    <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 shadow-sm backdrop-blur-sm">
                      {isSwahili
                        ? investor?.InvestorProfile?.BusinessSector?.swName
                        : investor?.InvestorProfile?.BusinessSector?.name ||
                          t("users.noSector", "No Sector")}
                    </span>
                  </div>
                </div>

                <div className="flex min-h-[250px] flex-col p-5">
                  <h3 className="mb-2 line-clamp-2 text-lg font-bold text-[#111827]">
                    {investor.name ||
                      t("users.unnamedInvestor", "Unnamed Investor")}
                  </h3>

                  <p className="mb-5 line-clamp-1 text-sm text-[#6f6f72]">
                    {investor.email ||
                      t("users.noEmailProvided", "No email provided")}
                  </p>

                  <div className="space-y-3 text-sm text-[#6f6f72]">
                    <div className="flex items-center gap-2">
                      <FaMoneyBillWave className="shrink-0" />
                      <span className="line-clamp-1">
                        {investor?.InvestorProfile?.investmentSize ||
                          t(
                            "users.ticketSizeNotSpecified",
                            "Ticket size not specified"
                          )}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <FaFileContract className="shrink-0" />
                      <span className="line-clamp-1">
                        {getInvestmentType(investor)}
                      </span>
                    </div>

                    {investor.location && (
                      <div className="flex items-center gap-2">
                        <FaMapMarkerAlt className="shrink-0" />
                        <span className="line-clamp-1">
                          {investor.location}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-auto flex items-center justify-between border-t border-black/10 pt-4 text-xs text-[#8a8f98]">
                    <span className="flex items-center gap-1">
                      <FaMoneyBillWave />
                      Investor
                    </span>

                    <span className="flex items-center gap-1 font-medium text-green-600">
                      {t("users.viewProfile", "View Profile")}
                      <FaArrowRight />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {count > 0 && (
          <div className="mt-10 rounded-2xl bg-white px-6 py-5 shadow-sm">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <p className="text-sm text-[#6f6f72]">
                Showing {(page - 1) * limit + 1} -{" "}
                {Math.min(page * limit, count)} of {count} Investors
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-black/10 bg-white px-5 py-2.5 text-sm text-[#8a8f98] transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>

                {[...Array(Math.min(10, totalPaginationPages))].map(
                  (_, idx) => {
                    let startPage = Math.max(1, page - 4);
                    let endPage = Math.min(
                      totalPaginationPages,
                      startPage + 9
                    );

                    if (endPage - startPage < 9) {
                      startPage = Math.max(1, endPage - 9);
                    }

                    const pageNum = startPage + idx;
                    if (pageNum > totalPaginationPages) return null;

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                          page === pageNum
                            ? "bg-primary-gradient text-white"
                            : "border border-black/10 bg-white text-[#6f6f72] hover:border-primary hover:text-primary"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                )}

                <button
                  onClick={() =>
                    setPage((prev) =>
                      Math.min(totalPaginationPages, prev + 1)
                    )
                  }
                  disabled={page === totalPaginationPages}
                  className="rounded-lg border border-black/10 bg-white px-5 py-2.5 text-sm text-[#6f6f72] transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;