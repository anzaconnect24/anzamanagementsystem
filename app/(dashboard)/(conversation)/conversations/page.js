"use client";
import { useContext, useEffect, useState } from "react";
import {
  getApprovedBusinesses,
  getInvestorBusinesses,
  getPendingBusinesses,
} from "@/app/controllers/business_controller";
import { timeAgo } from "@/app/utils/time_ago";
import Link from "next/link";
import Loader from "@/components/common/Loader";
import { UserContext } from "../../layout";
import NoData from "@/app/component/noData";
import Image from "next/image";
import toast from "react-hot-toast";
import { sendInvestmentInterest } from "@/app/controllers/investment_interest_controller";
import { getConversations } from "@/app/controllers/conversation_controller";
import { useRouter } from "next/navigation";

const Page = () => {
  const [conversations, setConversations] = useState([]);
  const [ShowOptions, setShowOptions] = useState(false);
  const { userDetails } = useContext(UserContext);
  const router = useRouter();
  const [loading, setloading] = useState(true);
  useEffect(() => {
    getConversations(1, 5).then((body) => {
      setConversations(body);
      setloading(false);
    });
  }, []);
  return loading ? (
    <Loader />
  ) : (
    <div>
      <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="py-6 px-4 md:px-6 xl:px-7.5">
          <h4 className="text-xl font-semibold text-black dark:text-white">
            Chats
          </h4>
          <div className="mt-6 space-y-4">
            {conversations.length < 1 ? (
              <NoData />
            ) : (
              conversations.map((item, key) => {
                const showUser1 = item.user1.email != userDetails.email;
                return (
                  <div
                    onClick={() => {
                      toast.success(
                        "Enabling end-to-end encryption. Please wait..."
                      );
                      router.push(`/messages/${item.uuid}`);
                    }}
                    key={key}
                    className="flex space-x-4 cursor-pointer items-center"
                  >
                    <div className="w-10/12 flex space-x-2 items-center">
                      <div className="">
                        <div className=" aspect-square rounded-full flex justify-center bg-opacity-60 items-center h-12 w-12 bg-bodydark1  ">
                          {showUser1 ? (
                            item.user1.image == null ? (
                              <div>
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth="1.5"
                                  stroke="currentColor"
                                  class="w-6 h-6 m-4 text-primary"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                                  />
                                </svg>
                              </div>
                            ) : (
                              <Image
                                alt="User profile"
                                height={50}
                                width={50}
                                className="rounded-full h-12 w-12 object-cover "
                                src={item.user1.image}
                              />
                            )
                          ) : item.user2 && item.user2.image == null ? (
                            <div>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="1.5"
                                stroke="currentColor"
                                class="w-6 h-6 m-5 text-primary"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                                />
                              </svg>
                            </div>
                          ) : (
                            <Image
                              alt="User avatar"
                              height={50}
                              width={50}
                              className="rounded-full h-12 w-12 object-cover"
                              src={item.user2 && item.user2.image}
                            />
                          )}
                        </div>
                      </div>
                      <div className="">
                        <div>
                          {showUser1 ? item.user1.name : item.user2.name}
                        </div>
                        <div>
                          {showUser1 ? item.user1.email : item.user2.email}
                        </div>
                      </div>
                    </div>

                    <div className="w-2/12">{timeAgo(item.createdAt)}</div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
