"use client";
import { useEffect, useState } from "react";
import {
  getInvestorInvestmentRequests,
  approveInvestmentRequest,
  rejectInvestmentRequest,
  investmentRequestDetails,
} from "@/controllers/investment_requests_controller";
import { timeAgo } from "@/utils/time_ago";
import Link from "@/utils/link";
import Loader from "@/components/common/Loader";
import NoData from "@/component/noData";
import toast from "react-hot-toast";

const InterestedStartups = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  useEffect(() => {
    fetchRequests();
  }, [page]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await getInvestorInvestmentRequests(
        page,
        limit,
        "waiting",
      );
      if (response) {
        setRequests(response.data || []);
        setTotalPages(response.totalPages || 1);
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
      toast.error("Failed to load investment requests");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (request) => {
    try {
      const details = await investmentRequestDetails(request.uuid);
      setSelectedRequest(details);
      setShowModal(true);
    } catch (error) {
      console.error("Error fetching details:", error);
      toast.error("Failed to load request details");
    }
  };

  const handleApprove = async (uuid) => {
    try {
      await approveInvestmentRequest(uuid);
      toast.success(
        "Investment request approved! Status changed to In Progress",
      );
      fetchRequests();
      setShowModal(false);
    } catch (error) {
      console.error("Error approving request:", error);
      toast.error("Failed to approve request");
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    try {
      await rejectInvestmentRequest(selectedRequest.uuid, rejectReason);
      toast.success("Investment request rejected");
      fetchRequests();
      setShowModal(false);
      setShowRejectModal(false);
      setRejectReason("");
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast.error("Failed to reject request");
    }
  };

  return loading ? (
    <Loader />
  ) : (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
        <h4 className="text-2xl font-semibold text-black dark:text-white">
          Interested Entrepreneurs
        </h4>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Entrepreneurs who have submitted investment requests to you
        </p>
      </div>

      {/* Requests Table */}
      <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        {requests.length < 1 ? (
          <NoData message="No investment requests at the moment" />
        ) : (
          <>
            {/* Table Header */}
            <div className="grid grid-cols-12 border-b border-stroke py-4 px-6 dark:border-strokedark">
              <div className="col-span-3">
                <p className="font-medium">Entrepreneur</p>
              </div>
              <div className="col-span-3">
                <p className="font-medium">Business</p>
              </div>
              <div className="col-span-2">
                <p className="font-medium">Amount</p>
              </div>
              <div className="col-span-2">
                <p className="font-medium">Submitted</p>
              </div>
              <div className="col-span-2">
                <p className="font-medium">Actions</p>
              </div>
            </div>

            {/* Table Body */}
            {requests.map((request, index) => (
              <div
                key={index}
                className="grid grid-cols-12 border-b border-stroke py-4 px-6 dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4"
              >
                <div className="col-span-3 flex items-center">
                  <div>
                    <p className="text-sm font-medium text-black dark:text-white">
                      {request.entrepreneur?.firstName}{" "}
                      {request.entrepreneur?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {request.entrepreneur?.email}
                    </p>
                  </div>
                </div>
                <div className="col-span-3 flex items-center">
                  <p className="text-sm text-black dark:text-white">
                    {request.Business?.name}
                  </p>
                </div>
                <div className="col-span-2 flex items-center">
                  <p className="text-sm text-black dark:text-white">
                    {request.currency}{" "}
                    {request.investmentAmount?.toLocaleString()}
                  </p>
                </div>
                <div className="col-span-2 flex items-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {timeAgo(request.createdAt)}
                  </p>
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <button
                    onClick={() => handleViewDetails(request)}
                    className="rounded bg-primary px-3 py-1.5 text-xs text-white hover:bg-primary/90"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center p-4 border-t border-stroke dark:border-strokedark">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded bg-primary px-4 py-2 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded bg-primary px-4 py-2 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-6 dark:bg-boxdark">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-black dark:text-white">
                Investment Request Details
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-2xl text-gray-500 hover:text-black dark:hover:text-white"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              {/* Entrepreneur Info */}
              <div className="rounded-lg border border-stroke p-4 dark:border-strokedark">
                <h4 className="mb-3 font-semibold text-black dark:text-white">
                  Entrepreneur Profile
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Name
                    </p>
                    <p className="text-sm font-medium text-black dark:text-white">
                      {selectedRequest.entrepreneur?.firstName}{" "}
                      {selectedRequest.entrepreneur?.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Email
                    </p>
                    <p className="text-sm font-medium text-black dark:text-white">
                      {selectedRequest.entrepreneur?.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Phone
                    </p>
                    <p className="text-sm font-medium text-black dark:text-white">
                      {selectedRequest.entrepreneur?.phone || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Business Info */}
              <div className="rounded-lg border border-stroke p-4 dark:border-strokedark">
                <h4 className="mb-3 font-semibold text-black dark:text-white">
                  Business Information
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Business Name
                    </p>
                    <p className="text-sm font-medium text-black dark:text-white">
                      {selectedRequest.Business?.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Sector
                    </p>
                    <p className="text-sm font-medium text-black dark:text-white">
                      {selectedRequest.Business?.sector || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Investment Details */}
              <div className="rounded-lg border border-stroke p-4 dark:border-strokedark">
                <h4 className="mb-3 font-semibold text-black dark:text-white">
                  Investment Request Details
                </h4>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Amount Requested
                      </p>
                      <p className="text-sm font-medium text-black dark:text-white">
                        {selectedRequest.currency}{" "}
                        {selectedRequest.investmentAmount?.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Investment Type
                      </p>
                      <p className="text-sm font-medium text-black dark:text-white">
                        {selectedRequest.investmentType}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Due Diligence Date
                      </p>
                      <p className="text-sm font-medium text-black dark:text-white">
                        {new Date(
                          selectedRequest.dueDiligenceDate,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Help Needed from Anza
                    </p>
                    <p className="text-sm text-black dark:text-white">
                      {selectedRequest.helpFromAnza}
                    </p>
                  </div>
                  {selectedRequest.additionalInfo && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Additional Information
                      </p>
                      <p className="text-sm text-black dark:text-white">
                        {selectedRequest.additionalInfo}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleApprove(selectedRequest.uuid)}
                  className="flex-1 rounded bg-success px-4 py-2 text-white hover:bg-success/90"
                >
                  Approve & Show Interest
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  className="flex-1 rounded bg-danger px-4 py-2 text-white hover:bg-danger/90"
                >
                  Reject Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-boxdark">
            <h3 className="mb-4 text-xl font-semibold text-black dark:text-white">
              Reject Investment Request
            </h3>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              Please provide a reason for rejecting this request:
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full rounded border border-stroke p-3 dark:border-strokedark dark:bg-meta-4"
              rows={4}
              placeholder="Enter rejection reason..."
            />
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason("");
                }}
                className="flex-1 rounded border border-stroke px-4 py-2 dark:border-strokedark"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="flex-1 rounded bg-danger px-4 py-2 text-white hover:bg-danger/90"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterestedStartups;
