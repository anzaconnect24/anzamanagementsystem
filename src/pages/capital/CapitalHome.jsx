"use client";

import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { UserContext } from "@/layouts/DashboardLayout";
import { LoadingBlock } from "@/components/capital/CapitalUI";
import CapitalRoute from "@/components/capital/CapitalRoute";
import CapitalDashboard from "@/pages/capital/CapitalDashboard";
import MyCapital from "@/pages/capital/MyCapital";

// /dashboard/capital is one address for everyone a capital notification is
// sent to: an enterprise lands on its own capital workspace, a capital
// provider on its deals, and staff on the facilitation dashboard.
const CapitalHome = () => {
  const { userDetails } = useContext(UserContext);
  const role = userDetails?.role;

  if (!role) return <LoadingBlock />;
  if (role === "Enterprenuer") return <MyCapital />;
  if (role === "Investor") return <Navigate to="/dashboard/capital-deals" replace />;
  if (role === "Mentor") return <Navigate to="/dashboard" replace />;

  return (
    <CapitalRoute need={["capital.dashboard.view"]}>
      <CapitalDashboard />
    </CapitalRoute>
  );
};

export default CapitalHome;
