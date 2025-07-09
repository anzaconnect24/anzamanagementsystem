"use client";
import React from "react";

const aiSections = [
  {
    icon: "📊",
    title: "Executive Summary",
    desc: "A concise overview of your business's investment readiness and key findings.",
  },
  {
    icon: "🎯",
    title: "Investment Thesis",
    desc: "Strategic analysis of your business opportunity in the current market.",
  },
  {
    icon: "🔍",
    title: "Domain Analysis",
    desc: "Deep dive into Commercial, Financial, Operations, and Legal domains.",
  },
  {
    icon: "💡",
    title: "Recommendations",
    desc: "Actionable, AI-driven steps to improve your investment readiness.",
  },
  {
    icon: "⚠️",
    title: "Risk Assessment",
    desc: "Identification of key risks and mitigation strategies.",
  },
  {
    icon: "🚀",
    title: "Growth Potential",
    desc: "Projection of your business's future growth and market opportunities.",
  },
  {
    icon: "📝",
    title: "Investment Decision",
    desc: "Clear, data-driven investment guidance and next steps.",
  },
];

export default function FinalReportPreview() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center py-12 px-4">
      <div className="max-w-3xl w-full mx-auto">
        <div className="text-center mb-10">
          <span className="inline-block bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-semibold px-4 py-1 rounded-full mb-4 shadow">
            Coming Soon: AI-Powered Report
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-3">
            Final CRAT Report Preview
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Here’s what you’ll get from your upcoming AI-powered investment report:
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {aiSections.map((section) => (
            <div
              key={section.title}
              className="bg-white dark:bg-boxdark rounded-xl shadow-lg p-6 flex flex-col items-start hover:shadow-2xl transition-shadow duration-200"
            >
              <div className="text-3xl mb-3">{section.icon}</div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                {section.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">{section.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <span className="inline-block bg-gradient-to-r from-green-400 to-blue-500 text-white text-xs font-semibold px-4 py-1 rounded-full shadow">
            Powered by AI
          </span>
        </div>
      </div>
    </div>
  );
} 