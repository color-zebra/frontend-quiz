import react from "@vitejs/plugin-react";
import { createReadStream, existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";

/** Собранная база из корня репозитория: её делает `pnpm build` (scripts/check.mjs --build). */
const QUESTIONS_FILE = fileURLToPath(new URL("../dist/questions.json", import.meta.url));

/**
 * questions.json рядом с приложением: в режиме разработки отдаём локальный файл (правку в YAML
 * видно после `pnpm build` и перезагрузки страницы), при сборке кладём сжатую копию в app/dist.
 */
function questionsFile(): Plugin {
  return {
    name: "frontend-quiz:questions",
    configureServer(server) {
      server.middlewares.use("/questions.json", (_req, res) => {
        if (!existsSync(QUESTIONS_FILE)) {
          res.statusCode = 404;
          res.end();
          return;
        }
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.setHeader("Cache-Control", "no-store");
        createReadStream(QUESTIONS_FILE).pipe(res);
      });
    },
    generateBundle() {
      if (!existsSync(QUESTIONS_FILE)) {
        this.error("Нет dist/questions.json — сначала выполни pnpm build в корне репозитория");
      }
      this.emitFile({
        type: "asset",
        fileName: "questions.json",
        source: JSON.stringify(JSON.parse(readFileSync(QUESTIONS_FILE, "utf8"))),
      });
    },
  };
}

export default defineConfig({
  // Относительные пути: сборка откроется и из корня домена, и из подкаталога GitHub Pages.
  base: "./",
  plugins: [react(), questionsFile()],
  server: { port: 5173 },
});
