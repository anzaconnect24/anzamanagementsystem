// Use Vite proxy only on localhost; always use public API domain in production.
const host = typeof window !== "undefined" ? window.location.hostname : "";
const isLocalHost = host === "localhost" || host === "127.0.0.1";

export const server_url =
  import.meta.env.VITE_SERVER_URL ||
  (isLocalHost ? "/api" : "https://api.anzaconnect.co.tz");
