"use client";
import {
  getUser,
  getUserInfo,
  updateUser,
} from "@/app/controllers/user_controller";
import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Loader from "@/components/common/Loader";
import { toast } from "react-hot-toast";
import { createConversation } from "@/app/controllers/conversation_controller";
import Image from "next/image";
import { UserContext } from "../../../layout";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { createNotification } from "@/app/controllers/notification_controller";
import { assignEntreprenuerToMentor } from "@/app/controllers/mentorEntreprenuerController";
import Spinner from "@/components/spinner";

const Page = ({ params }) => {
  const { uuid } = params;
  const [user, setUser] = useState(null);
  const { userDetails } = useContext(UserContext);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [approving, setApproving] = useState(false);
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

  return loading ? (
    <Loader />
  ) : (
    <div>
      <Breadcrumb prevLink="" prevPage="Mentors" pageName={`${user?.name}`} />
      <p>{user?.MentorProfile?.position}</p>
      {/* Stats Section - Full Width */}
      <div className="bg-primary bg-opacity-10 rounded-2xl border border-primary/5 dark:bg-boxdark backdrop-blur-sm border-y border-gray-200 dark:border-strokedark mt-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 ">
            <div className="p-6 rounded-2xl bg-white dark:bg-boxdark-2 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-center">
              <div className="text-4xl mb-3">👥</div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {user?.MentorProfile?.smeFocus || "N/A"}{" "}
                {/* Updated to use numberOfCustomers */}
              </h3>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                SME Focus
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-boxdark-2 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-center">
              <div className="text-4xl mb-3">📍</div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {user?.MentorProfile?.location || "N/A"}{" "}
                {/* Updated to use location */}
              </h3>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Location
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-boxdark-2 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-center">
              <div className="text-4xl mb-3">🏢</div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1 line-clamp-1 overflow-y-hidden">
                {Object.values(
                  user?.MentorProfile?.areasOfExperties || {}
                ).join(", ") || "N/A"}{" "}
                {/* Updated to use UserSector.name */}
              </h3>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Experties Area
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-boxdark-2 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-center">
              <div className="text-4xl mb-3">💡</div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1 line-clamp-1 ">
                {user?.MentorProfile?.BusinessSector?.name || "N/A"}
              </h3>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Sector
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-3 space-y-8">
          <div className="bg-white dark:bg-boxdark rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="mb-4">
              <h2 className="text-xl font-bold mb-2 capitalize flex items-center text-gray-900 dark:text-white">
                <span className="text-xl mr-3">🙍</span>
                Bio
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                {user?.MentorProfile?.description || "No Information Available"}
              </p>
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2 capitalize flex items-center text-gray-900 dark:text-white">
                <span className="text-xl mr-3">🧠</span>
                Mentorship focus
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                {user?.MentorProfile?.mentorshipFocus ||
                  "No Information Available"}
              </p>
            </div>
          </div>
          <div className="bg-white dark:bg-boxdark rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="mb-4">
              <h2 className="text-xl font-bold mb-2 capitalize flex items-center text-gray-900 dark:text-white">
                <span className="text-xl mr-3">🌎</span>
                Areas of expertise
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                {Object.values(
                  user?.MentorProfile?.areasOfExperties || {}
                ).join(", ") || "No Information Available"}
              </p>
            </div>
            <div className="mb-4">
              <h2 className="text-xl font-bold mb-2 capitalize flex items-center text-gray-900 dark:text-white">
                <span className="text-xl mr-3">🗣️</span>
                Languages
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                {user?.MentorProfile?.language || "No Information Available"}
              </p>
            </div>
            <div className="mb-4">
              <h2 className="text-xl font-bold mb-2 capitalize flex items-center text-gray-900 dark:text-white">
                <span className="text-xl mr-3">📅 </span>
                Availability
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                {user?.MentorProfile?.mentorAvailability ||
                  "No Information Available"}
              </p>
            </div>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => {
                const data = {
                  to: user.uuid,
                  type: "userToUser",
                  lastMessage: "",
                };
                toast.success("Enabling end-to-end encryption. Please wait...");
                createNotification({
                  user_uuid: user.uuid,
                  to: "User",
                  message: `You have a new message`,
                });
                createConversation(data).then((data) => {
                  router.push(`/messages/${data.uuid}`);
                });
              }}
              className="py-2 px-4 text-white font-bold bg-green-500  hover:text-opacity-80 transition-all duration-300 rounded"
            >
              Send Message
            </button>
            {userDetails.role == "Enterprenuer" && (
              <Link
                href={`/mentorshipApplicationForm/${uuid}`}
                className="py-2 px-4 text-white font-bold bg-primary  hover:text-opacity-80 transition-all duration-300 rounded"
              >
                Request for mentorship
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
