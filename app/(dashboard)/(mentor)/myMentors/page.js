"use client";
import { useContext, useEffect, useState } from "react";
import { UserContext } from "../../layout";
import Loader from "@/components/common/Loader";
import { timeAgo } from "@/app/utils/time_ago";

import Link from "next/link";
import { createNotification } from "@/app/controllers/notification_controller";
import { createConversation } from "@/app/controllers/conversation_controller";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import NoData from "@/app/component/noData";
import Image from "next/image";
import { getEntreprenuerMentors } from "@/app/controllers/mentorship_applications_controllers";
import Pagination from "@/app/component/pagination";

const MentorEntreprenuer = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const { userDetails } = useContext(UserContext);
  const router = useRouter();
  const [limit, setLimit] = useState(20);
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const getMentorName = (item) => {
    return item?.name || "Unnamed Mentor";
  };

  // Helper function to get mentor sector
  const getMentorSector = (item) => {
    return (
      item?.MentorProfile?.BusinessSector?.name ||
      Object.values(item?.MentorProfile?.areasOfExperties || {}).join(", ") ||
      "No Sector"
    );
  };
  useEffect(() => {
    getEntreprenuerMentors(userDetails.uuid, page, limit, keyword).then(
      (res) => {
        console.log(res.data);
        setData(res.data);
        setCount(res.count);
        setLoading(false);
      }
    );
  }, [keyword, page]);
  return loading ? (
    <Loader />
  ) : (
    <div>
      <div className="bg-primary/10 p-6 rounded-xl mb-4 mt-4">
        <h1 className="text-2xl font-bold">Dear {userDetails.name}!</h1>
        <p>
          Welcome to your Mentors Hub. Here, you can view your current mentors ,
          view their profiles , review recent interactions , and schedule
          upcoming sessions.
        </p>
      </div>
      <div className=" mt-4 rounded-xl">
        <div className="flex justify-between">
          <h1 className="text-xl font-bold">My Mentors</h1>
          <input
            onChange={(e) => {
              setKeyword(e.target.value);
            }}
            className="py-1 rounded border-bodydark border-opacity-40 "
            placeholder="Search here"
          />
        </div>
        {data.length < 1 ? (
          <NoData />
        ) : (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {data.map((application, key) => {
              let item = application?.mentor;

              return (
                <Link
                  href={`/myMentorDetails/${item?.uuid || "#"}`}
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
                            getMentorName(item)
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
                              getMentorName(item)
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
                            Object.values(
                              item?.MentorProfile?.areasOfExperties || {}
                            )
                              .slice(0, 2)
                              .join(", ") ||
                            "General Expertise"}
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
                        <h2 className="text-lg font-semibold text-black dark:text-white group-hover:text-primary transition-colors line-clamp-2">
                          {getMentorName(item)}
                        </h2>

                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                          {item?.email || "No email provided"}
                        </p>
                      </div>

                      {/* Details Section */}
                      <div className="space-y-3 pt-2">
                        {/* Expertise */}
                        {item?.MentorProfile?.expertise && (
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
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                            <span className="line-clamp-1">
                              {item.MentorProfile.expertise}
                            </span>
                          </div>
                        )}

                        {/* Role */}
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
                            <span className="line-clamp-1">{item.role}</span>
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
                            Joined{" "}
                            {item?.createdAt
                              ? new Date(item.createdAt).getFullYear()
                              : "N/A"}
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
                        <span>View Details</span>
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
