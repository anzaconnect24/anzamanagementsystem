"use client";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getInvestmentApplication } from "@/controllers/investment_application_controller";
import Loader from "@/components/common/Loader";
import Link from "@/utils/link";
import {
  HiOutlineArrowLeft,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineDocumentText,
} from "react-icons/hi";
import { RiMoneyDollarCircleLine } from "react-icons/ri";
import { BiUser, BiEnvelope, BiPhone } from "react-icons/bi";
import { useTranslation } from "@/locales";

const InvestmentApplicationDetail = () => {
  const { t } = useTranslation();
  const { uuid } = useParams();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const getStatusBadge = (status) => {
    const statusLower = status?.toLowerCase() || "pending";

    const statusConfig = {
      pending: {
        bg: "bg-warning/10",
        text: "text-warning",
        icon: <HiOutlineClock className="w-5 h-5" />,
        label: t("investment.pending", "Pending"),
      },
      approved: {
        bg: "bg-success/10",
        text: "text-success",
        icon: <HiOutlineCheckCircle className="w-5 h-5" />,
        label: t("investment.approved", "Approved"),
      },
      rejected: {
        bg: "bg-danger/10",
        text: "text-danger",
        icon: <HiOutlineXCircle className="w-5 h-5" />,
        label: t("investment.rejected", "Rejected"),
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "TZS",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (date) => {
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
            <div>{getStatusBadge(application.status)}</div>
          </div>
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

          {/* Investor Information */}
          <div className="p-6 rounded-xl border border-stroke dark:border-strokedark">
            <h5 className="text-lg font-semibold text-black dark:text-white mb-4 flex items-center gap-2">
              <BiUser className="text-xl text-primary" />
              {t("investment.investorInformation", "Investor Information")}
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  {t("investment.name", "Name")}
                </p>
                <p className="text-base font-medium text-black dark:text-white">
                  {application.Investor?.name ||
                    t("investment.notAvailable", "Not Available")}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                  <BiEnvelope />
                  {t("investment.email", "Email")}
                </p>
                <p className="text-base font-medium text-black dark:text-white">
                  {application.Investor?.email ||
                    t("investment.notAvailable", "Not Available")}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                  <BiPhone />
                  {t("investment.phone", "Phone")}
                </p>
                <p className="text-base font-medium text-black dark:text-white">
                  {application.Investor?.phone ||
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
    </div>
  );
};

export default InvestmentApplicationDetail;
