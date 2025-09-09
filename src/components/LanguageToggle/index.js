"use client";
import React, { useState } from "react";
import { useTranslation } from "@/locales";

const LanguageToggle = () => {
  const { language, switchLanguage, isSwahili, isEnglish } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const toggleLanguage = (newLanguage) => {
    switchLanguage(newLanguage);
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="relative">
        {/* Toggle Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg shadow-lg hover:bg-primary/90 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-label="Change Language"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
            />
          </svg>
          <span className="font-medium text-sm">{isEnglish ? "EN" : "SW"}</span>
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute bottom-full right-0 mb-2 bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-lg shadow-lg overflow-hidden min-w-[140px]">
            <button
              onClick={() => toggleLanguage("en")}
              className={`w-full px-4 py-3 text-left text-sm hover:bg-gray-50 dark:hover:bg-boxdark-2 transition-colors duration-150 flex items-center gap-3 ${
                isEnglish
                  ? "bg-primary/10 text-primary dark:bg-primary/20"
                  : "text-gray-700 dark:text-gray-200"
              }`}
            >
              <div className="w-6 h-4 rounded-sm overflow-hidden flex-shrink-0">
                <div className="w-full h-full bg-gradient-to-b from-red-500 via-white to-red-500 flex items-center justify-center">
                  <span className="text-xs font-bold text-red-600">🇺🇸</span>
                </div>
              </div>
              <span className="font-medium">English</span>
              {isEnglish && (
                <svg
                  className="w-4 h-4 ml-auto"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
            <button
              onClick={() => toggleLanguage("sw")}
              className={`w-full px-4 py-3 text-left text-sm hover:bg-gray-50 dark:hover:bg-boxdark-2 transition-colors duration-150 flex items-center gap-3 ${
                isSwahili
                  ? "bg-primary/10 text-primary dark:bg-primary/20"
                  : "text-gray-700 dark:text-gray-200"
              }`}
            >
              <div className="w-6 h-4 rounded-sm overflow-hidden flex-shrink-0">
                <div className="w-full h-full bg-gradient-to-b from-green-500 via-black to-blue-500 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">🇹🇿</span>
                </div>
              </div>
              <span className="font-medium">Kiswahili</span>
              {isSwahili && (
                <svg
                  className="w-4 h-4 ml-auto"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[-1]"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default LanguageToggle;
