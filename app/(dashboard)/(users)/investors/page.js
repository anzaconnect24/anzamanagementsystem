"use client";
import { useContext, useEffect, useState } from "react";
import { getInvestors } from "../../../controllers/user_controller";
import Link from "next/link";
import Loader from "@/components/common/Loader";
import NoData from "@/app/component/noData";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { UserContext } from "../../layout";
import Pagination from "@/app/component/pagination";

const Page = () => {
  const router = useRouter();
  const { userDetails } = useContext(UserContext);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refresh, setRefresh] = useState(0);
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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(20);
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [openDropdown, setOpenDropdown] = useState(null);

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
    ticketSize: {
      label: "Ticket Size",
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
      label: "Structure",
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
    { value: "name", label: "Name" },
    { value: "sector", label: "Sector" },
    { value: "ticketSize", label: "Ticket Size" },
    { value: "structure", label: "Structure" },
  ];

  // Check if any filters are active
  const isFiltering =
    Object.values(filters).some((value) => !value.startsWith("All")) ||
    keyword.trim() !== "";

  // Function to fetch and process data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Determine if we need all data (for client-side filtering) or paginated data
      const pageSize = isFiltering ? 1000 : limit;
      const pageNumber = isFiltering ? 1 : currentPage;

      const response = await getInvestors(limit, page, keyword);

      if (!response || !response.data) {
        throw new Error("Failed to fetch investors data");
      }

      let processedData = [...response.data];

      // Apply client-side filters
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

      // Apply sorting
      processedData.sort((a, b) => {
        const direction = sortConfig.direction === "asc" ? 1 : -1;

        switch (sortConfig.key) {
          case "name":
            return (
              direction * ((a.name || "").localeCompare(b.name || "") || 0)
            );

          case "sector":
            return (
              direction * ((a.sector || "").localeCompare(b.sector || "") || 0)
            );

          case "ticketSize":
            // Extract numeric values from ticket size strings for better sorting
            const getTicketValue = (ticket) => {
              if (!ticket) return 0;
              const match = ticket.match(/(\d+)K/);
              return match ? parseInt(match[1], 10) : 0;
            };
            const ticketA = getTicketValue(a.ticketSize);
            const ticketB = getTicketValue(b.ticketSize);
            return direction * (ticketA - ticketB);

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

  // Effect to fetch data when dependencies change
  useEffect(() => {
    fetchData();
  }, [refresh, page, limit]);

  // Separate effect for filtering and sorting to avoid redundant fetches
  useEffect(() => {
    fetchData();
  }, [filters, sortConfig, keyword]);

  // Handle dropdown toggle
  const toggleDropdown = (name) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdown && !event.target.closest(".dropdown-container")) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdown]);

  // Handle filter changes
  const handleFilterChange = (type, value) => {
    setFilters((prev) => ({
      ...prev,
      [type]: value,
    }));
    // Reset to first page when filter changes
    setCurrentPage(1);
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

  // Handle search input
  const handleSearch = (e) => {
    setKeyword(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  // Handle investor card click
  const handleInvestorClick = (uuid) => {
    if (!uuid) {
      console.error("Invalid investor UUID");
      return;
    }
    console.log(userDetails.role);
    if (userDetails.role === "Enterprenuer") {
      router.push(`/investors/details/${uuid}`);
    } else {
      router.push(`/investors/${uuid}`);
    }
  };

  // Render error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-4">
        <div className="text-center mb-4">
          <h3 className="text-xl font-semibold text-black dark:text-white mb-2">
            Something went wrong
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

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
              {count} investors
            </span>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Search investors..."
              value={keyword}
              onChange={handleSearch}
              className="w-64 px-4 py-2 rounded-md  bg-white dark:bg-boxdark border border-white focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Filter Dropdowns */}
          {Object.entries(filterOptions).map(([key, value]) => (
            <div key={key} className="relative inline-block">
              <button
                onClick={() => toggleDropdown(key)}
                className={`px-4 py-2 rounded-md  ${
                  filters[key] !== `All ${value.label}`
                    ? "border-primary bg-white "
                    : "border-white bg-white dark:bg-boxdark dark:border-gray-100"
                } flex items-center gap-2 y transition-colors`}
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
              className="px-4 py-2 rounded-md border border-white bg-white dark:bg-boxdark dark:border-gray-700 flex items-center gap-2 hover:border-primary transition-colors"
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

      {/* Grid Section - Lower z-index */}
      <div className="relative z-0">
        {users.length < 1 ? (
          <NoData />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {users.map((investor, index) => (
              <div
                key={investor.uuid || index}
                onClick={() => handleInvestorClick(investor.uuid)}
                className="group h-full cursor-pointer"
              >
                <div className="bg-white dark:bg-boxdark-2 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden h-full flex flex-col">
                  {/* Card Image Header */}
                  <div className="relative w-full h-48 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent z-10" />
                    <Image
                      src={investor.image || "/images/default-avatar.png"}
                      alt={investor.name || "Investor profile"}
                      fill
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.src =
                          "https://ui-avatars.com/api/?name=" +
                          encodeURIComponent(investor.name || "Investor") +
                          "&background=6366f1&color=fff&size=400";
                      }}
                    />
                    {/* Sector Badge */}
                    <div className="absolute bottom-4 left-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/90 dark:bg-boxdark/90 text-primary backdrop-blur-sm">
                        {investor?.InvestorProfile?.BusinessSector?.name ||
                          "No Sector"}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 flex-grow space-y-4">
                    <div className="space-y-2">
                      <h2 className="text-lg font-semibold text-black dark:text-white group-hover:text-primary transition-colors line-clamp-2">
                        {investor.name || "Unnamed Investor"}
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                        {investor.email || "No email provided"}
                      </p>
                    </div>

                    {/* Details Section */}
                    <div className="space-y-3 pt-2">
                      {/* Ticket Size */}
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
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="line-clamp-1">
                          {investor?.InvestorProfile?.investmentSize ||
                            "Ticket size not specified"}
                        </span>
                      </div>

                      {/* Structure */}
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
                          {Object.values(
                            investor?.InvestorProfile?.investmentType
                          ).join(", ") || "Structure not specified"}
                        </span>
                      </div>

                      {/* Location if available */}
                      {investor.location && (
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
                            {investor.location}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Social Links */}
                    {investor.socialLinks?.length > 0 && (
                      <div className="flex items-center gap-3 pt-3">
                        {investor.socialLinks.map((link, i) => (
                          <a
                            key={i}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-primary transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Image
                              height={20}
                              width={20}
                              alt={`${link.platform} profile`}
                              className="w-5 h-5 opacity-75 hover:opacity-100 transition-opacity"
                              src={`/${link.platform.toLowerCase()}.svg`}
                            />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="px-6 py-4 border-t border-stroke dark:border-strokedark bg-gray-50 dark:bg-boxdark mt-auto">
                    <div className="flex items-center justify-center text-sm font-medium text-primary group-hover:text-primary-dark transition-colors">
                      <span>View Profile</span>
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
              </div>
            ))}
          </div>
        )}

        <Pagination limit={limit} count={count} setPage={setPage} page={page} />
      </div>
    </div>
  );
};

export default Page;
