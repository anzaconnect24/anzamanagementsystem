"use client"
import { createContext, useEffect, useState } from "react";
import {useRouter} from "next/navigation"
export const BusinessContext = createContext();
const Layout = ({children}) => {
    const router = useRouter();
    const [selectedBusiness, setSelectedBusiness] = useState(null);
   
    return ( <div>
        <BusinessContext.Provider value={{ selectedBusiness,setSelectedBusiness }}>
        {children}
        </BusinessContext.Provider>
    </div> );
}
 
export default Layout;