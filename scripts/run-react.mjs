// Выполняет код React-вопросов (jsx/tsx) в jsdom и печатает реальный вывод консоли рядом с помеченным ответом.
// Импорты из react/react-dom в коде вопроса можно опускать: скрипт подставляет хуки и API сам.
// Если в коде есть компонент App и нет своего вызова render, он монтируется в #root без StrictMode.
// Третий аргумент — необязательный сценарий (ESM-файл), его default-функция получает { document, window, sleep, flushSync }
// и вызывается после монтирования: так проверяются клики и ввод.
// Тег `no-run` — пропустить. Запуск: node scripts/run-react.mjs questions/react/effects.yaml [id] [сценарий.mjs]
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import yaml from "js-yaml";
import ts from "typescript";

const require = createRequire(import.meta.url);
const [file, onlyId, scenario] = process.argv.slice(2);
const { questions } = yaml.load(readFileSync(file, "utf8"));
const dir = mkdtempSync(join(tmpdir(), "quiz-react-"));
const url = (name) => pathToFileURL(require.resolve(name)).href;

const API = [
  "useState", "useEffect", "useLayoutEffect", "useInsertionEffect", "useRef", "useMemo", "useCallback",
  "useReducer", "useContext", "createContext", "memo", "forwardRef", "Fragment", "StrictMode", "Suspense",
  "lazy", "startTransition", "useTransition", "useDeferredValue", "useId", "useSyncExternalStore", "use",
  "useActionState", "useOptimistic", "useImperativeHandle", "useEffectEvent", "Activity", "Component",
  "PureComponent", "createElement", "cloneElement", "Children", "Profiler",
];

const prelude = `
import * as React from ${JSON.stringify(url("react"))};
import { createRoot } from ${JSON.stringify(url("react-dom/client"))};
import { flushSync, createPortal, useFormStatus } from ${JSON.stringify(url("react-dom"))};
const { ${API.join(", ")} } = React;
`;

const harness = (questionUrl, scenarioUrl) => `
import { JSDOM } from ${JSON.stringify(url("jsdom"))};
const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { pretendToBeVisual: true });
// DOM-конструкторы берём из jsdom, даже если в Node есть одноимённые (FormData, Event): React передаёт в них узлы jsdom.
for (const key of ["window", "document", "navigator", "HTMLElement", "HTMLFormElement", "HTMLInputElement", "Node",
  "Event", "MouseEvent", "KeyboardEvent", "InputEvent", "SubmitEvent", "FormData", "requestAnimationFrame",
  "cancelAnimationFrame", "getComputedStyle", "MutationObserver"]) {
  Object.defineProperty(globalThis, key, { value: key === "window" ? dom.window : dom.window[key], configurable: true, writable: true });
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
process.on("uncaughtException", (e) => console.log("Uncaught " + e.name + ": " + e.message));
process.on("unhandledRejection", (e) => console.log("UnhandledRejection: " + (e && e.message || e)));
await import(${JSON.stringify(questionUrl)});
await sleep(200);
${scenarioUrl ? `
const { flushSync } = await import(${JSON.stringify(url("react-dom"))});
console.log("--- сценарий");
await (await import(${JSON.stringify(scenarioUrl)})).default({ document: dom.window.document, window: dom.window, sleep, flushSync });
await sleep(200);` : ""}
console.log("--- DOM: " + dom.window.document.getElementById("root").innerHTML);
process.exit(0);
`;

for (const q of questions) {
  if (onlyId && q.id !== onlyId) continue;
  if (!["jsx", "tsx"].includes(q.codeLang) || !q.code) continue;
  if ((q.tags ?? []).includes("no-run")) continue;
  let code = q.code;
  if (!/from ['"]react/.test(code)) code = prelude + code;
  if (!/\.render\(|createRoot\(|hydrateRoot\(/.test(q.code) && /function App\b|const App\b/.test(q.code)) {
    code += `\ncreateRoot(document.getElementById("root")).render(<App />);\n`;
  }
  const js = ts.transpileModule(code, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX },
    fileName: `q.${q.codeLang}`,
  }).outputText.replace(/from "react\/jsx-runtime"/, `from ${JSON.stringify(url("react/jsx-runtime"))}`);
  const questionFile = join(dir, `${q.id}.mjs`);
  writeFileSync(questionFile, js);
  const harnessFile = join(dir, `${q.id}.harness.mjs`);
  writeFileSync(harnessFile, harness(pathToFileURL(questionFile).href, scenario && pathToFileURL(resolve(scenario)).href));
  const result = spawnSync(process.execPath, [harnessFile], { encoding: "utf8", timeout: 15000 });
  const correct = q.options.find((option) => option.correct)?.text;
  console.log(`\n## ${q.id}`);
  console.log(`ожидается: ${correct}`);
  console.log(`вывод:\n${(result.stdout + result.stderr).trim()}`);
}
