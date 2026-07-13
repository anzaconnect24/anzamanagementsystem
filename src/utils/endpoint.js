// In local development, route API calls through Vite proxy to avoid browser CORS.
export const server_url = import.meta.env.DEV
  ? "/api"
  : "https://api.anzaconnect.co.tz";
