"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { en } from "./en";
import { sw } from "./sw";

// Create translation context
const TranslationContext = createContext();

// Translation provider component
export const TranslationProvider = ({ children }) => {
  const [language, setLanguage] = useState("en");
  const [translations, setTranslations] = useState(en);

  // Load saved language preference on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLanguage = localStorage.getItem("preferred-language");
      if (savedLanguage && (savedLanguage === "en" || savedLanguage === "sw")) {
        setLanguage(savedLanguage);
        setTranslations(savedLanguage === "en" ? en : sw);
      }
    }
  }, []);

  // Switch language function
  const switchLanguage = (newLanguage) => {
    if (newLanguage === "en" || newLanguage === "sw") {
      setLanguage(newLanguage);
      setTranslations(newLanguage === "en" ? en : sw);

      // Save to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("preferred-language", newLanguage);
      }
    }
  };

  // Translation function - supports nested keys like 'common.dashboard' and simple variable interpolation via {{var}}
  const t = (key, fallback = "", vars = {}) => {
    const keys = key.split(".");
    let value = translations;

    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) break;
    }

    let result = value || fallback || key;

    if (typeof result === "string" && vars && Object.keys(vars).length > 0) {
      result = result.replace(/{{(.*?)}}/g, (match, p1) => {
        const trimmed = p1.trim();
        return Object.prototype.hasOwnProperty.call(vars, trimmed)
          ? vars[trimmed]
          : match;
      });
    }

    return result;
  };

  const value = {
    language,
    translations,
    switchLanguage,
    t,
    isSwahili: language === "sw",
    isEnglish: language === "en",
  };

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
};

// Custom hook to use translation
export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error("useTranslation must be used within a TranslationProvider");
  }
  return context;
};

// Higher-order component for class components
export const withTranslation = (Component) => {
  return (props) => {
    const translation = useTranslation();
    return <Component {...props} {...translation} />;
  };
};
