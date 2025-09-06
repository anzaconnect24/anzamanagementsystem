"use client";
import React from "react";
import { TranslationProvider } from "@/app/locales";
import LanguageToggle from "@/components/LanguageToggle";

export default function Providers({ children }) {
  return (
    <TranslationProvider>
      {children}
      <LanguageToggle />
    </TranslationProvider>
  );
}
