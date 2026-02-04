"use client";
import { useContext, useEffect, useState } from "react";
import { UserContext } from "../../../layouts/DashboardLayout";

import Loader from "@/components/common/Loader";
import { timeAgo } from "@/utils/time_ago";

import Link from "@/utils/link";
import { createNotification } from "@/controllers/notification_controller";
import { createConversation } from "@/controllers/conversation_controller";
import toast from "react-hot-toast";
import { useRouter } from "@/utils/navigation";
import NoData from "@/component/noData";
import Image from "@/utils/image";
import { getEntreprenuerMentors } from "@/controllers/mentorship_applications_controllers";
import { acceptMentorEntreprenuerAppointment } from "@/controllers/mentorEntreprenuerController";
import Pagination from "@/component/pagination";
import { useTranslation } from "../../../locales";

const MentorEntreprenuer = () => {
  const { t } = useTranslation();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const { userDetails } = useContext(UserContext);
  const router = useRouter();
  const [limit, setLimit] = useState(20);
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [acceptingAppointment, setAcceptingAppointment] = useState(null);
  const getMentorName = (item) => {
    return item?.name || t("mentorHub.unnamedMentor", "Unnamed Mentor");
  };
  const makeFirstLetterLowercase = (str) => {
    return str.charAt(0).toLowerCase() + str.slice(1);
  };

  useEffect(() => {
    getEntreprenuerMentors(userDetails.uuid, page, limit, keyword).then(
      (res) => {
        console.log(res);
        setData(res);
        setLoading(false);
      },
    );
  }, [keyword, page]);

  const handleAcceptAppointment = async (application) => {
    setAcceptingAppointment(application.uuid);
    try {
      await acceptMentorEntreprenuerAppointment(application.uuid);
      toast.success("Appointment accepted successfully!");
      // Refresh data
      const res = await getEntreprenuerMentors(
        userDetails.uuid,
        page,
        limit,
        keyword,
      );
      setData(res);
    } catch (error) {
      toast.error("Failed to accept appointment");
      console.error(error);
    } finally {
      setAcceptingAppointment(null);
    }
  };

  const pendingAppointments = data.filter(
    (app) => app.googleMeetLink && !app.menteeAccepted,
  );

  const acceptedAppointments = data.filter(
    (app) => app.googleMeetLink && app.menteeAccepted,
  );
  return loading ? (
    <Loader />
  ) : (
    <div>
      <div className="bg-primary/10 p-6 rounded-xl mb-4 mt-4">
        <h1 className="text-2xl font-bold">
          {t("mentorHub.greeting", "Dear {{name}}!", {
            name: userDetails.name,
          })}
        </h1>
        <p>
          {t(
            "mentorHub.welcome",
            "Welcome to your Mentors Hub. Here, you can view your current mentors, view their profiles, review recent interactions, and schedule upcoming sessions.",
          )}
        </p>
      </div>

      {/* Pending Appointments Section */}
      {pendingAppointments.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-xl mb-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-6 w-6 text-yellow-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-lg font-medium text-yellow-800 mb-3">
                {t("mentorHub.pendingAppointments", "Pending Appointments")}
              </h3>
              <div className="space-y-3">
                {pendingAppointments.map((application) => (
                  <div
                    key={application.uuid}
                    className="bg-white rounded-lg p-4 shadow-sm"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          {application.Mentor?.name}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          <span className="font-medium">Date:</span>{" "}
                          {new Date(
                            application.appointmentDate,
                          ).toLocaleString()}
                        </p>
                        <a
                          href={application.googleMeetLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline mt-1 inline-block"
                        >
                          {application.googleMeetLink}
                        </a>
                      </div>
                      <button
                        onClick={() => handleAcceptAppointment(application)}
                        disabled={acceptingAppointment === application.uuid}
                        className="ml-4 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-400 text-sm font-medium"
                      >
                        {acceptingAppointment === application.uuid
                          ? t("mentorHub.accepting", "Accepting...")
                          : t("mentorHub.acceptAppointment", "Accept")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Accepted Appointments Section */}
      {acceptedAppointments.length > 0 && (
        <div className="bg-green-50 border-l-4 border-green-400 p-6 rounded-xl mb-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-6 w-6 text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-lg font-medium text-green-800 mb-3">
                {t("mentorHub.upcomingMeetings", "Upcoming Meetings")}
              </h3>
              <div className="space-y-3">
                {acceptedAppointments.map((application) => (
                  <div
                    key={application.uuid}
                    className="bg-white rounded-lg p-4 shadow-sm"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          {application.Mentor?.name}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          <span className="font-medium">Date:</span>{" "}
                          {new Date(
                            application.appointmentDate,
                          ).toLocaleString()}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <a
                            href={application.googleMeetLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm font-medium"
                          >
                            <svg
                              className="w-4 h-4 mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                            {t("mentorHub.joinMeeting", "Join Meeting")}
                          </a>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(
                                application.googleMeetLink,
                              );
                              toast.success("Meeting link copied!");
                            }}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-medium text-gray-700"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {t("mentorHub.confirmed", "Confirmed")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className=" mt-4 rounded-xl">
        <div className="flex justify-between">
          <h1 className="text-xl font-bold">
            {t("mentorHub.myMentors", "My Mentors")}
          </h1>
          <input
            onChange={(e) => {
              setKeyword(e.target.value);
            }}
            className="py-1 rounded border-bodydark border-opacity-40 "
            placeholder={t("mentorHub.searchPlaceholder", "Search here")}
          />
        </div>
        {data.length < 1 ? (
          <NoData />
        ) : (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {data.map((application, key) => {
              let item = application?.Mentor;

              return (
                <Link
                  href={`/dashboard/myMentorDetails/${item?.uuid || "#"}`}
                  key={key}
                  className="group h-full"
                >
                  <div className="bg-white dark:bg-boxdark-2 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden h-full flex flex-col">
                    {/* Card Image Header - Full Width */}
                    <div className="relative w-full h-56 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                      <Image
                        src={
                          item?.image ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            getMentorName(item),
                          )}&background=6366f1&color=fff&size=400`
                        }
                        alt={`${getMentorName(item)} profile`}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                        priority={key < 4} // Prioritize loading first 4 images
                        className="object-cover w-full h-full group-hover:scale-110 transition-all duration-500 ease-out"
                        style={{
                          objectPosition: "center top",
                        }}
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (!target.getAttribute("data-fallback")) {
                            target.setAttribute("data-fallback", "true");
                            target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              getMentorName(item),
                            )}&background=random&color=fff&size=400&font-size=0.4&rounded=true`;
                          }
                        }}
                      />

                      {/* Image Overlay for better text readability */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      {/* Sector Badge - Positioned over image */}
                      <div className="absolute bottom-4 left-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/90 dark:bg-boxdark/90 text-primary backdrop-blur-sm">
                          {item?.MentorProfile?.expertise ||
                            t(
                              `mentor.expertise.${makeFirstLetterLowercase(
                                Object.values(
                                  item?.MentorProfile?.areasOfExperties || {},
                                )
                                  .slice(0, 2)
                                  .join(", ")
                                  .replace("&", "And")
                                  .replaceAll(" ", ""),
                              )}`,
                            ) ||
                            t(
                              "mentorHub.generalExpertise",
                              "General Expertise",
                            )}
                        </span>
                      </div>

                      {/* Status indicator */}
                      <div className="absolute top-3 right-3">
                        <div className="w-3 h-3 bg-green-400 rounded-full border-2 border-white shadow-sm"></div>
                      </div>
                    </div>

                    {/* Card Body with Details */}
                    <div className="p-6 flex-grow space-y-4">
                      <div className="space-y-2">
                        <h2 className="text-lg font-semibold text-black dark:text-white group-hover:text-primary transition-colors line-clamp-1">
                          {getMentorName(item)}
                        </h2>

                        {/* Position and Organization */}
                        {item?.MentorProfile?.position && (
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 line-clamp-2">
                            {item.MentorProfile.position}
                          </p>
                        )}
                        {item?.MentorProfile?.organisation && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                              />
                            </svg>
                            {item.MentorProfile.organisation}
                          </p>
                        )}
                      </div>

                      {/* Meeting Status Alert */}
                      {application.googleMeetLink &&
                        !application.menteeAccepted && (
                          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                            <div className="flex items-start">
                              <svg
                                className="w-5 h-5 text-yellow-400 mt-0.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              <div className="ml-2">
                                <p className="text-xs font-medium text-yellow-800">
                                  {t(
                                    "mentorHub.meetingScheduled",
                                    "Meeting Scheduled",
                                  )}
                                </p>
                                <p className="text-xs text-yellow-700 mt-0.5">
                                  {new Date(
                                    application.appointmentDate,
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                      {/* Description */}
                      {item?.MentorProfile?.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                          {item.MentorProfile.description}
                        </p>
                      )}

                      {/* Details Section */}
                      <div className="space-y-2 pt-2 border-t border-gray-100">
                        {/* Areas of Expertise */}
                        {item?.MentorProfile?.areasOfExperties &&
                          Object.keys(item.MentorProfile.areasOfExperties)
                            .length > 0 && (
                            <div className="flex items-start gap-2 text-sm">
                              <svg
                                className="w-4 h-4 flex-shrink-0 text-primary mt-0.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                              <div className="flex-1">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                  {t("mentorHub.expertise", "Expertise")}
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {Object.values(
                                    item.MentorProfile.areasOfExperties,
                                  )
                                    .slice(0, 2)
                                    .map((expertise, idx) => (
                                      <span
                                        key={idx}
                                        className="inline-block px-2 py-0.5 bg-primary/10 text-primary text-xs rounded"
                                      >
                                        {expertise}
                                      </span>
                                    ))}
                                  {Object.keys(
                                    item.MentorProfile.areasOfExperties,
                                  ).length > 2 && (
                                    <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                                      +
                                      {Object.keys(
                                        item.MentorProfile.areasOfExperties,
                                      ).length - 2}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                        {/* Location */}
                        {item?.MentorProfile?.location && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <svg
                              className="w-4 h-4 flex-shrink-0 text-primary"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                            <span className="text-xs">
                              {item.MentorProfile.location}
                            </span>
                          </div>
                        )}

                        {/* Language */}
                        {item?.MentorProfile?.language && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <svg
                              className="w-4 h-4 flex-shrink-0 text-primary"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                              />
                            </svg>
                            <span className="text-xs">
                              {item.MentorProfile.language}
                            </span>
                          </div>
                        )}

                        {/* Mentorship Format */}
                        {item?.MentorProfile?.mentoringFormat &&
                          Object.keys(item.MentorProfile.mentoringFormat)
                            .length > 0 && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <svg
                                className="w-4 h-4 flex-shrink-0 text-primary"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                />
                              </svg>
                              <span className="text-xs line-clamp-1">
                                {Object.values(
                                  item.MentorProfile.mentoringFormat,
                                ).join(", ")}
                              </span>
                            </div>
                          )}

                        {/* Joined Date */}
                        {item?.role && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <svg
                              className="w-4 h-4 flex-shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                              />
                            </svg>
                            <span className="line-clamp-1">
                              {t("users.mentor", "mentor")}
                            </span>
                          </div>
                        )}

                        {/* Joined Date */}
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <svg
                            className="w-4 h-4 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          <span>
                            {t("mentorHub.joined", "Joined")}{" "}
                            {item?.createdAt
                              ? new Date(item.createdAt).getFullYear()
                              : t("mentorHub.notAvailable", "N/A")}
                          </span>
                        </div>
                      </div>

                      {/* Social Links */}
                      <div className="flex items-center gap-3 pt-3">
                        {item?.facebook && (
                          <a
                            href={item.facebook}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-primary transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Image
                              height={20}
                              width={20}
                              alt={`${getMentorName(item)} Facebook profile`}
                              className="w-5 h-5 opacity-75 hover:opacity-100 transition-opacity"
                              src="/facebook.svg"
                            />
                          </a>
                        )}
                        {item?.linkedin && (
                          <a
                            href={item.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-primary transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Image
                              height={20}
                              width={20}
                              alt={`${getMentorName(item)} LinkedIn profile`}
                              className="w-5 h-5 opacity-75 hover:opacity-100 transition-opacity"
                              src="/linkedin.png"
                            />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="px-6 py-4 border-t border-stroke dark:border-strokedark bg-gray-50 dark:bg-boxdark mt-auto">
                      <div className="flex items-center justify-center text-sm font-medium text-primary group-hover:text-primary-dark transition-colors">
                        <span>{t("common.viewDetails", "View Details")}</span>
                        <svg
                          className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
      <Pagination limit={limit} count={count} setPage={setPage} page={page} />
    </div>
  );
};

export default MentorEntreprenuer;
