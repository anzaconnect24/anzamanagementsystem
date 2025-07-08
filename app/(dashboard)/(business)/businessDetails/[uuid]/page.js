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
import { getScoreData } from "@/app/controllers/crat_general_controller";
import AIAnalysisPanel from "@/components/AI/AIAnalysisPanel";
import jsPDF from "jspdf";
import BusinessDomainScores from "@/components/Charts/BusinessDomainScores";
import PerformanceDistribution from "@/components/Charts/PerformanceDistribution";

const Page = ({ params }) => {
  const { uuid } = params;
  const [business, setBusiness] = useState(null);
  const { userDetails } = useContext(UserContext);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [approving, setApproving] = useState(false);
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [loadingCRAT, setLoadingCRAT] = useState(false);
  const [cratData, setCratData] = useState(null);
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

  const loadCRATForAI = async () => {
    if (!business) {
      toast.error('Business data not loaded yet');
      return;
    }

    try {
      setLoadingCRAT(true);
      console.log('🔍 Preparing comprehensive AI analysis for:', business.name);
      
      // Show immediate feedback
      toast.loading('Preparing AI analysis...', { id: 'ai-loading' });
      
      // Calculate intelligent scores based on business completeness
      const calculateIntelligentScore = (category) => {
        let score = 50; // Base score
        
        switch (category) {
          case 'commercial':
            if (business.market) score += 15;
            if (business.numberOfCustomers && business.numberOfCustomers > 0) score += 15;
            if (business.impact) score += 10;
            if (business.traction) score += 10;
            break;
            
          case 'financial':
            if (business.fundraisingNeeds) score += 15;
            if (business.lookingForInvestment) score += 15;
            if (business.stage && business.stage !== 'Idea') score += 10;
            if (business.companyProfile) score += 10;
            break;
            
          case 'operations':
            if (business.team && parseInt(business.team) > 1) score += 15;
            if (business.growthPlan) score += 15;
            if (business.location) score += 5;
            if (business.description) score += 10;
            if (business.solution) score += 5;
            break;
            
          case 'legal':
            if (business.registration) score += 20;
            if (business.BusinessSector?.name) score += 15;
            if (business.status === 'accepted') score += 10;
            if (business.sdg) score += 5;
            break;
        }
        
        return Math.min(score, 95); // Cap at 95%
      };

      // Try to get actual CRAT data first
      let actualCRATData = null;
      try {
        actualCRATData = await getScoreData();
        console.log('📊 Found CRAT assessment data:', actualCRATData);
        toast.success('CRAT assessment data loaded', { id: 'ai-loading' });
      } catch (cratError) {
        console.log('ℹ️ No CRAT assessment found, using business profile analysis');
        toast.success('Business profile analysis prepared', { id: 'ai-loading' });
      }

      // Create comprehensive score data
      const scoreData = actualCRATData || {
        commercial: { 
          percentage: calculateIntelligentScore('commercial'),
          status: calculateIntelligentScore('commercial') >= 70 ? 'Good' : calculateIntelligentScore('commercial') >= 50 ? 'Fair' : 'Needs Improvement'
        },
        financial: { 
          percentage: calculateIntelligentScore('financial'),
          status: calculateIntelligentScore('financial') >= 70 ? 'Good' : calculateIntelligentScore('financial') >= 50 ? 'Fair' : 'Needs Improvement'
        },
        operations: { 
          percentage: calculateIntelligentScore('operations'),
          status: calculateIntelligentScore('operations') >= 70 ? 'Good' : calculateIntelligentScore('operations') >= 50 ? 'Fair' : 'Needs Improvement'
        },
        legal: { 
          percentage: calculateIntelligentScore('legal'),
          status: calculateIntelligentScore('legal') >= 70 ? 'Good' : calculateIntelligentScore('legal') >= 50 ? 'Fair' : 'Needs Improvement'
        },
        general_status: actualCRATData ? 'CRAT Assessment' : 'Business Profile Analysis'
      };

      // Send PDF report to entrepreneur
      await sendAIReportEmail(business, scoreData);

      // Create detailed report data with rich context
      const reportData = {
        commercial: { 
          responses: [
            `Business Description: ${business.description || 'Comprehensive business overview needed'}`,
            `Target Market: ${business.market || 'Market analysis required'}`,
            `Customer Base: ${business.numberOfCustomers ? `${business.numberOfCustomers} customers` : 'Customer metrics needed'}`,
            `Market Impact: ${business.impact || 'Impact assessment required'}`,
            `Current Traction: ${business.traction || 'Traction metrics needed'}`,
            `Problem Statement: ${business.problem || 'Problem definition required'}`,
            `Solution Offered: ${business.solution || 'Solution description required'}`
          ], 
          score: scoreData.commercial.percentage
        },
        financial: { 
          responses: [
            `Business Stage: ${business.stage || 'Stage classification needed'}`,
            `Fundraising Needs: ${business.fundraisingNeeds || 'Funding requirements not specified'}`,
            `Investment Seeking: ${business.lookingForInvestment ? 'Actively seeking investment' : 'Not currently seeking investment'}`,
            `Revenue Model: ${business.businessPlan ? 'Business plan available' : 'Revenue model documentation needed'}`,
            `Financial Documentation: ${business.companyProfile ? 'Company profile available' : 'Financial documents needed'}`,
            `Growth Plans: ${business.growthPlan || 'Growth strategy required'}`
          ], 
          score: scoreData.financial.percentage
        },
        operations: { 
          responses: [
            `Team Structure: ${business.team ? `Team of ${business.team} members` : 'Team size not specified'}`,
            `Business Location: ${business.location || 'Location not specified'}`,
            `Growth Strategy: ${business.growthPlan || 'Strategic planning required'}`,
            `Operational Status: ${business.status === 'accepted' ? 'Approved operations' : 'Pending approval'}`,
            `Industry Sector: ${business.BusinessSector?.name || 'Sector classification needed'}`,
            `Program Completion: ${business.completedProgram || 'No program completion recorded'}`,
            `Alumni Status: ${business.isAlumni ? 'Anza Alumni' : 'Non-alumni'}`
          ], 
          score: scoreData.operations.percentage
        },
        legal: { 
          responses: [
            `Business Registration: ${business.registration || 'Registration documentation needed'}`,
            `Legal Structure: ${business.BusinessSector?.name || 'Legal structure classification required'}`,
            `Compliance Status: ${business.status === 'accepted' ? 'Compliant and approved' : 'Pending compliance review'}`,
            `SDG Alignment: ${business.sdg || 'SDG alignment assessment needed'}`,
            `Documentation: ${business.companyProfile ? 'Legal documents available' : 'Legal documentation required'}`,
            `Industry Compliance: ${business.BusinessSector?.name ? 'Industry-specific compliance addressed' : 'Industry compliance assessment needed'}`
          ], 
          score: scoreData.legal.percentage
        }
      };

      // Create comprehensive business info for AI
      const businessInfo = {
        name: business.name || 'Business Name',
        sector: business.BusinessSector?.name || 'Technology',
        location: business.location || 'Tanzania',
        stage: business.stage || 'Growth Stage',
        description: business.description,
        problem: business.problem,
        solution: business.solution,
        traction: business.traction,
        market: business.market,
        impact: business.impact,
        growthPlan: business.growthPlan,
        fundraisingNeeds: business.fundraisingNeeds,
        entrepreneur: business.User?.name,
        email: business.email,
        phone: business.phone,
        team: business.team,
        registration: business.registration,
        sdg: business.sdg,
        lookingForInvestment: business.lookingForInvestment,
        isAlumni: business.isAlumni,
        completedProgram: business.completedProgram,
        numberOfCustomers: business.numberOfCustomers
      };

      setCratData({
        scoreData,
        reportData,
        businessInfo
      });
      
      setShowAIAnalysis(true);
      
      // Success message with context
      const avgScore = Math.round((scoreData.commercial.percentage + scoreData.financial.percentage + scoreData.operations.percentage + scoreData.legal.percentage) / 4);
      
      // Determine score category for better messaging
      let scoreCategory = 'Excellent';
      let scoreEmoji = '🎯';
      if (avgScore < 50) {
        scoreCategory = 'Needs Improvement';
        scoreEmoji = '📈';
      } else if (avgScore < 70) {
        scoreCategory = 'Good Potential';
        scoreEmoji = '⭐';
      } else if (avgScore < 85) {
        scoreCategory = 'Strong Performance';
        scoreEmoji = '🚀';
      }
      
      toast.success(`${scoreEmoji} AI analysis complete! ${scoreCategory} - ${avgScore}%`, { 
        id: 'ai-loading',
        duration: 4000
      });
      
      // Smooth scroll to AI section with slight delay for better UX
      setTimeout(() => {
        document.getElementById('ai-analysis-section')?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 800);
      
    } catch (error) {
      console.error('❌ Error preparing AI analysis:', error);
      toast.error('Failed to prepare AI analysis. Please try again.', { id: 'ai-loading' });
    } finally {
      setLoadingCRAT(false);
    }
  };

  const sendAIReportEmail = async (business, scoreData) => {
    if (!business?.email) return;
    // Generate PDF
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("AI Analysis Report", 10, 15);
    doc.setFontSize(12);
    let y = 30;
    doc.text(`Entrepreneur: ${business.User?.name || 'N/A'}`, 10, y); y += 8;
    doc.text(`Business: ${business.name || 'N/A'}`, 10, y); y += 8;
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 10, y); y += 12;
    Object.entries(scoreData).forEach(([domain, data]) => {
      if (typeof data === 'object' && data !== null && 'percentage' in data) {
        doc.text(`${domain.charAt(0).toUpperCase() + domain.slice(1)}: ${data.percentage}%`, 10, y); y += 7;
        if (data.status) {
          doc.text(`Status: ${data.status}`, 14, y); y += 6;
        }
      }
    });
    const pdfBase64 = btoa(doc.output("arraybuffer").reduce((data, byte) => data + String.fromCharCode(byte), ''));
    // Send email
    try {
      const res = await fetch('/api/send-ai-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toEmail: business.email,
          pdfBase64,
          entrepreneurName: business.User?.name,
          businessName: business.name,
        }),
      });
      if (res.ok) {
        toast.success('AI analysis report emailed to entrepreneur!');
      } else {
        toast.error('Failed to email AI analysis report.');
      }
    } catch (err) {
      toast.error('Error sending email.');
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
        pageName={`${business?.name}`}
      />
      {/* Stats Section - Full Width */}
      <div className="bg-primary/5 rounded-2xl border border-primary/10 border-opacity-40 dark:bg-boxdark backdrop-blur-sm border-y border-gray-200 dark:border-strokedark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-6 rounded-2xl bg-white dark:bg-boxdark-2 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="text-4xl mb-3">👥</div>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {business?.numberOfCustomers || "N/A"}{" "}
                {/* Updated to use numberOfCustomers */}
              </h3>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Customers
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-boxdark-2 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="text-4xl mb-3">📍</div>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {business?.location || "N/A"} {/* Updated to use location */}
              </h3>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Location
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-boxdark-2 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="text-4xl mb-3">🏢</div>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {business?.BusinessSector?.name || "N/A"}{" "}
                {/* Updated to use BusinessSector.name */}
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
            <div className="p-6 rounded-2xl bg-white dark:bg-boxdark-2 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="text-4xl mb-3">💵</div>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {business?.revenue || "N/A"}
              </h3>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Revenue
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-boxdark rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300">
            <h2 className="text-2xl font-bold mb-6 capitalize flex items-center text-gray-900 dark:text-white">
              <span className="text-3xl mr-3">ℹ️</span>
              Business Overview
            </h2>
            <div className="space-y-8">
              <div>
                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                  {business?.description || "Description not available"}
                </p>
              </div>
              {/* Added Problem, Solution, and Traction */}
              <div>
                <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">
                  Problem
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                  {business?.problem || "No problem description available"}
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">
                  Solution
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                  {business?.solution || "No solution description available"}
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">
                  Traction
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                  {business?.traction || "No traction information available"}
                </p>
              </div>
            </div>
          </div>

          {/* Market & Impact */}
          <div className="bg-white dark:bg-boxdark rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300">
            <h2 className="text-2xl font-bold mb-6 flex items-center text-gray-900 dark:text-white">
              <span className="text-3xl mr-3">🎯</span>
              Market Potential
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">
                  Target Market
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                  {business?.market || "No target market description available"}{" "}
                  {/* Updated to use market */}
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">
                  Current Impact
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                  {business?.impact || "No impact description available"}{" "}
                  {/* Updated to use impact */}
                </p>
              </div>
            </div>
          </div>

          {/* Growth & Funding */}
          <div className="bg-white dark:bg-boxdark rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300">
            <h2 className="text-2xl font-bold mb-6 flex items-center text-gray-900 dark:text-white">
              <span className="text-3xl mr-3">📈</span>
              Growth & Funding
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">
                  Growth Plans
                </h3>
                <p className="text-gray-600  text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                  {business?.growthPlan || "No growth plans available"}{" "}
                  {/* Updated to use growthPlan */}
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
          {["Admin", "Mentor", "Investor"].includes(userDetails.role) && (
            <div className="grid grid-cols-12 gap-6 items-stretch">
              <div className=" col-span-7">
                <BusinessDomainScores
                  userDetails={business?.User}
                  initialScoreData={{}}
                />
              </div>
              <div className="col-span-5">
                <PerformanceDistribution
                  userDetails={business?.User}
                  chartHeight={250}
                  initialScoreData={{}}
                />
              </div>
            </div>
          )}

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
                  // Only include businessPlan and marketResearch if they exist
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
                ].map((doc, idx) => (
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
                {
                  label: "Industry",
                  value: business?.BusinessSector?.name,
                  icon: "🏢",
                },
                { label: "Location", value: business?.location, icon: "📍" },
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
                { label: "Status", value: business?.status, icon: "📊" },
                {
                  label: "Seeking Investment",
                  value: business?.lookingForInvestment ? "Yes" : "No",
                  icon: "💰",
                },
                {
                  label: "Website",
                  value: business?.websiteLink,
                  icon: "🌐",
                },
                {
                  label: "Instagram Link",
                  value: business?.instagramLink,
                  icon: "🔗",
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

            {/* Added Social Media Links */}
            {(business.facebook ||
              business.instagram ||
              business.linkedin ||
              business.twitter) && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
                  Social Media
                </h3>
                <div className="flex space-x-4">
                  {business.facebook && (
                    <a
                      href={business.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <span className="text-2xl">📘</span>
                    </a>
                  )}
                  {/* {business.instagram && (
                    <a
                      href={business.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-pink-600 hover:text-pink-800"
                    >
                      <span className="text-2xl">📷</span>
                    </a>
                  )} */}
                  {business.websiteLink && (
                    <a
                      href={business.websiteLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary"
                    >
                      <span className="text-2xl"> Visit Website</span>
                    </a>
                  )}
                  {business.instagramLink && (
                    <a
                      href={business.instagramLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary"
                    >
                      <span className="text-2xl"> Visit Website</span>
                    </a>
                  )}

                  {business.linkedin && (
                    <a
                      href={business.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-700 hover:text-blue-900"
                    >
                      <span className="text-2xl">💼</span>
                    </a>
                  )}
                  {business.twitter && (
                    <a
                      href={business.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <span className="text-2xl">🐦</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            <div className="mt-8 flex flex-col gap-4">
              {/* AI Evaluation Button - Admin Only */}
              {userDetails.role === "Admin" && (
                <div className="relative group">
                  <button
                    onClick={loadCRATForAI}
                    disabled={loadingCRAT}
                    className="inline-flex items-center justify-center w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
                  >
                    {loadingCRAT ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Preparing AI Analysis...
                      </>
                    ) : (
                      <>
                        <span className="mr-2 text-xl">🤖</span>
                        {showAIAnalysis ? 'Refresh AI Analysis' : 'Generate AI Analysis'}
                        <span className="ml-2 text-sm opacity-80">
                          {showAIAnalysis ? '↻' : '✨'}
                        </span>
                      </>
                    )}
                  </button>
                  
                  {/* Professional Loading Overlay */}
                  {loadingCRAT && (
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600/90 to-indigo-600/90 rounded-xl flex items-center justify-center">
                      <div className="flex flex-col items-center text-white">
                        <div className="relative">
                          <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <div className="absolute inset-0 w-8 h-8 border-4 border-transparent border-r-white/50 rounded-full animate-spin animate-reverse"></div>
                        </div>
                        <span className="mt-2 text-sm font-medium">Analyzing...</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                    {showAIAnalysis ? 'Update analysis with latest data' : 'Generate comprehensive AI investment analysis'}
                  </div>
                </div>
              )}

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
                  className="inline-flex items-center justify-center px-6 py-4 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-200 font-semibold text-lg shadow-sm hover:shadow-md"
                >
                  <span className="mr-2 text-xl">💰</span>
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
                    className="inline-flex items-center justify-center px-6 py-4 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all duration-200 font-semibold text-lg shadow-sm hover:shadow-md disabled:opacity-50"
                  >
                    <span className="mr-2 text-xl">🤝</span>
                    {requesting ? "Requesting..." : "Request to be a mentor"}
                  </button>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* AI Analysis Section - Admin Only */}
      {userDetails.role === "Admin" && showAIAnalysis && cratData && (
        <div id="ai-analysis-section" className="mt-12 animate-fadeIn">
          {/* Analysis Header */}
          <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 dark:from-purple-900/20 dark:via-indigo-900/20 dark:to-blue-900/20 p-8 rounded-2xl border-2 border-purple-200 dark:border-purple-700 mb-8 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-3xl">🤖</span>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
                    AI-Powered Investment Analysis
                  </h2>
                  <p className="text-purple-600 dark:text-purple-400 mt-2 text-lg">
                    Comprehensive evaluation of <span className="font-semibold">{business?.name}</span> using advanced AI analysis
                  </p>
                </div>
              </div>
              
              {/* Analysis Metrics */}
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-3">
                  <div className="px-4 py-2 bg-white dark:bg-gray-800 rounded-full shadow-md border border-purple-200 dark:border-purple-700">
                    <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                      {cratData.scoreData.general_status}
                    </span>
                  </div>
                  <div className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full shadow-md">
                    <span className="text-sm font-bold">
                      Overall Score: {Math.round((cratData.scoreData.commercial.percentage + cratData.scoreData.financial.percentage + cratData.scoreData.operations.percentage + cratData.scoreData.legal.percentage) / 4)}%
                    </span>
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Analysis generated on {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>
            
            {/* Quick Score Overview */}
            <div className="mt-6 grid grid-cols-4 gap-4">
              {[
                { label: 'Commercial', score: cratData.scoreData.commercial.percentage, color: 'bg-blue-500' },
                { label: 'Financial', score: cratData.scoreData.financial.percentage, color: 'bg-green-500' },
                { label: 'Operations', score: cratData.scoreData.operations.percentage, color: 'bg-orange-500' },
                { label: 'Legal', score: cratData.scoreData.legal.percentage, color: 'bg-purple-500' }
              ].map((item, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{item.label}</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{item.score}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className={`${item.color} h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${item.score}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Analysis Panel */}
          <div className="bg-white dark:bg-boxdark rounded-2xl shadow-xl border border-gray-200 dark:border-strokedark overflow-hidden">
            <AIAnalysisPanel
              reportData={cratData.reportData}
              scoreData={cratData.scoreData}
              businessInfo={cratData.businessInfo}
              userDetails={userDetails}
              isAdminEvaluation={true}
              targetEntrepreneur={{
                name: business?.User?.name,
                business: business?.name,
                uuid: business?.User?.uuid
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Page;
