"use client";
import "../globals.css";
import "../data-tables-css.css";
import "../satoshi.css";
import { Toaster } from "react-hot-toast";
import { useEffect, useState } from "react";
import Loader from "@/components/common/Loader";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);
  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>
      <div><Toaster position="top-right"/></div>
      { children }
      
      </body>
    </html>
  );
}
