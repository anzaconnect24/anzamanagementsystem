"use client";
import { useContext, useEffect, useState } from "react";
import { getMentors } from "../../../controllers/user_controller";
import Link from "next/link";
import Loader from "@/components/common/Loader";
import NoData from "@/app/component/noData";
import Image from "next/image";
import { UserContext } from "../../layout";

const Page = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
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
  const [limit, setLimit] = useState(20);
  const [openDropdown, setOpenDropdown] = useState(null);
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
    expertise: {
      label: "Expertise",
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
      label: "Year",
      options: ["All Years", "2024", "2023", "2022", "2021", "2020"],
    },
  };

  const sortOptions = [
    { value: "name", label: "Name" },
    { value: "sector", label: "Sector" },
    { value: "expertise", label: "Expertise" },
    { value: "date", label: "Joined Date" },
  ];

  // Check if any filters are active
  const isFiltering =
    Object.values(filters).some((value) => !value.startsWith("All")) ||
    keyword.trim();

  // Helper function for mentor names
  const getMentorName = (item) => {
    return item?.name || "Unnamed Mentor";
  };

  // Helper function to get mentor sector
  const getMentorSector = (item) => {
    return (
      item?.MentorProfile?.BusinessSector?.name ||
      Object.values(item?.MentorProfile?.areasOfExperties || {}).join(", ") ||
      "No Sector"
    );
  };

  // Helper function to check if mentor matches search keyword
  const matchesSearchKeyword = (item, searchTerm) => {
    if (!searchTerm.trim()) return true;

    const searchLower = searchTerm.toLowerCase();
    const name = getMentorName(item).toLowerCase();
    const email = (item?.email || "").toLowerCase();
    const expertise = (item?.MentorProfile?.expertise || "").toLowerCase();
    const sector = getMentorSector(item).toLowerCase();
    const role = (item?.role || "").toLowerCase();

    return (
      name.includes(searchLower) ||
      email.includes(searchLower) ||
      expertise.includes(searchLower) ||
      sector.includes(searchLower) ||
      role.includes(searchLower)
    );
  };

  useEffect(() => {
    const fetchAndFilterData = async () => {
      try {
        setLoading(true);
        // If filtering, get all data at once
        const pageSize = isFiltering ? 1000 : limit;
        const pageNumber = isFiltering ? 1 : currentPage;

        const body = await getMentors(pageSize, pageNumber);
      let filteredData = [...body.data];

        // Apply search filter first
        if (keyword.trim()) {
          filteredData = filteredData.filter((item) =>
            matchesSearchKeyword(item, keyword)
          );
        }

        // Apply other filters if any are active
        if (filters.sector !== "All Sectors") {
          filteredData = filteredData.filter((item) => {
            const sector = getMentorSector(item);
            return sector.includes(filters.sector);
          });
        }

        if (filters.expertise !== "All Expertise") {
          filteredData = filteredData.filter((item) => {
            const expertise = item?.MentorProfile?.expertise || "";
            return expertise
              .toLowerCase()
              .includes(filters.expertise.toLowerCase());
          });
        }

        if (filters.year !== "All Years") {
          filteredData = filteredData.filter((item) => {
            const createdYear = item?.createdAt
              ? new Date(item.createdAt).getFullYear().toString()
              : "";
            return createdYear === filters.year;
          });
        }

      // Apply sorting
      filteredData.sort((a, b) => {
        const direction = sortConfig.direction === "asc" ? 1 : -1;

        switch (sortConfig.key) {
          case "name":
            return (
              direction *
              (getMentorName(a).localeCompare(getMentorName(b)) || 0)
            );
          case "sector":
            return (
              direction *
                (getMentorSector(a).localeCompare(getMentorSector(b)) || 0)
            );
          case "expertise":
            return (
              direction *
                ((a?.MentorProfile?.expertise || "").localeCompare(
                  b?.MentorProfile?.expertise || ""
              ) || 0)
            );
            case "date":
              return (
<<<<<<< HEAD
                direction * (new Date(a?.createdAt || 0) - new Date(b?.createdAt || 0))
            );
          default:
            return 0;
        }
      });

        console.log('Filtered data:', filteredData);
      setUsers(filteredData);
      setTotalPages(isFiltering ? 1 : body.totalPages);
=======
                direction *
                (new Date(a?.createdAt || 0) - new Date(b?.createdAt || 0))
              );
            default:
              return 0;
          }
        });

        console.log("Filtered data:", filteredData);
        setUsers(filteredData);
        setTotalPages(isFiltering ? 1 : body.totalPages);
