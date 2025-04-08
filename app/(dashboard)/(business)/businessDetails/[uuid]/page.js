"use client";
import {
  getBusiness,
  updateBusiness,
} from "@/app/controllers/business_controller";
import { useContext, useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Loader from "@/components/common/Loader";
import { toast } from "react-hot-toast";
import { createConversation } from "@/app/controllers/conversation_controller";
import Image from "next/image";
import { UserContext } from "../../../layout";

import { createNotification } from "@/app/controllers/notification_controller";
import { assignEntreprenuerToMentor } from "@/app/controllers/mentorEntreprenuerController";

const Page = ({ params }) => {
  const parameters = use(params);
  const uuid = parameters.uuid;
  const [business, setBusiness] = useState(null);
  const { userDetails } = useContext(UserContext);
  const router = useRouter();
  const [loading, setloading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  const getData = async () => {
    try {
      const data = await getBusiness(uuid);
      setBusiness(data);
      setloading(false);
    } catch (error) {
      console.error('Error fetching business:', error);
      setloading(false);
    }
  };

  useEffect(() => {
    getData();
  }, [uuid]);

  return loading ? (
    <Loader />
  ) : !business ? (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-boxdark">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Business not found</h2>
        <p className="text-gray-600 dark:text-gray-400">The business you're looking for doesn't exist or has been removed.</p>
      </div>
    </div>
  ) : (
    <div className="min-h-screen bg-gray-50 dark:bg-boxdark">
      {/* Hero Section - Full Width */}
      <div className="bg-gradient-to-r from-[#23283a] to-[#2a3045] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div className="flex items-center gap-6">
              {/* Business Profile Image */}
              <div className="flex-shrink-0 relative w-32 h-32 rounded-full border-4 border-white/20 shadow-xl overflow-hidden">
                <Image
                  src={business?.Image || `https://ui-avatars.com/api/?name=${encodeURIComponent(business?.name || 'Business')}&background=random`}
                  alt={`${business?.name || 'Business'} profile`}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              <div className="max-w-3xl">
                <div className="flex items-center gap-4">
                  <h1 className="text-5xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
                    {business?.name || 'Business Name'}
                  </h1>
                  {userDetails?.uuid === business?.User?.uuid && (
                    <Link
                      href="/accountInformation"
                      className="inline-flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-200 backdrop-blur-sm"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Profile
                    </Link>
                  )}
                </div>
                <p className="text-xl text-blue-100 mb-4 font-medium">
                  {business?.BusinessSector?.name || 'Business Sector'}
                </p>
                <p className="text-blue-100/80 text-lg leading-relaxed">
                  {business?.description || "Description not available"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section - Full Width */}
      <div className="bg-white/50 dark:bg-boxdark backdrop-blur-sm border-y border-gray-200 dark:border-strokedark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="p-6 rounded-2xl bg-white dark:bg-boxdark-2 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="text-4xl mb-3">👥</div>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{business?.customerCount || '0'}</h3>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Customers</p>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-boxdark-2 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="text-4xl mb-3">📍</div>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{business?.businessLocation || 'N/A'}</h3>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Location</p>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-boxdark-2 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="text-4xl mb-3">🏢</div>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{business?.industry || 'N/A'}</h3>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Industry</p>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-boxdark-2 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="text-4xl mb-3">💡</div>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{business?.stage || 'N/A'}</h3>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Stage</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Business Bio */}
            <div className="bg-white dark:bg-boxdark rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300">
              <h2 className="text-2xl font-bold mb-6 flex items-center text-gray-900 dark:text-white">
                <span className="text-3xl mr-3">📝</span>
                BUSINESS BIO
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                {business?.businessBio || "No business bio available"}
              </p>
            </div>

            {/* Problem & Solution */}
            <div className="bg-white dark:bg-boxdark rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300">
              <h2 className="text-2xl font-bold mb-6 flex items-center text-gray-900 dark:text-white">
                <span className="text-3xl mr-3">🔮</span>
                PROBLEM & SOLUTION
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">Problem</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                    {business?.problem || "No problem description available"}
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">Solution</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                    {business?.solution || "No solution description available"}
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
                  <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">Target Market</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                    {business?.targetMarket || "No target market description available"}
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">Current Impact</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                    {business?.businessImpact || "No impact description available"}
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
                  <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">Growth Plans</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                    {business?.growthPlans || "No growth plans available"}
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">Fundraising Needs</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                    {business?.fundraisingNeeds || "No fundraising needs specified"}
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
                    { title: "Company Profile", url: business.companyProfile, icon: "📋" },
                    ...(business.businessPlan ? [{ title: "Business Plan", url: business.businessPlan, icon: "📈" }] : []),
                    ...(business.marketResearch ? [{ title: "Market Research", url: business.marketResearch, icon: "🔍" }] : [])
                  ].filter(doc => doc.url).map((doc, idx) => (
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
                  { label: "Entrepreneur", value: business?.User?.name, icon: "👤" },
                  { label: "Email", value: business?.email, icon: "📧" },
                  { label: "Phone", value: business?.phone, icon: "📱" },
                  { label: "Registration", value: business?.registration, icon: "📄" },
                  { label: "SDG", value: business?.sdg, icon: "🎯" },
                  { label: "Industry", value: business?.industry, icon: "🏢" },
                  { label: "Location", value: business?.businessLocation, icon: "📍" },
                  { label: "Team Size", value: business?.team, icon: "👥" },
                  { label: "Program", value: business?.completedProgram, icon: "📚" },
                  { label: "Anza Alumni", value: business?.isAlumni ? "Yes" : "No", icon: "🎓" }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-boxdark-2 rounded-xl hover:bg-gray-100 dark:hover:bg-boxdark-3 transition-colors duration-200">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{item.label}</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{item.value || "N/A"}</p>
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
                    toast.success("Enabling end-to-end encryption. Please wait...");
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
                    className="inline-flex items-center justify-center px-6 py-4 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-200 font-semibold text-lg shadow-sm hover:shadow-md"
                  >
                    <span className="mr-2 text-xl">💰</span>
                    Express Interest
                  </Link>
                )}

                {["Mentor"].includes(userDetails.role) && !business.linkedWithMentor && (
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
    </div>
  );
};

export default Page;
