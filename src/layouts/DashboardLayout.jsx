import React, { createContext, useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Loader from "@/components/common/Loader";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { getUser, logout } from "@/utils/local_storage";
import { getMyInfo } from "@/controllers/user_controller";
import { getDashboardData } from "@/controllers/dashboard_controller";
import { createLog } from "@/controllers/log_controller";
import WhatsAppSupport from "@/components/support/WhatsAppSupport";

export const UserContext = createContext();

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [hideSidebar, setHideSidebar] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  useEffect(() => {
    // Only run on initial mount, not on every navigation
    if (userDetails) return; // Don't refetch if we already have user details

    if (getUser()) {
      getMyInfo()
        .then((data) => {
          if (data) {
            setUserDetails(data);
            createLog({ action: "Logged in to the system" });
            getDashboardData().then((ddata) => {
              setData(ddata);
              if (data.activated == 1) {
                if (data.role != "Enterprenuer") {
                  setTimeout(() => setLoading(false), 2000);
                } else {
                  if (data.Business && data.Business.status == "accepted") {
                    setTimeout(() => setLoading(false), 2000);
                  } else {
                    navigate("/auth/authorization");
                    setTimeout(() => setLoading(false), 2000);
                  }
                }
              } else {
                navigate("/auth/authorization");
                setTimeout(() => setLoading(false), 2000);
              }
            });
          } else {
            navigate("/auth/signin");
            setTimeout(() => setLoading(false), 2000);
          }
        })
        .catch(() => {
          // getMyInfo rejects when the stored session token is no longer
          // valid (expired, or signed against an old server secret). Without
          // this catch, the rejection was unhandled and setLoading(false)
          // never ran — the loader spun forever instead of returning to
          // sign-in.
          logout();
          navigate("/auth/signin");
          setLoading(false);
        });
    } else {
      navigate("/auth/signin");
      setTimeout(() => setLoading(false), 2000);
    }
  }, []); // Empty dependency array - only run on mount

  return (
    <div>
      <div>
        <Toaster position="top-right" />
      </div>
      <UserContext.Provider
        value={{
          userDetails,
          setUserDetails,
          data,
          hideSidebar,
          setHideSidebar,
          sidebarExpanded,
          setSidebarExpanded,
        }}
      >
        <div className="dark:bg-boxdark-2 dark:text-bodydark">
          {loading ? (
            <Loader height="h-screen" />
          ) : (
            <div className="flex h-screen overflow-hidden">
              {!hideSidebar && (
                <Sidebar
                  sidebarOpen={sidebarOpen}
                  setSidebarOpen={setSidebarOpen}
                  sidebarExpanded={sidebarExpanded}
                  setSidebarExpanded={setSidebarExpanded}
                />
              )}

              <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden transition-all duration-300">
                <Header
                  sidebarOpen={sidebarOpen}
                  setSidebarOpen={setSidebarOpen}
                  sidebarExpanded={sidebarExpanded}
                  setSidebarExpanded={setSidebarExpanded}
                />
                <main>
                  {/* 90% of the available width, uncapped, so wide tables
                      (milestone reporting) have room before they scroll. Full
                      width on mobile, where 5% gutters would only cost space. */}
                  <div className="mx-auto w-full p-4 md:w-[90%] md:p-6">
                    <Outlet />
                  </div>
                </main>
              </div>

              <WhatsAppSupport />
            </div>
          )}
        </div>
      </UserContext.Provider>
    </div>
  );
}
