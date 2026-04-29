"use client";
import { useEffect, useState } from "react";
import {
  getInProgressInvestments,
  completeInvestment,
  investmentRequestDetails,
} from "@/controllers/investment_requests_controller";
import { timeAgo } from "@/utils/time_ago";
import Link from "@/utils/link";
import Loader from "@/components/common/Loader";
import NoData from "@/component/noData";
import toast from "react-hot-toast";

const InProgressInvestments = () => {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvestment, setSelectedInvestment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  useEffect(() => {
    fetchInvestments();
  }, [page]);

  const fetchInvestments = async () => {
    setLoading(true);
    try {
      const response = await getInProgressInvestments(page, limit);
      if (response) {
        setInvestments(response.data || []);
        setTotalPages(response.totalPages || 1);
      }
    } catch (error) {
      console.error("Error fetching investments:", error);
      toast.error("Failed to load investments");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (investment) => {
    try {
      const details = await investmentRequestDetails(investment.uuid);
      setSelectedInvestment(details);
      setShowModal(true);
    } catch (error) {
      console.error("Error fetching details:", error);
      toast.error("Failed to load investment details");
    }
  };

  const handleComplete = async (uuid) => {
    try {
      await completeInvestment(uuid);
      toast.success("Investment marked as completed!");
      fetchInvestments();
      setShowModal(false);
    } catch (error) {
      console.error("Error completing investment:", error);
      toast.error("Failed to complete investment");
    }
  };

  return loading ? (
    <Loader />
  ) : (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
        <h4 className="text-2xl font-semibold text-black dark:text-white">
          Requests in Progress
        </h4>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Investment requests you've approved and are currently working on
        </p>
      </div>

      {/* Investments Table */}
      <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        {investments.length < 1 ? (
          <NoData message="No investments in progress" />
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
                <p className="font-medium">Started</p>
              </div>
              <div className="col-span-2">
                <p className="font-medium">Actions</p>
              </div>
            </div>

            {/* Table Body */}
            {investments.map((investment, index) => (
              <div
                key={index}
                className="grid grid-cols-12 border-b border-stroke py-4 px-6 dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4"
              >
                <div className="col-span-3 flex items-center">
                  <div>
                    <p className="text-sm font-medium text-black dark:text-white">
                      {investment.entrepreneur?.firstName}{" "}
                      {investment.entrepreneur?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {investment.entrepreneur?.email}
                    </p>
                  </div>
                </div>
                <div className="col-span-3 flex items-center">
                  <p className="text-sm text-black dark:text-white">
                    {investment.Business?.name}
                  </p>
                </div>
                <div className="col-span-2 flex items-center">
                  <p className="text-sm text-black dark:text-white">
                    {investment.currency} Tshs.{" "}
                    {investment.investmentAmount?.toLocaleString()}
                  </p>
                </div>
                <div className="col-span-2 flex items-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {timeAgo(investment.updatedAt)}
                  </p>
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <button
                    onClick={() => handleViewDetails(investment)}
                    className="rounded bg-primary px-3 py-1.5 text-xs text-white hover:bg-primary/90"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleComplete(investment.uuid)}
                    className="rounded bg-success px-3 py-1.5 text-xs text-white hover:bg-success/90"
                  >
                    Complete
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
      {showModal && selectedInvestment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-6 dark:bg-boxdark">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-black dark:text-white">
                Investment Details
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
                      {selectedInvestment.entrepreneur?.firstName}{" "}
                      {selectedInvestment.entrepreneur?.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Email
                    </p>
                    <p className="text-sm font-medium text-black dark:text-white">
                      {selectedInvestment.entrepreneur?.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Phone
                    </p>
                    <p className="text-sm font-medium text-black dark:text-white">
                      {selectedInvestment.entrepreneur?.phone || "N/A"}
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
                      {selectedInvestment.Business?.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Description
                    </p>
                    <p className="text-sm font-medium text-black dark:text-white">
                      {selectedInvestment.Business?.description || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Investment Details */}
              <div className="rounded-lg border border-stroke p-4 dark:border-strokedark">
                <h4 className="mb-3 font-semibold text-black dark:text-white">
                  Investment Information
                </h4>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Amount
                      </p>
                      <p className="text-sm font-medium text-black dark:text-white">
                        Tshs.{" "}
                        {selectedInvestment.investmentAmount?.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Type
                      </p>
                      <p className="text-sm font-medium text-black dark:text-white">
                        {selectedInvestment.investmentType}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Help Needed from Anza
                    </p>
                    <p className="text-sm text-black dark:text-white">
                      {selectedInvestment.helpFromAnza}
                    </p>
                  </div>
                  {selectedInvestment.additionalInfo && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Additional Information
                      </p>
                      <p className="text-sm text-black dark:text-white">
                        {selectedInvestment.additionalInfo}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InProgressInvestments;
