"use client";
import React, { useState, useEffect } from 'react';
import { analyzeCompleteReport, analyzeDomain, generateExecutiveSummary, testGeminiConnection } from '@/app/services/geminiAI';
import { generateAIReport, exportReportToPDF } from '@/app/services/aiReportService';
import toast from 'react-hot-toast';

const AIAnalysisPanel = ({ reportData, scoreData, businessInfo, userDetails, isAdminEvaluation = false, targetEntrepreneur = null }) => {
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('executive');
  const [domainAnalysis, setDomainAnalysis] = useState({});
  const [analysisType, setAnalysisType] = useState('complete'); // complete, executive, domain
  const [savedReport, setSavedReport] = useState(null);

  // Check if AI analysis should be available (ADMIN ONLY for entrepreneur evaluation)
  const canAccessAI = () => {
    console.log('🔍 Checking AI access for user:', userDetails);
    console.log('👤 User role:', userDetails?.role);
    console.log('🎯 Is admin evaluation:', isAdminEvaluation);
    console.log('👤 Target entrepreneur:', targetEntrepreneur?.name);
    
    if (!userDetails?.role) {
      console.log('❌ No user role found');
      return false;
    }
    
    // STRICT ADMIN-ONLY ACCESS
    const isAdmin = userDetails.role === 'Admin';
    
    if (!isAdmin) {
      console.log('❌ AI access denied: User is not an Admin');
      return false;
    }
    
    console.log('✅ AI access granted to Admin');
    return true;
  };
  
  const hasAIAccess = canAccessAI();

  useEffect(() => {
    // Auto-generate executive summary for admins only
    if (hasAIAccess && scoreData && Object.keys(scoreData).length > 0) {
      generateAIExecutiveSummary();
    }
  }, [scoreData, hasAIAccess]);

  const generateAIExecutiveSummary = async () => {
    try {
      setLoading(true);
      const summary = await generateExecutiveSummary(scoreData, scoreData.general_status);
      setAiAnalysis(prev => ({ ...prev, executiveSummary: summary }));
      toast.success('Executive summary generated successfully!');
    } catch (error) {
      console.error('Error generating executive summary:', error);
      
      if (error.message.includes('not properly initialized') || error.message.includes('API key')) {
        toast.error('❌ API key not configured. Please add your Gemini API key to .env.local and restart the server.', {
          duration: 8000,
        });
      } else {
        toast.error('Failed to generate AI summary. Please check your API configuration.');
      }
    } finally {
      setLoading(false);
    }
  };

  const generateCompleteAnalysis = async () => {
    if (!reportData || !scoreData) {
      toast.error('Report data not available for analysis');
      return;
    }

    try {
      setLoading(true);
      setAnalysisType('complete');
      
      console.log('🤖 Starting complete analysis generation...');
      console.log('📊 Input data validation:', {
        hasReportData: !!reportData,
        hasScoreData: !!scoreData,
        hasBusinessInfo: !!businessInfo,
        hasUserDetails: !!userDetails,
        reportDataKeys: reportData ? Object.keys(reportData) : [],
        scoreDataKeys: scoreData ? Object.keys(scoreData) : [],
        windowAvailable: typeof window !== 'undefined'
      });
      
      // First test basic AI connection
      console.log('🧪 Testing AI connection first...');
      const connectionTest = await testGeminiConnection();
      console.log('🔍 Connection test result:', connectionTest);
      
      if (!connectionTest.success) {
        throw new Error(`AI Connection Failed: ${connectionTest.error}`);
      }
      
      // Generate and save complete report
      console.log('✅ AI connection verified, generating report...');
      const completeReport = await generateAIReport(reportData, scoreData, businessInfo, userDetails);
      
      console.log('✅ Complete report generated:', completeReport);
      setAiAnalysis(completeReport.aiAnalysis);
      setSavedReport(completeReport);
      
      toast.success('Complete AI analysis generated and saved successfully!');
    } catch (error) {
      console.error('❌ Error generating complete analysis:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        constructor: error.constructor.name
      });
      
      // Show the actual error message for debugging
      const errorMessage = `AI Analysis Failed: ${error.message}`;
      console.error('❌ Final error message:', errorMessage);
      
      toast.error(errorMessage, {
        duration: 10000, // Show for 10 seconds
      });
      
      // Also show alert for debugging
      alert(`Debug Error: ${error.message}\n\nCheck console for full details.`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!savedReport) {
      toast.error('No saved report available for download');
      return;
    }

    try {
      const fileName = exportReportToPDF(savedReport);
      toast.success(`PDF downloaded: ${fileName}`);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF');
    }
  };



  const testAPIConnection = async () => {
    try {
      setLoading(true);
      const result = await testGeminiConnection();
      
      if (result.success) {
        toast.success('✅ Gemini AI connection successful!');
        console.log('Connection test result:', result.message);
      } else {
        toast.error(`❌ Connection failed: ${result.error}`);
        console.error('API Connection Error:', result.error);
        
        // Show specific instructions for API key issues
        if (result.error.includes('API key') || result.error.includes('not configured')) {
          toast.error('Please configure your Gemini API key in .env.local file', {
            duration: 6000,
          });
        }
      }
    } catch (error) {
      toast.error(`❌ Connection test failed: ${error.message}`);
      console.error('Connection test error:', error);
      
      // Show helpful error message for API key issues
      if (error.message.includes('not properly initialized')) {
        toast.error('API key not configured. Check .env.local file and restart server.', {
          duration: 6000,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const generateDomainAnalysis = async (domain) => {
    if (!reportData?.[domain] || !scoreData?.[domain]) {
      toast.error(`${domain} data not available for analysis`);
      return;
    }

    try {
      setLoading(true);
      
      const analysis = await analyzeDomain(domain, reportData[domain], scoreData[domain]);
      setDomainAnalysis(prev => ({ ...prev, [domain]: analysis }));
      toast.success(`${domain} domain analysis generated!`);
    } catch (error) {
      console.error(`Error generating ${domain} analysis:`, error);
      toast.error(`Failed to generate ${domain} analysis`);
    } finally {
      setLoading(false);
    }
  };

  if (!hasAIAccess) {
    return (
      <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="mb-3">
              <svg className="w-12 h-12 text-red-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">🔒 Admin Access Required</h3>
            <p className="text-gray-500 dark:text-gray-400">AI Analysis for CRAT evaluation is restricted to Administrators only.</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              {isAdminEvaluation ? 
                `Evaluating: ${targetEntrepreneur?.name || 'Entrepreneur'}` : 
                'This feature helps admins evaluate entrepreneur readiness.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      {/* Header */}
      <div className="border-b border-stroke py-4 px-6 dark:border-strokedark">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-black dark:text-white">
              🤖 AI Analysis & Insights
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Powered by Gemini AI - Expert analysis of your CRAT assessment
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={generateCompleteAnalysis}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/80 disabled:bg-gray-400 transition-colors"
            >
              {loading ? (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              )}
              Generate Complete Analysis
            </button>
            
            {savedReport && (
              <>
                <button
                  onClick={handleDownloadPDF}
                  className="inline-flex items-center px-3 py-2 bg-success text-white rounded-md hover:bg-success/80 transition-colors"
                  title="Download PDF Report"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  PDF
                </button>

              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-stroke dark:border-strokedark">
        <nav className="flex space-x-4 px-6 overflow-x-auto" aria-label="Tabs">
          {[
            { id: 'executive', name: 'Executive Summary', icon: '📊' },
            { id: 'recommendations', name: 'Recommendations', icon: '💡' },
            { id: 'domains', name: 'Domain Analysis', icon: '🔍' },
            { id: 'risks', name: 'Risk Assessment', icon: '⚠️' },
            { id: 'growth', name: 'Growth Potential', icon: '📈' },
            { id: 'investment', name: 'Investment Decision', icon: '💰' },
            { id: 'scenarios', name: 'Scenario Analysis', icon: '🎯' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <svg className="animate-spin h-8 w-8 text-primary mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-600 dark:text-gray-400">AI is analyzing your report...</p>
              <p className="text-sm text-gray-500 mt-1">This may take a few moments</p>
            </div>
          </div>
        )}

        {/* Executive Summary Tab */}
        {activeTab === 'executive' && !loading && (
          <div className="space-y-8">
            {aiAnalysis?.executiveSummary || aiAnalysis?.executiveSummary ? (
              <div className="space-y-6">
                {/* Professional Header */}
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-8 rounded-xl shadow-2xl">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Executive Investment Briefing</h2>
                      <p className="text-slate-300">Capital Readiness Assessment & Strategic Analysis</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-blue-300">{scoreData?.commercial?.percentage || 0}%</div>
                      <div className="text-xs text-slate-300">Commercial</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-green-300">{scoreData?.financial?.percentage || 0}%</div>
                      <div className="text-xs text-slate-300">Financial</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-yellow-300">{scoreData?.operations?.percentage || 0}%</div>
                      <div className="text-xs text-slate-300">Operations</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-purple-300">{scoreData?.legal?.percentage || 0}%</div>
                      <div className="text-xs text-slate-300">Legal</div>
                    </div>
                  </div>
                </div>

                {/* Analysis Content */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      AI-Powered Investment Analysis
                    </h3>
                    <p className="text-blue-100 text-sm mt-1">Generated by advanced AI with African market expertise</p>
                  </div>
                  
                  <div className="p-8">
                    <div className="prose prose-lg dark:prose-invert max-w-none">
                      <div className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap font-serif text-lg">
                        {aiAnalysis?.executiveSummary?.summary || aiAnalysis?.executiveSummary}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Call to Action */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700 rounded-xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">Ready for Complete Analysis?</h4>
                      <p className="text-green-700 dark:text-green-300 mb-4">Generate a comprehensive investment report with detailed domain analysis, risk assessment, and strategic recommendations.</p>
                      <button
                        onClick={generateCompleteAnalysis}
                        disabled={loading}
                        className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
                      >
                        Generate Complete Investment Report
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="mb-8">
                  <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">AI Investment Analysis</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">Generate a professional executive briefing powered by advanced AI analysis of your business assessment.</p>
                </div>
                <button
                  onClick={generateAIExecutiveSummary}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold text-lg"
                >
                  Generate Executive Briefing
                </button>
              </div>
            )}
          </div>
        )}

        {/* Recommendations Tab */}
        {activeTab === 'recommendations' && !loading && (
          <div className="space-y-4">
            {aiAnalysis?.recommendations && aiAnalysis.recommendations.length > 0 ? (
              <div className="space-y-4">
                {aiAnalysis.recommendations.map((rec, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-l-4 ${
                      rec.priority === 'high'
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                        : rec.priority === 'medium'
                        ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                        : 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              rec.priority === 'high'
                                ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                                : rec.priority === 'medium'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                                : 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                            }`}
                          >
                            {rec.priority?.toUpperCase() || 'MEDIUM'} PRIORITY
                          </span>
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-full">
                            {rec.category?.toUpperCase() || 'GENERAL'}
                          </span>
                        </div>
                        <p className="text-gray-800 dark:text-gray-200">{rec.text}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">Generate complete analysis to see detailed recommendations</p>
              </div>
            )}
          </div>
        )}

        {/* Domain Analysis Tab */}
        {activeTab === 'domains' && !loading && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['commercial', 'financial', 'operations', 'legal'].map((domain) => (
                <div key={domain} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200 capitalize">
                      {domain} Domain
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {scoreData?.[domain]?.percentage || 0}%
                      </span>
                      <button
                        onClick={() => generateDomainAnalysis(domain)}
                        className="px-3 py-1 text-xs bg-primary text-white rounded hover:bg-primary/80 transition-colors"
                      >
                        Analyze
                      </button>
                    </div>
                  </div>
                  
                  {domainAnalysis[domain] ? (
                    <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                      {domainAnalysis[domain].analysis.substring(0, 200)}...
                      <button className="text-primary hover:underline ml-2">Read More</button>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Click &ldquo;Analyze&rdquo; to generate AI insights for this domain
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Risk Assessment Tab */}
        {activeTab === 'risks' && !loading && (
          <div className="space-y-6">
            {aiAnalysis?.predictions?.riskAssessment ? (
              <div className="space-y-6">
                {/* Risk Overview */}
                <div className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 p-6 rounded-xl border border-red-200 dark:border-red-700">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 15c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-red-800 dark:text-red-200">Risk Assessment</h3>
                      <p className="text-red-600 dark:text-red-400">Overall Risk Score: {aiAnalysis.predictions.riskAssessment.overallRiskScore}/100</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Risk Level</div>
                      <div className={`text-lg font-bold ${
                        aiAnalysis.predictions.riskAssessment.riskLevel === 'High' ? 'text-red-600' :
                        aiAnalysis.predictions.riskAssessment.riskLevel === 'Medium' ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {aiAnalysis.predictions.riskAssessment.riskLevel}
                      </div>
                    </div>
                    <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600 dark:text-gray-400">6 Month Trend</div>
                      <div className="text-lg font-bold text-gray-800 dark:text-gray-200">
                        {aiAnalysis.predictions.riskAssessment.riskTrends?.next6Months || 'Stable'}
                      </div>
                    </div>
                    <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600 dark:text-gray-400">24 Month Outlook</div>
                      <div className="text-lg font-bold text-gray-800 dark:text-gray-200">
                        {aiAnalysis.predictions.riskAssessment.riskTrends?.next24Months || 'Decreasing'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Key Risks */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Key Risk Factors</h4>
                  {aiAnalysis.predictions.riskAssessment.keyRisks?.map((risk, index) => (
                    <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                            risk.impact === 'High' ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100' :
                            risk.impact === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100' :
                            'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                          }`}>
                            {risk.impact} Impact
                          </span>
                          <span className="px-3 py-1 text-xs bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-full">
                            {risk.category}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{risk.timeframe}</span>
                      </div>
                      <h5 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">{risk.risk}</h5>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                        <strong>Probability:</strong> {risk.probability}
                      </p>
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          <strong>Mitigation Strategy:</strong> {risk.mitigation}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : aiAnalysis?.riskAssessment ? (
              <div className="prose dark:prose-invert max-w-none">
                <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg border-l-4 border-red-500">
                  <div className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">
                    {aiAnalysis.riskAssessment}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">Generate complete analysis to see detailed risk assessment</p>
              </div>
            )}
          </div>
        )}

        {/* Growth Potential Tab */}
        {activeTab === 'growth' && !loading && (
          <div className="space-y-6">
            {aiAnalysis?.predictions?.growthPotential ? (
              <div className="space-y-6">
                {/* Growth Overview */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-xl border border-green-200 dark:border-green-700">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-green-800 dark:text-green-200">Growth Potential</h3>
                      <p className="text-green-600 dark:text-green-400">Growth Score: {aiAnalysis.predictions.growthPotential.growthScore}/100</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Growth Category</div>
                      <div className="text-lg font-bold text-green-600 dark:text-green-400">
                        {aiAnalysis.predictions.growthPotential.growthCategory}
                      </div>
                    </div>
                    <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Market Growth Rate</div>
                      <div className="text-lg font-bold text-gray-800 dark:text-gray-200">
                        {aiAnalysis.predictions.growthPotential.marketExpansion?.marketGrowthRate || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Revenue Projections */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Revenue Projections (USD)</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-2 text-gray-600 dark:text-gray-400">Timeframe</th>
                          <th className="text-right py-2 text-gray-600 dark:text-gray-400">Conservative</th>
                          <th className="text-right py-2 text-gray-600 dark:text-gray-400">Realistic</th>
                          <th className="text-right py-2 text-gray-600 dark:text-gray-400">Optimistic</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(aiAnalysis.predictions.growthPotential.revenueProjections || {}).map(([year, projections]) => (
                          <tr key={year} className="border-b border-gray-100 dark:border-gray-700">
                            <td className="py-3 font-medium text-gray-800 dark:text-gray-200 capitalize">{year}</td>
                            <td className="py-3 text-right text-gray-600 dark:text-gray-400">
                              ${projections.conservative?.toLocaleString() || 'N/A'}
                            </td>
                            <td className="py-3 text-right text-green-600 dark:text-green-400 font-medium">
                              ${projections.realistic?.toLocaleString() || 'N/A'}
                            </td>
                            <td className="py-3 text-right text-blue-600 dark:text-blue-400">
                              ${projections.optimistic?.toLocaleString() || 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Market Analysis */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Market Expansion Analysis</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Current Market Size</span>
                          <span className="font-medium text-gray-800 dark:text-gray-200">
                            ${aiAnalysis.predictions.growthPotential.marketExpansion?.currentMarketSize?.toLocaleString() || 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Addressable Market</span>
                          <span className="font-medium text-gray-800 dark:text-gray-200">
                            ${aiAnalysis.predictions.growthPotential.marketExpansion?.addressableMarket?.toLocaleString() || 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Market Share Potential</span>
                          <span className="font-medium text-gray-800 dark:text-gray-200">
                            {aiAnalysis.predictions.growthPotential.marketExpansion?.marketSharePotential || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-3">Scaling Factors</h5>
                      <div className="space-y-2">
                        {aiAnalysis.predictions.growthPotential.scalingFactors?.map((factor, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${
                              factor.impact === 'High' ? 'bg-green-500' :
                              factor.impact === 'Medium' ? 'bg-yellow-500' : 'bg-gray-400'
                            }`}></span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">{factor.factor}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">Generate complete analysis to see growth potential data</p>
              </div>
            )}
          </div>
        )}

        {/* Investment Decision Tab */}
        {activeTab === 'investment' && !loading && (
          <div className="space-y-6">
            {aiAnalysis?.predictions?.investmentDecision ? (
              <div className="space-y-6">
                {/* Investment Overview */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-700">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-blue-800 dark:text-blue-200">Investment Decision</h3>
                      <p className="text-blue-600 dark:text-blue-400">Readiness Score: {aiAnalysis.predictions.investmentDecision.investmentReadinessScore}/100</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Recommendation</div>
                      <div className={`text-lg font-bold ${
                        aiAnalysis.predictions.investmentDecision.recommendation === 'Invest Now' ? 'text-green-600' :
                        aiAnalysis.predictions.investmentDecision.recommendation === 'Conditional Investment' ? 'text-yellow-600' :
                        aiAnalysis.predictions.investmentDecision.recommendation === 'Monitor' ? 'text-blue-600' : 'text-red-600'
                      }`}>
                        {aiAnalysis.predictions.investmentDecision.recommendation}
                      </div>
                    </div>
                    <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Exit Strategy</div>
                      <div className="text-lg font-bold text-gray-800 dark:text-gray-200">
                        {aiAnalysis.predictions.investmentDecision.exitStrategy?.primaryOption || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Investment Amounts */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Investment Framework</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Minimum Investment</div>
                      <div className="text-xl font-bold text-gray-800 dark:text-gray-200">
                        ${aiAnalysis.predictions.investmentDecision.investmentAmount?.minimum?.toLocaleString() || 'N/A'}
                      </div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-sm text-blue-600 dark:text-blue-400">Optimal Investment</div>
                      <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        ${aiAnalysis.predictions.investmentDecision.investmentAmount?.optimal?.toLocaleString() || 'N/A'}
                      </div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Maximum Investment</div>
                      <div className="text-xl font-bold text-gray-800 dark:text-gray-200">
                        ${aiAnalysis.predictions.investmentDecision.investmentAmount?.maximum?.toLocaleString() || 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* Expected Returns */}
                  <div className="mb-6">
                    <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-3">Expected Returns</h5>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-sm text-gray-600 dark:text-gray-400">3 Years</div>
                        <div className="text-lg font-bold text-green-600 dark:text-green-400">
                          {aiAnalysis.predictions.investmentDecision.expectedReturns?.year3 || 'N/A'}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-600 dark:text-gray-400">5 Years</div>
                        <div className="text-lg font-bold text-green-600 dark:text-green-400">
                          {aiAnalysis.predictions.investmentDecision.expectedReturns?.year5 || 'N/A'}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-600 dark:text-gray-400">7 Years</div>
                        <div className="text-lg font-bold text-green-600 dark:text-green-400">
                          {aiAnalysis.predictions.investmentDecision.expectedReturns?.year7 || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Exit Strategy Details */}
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                    <h5 className="font-medium text-purple-800 dark:text-purple-200 mb-2">Exit Strategy</h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Strategy: </span>
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          {aiAnalysis.predictions.investmentDecision.exitStrategy?.primaryOption || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Timeline: </span>
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          {aiAnalysis.predictions.investmentDecision.exitStrategy?.timeline || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Expected Multiple: </span>
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          {aiAnalysis.predictions.investmentDecision.exitStrategy?.expectedMultiple || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Investment Conditions */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Investment Conditions</h4>
                  <div className="space-y-3">
                    {aiAnalysis.predictions.investmentDecision.conditions?.map((condition, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          condition.priority === 'Critical' ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100' :
                          condition.priority === 'High' ? 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100' :
                          condition.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100' :
                          'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                        }`}>
                          {condition.priority}
                        </span>
                        <div className="flex-1">
                          <p className="text-gray-800 dark:text-gray-200 font-medium">{condition.condition}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Timeline: {condition.timeline}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">Generate complete analysis to see investment decision framework</p>
              </div>
            )}
          </div>
        )}

        {/* Scenario Analysis Tab */}
        {activeTab === 'scenarios' && !loading && (
          <div className="space-y-6">
            {aiAnalysis?.predictions?.scenarioAnalysis ? (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">Scenario Analysis</h3>
                  <p className="text-gray-600 dark:text-gray-400">Explore different potential outcomes for this investment opportunity</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Best Case */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-xl border border-green-200 dark:border-green-700">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-bold text-green-800 dark:text-green-200">Best Case</h4>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          {aiAnalysis.predictions.scenarioAnalysis.bestCase?.probability || 'N/A'} Probability
                        </p>
                      </div>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 mb-4 text-sm">
                      {aiAnalysis.predictions.scenarioAnalysis.bestCase?.description || 'No description available'}
                    </p>
                    <div>
                      <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Key Drivers:</h5>
                      <ul className="space-y-1">
                        {aiAnalysis.predictions.scenarioAnalysis.bestCase?.keyDrivers?.map((driver, index) => (
                          <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                            {driver}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Most Likely */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-700">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-bold text-blue-800 dark:text-blue-200">Most Likely</h4>
                        <p className="text-sm text-blue-600 dark:text-blue-400">
                          {aiAnalysis.predictions.scenarioAnalysis.mostLikely?.probability || 'N/A'} Probability
                        </p>
                      </div>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 mb-4 text-sm">
                      {aiAnalysis.predictions.scenarioAnalysis.mostLikely?.description || 'No description available'}
                    </p>
                    <div>
                      <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Key Drivers:</h5>
                      <ul className="space-y-1">
                        {aiAnalysis.predictions.scenarioAnalysis.mostLikely?.keyDrivers?.map((driver, index) => (
                          <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                            {driver}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Worst Case */}
                  <div className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 p-6 rounded-xl border border-red-200 dark:border-red-700">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-bold text-red-800 dark:text-red-200">Worst Case</h4>
                        <p className="text-sm text-red-600 dark:text-red-400">
                          {aiAnalysis.predictions.scenarioAnalysis.worstCase?.probability || 'N/A'} Probability
                        </p>
                      </div>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 mb-4 text-sm">
                      {aiAnalysis.predictions.scenarioAnalysis.worstCase?.description || 'No description available'}
                    </p>
                    <div>
                      <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Key Drivers:</h5>
                      <ul className="space-y-1">
                        {aiAnalysis.predictions.scenarioAnalysis.worstCase?.keyDrivers?.map((driver, index) => (
                          <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                            {driver}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Key Metrics Dashboard */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Key Performance Metrics</h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {Object.entries(aiAnalysis.predictions.keyMetrics || {}).map(([metric, score]) => (
                      <div key={metric} className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{score}/100</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                          {metric.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">Generate complete analysis to see scenario analysis</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      {aiAnalysis && (
        <div className="border-t border-stroke px-6 py-4 dark:border-strokedark">
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>AI analysis generated using Gemini AI</span>
            </div>
            <div>
              Last updated: {new Date().toLocaleString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAnalysisPanel; 