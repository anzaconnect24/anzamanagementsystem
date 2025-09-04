import Dashboard from "@/components/Dashboard/dashboard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Anza Management System",
  description: "This is Anza management System for daily activities",
};

export default function Home() {
  return (
    <>
      <Dashboard />
    </>
  );
}
