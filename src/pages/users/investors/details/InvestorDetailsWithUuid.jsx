/* eslint-disable react/no-unescaped-entities */
"use client";
import { getAdmins, getUserInfo } from "@/controllers/user_controller.js";
import { timeAgo } from "@/utils/time_ago";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { createConversation } from "@/controllers/conversation_controller";
import { useRouter } from "@/utils/navigation";
import { useParams } from "react-router-dom";
import { createNotification } from "@/controllers/notification_controller";
import {
  HiOutlineChat,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineOfficeBuilding,
  HiOutlineLocationMarker,
  HiOutlineCash,
  HiOutlineDocumentText,
  HiOutlineUserCircle,
} from "react-icons/hi";
import Link from "@/utils/link";
import Image from "@/utils/image";
import { useTranslation } from "@/locales";
import { UserContext } from "../../../../layouts/DashboardLayout";

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
              user.name,
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

const Page = () => {
  const { t, isSwahili } = useTranslation();
  const { uuid } = useParams();

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

  const handleStartChatClick = () => {
    const data = {
      to: user.uuid,
      type: "userToUser",
      lastMessage: "",
    };

    createNotification({
      user_uuid: user.uuid,
      to: "User",
      message: t("messages.newMessage", "You have a new message"),
    });

    createConversation(data).then((res) => {
      router.push(`/dashboard/messages/${res.uuid}`);
    });
  };

  const heroCards = [
    {
      label: t("users.location", "Location"),
      value: user?.InvestorProfile?.geography || t("mentorHub.notAvailable", "N/A"),
    },
    {
      label: t("users.sector", "Sector"),
      value: (isSwahili
        ? user?.InvestorProfile?.BusinessSector?.swName
        : user?.InvestorProfile?.BusinessSector?.name) || t("mentorHub.notAvailable", "N/A"),
    },
    {
      label: t("users.structure", "Investment Type"),
      value: user?.InvestorProfile?.investmentType
        ? Object.values(user.InvestorProfile.investmentType).join(", ")
        : t("mentorHub.notAvailable", "N/A"),
    },
    {
      label: t("users.ticketSize", "Investment Range"),
      value: user?.InvestorProfile?.investmentSize || t("mentorHub.notAvailable", "N/A"),
    },
  ];

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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="relative mt-6 overflow-hidden rounded-3xl bg-black shadow-xl">
        <img
          src="/images/investment_readiness_classes.svg"
          alt={user.InvestorProfile?.company || user.name}
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/65 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

        <div className="relative z-10 flex min-h-[280px] items-end">
          <div className="w-full p-6 sm:p-8 lg:p-12">
            <div className="max-w-4xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-orange-500"></span>
                Investor Profile
              </div>
              <h1 className="mb-5 max-w-4xl text-3xl font-bold leading-tight tracking-tight text-white drop-shadow-2xl md:text-4xl">
                {user.InvestorProfile?.company || user.name}
              </h1>

              <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {heroCards.map((card, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-white/10 bg-white/10 p-5 text-white backdrop-blur-md"
                  >
                    <p className="text-sm font-medium text-white/70">
                      {card.label}
                    </p>

                    <p className="mt-2 line-clamp-2 text-lg font-bold leading-snug">
                      {card.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-boxdark rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300 mt-6">
        <div className="mb-4">
          <h2 className="text-xl font-bold mb-2 capitalize flex items-center text-gray-900 dark:text-white">
            <span className="text-xl mr-3">🙍</span>
            {t("users.bio", "Bio")}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
            {user?.InvestorProfile?.bio ||
              t("users.noInformationAvailable", "No Information Available")}
          </p>
        </div>
        <div className="mb-4">
          <h2 className="text-xl font-bold mb-2 capitalize flex items-center text-gray-900 dark:text-white">
            <span className="text-xl mr-3">💰</span>
            {t("users.notableInvestments", "Notable investments")}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
            {user?.InvestorProfile?.notableInvestment ||
              t("users.noInformationAvailable", "No Information Available")}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-boxdark rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300 mt-6">
        <div className="mb-4">
          <h2 className="text-xl font-bold mb-2 capitalize flex items-center text-gray-900 dark:text-white">
            <span className="text-xl mr-3">📪</span>
            {t("users.seeking", "Seeking")}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
            {user?.InvestorProfile?.seeking ||
              t("users.noInformationAvailable", "No Information Available")}
          </p>
        </div>
      </div>

      <div className="flex space-x-4 mt-6">
        <button
          onClick={handleStartChatClick}
          className=" px-6 py-3 bg-green-500 text-white rounded-lg  transition-colors flex items-center justify-center gap-2"
        >
          <HiOutlineChat className="w-5 h-5" />
          {t("users.message", "Message")}
        </button>
        {userDetails?.role === "Enterprenuer" && (
          <Link
            href={`/dashboard/investmentApplicationByEntreprenuer/${user.uuid}`}
            className="py-3 px-6 text-white font-bold bg-primary hover:bg-primary/90 transition-all duration-300 rounded-lg flex items-center justify-center"
          >
            {t("users.askForInvestment", "Ask for Investment")}
          </Link>
        )}
      </div>
    </div>
  );
};

export default Page;
