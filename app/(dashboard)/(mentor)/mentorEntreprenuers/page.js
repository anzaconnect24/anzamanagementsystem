"use client";
import { useContext, useEffect, useState } from "react";
import { UserContext } from "../../layout";
import { getMentorAssignedEntreprenuers } from "@/app/controllers/mentorEntreprenuerController";
import Link from "next/link";
import Loader from "@/components/common/Loader";
import NoData from "@/app/component/noData";
import Image from "next/image";

const MentorEntreprenuer = () => {
  const { userDetails } = useContext(UserContext);
  const [users, setUsers] = useState([]);
  const [loading, setloading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [filters, setFilters] = useState({
    sector: "All Sectors",
    year: "All Years",
    program: "All Programs",
  });
  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "asc",
  });
  const [currentPage, setcurrentPage] = useState(1);
  const [totalPages, settotalPages] = useState(1);
  const [limit, setlimit] = useState(20);
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
        "Investment Readiness",
        "Business Foundation",
        "Mentorship Program",
        "Accelerator",
      ],
    },
  };

  const sortOptions = [
    { value: "name", label: "Name" },
    { value: "sector", label: "Sector" },
    { value: "date", label: "Date" },
    { value: "program", label: "Program" },
  ];

  const isFiltering =
    Object.values(filters).some((value) => !value.startsWith("All")) || keyword;

  useEffect(() => {
    const pageSize = isFiltering ? 1000 : limit;
    const pageNumber = isFiltering ? 1 : currentPage;

    getMentorAssignedEntreprenuers(
      userDetails.uuid,
      pageSize,
      pageNumber,
      keyword
    ).then((body) => {
      let filteredData = [...body];

      if (isFiltering) {
        if (filters.sector !== "All Sectors") {
          filteredData = filteredData.filter(
            (item) =>
              item?.Entreprenuer?.Business?.BusinessSector?.name ===
              filters.sector
          );
        }

        if (filters.year !== "All Years") {
          filteredData = filteredData.filter(
            (item) =>
              new Date(item?.Entreprenuer?.Business?.createdAt)
                .getFullYear()
                .toString() === filters.year
          );
        }

        if (filters.program !== "All Programs") {
          filteredData = filteredData.filter(
            (item) => item?.Entreprenuer?.Business?.program === filters.program
          );
        }
      }

      filteredData.sort((a, b) => {
        const direction = sortConfig.direction === "asc" ? 1 : -1;

        switch (sortConfig.key) {
          case "name":
            return (
              direction *
              (a?.Entreprenuer?.name?.localeCompare(b?.Entreprenuer?.name) || 0)
            );
          case "sector":
            return (
              direction *
              (a?.Entreprenuer?.Business?.BusinessSector?.name?.localeCompare(
                b?.Entreprenuer?.Business?.BusinessSector?.name
              ) || 0)
            );
          case "date":
            return (
              direction *
              (new Date(a?.Entreprenuer?.Business?.createdAt) -
                new Date(b?.Entreprenuer?.Business?.createdAt))
            );
          case "program":
            return (
              direction *
              (a?.Entreprenuer?.Business?.program?.localeCompare(
                b?.Entreprenuer?.Business?.program
              ) || 0)
            );
          default:
            return 0;
        }
      });

      setUsers(filteredData);
      settotalPages(isFiltering ? 1 : body.totalPages);
      setloading(false);
    });
  }, [
    refresh,
    sortConfig,
    filters,
    currentPage,
    limit,
    keyword,
    userDetails.uuid,
  ]);

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

  const getEntrepreneurName = (item) => {
    return item?.Entreprenuer?.name || "Unnamed Entrepreneur";
  };

  const getBusinessName = (item) => {
    return item?.Entreprenuer?.Business?.name || "Unnamed Business";
  };

  return loading ? (
    <Loader />
  ) : (
    <div className="p-4 md:p-6 lg:p-8 bg-gray-50 dark:bg-boxdark min-h-screen">
      <div className="mb-4">
        <div className="flex flex-wrap items-center justify-between gap-4 ">
          <div className="flex flex-wrap gap-3">
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

            <div className="relative inline-block">
              <button
                onClick={() => toggleDropdown("sort")}
                className="px-4 py-2 rounded-md border border-white bg-white dark:bg-boxdark dark:border-gray-700 flex items-center gap-2 hover:border-primary transition-colors"
              >
                <span>
                  Sort:{" "}
                  {
                    sortOptions.find((opt) => opt.value === sortConfig.key)
                      ?.label
                  }
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

          <div className="relative">
            <input
              type="text"
              placeholder="Search entrepreneurs..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-64 px-4 py-2 rounded-md border border-white bg-white dark:bg-boxdark dark:border-gray-700 focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* {(Object.values(filters).some((v) => !v.startsWith("All")) ||
          keyword) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(filters).map(
              ([key, value]) =>
                value !== `All ${filterOptions[key].label}s` && (
                  <span
                    key={key}
                    className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm flex items-center gap-2"
                  >
                    {value}
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
        )} */}
      </div>
      <div className="bg-primary/10 p-6 rounded-xl mb-4">
        <h1 className="text-2xl font-bold">Dear {userDetails.name}!</h1>
        <p>
          Welcome to your Mentees Hub. Here, you can view your current mentees ,
          view their profiles , review recent interactions , and schedule
          upcoming sessions. Use this page to guide each entrepreneur based on
          their stage and goals
        </p>
      </div>
      {users.length < 1 ? (
        <NoData />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {users.map((item, key) => (
            <Link
              href={`businessDetailsByMentor/${
                item?.Entreprenuer?.Business?.uuid || "#"
              }`}
              key={key}
              className="group h-full"
            >
              <div className="bg-white dark:bg-boxdark-2 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden h-full flex flex-col">
                <div className="relative w-full h-48 overflow-hidden">
                  <Image
                    src={
                      item?.Entreprenuer?.image || "/images/default-avatar.png"
                    }
                    alt={`${getBusinessName(item)} profile`}
                    fill
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute bottom-4 left-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/90 dark:bg-boxdark/90 text-primary backdrop-blur-sm">
                      {item?.Entreprenuer?.Business?.BusinessSector?.name ||
                        "No Sector"}
                    </span>
                  </div>
                </div>

                <div className="p-6 flex-grow space-y-4">
                  <div className="space-y-2">
                    <h2 className="text-lg font-semibold text-black dark:text-white group-hover:text-primary transition-colors line-clamp-2">
                      {getEntrepreneurName(item)}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                      {getBusinessName(item)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                      {item?.Entreprenuer?.email || "No email provided"}
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    {item?.Entreprenuer?.Business?.program && (
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
                          {item?.Entreprenuer?.Business?.program}
                        </span>
                      </div>
                    )}

                    {item?.Entreprenuer?.Business?.location && (
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
                          {item?.Entreprenuer?.Business?.location}
                        </span>
                      </div>
                    )}

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
                        {item?.Entreprenuer?.Business?.createdAt
                          ? new Date(
                              item?.Entreprenuer?.Business?.createdAt
                            ).getFullYear()
                          : "N/A"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-3">
                    {item?.Entreprenuer?.Business?.facebook && (
                      <a
                        href={item?.Entreprenuer?.Business?.facebook}
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
                    {item?.Entreprenuer?.Business?.linkedin && (
                      <a
                        href={item?.Entreprenuer?.Business?.linkedin}
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

      {!isFiltering && (
        <div className="flex items-center justify-between p-6 border-t border-stroke dark:border-strokedark mt-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (currentPage > 1) {
                  setcurrentPage(currentPage - 1);
                  setRefresh(refresh + 1);
                }
              }}
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
              onClick={() => {
                if (currentPage < totalPages) {
                  setcurrentPage(currentPage + 1);
                  setRefresh(refresh + 1);
                }
              }}
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

export default MentorEntreprenuer;
