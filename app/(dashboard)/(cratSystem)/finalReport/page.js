"use client";
import React from "react";
import { BsDownload } from "react-icons/bs";

export default function FinalReportPreview() {
  const handleDownloadReport = () => {
    // Create a simple PDF report content
    const reportContent = `
      CAPITAL READINESS ASSESSMENT TOOL (CRAT) REPORT
      
      Executive Summary:
      This report provides a comprehensive analysis of your business's investment readiness.
      
      Domain Scores:
      - Commercial Domain: 75%
      - Financial Domain: 68%
      - Operations Domain: 72%
      - Legal Domain: 80%
      
      Overall Score: 73.75%
      
      Recommendations:
      1. Strengthen financial planning and cash flow management
      2. Enhance operational efficiency and scalability
      3. Continue building strong legal foundations
      4. Focus on market expansion and customer acquisition
      
      Investment Readiness: MODERATE
      Next Steps: Implement recommended improvements and reassess in 3-6 months.
    `;

    // Create blob and download
    const blob = new Blob([reportContent], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'CRAT_Final_Report.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center py-12 px-4">
      <div className="max-w-2xl w-full mx-auto text-center">
        <div className="bg-white dark:bg-boxdark rounded-2xl shadow-xl p-8">
          <div className="mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <BsDownload className="text-3xl text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
              Download Final Report
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              Get your comprehensive Capital Readiness Assessment Tool (CRAT) report in PDF format.
            </p>
          </div>

          <button
            onClick={handleDownloadReport}
            className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <BsDownload className="text-xl" />
            Download PDF Report
          </button>

          <div className="mt-8 text-sm text-gray-500 dark:text-gray-400">
            <p>Report includes: Executive Summary, Domain Analysis, Recommendations, and Investment Guidance</p>
          </div>
        </div>
      </div>
    </div>
  );
} 