import React, { lazy } from "react";

// Simple dynamic import wrapper for Vite using React.lazy
export default function dynamic(importFunction, options = {}) {
  const LazyComponent = lazy(importFunction);

  return function DynamicComponent(props) {
    return (
      <React.Suspense
        fallback={options.loading ? options.loading() : <div>Loading...</div>}
      >
        <LazyComponent {...props} />
      </React.Suspense>
    );
  };
}
