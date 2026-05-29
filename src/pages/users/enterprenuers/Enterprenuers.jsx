"use client";

import { useContext, useEffect, useState } from "react";
import { getEnterprenuers } from "@/controllers/user_controller";
import Link from "@/utils/link";
import Loader from "@/components/common/Loader";
import NoData from "@/component/noData";
import Image from "@/utils/image";
import { UserContext } from "../../../layouts/DashboardLayout";
import { useTranslation } from "@/locales";
import {
  FaLayerGroup,
  FaSearch,
  FaBuilding,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaArrowRight,
} from "react-icons/fa";

const Enterprenuers = () => {
  const { t, isSwahili } = useTranslation();
  const { userDetails } = useContext(UserContext);

  const [users, setUsers] = useState([]);
  const [loading, setloading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
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
  const [limit] = useState(12);
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [openDropdown, setOpenDropdown] = useState(null);

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
        "Climate Launchpad",
        "Generation Food",
        "Capacity Building to Kilwa Entrepreneurs",
        "Female Entrepreneurs Growing Greener Economies",
        "Rapid Banana",
        "Restoration Factory Tanzania",
        "Capacity Building to Entrepreneurs Focusing on Clean and Renewable Energy in Arusha",
        "Capacity Building for Entrepreneurship and Aquaculture Practices",
        "Youth Entrepreneurship & Innovation Program",
        "Regenerative Economy Accelerator Tanzania",
        "Pesatech Accelerator Two",
        "Funguo Investment Accelerator",
        "AWCE Investment Accelerator",
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

  const getDefaultFilterValue = (filterKey) =>
    filterOptions[filterKey]?.options?.[0] || "";

  const isFiltering =
    Object.values(filters).some((value) => !value.startsWith("All")) || keyword;

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
        break;
    }

    return params;
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setPage(1);
      setDebouncedKeyword(keyword);
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [keyword]);

  useEffect(() => {
    const revenueParams = getRevenueParams(filters.revenue);

    if (users.length === 0) {
      setloading(true);
    } else {
      setIsFetching(true);
    }

    getEnterprenuers(limit, page, debouncedKeyword, revenueParams).then(
      (body) => {
        let filteredData = Array.isArray(body?.data) ? [...body.data] : [];

        filteredData = applyFilters(filteredData);

        setCount(body?.count || 0);
        setUsers(filteredData);
        setloading(false);
        setIsFetching(false);
      },
    );
  }, [sortConfig, filters, page, debouncedKeyword]);

  const applyFilters = (filteredData) => {
    if (isFiltering) {
      if (filters.sector !== "All Sectors") {
        filteredData = filteredData.filter(
          (item) => item.Business?.BusinessSector?.name === filters.sector,
        );
      }

      if (filters.year !== "All Years") {
        filteredData = filteredData.filter(
          (item) =>
            new Date(item.Business?.createdAt).getFullYear().toString() ===
            filters.year,
        );
      }

      if (filters.program !== "All Programs") {
        filteredData = filteredData.filter(
          (item) => item.Business?.program === filters.program,
        );
      }
    }

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
              b.Business?.BusinessSector?.name,
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

    return filteredData;
  };

  const toggleDropdown = (name) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  const handleFilterChange = (type, value) => {
    setFilters((prev) => ({
      ...prev,
      [type]: value,
    }));
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

  const getBusinessName = (item) => {
    return (
      item?.Business?.name ||
      item?.name ||
      t("users.unnamedBusiness", "Unnamed Business")
    );
  };

  if (loading && users.length === 0) return <Loader />;

  const totalPages = Math.ceil(count / limit);

  return (
    <div className="min-h-screen px-6 py-4">
      {/* HERO */}
      <div className="relative mb-10 min-h-[320px] overflow-hidden rounded-2xl bg-black shadow-sm">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/images/startups_hero_page.svg')",
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-[#c9672b]/30" />

        <div className="relative z-10 max-w-3xl p-10 text-white">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-sm font-medium shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#f08a3c]" />
            Entrepreneur Network
          </span>

          <h2 className="mb-3 text-4xl font-bold leading-tight drop-shadow-lg">
            Entrepreneurs
          </h2>

          <p className="mb-6 text-lg text-white/85 drop-shadow-md">
            Explore a growing network of businesses and founders building
            ventures across technology, agriculture, clean energy, education,
            healthcare, and other high-impact sectors.
          </p>

          <div className="flex flex-wrap items-center gap-6 text-sm text-white/85">
            <span className="flex items-center gap-2">
              <FaLayerGroup />
              Members
            </span>

            <span className="flex items-center gap-2">
              <FaBuilding />
              Business Profiles
            </span>
          </div>
        </div>
      </div>

      <h2 className="mb-6 text-2xl font-bold text-[#172033]">
        Available Entrepreneurs
      </h2>

      <div className="mb-8 rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            {Object.entries(filterOptions).map(([key, value]) => (
              <div key={key} className="relative inline-block">
                <button
                  onClick={() => toggleDropdown(key)}
                  className={`inline-flex items-center gap-2 rounded-md border px-4 py-3 text-sm transition-colors ${
                    filters[key] !== getDefaultFilterValue(key)
                      ? "border-green-600 bg-green-50 text-green-700"
                      : "border-black/10 bg-white text-[#6f6f72] hover:border-green-600"
                  }`}
                >
                  <span>{filters[key]}</span>
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
                            : "text-[#6f6f72] hover:bg-[#f8f8f6]"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <div className="relative inline-block">
              <button
                onClick={() => toggleDropdown("sort")}
                className="inline-flex items-center gap-2 rounded-md border border-black/10 bg-white px-4 py-3 text-sm text-[#6f6f72] transition-colors hover:border-green-600"
              >
                <span>Sort: {sortConfig.key}</span>
                <span>{openDropdown === "sort" ? "⌃" : "⌄"}</span>
              </button>

              {openDropdown === "sort" && (
                <div className="absolute z-20 mt-2 w-48 rounded-xl border border-black/10 bg-white shadow-lg">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleSortChange(option.value)}
                      className={`block w-full px-4 py-2 text-left text-sm ${
                        sortConfig.key === option.value
                          ? "bg-green-50 text-green-700"
                          : "text-[#6f6f72] hover:bg-[#f8f8f6]"
                      }`}
                    >
                      {option.label}
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
              placeholder="Search entrepreneurs..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full rounded-md border border-black/10 bg-[#ffffff] px-4 py-3 pl-10 text-sm text-[#172033] outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
            />

            {isFetching && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8a8f98]">
                Updating...
              </span>
            )}
          </div>
        </div>
      </div>

      {users.length < 1 ? (
        <NoData />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {users.map((item, key) => (
            <Link
              href={`businessDetails/${item?.Business?.uuid || "#"}`}
              key={key}
              className="group overflow-hidden rounded-xl bg-white shadow-md transition duration-200 hover:scale-[1.02] hover:shadow-lg"
            >
              <div className="relative h-56 overflow-hidden bg-black">
                <Image
                  src={item?.image || "/images/default-avatar.png"}
                  alt={`${getBusinessName(item)} profile`}
                  fill
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                <div className="absolute bottom-4 left-4">
                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 shadow-sm backdrop-blur-sm">
                    {isSwahili
                      ? item?.Business?.BusinessSector?.swName
                      : item?.Business?.BusinessSector?.name || "No Sector"}
                  </span>
                </div>
              </div>

              <div className="flex min-h-[250px] flex-col p-5">
                <h3 className="mb-2 line-clamp-2 text-lg font-bold text-[#111827]">
                  {getBusinessName(item)}
                </h3>

                <p className="mb-5 line-clamp-1 text-sm text-[#6f6f72]">
                  {item?.Business?.email || item?.email || "No email provided"}
                </p>

                <div className="space-y-3 text-sm text-[#6f6f72]">
                  {item?.Business?.program && (
                    <div className="flex items-center gap-2">
                      <FaBuilding className="shrink-0" />
                      <span className="line-clamp-1">
                        {item.Business.program}
                      </span>
                    </div>
                  )}

                  {item?.Business?.location && (
                    <div className="flex items-center gap-2">
                      <FaMapMarkerAlt className="shrink-0" />
                      <span className="line-clamp-1">
                        {item.Business.location}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <FaCalendarAlt className="shrink-0" />
                    <span>
                      Joined{" "}
                      {item?.Business?.createdAt || item?.createdAt
                        ? new Date(
                            item?.Business?.createdAt || item?.createdAt,
                          ).getFullYear()
                        : "N/A"}
                    </span>
                  </div>
                </div>

                <div className="mt-auto flex items-center justify-between border-t border-black/10 pt-4 text-xs text-[#8a8f98]">
                  <span className="flex items-center gap-1">
                    <FaBuilding />
                    Profile
                  </span>

                  <span className="flex items-center gap-1 font-medium text-green-600">
                    View Details
                    <FaArrowRight />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {count > 0 && (
        <div className="mt-10 rounded-2xl bg-white px-6 py-5 shadow-sm">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-[#6f6f72]">
              Showing {(page - 1) * limit + 1} - {Math.min(page * limit, count)}{" "}
              of {count} Entrepreneurs
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1}
                className="rounded-lg border border-black/10 bg-white px-5 py-2.5 text-sm text-[#8a8f98] transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>

              {[...Array(Math.min(10, totalPages))].map((_, idx) => {
                let startPage = Math.max(1, page - 4);
                let endPage = Math.min(totalPages, startPage + 9);

                if (endPage - startPage < 9) {
                  startPage = Math.max(1, endPage - 9);
                }

                const pageNum = startPage + idx;

                if (pageNum > totalPages) return null;

                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                      page === pageNum
                        ? "bg-[#082d77] text-white"
                        : "border border-black/10 bg-white text-[#6f6f72] hover:border-primary hover:text-primary"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() =>
                  setPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={page === totalPages}
                className="rounded-lg border border-black/10 bg-white px-5 py-2.5 text-sm text-[#6f6f72] transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Enterprenuers;
