"use client";
import "../globals.css";
import "../data-tables-css.css";
import "../satoshi.css";
import { Toaster } from "react-hot-toast";
import { useEffect, useState } from "react";
import Loader from "@/components/common/Loader";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { getUser } from "../utils/local_storage";
import { getMyInfo } from "../controllers/user_controller";
import { useRouter } from "next/navigation";
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [loading, setLoading] = useState<boolean>(true);
  const user = getUser()
const router  = useRouter()
  useEffect(() => {
    if(user){
      getMyInfo().then((data)=>{
       if(data.activated){
        router.push("/")
        setTimeout(() => setLoading(false), 4000);
       }
       else{
        router.push("/authorizationPage")
        setTimeout(() => setLoading(false), 4000);
       }
      })
    }
    else{
      router.push("/signin")
      setTimeout(() => setLoading(false), 4000);
    }
   }, []);
  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>
      <div><Toaster position="top-right"/></div>
      <div className="dark:bg-boxdark-2 dark:text-bodydark">
          {loading ? (
            <Loader />
          ) : (
              <div className="flex h-screen overflow-hidden">
                <Sidebar
                  sidebarOpen={sidebarOpen}
                  setSidebarOpen={setSidebarOpen}
                />
                <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
                  <Header
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
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
      
      </body>
    </html>
  );
}
