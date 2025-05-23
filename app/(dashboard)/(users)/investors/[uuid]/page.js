/* eslint-disable react/no-unescaped-entities */
"use client";
import { getAdmins, getUserInfo } from "@/app/controllers/user_controller.js";
import { timeAgo } from "@/app/utils/time_ago";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { createConversation } from "@/app/controllers/conversation_controller";
import { useRouter } from "next/navigation";
import { createNotification } from "@/app/controllers/notification_controller";
import {
  HiOutlineChat,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineOfficeBuilding,
  HiOutlineLocationMarker,
  HiOutlineCash,
  HiOutlineDocumentText,
  HiOutlineUserCircle,
  HiOutlineClock,
  HiOutlineLockClosed,
} from "react-icons/hi";
import React from "react";
import Link from "next/link";
import { UserContext } from "../../../layout";
import Image from "next/image";

// ProfileImage component for better organization and reuse
const ProfileImage = ({ user }) => {
  if (user.image) {
    return (
      <div className="w-full h-full relative">
        <Image
          src={user.image}
          alt={user.name}
          width={96}
          height={96}
          className="object-cover w-full h-full rounded-xl"
          onError={(e) => {
            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
              user.name
            )}&background=6366f1&color=fff`;
          }}
        />
      </div>
    );
  } else {
    return (
      <div className="w-full h-full flex items-center justify-center bg-primary/10">
        <span className="text-2xl font-bold text-primary">
          {user.name?.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  }
};

const Page = ({ params }) => {
  // Unwrap params using React.use()
  const unwrappedParams = params;
  const uuid = unwrappedParams.uuid;

  const { userDetails } = useContext(UserContext);
  const [user, setuser] = useState(null);
  const [loading, setloading] = useState(true);
  const router = useRouter();
  const isAdmin = userDetails && userDetails.role === "Admin";

  useEffect(() => {
    getUserInfo(uuid).then((data) => {
      setuser(data);
      setloading(false);
    });
  }, [uuid]);

  const handleStartChat = () => {
    const data = {
      to: user.uuid,
      type: "userToUser",
      lastMessage: "",
    };

    createNotification({
      user_uuid: user.uuid,
      to: "User",
      message: `You have a new message`,
    });

    if (!user) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="text-xl font-medium text-gray-600 dark:text-gray-400 mb-2">
            Investor not found
          </div>
          <p className="text-gray-500 dark:text-gray-500">
            The investor profile you're looking for doesn't exist or has been
            removed.
          </p>
        </div>
      );
    }

    // Define profile sections
    const contactSection = {
      title: "Contact Information",
      items: [
        {
          icon: <HiOutlineUserCircle className="w-5 h-5" />,
          label: "Name",
          value: user.name,
        },
        {
          icon: <HiOutlineMail className="w-5 h-5" />,
          label: "Email",
          value: user.email,
        },
        {
          icon: <HiOutlinePhone className="w-5 h-5" />,
          label: "Phone",
          value: user.phone,
        },
        {
          icon: <HiOutlineLocationMarker className="w-5 h-5" />,
          label: "Location",
          value: user.InvestorProfile?.geography || "Not specified",
        },
        {
          icon: <HiOutlineOfficeBuilding className="w-5 h-5" />,
          label: "Company",
          value: user.InvestorProfile?.company || "Not specified",
        },
        {
          icon: <HiOutlineDocumentText className="w-5 h-5" />,
          label: "Position",
          value: user.InvestorProfile?.role || "Not specified",
        },
        {
          icon: <HiOutlineDocumentText className="w-5 h-5" />,
          label: "LinkedIn",
          value: user.InvestorProfile?.linkedinURL ? (
            <a
              href={user.InvestorProfile.linkedinURL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              View Profile
            </a>
          ) : (
            "Not provided"
          ),
        },
        {
          icon: <HiOutlineDocumentText className="w-5 h-5" />,
          label: "Website",
          value: user.InvestorProfile?.website ? (
            <a
              href={user.InvestorProfile.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Visit Website
            </a>
          ) : (
            "Not provided"
          ),
        },
      ],
    };

    const investmentSection = {
      title: "Investment Preferences",
      items: [
        {
          icon: <HiOutlineDocumentText className="w-5 h-5" />,
          label: "Sector",
          value: user.InvestorProfile?.BusinessSector?.name || "Not specified",
        },
        {
          icon: <HiOutlineCash className="w-5 h-5" />,
          label: "Investment Size",
          value: user.InvestorProfile?.ticketSize || "Not specified",
        },
        {
          icon: <HiOutlineDocumentText className="w-5 h-5" />,
          label: "Investment Types",
          value:
            Object.values(user.InvestorProfile?.investmentType || {}).join(
              ", "
            ) || "Not specified",
        },
        {
          icon: <HiOutlineDocumentText className="w-5 h-5" />,
          label: "Investment Focus",
          value:
            Object.values(user.InvestorProfile?.investmentFocus || {}).join(
              ", "
            ) || "Not specified",
        },
        {
          icon: <HiOutlineDocumentText className="w-5 h-5" />,
          label: "Mentoring Preference",
          value:
            user.InvestorProfile?.mentoringPreference === "yes"
              ? "Open to mentoring startups"
              : "Investment only",
        },
      ],
    };

    const bioSection = {
      title: "Background & Experience",
      items: [
        {
          icon: <HiOutlineDocumentText className="w-5 h-5" />,
          label: "Notable Investments",
          value: user.InvestorProfile?.notableInvestment || "Not provided",
        },
      ],
    };

    return (
      <div className="container mx-auto px-4 py-8">
        <Breadcrumb
          prevLink={`/investors`}
          prevPage="Investors"
          pageName={user.InvestorProfile?.company || "No Company"}
        />
        <div className=" bg-primary/5 border border-primary/5 p-8 mt-6 rounded-xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 ">
            <div className="p-6 rounded-2xl bg-white dark:bg-boxdark-2 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-center">
              <div className="text-4xl mb-3">📍</div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1 text-center">
                {user.InvestorProfile?.geography || "N/A"}{" "}
                {/* Updated to use location */}
              </h3>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Location
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-boxdark-2 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-center">
              <div className="text-4xl mb-3">💡</div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1 line-clamp-1 ">
                {user?.InvestorProfile?.BusinessSector?.name || "N/A"}
              </h3>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Sector
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-boxdark-2 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-center">
              <div className="text-4xl mb-3">👥</div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {Object.values(user?.InvestorProfile?.investmentType).join(
                  ", "
                ) || "N/A"}{" "}
                {/* Updated to use numberOfCustomers */}
              </h3>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Invetment Type
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-boxdark-2 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-center">
              <div className="text-4xl mb-3">🏢</div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1 line-clamp-1 overflow-y-hidden">
                {user?.InvestorProfile?.investmentSize || "N/A"}{" "}
                {/* Updated to use UserSector.name */}
              </h3>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Investment Range
              </p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Header Card */}

          <div className="col-span-2">
            <div className="bg-white dark:bg-boxdark rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300 mt-6">
              <div className="mb-4">
                <h2 className="text-xl font-bold mb-2 capitalize flex items-center text-gray-900 dark:text-white">
                  <span className="text-xl mr-3">🙍</span>
                  Bio
                </h2>
                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                  {user?.InvestorProfile?.bio || "No Information Available"}
                </p>
              </div>
              <div className="mb-4">
                <h2 className="text-xl font-bold mb-2 capitalize flex items-center text-gray-900 dark:text-white">
                  <span className="text-xl mr-3">💰</span>
                  Notable investments
                </h2>
                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                  {user?.InvestorProfile?.notableInvestment ||
                    "No Information Available"}
                </p>
              </div>
            </div>
            <div className="bg-white dark:bg-boxdark rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300 mt-6">
              <div className="mb-4">
                <h2 className="text-xl font-bold mb-2 capitalize flex items-center text-gray-900 dark:text-white">
                  <span className="text-xl mr-3">📪</span>
                  Seeking
                </h2>
                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                  {user?.InvestorProfile?.seeking || "No Information Available"}
                </p>
              </div>
            </div>
            <div className="flex space-x-4 mt-4">
              {/* {userDetails.role} */}
              {userDetails.role === "Enterprenuer" && (
                <Link
                  href={`/investmentApplication/${user.uuid}`}
                  className="py-2 px-4 text-white font-bold bg-primary  hover:text-opacity-80 transition-all duration-300 rounded"
                >
                  Ask for Investment
                </Link>
              )}
              <button
                onClick={handleStartChat}
                className=" px-6 py-3 bg-green-500 text-white rounded-lg  transition-colors"
              >
                <span className="flex items-center justify-center gap-2">
                  <HiOutlineChat className="w-5 h-5" />
                  Message
                </span>
              </button>
            </div>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-1 ">
            {/* Contact Information - Only visible to admins */}
            {isAdmin ? (
              <div className="bg-white dark:bg-boxdark rounded-xl shadow-sm overflow-hidden mt-6 ">
                <div className="px-6 py-4 border-b border-stroke dark:border-strokedark">
                  <h2 className="text-lg font-semibold text-black dark:text-white">
                    {contactSection.title}
                  </h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {contactSection.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1 text-gray-500 dark:text-gray-400">
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
              <div className="bg-white dark:bg-boxdark rounded-xl shadow-sm overflow-hidden ">
                <div className="px-6 py-4 border-b border-stroke dark:border-strokedark ">
                  <h2 className="text-lg font-semibold text-black dark:text-white">
                    Contact Information
                  </h2>
                </div>
                <div className="p-6 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-meta-4 flex items-center justify-center mb-3">
                    <HiOutlineLockClosed className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                  </div>
                  <h3 className="text-base font-medium text-black dark:text-white mb-2">
                    Contact Details Restricted
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mb-3">
                    Contact information is only available to administrators.
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    You can use the "Start Conversation" button to connect with
                    this investor.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="text-xl font-medium text-gray-600 dark:text-gray-400 mb-2">
          Investor not found
        </div>
        <p className="text-gray-500 dark:text-gray-500">
          The investor profile you're looking for doesn't exist or has been
          removed.
        </p>
      </div>
    );
  }

  return handleStartChat();
};

export default Page;
