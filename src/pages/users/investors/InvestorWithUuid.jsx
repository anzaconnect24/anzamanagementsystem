/* eslint-disable react/no-unescaped-entities */
"use client";

import {
  getAdmins,
  getUserInfo,
} from "../../../controllers/user_controller.js";
import Breadcrumb from "../../../components/Breadcrumbs/Breadcrumb";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createNotification } from "../../../controllers/notification_controller";

import {
  HiOutlineChat,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineOfficeBuilding,
  HiOutlineLocationMarker,
  HiOutlineDocumentText,
  HiOutlineUserCircle,
  HiOutlineLockClosed,
} from "react-icons/hi";

import React from "react";
import Link from "../../../utils/link";
import { UserContext } from "../../../layouts/DashboardLayout";

import { useParams } from "react-router-dom";
import Image from "../../../utils/image.js";
import { useTranslation } from "../../../locales";

// Profile Image Component
const ProfileImage = ({ user }) => {
  if (user.image) {
    return (
      <div className="relative h-full w-full">
        <Image
          src={user.image}
          alt={user.name}
          width={96}
          height={96}
          className="h-full w-full rounded-xl object-cover"
          onError={(e) => {
            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
              user.name,
            )}&background=6366f1&color=fff`;
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-primary/10">
      <span className="text-2xl font-bold text-primary">
        {user.name?.charAt(0).toUpperCase()}
      </span>
    </div>
  );
};

const InvestorProfilePage = () => {
  const uuid = useParams().uuid;
  const { t, isSwahili } = useTranslation();

  const { userDetails } = useContext(UserContext);

  const [user, setuser] = useState(null);
  const [loading, setloading] = useState(true);

  const navigate = useNavigate();

  const isAdmin = userDetails && userDetails.role === "Admin";

  useEffect(() => {
    getUserInfo(uuid).then((data) => {
      setuser(data);
      setloading(false);
    });
  }, [uuid]);

  const handleStartChat = () => {
    createNotification({
      user_uuid: user.uuid,
      to: "User",
      message: t("messages.youHaveNewMessage", "You have a new message"),
    });

    navigate(`/dashboard/conversations`);
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center">
        <div className="mb-2 text-xl font-medium text-gray-600 dark:text-gray-400">
          {t("users.investorNotFound", "Investor not found")}
        </div>

        <p className="text-gray-500 dark:text-gray-500">
          {t(
            "users.investorNotFoundDescription",
            "The investor profile you're looking for doesn't exist or has been removed.",
          )}
        </p>
      </div>
    );
  }

  const contactSection = {
    title: t("common.contactInformation", "Contact Information"),
    items: [
      {
        icon: <HiOutlineUserCircle className="h-5 w-5" />,
        label: t("common.name", "Name"),
        value: user.name,
      },
      {
        icon: <HiOutlineMail className="h-5 w-5" />,
        label: t("common.email", "Email"),
        value: user.email,
      },
      {
        icon: <HiOutlinePhone className="h-5 w-5" />,
        label: t("common.phone", "Phone"),
        value: user.phone,
      },
      {
        icon: <HiOutlineLocationMarker className="h-5 w-5" />,
        label: t("common.location", "Location"),
        value:
          user.InvestorProfile?.geography ||
          t("common.notSpecified", "Not specified"),
      },
      {
        icon: <HiOutlineOfficeBuilding className="h-5 w-5" />,
        label: t("business.companyName", "Company"),
        value:
          user.InvestorProfile?.company ||
          t("common.notSpecified", "Not specified"),
      },
      {
        icon: <HiOutlineDocumentText className="h-5 w-5" />,
        label: t("business.position", "Position"),
        value:
          user.InvestorProfile?.role ||
          t("common.notSpecified", "Not specified"),
      },
      {
        icon: <HiOutlineDocumentText className="h-5 w-5" />,
        label: "LinkedIn",
        value: user.InvestorProfile?.linkedinURL ? (
          <a
            href={user.InvestorProfile.linkedinURL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {t("common.viewProfile", "View Profile")}
          </a>
        ) : (
          t("common.notProvided", "Not provided")
        ),
      },
      {
        icon: <HiOutlineDocumentText className="h-5 w-5" />,
        label: t("common.website", "Website"),
        value: user.InvestorProfile?.website ? (
          <a
            href={user.InvestorProfile.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {t("business.visitWebsite", "Visit Website")}
          </a>
        ) : (
          t("common.notProvided", "Not provided")
        ),
      },
    ],
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb
        prevLink={``}
        prevPage={t("common.investors", "Investors")}
        pageName={
          user.InvestorProfile?.company || t("users.noCompany", "No Company")
        }
      />

      {/* TOP METRICS */}
      <div className="mt-6 rounded-xl border border-primary/5 bg-primary/5 p-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="flex flex-col items-center rounded-2xl bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md dark:bg-boxdark-2">
            <div className="mb-3 text-4xl">📍</div>

            <h3 className="mb-1 text-center text-2xl font-bold text-gray-900 dark:text-white">
              {user.InvestorProfile?.geography || "N/A"}
            </h3>

            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {t("common.location", "Location")}
            </p>
          </div>

          <div className="flex flex-col items-center rounded-2xl bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md dark:bg-boxdark-2">
            <div className="mb-3 text-4xl">💡</div>

            <h3 className="line-clamp-1 mb-1 text-2xl font-bold text-gray-900 dark:text-white">
              {isSwahili
                ? user?.InvestorProfile?.BusinessSector?.swName
                : user?.InvestorProfile?.BusinessSector?.name || "N/A"}
            </h3>

            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {t("business.businessSector", "Sector")}
            </p>
          </div>

          <div className="flex flex-col items-center rounded-2xl bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md dark:bg-boxdark-2">
            <div className="mb-3 text-4xl">👥</div>

            <h3 className="mb-1 text-2xl font-bold text-gray-900 dark:text-white">
              {Object.values(user?.InvestorProfile?.investmentType || {}).join(
                ", ",
              ) || "N/A"}
            </h3>

            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {t("common.investmentType", "Investment Type")}
            </p>
          </div>

          <div className="flex flex-col items-center rounded-2xl bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md dark:bg-boxdark-2">
            <div className="mb-3 text-4xl">🏢</div>

            <h3 className="line-clamp-1 overflow-y-hidden text-2xl font-bold text-gray-900 dark:text-white">
              {user?.InvestorProfile?.investmentSize || "N/A"}
            </h3>

            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {t("common.investmentRange", "Investment Range")}
            </p>
          </div>
        </div>
      </div>

      {/* CONTENT GRID */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        {/* LEFT CONTENT */}
        <div className="col-span-2 pt-6">
          {/* BIO */}
          <div className="rounded-2xl bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-md dark:bg-boxdark">
            <div className="mb-4">
              <h2 className="mb-2 flex items-center text-xl font-bold capitalize text-gray-900 dark:text-white">
                <span className="mr-3 text-xl">🙍</span>
                {t("users.bio", "Bio")}
              </h2>

              <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-300">
                {user?.InvestorProfile?.bio ||
                  t(
                    "users.noInformationAvailable",
                    "No Information Available",
                  )}
              </p>
            </div>

            <div className="mb-4">
              <h2 className="mb-2 flex items-center text-xl font-bold capitalize text-gray-900 dark:text-white">
                <span className="mr-3 text-xl">💰</span>
                {t("users.notableInvestments", "Notable Investments")}
              </h2>

              <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-300">
                {user?.InvestorProfile?.notableInvestment ||
                  t(
                    "users.noInformationAvailable",
                    "No Information Available",
                  )}
              </p>
            </div>
          </div>

          {/* SEEKING */}
          <div className="mt-6 rounded-2xl bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-md dark:bg-boxdark">
            <div className="mb-4">
              <h2 className="mb-2 flex items-center text-xl font-bold capitalize text-gray-900 dark:text-white">
                <span className="mr-3 text-xl">📪</span>
                {t("users.seeking", "Seeking")}
              </h2>

              <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-300">
                {user?.InvestorProfile?.seeking ||
                  t(
                    "users.noInformationAvailable",
                    "No Information Available",
                  )}
              </p>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="mt-4 flex space-x-4">
            {userDetails.role === "Enterprenuer" && (
              <Link
                href={`/investmentApplication/${user.uuid}`}
                className="rounded bg-primary px-4 py-2 font-bold text-white transition-all duration-300 hover:text-opacity-80"
              >
                {t("users.askForInvestment", "Ask for Investment")}
              </Link>
            )}

            <button
              onClick={handleStartChat}
              className="rounded-lg bg-green-500 px-6 py-3 text-white transition-colors"
            >
              <span className="flex items-center justify-center gap-2">
                <HiOutlineChat className="h-5 w-5" />
                {t("users.message", "Message")}
              </span>
            </button>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="lg:col-span-1 pt-6">
          {isAdmin ? (
            <div className="overflow-hidden rounded-xl bg-white shadow-sm dark:bg-boxdark">
              <div className="border-b border-stroke px-6 py-4 dark:border-strokedark">
                <h2 className="text-lg font-semibold text-black dark:text-white">
                  {contactSection.title}
                </h2>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  {contactSection.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex items-start gap-3">
                      <div className="mt-1 flex-shrink-0 text-gray-500 dark:text-gray-400">
                        {item.icon}
                      </div>

                      <div className="flex-grow">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {item.label}
                        </div>

                        <div className="text-base font-medium text-black dark:text-white">
                          {item.value}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl bg-white shadow-sm dark:bg-boxdark">
              <div className="border-b border-stroke px-6 py-4 dark:border-strokedark">
                <h2 className="text-lg font-semibold text-black dark:text-white">
                  {t("common.contactInformation", "Contact Information")}
                </h2>
              </div>

              <div className="flex flex-col items-center justify-center p-6 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-meta-4">
                  <HiOutlineLockClosed className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                </div>

                <h3 className="mb-2 text-base font-medium text-black dark:text-white">
                  {t(
                    "common.contactDetailsRestricted",
                    "Contact Details Restricted",
                  )}
                </h3>

                <p className="mb-3 max-w-md text-sm text-gray-500 dark:text-gray-400">
                  {t(
                    "common.contactDetailsOnlyAdmin",
                    "Contact information is only available to administrators.",
                  )}
                </p>

                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t(
                    "common.useMessageButton",
                    'You can use the "Message" button to connect with this investor.',
                  )}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvestorProfilePage;