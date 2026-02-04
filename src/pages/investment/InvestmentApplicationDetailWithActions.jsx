"use client";
import { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getInvestmentApplication,
  investorShowInterest,
  investorApproveApplication,
  investorRejectApplication,
  markInvestmentCompleted,
} from "@/controllers/investment_application_controller";
import Loader from "@/components/common/Loader";
import Link from "@/utils/link";
import toast from "react-hot-toast";
import { UserContext } from "@/layouts/DashboardLayout";
import {
  HiOutlineArrowLeft,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineDocumentText,
  HiOutlineThumbUp,
  HiOutlineThumbDown,
} from "react-icons/hi";
import { RiMoneyDollarCircleLine } from "react-icons/ri";
import { BiUser, BiEnvelope, BiPhone } from "react-icons/bi";
import { useTranslation } from "@/locales";
import { useRouter } from "@/utils/navigation";

const InvestmentApplicationDetailWithActions = () => {
  const { t } = useTranslation();
  const { uuid } = useParams();
  const router = useRouter();
  const { userDetails } = useContext(UserContext);
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseType, setResponseType] = useState("");
  const [investorResponse, setInvestorResponse] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const isInvestor = userDetails?.role === "Investor";
  const isEntrepreneur = userDetails?.role === "Enterprenuer";

  useEffect(() => {
    fetchApplication();
  }, [uuid]);

  const fetchApplication = async () => {
    setLoading(true);
    try {
      const data = await getInvestmentApplication(uuid);
      setApplication(data);
    } catch (error) {
      console.error("Error fetching application:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleShowInterest = async () => {
    setActionLoading(true);
    try {
      await investorShowInterest(uuid);
      toast.success(
        t("investment.interestShownSuccess", "Interest shown successfully"),
      );
      fetchApplication();
    } catch (error) {
      toast.error(
        t("investment.interestShownError", "Failed to show interest"),
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = () => {
    setResponseType("approve");
    setShowResponseModal(true);
  };

  const handleReject = () => {
    setResponseType("reject");
    setShowResponseModal(true);
  };

  const submitResponse = async () => {
    if (!investorResponse.trim()) {
      toast.error(
        t("investment.responseRequired", "Please provide a response"),
      );
      return;
    }

    setActionLoading(true);
    try {
      if (responseType === "approve") {
        await investorApproveApplication(uuid, investorResponse);
        toast.success(
          t("investment.approvedSuccess", "Application approved successfully"),
        );
      } else {
        await investorRejectApplication(uuid, investorResponse);
        toast.success(
          t("investment.rejectedSuccess", "Application rejected successfully"),
        );
      }
      setShowResponseModal(false);
      setInvestorResponse("");
      fetchApplication();
    } catch (error) {
      toast.error(t("investment.actionError", "Failed to process application"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkCompleted = async () => {
    if (
      confirm(
        t(
          "investment.confirmComplete",
          "Are you sure you want to mark this investment as completed?",
        ),
      )
    ) {
      setActionLoading(true);
      try {
        await markInvestmentCompleted(uuid);
        toast.success(
          t("investment.completedSuccess", "Investment marked as completed"),
        );
        fetchApplication();
      } catch (error) {
        toast.error(
          t("investment.completedError", "Failed to mark as completed"),
        );
      } finally {
        setActionLoading(false);
      }
    }
  };

  const getStatusBadge = (status) => {
    const statusLower = status?.toLowerCase() || "pending";

    const statusConfig = {
      pending: {
        bg: "bg-warning/10",
        text: "text-warning",
        icon: <HiOutlineClock className="w-5 h-5" />,
        label: t("investment.pending", "Pending"),
      },
      in_progress: {
        bg: "bg-blue-100",
        text: "text-blue-600",
        icon: <HiOutlineClock className="w-5 h-5" />,
        label: t("investment.inProgress", "In Progress"),
      },
      completed: {
        bg: "bg-success/10",
        text: "text-success",
        icon: <HiOutlineCheckCircle className="w-5 h-5" />,
        label: t("investment.completed", "Completed"),
      },
      dropped: {
        bg: "bg-danger/10",
        text: "text-danger",
        icon: <HiOutlineXCircle className="w-5 h-5" />,
        label: t("investment.dropped", "Dropped"),
      },
    };

    const config = statusConfig[statusLower] || statusConfig.pending;

    return (
      <div
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${config.bg} ${config.text}`}
      >
        {config.icon}
        <span className="text-base font-medium">{config.label}</span>
      </div>
    );
  };

  const getInvestorStatusBadge = (status) => {
    const statusLower = status?.toLowerCase() || "pending";

    const statusConfig = {
      pending: {
        bg: "bg-warning/10",
        text: "text-warning",
        label: t("investment.awaitingResponse", "Awaiting Response"),
      },
      interested: {
        bg: "bg-blue-100",
        text: "text-blue-600",
        label: t("investment.interested", "Interested"),
      },
      approved: {
        bg: "bg-success/10",
        text: "text-success",
        label: t("investment.approved", "Approved"),
      },
      rejected: {
        bg: "bg-danger/10",
        text: "text-danger",
        label: t("investment.rejected", "Rejected"),
      },
    };

    const config = statusConfig[statusLower] || statusConfig.pending;

    return (
      <div
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${config.bg} ${config.text}`}
      >
        <span className="text-sm font-medium">{config.label}</span>
      </div>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "TZS",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return t("investment.notAvailable", "N/A");
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-white">
        <Loader />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-2xl border border-stroke bg-white p-8 text-center">
          <p className="text-lg text-gray-500">
            {t("investment.notFound", "Application not found")}
          </p>
          <Link
            href="/dashboard/investmentApplications"
            className="mt-4 inline-flex items-center gap-2 text-primary hover:underline"
          >
            <HiOutlineArrowLeft />
            {t("investment.backToApplications", "Back to Applications")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <Link
        href="/dashboard/investmentApplications"
        className="inline-flex items-center gap-2 text-primary hover:underline mb-6"
      >
        <HiOutlineArrowLeft />
        {t("investment.backToApplications", "Back to Applications")}
      </Link>

      <div className="rounded-2xl border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-stroke dark:border-strokedark bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-xl bg-primary/10">
                <RiMoneyDollarCircleLine className="text-4xl text-primary" />
              </div>
              <div>
                <h4 className="text-2xl font-semibold text-black dark:text-white mb-2">
                  {t("investment.applicationDetails", "Application Details")}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("investment.submittedOn", "Submitted on")}{" "}
                  {formatDate(application.createdAt)}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {getStatusBadge(application.status)}
              {isInvestor && getInvestorStatusBadge(application.investorStatus)}
            </div>
          </div>

          {/* Investor Action Buttons */}
          {isInvestor && application.investorStatus === "pending" && (
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={handleShowInterest}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <HiOutlineThumbUp />
                {t("investment.showInterest", "Show Interest")}
              </button>
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 px-6 py-3 bg-success text-white rounded-lg hover:bg-success/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <HiOutlineCheckCircle />
                {t("investment.approve", "Approve")}
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 px-6 py-3 bg-danger text-white rounded-lg hover:bg-danger/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <HiOutlineXCircle />
                {t("investment.reject", "Reject")}
              </button>
            </div>
          )}

          {/* Mark as Completed Button */}
          {(isInvestor || isEntrepreneur) &&
            application.status === "in_progress" && (
              <div className="mt-6">
                <button
                  onClick={handleMarkCompleted}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-success text-white rounded-lg hover:bg-success/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <HiOutlineCheckCircle />
                  {t("investment.markCompleted", "Mark as Completed")}
                </button>
              </div>
            )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Investment Amount */}
          <div className="p-6 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {t("investment.requestedAmount", "Requested Amount")}
            </p>
            <p className="text-4xl font-bold text-primary">
              {formatCurrency(application.amount)}
            </p>
          </div>

          {/* Investor Information (for entrepreneurs) / Entrepreneur Information (for investors) */}
          <div className="p-6 rounded-xl border border-stroke dark:border-strokedark">
            <h5 className="text-lg font-semibold text-black dark:text-white mb-4 flex items-center gap-2">
              <BiUser className="text-xl text-primary" />
              {isInvestor
                ? t(
                    "investment.entrepreneurInformation",
                    "Entrepreneur Information",
                  )
                : t("investment.investorInformation", "Investor Information")}
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  {t("investment.name", "Name")}
                </p>
                <p className="text-base font-medium text-black dark:text-white">
                  {isInvestor
                    ? application.Entrepreneur?.name ||
                      t("investment.notAvailable", "Not Available")
                    : application.Investor?.name ||
                      t("investment.notAvailable", "Not Available")}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                  <BiEnvelope />
                  {t("investment.email", "Email")}
                </p>
                <p className="text-base font-medium text-black dark:text-white">
                  {isInvestor
                    ? application.Entrepreneur?.email ||
                      t("investment.notAvailable", "Not Available")
                    : application.Investor?.email ||
                      t("investment.notAvailable", "Not Available")}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                  <BiPhone />
                  {t("investment.phone", "Phone")}
                </p>
                <p className="text-base font-medium text-black dark:text-white">
                  {isInvestor
                    ? application.Entrepreneur?.phone ||
                      t("investment.notAvailable", "Not Available")
                    : application.Investor?.phone ||
                      t("investment.notAvailable", "Not Available")}
                </p>
              </div>
            </div>
          </div>

          {/* Purpose of Investment */}
          <div className="p-6 rounded-xl border border-stroke dark:border-strokedark">
            <h5 className="text-lg font-semibold text-black dark:text-white mb-4 flex items-center gap-2">
              <HiOutlineDocumentText className="text-xl text-primary" />
              {t("investment.purposeOfInvestment", "Purpose of Investment")}
            </h5>
            <p className="text-base text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {application.purposeOfInvestment ||
                t("investment.noPurposeProvided", "No purpose provided")}
            </p>
          </div>

          {/* Offer to Investor */}
          <div className="p-6 rounded-xl border border-stroke dark:border-strokedark">
            <h5 className="text-lg font-semibold text-black dark:text-white mb-4">
              {t("investment.offerToInvestor", "Offer to Investor")}
            </h5>
            <p className="text-base text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {application.offerToInvestor ||
                t("investment.noOfferProvided", "No offer provided")}
            </p>
          </div>

          {/* Investor Response */}
          {application.investorResponse && (
            <div className="p-6 rounded-xl border-2 border-primary/20 bg-primary/5">
              <h5 className="text-lg font-semibold text-black dark:text-white mb-4">
                {t("investment.investorResponse", "Investor Response")}
              </h5>
              <p className="text-base text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {application.investorResponse}
              </p>
              {application.respondedAt && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {t("investment.respondedOn", "Responded on")}{" "}
                  {formatDate(application.respondedAt)}
                </p>
              )}
            </div>
          )}

          {/* Pitch Deck */}
          {application.pitchdeck && (
            <div className="p-6 rounded-xl border border-stroke dark:border-strokedark">
              <h5 className="text-lg font-semibold text-black dark:text-white mb-4">
                {t("investment.pitchDeck", "Pitch Deck")}
              </h5>
              <a
                href={application.pitchdeck}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-all"
              >
                <HiOutlineDocumentText />
                {t("investment.viewPitchDeck", "View Pitch Deck")}
              </a>
            </div>
          )}

          {/* Timeline */}
          <div className="p-6 rounded-xl border border-stroke dark:border-strokedark">
            <h5 className="text-lg font-semibold text-black dark:text-white mb-4">
              {t("investment.timeline", "Timeline")}
            </h5>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                <div>
                  <p className="text-sm font-medium text-black dark:text-white">
                    {t("investment.applicationCreated", "Application Created")}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(application.createdAt)}
                  </p>
                </div>
              </div>
              {application.respondedAt && (
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <div>
                    <p className="text-sm font-medium text-black dark:text-white">
                      {t("investment.investorResponded", "Investor Responded")}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(application.respondedAt)}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                <div>
                  <p className="text-sm font-medium text-black dark:text-white">
                    {t("investment.lastUpdated", "Last Updated")}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(application.updatedAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Response Modal */}
      {showResponseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-99999 p-4">
          <div className="bg-white dark:bg-boxdark rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-black dark:text-white mb-4">
              {responseType === "approve"
                ? t("investment.approveApplication", "Approve Application")
                : t("investment.rejectApplication", "Reject Application")}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {t(
                "investment.provideResponse",
                "Please provide your response to the entrepreneur:",
              )}
            </p>
            <textarea
              value={investorResponse}
              onChange={(e) => setInvestorResponse(e.target.value)}
              placeholder={t(
                "investment.responsePlaceholder",
                "Write your message here...",
              )}
              className="w-full rounded-lg border border-stroke p-3 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 min-h-32"
            ></textarea>
            <div className="flex gap-3 mt-4">
              <button
                onClick={submitResponse}
                disabled={actionLoading || !investorResponse.trim()}
                className={`flex-1 px-4 py-2 rounded-lg text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  responseType === "approve"
                    ? "bg-success hover:bg-success/90"
                    : "bg-danger hover:bg-danger/90"
                }`}
              >
                {actionLoading
                  ? t("investment.processing", "Processing...")
                  : t("investment.submit", "Submit")}
              </button>
              <button
                onClick={() => {
                  setShowResponseModal(false);
                  setInvestorResponse("");
                }}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 rounded-lg border border-stroke dark:border-strokedark hover:bg-gray-1 dark:hover:bg-meta-4 transition-all disabled:opacity-50"
              >
                {t("investment.cancel", "Cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvestmentApplicationDetailWithActions;
