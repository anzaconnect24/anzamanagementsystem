"use client";
import { useEffect, useState } from "react";
import {
  getDroppedInvestments,
  investmentRequestDetails,
} from "@/controllers/investment_requests_controller";
import { timeAgo } from "@/utils/time_ago";
import Loader from "@/components/common/Loader";
import NoData from "@/component/noData";
import toast from "react-hot-toast";

const DroppedInvestments = () => {
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
      const response = await getDroppedInvestments(page, limit);
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

  return loading ? (
    <Loader />
  ) : (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
        <h4 className="text-2xl font-semibold text-black dark:text-white">
          Dropped Investments
        </h4>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Investment requests you have rejected
        </p>
      </div>

      {/* Investments Table */}
      <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        {investments.length < 1 ? (
          <NoData message="No dropped investments" />
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
                <p className="font-medium">Rejected</p>
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
              {/* Status Badge */}
              <div className="rounded-lg border border-danger bg-danger/10 p-4">
                <p className="text-sm font-medium text-danger">
                  This investment request was rejected
                </p>
                {selectedInvestment.feedback && (
                  <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Reason:</span>{" "}
                    {selectedInvestment.feedback}
                  </p>
                )}
              </div>

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
                        Tshs.{" "}
                        {selectedInvestment.investmentAmount?.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Investment Type
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

export default DroppedInvestments;
