"use client";
import { BusinessContext } from "@/app/context/BusinessContext";
import { useRouter } from "next/navigation";
import { useState } from "react";

const Layout = ({ children }) => {
  const router = useRouter();
  const [user, setUser] = useState(null);

  return (
    <BusinessContext.Provider value={{ user, setUser }}>
      {children}
    </BusinessContext.Provider>
  );
};

export default Layout; // ✅ Only export default
