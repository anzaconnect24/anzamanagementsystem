/* eslint-disable react/no-unescaped-entities */
"use client";
import { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import Link from "@/utils/link";
import Loader from "@/components/common/Loader";
import { useRouter } from "@/utils/navigation";
import { getUserInfo } from "@/controllers/user_controller.js";
import { createConversation } from "@/controllers/conversation_controller";
import { createNotification } from "@/controllers/notification_controller";
import { useTranslation } from "@/locales";
import { UserContext } from "../../../../layouts/DashboardLayout";
import { investorAnswers } from "@/components/investors/InvestorProfileDetails";

// An investor's profile as a startup sees it: their answers from sign-up,
// laid out like the mentor profile — the organisation's story on the left and
// what they invest in beside it. Contact information is withheld by the API.
const Page = () => {
  const { t } = useTranslation();
  const { uuid } = useParams();
  const { userDetails } = useContext(UserContext);
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserInfo(uuid).then((data) => {
      setUser(data);
      setLoading(false);
    });
  }, [uuid]);

  const startChat = () => {
    toast.success(
      t("messages.encryptionEnabling", "Enabling end-to-end encryption. Please wait..."),
    );
    createNotification({
      user_uuid: user.uuid,
      to: "User",
      message: t("messages.youHaveNewMessage", "You have a new message"),
    });
    createConversation({ to: user.uuid, type: "userToUser", lastMessage: "" }).then((data) => {
      router.push(`/dashboard/messages/${data.uuid}`);
    });
  };

  if (loading) return <Loader />;

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

  const answers = investorAnswers(user.InvestorProfile || {});
  const notAvailable = t("common.notAvailable", "N/A");

  const heroCards = [
    { label: "Investor type", value: answers.investorType },
    { label: "Headquarters", value: answers.headquarters },
    { label: "Fund size", value: answers.fundSize },
    { label: "Year founded", value: answers.yearFounded },
  ];

  const investmentRows = [
    { icon: "🎯", label: "Investment focus", value: answers.sectors.join(", ") },
    { icon: "🪜", label: "Business stages", value: answers.businessStages.join(", ") },
    { icon: "💰", label: "Typical ticket size", value: answers.ticketSize },
    { icon: "🧾", label: "Type of capital", value: answers.capitalType },
    { icon: "🌍", label: "Geographies", value: answers.geographies.join(", ") },
    { icon: "🌱", label: "Impact areas", value: answers.impactAreas.join(", ") },
    { icon: "📝", label: "Impact thesis", value: answers.impactThesis },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="relative mt-6 overflow-hidden rounded-3xl bg-black shadow-xl">
        <img
          src="/images/investors_hero.svg"
          alt={answers.company || user.name}
          className="absolute inset-0 h-full w-full object-cover"
          onError={(e) => {
            e.target.src = "/images/investment_readiness_classes.svg";
          }}
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

              <h1 className="mb-2 max-w-4xl text-3xl font-bold leading-tight tracking-tight text-white drop-shadow-2xl md:text-4xl">
                {answers.company || user.name}
              </h1>

              {answers.legalName && answers.legalName !== answers.company && (
                <p className="mb-5 text-xl font-medium text-white/80">{answers.legalName}</p>
              )}

              <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {heroCards.map((card) => (
                  <div
                    key={card.label}
                    className="rounded-2xl border border-white/10 bg-white/10 p-5 text-white backdrop-blur-md"
                  >
                    <p className="text-sm font-medium text-white/70">{card.label}</p>
                    <p className="mt-2 line-clamp-2 text-lg font-bold leading-snug">
                      {card.value || notAvailable}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* The organisation on the left, what they invest in in the panel beside it. */}
      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[2.4fr_1fr]">
        <div className="rounded-2xl bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-md dark:bg-boxdark">
          <div className="mb-4">
            <h2 className="mb-2 flex items-center text-xl font-bold capitalize text-gray-900 dark:text-white">
              <span className="mr-3 text-xl">🏢</span>
              About
            </h2>
            <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-300">
              {answers.bio || t("users.noInformationAvailable", "No Information Available")}
            </p>
          </div>
        </div>

        <aside className="mt-6 space-y-4 xl:mt-0">
          <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-boxdark">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Investment Details</h2>
            <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
              What this investor backs, and how they invest.
            </p>

            <div className="mt-5 space-y-3">
              {investmentRows.map((row) => (
                <div
                  key={row.label}
                  className="flex items-start gap-3 rounded-xl bg-gray-50 p-4 dark:bg-meta-4"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-lg shadow-sm dark:bg-boxdark">
                    {row.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{row.label}</p>
                    <p
                      className={`mt-0.5 text-sm leading-6 ${
                        row.value ? "text-gray-600 dark:text-gray-300" : "font-semibold text-[#e07a1f]"
                      }`}
                    >
                      {row.value || t("common.notAvailable", "Not provided")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <div className="mt-6 flex space-x-4">
        <button
          onClick={startChat}
          className="flex items-center justify-center gap-2 rounded-lg bg-green-500 px-6 py-3 font-bold text-white transition-all duration-300 hover:bg-green-600"
        >
          {t("messages.sendMessage", "Send Message")}
        </button>

        {userDetails?.role === "Enterprenuer" && (
          <Link
            href={`/dashboard/investmentApplicationByEntreprenuer/${user.uuid}`}
            className="flex items-center justify-center rounded-lg bg-primary px-6 py-3 font-bold text-white transition-all duration-300 hover:bg-primary/90"
          >
            {t("users.askForInvestment", "Ask for Investment")}
          </Link>
        )}
      </div>
    </div>
  );
};

export default Page;
