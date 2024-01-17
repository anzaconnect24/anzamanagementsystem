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
export const UserContext = createContext();
export default function RootLayout({
  children,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);


  const [userDetails, setUserDetails] = useState(null);
 const pathname = usePathname()
const router  = useRouter()
const [data, setData] = useState(null);


  const [loading, setLoading] = useState(true);
  useEffect(() => {
    // console.log(getUser().ACCESS_TOKEN)
    setUserDetails(null)
    if(getUser()){
      getMyInfo().then((data)=>{
      if(data){
        setUserDetails(data)
        getDashboardData().then((data)=>setData(data))
        if(data.activated == 1){
         if(data.role != "Enterprenuer"){
           router.push(pathname)
           setTimeout(() => setLoading(false), 4000);
         }
         else{
        
           if(data.Business.status == "accepted"){
             router.push(pathname)
             setTimeout(() => setLoading(false), 4000);
           }
           else{
       // alert(`${data.email} Business not activated`)
 
             router.push("/authorizationPage")
             setTimeout(() => setLoading(false), 4000);
           }
         
         }
        }
        else{
         // alert(`${data.email} not activated`)
         router.push("/authorizationPage")
         setTimeout(() => setLoading(false), 4000);
        }
      }
      else{
        router.push("/signin")
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
      <UserContext.Provider value={{ userDetails,setUserDetails,data }}>
      <div className="dark:bg-boxdark-2 dark:text-bodydark">
          {loading ? (
            <Loader height={"h-screen"} />
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
        </UserContext.Provider>

      
      </body>
    </html>
  );
}