>>>>>>> origin/develop
      } catch (error) {
        console.error("Error fetching mentors:", error);
        setUsers([]);
      } finally {
      setLoading(false);
      }
    };

    fetchAndFilterData();
  }, [sortConfig, filters, currentPage, limit, keyword, isFiltering]);

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
    setCurrentPage(1); // Reset to first page when filtering
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

  // Handle search input change with debouncing
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setKeyword(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({
      sector: "All Sectors",
      expertise: "All Expertise",
      year: "All Years",
    });
    setKeyword("");
    setCurrentPage(1);
  };

  return loading ? (
    <Loader />
  ) : (
    <div className="p-4 md:p-6 lg:p-8 bg-gray-50 dark:bg-boxdark min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Welcome {userDetails.name}!</h1>

      {/* Search and Filter Bar */}
      <div className="mb-8">
        {/* Member Count and Search */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-xl text-gray-600 dark:text-gray-300">
              {users.length} mentors {isFiltering && "(filtered)"}
            </span>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Search mentors by name, email, expertise..."
              value={keyword}
              onChange={handleSearchChange}
              className="w-64 px-4 py-2 rounded-md border border-white bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            {keyword && (
              <button
                onClick={() => setKeyword("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Filters and Sort */}
        <div className="flex flex-wrap gap-3">
          {/* Filter Dropdowns */}
          {Object.entries(filterOptions).map(([key, value]) => (
            <div key={key} className="relative inline-block">
              <button
                onClick={() => toggleDropdown(key)}
                className={`px-4 py-2 rounded-md border border-white transition-colors ${
                  filters[key] !== `All ${value.label}`
                    ? " bg-white "
                    : " bg-white "
                } flex items-center gap-2`}
              >
                <span>{filters[key]}</span>
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
                <div className="absolute z-10 mt-1 w-48 rounded-md shadow-lg bg-white dark:bg-boxdark border border-white dark:border-gray-700">
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
                      {option}
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
              className="px-4 py-2 rounded-md border border-white bg-white dark:bg-boxdark dark:border-gray-600 flex items-center gap-2 hover:border-primary transition-colors"
            >
              <span>
                Sort:{" "}
                {sortOptions.find((opt) => opt.value === sortConfig.key)?.label}
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
                    {option.label}{" "}
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

          {/* Clear Filters Button */}
          {isFiltering && (
            <button
              onClick={clearAllFilters}
              className="px-4 py-2 rounded-md border border-red-300 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Active Filters */}
        {(Object.values(filters).some((v) => !v.startsWith("All")) ||
          keyword) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(filters).map(
              ([key, value]) =>
                value !== `All ${filterOptions[key].label}` && (
                  <span
                    key={key}
                    className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm flex items-center gap-2"
                  >
                    {value}
                    <button
                      onClick={() =>
                        handleFilterChange(
                          key,
                          `All ${filterOptions[key].label}`
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
                Search: {keyword}
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
              href={`/mentors/${item?.uuid || "#"}`}
              key={key}
              className="group h-full"
            >
              <div className="bg-white dark:bg-boxdark-2 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden h-full flex flex-col">
                {/* Card Image Header - Full Width */}
                <div className="relative w-full h-56 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                  <Image
                    src={
                      item?.image ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        getMentorName(item)
                      )}&background=6366f1&color=fff&size=400`
                    }
                    alt={`${getMentorName(item)} profile`}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    priority={key < 4} // Prioritize loading first 4 images
                    className="object-cover w-full h-full group-hover:scale-110 transition-all duration-500 ease-out"
                    style={{
                      objectPosition: "center top",
                    }}
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.getAttribute("data-fallback")) {
                        target.setAttribute("data-fallback", "true");
                        target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          getMentorName(item)
                        )}&background=random&color=fff&size=400&font-size=0.4&rounded=true`;
                      }
                    }}
                  />

                  {/* Image Overlay for better text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Sector Badge - Positioned over image */}
                  <div className="absolute bottom-4 left-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/90 dark:bg-boxdark/90 text-primary backdrop-blur-sm">
                      {item?.MentorProfile?.expertise ||
                        Object.values(
                          item?.MentorProfile?.areasOfExperties || {}
                        )
                          .slice(0, 2)
                          .join(", ") ||
                        "General Expertise"}
                    </span>
                  </div>

                  {/* Status indicator */}
                  <div className="absolute top-3 right-3">
                    <div className="w-3 h-3 bg-green-400 rounded-full border-2 border-white shadow-sm"></div>
                  </div>
                </div>

                {/* Card Body with Details */}
                <div className="p-6 flex-grow space-y-4">
                  <div className="space-y-2">
                    <h2 className="text-lg font-semibold text-black dark:text-white group-hover:text-primary transition-colors line-clamp-2">
                      {getMentorName(item)}
                    </h2>

                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                      {item?.email || "No email provided"}
                    </p>
                  </div>

                  {/* Details Section */}
                  <div className="space-y-3 pt-2">
                    {/* Expertise */}
                    {item?.MentorProfile?.expertise && (
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
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <span className="line-clamp-1">
                          {item.MentorProfile.expertise}
                        </span>
                      </div>
                    )}

                    {/* Role */}
                    {item?.role && (
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
                        <span className="line-clamp-1">{item.role}</span>
                      </div>
                    )}

                    {/* Joined Date */}
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
                        Joined{" "}
                        {item?.createdAt
                          ? new Date(item.createdAt).getFullYear()
                          : "N/A"}
                      </span>
                    </div>
                  </div>

                  {/* Social Links */}
                  <div className="flex items-center gap-3 pt-3">
                    {item?.facebook && (
                      <a
                        href={item.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-primary transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Image
                          height={20}
                          width={20}
                          alt={`${getMentorName(item)} Facebook profile`}
                          className="w-5 h-5 opacity-75 hover:opacity-100 transition-opacity"
                          src="/facebook.svg"
                        />
                      </a>
                    )}
                    {item?.linkedin && (
                      <a
                        href={item.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-primary transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Image
                          height={20}
                          width={20}
                          alt={`${getMentorName(item)} LinkedIn profile`}
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
                    <span>View Details</span>
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

      {/* Pagination - Only show if not filtering */}
      {!isFiltering && (
        <div className="flex items-center justify-between p-6 border-t border-stroke dark:border-strokedark mt-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                currentPage === 1
                  ? "bg-gray-100 text-gray-400"
                  : "bg-primary text-white hover:bg-primary/90"
              }`}
            >
              Previous
            </button>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                currentPage === totalPages
                  ? "bg-gray-100 text-gray-400"
                  : "bg-primary text-white hover:bg-primary/90"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Page;
