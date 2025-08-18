"use client";
import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import { server_url } from "@/app/utils/endpoint";
import { headers } from "@/app/utils/headers";
import { UserContext } from "../../layout";
import Spinner from "@/components/spinner";
import Loader from "@/components/common/Loader";
import {
  MdCheckCircle,
  MdPending,
  MdAssignment,
  MdRateReview,
  MdSearch,
  MdPersonAdd,
} from "react-icons/md";

const CratReviewApplicationsPage = () => {
  const { userDetails } = useContext(UserContext);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
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
  }, [currentPage, searchTerm, statusFilter, userDetails, router]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
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
        setReviews(response.data.body.data || []);
        setTotal(response.data.body.count || 0);
      }
    } catch (error) {
      console.error("Error fetching CRAT reviews:", error);
      toast.error("Failed to fetch CRAT reviews");
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffMembers = async () => {
    try {
      const response = await axios.get(`${server_url}/user`, {
        headers,
        params: { role: "Reviewer" },
      });

      if (response.data.status) {
        setStaffMembers(response.data.body.data || []);
      }
    } catch (error) {
      console.error("Error fetching staff members:", error);
    }
  };

  const handleAssignReviewer = async () => {
    if (!selectedReviewer) {
      toast.error("Please select a reviewer");
      return;
    }

    try {
      setAssigningReviewer(true);
      const response = await axios.put(
        `${server_url}/crat_reviews/${selectedReview.uuid}/assign`,
        { reviewer_id: selectedReviewer },
        { headers }
      );

      if (response.data.status) {
        toast.success("Reviewer assigned successfully!");
        setShowAssignModal(false);
        setSelectedReview(null);
        setSelectedReviewer("");
        fetchReviews();
      } else {
        toast.error(response.data.message || "Failed to assign reviewer");
      }
    } catch (error) {
      console.error("Error assigning reviewer:", error);
      toast.error("Error assigning reviewer");
    } finally {
      setAssigningReviewer(false);
    }
  };

  const handleFinalizeReview = async () => {
    if (!finalStatus || !adminComments.trim()) {
      toast.error("Please provide final status and comments");
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
        { headers }
      );

      if (response.data.status) {
        toast.success("Review finalized successfully!");
        setShowFinalizeModal(false);
        setSelectedReview(null);
        setFinalStatus("");
        setAdminComments("");
        fetchReviews();
      } else {
        toast.error(response.data.message || "Failed to finalize review");
      }
    } catch (error) {
      console.error("Error finalizing review:", error);
      toast.error("Error finalizing review");
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

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="rounded-xl border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        {/* Header */}
        <div className="p-6 border-b border-stroke dark:border-strokedark">
          <h4 className="text-xl font-semibold text-black dark:text-white">
            CRAT Review Applications
          </h4>
          <p className="mt-2 text-bodydark2">
            Manage CRAT review applications from entrepreneurs. Assign reviewers
            and finalize decisions.
          </p>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-stroke dark:border-strokedark">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by entrepreneur name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary dark:border-strokedark dark:bg-form-input dark:text-white"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary dark:border-strokedark dark:bg-form-input dark:text-white"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="assigned">Assigned</option>
              <option value="in_review">In Review</option>
              <option value="reviewed">Reviewed</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Reviews Table */}
        <div className="p-6">
          {reviews.length === 0 ? (
            <div className="text-center py-12">
              <MdRateReview className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                No CRAT review applications found
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                CRAT review applications will appear here when entrepreneurs
                submit them.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-stroke dark:border-strokedark">
                    <th className="text-left py-3 px-4 font-medium text-black dark:text-white">
                      Entrepreneur
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-black dark:text-white">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-black dark:text-white">
                      Reviewer
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-black dark:text-white">
                      Submitted
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-black dark:text-white">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((review) => (
                    <tr
                      key={review.uuid}
                      className="border-b border-stroke dark:border-strokedark"
                    >
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium text-black dark:text-white">
                            {review.entrepreneur.firstName}{" "}
                            {review.entrepreneur.lastName}
                          </p>
                          <p className="text-sm text-bodydark2">
                            {review.entrepreneur.email}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(review.status)}
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              review.status
                            )}`}
                          >
                            {review.status.replace("_", " ").toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {review.reviewer ? (
                          <p className="text-sm text-black dark:text-white">
                            {review.reviewer.firstName}{" "}
                            {review.reviewer.lastName}
                          </p>
                        ) : (
                          <span className="text-sm text-gray-500">
                            Not assigned
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm text-bodydark2">
                          {new Date(review.submitted_at).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2">
                          {review.status === "pending" && (
                            <button
                              onClick={() => {
                                setSelectedReview(review);
                                setShowAssignModal(true);
                              }}
                              className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                            >
                              <MdPersonAdd className="text-sm" />
                              Assign
                            </button>
                          )}
                          {review.status === "reviewed" && (
                            <button
                              onClick={() => {
                                setSelectedReview(review);
                                setShowFinalizeModal(true);
                              }}
                              className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                            >
                              <MdCheckCircle className="text-sm" />
                              Finalize
                            </button>
                          )}
                          <button
                            onClick={() => {
                              // View details functionality can be added here
                            }}
                            className="px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <nav className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage <= 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        currentPage === page
                          ? "bg-primary text-white"
                          : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}

                <button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage >= totalPages}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
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
              Assign Reviewer
            </h5>
            <p className="text-bodydark2 mb-4">
              Select a staff member to review this CRAT application from{" "}
              <strong>
                {selectedReview?.entrepreneur.firstName}{" "}
                {selectedReview?.entrepreneur.lastName}
              </strong>
            </p>

            <div className="mb-4">
              <label className="block font-medium text-black dark:text-white mb-2">
                Select Reviewer
              </label>
              <select
                value={selectedReviewer}
                onChange={(e) => setSelectedReviewer(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary dark:border-strokedark dark:bg-form-input dark:text-white"
              >
                <option value="">Choose a reviewer...</option>
                {staffMembers.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.firstName} {staff.lastName} - {staff.email}
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
                    Assigning...
                  </>
                ) : (
                  <>
                    <MdPersonAdd />
                    Assign Reviewer
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedReview(null);
                  setSelectedReviewer("");
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
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
              Finalize Review
            </h5>
            <p className="text-bodydark2 mb-4">
              Make the final decision on the CRAT review for{" "}
              <strong>
                {selectedReview?.entrepreneur.firstName}{" "}
                {selectedReview?.entrepreneur.lastName}
              </strong>
            </p>

            {/* Show reviewer comments */}
            {selectedReview?.reviewer_comments && (
              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h6 className="font-medium text-black dark:text-white mb-2">
                  Reviewer Comments:
                </h6>
                <p className="text-sm text-bodydark2">
                  {selectedReview.reviewer_comments}
                </p>
              </div>
            )}

            <div className="mb-4">
              <label className="block font-medium text-black dark:text-white mb-2">
                Final Decision
              </label>
              <select
                value={finalStatus}
                onChange={(e) => setFinalStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary dark:border-strokedark dark:bg-form-input dark:text-white"
              >
                <option value="">Choose decision...</option>
                <option value="accepted">Accept</option>
                <option value="rejected">Reject</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block font-medium text-black dark:text-white mb-2">
                Admin Comments
              </label>
              <textarea
                rows={3}
                value={adminComments}
                onChange={(e) => setAdminComments(e.target.value)}
                placeholder="Provide feedback and final decision reasoning..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary dark:border-strokedark dark:bg-form-input dark:text-white"
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
                    Finalizing...
                  </>
                ) : (
                  <>
                    <MdCheckCircle />
                    Finalize Decision
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
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CratReviewApplicationsPage;
