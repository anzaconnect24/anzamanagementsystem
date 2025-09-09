import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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
    include: ["react", "react-dom", "axios", "react-hot-toast"],
    exclude: ["@google/generative-ai"],
  },
  server: {
    port: 3000,
    open: true,
    hmr: {
      overlay: false,
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
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
          "vendor-utils": ["axios", "moment", "firebase"],
        },
      },
    },
  },
});
