"use client";
import { useContext, useEffect, useState } from "react";
import { getEnterprenuers } from "../../../controllers/user_controller";
import Link from "next/link";
import Loader from "@/components/common/Loader";
import NoData from "@/app/component/noData";
import Image from "next/image";
import Pagination from "@/app/component/pagination";
import { UserContext } from "../../layout";
import { useTranslation } from "@/app/locales";
const Page = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [loading, setloading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [filters, setFilters] = useState({
    sector: "All Sectors",
    year: "All Years",
    program: "All Programs",
    revenue: "All Revenue",
  });
  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "asc",
  });
  const [currentPage, setcurrentPage] = useState(1);
  const [totalPages, settotalPages] = useState(1);
  const [limit, setLimit] = useState(20);
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  // Add states for dropdown visibility
  const [openDropdown, setOpenDropdown] = useState(null);
  const [allUsers, setAllUsers] = useState([]); // New state for all users
  const { userDetails } = useContext(UserContext);

  // Define filter and sort options
  const filterOptions = {
    sector: {
      label: "Sector",
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
    year: {
      label: "Year",
      options: ["All Years", "2024", "2023", "2022", "2021", "2020"],
    },
    program: {
      label: "Program",
      options: [
        "All Programs",
        "Investment Readiness",
        "Business Foundation",
        "Mentorship Program",
        "Accelerator",
      ],
    },
    revenue: {
      label: "Revenue",
      options: [
        "All Revenue",
        "0 - 10,000",
        "10,001 - 50,000",
        "50,001 - 100,000",
        "100,001 - 500,000",
        "500,001 - 1,000,000",
        "1,000,001+",
      ],
    },
  };

  const sortOptions = [
    { value: "name", label: "Name" },
    { value: "sector", label: "Sector" },
    { value: "date", label: "Date" },
    { value: "program", label: "Program" },
  ];

  // Check if any filters are active
  const isFiltering =
    Object.values(filters).some((value) => !value.startsWith("All")) || keyword;

  // Helper function to convert revenue filter to API parameters
  const getRevenueParams = (revenueFilter) => {
    const params = {};

    switch (revenueFilter) {
      case "0 - 20,000":
        params.minRevenue = 0;
        params.maxRevenue = 20000;
        break;
      case "20,001 - 50,000":
        params.minRevenue = 20001;
        params.maxRevenue = 50000;
        break;
      case "50,001 - 100,000":
        params.minRevenue = 50001;
        params.maxRevenue = 100000;
        break;
      case "100,001 - 500,000":
        params.minRevenue = 100001;
        params.maxRevenue = 500000;
        break;
      case "500,001 - 1,000,000":
        params.minRevenue = 500001;
        params.maxRevenue = 1000000;
        break;
      case "1,000,001+":
        params.minRevenue = 1000001;
        break;
      default:
        // "All Revenue" - no parameters needed
        break;
    }

    return params;
  };

  useEffect(() => {
    // If filtering, get all data at once
    const pageSize = isFiltering ? 1000 : limit;
    const pageNumber = isFiltering ? 1 : currentPage;

    // Build revenue parameters for API call
    const revenueParams = getRevenueParams(filters.revenue);

    getEnterprenuers(limit, page, keyword, revenueParams).then((body) => {
      console.log(body);
      let filteredData = [...body.data];
      applyFilters(filteredData);
      setCount(body.count);
      setUsers(filteredData);
      settotalPages(isFiltering ? 1 : body.totalPages);
      setloading(false);
    });
  }, [refresh, sortConfig, filters, page, keyword]);

  const applyFilters = (filteredData) => {
    if (isFiltering) {
      if (filters.sector !== "All Sectors") {
        filteredData = filteredData.filter(
          (item) => item.Business?.BusinessSector?.name === filters.sector
        );
      }

      if (filters.year !== "All Years") {
        filteredData = filteredData.filter(
          (item) =>
            new Date(item.Business?.createdAt).getFullYear().toString() ===
            filters.year
        );
      }

      if (filters.program !== "All Programs") {
        filteredData = filteredData.filter(
          (item) => item.Business?.program === filters.program
        );
      }

      // Revenue filtering is now handled by the backend, so we don't filter it here
    }

    // Apply sorting
    filteredData.sort((a, b) => {
      const direction = sortConfig.direction === "asc" ? 1 : -1;

      switch (sortConfig.key) {
        case "name":
          return (
            direction * (a.Business?.name?.localeCompare(b.Business?.name) || 0)
          );
        case "sector":
          return (
            direction *
            (a.Business?.BusinessSector?.name?.localeCompare(
              b.Business?.BusinessSector?.name
            ) || 0)
          );
        case "date":
          return (
            direction *
            (new Date(a.Business?.createdAt) - new Date(b.Business?.createdAt))
          );
        case "program":
          return (
            direction *
            (a.Business?.program?.localeCompare(b.Business?.program) || 0)
          );
        default:
          return 0;
      }
    });
  };
  // Handle dropdown toggle
  const toggleDropdown = (name) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  // Handle filter changes
  const handleFilterChange = (type, value) => {
    setFilters((prev) => ({
      ...prev,
      [type]: value,
    }));
    setOpenDropdown(null);
  };

  // Handle sort changes
  const handleSortChange = (key) => {
    setSortConfig((prev) => ({
      key,
      direction:
        prev.key === key ? (prev.direction === "asc" ? "desc" : "asc") : "asc",
    }));
    setOpenDropdown(null);
  };

  // Add this helper function at the top of the component
  const getBusinessName = (item) => {
    return (
      item?.Business?.name || t("users.unnamedBusiness", "Unnamed Business")
    );
  };

  // Translate option/value for filters without changing internal values
  const translateFilterValue = (value) => {
    switch (value) {
      // All*
      case "All Sectors":
        return t("users.allSectors", "All Sectors");
      case "All Years":
        return t("users.allYears", "All Years");
      case "All Programs":
        return t("users.allPrograms", "All Programs");
      case "All Revenue":
        return t("users.allRevenue", "All Revenue");
      // Sectors
      case "Technology":
        return t("users.technology", "Technology");
      case "Healthcare":
        return t("users.healthcare", "Healthcare");
      case "Education":
        return t("users.education", "Education");
      case "Agriculture":
        return t("users.agriculture", "Agriculture");
      case "Clean Energy":
        return t("users.cleanEnergy", "Clean Energy");
      case "Water Sanitation and Hygiene":
        return t(
          "users.waterSanitationHygiene",
          "Water Sanitation and Hygiene"
        );
      case "Fintech":
        return t("users.fintech", "Fintech");
      // Programs
      case "Investment Readiness":
        return t("users.investmentReadiness", "Investment Readiness");
      case "Business Foundation":
        return t("users.businessFoundation", "Business Foundation");
      case "Mentorship Program":
        return t("users.mentorshipProgram", "Mentorship Program");
      case "Accelerator":
        return t("users.accelerator", "Accelerator");
      default:
        return value; // numbers & ranges
    }
  };

  const translateSortLabel = (key) => {
    switch (key) {
      case "name":
        return t("common.name", "Name");
      case "sector":
        return t("users.sector", "Sector");
      case "date":
        return t("common.date", "Date");
      case "program":
        return t("users.program", "Program");
      default:
        return key;
    }
  };

  return loading ? (
    <Loader />
  ) : (
    <div className="p-4 md:p-6 lg:p-8 bg-gray-50 dark:bg-boxdark min-h-screen">
      <h1 className="text-2xl font-bold mb-4">
        {t("users.welcome", "Welcome")} {userDetails.name}!
      </h1>

      {/* Search and Filter Bar */}
      <div className="mb-8">
        {/* Member Count and Search */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-xl text-gray-600 dark:text-gray-300">
              {count} {t("users.members", "members")}
            </span>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder={t(
                "users.searchEntrepreneurs",
                "Search entrepreneurs..."
              )}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-64 px-4 py-2 rounded-md border border-white bg-white dark:bg-boxdark dark:border-gray-700 focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Filters and Sort */}
        <div className="flex flex-wrap gap-3">
          {/* Filter Dropdowns */}
          {Object.entries(filterOptions).map(([key, value]) => (
            <div key={key} className="relative inline-block">
              <button
                onClick={() => toggleDropdown(key)}
                className={`px-4 py-2 rounded-md border ${
                  filters[key] !== `All ${value.label}s`
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-white bg-white dark:bg-boxdark dark:border-gray-100"
                } flex items-center gap-2 hover:border-primary transition-colors`}
              >
                <span>{translateFilterValue(filters[key])}</span>
                <svg
                  className={`w-4 h-4 transition-transform ${
                    openDropdown === key ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {openDropdown === key && (
                <div className="absolute z-10 mt-1 w-48 rounded-md shadow-lg bg-white dark:bg-boxdark border border-gray-200 dark:border-gray-700">
                  {value.options.map((option) => (
                    <button
                      key={option}
                      onClick={() => handleFilterChange(key, option)}
                      className={`block w-full text-left px-4 py-2 text-sm ${
                        filters[key] === option
                          ? "bg-primary/10 text-primary"
                          : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-boxdark-2"
                      }`}
                    >
                      {translateFilterValue(option)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Sort Dropdown */}
          <div className="relative inline-block">
            <button
              onClick={() => toggleDropdown("sort")}
              className="px-4 py-2 rounded-md border border-white bg-white dark:bg-boxdark dark:border-gray-700 flex items-center gap-2 hover:border-primary transition-colors"
            >
              <span>
                {t("users.sortBy", "Sort:")}{" "}
                {translateSortLabel(sortConfig.key)}
              </span>
              <svg
                className={`w-4 h-4 transition-transform ${
                  openDropdown === "sort" ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {openDropdown === "sort" && (
              <div className="absolute z-10 mt-1 w-48 rounded-md shadow-lg bg-white dark:bg-boxdark border border-gray-200 dark:border-gray-700">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSortChange(option.value)}
                    className={`block w-full text-left px-4 py-2 text-sm ${
                      sortConfig.key === option.value
                        ? "bg-primary/10 text-primary"
                        : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-boxdark-2"
                    }`}
                  >
                    {translateSortLabel(option.value)}{" "}
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

        {/* Active Filters */}
        {(Object.values(filters).some((v) => !v.startsWith("All")) ||
          keyword) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(filters).map(
              ([key, value]) =>
                value !== `All ${filterOptions[key].label}s` && (
                  <span
                    key={key}
                    className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm flex items-center gap-2"
                  >
                    {translateFilterValue(value)}
                    <button
                      onClick={() =>
                        handleFilterChange(
                          key,
                          `All ${filterOptions[key].label}s`
                        )
                      }
                      className="hover:text-primary-dark"
                    >
                      ×
                    </button>
                  </span>
                )
            )}
            {keyword && (
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm flex items-center gap-2">
                {t("common.search", "Search")}: {keyword}
                <button
                  onClick={() => setKeyword("")}
                  className="hover:text-primary-dark"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Grid Section */}
      {users.length < 1 ? (
        <NoData />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {users.map((item, key) => (
            <Link
              href={`businessDetails/${item?.Business?.uuid || "#"}`}
              key={key}
              className="group h-full"
            >
              <div className="bg-white dark:bg-boxdark-2 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden h-full flex flex-col">
                {/* Card Image Header - Full Width */}
                <div className="relative w-full h-48 overflow-hidden">
                  <Image
                    src={item?.image || "/images/default-avatar.png"}
                    alt={`${getBusinessName(item)} profile`}
                    fill
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Sector Badge - Positioned over image */}
                  <div className="absolute bottom-4 left-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/90 dark:bg-boxdark/90 text-primary backdrop-blur-sm">
                      {item?.Business?.BusinessSector?.name ||
                        t("users.noSector", "No Sector")}
                    </span>
                  </div>
                </div>

                {/* Card Body with Details */}
                <div className="p-6 flex-grow space-y-4">
                  <div className="space-y-2">
                    <h2 className="text-lg font-semibold text-black dark:text-white group-hover:text-primary transition-colors line-clamp-2">
                      {getBusinessName(item)}
                    </h2>

                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                      {item?.Business?.email ||
                        t("users.noEmailProvided", "No email provided")}
                    </p>
                  </div>

                  {/* Details Section */}
                  <div className="space-y-3 pt-2">
                    {/* Program Details */}
                    {item?.Business?.program && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <svg
                          className="w-4 h-4 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          />
                        </svg>
                        <span className="line-clamp-1">
                          {item.Business.program}
                        </span>
                      </div>
                    )}

                    {/* Location if available */}
                    {item?.Business?.location && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <svg
                          className="w-4 h-4 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <span className="line-clamp-1">
                          {item.Business.location}
                        </span>
                      </div>
                    )}

                    {/* Founding Date */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <svg
                        className="w-4 h-4 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span>
                        {t("users.joined", "Joined")}{" "}
                        {item?.Business?.createdAt
                          ? new Date(item.Business.createdAt).getFullYear()
                          : t("mentorHub.notAvailable", "N/A")}
                      </span>
                    </div>
                  </div>

                  {/* Social Links */}
                  <div className="flex items-center gap-3 pt-3">
                    {item?.Business?.facebook && (
                      <a
                        href={item.Business.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-primary transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Image
                          height={20}
                          width={20}
                          alt={`${getBusinessName(item)} Facebook profile`}
                          className="w-5 h-5 opacity-75 hover:opacity-100 transition-opacity"
                          src="/facebook.svg"
                        />
                      </a>
                    )}
                    {item?.Business?.linkedin && (
                      <a
                        href={item.Business.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-primary transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Image
                          height={20}
                          width={20}
                          alt={`${getBusinessName(item)} LinkedIn profile`}
                          className="w-5 h-5 opacity-75 hover:opacity-100 transition-opacity"
                          src="/linkedin.png"
                        />
                      </a>
                    )}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="px-6 py-4 border-t border-stroke dark:border-strokedark bg-gray-50 dark:bg-boxdark mt-auto">
                  <div className="flex items-center justify-center text-sm font-medium text-primary group-hover:text-primary-dark transition-colors">
                    <span>{t("users.viewDetails", "View Details")}</span>
                    <svg
                      className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Pagination limit={limit} count={count} setPage={setPage} page={page} />
    </div>
  );
};

export default Page;
