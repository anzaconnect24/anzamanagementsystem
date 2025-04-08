"use client"
import { useContext, useEffect, useState } from "react";
import {getApprovedBusinesses, getInvestorBusinesses, getPendingBusinesses} from "@/app/controllers/business_controller"
import {timeAgo} from "@/app/utils/time_ago"
import Link from "next/link"
import Loader from "@/components/common/Loader";
import { UserContext } from "../../layout";
import NoData from "@/app/component/noData";
import toast from "react-hot-toast"
import { sendInvestmentInterest } from "@/app/controllers/investment_interest_controller";
import { HiOutlineEye, HiOutlineHeart, HiOutlineCash } from "react-icons/hi";
import { FiChevronDown } from "react-icons/fi";

const Page = () => {
  const [applications, setApplications] = useState([]);
  const [ShowOptions, setShowOptions] = useState(false);
  const {userDetails} = useContext(UserContext)
  const [loading, setloading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // grid or list

  useEffect(() => {
    getInvestorBusinesses(1, 10).then((body) => {
      setApplications(body.data);
      setloading(false);
    });
  }, []);

  const filteredApplications = applications.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.BusinessSector?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.stage?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInterestClick = (businessUuid) => {
    const data = {
      from: "investor",
      user_uuid: userDetails.uuid,
      business_uuid: businessUuid
    };
    
    toast.promise(
      sendInvestmentInterest(data),
      {
        loading: 'Sending interest...',
        success: 'Your interest has been sent successfully!',
        error: 'Failed to send interest. Please try again.'
      }
    );
  };

  const getStageColor = (stage) => {
    if (!stage) return "bg-gray-100 text-gray-600";
    
    const stageLower = stage.toLowerCase();
    if (stageLower.includes("seed") || stageLower.includes("early")) 
      return "bg-blue-100 text-blue-600";
    if (stageLower.includes("growth") || stageLower.includes("series")) 
      return "bg-green-100 text-green-600";
    if (stageLower.includes("mature") || stageLower.includes("late")) 
      return "bg-purple-100 text-purple-600";
    
    return "bg-gray-100 text-gray-600";
  };

  return loading ? (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader />
    </div>
  ) : (
    <div className="container mx-auto px-4 py-8">
      {/* Enhanced Header Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-black dark:text-white mb-2">
              Alumni Businesses
              <span className="ml-3 px-3 py-1 text-sm bg-primary/10 text-primary rounded-full font-medium">
                {applications.length} businesses
              </span>
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Explore investment opportunities in our alumni businesses
            </p>
          </div>

          {/* Search and View Toggle */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search businesses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 rounded-xl border border-stroke bg-white py-3 pl-11 pr-4 outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2">
                <svg className="fill-body dark:fill-bodydark" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15.8045 14.8945L11.2545 10.3445C12.1045 9.24453 12.6045 7.83453 12.6045 6.30453C12.6045 2.82453 9.78453 0.00453 6.30453 0.00453C2.82453 0.00453 0.00453 2.82453 0.00453 6.30453C0.00453 9.78453 2.82453 12.6045 6.30453 12.6045C7.83453 12.6045 9.24453 12.1045 10.3445 11.2545L14.8945 15.8045C15.0045 15.9145 15.1545 15.9745 15.3045 15.9745C15.4545 15.9745 15.6045 15.9145 15.7145 15.8045C15.9345 15.5845 15.9345 15.2145 15.8045 14.8945ZM1.50453 6.30453C1.50453 3.60453 3.60453 1.50453 6.30453 1.50453C9.00453 1.50453 11.1045 3.60453 11.1045 6.30453C11.1045 9.00453 9.00453 11.1045 6.30453 11.1045C3.60453 11.1045 1.50453 9.00453 1.50453 6.30453Z" fill=""></path>
                </svg>
              </span>
            </div>

            <div className="flex items-center bg-white dark:bg-boxdark rounded-xl border border-stroke dark:border-strokedark">
              <button
                onClick={() => setViewMode("grid")}
                className={`flex items-center justify-center h-11 w-11 ${viewMode === "grid" ? "bg-primary text-white" : "text-body dark:text-bodydark"}`}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8.74992 1.25H1.24992C1.05991 1.25 0.877542 1.32902 0.744063 1.46249C0.610584 1.59597 0.531563 1.77834 0.531563 1.96835V9.46835C0.531563 9.65836 0.610584 9.84073 0.744063 9.97421C0.877542 10.1077 1.05991 10.1867 1.24992 10.1867H8.74992C8.93993 10.1867 9.1223 10.1077 9.25578 9.97421C9.38926 9.84073 9.46828 9.65836 9.46828 9.46835V1.96835C9.46828 1.77834 9.38926 1.59597 9.25578 1.46249C9.1223 1.32902 8.93993 1.25 8.74992 1.25ZM7.96828 8.68671H2.03156V2.75H7.96828V8.68671Z" fill="currentColor"></path>
                  <path d="M18.7499 1.25H11.2499C11.0599 1.25 10.8775 1.32902 10.7441 1.46249C10.6106 1.59597 10.5316 1.77834 10.5316 1.96835V9.46835C10.5316 9.65836 10.6106 9.84073 10.7441 9.97421C10.8775 10.1077 11.0599 10.1867 11.2499 10.1867H18.7499C18.9399 10.1867 19.1223 10.1077 19.2558 9.97421C19.3892 9.84073 19.4683 9.65836 19.4683 9.46835V1.96835C19.4683 1.77834 19.3892 1.59597 19.2558 1.46249C19.1223 1.32902 18.9399 1.25 18.7499 1.25ZM17.9683 8.68671H12.0316V2.75H17.9683V8.68671Z" fill="currentColor"></path>
                  <path d="M8.74992 11.25H1.24992C1.05991 11.25 0.877542 11.329 0.744063 11.4625C0.610584 11.596 0.531563 11.7783 0.531563 11.9683V19.4683C0.531563 19.6584 0.610584 19.8407 0.744063 19.9742C0.877542 20.1077 1.05991 20.1867 1.24992 20.1867H8.74992C8.93993 20.1867 9.1223 20.1077 9.25578 19.9742C9.38926 19.8407 9.46828 19.6584 9.46828 19.4683V11.9683C9.46828 11.7783 9.38926 11.596 9.25578 11.4625C9.1223 11.329 8.93993 11.25 8.74992 11.25ZM7.96828 18.6867H2.03156V12.75H7.96828V18.6867Z" fill="currentColor"></path>
                  <path d="M18.7499 11.25H11.2499C11.0599 11.25 10.8775 11.329 10.7441 11.4625C10.6106 11.596 10.5316 11.7783 10.5316 11.9683V19.4683C10.5316 19.6584 10.6106 19.8407 10.7441 19.9742C10.8775 20.1077 11.0599 20.1867 11.2499 20.1867H18.7499C18.9399 20.1867 19.1223 20.1077 19.2558 19.9742C19.3892 19.8407 19.4683 19.6584 19.4683 19.4683V11.9683C19.4683 11.7783 19.3892 11.596 19.2558 11.4625C19.1223 11.329 18.9399 11.25 18.7499 11.25ZM17.9683 18.6867H12.0316V12.75H17.9683V18.6867Z" fill="currentColor"></path>
                </svg>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center justify-center h-11 w-11 ${viewMode === "list" ? "bg-primary text-white" : "text-body dark:text-bodydark"}`}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1.5625 3.125H18.4375M1.5625 10H18.4375M1.5625 16.875H18.4375" stroke="currentColor" strokeWidth="1.875" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {filteredApplications.length < 1 ? (
        <NoData />
      ) : viewMode === "grid" ? (
        // Grid View
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredApplications.map((item, key) => (
            <div key={key} className="bg-white dark:bg-boxdark rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden h-full flex flex-col">
              {/* Card Header */}
              <div className="p-6 border-b border-stroke dark:border-strokedark">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-black dark:text-white group-hover:text-primary transition-colors line-clamp-2">
                    {item.name}
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStageColor(item.stage)}`}>
                    {item.stage || "No Stage"}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {item.BusinessSector?.name || "No Sector"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Joined {timeAgo(item.createdAt)}
                </p>
              </div>

              {/* Card Body */}
              <div className="p-6 flex-grow">
                <div className="space-y-4">
                  {item.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                      {item.description}
                    </p>
                  )}
                  
                  {/* Business Details */}
                  <div className="space-y-2">
                    {item.location && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{item.location}</span>
                      </div>
                    )}
                    
                    {item.seeking && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Seeking: {item.seeking || "Investment"}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-6 border-t border-stroke dark:border-strokedark mt-auto">
                <div className="flex items-center justify-between">
                  <Link
                    href={`/businessDetails/${item.uuid}`}
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-dark transition-colors"
                  >
                    <HiOutlineEye className="w-5 h-5" />
                    View Details
                  </Link>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleInterestClick(item.uuid)}
                      className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                      title="Express Interest"
                    >
                      <HiOutlineHeart className="w-5 h-5" />
                    </button>
                    
                    <Link
                      href={`/investmentApplication/${item.uuid}`}
                      className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                      title="Apply for Investment"
                    >
                      <HiOutlineCash className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // List View
        <div className="bg-white dark:bg-boxdark rounded-xl shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-stroke dark:border-strokedark bg-gray-50 dark:bg-meta-4">
            <div className="col-span-3">
              <p className="text-sm font-semibold text-black dark:text-white">Business Name</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm font-semibold text-black dark:text-white">Sector</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm font-semibold text-black dark:text-white">Stage</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm font-semibold text-black dark:text-white">Joined</p>
            </div>
            <div className="col-span-3 text-right">
              <p className="text-sm font-semibold text-black dark:text-white">Actions</p>
            </div>
          </div>

          {/* Table Body */}
          {filteredApplications.map((item, key) => (
            <div
              key={key}
              className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors"
            >
              <div className="col-span-3 flex items-center">
                <p className="text-sm font-medium text-black dark:text-white">
                  {item.name}
                </p>
              </div>
              <div className="col-span-2 flex items-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {item.BusinessSector?.name || "No Sector"}
                </p>
              </div>
              <div className="col-span-2 flex items-center">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStageColor(item.stage)}`}>
                  {item.stage || "No Stage"}
                </span>
              </div>
              <div className="col-span-2 flex items-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {timeAgo(item.createdAt)}
                </p>
              </div>
              <div className="col-span-3 flex items-center justify-end gap-2">
                <Link
                  href={`/businessDetails/${item.uuid}`}
                  className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                  title="View Details"
                >
                  <HiOutlineEye className="w-5 h-5" />
                </Link>
                
                <button
                  onClick={() => handleInterestClick(item.uuid)}
                  className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                  title="Express Interest"
                >
                  <HiOutlineHeart className="w-5 h-5" />
                </button>
                
                <Link
                  href={`/investmentApplication/${item.uuid}`}
                  className="p-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors px-3 py-2 text-sm"
                >
                  Apply
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Page;