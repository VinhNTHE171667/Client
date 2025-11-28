import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import * as path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@assets": path.resolve(__dirname, "./src/assets"),
      "@components": path.resolve(__dirname, "./src/components"),
    },
  },
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
        secure: false,
      },
    },
  },
  css: {
    modules: {
      localsConvention: "dashes",
    },
  },
  build: {
    sourcemap: true,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['antd', '@ant-design/icons', 'react-router-dom'],
          utils: ['dayjs', 'xlsx', 'react-big-calendar'],
          charts: ['highcharts', 'highcharts-react-official', 'recharts'],
          state: ['@reduxjs/toolkit', 'react-redux', 'redux-persist'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  base: "/",
});
