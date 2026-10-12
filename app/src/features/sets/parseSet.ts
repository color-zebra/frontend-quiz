import { load } from "js-yaml";
import { CODE_LANGS, LEVELS, UNGROUPED, type CodeLang, type Level, type Option, type Question, type QuestionsFile, type Topic } from "../../data/types";

export interface ParsedSet {
  file: QuestionsFile;
  /** Сколько вопросов не удалось прочитать или они повторили id. */
  skipped: number;
}

type Raw = Record<string, unknown>;

function isText(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

function isRecord(value: unknown): value is Raw {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

/** YAML превращает `text: 42` в число — для вариантов и id это всё равно текст. */
function asText(value: unknown) {
  return typeof value === "number" ? String(value) : value;
}

function readOption(raw: unknown): Option | null {
  if (!isRecord(raw)) return null;
  const text = asText(raw.text);
  if (!isText(text)) return null;
  return { text, why: isText(raw.why) ? raw.why : "", ...(raw.correct === true ? { correct: true } : {}) };
}

/**
 * Один вопрос набора. Проверка «на совести автора»: всё, что не получается показать, —
 * нет id, текста, уровня, вариантов или правильного варианта — пропускаем без подробностей.
 */
function readQuestion(raw: unknown, fileTopic: string | undefined, fileSubtopic: string | undefined): Question | null {
  if (!isRecord(raw)) return null;
  const id = asText(raw.id);
  if (!isText(id) || !isText(raw.question) || !LEVELS.includes(raw.level as Level)) return null;
  if (!Array.isArray(raw.options)) return null;

  const options = raw.options.map(readOption);
  if (options.length < 2 || options.some((o) => o === null)) return null;
  const validOptions = options as Option[];
  if (!validOptions.some((o) => o.correct)) return null;

  const code = isText(raw.code) ? raw.code : undefined;
  const links = Array.isArray(raw.links) ? raw.links.filter((l): l is string => isText(l) && l.startsWith("https://")) : [];

  return {
    id: id.trim(),
    topic: isText(raw.topic) ? raw.topic.trim() : (fileTopic ?? UNGROUPED),
    subtopic: isText(raw.subtopic) ? raw.subtopic.trim() : (fileSubtopic ?? UNGROUPED),
    level: raw.level as Level,
    question: raw.question,
    ...(code ? { code, codeLang: CODE_LANGS.includes(raw.codeLang as CodeLang) ? (raw.codeLang as CodeLang) : "text" } : {}),
    ...(raw.multiple === true ? { multiple: true } : {}),
    options: validOptions,
    explanation: isText(raw.explanation) ? raw.explanation : "",
    ...(links.length ? { links } : {}),
  };
}

/** Темы и подтемы набора — из того, что встретилось в вопросах, в порядке появления. */
function collectTopics(questions: readonly Question[]): Topic[] {
  const topics = new Map<string, Topic>();
  for (const q of questions) {
    const topic = topics.get(q.topic) ?? { id: q.topic, title: q.topic, subtopics: [] };
    if (!topic.subtopics.some((s) => s.id === q.subtopic)) topic.subtopics.push({ id: q.subtopic, title: q.subtopic });
    topics.set(q.topic, topic);
  }
  return [...topics.values()];
}

/**
 * Разбирает файл набора. Понимает два вида:
 * - формат набора: `title` и `questions`, тема у каждого вопроса в поле `topic` (необязательно);
 * - файл подтемы из нашей базы: `topic` и `subtopic` в начале файла, у вопросов их нет.
 */
export function parseSetFile(text: string, fallbackTitle: string): ParsedSet {
  let doc: unknown;
  try {
    doc = load(text);
  } catch {
    throw new Error("Не удалось разобрать набор: файл не читается как YAML");
  }
  if (!isRecord(doc) || !Array.isArray(doc.questions)) {
    throw new Error("Не удалось разобрать набор: в файле нет списка questions");
  }

  const fileTopic = isText(doc.topic) ? doc.topic.trim() : undefined;
  const fileSubtopic = isText(doc.subtopic) ? doc.subtopic.trim() : undefined;
  const seen = new Set<string>();
  const questions: Question[] = [];
  let skipped = 0;
  for (const raw of doc.questions) {
    const question = readQuestion(raw, fileTopic, fileSubtopic);
    // Повтор id — берём первый вопрос: к id привязаны заметки.
    if (!question || seen.has(question.id)) {
      skipped++;
      continue;
    }
    seen.add(question.id);
    questions.push(question);
  }
  if (questions.length === 0) throw new Error("В наборе нет ни одного вопроса, который удалось прочитать");

  return {
    file: { title: isText(doc.title) ? doc.title.trim() : fallbackTitle, topics: collectTopics(questions), questions },
    skipped,
  };
}
