"use client";
import { useContext, useEffect, useState } from "react";
import { useRouter } from "@/utils/navigation";
import { useParams } from "react-router-dom";
import Loader from "@/components/common/Loader";
import Spinner from "@/components/spinner";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { toast } from "react-hot-toast";
import { getUserLogs } from "@/controllers/log_controller";
import { useTranslation } from "@/locales";
import { UserContext } from "../../layouts/DashboardLayout";

const UserActivityLogs = () => {
  const { t } = useTranslation();
  const { uuid } = useParams(); // User UUID
  const router = useRouter();
  const { userDetails } = useContext(UserContext);

  const [userLogs, setUserLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotalPages, setLogsTotalPages] = useState(1);
  const [logsCount, setLogsCount] = useState(0);

  // Helper function to get human-readable time difference
  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffInSeconds = Math.floor((now - past) / 1000);

    if (diffInSeconds < 60) {
      return `${diffInSeconds} ${
        diffInSeconds === 1 ? "second" : "seconds"
      } ago`;
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} ${
        diffInMinutes === 1 ? "minute" : "minutes"
      } ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? "hour" : "hours"} ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      return `${diffInDays} ${diffInDays === 1 ? "day" : "days"} ago`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `${diffInMonths} ${diffInMonths === 1 ? "month" : "months"} ago`;
    }

    const diffInYears = Math.floor(diffInMonths / 12);
    return `${diffInYears} ${diffInYears === 1 ? "year" : "years"} ago`;
  };

  // Fetch user logs
  const fetchUserLogs = async (page = 1) => {
    try {
      setLoadingLogs(true);
      const response = await getUserLogs(uuid, page, 20);

      if (response) {
        setUserLogs(response.data || []);
        setLogsPage(response.page || 1);
        setLogsTotalPages(response.totalPages || 1);
        setLogsCount(response.count || 0);
      }
    } catch (error) {
      console.error("Error fetching user logs:", error);
      toast.error(
        t("logs.errorFetching", "Failed to fetch user activity logs")
      );
    } finally {
      setLoadingLogs(false);
    }
  };

  // Fetch logs when component mounts
  useEffect(() => {
    // Check if user is Admin
    if (userDetails?.role !== "Admin") {
      toast.error(
        t("errors.unauthorized", "You are not authorized to view this page")
      );
      router.back();
      return;
    }

    fetchUserLogs(1);
  }, [uuid]);

  if (loadingLogs && logsPage === 1) {
    return <Loader />;
  }

  return (
    <>
      <Breadcrumb
        prevLink=""
        prevPage="Back"
        pageName={t("logs.userActivityLogs", "User Activity Logs")}
      />

      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        {/* Header */}
        <div className="border-b border-stroke px-7 py-6 dark:border-strokedark">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-semibold text-black dark:text-white">
                {t("logs.userActivity", "User Activity Logs")}
              </h3>
              {logsCount > 0 && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {t("logs.totalLogs", "Total Logs")}:{" "}
                  <span className="font-semibold">{logsCount}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Logs Content */}
        <div className="p-7">
          {loadingLogs ? (
            <div className="flex justify-center items-center py-20">
              <Spinner />
            </div>
          ) : userLogs.length > 0 ? (
            <>
              {/* Logs Table */}
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="bg-gray-2 text-left dark:bg-meta-4">
                      <th className="px-4 py-4 font-medium text-black dark:text-white">
                        #
                      </th>
                      <th className="px-4 py-4 font-medium text-black dark:text-white">
                        {t("logs.action", "Action")}
                      </th>
                      <th className="px-4 py-4 font-medium text-black dark:text-white">
                        {t("logs.timestamp", "Logged At")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {userLogs.map((log, index) => (
                      <tr
                        key={log.uuid}
                        className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <td className="px-4 py-4 text-black dark:text-white">
                          {(logsPage - 1) * 20 + index + 1}
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-black dark:text-white font-medium">
                            {log.action}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {getTimeAgo(log.createdAt)}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {logsTotalPages > 1 && (
                <div className="flex justify-end items-center gap-4 mt-8">
                  <button
                    onClick={() => fetchUserLogs(logsPage - 1)}
                    disabled={logsPage === 1}
                    className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-center font-medium text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {t("common.previous", "Previous")}
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="text-black dark:text-white font-medium">
                      {t("common.page", "Page")} {logsPage}{" "}
                      {t("common.of", "of")} {logsTotalPages}
                    </span>
                  </div>

                  <button
                    onClick={() => fetchUserLogs(logsPage + 1)}
                    disabled={logsPage === logsTotalPages}
                    className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-center font-medium text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {t("common.next", "Next")}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20">
              <span className="text-8xl mb-4 block">📝</span>
              <p className="text-gray-500 dark:text-gray-400 text-xl font-medium">
                {t("logs.noActivity", "No activity logs found for this user")}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default UserActivityLogs;
