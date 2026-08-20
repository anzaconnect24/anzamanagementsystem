import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import compression from "vite-plugin-compression";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    compression({
      algorithm: "gzip",
      ext: ".gz",
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  esbuild: {
    loader: "jsx",
    include: /src\/.*\.[jt]sx?$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        ".js": "jsx",
        ".ts": "tsx",
      },
    },
    include: [
      "react",
      "react-dom",
      "axios",
      "react-hot-toast",
      "firebase/app",
      "firebase/auth",
      "firebase/firestore",
    ],
    exclude: ["@google/generative-ai"],
  },
  server: {
    port: 3000,
    open: true,
    hmr: {
      overlay: false,
    },
    proxy: {
      "/api": {
        target: "https://api.anzaconnect.co.tz",
        changeOrigin: true,
        secure: true,
        ws: true,
        rewrite: (requestPath) => requestPath.replace(/^\/api/, ""),
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    // Optimize bundle splitting
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-charts": [
            "apexcharts",
            "react-apexcharts",
            "chart.js",
            "react-chartjs-2",
          ],
          "vendor-ui": ["react-icons", "react-hot-toast"],
          "vendor-utils": ["axios", "moment"],
          "vendor-firebase": [
            "firebase/app",
            "firebase/auth",
            "firebase/firestore",
          ],
        },
      },
    },
  },
});
