// Проверяет код TS-вопросов: печатает ошибки компилятора (strict) с номерами строк и реальный вывод
// скомпилированного кода рядом с помеченным правильным ответом.
// Код компилируется как модуль и выполняется как ES-модуль (строгий режим, top-level `this` — undefined).
// Настройки компилятора можно переопределить комментариями в начале кода: `// @strictNullChecks: false`.
// Тег `no-run` — только компиляция, без запуска.
// Запуск: node scripts/run-ts.mjs questions/typescript/generics.yaml [id вопроса]
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import yaml from "js-yaml";
import { createRequire } from "node:module";

// QUIZ_TS — путь к другому пакету typescript, чтобы сравнить версии компилятора.
const ts = createRequire(import.meta.url)(process.env.QUIZ_TS ?? "typescript");

const [file, onlyId] = process.argv.slice(2);
const { questions } = yaml.load(readFileSync(file, "utf8"));
// Временные файлы — внутри проекта, чтобы компилятор находил типы из node_modules (например @types/react для tsx).
const cacheDir = join(import.meta.dirname, "..", "node_modules", ".cache");
mkdirSync(cacheDir, { recursive: true });
const dir = mkdtempSync(join(cacheDir, "quiz-ts-"));

const baseOptions = {
  strict: true,
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  moduleDetection: ts.ModuleDetectionKind.Force,
  lib: ["lib.es2023.d.ts", "lib.dom.d.ts"],
  noEmit: false,
  skipLibCheck: true,
};

function readInlineOptions(code) {
  const options = {};
  for (const line of code.split("\n")) {
    const match = line.match(/^\/\/\s*@(\w+):\s*(.+?)\s*$/);
    if (!match) continue;
    const [, name, raw] = match;
    options[name] = raw === "true" ? true : raw === "false" ? false : raw;
  }
  const { options: parsed, errors } = ts.convertCompilerOptionsFromJson(options, dir);
  for (const error of errors) console.log("  !! " + ts.flattenDiagnosticMessageText(error.messageText, "\n"));
  return parsed;
}

for (const q of questions) {
  if (onlyId && q.id !== onlyId) continue;
  if (!["ts", "tsx"].includes(q.codeLang) || !q.code) continue;
  const fileName = join(dir, `${q.id}.${q.codeLang}`);
  writeFileSync(fileName, q.code);
  const options = { ...baseOptions, ...readInlineOptions(q.code), outDir: join(dir, "out") };
  if (q.codeLang === "tsx") options.jsx = ts.JsxEmit.ReactJSX;
  const program = ts.createProgram([fileName], options);
  const diagnostics = ts.getPreEmitDiagnostics(program).filter((d) => d.file?.fileName === program.getSourceFile(fileName)?.fileName);

  const correct = q.options.find((option) => option.correct)?.text;
  console.log(`\n## ${q.id}`);
  console.log(`ожидается: ${correct}`);
  console.log(diagnostics.length ? "ошибки компиляции:" : "ошибок компиляции нет");
  for (const d of diagnostics) {
    const { line } = d.file.getLineAndCharacterOfPosition(d.start);
    console.log(`  строка ${line + 1}: TS${d.code} ${ts.flattenDiagnosticMessageText(d.messageText, "\n    ")}`);
  }
  if ((q.tags ?? []).includes("no-run") || q.codeLang === "tsx") continue;
  const js = ts.transpileModule(q.code, { compilerOptions: options }).outputText;
  const jsFile = join(dir, `${q.id}.mjs`);
  writeFileSync(jsFile, js);
  const result = spawnSync(process.execPath, [jsFile], { encoding: "utf8", timeout: 5000 });
  console.log(`вывод:\n${(result.stdout + result.stderr).trim()}`);
}
