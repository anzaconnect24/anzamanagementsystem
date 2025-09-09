import { Link as RouterLink } from "react-router-dom";

// Simple wrapper component that mimics Next.js Link behavior for Vite
export default function Link({ href, children, ...props }) {
  return (
    <RouterLink to={href} {...props}>
      {children}
    </RouterLink>
  );
}
