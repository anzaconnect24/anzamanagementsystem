"use client"
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BusinessContext } from "@/app/context/BusinessContext";

const Layout = ({children}) => {
    const router = useRouter();
    const [user, setUser] = useState(null);
   
    return ( <div>
        <BusinessContext.Provider value={{ user, setUser }}>
        {children}
        </BusinessContext.Provider>
    </div> );
}
 
export default Layout;
