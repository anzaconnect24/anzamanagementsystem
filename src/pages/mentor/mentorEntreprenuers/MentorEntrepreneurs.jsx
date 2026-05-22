"use client";

import { useContext, useEffect, useState } from "react";
import { UserContext } from "@/layouts/DashboardLayout";
import { getMentorAssignedEntreprenuers } from "@/controllers/mentorEntreprenuerController";
import Link from "@/utils/link";
import Loader from "@/components/common/Loader";
import NoData from "@/component/noData";
import Image from "@/utils/image";
import {
  FaLayerGroup,
  FaSearch,
  FaBuilding,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaArrowRight,
  FaUserGraduate,
} from "react-icons/fa";

const MentorEntreprenuer = () => {
  const { userDetails } = useContext(UserContext);

  const [users, setUsers] = useState([]);
  const [loading, setloading] = useState(true);
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

  useEffect(() => {
    if (!userDetails?.uuid) return;

    setloading(true);

    getMentorAssignedEntreprenuers(userDetails.uuid, 1000, 1, keyword).then(
      (body) => {
        let data = Array.isArray(body) ? body : body?.data || [];

        if (isFiltering) {
          if (filters.sector !== "All Sectors") {
            data = data.filter(
              (item) =>
                item?.Entreprenuer?.Business?.BusinessSector?.name ===
                filters.sector
            );
          }

          if (filters.year !== "All Years") {
            data = data.filter(
              (item) =>
                new Date(item?.Entreprenuer?.Business?.createdAt)
                  .getFullYear()
                  .toString() === filters.year
            );
          }

          if (filters.program !== "All Programs") {
            data = data.filter(
              (item) =>
                item?.Entreprenuer?.Business?.program === filters.program
            );
          }
        }

        data.sort((a, b) => {
          const direction = sortConfig.direction === "asc" ? 1 : -1;

          switch (sortConfig.key) {
            case "name":
              return (
                direction *
                (a?.Entreprenuer?.name?.localeCompare(b?.Entreprenuer?.name) ||
                  0)
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

        setUsers(data);
        setloading(false);
      }
    );
  }, [sortConfig, filters, keyword, userDetails?.uuid, isFiltering]);

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

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen px-6 py-4">
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
            Mentorship Network
          </span>

          <h2 className="mb-3 text-4xl font-bold leading-tight drop-shadow-lg">
            Mentees Hub
          </h2>

          <p className="mb-6 text-lg text-white/85 drop-shadow-md">
            Monitor entrepreneur growth, manage mentoring relationships,
            schedule sessions, and support founders across high-impact sectors.
          </p>

          <div className="flex flex-wrap items-center gap-6 text-sm text-white/85">
            <span className="flex items-center gap-2">
              <FaLayerGroup />
              Assigned Entrepreneurs
            </span>

            <span className="flex items-center gap-2">
              <FaUserGraduate />
              Mentorship Sessions
            </span>
          </div>
        </div>
      </div>

      <h2 className="mb-6 text-2xl font-bold text-[#172033]">
        Assigned Mentees
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
                <span>
                  Sort:{" "}
                  {sortOptions.find((opt) => opt.value === sortConfig.key)
                    ?.label || "Name"}
                </span>
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
              placeholder="Search entrepreneurs..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full rounded-md border border-black/10 bg-white px-4 py-3 pl-10 text-sm text-[#172033] outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
            />
          </div>
        </div>
      </div>

      {users.length < 1 ? (
        <NoData />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {users.map((item, key) => (
            <Link
              href={`businessDetailsByMentor/${
                item?.Entreprenuer?.Business?.uuid || "#"
              }`}
              key={key}
              className="group overflow-hidden rounded-xl bg-white shadow-md transition duration-200 hover:scale-[1.02] hover:shadow-lg"
            >
              <div className="relative h-56 overflow-hidden bg-black">
                <Image
                  src={item?.Entreprenuer?.image || "/images/default-avatar.png"}
                  alt={`${getBusinessName(item)} profile`}
                  fill
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                <div className="absolute bottom-4 left-4">
                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 shadow-sm backdrop-blur-sm">
                    {item?.Entreprenuer?.Business?.BusinessSector?.name ||
                      "No Sector"}
                  </span>
                </div>
              </div>

              <div className="flex min-h-[270px] flex-col p-5">
                <h3 className="mb-2 line-clamp-2 text-lg font-bold text-[#111827]">
                  {getEntrepreneurName(item)}
                </h3>

                <p className="mb-1 line-clamp-1 text-sm font-medium text-[#172033]">
                  {getBusinessName(item)}
                </p>

                <p className="mb-5 line-clamp-1 text-sm text-[#6f6f72]">
                  {item?.Entreprenuer?.email || "No email provided"}
                </p>

                <div className="space-y-3 text-sm text-[#6f6f72]">
                  {item?.Entreprenuer?.Business?.program && (
                    <div className="flex items-center gap-2">
                      <FaBuilding className="shrink-0" />
                      <span className="line-clamp-1">
                        {item?.Entreprenuer?.Business?.program}
                      </span>
                    </div>
                  )}

                  {item?.Entreprenuer?.Business?.location && (
                    <div className="flex items-center gap-2">
                      <FaMapMarkerAlt className="shrink-0" />
                      <span className="line-clamp-1">
                        {item?.Entreprenuer?.Business?.location}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <FaCalendarAlt className="shrink-0" />
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
    </div>
  );
};

export default MentorEntreprenuer;