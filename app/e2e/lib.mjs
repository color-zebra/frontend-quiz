// Общее для сквозных тестов: поиск Chrome, сервер собранного приложения, отчёт о проверках.
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const APP_DIR = join(dirname(fileURLToPath(import.meta.url)), "..");
export const ROOT_DIR = join(APP_DIR, "..");
export const DIST_DIR = join(APP_DIR, "dist");
export const OUT_DIR = join(APP_DIR, "e2e", ".output");

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
];

export function findChrome() {
  const path = CHROME_CANDIDATES.find((candidate) => candidate && existsSync(candidate));
  if (!path) throw new Error("Не найден Chrome: укажи путь к нему в переменной окружения CHROME_PATH");
  return path;
}

/** Строковая константа из src/config.ts (без импорта .ts в Node). */
export function readConfig(name) {
  const match = readFileSync(join(APP_DIR, "src", "config.ts"), "utf8").match(new RegExp(`${name} = "([^"]*)"`));
  return match?.[1] ?? "";
}

/** Отпечаток пароля из настроек: тесты кладут его на «устройство», как приложение после верного ввода. */
export const getAccessHash = () => readConfig("ACCESS_PASSWORD_HASH");

/** Пароль в открытом виде — только из локального файла .access-password (его нет в репозитории). */
export function readLocalPassword() {
  const file = join(ROOT_DIR, ".access-password");
  return existsSync(file) ? readFileSync(file, "utf8").trim() : null;
}

export function ensureOutDir() {
  mkdirSync(OUT_DIR, { recursive: true });
  return OUT_DIR;
}

/** Ждёт появления элемента; false вместо исключения, чтобы проверка просто провалилась. */
export function visible(locator, timeout = 4000) {
  return locator.waitFor({ timeout }).then(
    () => true,
    () => false,
  );
}

export function createReport(suite) {
  const lines = [];
  let failed = 0;
  return {
    check(name, ok, extra = "") {
      if (!ok) failed++;
      lines.push(`  ${ok ? "OK  " : "FAIL"} ${name}${extra ? ` — ${extra}` : ""}`);
    },
    info(message) {
      lines.push(`  INFO ${message}`);
    },
    crash(error) {
      failed++;
      lines.push(`  CRASH ${error?.stack ?? error}`);
    },
    print() {
      console.log(`\n== ${suite}`);
      console.log(lines.join("\n"));
    },
    get failed() {
      return failed;
    },
    get passed() {
      return lines.filter((l) => l.startsWith("  OK")).length;
    },
  };
}
