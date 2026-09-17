import React, { useContext } from "react";
import DashboardComponent from "@/components/Dashboard/dashboard";
import { UserContext } from "@/layouts/DashboardLayout";
import CapitalHome from "@/pages/capital/CapitalHome";

export default function Dashboard() {
  const { userDetails } = useContext(UserContext);

  // A Capital Facilitation Manager's day starts from the capital dashboard.
  if (userDetails?.role === "CFM") return <CapitalHome />;

  return <DashboardComponent />;
}
