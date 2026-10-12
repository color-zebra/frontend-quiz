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
const QUESTION_KEYS = ["id", "level", "tags", "question", "code", "codeLang", "multiple", "options", "explanation", "links", "source"];
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
    if (q.multiple !== undefined && q.multiple !== true) fail(where, "multiple бывает только true");
    // Вопрос с несколькими ответами: больше одного correct или явный multiple: true (галочки при одном правильном,
    // чтобы вид вопроса не подсказывал, сколько ответов верны).
    const correctCount = Array.isArray(q.options) ? q.options.filter((option) => option?.correct === true).length : 0;
    const isMultiple = q.multiple === true || correctCount > 1;
    if (!Array.isArray(q.options)) {
      fail(where, "нет вариантов");
    } else if (!isMultiple && q.options.length !== 4) {
      fail(where, "вариантов должно быть ровно 4");
    } else if (isMultiple && (q.options.length < 4 || q.options.length > 6)) {
      fail(where, "в вопросе с несколькими ответами вариантов должно быть от 4 до 6");
    } else {
      if (correctCount === 0) fail(where, "нет правильного варианта");
      if (correctCount === q.options.length) fail(where, "все варианты правильные — ответ угадывается без знаний");
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
      const correctOptions = q.options.filter((option) => option.correct === true);
      const wrongOptions = q.options.filter((option) => option.correct !== true);
      const lengthOf = (option) => option.text?.length ?? 0;
      if (correctOptions.length === 1) {
        const [correctOption] = correctOptions;
        const longestWrong = Math.max(...wrongOptions.map(lengthOf));
        if (lengthOf(correctOption) > 30 && lengthOf(correctOption) > longestWrong * LENGTH_RATIO_LIMIT) {
          warnings.push(`${where}: правильный вариант длиннее остальных (${lengthOf(correctOption)} против ${longestWrong})`);
        }
      } else if (correctOptions.length > 1) {
        // Несколько правильных: сравниваем средние длины групп.
        const average = (options) => Math.round(options.reduce((sum, option) => sum + lengthOf(option), 0) / options.length);
        const correctAverage = average(correctOptions);
        const wrongAverage = average(wrongOptions);
        if (correctAverage > 30 && correctAverage > wrongAverage * LENGTH_RATIO_LIMIT) {
          warnings.push(`${where}: правильные варианты в среднем длиннее неправильных (${correctAverage} против ${wrongAverage})`);
        }
      }
      // Обратная подсказка: пояснение после тире или двоеточия есть у всех неверных, но не у правильных (или наоборот)
      const hasTail = (text) => /\s—\s|:\s/.test((text ?? "").replace(/`[^`]*`/g, "``"));
      const correctTails = correctOptions.map((option) => hasTail(option.text));
      const wrongTails = wrongOptions.map((option) => hasTail(option.text));
      const label = correctOptions.length > 1 ? "правильных вариантов" : "правильного варианта";
      if (correctTails.length > 0 && wrongTails.length > 0 && !correctTails.some(Boolean) && wrongTails.every(Boolean)) {
        warnings.push(`${where}: только у ${label} нет пояснения после тире или двоеточия`);
      }
      if (correctTails.length > 0 && wrongTails.length > 0 && correctTails.every(Boolean) && !wrongTails.some(Boolean)) {
        warnings.push(`${where}: только у ${label} есть пояснение после тире или двоеточия`);
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

// Устные вопросы — отдельная папка speech/<тема>/<подтема>.yaml, с тестовыми не смешиваются.
// Вместо вариантов эталонный ответ answer и необязательные тезисы points.
const SPEECH_DIR = join(ROOT, "speech");
const SPEECH_KEYS = ["id", "level", "tags", "question", "code", "codeLang", "answer", "points", "explanation", "links", "source"];
const allSpeech = [];
const speechFiles = statSync(SPEECH_DIR, { throwIfNoEntry: false })?.isDirectory() ? listYamlFiles(SPEECH_DIR) : [];

for (const path of speechFiles) {
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
      if (!SPEECH_KEYS.includes(key)) fail(where, `лишнее поле "${key}"${key === "options" ? " — у устного вопроса вариантов нет" : ""}`);
    }
    if (!isText(q.id) || !q.id.startsWith(`speech-${topic}-${subtopic}-`) || !/-\d{3}$/.test(q.id)) {
      fail(where, `id должен быть вида speech-${topic}-${subtopic}-NNN`);
    } else if (seenIds.has(q.id)) {
      fail(where, `id повторяется, первый раз в ${seenIds.get(q.id)}`);
    } else {
      seenIds.set(q.id, file);
    }
    if (!LEVELS.includes(q.level)) fail(where, `level должен быть одним из ${LEVELS.join(", ")}`);
    if (!isText(q.question)) fail(where, "пустой question");
    if (!isText(q.answer)) fail(where, "пустой answer — эталонный ответ обязателен");
    if (q.points !== undefined && (!Array.isArray(q.points) || !q.points.every(isText))) fail(where, "points — список непустых строк");
    if (q.code !== undefined && !isText(q.code)) fail(where, "пустой code");
    if (q.code !== undefined && !CODE_LANGS.includes(q.codeLang)) fail(where, "у code нет codeLang");
    (q.links ?? []).forEach((link) => {
      if (!/^https:\/\//.test(link)) fail(where, `ссылка не https: ${link}`);
    });
    const prose = [q.question, q.answer, q.explanation, ...(q.points ?? [])].join(" ").replace(/`[^`]*`/g, " ");
    const mixed = prose.match(/[а-яё][a-z]|[a-z][а-яё]/gi);
    if (mixed) warnings.push(`${where}: в слове смешаны кириллица и латиница: ${mixed.join(", ")}`);
    allSpeech.push({ topic, subtopic, type: "speech", options: [], explanation: "", ...q });
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

// Метрика имеет смысл только для вопросов с одним правильным ответом.
const singleAnswer = allQuestions.filter((q) => q.options?.filter((option) => option.correct === true).length === 1);
const longestCorrect = singleAnswer.filter((q) => {
  const correctLength = q.options.find((option) => option.correct === true)?.text?.length ?? 0;
  return q.options.every((option) => option.correct === true || (option.text?.length ?? 0) < correctLength);
}).length;
console.log(
  `Правильный вариант строго самый длинный: ${longestCorrect} из ${singleAnswer.length} вопросов с одним ответом (норма — около четверти)`,
);
const multipleCount = allQuestions.filter((q) => q.multiple === true || !singleAnswer.includes(q)).length;
console.log(`Вопросов с несколькими ответами (галочки): ${multipleCount}`);
console.log(`Устных вопросов (speech/): ${allSpeech.length}`);

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
  // generatedAt приложение показывает как «база от …».
  const output = { generatedAt: new Date().toISOString(), topics: topicsDoc.topics, questions: allQuestions, speech: allSpeech };
  writeFileSync(join(ROOT, "dist", "questions.json"), JSON.stringify(output, null, 2));
  console.log("Собрано: dist/questions.json");
}
