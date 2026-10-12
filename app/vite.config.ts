import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  // Относительные пути: сборка откроется и из корня домена, и из подкаталога GitHub Pages.
  base: "./",
  plugins: [react()],
  server: { port: 5173 },
});
