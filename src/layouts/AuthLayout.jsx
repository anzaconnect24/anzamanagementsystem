import React from "react";
import { Outlet } from "react-router-dom";
import { Toaster } from "react-hot-toast";

export default function AuthLayout() {
  return (
    <div>
      <Toaster position="top-right" />
      <Outlet />
    </div>
  );
}
