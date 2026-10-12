// Показывает варианты вопросов, где правильный ответ заметно длиннее остальных.
// Запуск: node scripts/lengths.mjs [путь к файлу или папке внутри questions]
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const target = join(ROOT, process.argv[2] ?? "questions");
const RATIO = 1.3;

const listYamlFiles = (path) =>
  statSync(path).isDirectory()
    ? readdirSync(path).flatMap((name) => listYamlFiles(join(path, name)))
    : path.endsWith(".yaml") ? [path] : [];

for (const file of listYamlFiles(target)) {
  for (const q of yaml.load(readFileSync(file, "utf8")).questions) {
    const correct = q.options.find((option) => option.correct);
    const longestWrong = Math.max(...q.options.filter((option) => !option.correct).map((option) => option.text.length));
    if (correct.text.length <= longestWrong * RATIO) continue;
    console.log(`\n## ${q.id}`);
    q.options.forEach((option) => console.log(`${option.correct ? "*" : " "} ${option.text.length.toString().padStart(3)}  ${option.text}`));
  }
}
