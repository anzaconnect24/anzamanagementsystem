"use client";

import { useContext, useEffect, useState, useMemo, useCallback } from "react";
import { getMentors } from "@/controllers/user_controller";
import Link from "@/utils/link";
import Loader from "@/components/common/Loader";
import NoData from "@/component/noData";
import Image from "@/utils/image";
import { UserContext } from "../../../layouts/DashboardLayout";
import { useTranslation } from "../../../locales";
import {
  FaLayerGroup,
  FaSearch,
  FaUserTie,
  FaBriefcase,
  FaCalendarAlt,
  FaArrowRight,
} from "react-icons/fa";

const Mentors = () => {
  const { t } = useTranslation();
  const { userDetails } = useContext(UserContext);

  const [allData, setAllData] = useState([]);
  const [displayedUsers, setDisplayedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [filters, setFilters] = useState({
    sector: "All Sectors",
    expertise: "All Expertise",
    year: "All Years",
  });
  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "asc",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 12;
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
    expertise: {
      label: t("users.expertise", "Expertise"),
      options: [
        "All Expertise",
        "Business Strategy",
        "Marketing",
        "Finance",
        "Technology",
        "Operations",
        "Leadership",
      ],
    },
    year: {
      label: t("users.year", "Year"),
      options: ["All Years", "2024", "2023", "2022", "2021", "2020"],
    },
  };

  const sortOptions = [
    { value: "name", label: t("users.name", "Name") },
    { value: "sector", label: t("users.sector", "Sector") },
    { value: "expertise", label: t("users.expertise", "Expertise") },
    { value: "date", label: t("users.joinedDate", "Joined Date") },
  ];

  const getMentorName = (item) =>
    item?.name || t("users.unnamedMentor", "Unnamed Mentor");

  const getMentorSector = (item) =>
    item?.MentorProfile?.BusinessSector?.name ||
    Object.values(item?.MentorProfile?.areasOfExperties || {}).join(", ") ||
    t("business.noSector", "No Sector");

  const makeFirstLetterLowercase = (str = "") => {
    if (!str) return "";
    return str.charAt(0).toLowerCase() + str.slice(1);
  };

  const translateFilterValue = (value) => {
    switch (value) {
      case "All Sectors":
        return t("users.allSectors", "All Sectors");
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
      case "All Expertise":
        return t("users.allExpertise", "All Expertise");
      case "Business Strategy":
        return t("users.businessStrategy", "Business Strategy");
      case "Marketing":
        return t("users.marketing", "Marketing");
      case "Finance":
        return t("users.finance", "Finance");
      case "Operations":
        return t("users.operations", "Operations");
      case "Leadership":
        return t("users.leadership", "Leadership");
      case "All Years":
        return t("users.allYears", "All Years");
      default:
        return value;
    }
  };

  const translateSortLabel = (key) => {
    switch (key) {
      case "name":
        return t("users.name", "Name");
      case "sector":
        return t("users.sector", "Sector");
      case "expertise":
        return t("users.expertise", "Expertise");
      case "date":
        return t("users.joinedDate", "Joined Date");
      default:
        return key;
    }
  };

  const matchesSearchKeyword = (item, searchTerm) => {
    if (!searchTerm.trim()) return true;

    const searchLower = searchTerm.toLowerCase();

    return (
      getMentorName(item).toLowerCase().includes(searchLower) ||
      (item?.email || "").toLowerCase().includes(searchLower) ||
      (item?.MentorProfile?.expertise || "")
        .toLowerCase()
        .includes(searchLower) ||
      getMentorSector(item).toLowerCase().includes(searchLower) ||
      (item?.role || "").toLowerCase().includes(searchLower)
    );
  };

  const getFilteredAndSortedData = useCallback(
    (data, searchKeyword, currentFilters, currentSortConfig) => {
      let filtered = [...data];

      if (searchKeyword.trim()) {
        filtered = filtered.filter((item) =>
          matchesSearchKeyword(item, searchKeyword)
        );
      }

      if (currentFilters.sector !== "All Sectors") {
        filtered = filtered.filter((item) =>
          getMentorSector(item).includes(currentFilters.sector)
        );
      }

      if (currentFilters.expertise !== "All Expertise") {
        filtered = filtered.filter((item) =>
          (item?.MentorProfile?.expertise || "")
            .toLowerCase()
            .includes(currentFilters.expertise.toLowerCase())
        );
      }

      if (currentFilters.year !== "All Years") {
        filtered = filtered.filter((item) => {
          const createdYear = item?.createdAt
            ? new Date(item.createdAt).getFullYear().toString()
            : "";

          return createdYear === currentFilters.year;
        });
      }

      filtered.sort((a, b) => {
        const direction = currentSortConfig.direction === "asc" ? 1 : -1;

        switch (currentSortConfig.key) {
          case "name":
            return direction * getMentorName(a).localeCompare(getMentorName(b));

          case "sector":
            return (
              direction *
              getMentorSector(a).localeCompare(getMentorSector(b))
            );

          case "expertise":
            return (
              direction *
              (a?.MentorProfile?.expertise || "").localeCompare(
                b?.MentorProfile?.expertise || ""
              )
            );

          case "date":
            return (
              direction *
              (new Date(a?.createdAt || 0) -
                new Date(b?.createdAt || 0))
            );

          default:
            return 0;
        }
      });

      return filtered;
    },
    []
  );

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setInitialLoading(true);

        const body = await getMentors(1000, 1);

        setAllData(body.data || []);
      } catch (error) {
        console.error("Error fetching mentors:", error);
        setAllData([]);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchAllData();
  }, []);

  useEffect(() => {
    if (allData.length === 0 && !initialLoading) {
      setDisplayedUsers([]);
      setTotalPages(1);
      return;
    }

    setLoading(true);

    const filteredData = getFilteredAndSortedData(
      allData,
      keyword,
      filters,
      sortConfig
    );

    const totalFilteredPages = Math.ceil(filteredData.length / limit);

    setTotalPages(totalFilteredPages || 1);

    if (currentPage > totalFilteredPages && totalFilteredPages > 0) {
      setCurrentPage(1);
      return;
    }

    const startIndex = (currentPage - 1) * limit;
    const endIndex = startIndex + limit;

    setDisplayedUsers(filteredData.slice(startIndex, endIndex));
    setLoading(false);
  }, [
    allData,
    keyword,
    filters,
    sortConfig,
    currentPage,
    initialLoading,
    getFilteredAndSortedData,
  ]);

  const totalFilteredCount = useMemo(() => {
    return getFilteredAndSortedData(
      allData,
      keyword,
      filters,
      sortConfig
    ).length;
  }, [allData, keyword, filters, sortConfig, getFilteredAndSortedData]);

  const isFiltering = useMemo(
    () =>
      Object.values(filters).some((value) => !value.startsWith("All")) ||
      keyword.trim() !== "",
    [filters, keyword]
  );

  const toggleDropdown = (name) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  const handleFilterChange = (type, value) => {
    setFilters((prev) => ({ ...prev, [type]: value }));
    setCurrentPage(1);
    setOpenDropdown(null);
  };

  const handleSortChange = (key) => {
    setSortConfig((prev) => ({
      key,
      direction:
        prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));

    setOpenDropdown(null);
  };

  const handleSearchChange = (e) => {
    setKeyword(e.target.value);
    setCurrentPage(1);
  };

  const clearSearch = () => {
    setKeyword("");
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setFilters({
      sector: "All Sectors",
      expertise: "All Expertise",
      year: "All Years",
    });

    setKeyword("");
    setCurrentPage(1);
  };

  if (initialLoading) return <Loader />;

  return (
    <div className="min-h-screen px-6 py-4">
      {/* HERO */}
      <div className="relative mb-10 min-h-[320px] overflow-hidden rounded-2xl bg-black shadow-sm">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/images/mentor_hero.svg')",
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-[#c9672b]/30" />

        <div className="relative z-10 max-w-3xl p-10 text-white">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-sm font-medium shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#f08a3c]" />
            Mentor Network
          </span>

          <h2 className="mb-3 text-4xl font-bold leading-tight drop-shadow-lg">
            Mentors
          </h2>

          <p className="mb-6 text-lg text-white/85 drop-shadow-md">
            Connect with experienced mentors across business strategy,
            marketing, finance, operations, leadership, and technology to
            strengthen your entrepreneurial journey.
          </p>

          <div className="flex flex-wrap items-center gap-6 text-sm text-white/85">
            <span className="flex items-center gap-2">
              <FaLayerGroup />
              Mentor Profiles
            </span>

            <span className="flex items-center gap-2">
              <FaUserTie />
              Expert Guidance
            </span>
          </div>
        </div>
      </div>

      <h2 className="mb-6 text-2xl font-bold text-[#172033]">
        Available Mentors
      </h2>

      <div className="mb-8 rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            {Object.entries(filterOptions).map(([key, value]) => (
              <div key={key} className="relative inline-block">
                <button
                  onClick={() => toggleDropdown(key)}
                  className={`inline-flex items-center gap-2 rounded-md border px-4 py-3 text-sm transition-colors ${
                    filters[key] !== value.options[0]
                      ? "border-green-600 bg-green-50 text-green-700"
                      : "border-black/10 bg-white text-[#6f6f72] hover:border-green-600"
                  }`}
                >
                  <span>{translateFilterValue(filters[key])}</span>
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
                        {translateFilterValue(option)}
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
                <span>
                  {t("users.sortBy", "Sort By")}:{" "}
                  {translateSortLabel(sortConfig.key)}
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
                          : "text-[#6f6f72] hover:bg-[#f8f8f6]"
                      }`}
                    >
                      {translateSortLabel(option.value)}

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

            {isFiltering && (
              <button
                onClick={clearAllFilters}
                className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 transition hover:bg-red-100"
              >
                {t("filters.clearAll", "Clear All")}
              </button>
            )}
          </div>

          <div className="relative ml-auto w-full sm:w-80">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8f98]" />

            <input
              type="text"
              placeholder={t(
                "users.searchMentors",
                "Search mentors by name, email, expertise..."
              )}
              value={keyword}
              onChange={handleSearchChange}
              className="w-full rounded-md border border-black/10 bg-[#f8f8f6] px-4 py-3 pl-10 pr-10 text-sm text-[#172033] outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
            />

            {keyword && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a8f98] hover:text-[#172033]"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      {loading && !initialLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-green-600" />
        </div>
      ) : displayedUsers.length < 1 ? (
        <NoData />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {displayedUsers.map((item, key) => (
            <Link
              href={`/dashboard/mentors/${item?.uuid || "#"}`}
              key={item?.uuid || key}
              className="group overflow-hidden rounded-xl bg-white shadow-md transition duration-200 hover:scale-[1.02] hover:shadow-lg"
            >
              <div className="relative h-56 overflow-hidden bg-black">
                <Image
                  src={
                    item?.image ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      getMentorName(item)
                    )}&background=6366f1&color=fff&size=400`
                  }
                  alt={`${getMentorName(item)} profile`}
                  fill
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                <div className="absolute bottom-4 left-4">
                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 shadow-sm backdrop-blur-sm">
                    {item?.MentorProfile?.expertise ||
                      t(
                        `mentor.expertise.${makeFirstLetterLowercase(
                          Object.values(
                            item?.MentorProfile?.areasOfExperties || {}
                          )
                            .slice(0, 2)
                            .join(", ")
                            .replace("&", "And")
                            .replaceAll(" ", "")
                        )}`,
                        t("users.generalExpertise", "General Expertise")
                      )}
                  </span>
                </div>

                <div className="absolute right-4 top-4">
                  <div className="h-3 w-3 rounded-full border-2 border-white bg-green-400 shadow-sm" />
                </div>
              </div>

              <div className="flex min-h-[250px] flex-col p-5">
                <h3 className="mb-2 line-clamp-2 text-lg font-bold text-[#111827]">
                  {getMentorName(item)}
                </h3>

                <p className="mb-5 line-clamp-1 text-sm text-[#6f6f72]">
                  {item?.email ||
                    t("users.noEmailProvided", "No email provided")}
                </p>

                <div className="space-y-3 text-sm text-[#6f6f72]">
                  {item?.MentorProfile?.expertise && (
                    <div className="flex items-center gap-2">
                      <FaBriefcase className="shrink-0" />
                      <span className="line-clamp-1">
                        {item.MentorProfile.expertise}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <FaUserTie className="shrink-0" />
                    <span>{t("users.mentor", "Mentor")}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <FaCalendarAlt className="shrink-0" />
                    <span>
                      {t("users.joined", "Joined")}{" "}
                      {item?.createdAt
                        ? new Date(item.createdAt).getFullYear()
                        : t("common.na", "N/A")}
                    </span>
                  </div>
                </div>

                <div className="mt-auto flex items-center justify-between border-t border-black/10 pt-4 text-xs text-[#8a8f98]">
                  <span className="flex items-center gap-1">
                    <FaUserTie />
                    Mentor
                  </span>

                  <span className="flex items-center gap-1 font-medium text-green-600">
                    {t("investment.viewDetails", "View Details")}
                    <FaArrowRight />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl bg-white p-5 shadow-sm md:flex-row">
          <p className="text-sm text-[#6f6f72]">
            {t(
              "users.showingRange",
              "Showing {{start}} - {{end}} of {{total}} {{type}}",
              {
                start: (currentPage - 1) * limit + 1,
                end: Math.min(currentPage * limit, totalFilteredCount),
                total: totalFilteredCount,
                type: t("users.mentors", "mentors"),
              }
            )}
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.max(1, prev - 1))
              }
              disabled={currentPage === 1}
              className="rounded-md border border-black/10 bg-white px-4 py-2 text-sm text-[#6f6f72] transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t("pagination.previous", "Previous")}
            </button>

            {[...Array(Math.min(5, totalPages))].map((_, idx) => {
              let pageNum;

              if (totalPages <= 5) {
                pageNum = idx + 1;
              } else if (currentPage <= 3) {
                pageNum = idx + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + idx;
              } else {
                pageNum = currentPage - 2 + idx;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`rounded-md px-3 py-2 text-sm transition ${
                    currentPage === pageNum
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
                setCurrentPage((prev) =>
                  Math.min(totalPages, prev + 1)
                )
              }
              disabled={currentPage === totalPages}
              className="rounded-md border border-black/10 bg-white px-4 py-2 text-sm text-[#6f6f72] transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t("pagination.next", "Next")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Mentors;