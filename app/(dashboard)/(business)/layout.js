"use client"
import { createContext, useEffect, useState } from "react";
import {useRouter} from "next/navigation"
export const BusinessContext = createContext();
const Layout = ({children}) => {
    const router = useRouter();
    const [user, setUser] = useState(null);
   
    return ( <div>
        <BusinessContext.Provider value={{ user,setUser }}>
        {children}
        </BusinessContext.Provider>
    </div> );
}
 
export default Layout;