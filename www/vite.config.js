import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        port: 3000,
    },
    resolve: {
        alias: {
            "@src": path.resolve(__dirname, "../src"),
        },
    },
    optimizeDeps: {
        include: [
            "react",
            "react-dom",
            "react-router",
            "@trpc/client",
            "zustand",
            "react-toastify",
            "lodash",
            "react-markdown",
        ],
    },
    build: {
        rollupOptions: {
            input: "index.html",
        },
    },
});
