// Проверяет базу вопросов и (с флагом --build) собирает её в dist/questions.json.
// Запуск: pnpm check  |  pnpm build
import { readFileSync, readdirSync, mkdirSync, writeFileSync, statSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const QUESTIONS_DIR = join(ROOT, "questions");
const LEVELS = ["junior", "middle", "senior"];
const CODE_LANGS = ["html", "css", "scss", "js", "ts", "jsx", "tsx", "http", "json", "text"];
const QUESTION_KEYS = ["id", "level", "tags", "question", "code", "codeLang", "options", "explanation", "links", "source"];
const OPTION_KEYS = ["text", "correct", "why"];

const errors = [];
const warnings = [];
const fail = (file, message) => errors.push(`${file}: ${message}`);
// Правильный ответ не должен угадываться по длине: заметно длиннее всех остальных — подозрительно
const LENGTH_RATIO_LIMIT = 1.3;
const isText = (value) => typeof value === "string" && value.trim() !== "";

const topicsDoc = yaml.load(readFileSync(join(ROOT, "topics.yaml"), "utf8"));
const subtopicsByTopic = new Map(
  topicsDoc.topics.map((topic) => [topic.id, new Set((topic.subtopics ?? []).map((subtopic) => subtopic.id))])
);

const listYamlFiles = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return listYamlFiles(path);
    return name.endsWith(".yaml") ? [path] : [];
  });

const seenIds = new Map();
const allQuestions = [];

