"use client";
import {
  getBusiness,
  updateBusiness,
} from "@/app/controllers/business_controller";
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
import { updateUser } from "@/app/controllers/user_controller";

const Page = ({ params }) => {
  const { uuid } = params;
  const [business, setBusiness] = useState(null);
  const { userDetails } = useContext(UserContext);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [approving, setApproving] = useState(false);
  const getData = async () => {
    try {
      const data = await getBusiness(uuid);
      setBusiness(data);
      console.log("business", data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching business:", error);
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
      <Breadcrumb
        prevLink=""
        prevPage="Businesses"
        pageName="Business details"
      />
      {/* Stats Section - Full Width */}
      <div className="bg-white/50 dark:bg-boxdark backdrop-blur-sm border-y border-gray-200 dark:border-strokedark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="p-6 rounded-2xl bg-white dark:bg-boxdark-2 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="text-4xl mb-3">👥</div>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {business?.customerCount || "0"}
              </h3>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Customers
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-boxdark-2 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="text-4xl mb-3">📍</div>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {business?.businessLocation || "N/A"}
              </h3>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Location
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-boxdark-2 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="text-4xl mb-3">🏢</div>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {business?.industry || "N/A"}
              </h3>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Industry
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-boxdark-2 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="text-4xl mb-3">💡</div>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {business?.stage || "N/A"}
              </h3>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Stage
              </p>
            </div>
          </div>
        </div>
      </div>

      {business.companyProfile != null && (
        <div className="flex mt-4">
          <div className="w-4/12">Company profile:</div>
          <div className="w-8/12 grid grid-cols-3 text-black">
            <div className="h-full">
              <a
                target="_blank"
                href={business.companyProfile}
                className="py-4 cursor-pointer px-4 ring-1 flex flex-col items-center justify-center ring-stroke hover:shadow"
              >
                <div>
                  <Image
                    height="1000"
                    alt=""
                    width="1000"
                    className="h-16 w-16"
                    src="/pdf.png"
                  />
                </div>
                <div className="mt-3 text-black text-center">
                  Company profile
                </div>
              </a>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-boxdark rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300">
            <h2 className="text-2xl font-bold mb-6 flex items-center text-gray-900 dark:text-white">
              <span className="text-3xl mr-3">ℹ️</span>
              BUSINESS OVERVIEW
            </h2>
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">
                  Description
                </h3>
                <p className="text-xl text-black-100 mb-4 font-medium">
                  {business?.BusinessSector?.name || "Business Sector"}
                </p>
                <p className="text-gray-100/80 text-lg leading-relaxed">
                  {business?.description || "Description not available"}
                </p>
              </div>
            </div>
          </div>

          {/* Market & Impact */}
          <div className="bg-white dark:bg-boxdark rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300">
            <h2 className="text-2xl font-bold mb-6 flex items-center text-gray-900 dark:text-white">
              <span className="text-3xl mr-3">🎯</span>
              MARKET PONTENTIAL
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">
                  Target Market
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                  {business?.targetMarket ||
                    "No target market description available"}
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">
                  Current Impact
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                  {business?.businessImpact ||
                    "No impact description available"}
                </p>
              </div>
            </div>
          </div>

          {/* Growth & Funding */}
          <div className="bg-white dark:bg-boxdark rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300">
            <h2 className="text-2xl font-bold mb-6 flex items-center text-gray-900 dark:text-white">
              <span className="text-3xl mr-3">📈</span>
              GROWTH & FUNDING
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">
                  Growth Plans
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                  {business?.growthPlans || "No growth plans available"}
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">
                  Fundraising Needs
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                  {business?.fundraisingNeeds ||
                    "No fundraising needs specified"}
                </p>
              </div>
            </div>
          </div>

          {/* Documents Section */}
          {business.companyProfile && (
            <div className="bg-white dark:bg-boxdark rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300">
              <h2 className="text-2xl font-bold mb-8 flex items-center text-gray-900 dark:text-white">
                <span className="text-3xl mr-3">📑</span>
                Documents
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  {
                    title: "Company Profile",
                    url: business.companyProfile,
                    icon: "📋",
                  },
                  ...(business.businessPlan
                    ? [
                        {
                          title: "Business Plan",
                          url: business.businessPlan,
                          icon: "📈",
                        },
                      ]
                    : []),
                  ...(business.marketResearch
                    ? [
                        {
                          title: "Market Research",
                          url: business.marketResearch,
                          icon: "🔍",
                        },
                      ]
                    : []),
                ]
                  .filter((doc) => doc.url)
                  .map((doc, idx) => (
                    <a
                      key={idx}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex flex-col items-center p-6 bg-gray-50 dark:bg-boxdark-2 rounded-xl hover:shadow-lg transition-all duration-300"
                    >
                      <span className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                        {doc.icon}
                      </span>
                      <span className="text-base font-semibold text-gray-900 dark:text-white">
                        {doc.title}
                      </span>
                    </a>
                  ))}
              </div>
            </div>
          )}
          {business.status == "waiting" && (
            <button
              onClick={() => {
                setApproving(true);
                updateBusiness({ status: "accepted" }, business.uuid).then(
                  (res) => {
                    updateUser({ activated: true }, business.User.uuid).then(
                      () => {
                        toast.success("Approved successfully");
                        setApproving(false);
                        router.back();
                      }
                    );
                  }
                );
              }}
              className="inline-flex items-center w-64 justify-center px-6 py-4 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-200 font-semibold text-lg shadow-sm hover:shadow-md"
            >
              {approving ? <Spinner /> : "Approve Entrepreneur"}
            </button>
          )}
        </div>

        {/* Right Column - Business Info */}
        <div className="space-y-8">
          <div className="bg-white dark:bg-boxdark rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300 sticky top-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center text-gray-900 dark:text-white">
              <span className="text-3xl mr-3">ℹ️</span>
              Business Information
            </h2>
            <div className="space-y-4">
              {[
                {
                  label: "Entrepreneur",
                  value: business?.User?.name,
                  icon: "👤",
                },
                { label: "Email", value: business?.email, icon: "📧" },
                { label: "Phone", value: business?.phone, icon: "📱" },
                {
                  label: "Registration",
                  value: business?.registration,
                  icon: "📄",
                },
                { label: "SDG", value: business?.sdg, icon: "🎯" },
                { label: "Industry", value: business?.industry, icon: "🏢" },
                {
                  label: "Location",
                  value: business?.businessLocation,
                  icon: "📍",
                },
                { label: "Team Size", value: business?.team, icon: "👥" },
                {
                  label: "Program",
                  value: business?.completedProgram,
                  icon: "📚",
                },
                {
                  label: "Anza Alumni",
                  value: business?.isAlumni ? "Yes" : "No",
                  icon: "🎓",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-boxdark-2 rounded-xl hover:bg-gray-100 dark:hover:bg-boxdark-3 transition-colors duration-200"
                >
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {item.label}
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {item.value || "N/A"}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-4">
              <button
                onClick={() => {
                  const data = {
                    to: business.User.uuid,
                    type: "userToUser",
                    lastMessage: "",
                  };
                  toast.success(
                    "Enabling end-to-end encryption. Please wait..."
                  );
                  createNotification({
                    user_uuid: business.User.uuid,
                    to: "User",
                    message: `You have a new message`,
                  });
                  createConversation(data).then((data) => {
                    router.push(`/messages/${data.uuid}`);
                  });
                }}
                className="inline-flex items-center justify-center w-full px-6 py-4 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all duration-200 font-semibold text-lg shadow-sm hover:shadow-md"
              >
                <span className="mr-2 text-xl">💬</span>
                Message
              </button>

              {userDetails.role === "Investor" && (
                <Link
                  href={`/investmentApplication/${uuid}`}
                  className="flex justify-center items-center w-full px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium text-base shadow"
                >
                  <span className="mr-2 text-lg">💰</span>
                  Express Interest
                </Link>
              )}

              {["Mentor"].includes(userDetails.role) &&
                !business.linkedWithMentor && (
                  <button
                    onClick={() => {
                      setRequesting(true);
                      const payload = {
                        mentor_uuid: userDetails.uuid,
                        entreprenuer_uuid: business.User.uuid,
                      };
                      assignEntreprenuerToMentor(payload).then((res) => {
                        getData();
                        toast.success("Request sent successfully");
                        setRequesting(false);
                      });
                    }}
                    disabled={requesting}
                    className="inline-flex items-center justify-center px-6 py-4 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-all duration-200 font-semibold text-lg shadow-sm hover:shadow-md disabled:opacity-50"
                  >
                    <span className="mr-2 text-xl">🤝</span>
                    {requesting ? "Requesting..." : "Request to be a mentor"}
                  </button>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
