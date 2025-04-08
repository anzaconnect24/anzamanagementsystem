"use client"
import {getAdmins, getUserInfo} from "@/app/controllers/user_controller.js"
import { timeAgo } from "@/app/utils/time_ago";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { createConversation } from "@/app/controllers/conversation_controller";
import { useRouter } from "next/navigation";
import { createNotification } from "@/app/controllers/notification_controller";
import { HiOutlineChat, HiOutlineMail, HiOutlinePhone, HiOutlineOfficeBuilding, HiOutlineLocationMarker, HiOutlineCash, HiOutlineDocumentText, HiOutlineUserCircle, HiOutlineClock, HiOutlineLockClosed } from "react-icons/hi";
import React from "react";
import Link from "next/link";
import { UserContext } from "../../../layout";
import Image from "next/image";

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
            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6366f1&color=fff`;
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

const Page = ({params}) => {
    // Unwrap params using React.use()
    const unwrappedParams = React.use(params);
    const uuid = unwrappedParams.uuid;
    
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

    const handleStartChat = () => {
        const data = {
            to: user.uuid,
            type: "userToUser",
            lastMessage: ""
        };
        
        createNotification({ 
            user_uuid: user.uuid, 
            to: "User", 
            message: `You have a new message`
        });
        
        toast.promise(
            createConversation(data).then((data) => {
                router.push(`/messages/${data.uuid}`);
            }),
            {
                loading: 'Enabling end-to-end encryption...',
                success: 'Chat initialized successfully!',
                error: 'Failed to start chat. Please try again.'
            }
        );
    };

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
                <div className="text-xl font-medium text-gray-600 dark:text-gray-400 mb-2">Investor not found</div>
                <p className="text-gray-500 dark:text-gray-500">The investor profile you're looking for doesn't exist or has been removed.</p>
            </div>
        );
    }

    // Define profile sections
    const contactSection = {
        title: "Contact Information",
        items: [
            { icon: <HiOutlineUserCircle className="w-5 h-5" />, label: "Name", value: user.name },
            { icon: <HiOutlineMail className="w-5 h-5" />, label: "Email", value: user.email },
            { icon: <HiOutlinePhone className="w-5 h-5" />, label: "Phone", value: user.phone },
            { icon: <HiOutlineLocationMarker className="w-5 h-5" />, label: "Location", value: user.InvestorProfile?.geography || "Not specified" },
            { icon: <HiOutlineOfficeBuilding className="w-5 h-5" />, label: "Company", value: user.InvestorProfile?.company || "Not specified" },
            { icon: <HiOutlineDocumentText className="w-5 h-5" />, label: "Position", value: user.InvestorProfile?.role || "Not specified" },
            { icon: <HiOutlineDocumentText className="w-5 h-5" />, label: "LinkedIn", value: user.InvestorProfile?.linkedIn ? <a href={user.InvestorProfile.linkedIn} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">View Profile</a> : "Not provided" },
            { icon: <HiOutlineDocumentText className="w-5 h-5" />, label: "Website", value: user.InvestorProfile?.website ? <a href={user.InvestorProfile.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Visit Website</a> : "Not provided" }
        ]
    };

    const investmentSection = {
        title: "Investment Preferences",
        items: [
            { icon: <HiOutlineDocumentText className="w-5 h-5" />, label: "Sector", value: user.InvestorProfile?.BusinessSector?.name || "Not specified" },
            { icon: <HiOutlineCash className="w-5 h-5" />, label: "Investment Size", value: user.InvestorProfile?.ticketSize || "Not specified" },
            { icon: <HiOutlineDocumentText className="w-5 h-5" />, label: "Investment Types", value: user.InvestorProfile?.structure || "Not specified" },
            { icon: <HiOutlineDocumentText className="w-5 h-5" />, label: "Investment Focus", value: user.InvestorProfile?.focus?.join(", ") || "Not specified" },
            { icon: <HiOutlineDocumentText className="w-5 h-5" />, label: "Mentoring Preference", value: user.InvestorProfile?.mentoringPreference === "yes" ? "Open to mentoring startups" : "Investment only" }
        ]
    };

    const bioSection = {
        title: "Background & Experience",
        items: [
            { icon: <HiOutlineDocumentText className="w-5 h-5" />, label: "Bio", value: user.InvestorProfile?.bio || "Not provided" },
            { icon: <HiOutlineDocumentText className="w-5 h-5" />, label: "Notable Investments", value: user.InvestorProfile?.notableInvestments || "Not provided" }
        ]
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <Breadcrumb prevLink={`/investors`} prevPage="Investors" pageName="Investor Profile" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Header Card */}
                <div className="lg:col-span-3 bg-white dark:bg-boxdark rounded-xl shadow-sm overflow-hidden">
                    <div className="relative h-48 bg-gradient-to-r from-primary/20 to-primary/5">
                        <div className="absolute bottom-0 left-0 w-full p-6 flex flex-col md:flex-row md:items-end gap-6">
                            <div className="w-24 h-24 rounded-xl bg-white dark:bg-boxdark shadow-md flex items-center justify-center border-4 border-white dark:border-boxdark overflow-hidden">
                                <ProfileImage user={user} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-black dark:text-white">{user.name}</h1>
                                <p className="text-gray-600 dark:text-gray-400">{user.InvestorProfile?.role || "Investor"} at {user.InvestorProfile?.company || "Company"}</p>
                            </div>
                        </div>
                    </div>
                    <div className="m-10">
                        <p className="text-gray-600 dark:text-gray-400">
                            {user.InvestorProfile?.bio || "No bio provided"}
                        </p>
                    </div>
                    <div className="p-6 pt-16 md:pt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex flex-wrap gap-3">
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                {user.InvestorProfile?.BusinessSector?.name || "All Sectors"}
                            </span>
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                {user.InvestorProfile?.ticketSize || "Flexible Investment"}
                            </span>
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                                {user.InvestorProfile?.geography || "Global"}
                            </span>
                            {user.InvestorProfile?.mentoringPreference === "yes" && (
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                                    Open to Mentoring
                                </span>
                            )}
                        </div>
                        <div className="flex gap-3">
                            {userDetails && userDetails.role === "Entrepreneur" && (
                                <Link
                                    href={`/investmentApplication/${uuid}`}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                                >
                                    <span>💰</span>
                                    Ask for Investment
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                {/* Profile Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Contact Information - Only visible to admins */}
                    {isAdmin ? (
                        <div className="bg-white dark:bg-boxdark rounded-xl shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-stroke dark:border-strokedark">
                                <h2 className="text-lg font-semibold text-black dark:text-white">{contactSection.title}</h2>
                            </div>
                            <div className="p-6">
                                <div className="space-y-4">
                                    {contactSection.items.map((item, itemIndex) => (
                                        <div key={itemIndex} className="flex items-start gap-3">
                                            <div className="flex-shrink-0 mt-1 text-gray-500 dark:text-gray-400">
                                                {item.icon}
                                            </div>
                                            <div className="flex-grow">
                                                <div className="text-sm text-gray-500 dark:text-gray-400">{item.label}</div>
                                                <div className="text-base font-medium text-black dark:text-white">{item.value}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-boxdark rounded-xl shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-stroke dark:border-strokedark">
                                <h2 className="text-lg font-semibold text-black dark:text-white">Contact Information</h2>
                            </div>
                            <div className="p-6 flex flex-col items-center justify-center text-center">
                                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-meta-4 flex items-center justify-center mb-3">
                                    <HiOutlineLockClosed className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                                </div>
                                <h3 className="text-base font-medium text-black dark:text-white mb-2">
                                    Contact Details Restricted
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mb-3">
                                    Contact information is only available to administrators.
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    You can use the "Start Conversation" button to connect with this investor.
                                </p>
                            </div>
                        </div>
                    )}
                    
                    {/* Investment Preferences - Visible to everyone */}
                    <div className="bg-white dark:bg-boxdark rounded-xl shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-stroke dark:border-strokedark">
                            <h2 className="text-lg font-semibold text-black dark:text-white">{investmentSection.title}</h2>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                {investmentSection.items.map((item, itemIndex) => (
                                    <div key={itemIndex} className="flex items-start gap-3">
                                        <div className="flex-shrink-0 mt-1 text-gray-500 dark:text-gray-400">
                                            {item.icon}
                                        </div>
                                        <div className="flex-grow">
                                            <div className="text-sm text-gray-500 dark:text-gray-400">{item.label}</div>
                                            <div className="text-base font-medium text-black dark:text-white">{item.value}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Bio & Experience Section */}
                    <div className="bg-white dark:bg-boxdark rounded-xl shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-stroke dark:border-strokedark">
                            <h2 className="text-lg font-semibold text-black dark:text-white">{bioSection.title}</h2>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                {bioSection.items.map((item, itemIndex) => (
                                    <div key={itemIndex} className="flex items-start gap-3">
                                        <div className="flex-shrink-0 mt-1 text-gray-500 dark:text-gray-400">
                                            {item.icon}
                                        </div>
                                        <div className="flex-grow">
                                            <div className="text-sm text-gray-500 dark:text-gray-400">{item.label}</div>
                                            <div className="text-base font-medium text-black dark:text-white whitespace-pre-wrap">{item.value}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Additional Information */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-boxdark rounded-xl shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-stroke dark:border-strokedark">
                            <h2 className="text-lg font-semibold text-black dark:text-white">Investment Activity</h2>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">Investments</span>
                                    <span className="text-sm font-medium text-black dark:text-white">
                                        {user.InvestorProfile?.investments || "0"}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">Portfolio Companies</span>
                                    <span className="text-sm font-medium text-black dark:text-white">
                                        {user.InvestorProfile?.portfolioCompanies || "0"}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">Member Since</span>
                                    <span className="text-sm font-medium text-black dark:text-white">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-boxdark rounded-xl shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-stroke dark:border-strokedark">
                            <h2 className="text-lg font-semibold text-black dark:text-white">Contact Options</h2>
                        </div>
                        <div className="p-6">
                            <div className="space-y-3">
                                <button 
                                    onClick={handleStartChat}
                                    className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white py-2 px-4 rounded-lg transition-colors"
                                >
                                    <HiOutlineChat className="w-5 h-5" />
                                    Start Conversation
                                </button>
                                
                                {isAdmin && (
                                    <a 
                                        href={`mailto:${user.email}`}
                                        className="w-full inline-flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-meta-4 dark:hover:bg-meta-3 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg transition-colors"
                                    >
                                        <HiOutlineMail className="w-5 h-5" />
                                        Send Email
                                    </a>
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