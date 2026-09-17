// Local-only dev override (untracked). Run with:
//   npx vite --config vite.config.local.js
// Points the /api proxy at the backend actually running on this machine.
import base from "./vite.config.js";

const target = process.env.VITE_API_PROXY_TARGET || "http://localhost:4000";

export default {
  ...base,
  server: {
    ...base.server,
    proxy: {
      ...base.server?.proxy,
      "/api": {
        target,
        changeOrigin: true,
        secure: false,
        ws: true,
        rewrite: (p) => p.replace(/^\/api/, ""),
      },
    },
  },
};
