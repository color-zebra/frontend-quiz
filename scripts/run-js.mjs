// Выполняет код JS-вопросов и печатает реальный вывод рядом с помеченным правильным ответом.
// Код выполняется как обычный скрипт (не модуль): `this` и `var` на верхнем уровне ведут себя как в браузере.
// Запуск: node scripts/run-js.mjs questions/javascript/event-loop.yaml [id вопроса]
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import yaml from "js-yaml";

const [file, onlyId] = process.argv.slice(2);
const { questions } = yaml.load(readFileSync(file, "utf8"));

const runner = `
const vm = require("node:vm");
let code = "";
process.stdin.on("data", (chunk) => (code += chunk));
process.stdin.on("end", () => {
  try {
    vm.runInThisContext(code, { filename: "question.js" });
  } catch (error) {
    console.log("Uncaught " + error.name + ": " + error.message);
  }
});
process.on("unhandledRejection", (reason) => console.log("UnhandledRejection: " + (reason && reason.message || reason)));
`;

for (const q of questions) {
  if (onlyId && q.id !== onlyId) continue;
  if (q.codeLang !== "js" || !q.code) continue;
  if ((q.tags ?? []).includes("no-run")) continue;
  const result = spawnSync(process.execPath, ["-e", runner], { input: q.code, encoding: "utf8", timeout: 5000 });
  const correct = q.options.find((option) => option.correct)?.text;
  console.log(`\n## ${q.id}`);
  console.log(`ожидается: ${correct}`);
  console.log(`вывод:\n${(result.stdout + result.stderr).trim()}`);
}
