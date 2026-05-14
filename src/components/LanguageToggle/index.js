"use client";

import React from "react";
import { useTranslation } from "../../locales";

const LanguageToggle = () => {
  const { switchLanguage, isSwahili, isEnglish } = useTranslation();

  const handleToggle = (newLanguage) => {
    switchLanguage(newLanguage);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="relative flex h-11 w-28 items-center rounded-full border border-stroke bg-white p-1 shadow-lg dark:border-strokedark dark:bg-boxdark">
        <div
          className={`absolute left-1 top-1 h-9 w-[52px] rounded-full bg-blue-600 shadow transition-transform duration-300 ease-in-out ${
            isSwahili ? "translate-x-[52px]" : "translate-x-0"
          }`}
        />

        <button
          type="button"
          onClick={() => handleToggle("en")}
          className={`relative z-10 flex h-9 w-[52px] items-center justify-center rounded-full text-sm font-semibold transition-colors duration-300 ${
            isEnglish ? "text-white" : "text-gray-600 dark:text-gray-300"
          }`}
          aria-label="Switch to English"
        >
          En
        </button>

        <button
          type="button"
          onClick={() => handleToggle("sw")}
          className={`relative z-10 flex h-9 w-[52px] items-center justify-center rounded-full text-sm font-semibold transition-colors duration-300 ${
            isSwahili ? "text-white" : "text-gray-600 dark:text-gray-300"
          }`}
          aria-label="Switch to Swahili"
        >
          Sw
        </button>
      </div>
    </div>
  );
};

export default LanguageToggle;