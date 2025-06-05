"use client";
import { useContext, useEffect, useState } from "react";
import { getReviewers } from "../../../controllers/user_controller";
import { timeAgo } from "../../../utils/time_ago";
import { useRouter } from "next/navigation";
import Loader from "@/components/common/Loader";
import { createConversation } from "@/app/controllers/conversation_controller";
import NoData from "@/app/component/noData";
import { UserContext } from "../../layout";

const Page = () => {
  const [users, setUsers] = useState([]);
  const [loading, setloading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [limit, setLimit] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const router = useRouter();
  const { userDetails } = useContext(UserContext);

  useEffect(() => {
    getReviewers(limit, currentPage).then((body) => {
      setloading(false);
      setUsers(body.data);
      setTotalPages(Math.ceil(body.count / limit));
    });
  }, [limit, currentPage]);

  const filteredUsers = users.filter(
    (user) =>
      searchTerm === "" ||
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.includes(searchTerm)
  );

  const handleMessage = async (user) => {
    const data = {
      to: user.uuid,
      type: "userToUser",
      lastMessage: "",
    };
    const conversation = await createConversation(data);
    router.push(`/messages/${conversation.uuid}`);
  };

  return loading ? (
    <Loader />
  ) : (
    <div className="container mx-auto px-4">
      <h1 className="text-2xl font-bold mb-4">Welcome {userDetails.name}!</h1>

      <div className="rounded-xl border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        {/* Header Section */}
        <div className="p-6 border-b border-stroke dark:border-strokedark">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h4 className="text-xl font-semibold text-black dark:text-white flex items-center gap-2">
              Reviewers
              <span className="px-3 py-1 text-sm bg-primary/10 text-primary rounded-full">
                {users.length} total
              </span>
            </h4>

            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search reviewers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-64 rounded-lg border border-stroke bg-transparent py-2 pl-10 pr-4 outline-none focus:border-primary dark:border-strokedark"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2">
                <svg
                  className="fill-body h-4 w-4 dark:fill-bodydark"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            </div>
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <NoData />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="border-b border-stroke dark:border-strokedark bg-gray-50 dark:bg-meta-4">
                  <th className="py-4 px-4 text-left font-medium">Reviewer</th>
                  <th className="py-4 px-4 text-left font-medium">Contact</th>
                  <th className="py-4 px-4 text-left font-medium">Joined</th>
                  <th className="py-4 px-4 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => (
                  <tr
                    key={index}
                    className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          {user.image ? (
                            <img
                              src={user.image}
                              alt={user.name}
                              className="h-10 w-10 rounded-full object-cover border-2 border-gray-200 dark:border-boxdark"
                              onError={(e) => {
                                e.target.src =
                                  "https://ui-avatars.com/api/?name=" +
                                  encodeURIComponent(user.name) +
                                  "&background=6366f1&color=fff";
                              }}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-lg font-semibold text-primary">
                                {user.name
                                  ? user.name.charAt(0).toUpperCase()
                                  : "?"}
                              </span>
                            </div>
                          )}
                        </div>
                        <div>
                          <h5 className="font-medium text-black dark:text-white">
                            {user.name}
                          </h5>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {user.role}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                          <span className="text-sm text-black dark:text-white">
                            {user.email}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                            />
                          </svg>
                          <span className="text-sm text-black dark:text-white">
                            {user.phone || "Not provided"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {timeAgo(user.createdAt)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => handleMessage(user)}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90 transition-colors"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                          />
                        </svg>
                        Message
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="p-6 border-t border-stroke dark:border-strokedark">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Show
              </span>
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="rounded-lg border-stroke bg-transparent px-3 py-1 outline-none focus:border-primary dark:border-strokedark"
              >
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                entries
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    currentPage > 1 && setCurrentPage(currentPage - 1)
                  }
                  disabled={currentPage === 1}
                  className={`inline-flex items-center justify-center rounded-lg border border-stroke px-4 py-2 text-sm font-medium transition-colors
                    ${
                      currentPage === 1
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-primary hover:text-white dark:hover:bg-primary"
                    }`}
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    currentPage < totalPages && setCurrentPage(currentPage + 1)
                  }
                  disabled={currentPage === totalPages}
                  className={`inline-flex items-center justify-center rounded-lg border border-stroke px-4 py-2 text-sm font-medium transition-colors
                    ${
                      currentPage === totalPages
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-primary hover:text-white dark:hover:bg-primary"
                    }`}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
