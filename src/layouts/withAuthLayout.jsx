"use client";

import React from "react";
import AuthLayout from "./AuthLayout";

export const withAuthLayout = (Component, title, subtitle) => {
  return function WrappedComponent(props) {
    return (
      <AuthLayout title={title} subtitle={subtitle}>
        <Component {...props} />
      </AuthLayout>
    );
  };
};

export default AuthLayout;
