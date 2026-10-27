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
				headers: {
					"User-Agent":
						"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
					Referer: "https://www.artic.edu/",
					Accept: "image/webp,image/apng,image/*,*/*;q=0.8",
				},
			},
		},
	},
});
