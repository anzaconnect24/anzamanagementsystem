import { forwardRef } from "react";
import { Link as RouterLink } from "react-router-dom";

// Simple wrapper component that mimics Next.js Link behavior for Vite
const Link = forwardRef(({ href, children, ...props }, ref) => {
  return (
    <RouterLink ref={ref} to={href} {...props}>
      {children}
    </RouterLink>
  );
});

Link.displayName = "Link";

export default Link;
