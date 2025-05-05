"use client";
import { useContext, useEffect, useState } from "react";
import { getPendingBusinesses } from "../../../controllers/business_controller";
import { timeAgo } from "../../../utils/time_ago";
import Link from "next/link";
import Loader from "@/components/common/Loader";
import NoData from "@/app/component/noData";
import {
  HiOutlineSearch,
  HiOutlineEye,
  HiOutlineUserGroup,
} from "react-icons/hi";
import { MdOutlineKeyboardArrowRight } from "react-icons/md";
import { BiFilterAlt } from "react-icons/bi";

const Page = () => {
  const [applications, setApplications] = useState([]);
  const [ShowOptions, setShowOptions] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [loading, setloading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("date"); // date, name, etc.

  useEffect(() => {
    getPendingBusinesses(1, 10).then((data) => {
      setloading(false);
      console.log(data);
      setApplications(data.data);
    });
  }, []);

  const filteredApplications = applications.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.phone.includes(searchTerm)
  );

  const getStatusColor = (daysAgo) => {
    if (daysAgo < 2) return "bg-success/10 text-success";
    if (daysAgo < 5) return "bg-warning/10 text-warning";
    return "bg-danger/10 text-danger";
  };

  return loading ? (
    <div className="flex items-center justify-center min-h-[400px] bg-white">
      <Loader />
    </div>
  ) : (
    <div className="container mx-auto px-4 py-8">
      <div className="rounded-2xl border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark overflow-hidden">
        {/* Enhanced Header Section with Background Pattern */}
        <div className="relative p-6 border-b border-stroke dark:border-strokedark bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div>
                <h4 className="text-xl font-semibold text-black dark:text-white flex items-center gap-3 mb-2">
                  Pending Applications
                  <span className="px-3 py-1 text-sm bg-primary/10 text-primary rounded-full font-medium">
                    {applications.length} pending
                  </span>
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Review and process business applications
                </p>
              </div>
            </div>

            {/* Enhanced Search and Filter Section */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search applications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full md:w-72 rounded-xl border border-stroke bg-white/80 backdrop-blur-sm py-3 pl-12 pr-4 outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark/80"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2">
                  <HiOutlineSearch className="h-5 w-5 text-body dark:text-bodydark" />
                </span>
              </div>

              <select
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-xl border border-stroke bg-white/80 backdrop-blur-sm px-4 py-3 outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark/80"
              >
                <option value="date">Sort by Date</option>
                <option value="name">Sort by Name</option>
                <option value="status">Sort by Status</option>
              </select>
            </div>
          </div>
        </div>

        {applications.length < 1 ? (
          <NoData />
        ) : (
          <div className="p-6">
            {/* Modern Table Header */}
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-4 mb-4 px-4 py-3 bg-gray-1 dark:bg-meta-4 rounded-lg">
              <div className="col-span-1">
                <p className="text-sm font-semibold text-black dark:text-white">
                  Status
                </p>
              </div>
              <div className="col-span-2 hidden sm:block">
                <p className="text-sm font-semibold text-black dark:text-white">
                  Business Name
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-sm font-semibold text-black dark:text-white">
                  Contact
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-sm font-semibold text-black dark:text-white">
                  Timeline
                </p>
              </div>
              <div className="col-span-1">
                <p className="text-sm font-semibold text-black dark:text-white">
                  Actions
                </p>
              </div>
            </div>

            {/* Enhanced Table Body */}
            <div className="space-y-3">
              {filteredApplications.map((item, key) => {
                const daysAgo = Math.floor(
                  (new Date() - new Date(item.createdAt)) /
                    (1000 * 60 * 60 * 24)
                );
                return (
                  <div
                    key={key}
                    className="group grid grid-cols-6 sm:grid-cols-8 gap-4 px-4 py-4 rounded-xl border border-stroke dark:border-strokedark hover:bg-gray-1 dark:hover:bg-meta-4 transition-all duration-300 hover:shadow-md"
                  >
                    <div className="col-span-1 flex items-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          daysAgo
                        )}`}
                      >
                        {daysAgo < 2
                          ? "New"
                          : daysAgo < 5
                          ? "Pending"
                          : "Urgent"}
                      </span>
                    </div>
                    <div className="col-span-2 hidden sm:flex items-center">
                      <p className="text-sm font-medium text-black dark:text-white group-hover:text-primary transition-colors">
                        {item.name}
                      </p>
                    </div>
                    <div className="col-span-2 flex flex-col gap-1">
                      <p className="text-sm text-black dark:text-white">
                        {item.phone}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {item.email}
                      </p>
                    </div>
                    <div className="col-span-2 flex items-center">
                      <div className="flex flex-col">
                        <span className="text-sm text-black dark:text-white">
                          {timeAgo(item.createdAt)}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Application ID: #{item.uuid.slice(0, 8)}
                        </span>
                      </div>
                    </div>
                    <div className="col-span-1 flex items-center justify-end">
                      <div className="relative">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/businessDetails/${item.uuid}`}
                            className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                            title="View Details"
                          >
                            <HiOutlineEye className="h-5 w-5" />
                          </Link>
                          <Link
                            href={`/assignReviewer/${item.uuid}`}
                            className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                            title="Assign Reviewer"
                          >
                            <HiOutlineUserGroup className="h-5 w-5" />
                          </Link>
                          <button
                            onClick={() => {
                              if (item.uuid === ShowOptions) {
                                setShowOptions("");
                                setSelectedBusiness(item);
                              } else {
                                setShowOptions(item.uuid);
                                setSelectedBusiness(null);
                              }
                            }}
                            className="p-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
                            title="More Options"
                          >
                            <MdOutlineKeyboardArrowRight className="h-5 w-5" />
                          </button>
                        </div>

                        {/* Enhanced Dropdown Menu */}
                        <div
                          className={`absolute right-0 mt-2 w-48 rounded-xl border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark z-50 transition-all duration-300 ${
                            ShowOptions === item.uuid
                              ? "opacity-100 visible translate-y-0"
                              : "opacity-0 invisible translate-y-2"
                          }`}
                        >
                          {[
                            {
                              title: "View full details",
                              path: `/businessDetails/${item.uuid}`,
                            },
                            {
                              title: "Assign reviewer",
                              path: `/assignReviewer/${item.uuid}`,
                            },
                            {
                              title: "Download application",
                              path: `#`,
                            },
                          ].map((option) => (
                            <Link
                              key={option.title}
                              href={option.path}
                              className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-black dark:text-white hover:bg-gray-1 dark:hover:bg-meta-4 transition-colors first:rounded-t-xl last:rounded-b-xl"
                            >
                              {option.title}
                              <MdOutlineKeyboardArrowRight className="ml-auto h-5 w-5" />
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;