for (const path of listYamlFiles(QUESTIONS_DIR)) {
  const file = relative(ROOT, path);
  let doc;
  try {
    doc = yaml.load(readFileSync(path, "utf8"));
  } catch (error) {
    fail(file, `YAML не разобрался: ${error.message}`);
    continue;
  }

  const { topic, subtopic, questions } = doc ?? {};
  if (!subtopicsByTopic.has(topic)) fail(file, `тема "${topic}" не описана в topics.yaml`);
  else if (!subtopicsByTopic.get(topic).has(subtopic)) fail(file, `подтема "${subtopic}" не описана в topics.yaml`);
  if (!Array.isArray(questions) || questions.length === 0) {
    fail(file, "нет вопросов");
    continue;
  }

  questions.forEach((q, index) => {
    const where = `${file} [${q?.id ?? `#${index + 1}`}]`;
    for (const key of Object.keys(q ?? {})) {
      if (!QUESTION_KEYS.includes(key)) fail(where, `лишнее поле "${key}"`);
    }
    if (!isText(q.id) || !q.id.startsWith(`${topic}-${subtopic}-`) || !/-\d{3}$/.test(q.id)) {
      fail(where, `id должен быть вида ${topic}-${subtopic}-NNN`);
    } else if (seenIds.has(q.id)) {
      fail(where, `id повторяется, первый раз в ${seenIds.get(q.id)}`);
    } else {
      seenIds.set(q.id, file);
    }
    if (!LEVELS.includes(q.level)) fail(where, `level должен быть одним из ${LEVELS.join(", ")}`);
    if (!isText(q.question)) fail(where, "пустой question");
    if (!isText(q.explanation)) fail(where, "пустой explanation");
    if (q.code !== undefined && !isText(q.code)) fail(where, "пустой code");
    if (q.code !== undefined && !CODE_LANGS.includes(q.codeLang)) fail(where, "у code нет codeLang");
    if (!Array.isArray(q.options) || q.options.length !== 4) {
      fail(where, "вариантов должно быть ровно 4");
    } else {
      const correctCount = q.options.filter((option) => option.correct === true).length;
      if (correctCount !== 1) fail(where, `правильных вариантов ${correctCount}, нужен ровно 1`);
      q.options.forEach((option, optionIndex) => {
        for (const key of Object.keys(option ?? {})) {
          if (!OPTION_KEYS.includes(key)) fail(where, `вариант ${optionIndex + 1}: лишнее поле "${key}"`);
        }
        if (!isText(option.text)) fail(where, `вариант ${optionIndex + 1}: пустой text`);
        if (!isText(option.why)) fail(where, `вариант ${optionIndex + 1}: пустой why`);
        if (option.correct !== undefined && option.correct !== true) {
          fail(where, `вариант ${optionIndex + 1}: correct бывает только true`);
        }
      });
      const texts = q.options.map((option) => option.text?.trim());
      if (new Set(texts).size !== texts.length) fail(where, "одинаковые тексты вариантов");
      const correctOption = q.options.find((option) => option.correct === true);
      const longestWrong = Math.max(...q.options.filter((option) => option !== correctOption).map((option) => option.text?.length ?? 0));
      if (correctOption && correctOption.text.length > 30 && correctOption.text.length > longestWrong * LENGTH_RATIO_LIMIT) {
        warnings.push(`${where}: правильный вариант длиннее остальных (${correctOption.text.length} против ${longestWrong})`);
      }
      // Обратная подсказка: пояснение после тире или двоеточия есть у всех неверных, но не у правильного (или наоборот)
      const hasTail = (text) => /\s—\s|:\s/.test((text ?? "").replace(/`[^`]*`/g, "``"));
      const wrongTails = q.options.filter((option) => option !== correctOption).map((option) => hasTail(option.text));
      if (correctOption && !hasTail(correctOption.text) && wrongTails.every(Boolean)) {
        warnings.push(`${where}: только у правильного варианта нет пояснения после тире или двоеточия`);
      }
      if (correctOption && hasTail(correctOption.text) && !wrongTails.some(Boolean)) {
        warnings.push(`${where}: только у правильного варианта есть пояснение после тире или двоеточия`);
      }
    }
    // Опечатки со смешанными алфавитами внутри слова (кириллица + латиница) глазом не видны
    const prose = [q.question, q.explanation, ...(q.options ?? []).flatMap((option) => [option.text, option.why])]
      .join(" ")
      .replace(/`[^`]*`/g, " ");
    const mixed = prose.match(/[а-яё][a-z]|[a-z][а-яё]/gi);
    if (mixed) warnings.push(`${where}: в слове смешаны кириллица и латиница: ${mixed.join(", ")}`);
    (q.links ?? []).forEach((link) => {
      if (!/^https:\/\//.test(link)) fail(where, `ссылка не https: ${link}`);
    });
    allQuestions.push({ topic, subtopic, ...q });
  });
}

// Сводка: сколько вопросов каждого уровня в каждой подтеме
const stats = new Map();
for (const q of allQuestions) {
  const key = `${q.topic}/${q.subtopic}`;
  const row = stats.get(key) ?? { junior: 0, middle: 0, senior: 0 };
  row[q.level] = (row[q.level] ?? 0) + 1;
  stats.set(key, row);
}
console.log("подтема".padEnd(28), "junior middle senior  всего");
for (const [key, row] of [...stats].sort()) {
  const total = row.junior + row.middle + row.senior;
  console.log(key.padEnd(28), String(row.junior).padStart(6), String(row.middle).padStart(6), String(row.senior).padStart(6), String(total).padStart(6));
}
console.log(`Всего вопросов: ${allQuestions.length}`);

const longestCorrect = allQuestions.filter((q) => {
  const correctLength = q.options?.find((option) => option.correct === true)?.text?.length ?? 0;
  return q.options?.every((option) => option.correct === true || (option.text?.length ?? 0) < correctLength);
}).length;
console.log(`Правильный вариант строго самый длинный: ${longestCorrect} из ${allQuestions.length} (норма — около четверти)`);

if (warnings.length > 0) {
  console.warn(`\nПредупреждений: ${warnings.length}`);
  warnings.forEach((warning) => console.warn(`  ${warning}`));
}

if (errors.length > 0) {
  console.error(`\nОшибок: ${errors.length}`);
  errors.forEach((error) => console.error(`  ${error}`));
  process.exit(1);
}

if (process.argv.includes("--build")) {
  mkdirSync(join(ROOT, "dist"), { recursive: true });
  const output = { topics: topicsDoc.topics, questions: allQuestions };
  writeFileSync(join(ROOT, "dist", "questions.json"), JSON.stringify(output, null, 2));
  console.log("Собрано: dist/questions.json");
}
