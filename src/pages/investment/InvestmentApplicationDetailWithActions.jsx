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
} from "react-icons/hi";
import { BiUser, BiEnvelope, BiPhone } from "react-icons/bi";
import { useTranslation } from "@/locales";

const InvestmentApplicationDetailWithActions = () => {
  const { t } = useTranslation();
  const { uuid } = useParams();
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
      toast.success(t("investment.interestShownSuccess", "Interest shown successfully"));
      fetchApplication();
    } catch {
      toast.error(t("investment.interestShownError", "Failed to show interest"));
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
      toast.error(t("investment.responseRequired", "Please provide a response"));
      return;
    }

    setActionLoading(true);
    try {
      if (responseType === "approve") {
        await investorApproveApplication(uuid, investorResponse);
        toast.success(t("investment.approvedSuccess", "Application approved successfully"));
      } else {
        await investorRejectApplication(uuid, investorResponse);
        toast.success(t("investment.rejectedSuccess", "Application rejected successfully"));
      }

      setShowResponseModal(false);
      setInvestorResponse("");
      fetchApplication();
    } catch {
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
        toast.success(t("investment.completedSuccess", "Investment marked as completed"));
        fetchApplication();
      } catch {
        toast.error(t("investment.completedError", "Failed to mark as completed"));
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
        icon: <HiOutlineClock className="h-5 w-5" />,
        label: t("investment.pending", "Pending"),
      },
      in_progress: {
        bg: "bg-blue-100",
        text: "text-blue-600",
        icon: <HiOutlineClock className="h-5 w-5" />,
        label: t("investment.inProgress", "In Progress"),
      },
      completed: {
        bg: "bg-success/10",
        text: "text-success",
        icon: <HiOutlineCheckCircle className="h-5 w-5" />,
        label: t("investment.completed", "Completed"),
      },
      dropped: {
        bg: "bg-danger/10",
        text: "text-danger",
        icon: <HiOutlineXCircle className="h-5 w-5" />,
        label: t("investment.dropped", "Dropped"),
      },
    };

    const config = statusConfig[statusLower] || statusConfig.pending;

    return (
      <div
        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 ${config.bg} ${config.text}`}
      >
        {config.icon}
        <span className="text-sm font-semibold">{config.label}</span>
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
        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 ${config.bg} ${config.text}`}
      >
        <span className="text-sm font-semibold">{config.label}</span>
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

  const displayPerson = isInvestor ? application?.Entrepreneur : application?.Investor;

  const DetailCard = ({ title, icon, children, className = "" }) => (
    <div
      className={`rounded-3xl border border-stroke/70 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-strokedark dark:bg-boxdark ${className}`}
    >
      <div className="mb-5 flex items-center gap-3">
        {icon && (
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            {icon}
          </div>
        )}
        <h5 className="text-lg font-semibold text-black dark:text-white">{title}</h5>
      </div>
      {children}
    </div>
  );

  const Field = ({ label, value, icon }) => (
    <div className="rounded-2xl bg-gray-50/80 p-4 dark:bg-meta-4/40">
      <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400">
        {icon}
        {label}
      </p>
      <p className="break-words text-base font-semibold text-black dark:text-white">
        {value || t("investment.notAvailable", "Not Available")}
      </p>
    </div>
  );

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center bg-white">
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
      <Link
        href="/dashboard/investmentApplications"
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-primary transition-all hover:gap-3"
      >
        <HiOutlineArrowLeft />
        {t("investment.backToApplications", "Back to Applications")}
      </Link>

      <div className="relative overflow-hidden rounded-[24px] bg-black shadow-md">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/images/investors_hero.svg')",
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/65 to-black/20" />

        <div className="relative z-10 px-7 py-10 md:px-10 md:py-14 lg:px-12 lg:py-16">
          <div className="mb-7 inline-flex items-center gap-3 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md">
            <span className="h-2.5 w-2.5 rounded-full bg-orange-400" />
            {t("investment.investmentApplication", "Investment Application")}
          </div>

          <h1 className="max-w-3xl text-4xl font-bold leading-tight text-white md:text-5xl">
            {isInvestor
              ? t("investment.reviewInvestmentOpportunity", "Review Investment Opportunity")
              : t("investment.trackInvestorApplication", "Track Investor Application")}
          </h1>

          <p className="mt-5 max-w-3xl text-lg leading-8 text-white/85">
            {t(
              "investment.detailHeroDescription",
              "Review the investment request, evaluate the entrepreneur’s proposal, and manage the application decision from one focused workspace.",
            )}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {getStatusBadge(application.status)}
            {isInvestor && getInvestorStatusBadge(application.investorStatus)}
          </div>

          {isInvestor && application.investorStatus === "pending" && (
            <div className="mt-7 flex flex-wrap gap-3">
              <button
                onClick={handleShowInterest}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-gray-900 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
              >
                <HiOutlineThumbUp />
                {t("investment.showInterest", "Show Interest")}
              </button>

              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-success px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-success/90 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
              >
                <HiOutlineCheckCircle />
                {t("investment.approve", "Approve")}
              </button>

              <button
                onClick={handleReject}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-danger px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-danger/90 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
              >
                <HiOutlineXCircle />
                {t("investment.reject", "Reject")}
              </button>
            </div>
          )}

          {(isInvestor || isEntrepreneur) && application.status === "in_progress" && (
            <div className="mt-7">
              <button
                onClick={handleMarkCompleted}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-success px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-success/90 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
              >
                <HiOutlineCheckCircle />
                {t("investment.markCompleted", "Mark as Completed")}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-6">
          <DetailCard
            title={t("investment.purposeOfInvestment", "Purpose of Investment")}
            icon={<HiOutlineDocumentText className="text-xl" />}
          >
            <p className="whitespace-pre-wrap text-base leading-8 text-gray-700 dark:text-gray-300">
              {application.purposeOfInvestment ||
                t("investment.noPurposeProvided", "No purpose provided")}
            </p>
          </DetailCard>

          <DetailCard title={t("investment.offerToInvestor", "Offer to Investor")}>
            <p className="whitespace-pre-wrap text-base leading-8 text-gray-700 dark:text-gray-300">
              {application.offerToInvestor ||
                t("investment.noOfferProvided", "No offer provided")}
            </p>
          </DetailCard>

          {application.pitchdeck && (
            <div className="max-w-md">
              <DetailCard title={t("investment.pitchDeck", "Pitch Deck")}>
                <a
                  href={application.pitchdeck}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-md"
                >
                  <HiOutlineDocumentText />
                  {t("investment.viewPitchDeck", "View Pitch Deck")}
                </a>
              </DetailCard>
            </div>
          )}

          {application.investorResponse && (
            <DetailCard
              title={t("investment.investorResponse", "Investor Response")}
              className="border-primary/20 bg-primary/5"
            >
              <p className="whitespace-pre-wrap text-base leading-8 text-gray-700 dark:text-gray-300">
                {application.investorResponse}
              </p>
            </DetailCard>
          )}
        </div>

        <div className="space-y-6">
          <DetailCard
            title={
              isInvestor
                ? t("investment.entrepreneurInformation", "Entrepreneur Information")
                : t("investment.investorInformation", "Investor Information")
            }
            icon={<BiUser className="text-xl" />}
          >
            <div className="space-y-4">
              <Field label={t("investment.name", "Name")} value={displayPerson?.name} />

              <Field
                label={t("investment.email", "Email")}
                value={displayPerson?.email}
                icon={<BiEnvelope />}
              />

              <Field
                label={t("investment.phone", "Phone")}
                value={displayPerson?.phone}
                icon={<BiPhone />}
              />

              <Field
                label={t("investment.requestedAmount", "Requested Amount")}
                value={formatCurrency(application.amount)}
                icon={<HiOutlineDocumentText />}
              />
            </div>
          </DetailCard>
        </div>
      </div>

      {showResponseModal && (
        <div className="fixed inset-0 z-99999 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 dark:bg-boxdark">
            <h3 className="mb-4 text-xl font-semibold text-black dark:text-white">
              {responseType === "approve"
                ? t("investment.approveApplication", "Approve Application")
                : t("investment.rejectApplication", "Reject Application")}
            </h3>

            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              {t(
                "investment.provideResponse",
                "Please provide your response to the entrepreneur:",
              )}
            </p>

            <textarea
              value={investorResponse}
              onChange={(e) => setInvestorResponse(e.target.value)}
              placeholder={t("investment.responsePlaceholder", "Write your message here...")}
              className="min-h-32 w-full rounded-lg border border-stroke p-3 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4"
            />

            <div className="mt-4 flex gap-3">
              <button
                onClick={submitResponse}
                disabled={actionLoading || !investorResponse.trim()}
                className={`flex-1 rounded-lg px-4 py-2 text-white transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
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
                className="flex-1 rounded-lg border border-stroke px-4 py-2 transition-all hover:bg-gray-1 disabled:opacity-50 dark:border-strokedark dark:hover:bg-meta-4"
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