import { useNavigate, useLocation, useParams } from "react-router-dom";

// Hook to mimic Next.js useRouter behavior
export function useRouter() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  const push = (url) => navigate(url);
  const replace = (url) => navigate(url, { replace: true });
  const back = () => navigate(-1);

  return {
    push,
    replace,
    back,
    pathname: location.pathname,
    query: Object.fromEntries(new URLSearchParams(location.search)),
    params,
  };
}

// Hook to mimic Next.js usePathname behavior
export function usePathname() {
  const location = useLocation();
  return location.pathname;
}

// Function to mimic Next.js redirect behavior
export function redirect(url) {
  window.location.href = url;
}
