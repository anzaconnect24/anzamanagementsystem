"use client";
import { useState, useEffect, useContext } from "react";
import { useRouter } from "@/utils/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import { server_url } from "@/utils/endpoint";
import { headers } from "@/utils/headers";
import { UserContext } from "../../../layouts/DashboardLayout";

import Spinner from "@/components/spinner";
import Loader from "@/components/common/Loader";
import {
  MdCheckCircle,
  MdPending,
  MdAssignment,
  MdRateReview,
  MdSearch,
  MdPersonAdd,
  MdRemoveRedEye,
} from "react-icons/md";
import { useTranslation } from "@/locales";

const CratReviewApplicationsPage = () => {
  const { t } = useTranslation();
  const { userDetails } = useContext(UserContext);
  const router = useRouter();
  const [initialLoading, setInitialLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(6);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedReview, setSelectedReview] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [assigningReviewer, setAssigningReviewer] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [selectedReviewer, setSelectedReviewer] = useState("");
  const [finalStatus, setFinalStatus] = useState("");
  const [adminComments, setAdminComments] = useState("");

  useEffect(() => {
    if (userDetails?.role !== "Admin") {
      router.push("/");
      return;
    }
    fetchReviews();
    fetchStaffMembers();
  }, [currentPage, searchTerm, statusFilter, userDetails]);

  const fetchReviews = async () => {
    try {
      const response = await axios.get(`${server_url}/crat_reviews`, {
        headers,
        params: {
          page: currentPage,
          limit,
          search: searchTerm || undefined,
          status: statusFilter || undefined,
        },
      });

      if (response.data.status) {
        console.log("CRAT reviews:", response.data.body.data);
        const data = response.data.body.data || [];

        // Validate data structure - check if it's CRAT reviews or user data
        if (
          data.length > 0 &&
          !data[0].hasOwnProperty("entrepreneur") &&
          !data[0].hasOwnProperty("submitted_at")
        ) {
          console.error(
            "Invalid data structure received - expected CRAT reviews but got:",
            data,
          );
          toast.error(
            t(
              "cratReviews.errors.invalidData",
              "Received invalid data structure. Please contact support.",
            ),
          );
          setReviews([]);
          setTotal(0);
          return;
        }

        setReviews(data);
        setTotal(response.data.body.count || 0);
      }
    } catch (error) {
      console.error("Error fetching CRAT reviews:", error);
      toast.error(
        t("cratReviews.errors.fetchReviews", "Failed to fetch CRAT reviews"),
      );
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchStaffMembers = async () => {
    try {
      const response = await axios.get(`${server_url}/user/reviewers`, {
        headers,
      });

      if (response.data.status) {
        console.log("Staff members:", response.data.body.data);
        setStaffMembers(response.data.body.data || []);
      }
    } catch (error) {
      console.error("Error fetching staff members:", error);
    }
  };

  const handleAssignReviewer = async () => {
    if (!selectedReviewer) {
      toast.error(
        t("cratReviews.validation.selectReviewer", "Please select a reviewer"),
      );
      return;
    }

    try {
      setAssigningReviewer(true);
      const response = await axios.put(
        `${server_url}/crat_reviews/${selectedReview.uuid}/assign`,
        { reviewer_id: selectedReviewer },
        { headers },
      );

      if (response.data.status) {
        toast.success(
          t("cratReviews.success.assigned", "Reviewer assigned successfully!"),
        );
        setShowAssignModal(false);
        setSelectedReview(null);
        setSelectedReviewer("");
        fetchReviews();
      } else {
        toast.error(
          response.data.message ||
            t("cratReviews.errors.assignReviewer", "Failed to assign reviewer"),
        );
      }
    } catch (error) {
      console.error("Error assigning reviewer:", error);
      toast.error(
        t("cratReviews.errors.assigningReviewer", "Error assigning reviewer"),
      );
    } finally {
      setAssigningReviewer(false);
    }
  };

  const handleFinalizeReview = async () => {
    if (!finalStatus || !adminComments.trim()) {
      toast.error(
        t(
          "cratReviews.validation.finalStatusAndComments",
          "Please provide final status and comments",
        ),
      );
      return;
    }

    try {
      setFinalizing(true);
      const response = await axios.put(
        `${server_url}/crat_reviews/${selectedReview.uuid}/finalize`,
        {
          final_status: finalStatus,
          admin_comments: adminComments.trim(),
        },
        { headers },
      );

      if (response.data.status) {
        toast.success(
          t("cratReviews.success.finalized", "Review finalized successfully!"),
        );
        setShowFinalizeModal(false);
        setSelectedReview(null);
        setFinalStatus("");
        setAdminComments("");
        fetchReviews();
      } else {
        toast.error(
          response.data.message ||
            t(
              "cratReviews.errors.finalizeReviewer",
              "Failed to finalize review",
            ),
        );
      }
    } catch (error) {
      console.error("Error finalizing review:", error);
      toast.error(
        t("cratReviews.errors.finalizingReviewer", "Error finalizing review"),
      );
    } finally {
      setFinalizing(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <MdPending className="text-yellow-500" />;
      case "assigned":
        return <MdAssignment className="text-blue-500" />;
      case "in_review":
        return <MdRateReview className="text-purple-500" />;
      case "reviewed":
        return <MdRateReview className="text-orange-500" />;
      case "accepted":
        return <MdCheckCircle className="text-green-500" />;
      case "rejected":
        return <MdCheckCircle className="text-red-500" />;
      default:
        return <MdPending className="text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "assigned":
        return "bg-blue-100 text-blue-800";
      case "in_review":
        return "bg-purple-100 text-purple-800";
      case "reviewed":
        return "bg-orange-100 text-orange-800";
      case "accepted":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const totalPages = Math.ceil(total / limit);

  if (initialLoading) {
    return <Loader />;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="rounded-xl border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        {/* Header */}
        <div className="p-6 border-b border-stroke dark:border-strokedark">
          <h4 className="text-xl font-semibold text-black dark:text-white">
            {t("cratReviews.title", "CRAT Review Applications")}
          </h4>
          <p className="mt-2 text-bodydark2">
            {t(
              "cratReviews.subtitle",
              "Manage CRAT review applications from startups. Assign reviewers and finalize decisions.",
            )}
          </p>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-stroke dark:border-strokedark">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={t(
                  "cratReviews.searchPlaceholder",
                  "Search by business name or email...",
                )}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-black/20 rounded-lg focus:ring-primary focus:border-primary dark:border-strokedark dark:bg-form-input dark:text-white"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 w-48 border border-black/20 rounded-lg focus:ring-primary focus:border-primary dark:border-strokedark dark:bg-form-input dark:text-white"
            >
              <option value="">
                {t("cratReviews.filters.allStatuses", "All Statuses")}
              </option>
              <option value="pending">
                {t("cratReviews.status.pending", "Pending")}
              </option>
              <option value="assigned">
                {t("cratReviews.status.assigned", "Assigned")}
              </option>
              <option value="in_review">
                {t("cratReviews.status.in_review", "In Review")}
              </option>
              <option value="reviewed">
                {t("cratReviews.status.reviewed", "Reviewed")}
              </option>
              <option value="accepted">
                {t("cratReviews.status.accepted", "Accepted")}
              </option>
              <option value="rejected">
                {t("cratReviews.status.rejected", "Rejected")}
              </option>
            </select>
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="p-6">
          {reviews.length === 0 ? (
            <div className="text-center py-12">
              <MdRateReview className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                {t(
                  "cratReviews.empty.title",
                  "No CRAT review applications found",
                )}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t(
                  "cratReviews.empty.description",
                  "CRAT review applications will appear here when startups submit them.",
                )}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviews.map((review) => (
                <div
                  key={review.uuid}
                  className="bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Business Image */}
                  <div className="relative">
                    <div className="w-full h-52 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                      <img
                        src={review.entrepreneur?.image || "/user.png"}
                        alt={
                          review.entrepreneur?.Business?.name ||
                          review.entrepreneur?.name
                        }
                        className="w-full h-full object-cover"
                        onError={(e) => (e.target.src = "/user.png")}
                      />
                    </div>
                    {/* Status Badge Overlay */}
                    <div className="absolute top-3 left-3">
                      <span
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg backdrop-blur-sm bg-opacity-90 flex items-center gap-1.5 ${getStatusColor(
                          review.status,
                        )}`}
                      >
                        {getStatusIcon(review.status)}
                        {t(
                          `cratReviews.status.${review.status}`,
                          review.status.replace("_", " "),
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-5">
                    {/* Business Details */}
                    <div className="mb-4">
                      <h6 className="font-bold text-lg text-black dark:text-white truncate mb-2">
                        {review.entrepreneur?.Business?.name ||
                          review.entrepreneur?.name ||
                          "N/A"}
                      </h6>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate mb-3">
                        {review.entrepreneur?.Business?.email ||
                          review.entrepreneur?.email}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                        <svg
                          className="w-3.5 h-3.5"
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
                          {new Date(review.submitted_at).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric", year: "numeric" },
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Reviewer Comments (visible when reviewed) */}
                    {/* {review.status === "reviewed" && review.reviewer_comments && (
                    <div className="mb-4">
                      <h6 className="font-medium text-black dark:text-white mb-2 text-sm">
                        Reviewer Comments:
                      </h6>
                      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                        <p className="text-bodydark2 text-sm line-clamp-3">
                          {review.reviewer_comments}
                        </p>
                      </div>
                    </div>
                  )} */}

                    {/* Actions */}
                    <div className="space-y-2.5 w-full pt-2 border-t border-black/10 dark:border-gray-700">
                      {review.status === "pending" && (
                        <button
                          onClick={() => {
                            setSelectedReview(review);
                            setShowAssignModal(true);
                          }}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-black/70 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg"
                        >
                          <MdPersonAdd className="text-lg" />
                          {t("cratReviews.actions.assign", "Assign Reviewer")}
                        </button>
                      )}

                      {review.status === "reviewed" && (
                        <button
                          onClick={() => {
                            setSelectedReview(review);
                            setShowFinalizeModal(true);
                          }}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg"
                        >
                          <MdCheckCircle className="text-lg" />
                          {t("cratReviews.actions.finalize", "Finalize Review")}
                        </button>
                      )}

                      <button
                        onClick={() => {
                          router.push(
                            `/dashboard/report?user_uuid=${review.entrepreneur?.uuid}`,
                          );
                        }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg"
                      >
                        <MdRemoveRedEye className="text-lg" />
                        {t(
                          "cratReviews.actions.viewCratReport",
                          "View CRAT Report",
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <nav className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage <= 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-black/20 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t("cratReviews.pagination.previous", "Previous")}
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        currentPage === page
                          ? "bg-primary text-white"
                          : "text-gray-500 bg-white border border-black/20 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  ),
                )}

                <button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage >= totalPages}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-black/20 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t("cratReviews.pagination.next", "Next")}
                </button>
              </nav>
            </div>
          )}
        </div>
      </div>

      {/* Assign Reviewer Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-boxdark rounded-xl max-w-md w-full p-6">
            <h5 className="text-lg font-semibold text-black dark:text-white mb-4">
              {t("cratReviews.modals.assignReviewer.title", "Assign Reviewer")}
            </h5>
            <p className="text-bodydark2 mb-4">
              {t(
                "cratReviews.modals.assignReviewer.description",
                "Select a staff member to review this CRAT application for",
              )}{" "}
              <strong>
                {selectedReview?.entrepreneur.Business?.name ||
                  selectedReview?.entrepreneur.name}
              </strong>
            </p>

            <div className="mb-4">
              <label className="block font-medium text-black dark:text-white mb-2">
                {t(
                  "cratReviews.modals.assignReviewer.selectReviewer",
                  "Select Reviewer",
                )}
              </label>
              <select
                value={selectedReviewer}
                onChange={(e) => setSelectedReviewer(e.target.value)}
                className="w-full px-4 py-2 border border-black/20 rounded-lg focus:ring-primary focus:border-primary dark:border-strokedark dark:bg-form-input dark:text-white"
              >
                <option value="">
                  {t(
                    "cratReviews.modals.assignReviewer.chooseReviewer",
                    "Choose a reviewer...",
                  )}
                </option>
                {staffMembers.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAssignReviewer}
                disabled={assigningReviewer || !selectedReviewer}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50"
              >
                {assigningReviewer ? (
                  <>
                    <Spinner />
                    {t("cratReviews.states.assigning", "Assigning...")}
                  </>
                ) : (
                  <>
                    <MdPersonAdd />
                    {t("cratReviews.actions.assignReviewer", "Assign Reviewer")}
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedReview(null);
                  setSelectedReviewer("");
                }}
                className="px-4 py-2 border border-black/20 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                {t("common.cancel", "Cancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Finalize Review Modal */}
      {showFinalizeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-boxdark rounded-xl max-w-md w-full p-6">
            <h5 className="text-lg font-semibold text-black dark:text-white mb-4">
              {t("cratReviews.modals.finalizeReview.title", "Finalize Review")}
            </h5>
            <p className="text-bodydark2 mb-4">
              {t(
                "cratReviews.modals.finalizeReview.description",
                "Make the final decision on the CRAT review for",
              )}{" "}
              <strong>
                {selectedReview?.entrepreneur.Business?.name ||
                  selectedReview?.entrepreneur.name}
              </strong>
            </p>

            {/* Show reviewer comments */}
            {selectedReview?.reviewer_comments && (
              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h6 className="font-medium text-black dark:text-white mb-2">
                  {t(
                    "cratReviews.modals.finalizeReview.reviewerComments",
                    "Reviewer Comments:",
                  )}
                </h6>
                <p className="text-sm text-bodydark2">
                  {selectedReview.reviewer_comments}
                </p>
              </div>
            )}

            <div className="mb-4">
              <label className="block font-medium text-black dark:text-white mb-2">
                {t(
                  "cratReviews.modals.finalizeReview.finalDecision",
                  "Final Decision",
                )}
              </label>
              <select
                value={finalStatus}
                onChange={(e) => setFinalStatus(e.target.value)}
                className="w-full px-4 py-2 border border-black/20 rounded-lg focus:ring-primary focus:border-primary dark:border-strokedark dark:bg-form-input dark:text-white"
              >
                <option value="">
                  {t(
                    "cratReviews.modals.finalizeReview.chooseDecision",
                    "Choose decision...",
                  )}
                </option>
                <option value="accepted">
                  {t("cratReviews.status.accepted", "Accept")}
                </option>
                <option value="rejected">
                  {t("cratReviews.status.rejected", "Reject")}
                </option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block font-medium text-black dark:text-white mb-2">
                {t(
                  "cratReviews.modals.finalizeReview.adminComments",
                  "Admin Comments",
                )}
              </label>
              <textarea
                rows={3}
                value={adminComments}
                onChange={(e) => setAdminComments(e.target.value)}
                placeholder={t(
                  "cratReviews.modals.finalizeReview.adminCommentsPlaceholder",
                  "Provide feedback and final decision reasoning...",
                )}
                className="w-full px-4 py-2 border border-black/20 rounded-lg focus:ring-primary focus:border-primary dark:border-strokedark dark:bg-form-input dark:text-white"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleFinalizeReview}
                disabled={finalizing || !finalStatus || !adminComments.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50"
              >
                {finalizing ? (
                  <>
                    <Spinner />
                    {t("cratReviews.states.finalizing", "Finalizing...")}
                  </>
                ) : (
                  <>
                    <MdCheckCircle />
                    {t(
                      "cratReviews.actions.finalizeDecision",
                      "Finalize Decision",
                    )}
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowFinalizeModal(false);
                  setSelectedReview(null);
                  setFinalStatus("");
                  setAdminComments("");
                }}
                className="px-4 py-2 border border-black/20 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                {t("common.cancel", "Cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CratReviewApplicationsPage;
