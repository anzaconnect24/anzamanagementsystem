"use client";
import { useState, useEffect, useContext } from "react";
import { useRouter } from "@/utils/navigation";
import { getBusiness } from "@/controllers/business_controller";

import Loader from "@/components/common/Loader";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { FaFilePdf, FaArrowLeft } from "react-icons/fa";
import { toast } from "react-hot-toast";
import { UserContext } from "../../../layouts/DashboardLayout";

const CratDocumentsPage = ({ params }) => {
  const { uuid } = params;
  const { userDetails } = useContext(UserContext);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState(null);
  const [activeTab, setActiveTab] = useState("financial");
  const [categorizedDocs, setCategorizedDocs] = useState({
    financial: [],
    legal: [],
    operations: [],
    commercial: [],
  });

  useEffect(() => {
    // Check permissions
    if (!["Admin", "Staff"].includes(userDetails?.role)) {
      toast.error("Access denied. Admin or Staff role required.");
      router.push("/");
      return;
    }

    fetchBusinessData();
  }, [uuid, userDetails, router]);

  const fetchBusinessData = async () => {
    try {
      const data = await getBusiness(uuid);
      setBusiness(data);
      categorizeDocuments(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching business:", error);
      toast.error("Failed to load business data");
      setLoading(false);
    }
  };

  const categorizeDocuments = (businessData) => {
    if (!businessData?.User) return;

    const categories = {
      financial: [],
      legal: [],
      operations: [],
      commercial: [], // Market documents will be categorized as commercial
    };

    // Helper function to collect documents from arrays
    const collectDocs = (arr, categoryKey) => {
      if (!Array.isArray(arr)) return;
      arr.forEach((item) => {
        if (item && item.attachment) {
          categories[categoryKey].push({
            url: item.attachment,
            name: item.attachment.split("/").pop(),
            subDomain: item.subDomain,
            updatedAt: item.updatedAt,
            description: item.description || "",
          });
        }
      });
    };

    // Collect documents from each CRAT domain
    collectDocs(businessData.User.CratFinancials, "financial");
    collectDocs(businessData.User.CratLegals, "legal");
    collectDocs(businessData.User.CratOperations, "operations");
    collectDocs(businessData.User.CratMarkets, "commercial"); // Market -> Commercial

    setCategorizedDocs(categories);
  };

  const tabs = [
    { key: "financial", label: "Financial", icon: "💰", color: "bg-green-500" },
    { key: "legal", label: "Legal", icon: "⚖️", color: "bg-blue-500" },
    {
      key: "operations",
      label: "Operations",
      icon: "⚙️",
      color: "bg-purple-500",
    },
    {
      key: "commercial",
      label: "Commercial",
      icon: "📊",
      color: "bg-orange-500",
    },
  ];

  const getTabStats = () => {
    return tabs.map((tab) => ({
      ...tab,
      count: categorizedDocs[tab.key].length,
    }));
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <Breadcrumb
          prevLink={`/businessDetails/${uuid}`}
          prevPage={business?.name || "Business Details"}
          pageName="CRAT Attachments"
        />
      </div>

      <div className="rounded-xl border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        {/* Header */}
        <div className="p-6 border-b border-stroke dark:border-strokedark">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-black/50 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <FaArrowLeft />
                Back
              </button>
              <div>
                <h4 className="text-xl font-semibold text-black dark:text-white">
                  CRAT Attachments
                </h4>
                <p className="mt-1 text-bodydark2">
                  {business?.name} - CRAT assessment attachments organized by
                  domain
                </p>
              </div>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Total Documents: {Object.values(categorizedDocs).flat().length}
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="p-6 border-b border-stroke dark:border-strokedark">
          <div className="flex flex-wrap gap-2">
            {getTabStats().map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === tab.key
                    ? `${tab.color} text-white shadow-md`
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span
                    className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                      activeTab === tab.key
                        ? "bg-white/20 text-white"
                        : "bg-gray-300 text-gray-700 dark:bg-gray-600 dark:text-gray-300"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Documents Content */}
        <div className="p-6">
          {categorizedDocs[activeTab].length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">
                {tabs.find((tab) => tab.key === activeTab)?.icon}
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No {tabs.find((tab) => tab.key === activeTab)?.label} Documents
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                No CRAT documents have been uploaded for the{" "}
                {tabs.find((tab) => tab.key === activeTab)?.label.toLowerCase()}{" "}
                domain yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {categorizedDocs[activeTab].map((doc, index) => (
                <div
                  key={index}
                  className="group bg-gray-50 dark:bg-boxdark-2 rounded-xl p-6 hover:shadow-lg transition-all duration-300 border border-black/10"
                >
                  {/* Document Icon */}
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <FaFilePdf className="text-3xl text-red-600" />
                    </div>
                  </div>

                  {/* Document Info */}
                  <div className="text-center mb-4">
                    <h3
                      className="font-semibold text-gray-900 dark:text-white mb-2 truncate"
                      title={doc.name}
                    >
                      {doc.name}
                    </h3>
                    {doc.subDomain && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Domain: {doc.subDomain}
                      </p>
                    )}
                    {doc.updatedAt && (
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Updated: {new Date(doc.updatedAt).toLocaleDateString()}
                      </p>
                    )}
                    {doc.description && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                        {doc.description}
                      </p>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="text-center">
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-200 text-sm font-medium"
                    >
                      <FaFilePdf />
                      Open Document
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CratDocumentsPage;
