"use client"
import "./globals.css";
import "./data-tables-css.css";
import "./satoshi.css";

import { getUser } from "./utils/local_storage";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Loader from "@/components/common/Loader";
import { getMyInfo } from "./controllers/user_controller";

export default function RootLayout({children}) {
 const user = getUser()
 const router  =useRouter()
 useEffect(() => {
  const s = document.createElement('script');
  s.setAttribute('src', 'https://embed.tawk.to/66126af2a0c6737bd1292ad3/1hqrv3hrd');
  s.setAttribute('charset', 'UTF-8');
  s.setAttribute('crossorigin', '*');
  s.async = true;
  document.head.appendChild(s);

  return () => {
      document.head.removeChild(s);
  };
}, []);

  return (
    <html  lang="en">
      <head>
      <meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests"/>
      </head>
      <body suppressHydrationWarning={true}>
       {children}
      </body>
    </html>
  );
}
