"use client";
import { useEffect, useState, useCallback } from "react";
import { getMentors } from "../../../controllers/user_controller";
import { timeAgo } from "../../../utils/time_ago";
import Loader from "@/components/common/Loader";
import NoData from "@/app/component/noData";
import { useRouter } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Image from "next/image";
import debounce from 'lodash/debounce';

const Page = () => {
  const [users, setUsers] = useState([]);
  const [loading, setloading] = useState(true);
  const [total, settotal] = useState(0);
  const [limit, setlimit] = useState(20);
  const [currentPage, setcurrentPage] = useState(1);
  const [totalPages, settotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const router = useRouter();

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((value) => {
      setDebouncedSearchTerm(value);
      setcurrentPage(1); // Reset to first page when searching
    }, 500),
    []
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        setloading(true);
        const body = await getMentors(limit, currentPage, debouncedSearchTerm);
        setUsers(body.data);
        settotal(body.count);
        setcurrentPage(body.page);
        settotalPages(body.totalPages);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setloading(false);
      }
    };

    fetchData();
  }, [limit, currentPage, debouncedSearchTerm]);

  const handleSearch = (e) => {
    e.preventDefault(); // Prevent form submission
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  return loading ? (
    <Loader />
  ) : (
    <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
      <Breadcrumb
        prevLink={`/dashboard`}
        prevPage="Dashboard"
        pageName="Mentors"
      />
      
      <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        {/* Header Section */}
        <div className="border-b border-stroke px-6 py-4 dark:border-strokedark">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary bg-opacity-10">
                <svg
                  className="fill-primary dark:fill-white"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 5C13.66 5 15 6.34 15 8C15 9.66 13.66 11 12 11C10.34 11 9 9.66 9 8C9 6.34 10.34 5 12 5ZM12 19.2C9.5 19.2 7.29 17.92 6 15.98C6.03 13.99 10 12.9 12 12.9C13.99 12.9 17.97 13.99 18 15.98C16.71 17.92 14.5 19.2 12 19.2Z"
                    fill=""
                  />
                </svg>
              </div>
              <div>
                <h4 className="text-2xl font-bold text-black dark:text-white">
                  Mentors
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Manage mentors and their assigned entrepreneurs
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <div className="relative w-full md:w-80">
                <input
                  type="text"
                  placeholder="Search mentors..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="w-full rounded-lg border border-stroke bg-white px-4 py-3 pl-10 text-sm focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                />
                <span className="absolute left-3 top-3.5">
                  <svg
                    className="fill-body hover:fill-primary dark:fill-bodydark dark:hover:fill-primary"
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M9.16666 3.33332C5.945 3.33332 3.33332 5.945 3.33332 9.16666C3.33332 12.3883 5.945 15 9.16666 15C12.3883 15 15 12.3883 15 9.16666C15 5.945 12.3883 3.33332 9.16666 3.33332ZM1.66666 9.16666C1.66666 5.02452 5.02452 1.66666 9.16666 1.66666C13.3088 1.66666 16.6667 5.02452 16.6667 9.16666C16.6667 13.3088 13.3088 16.6667 9.16666 16.6667C5.02452 16.6667 1.66666 13.3088 1.66666 9.16666Z"
                      fill=""
                    />
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M13.2857 13.2857C13.6112 12.9603 14.1388 12.9603 14.4642 13.2857L18.0892 16.9107C18.4147 17.2362 18.4147 17.7638 18.0892 18.0892C17.7638 18.4147 17.2362 18.4147 16.9107 18.0892L13.2857 14.4642C12.9603 14.1388 12.9603 13.6112 13.2857 13.2857Z"
                      fill=""
                    />
                  </svg>
                </span>
              </div>
              <select
                value={limit}
                onChange={(e) => {
                  setlimit(Number(e.target.value));
                  setcurrentPage(1); // Reset to first page when changing limit
                }}
                className="rounded-lg border border-stroke bg-white px-4 py-3 text-sm focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
              >
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="p-6">
          {users.length === 0 ? (
            <NoData />
          ) : (
            <div className="max-w-full overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-2 text-left dark:bg-meta-4">
                    <th className="min-w-[220px] py-4 px-4 font-medium text-black dark:text-white xl:pl-11">
                      Mentor
                    </th>
                    <th className="min-w-[150px] py-4 px-4 font-medium text-black dark:text-white">
                      Contact
                    </th>
                    <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">
                      Joined
                    </th>
                    <th className="py-4 px-4 font-medium text-black dark:text-white">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((mentor, index) => (
                    <tr
                      key={index}
                      className="border-b border-[#eee] dark:border-strokedark hover:bg-gray-1 dark:hover:bg-meta-4 transition-colors duration-200"
                    >
                      <td className="border-b border-[#eee] py-5 px-4 pl-9 dark:border-strokedark xl:pl-11">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            {mentor.image ? (
                              <Image
                                src={mentor.image}
                                alt={mentor.name}
                                width={40}
                                height={40}
                                className="rounded-full object-cover border-2 border-gray-200 dark:border-boxdark"
                                onError={(e) => {
                                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(mentor.name)}&background=6366f1&color=fff`;
                                }}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-lg font-semibold text-primary">
                                  {mentor.name ? mentor.name.charAt(0).toUpperCase() : "?"}
                                </span>
                              </div>
                            )}
                          </div>
                          <div>
                            <h5 className="font-medium text-black dark:text-white">
                              {mentor.name}
                            </h5>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {mentor.role}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary bg-opacity-10">
                              <svg
                                className="fill-primary dark:fill-white"
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M14.5 2.5H1.5C1.225 2.5 1 2.725 1 3V13C1 13.275 1.225 13.5 1.5 13.5H14.5C14.775 13.5 15 13.275 15 13V3C15 2.725 14.775 2.5 14.5 2.5ZM14.5 13H1.5V3H14.5V13Z"
                                  fill=""
                                />
                              </svg>
                            </div>
                            <span className="text-sm text-black dark:text-white">{mentor.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary bg-opacity-10">
                              <svg
                                className="fill-primary dark:fill-white"
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M14.5 11.5C14.5 12.05 14.05 12.5 13.5 12.5H2.5C1.95 12.5 1.5 12.05 1.5 11.5V4.5C1.5 3.95 1.95 3.5 2.5 3.5H13.5C14.05 3.5 14.5 3.95 14.5 4.5V11.5ZM13.5 4.5H2.5V11.5H13.5V4.5Z"
                                  fill=""
                                />
                              </svg>
                            </div>
                            <span className="text-sm text-black dark:text-white">{mentor.phone || "Not provided"}</span>
                          </div>
                        </div>
                      </td>
                      <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary bg-opacity-10">
                            <svg
                              className="fill-primary dark:fill-white"
                              width="16"
                              height="16"
                              viewBox="0 0 16 16"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M8 0.5C3.58 0.5 0 4.08 0 8.5C0 12.92 3.58 16.5 8 16.5C12.42 16.5 16 12.92 16 8.5C16 4.08 12.42 0.5 8 0.5ZM8 13.5C4.69 13.5 2 10.81 2 7.5C2 4.19 4.69 1.5 8 1.5C11.31 1.5 14 4.19 14 7.5C14 10.81 11.31 13.5 8 13.5Z"
                                fill=""
                              />
                              <path
                                d="M8 3.5C7.45 3.5 7 3.95 7 4.5V8.5C7 8.78 7.11 9.05 7.29 9.24L10.29 12.24C10.68 12.63 11.31 12.63 11.7 12.24C12.09 11.85 12.09 11.22 11.7 10.83L9 8.12V4.5C9 3.95 8.55 3.5 8 3.5Z"
                                fill=""
                              />
                            </svg>
                          </div>
                          <span className="text-sm text-black dark:text-white">
                            {timeAgo(mentor.createdAt)}
                          </span>
                        </div>
                      </td>
                      <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                        <button
                          onClick={() => router.push(`/mentorEntreprenuers/${mentor.uuid}`)}
                          className="inline-flex items-center justify-center gap-2 rounded-md bg-primary py-2 px-4 text-sm font-medium text-white hover:bg-opacity-90 transition-colors duration-200"
                        >
                          <svg
                            className="fill-current"
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M8 1.5C4.41 1.5 1.5 4.41 1.5 8C1.5 11.59 4.41 14.5 8 14.5C11.59 14.5 14.5 11.59 14.5 8C14.5 4.41 11.59 1.5 8 1.5ZM8 13.5C5.24 13.5 3 11.26 3 8.5C3 5.74 5.24 3.5 8 3.5C10.76 3.5 13 5.74 13 8.5C13 11.26 10.76 13.5 8 13.5Z"
                              fill=""
                            />
                            <path
                              d="M8 5.5C7.45 5.5 7 5.95 7 6.5V8.5C7 9.05 7.45 9.5 8 9.5C8.55 9.5 9 9.05 9 8.5V6.5C9 5.95 8.55 5.5 8 5.5Z"
                              fill=""
                            />
                            <path
                              d="M8 10.5C7.45 10.5 7 10.95 7 11.5C7 12.05 7.45 12.5 8 12.5C8.55 12.5 9 12.05 9 11.5C9 10.95 8.55 10.5 8 10.5Z"
                              fill=""
                            />
                          </svg>
                          Assign Entrepreneurs
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 py-6 px-4 border-t border-stroke dark:border-strokedark">
            <div className="flex items-center gap-2 text-sm text-black dark:text-white">
              <span>Showing</span>
              <span className="font-medium">{((currentPage - 1) * limit) + 1}</span>
              <span>to</span>
              <span className="font-medium">{Math.min(currentPage * limit, total)}</span>
              <span>of</span>
              <span className="font-medium">{total}</span>
              <span>entries</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (currentPage > 1) {
                    setcurrentPage(1);
                  }
                }}
                disabled={currentPage === 1}
                className="inline-flex items-center justify-center rounded-md border border-stroke p-2 text-sm font-medium text-black hover:bg-gray-1 disabled:opacity-50 disabled:cursor-not-allowed dark:border-strokedark dark:text-white dark:hover:bg-meta-4 transition-colors duration-200"
                title="First Page"
              >
                <svg
                  className="fill-current"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M11.5 3.5L7.5 7.5L11.5 11.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M6.5 3.5L2.5 7.5L6.5 11.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <button
                onClick={() => {
                  if (currentPage > 1) {
                    setcurrentPage(currentPage - 1);
                  }
                }}
                disabled={currentPage === 1}
                className="inline-flex items-center justify-center rounded-md border border-stroke p-2 text-sm font-medium text-black hover:bg-gray-1 disabled:opacity-50 disabled:cursor-not-allowed dark:border-strokedark dark:text-white dark:hover:bg-meta-4 transition-colors duration-200"
                title="Previous Page"
              >
                <svg
                  className="fill-current"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10.5 3.5L6.5 7.5L10.5 11.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, index) => {
                  const pageNumber = index + 1;
                  const isCurrentPage = pageNumber === currentPage;
                  const isNearCurrentPage = 
                    Math.abs(pageNumber - currentPage) <= 1 || 
                    pageNumber === 1 || 
                    pageNumber === totalPages;

                  if (!isNearCurrentPage) {
                    if (pageNumber === 2 || pageNumber === totalPages - 1) {
                      return (
                        <span key={pageNumber} className="px-2 text-sm text-black dark:text-white">
                          ...
                        </span>
                      );
                    }
                    return null;
                  }

                  return (
                    <button
                      key={pageNumber}
                      onClick={() => {
                        setcurrentPage(pageNumber);
                      }}
                      className={`inline-flex items-center justify-center rounded-md px-3 py-1 text-sm font-medium transition-colors duration-200 ${
                        isCurrentPage
                          ? 'bg-primary text-white hover:bg-opacity-90'
                          : 'border border-stroke text-black hover:bg-gray-1 dark:border-strokedark dark:text-white dark:hover:bg-meta-4'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => {
                  if (currentPage < totalPages) {
                    setcurrentPage(currentPage + 1);
                  }
                }}
                disabled={currentPage === totalPages}
                className="inline-flex items-center justify-center rounded-md border border-stroke p-2 text-sm font-medium text-black hover:bg-gray-1 disabled:opacity-50 disabled:cursor-not-allowed dark:border-strokedark dark:text-white dark:hover:bg-meta-4 transition-colors duration-200"
                title="Next Page"
              >
                <svg
                  className="fill-current"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M5.5 3.5L9.5 7.5L5.5 11.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <button
                onClick={() => {
                  if (currentPage < totalPages) {
                    setcurrentPage(totalPages);
                  }
                }}
                disabled={currentPage === totalPages}
                className="inline-flex items-center justify-center rounded-md border border-stroke p-2 text-sm font-medium text-black hover:bg-gray-1 disabled:opacity-50 disabled:cursor-not-allowed dark:border-strokedark dark:text-white dark:hover:bg-meta-4 transition-colors duration-200"
                title="Last Page"
              >
                <svg
                  className="fill-current"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4.5 3.5L8.5 7.5L4.5 11.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9.5 3.5L13.5 7.5L9.5 11.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
