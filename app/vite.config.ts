import react from "@vitejs/plugin-react";
import { createReadStream, existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import { VitePWA } from "vite-plugin-pwa";

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

/**
 * Офлайн и установка: Service Worker кэширует файлы приложения, манифест описывает его для телефона.
 * Новую версию SW не включает сам — приложение показывает плашку «Перезапустить» (registerType: "prompt").
 */
const pwa = VitePWA({
  registerType: "prompt",
  // Регистрацию делает React-хук из virtual:pwa-register/react.
  injectRegister: false,
  manifest: {
    name: "Zubrilka",
    short_name: "Zubrilka",
    description: "Тренажёр вопросов: встроенная база для фронтенд-собеседований и свои наборы на любую тему",
    lang: "ru",
    start_url: "./",
    scope: "./",
    display: "standalone",
    background_color: "#0b0920",
    theme_color: "#0b0920",
    icons: [
      { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  },
  workbox: {
    // База в этот кэш не попадает: она лежит в IndexedDB и обновляется кнопкой «Обновить».
    // Шрифты — только латиница и кириллица; остальные наборы символов докэшируются при первом использовании.
    globPatterns: ["**/*.{js,css,html,svg,png}", "assets/*-{latin,cyrillic}-wght-normal-*.woff2"],
    globIgnores: ["questions.json"],
    cleanupOutdatedCaches: true,
    runtimeCaching: [
      {
        urlPattern: ({ url }) => url.pathname.endsWith(".woff2"),
        handler: "CacheFirst",
        options: { cacheName: "fonts", expiration: { maxEntries: 40 } },
      },
    ],
  },
});

export default defineConfig({
  // Относительные пути: сборка откроется и из корня домена, и из подкаталога GitHub Pages.
  base: "./",
  plugins: [react(), questionsFile(), pwa],
  server: { port: 5173 },
});
