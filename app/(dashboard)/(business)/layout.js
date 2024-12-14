"use client";

import { BusinessContext } from "../../context/BusinessContext";
import { useState } from "react";

const Layout = ({ children }) => {
  const [user, setUser] = useState(null);

  return (
    <BusinessContext.Provider value={{ user, setUser }}>
      {children}
    </BusinessContext.Provider>
  );
};

export default Layout;
