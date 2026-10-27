import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
	plugins: [react()],
	resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
	server: {
		port: 5173,
		proxy: {
			"/api": { target: "http://localhost:3000", changeOrigin: true },
			"/health": { target: "http://localhost:3000", changeOrigin: true },
			"/img-proxy": {
				target: "https://www.artic.edu",
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/img-proxy/, ""),
				secure: false,
			},
		},
	},
});
