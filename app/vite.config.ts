import react from "@vitejs/plugin-react";
import { load } from "js-yaml";
import { createReadStream, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import { VitePWA } from "vite-plugin-pwa";

/** Собранная база из корня репозитория: её делает `pnpm build` (scripts/check.mjs --build). */
const QUESTIONS_FILE = fileURLToPath(new URL("../dist/questions.json", import.meta.url));

/** questions-version.json — только дата сборки базы: по нему приложение узнаёт, что вышла новая база. */
function getVersionFile() {
  const { generatedAt } = JSON.parse(readFileSync(QUESTIONS_FILE, "utf8")) as { generatedAt?: string };
  return JSON.stringify({ generatedAt });
}

/**
 * questions.json рядом с приложением: в режиме разработки отдаём локальный файл (правку в YAML
 * видно после `pnpm build` и перезагрузки страницы), при сборке кладём сжатую копию в app/dist.
 */
function questionsFile(): Plugin {
  return {
    name: "frontend-quiz:questions",
    configureServer(server) {
      server.middlewares.use("/questions-version.json", (_req, res) => {
        if (!existsSync(QUESTIONS_FILE)) {
          res.statusCode = 404;
          res.end();
          return;
        }
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.setHeader("Cache-Control", "no-store");
        res.end(getVersionFile());
      });
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
      this.emitFile({ type: "asset", fileName: "questions-version.json", source: getVersionFile() });
    },
  };
}

/** Готовые наборы и их каталог для экрана «Мои наборы». */
const CUSTOM_SETS_DIR = fileURLToPath(new URL("../custom-sets/", import.meta.url));
const CATALOG_FILE = join(CUSTOM_SETS_DIR, "catalog.yaml");
const CATALOG_MODULE = "virtual:sets-catalog";
// Тип — из объявления модуля в src: обычный import из src конфиг сборки подтягивать не должен.
type CatalogItem = (typeof import("virtual:sets-catalog"))["default"][number];
const CATALOG_LEVELS = ["junior", "middle", "senior"] as const;

function failCatalog(message: string): never {
  throw new Error(`custom-sets/catalog.yaml: ${message}`);
}

/**
 * Название, число вопросов и уровни набора. Вопросы по одному тут не проверяются: кривой вопрос приложение
 * пропустит при добавлении и покажет причину, как у любого набора.
 */
function readCatalogSet(file: string) {
  const path = join(CUSTOM_SETS_DIR, file);
  if (!existsSync(path)) failCatalog(`нет файла custom-sets/${file}`);
  let doc: unknown;
  try {
    doc = load(readFileSync(path, "utf8"));
  } catch (error) {
    failCatalog(`${file} не читается как YAML — ${(error as Error).message}`);
  }
  const set = (doc ?? {}) as { title?: unknown; kind?: unknown; questions?: unknown };
  if (!Array.isArray(set.questions) || set.questions.length === 0) failCatalog(`в ${file} нет вопросов в списке questions`);
  const questions = set.questions as { level?: unknown }[];
  return {
    path,
    title: typeof set.title === "string" && set.title.trim() ? set.title.trim() : file.replace(/\.ya?ml$/, ""),
    count: questions.length,
    speech: set.kind === "speech",
    levels: CATALOG_LEVELS.filter((level) => questions.some((q) => q?.level === level)),
  };
}

function isHttpsUrl(value: unknown): value is string {
  try {
    return typeof value === "string" && new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

/** Имя файла, если ссылка ведёт в папку custom-sets/: «…/main/custom-sets/websockets.yaml» → «websockets.yaml». */
function getCustomSetsFile(url: string) {
  const match = new URL(url).pathname.match(/\/custom-sets\/([\w.-]+\.ya?ml)$/);
  return match?.[1];
}

/**
 * Пункты каталога: ссылка, по которой качается набор, и описание. Если ссылка ведёт в custom-sets/ и такой файл
 * лежит рядом, название, число вопросов и уровни берём из него; иначе сборка набор не видит — название пишется в
 * каталоге. Опечатка в каталоге или нечитаемый набор останавливают сборку, а не показывают в приложении пустой пункт.
 */
function readCatalog(onSetFile: (path: string) => void): CatalogItem[] {
  const doc: unknown = load(readFileSync(CATALOG_FILE, "utf8")) ?? [];
  if (!Array.isArray(doc)) failCatalog("нужен список пунктов вида «- url: … description: …»");
  const seen = new Set<string>();
  return doc.map((raw: unknown, index) => {
    let at = `пункт ${index + 1}`;
    if (typeof raw !== "object" || raw === null) failCatalog(`${at}: нужны поля url и description`);
    const { url, title, description, ...extra } = raw as Record<string, unknown>;
    const unknownField = Object.keys(extra)[0];
    if (unknownField) failCatalog(`${at}: неизвестное поле «${unknownField}» — бывают url, title и description`);
    if (!isHttpsUrl(url)) failCatalog(`${at}: в url нужна ссылка с https:// — такая же, как в поле «Добавить набор»`);
    at = `${at} (${url})`;
    if (seen.has(url)) failCatalog(`${at}: такая ссылка уже есть в каталоге выше`);
    seen.add(url);
    if (typeof description !== "string" || !description.trim()) failCatalog(`${at}: нужно описание — одна-две фразы о наборе`);
    const file = getCustomSetsFile(url);
    const hasTitle = typeof title === "string" && title.trim() !== "";
    if (file && existsSync(join(CUSTOM_SETS_DIR, file))) {
      if (title !== undefined) failCatalog(`${at}: title не нужен — название берётся из custom-sets/${file}`);
      const { path, ...set } = readCatalogSet(file);
      onSetFile(path);
      return { url, description: description.trim(), ...set };
    }
    if (!hasTitle) {
      failCatalog(
        file
          ? `${at}: в custom-sets/ нет файла ${file} — опечатка в ссылке? Если набор из другого места, впиши title`
          : `${at}: у набора не из custom-sets/ нужен title — сборка его файл не скачивает`,
      );
    }
    return { url, title: title.trim(), description: description.trim(), speech: false, levels: [] };
  });
}

/** Модуль virtual:sets-catalog — каталог, собранный при сборке; правка каталога или набора в разработке видна сразу. */
function setsCatalog(): Plugin {
  const resolvedId = `\0${CATALOG_MODULE}`;
  return {
    name: "frontend-quiz:sets-catalog",
    resolveId(id) {
      return id === CATALOG_MODULE ? resolvedId : undefined;
    },
    load(id) {
      if (id !== resolvedId) return undefined;
      this.addWatchFile(CATALOG_FILE);
      try {
        return `export default ${JSON.stringify(readCatalog((path) => this.addWatchFile(path)))};`;
      } catch (error) {
        return this.error((error as Error).message);
      }
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
    // Во весь экран: на Android установленное приложение прячет системные панели (часы сверху и кнопки снизу),
    // кнопки выезжают по свайпу от нижнего края. Айфоны так не умеют и открывают как обычное окно приложения.
    display: "fullscreen",
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
      // Картинки уроков с чужих сайтов: увиденная картинка доступна и без сети. Только обычные ответы (200):
      // «непрозрачный» ответ сайта без CORS Chrome учитывает в квоте как мегабайты, такие картинки — только онлайн.
      {
        urlPattern: ({ request, sameOrigin }) => request.destination === "image" && !sameOrigin,
        handler: "CacheFirst",
        options: {
          cacheName: "lesson-images",
          expiration: { maxEntries: 150, maxAgeSeconds: 30 * 24 * 60 * 60, purgeOnQuotaError: true },
          cacheableResponse: { statuses: [200] },
        },
      },
    ],
  },
});

export default defineConfig({
  // Относительные пути: сборка откроется и из корня домена, и из подкаталога GitHub Pages.
  base: "./",
  plugins: [react(), questionsFile(), setsCatalog(), pwa],
  server: { port: 5173 },
});
