import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Read .env so VITE_API_PROXY_TARGET can point /api at a local backend.
  const env = loadEnv(mode, process.cwd(), "");

  return {
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
          target: env.VITE_API_PROXY_TARGET || "http://localhost:5000",
          changeOrigin: true,
          secure: false,
          ws: true,
          rewrite: (requestPath) => requestPath.replace(/^\/api/, ""),
        },
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
  };
});
