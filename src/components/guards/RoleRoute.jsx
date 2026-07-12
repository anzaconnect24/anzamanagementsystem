import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { UserContext } from "@/layouts/DashboardLayout";
import Loader from "@/components/common/Loader";

// Restrict a route to specific roles. Any other role is redirected to the
// dashboard. Used to keep e.g. grant-management pages exclusive to the
// Finance Officer.
const RoleRoute = ({ allow = [], children }) => {
  const { userDetails } = useContext(UserContext);

  if (!userDetails) return <Loader />;

  if (!allow.includes(userDetails.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default RoleRoute;
