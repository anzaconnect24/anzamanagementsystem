"use client";
import "../globals.css";
import "../data-tables-css.css";
import "../satoshi.css";
import { Toaster } from "react-hot-toast";
import { createContext, useEffect, useState } from "react";
import Loader from "@/components/common/Loader";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { getUser } from "../utils/local_storage";
import { getMyInfo } from "../controllers/user_controller";
import { usePathname, useRouter } from "next/navigation";
import { getDashboardData } from "../controllers/dashboard_controller";
import { createLog } from "../controllers/log_controller";
export const UserContext = createContext();
export default function RootLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [hideSidebar, setHideSidebar] = useState(true);
  const pathname = usePathname();
  // Get search params from window.location if available (client-side only)
  const search = typeof window !== "undefined" ? window.location.search : "";
  const router = useRouter();
  const [data, setData] = useState(null);

  const [loading, setLoading] = useState(true);
  useEffect(() => {
    // console.log(getUser().ACCESS_TOKEN)
    setUserDetails(null);
    if (getUser()) {
      getMyInfo().then((data) => {
        if (data) {
          setUserDetails(data);
          createLog({ action: "Logged in to the system" });
          getDashboardData().then((ddata) => {
            setData(ddata);
            if (data.activated == 1) {
              if (data.role != "Enterprenuer") {
                router.push(pathname + search);
                setTimeout(() => setLoading(false), 4000);
              } else {
                if (data.Business.status == "accepted") {
                  router.push(pathname + search);
                  setTimeout(() => setLoading(false), 4000);
                } else {
                  router.push("/authorizationPage");
                  setTimeout(() => setLoading(false), 4000);
                }
              }
            } else {
              // alert(`${data.email} not activated`)
              router.push("/authorizationPage");
              setTimeout(() => setLoading(false), 4000);
            }
          });
        } else {
          router.push("/signin");
          setTimeout(() => setLoading(false), 4000);
        }
      });
    } else {
      router.push("/signin");
      setTimeout(() => setLoading(false), 4000);
    }
  }, []);

  useEffect(() => {
    if (pathname.includes("/slides/") && !pathname.includes("add")) {
      setHideSidebar(true);
    } else {
      setHideSidebar(false);
    }
  }, [pathname]);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  return (
    <>
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
            <Loader height={"h-screen"} />
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

              <div
                className={`relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden transition-all duration-300 `}
              >
                <Header
                  sidebarOpen={sidebarOpen}
                  setSidebarOpen={setSidebarOpen}
                  sidebarExpanded={sidebarExpanded}
                  setSidebarExpanded={setSidebarExpanded}
                />
                <main>
                  <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
                    {children}
                  </div>
                </main>
              </div>
            </div>
          )}
        </div>
      </UserContext.Provider>
    </>
  );
}
