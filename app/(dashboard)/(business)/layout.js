"use client"
import React, { useState, createContext } from "react";
import { useRouter } from "next/navigation";

// Define BusinessContext
export const BusinessContext = createContext({
  selectedBusiness: null,
  setSelectedBusiness: () => {},
});

const Layout = ({children}) => {
    const router = useRouter();
    const [selectedBusiness, setSelectedBusiness] = useState(null);
   
    return (
        <div>
            <BusinessContext.Provider value={{
                selectedBusiness,
                setSelectedBusiness
            }}>
                {children}
            </BusinessContext.Provider>
        </div>
    );
}
 
export default Layout;