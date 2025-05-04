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
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
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
  ) : (
    <div className="bg-slate-50 dark:bg-boxdark-2 min-h-screen">
      <div className="w-full px-0">
        <div className="p-4 sm:p-6 md:px-8">
          <Breadcrumb
            prevLink=""
            prevPage="Businesses"
            pageName="Business details"
          />
        </div>
        
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
          <div className="max-w-full mx-auto px-4 sm:px-6 py-12 md:py-16">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{business.name}</h1>
            <p className="text-xl opacity-90">{business?.BusinessSector?.name || 'Business Sector'}</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 mt-8">
              <div className="p-6 rounded-xl bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-300">
                <div className="text-4xl mb-3">👥</div>
                <h3 className="text-3xl font-bold mb-1">{business?.customerCount || '0'}</h3>
                <p className="text-sm font-medium opacity-80">Customers</p>
              </div>
              <div className="p-6 rounded-xl bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-300">
                <div className="text-4xl mb-3">📍</div>
                <h3 className="text-xl font-bold mb-1">{business?.businessLocation || 'N/A'}</h3>
                <p className="text-sm font-medium opacity-80">Location</p>
              </div>
              <div className="p-6 rounded-xl bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-300">
                <div className="text-4xl mb-3">🏢</div>
                <h3 className="text-xl font-bold mb-1">{business?.industry || 'N/A'}</h3>
                <p className="text-sm font-medium opacity-80">Industry</p>
              </div>
              <div className="p-6 rounded-xl bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-300">
                <div className="text-4xl mb-3">💡</div>
                <h3 className="text-xl font-bold mb-1">{business?.stage || 'N/A'}</h3>
                <p className="text-sm font-medium opacity-80">Stage</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          {business.companyProfile != null && (
            <div className="bg-white dark:bg-boxdark rounded-xl p-6 shadow-md mt-8">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Company Documents</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <a
                  target="_blank"
                  href={business.companyProfile}
                  className="p-5 cursor-pointer bg-gray-50 dark:bg-gray-800 flex flex-col items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-md transition-all duration-300"
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
                  <div className="mt-3 text-gray-800 dark:text-gray-200 text-center font-medium">
                    Company profile
                  </div>
                </a>
                {business.businessPlan && (
                  <a
                    target="_blank"
                    href={business.businessPlan}
                    className="p-5 cursor-pointer bg-gray-50 dark:bg-gray-800 flex flex-col items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-md transition-all duration-300"
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
                    <div className="mt-3 text-gray-800 dark:text-gray-200 text-center font-medium">
                      Business Plan
                    </div>
                  </a>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8 pb-8">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white dark:bg-boxdark rounded-xl p-6 shadow-md">
                <h2 className="text-xl font-bold mb-6 pb-3 text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 flex items-center">
                  <span className="text-2xl mr-3 p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400 rounded-lg">ℹ️</span>
                  BUSINESS OVERVIEW
                </h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">Description</h3>
                    <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
                      {business?.description || "Description not available"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Market & Impact */}
              <div className="bg-white dark:bg-boxdark rounded-xl p-6 shadow-md">
                <h2 className="text-xl font-bold mb-6 pb-3 text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 flex items-center">
                  <span className="text-2xl mr-3 p-2 bg-green-100 dark:bg-green-900/30 text-green-500 dark:text-green-400 rounded-lg">🎯</span>
                  MARKET POTENTIAL
                </h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">Target Market</h3>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-800/60 p-4 rounded-lg">
                      {business?.targetMarket || "No target market description available"}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">Current Impact</h3>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-800/60 p-4 rounded-lg">
                      {business?.businessImpact || "No impact description available"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Growth & Funding */}
              <div className="bg-white dark:bg-boxdark rounded-xl p-6 shadow-md">
                <h2 className="text-xl font-bold mb-6 pb-3 text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 flex items-center">
                  <span className="text-2xl mr-3 p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-500 dark:text-indigo-400 rounded-lg">📈</span>
                  GROWTH & FUNDING
                </h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">Growth Plans</h3>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-800/60 p-4 rounded-lg">
                      {business?.growthPlans || "No growth plans available"}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">Fundraising Needs</h3>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-800/60 p-4 rounded-lg">
                      {business?.fundraisingNeeds || "No fundraising needs specified"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Documents Section */}
              {business.companyProfile && (
                <div className="bg-white dark:bg-boxdark rounded-xl p-6 shadow-md">
                  <h2 className="text-xl font-bold mb-6 pb-3 text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 flex items-center">
                    <span className="text-2xl mr-3 p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-500 dark:text-amber-400 rounded-lg">📑</span>
                    DOCUMENTS
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
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
                        className="group flex flex-col items-center p-5 bg-gray-50 dark:bg-gray-800/60 rounded-xl hover:shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300"
                      >
                        <span className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                          {doc.icon}
                        </span>
                        <span className="text-base font-semibold text-gray-900 dark:text-white">
                          {doc.title}
                        </span>
                        <span className="text-xs text-blue-600 dark:text-blue-400 mt-2">View Document</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Business Info */}
            <div className="space-y-8">
              <div className="bg-white dark:bg-boxdark rounded-xl p-6 shadow-md sticky top-8">
                <h2 className="text-xl font-bold mb-6 pb-3 text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 flex items-center">
                  <span className="text-2xl mr-3 p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-500 dark:text-purple-400 rounded-lg">👤</span>
                  BUSINESS INFORMATION
                </h2>
                <div className="space-y-3">
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
                    <div key={idx} className="flex items-center p-3 bg-gray-50 dark:bg-gray-800/60 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                      <div className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400 mr-3">
                        <span>{item.icon}</span>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{item.label}</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{item.value || "N/A"}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 space-y-3">
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
                    className="flex justify-center items-center w-full px-5 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 font-medium text-base shadow"
                  >
                    <span className="mr-2 text-lg">💬</span>
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
                      className="flex justify-center items-center w-full px-5 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 font-medium text-base shadow disabled:opacity-50"
                    >
                      <span className="mr-2 text-lg">🤝</span>
                      {requesting ? "Requesting..." : "Request to be a mentor"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
