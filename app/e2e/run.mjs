// Запуск сквозных тестов на собранном приложении: pnpm test:e2e из корня (сначала соберёт базу и приложение).
// Отдельные наборы: node e2e/run.mjs base sets
// Параллельно: по умолчанию потоков — половина ядер процессора, от 1 до 8 (у каждого свой Chrome и свой сервер);
// --jobs N — вручную, --jobs 1 — по одному, как раньше. У каждого потока своя копия сборки: наборы подменяют базу
// (dist/questions.json) и sw.js прямо в сборке и не должны мешать друг другу.
import { spawn } from "node:child_process";
import { cpSync, existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { availableParallelism } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import { preview } from "vite";
import { APP_DIR, DIST_DIR, OUT_DIR, createReport, ensureOutDir, findChrome, getAccessHash, visible } from "./lib.mjs";

const SUITES = ["base", "multi", "features", "screen", "progress", "stats", "cabinet", "achievements", "resume", "training", "bookmarks", "complaint", "speech", "sets", "catalog", "courses", "desktop", "lessons", "audio", "files", "help", "pwa", "gate"];
const TIMINGS = join(OUT_DIR, "timings.json");
/** Набор, у которого ещё нет замера, считаем таким долгим — чтобы новые наборы не скапливались в одном потоке. */
const UNKNOWN_SECONDS = 30;

const args = process.argv.slice(2);
const jobsArg = args.findIndex((a) => a === "--jobs" || a === "-j");
const jobs = jobsArg >= 0 ? Math.max(1, Number(args[jobsArg + 1]) || 1) : Math.min(8, Math.max(1, Math.floor(availableParallelism() / 2)));
const only = args.filter((a, i) => !a.startsWith("-") && (jobsArg < 0 || i !== jobsArg + 1));
const suites = only.length ? SUITES.filter((s) => only.includes(s)) : SUITES;

if (!existsSync(join(DIST_DIR, "index.html")) || !existsSync(join(DIST_DIR, "questions.json"))) {
  console.error("Нет собранного приложения. Выполни в корне репозитория: pnpm app:build");
  process.exit(1);
}
ensureOutDir();

if (process.env.E2E_WORKER || jobs === 1 || suites.length === 1) {
  await runSuites(suites, Number(process.env.E2E_PORT ?? 4730));
} else {
  await runParallel(suites, Math.min(jobs, suites.length));
}

/** Наборы по очереди в одном браузере. В режиме потока последней строкой — итоги для главного процесса. */
async function runSuites(list, port) {
  const url = `http://127.0.0.1:${port}/`;
  const chrome = findChrome();
  const accessHash = getAccessHash();
  const server = await preview({
    root: APP_DIR,
    build: { outDir: DIST_DIR },
    preview: { host: "127.0.0.1", port, strictPort: true },
    logLevel: "error",
  });
  const browser = await chromium.launch({ executablePath: chrome });
  let failed = 0;
  let passed = 0;
  const seconds = {};
  try {
    for (const name of list) {
      const started = Date.now();
      const report = createReport(name);
      const t = {
        browser,
        chrome,
        url,
        outDir: OUT_DIR,
        check: report.check,
        info: report.info,
        visible,
        /** Контекст браузера размером с телефон; по умолчанию уже «вошедший» мимо экрана пароля. */
        /**
         * section — раздел, который приложение «помнит» с прошлого раза. По умолчанию «Тренажёр»: большинство наборов
         * тестов начинают с него, и приложение открывается на нём после каждой перезагрузки, как раньше на главной;
         * null — как при самом первом запуске (откроются «Курсы»), раздел запоминается.
         */
        async newContext({ login = true, section = "trainer", ...options } = {}) {
          const context = await browser.newContext({ viewport: { width: 390, height: 844 }, ...options });
          if (login) await context.addInitScript((hash) => localStorage.setItem("fq.access", hash), accessHash);
          if (section) {
            await context.addInitScript((s) => localStorage.setItem("fq.section", s), section);
          }
          return context;
        },
        shot(page, file, fullPage = false) {
          return page.screenshot({ path: join(OUT_DIR, `${name}-${file}.png`), fullPage });
        },
      };
      try {
        const suite = await import(`./${name}.mjs`);
        await suite.default(t);
      } catch (error) {
        report.crash(error);
      }
      seconds[name] = Math.round((Date.now() - started) / 100) / 10;
      report.print();
      console.log(`  (${seconds[name]} с)`);
      failed += report.failed;
      passed += report.passed;
    }
  } finally {
    await browser.close();
    await new Promise((resolve) => server.httpServer.close(resolve));
  }
  if (process.env.E2E_WORKER) {
    console.log(`@@result ${JSON.stringify({ passed, failed, seconds })}`);
    return;
  }
  saveTimings(seconds);
  console.log(`\nИтого: прошло ${passed}, провалено ${failed}. Скриншоты — в ${OUT_DIR}`);
  process.exit(failed ? 1 : 0);
}

/**
 * Наборы раскладываются по потокам по прошлым замерам времени: самые долгие — первыми, каждый — в поток, где пока
 * меньше всего работы. Вывод потока печатается целиком, когда поток закончил, — наборы не перемешиваются.
 */
async function runParallel(list, count) {
  const started = Date.now();
  const known = readTimings();
  const cost = (s) => known[s] ?? UNKNOWN_SECONDS;
  const groups = Array.from({ length: count }, () => ({ suites: [], total: 0 }));
  for (const suite of [...list].sort((a, b) => cost(b) - cost(a))) {
    const group = groups.reduce((min, g) => (g.total < min.total ? g : min));
    group.suites.push(suite);
    group.total += cost(suite);
  }
  console.log(`Потоков: ${count}, наборов: ${list.length}.`);

  const results = await Promise.all(
    groups.map((group, i) => {
      const dist = join(OUT_DIR, `dist-${i + 1}`);
      rmSync(dist, { recursive: true, force: true });
      cpSync(DIST_DIR, dist, { recursive: true });
      return new Promise((resolve) => {
        const child = spawn(process.execPath, [fileURLToPath(import.meta.url), ...group.suites], {
          cwd: APP_DIR,
          env: { ...process.env, E2E_WORKER: "1", E2E_DIST: dist, E2E_PORT: String(4730 + i + 1) },
        });
        let out = "";
        child.stdout.on("data", (d) => (out += d));
        child.stderr.on("data", (d) => (out += d));
        child.on("close", (code) => {
          rmSync(dist, { recursive: true, force: true });
          const line = out.split("\n").find((l) => l.startsWith("@@result "));
          process.stdout.write(out.replace(/^@@result .*$/m, ""));
          // Поток упал, не дойдя до итогов, — считаем провалом, чтобы не было ложного «всё прошло».
          resolve(line ? JSON.parse(line.slice(9)) : { passed: 0, failed: 1, seconds: {}, crashed: code });
        });
      });
    }),
  );

  const passed = results.reduce((sum, r) => sum + r.passed, 0);
  const failed = results.reduce((sum, r) => sum + r.failed, 0);
  saveTimings(Object.assign({}, ...results.map((r) => r.seconds)));
  const total = Math.round((Date.now() - started) / 1000);
  console.log(`\nИтого: прошло ${passed}, провалено ${failed} за ${Math.floor(total / 60)} мин ${total % 60} с. Скриншоты — в ${OUT_DIR}`);
  process.exit(failed ? 1 : 0);
}

function readTimings() {
  try {
    return JSON.parse(readFileSync(TIMINGS, "utf8"));
  } catch {
    return {};
  }
}

function saveTimings(seconds) {
  writeFileSync(TIMINGS, JSON.stringify({ ...readTimings(), ...seconds }, null, 1));
}
