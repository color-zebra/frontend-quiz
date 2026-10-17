// Запуск сквозных тестов на собранном приложении: pnpm test:e2e из корня (сначала соберёт базу и приложение).
// Отдельные наборы: node e2e/run.mjs base sets
import { existsSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright-core";
import { preview } from "vite";
import { APP_DIR, DIST_DIR, createReport, ensureOutDir, findChrome, getAccessHash, visible } from "./lib.mjs";

const SUITES = ["base", "multi", "features", "screen", "progress", "stats", "cabinet", "achievements", "resume", "training", "bookmarks", "complaint", "speech", "sets", "catalog", "files", "help", "pwa", "gate"];
const PORT = 4730;
const URL_ = `http://127.0.0.1:${PORT}/`;

const only = process.argv.slice(2);
const suites = only.length ? SUITES.filter((s) => only.includes(s)) : SUITES;
if (!existsSync(join(DIST_DIR, "index.html")) || !existsSync(join(DIST_DIR, "questions.json"))) {
  console.error("Нет собранного приложения. Выполни в корне репозитория: pnpm app:build");
  process.exit(1);
}

const chrome = findChrome();
const accessHash = getAccessHash();
const outDir = ensureOutDir();
const server = await preview({ root: APP_DIR, preview: { host: "127.0.0.1", port: PORT, strictPort: true }, logLevel: "error" });
const browser = await chromium.launch({ executablePath: chrome });

let failed = 0;
let passed = 0;
try {
  for (const name of suites) {
    const report = createReport(name);
    const t = {
      browser,
      chrome,
      url: URL_,
      outDir,
      check: report.check,
      info: report.info,
      visible,
      /** Контекст браузера размером с телефон; по умолчанию уже «вошедший» мимо экрана пароля. */
      async newContext({ login = true, ...options } = {}) {
        const context = await browser.newContext({ viewport: { width: 390, height: 844 }, ...options });
        if (login) await context.addInitScript((hash) => localStorage.setItem("fq.access", hash), accessHash);
        return context;
      },
      shot(page, file, fullPage = false) {
        return page.screenshot({ path: join(outDir, `${name}-${file}.png`), fullPage });
      },
    };
    try {
      const suite = await import(`./${name}.mjs`);
      await suite.default(t);
    } catch (error) {
      report.crash(error);
    }
    report.print();
    failed += report.failed;
    passed += report.passed;
  }
} finally {
  await browser.close();
  await new Promise((resolve) => server.httpServer.close(resolve));
}

console.log(`\nИтого: прошло ${passed}, провалено ${failed}. Скриншоты — в ${outDir}`);
process.exit(failed ? 1 : 0);
