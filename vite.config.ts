import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// base 對應 GitHub Pages 的 repo 子路徑（https://<user>.github.io/preference-page/）
export default defineConfig({
  base: "/preference-page/",
  plugins: [react(), tailwindcss()],
});
