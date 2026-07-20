"use client";
import { useContext, useEffect, useState } from "react";
import { useRouter } from "@/utils/navigation";
import { useParams } from "react-router-dom";
import Link from "@/utils/link";
import Loader from "@/components/common/Loader";
import { expertiseList } from "@/utils/mentorProfile";
import { toast } from "react-hot-toast";
import { createConversation } from "@/controllers/conversation_controller";
import { UserContext } from "../../../layouts/DashboardLayout";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { createNotification } from "@/controllers/notification_controller";
import { useTranslation } from "../../../locales";
import { getUserInfo } from "../../../controllers/user_controller";

const capitalizeFirst = (value) => {
  const text = String(value || "").trim();
  return text ? text[0].toUpperCase() + text.slice(1) : "";
};

const Page = () => {
  const { t, isSwahili } = useTranslation();
  const { uuid } = useParams();
  const [user, setUser] = useState(null);
  const { userDetails } = useContext(UserContext);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const getData = async () => {
    try {
      const data = await getUserInfo(uuid);
      setUser(data);
      console.log("user", data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching user:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, [uuid]);

  const heroCards = [
    {
      label: t("mentorProfile.smeFocus", "SME Focus"),
      value: user?.MentorProfile?.smeFocus || t("common.notAvailable", "N/A"),
    },
    {
      label: t("business.location", "Location"),
      value: user?.MentorProfile?.location || t("common.notAvailable", "N/A"),
    },
    {
      label: t("mentorProfile.areasOfExpertise", "Areas of expertise"),
      value: expertiseList(user?.MentorProfile?.areasOfExperties).join(", ") || t("common.notAvailable", "N/A"),
    },
    {
      label: t("business.sector", "Sector"),
      value: (isSwahili ? user?.MentorProfile?.BusinessSector?.swName : user?.MentorProfile?.BusinessSector?.name) || t("common.notAvailable", "N/A"),
    },
  ];

  return loading ? (
    <Loader />
  ) : (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="relative mt-6 overflow-hidden rounded-3xl bg-black shadow-xl">
        <img
          src="/images/mentor_hero.svg"
          alt={user?.name}
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
                Mentor Profile
              </div>
              <h1 className="mb-2 max-w-4xl text-3xl font-bold leading-tight tracking-tight text-white drop-shadow-2xl md:text-4xl">
                {user?.name}
              </h1>
              {user?.MentorProfile?.position && (
                <p className="mb-5 text-xl font-medium text-white/80">
                  {user.MentorProfile.position}
                </p>
              )}

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

      {/* Bio on the left, mentorship details in the panel on the right. */}
      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[2.4fr_1fr]">
        <div className="bg-white dark:bg-boxdark rounded-2xl p-8 shadow-sm transition-all duration-300 hover:shadow-md">
          <div className="mb-4">
            <h2 className="text-xl font-bold mb-2 capitalize flex items-center text-gray-900 dark:text-white">
              <span className="text-xl mr-3">🙍</span>
              {t("mentorProfile.bio", "Bio")}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
              {user?.MentorProfile?.description ||
                t("mentorProfile.noInfo", "No Information Available")}
            </p>
          </div>
        </div>

      {/* Mentorship focus, availability, expertise and language live in their
          own panel beside the bio rather than stacked down the page. */}
      <aside className="mt-6 space-y-4 xl:mt-0">
        <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-boxdark">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {t("mentorProfile.mentorshipDetails", "Mentorship Details")}
          </h2>
          <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
            {t(
              "mentorProfile.mentorshipDetailsSub",
              "How this mentor works and where they can support you.",
            )}
          </p>

          <div className="mt-5 space-y-3">
            {[
              {
                icon: "🎯",
                label: t("mentorProfile.mentorshipFocus", "Mentorship focus"),
                value:
                  Object.keys(user?.MentorProfile?.mentorshipFocus || {}).length > 0
                    ? Object.values(user.MentorProfile.mentorshipFocus).join(", ")
                    : typeof user?.MentorProfile?.mentorshipFocus === "string"
                      ? user.MentorProfile.mentorshipFocus
                      : "",
              },
              {
                icon: "📅",
                label: t("mentorProfile.availability", "Availability"),
                // Stored lower-case by some records ("weekly"), so present it
                // with a capital first letter.
                value: capitalizeFirst(user?.MentorProfile?.mentorAvailability),
              },
              {
                icon: "🌎",
                label: t("mentorProfile.areasOfExpertise", "Areas of expertise"),
                value: expertiseList(
                  user?.MentorProfile?.areasOfExperties,
                ).join(", "),
              },
              {
                icon: "🗣️",
                label: t("mentorProfile.languages", "Languages"),
                value: user?.MentorProfile?.language,
              },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-start gap-3 rounded-xl bg-gray-50 p-4 dark:bg-meta-4"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-lg shadow-sm dark:bg-boxdark">
                  {row.icon}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {row.label}
                  </p>
                  <p
                    className={`mt-0.5 text-sm leading-6 ${
                      row.value
                        ? "text-gray-600 dark:text-gray-300"
                        : "font-semibold text-[#e07a1f]"
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

      <div className="flex space-x-4 mt-6">
        {userDetails?.uuid === user?.uuid ? (
          <Link
            href={`/dashboard/editAccountDetails`}
            className="py-3 px-6 text-white font-bold bg-orange-500 hover:bg-orange-600 transition-all duration-300 rounded-lg flex items-center justify-center gap-2"
          >
            {t("mentorProfile.editProfile", "Edit Profile")}
          </Link>
        ) : (
          <>
            <button
              onClick={() => {
                const data = {
                  to: user.uuid,
                  type: "userToUser",
                  lastMessage: "",
                };
                toast.success(
                  t(
                    "messages.encryptionEnabling",
                    "Enabling end-to-end encryption. Please wait..."
                  )
                );
                createNotification({
                  user_uuid: user.uuid,
                  to: "User",
                  message: t(
                    "messages.youHaveNewMessage",
                    "You have a new message"
                  ),
                });
                createConversation(data).then((data) => {
                  router.push(`/dashboard/messages/${data.uuid}`);
                });
              }}
              className="py-3 px-6 text-white font-bold bg-green-500 hover:bg-green-600 transition-all duration-300 rounded-lg flex items-center justify-center gap-2"
            >
              {t("messages.sendMessage", "Send Message")}
            </button>
            {userDetails?.role === "Enterprenuer" && (
              <Link
                href={`/dashboard/mentorshipApplicationForm/${uuid}`}
                className="py-3 px-6 text-white font-bold bg-primary hover:bg-primary/90 transition-all duration-300 rounded-lg flex items-center justify-center"
              >
                {t("messages.requestMentorship", "Request for mentorship")}
              </Link>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Page;
