import { load } from "js-yaml";
import { CODE_LANGS, LEVELS, UNGROUPED, type CodeLang, type Level, type Option, type Question, type QuestionsFile, type Topic } from "../../data/types";

/** Пропущенный вопрос: как его узнать в файле и почему он не подошёл. */
export interface SkippedQuestion {
  /** «q-12» или «№7», если у вопроса нет id. */
  label: string;
  reason: string;
}

export interface ParsedSet {
  file: QuestionsFile;
  /** Вопросы, которые не удалось прочитать или которые повторили id. */
  skipped: SkippedQuestion[];
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

type Kind = "test" | "speech";

/** Устный вопрос набора: вместо вариантов эталонный ответ `answer` и необязательные тезисы `points`. */
function readSpeechQuestion(raw: Raw, fileTopic: string | undefined, fileSubtopic: string | undefined): Question | string {
  const id = asText(raw.id);
  if (!isText(id)) return "нет id";
  if (!isText(raw.question)) return "нет текста вопроса (question)";
  if (raw.level === undefined) return "нет уровня (level)";
  if (!LEVELS.includes(raw.level as Level)) return `непонятный уровень «${String(raw.level)}» — нужен junior, middle или senior`;
  if (raw.options !== undefined) return "у устного вопроса не должно быть вариантов (options)";
  if (!isText(raw.answer)) return "нет эталонного ответа (answer)";

  const code = isText(raw.code) ? raw.code : undefined;
  const links = Array.isArray(raw.links) ? raw.links.filter((l): l is string => isText(l) && l.startsWith("https://")) : [];
  const points = Array.isArray(raw.points) ? raw.points.map(asText).filter(isText) : [];

  return {
    id: id.trim(),
    type: "speech",
    topic: isText(raw.topic) ? raw.topic.trim() : (fileTopic ?? UNGROUPED),
    subtopic: isText(raw.subtopic) ? raw.subtopic.trim() : (fileSubtopic ?? UNGROUPED),
    level: raw.level as Level,
    question: raw.question,
    ...(code ? { code, codeLang: CODE_LANGS.includes(raw.codeLang as CodeLang) ? (raw.codeLang as CodeLang) : "text" } : {}),
    options: [],
    answer: raw.answer,
    ...(points.length ? { points } : {}),
    explanation: isText(raw.explanation) ? raw.explanation : "",
    ...(links.length ? { links } : {}),
  };
}

/**
 * Один вопрос набора. Проверка «на совести автора»: что не получается показать, пропускаем,
 * но запоминаем причину — автору набора она поможет найти ошибку в файле.
 */
function readQuestion(raw: unknown, fileTopic: string | undefined, fileSubtopic: string | undefined): Question | string {
  if (!isRecord(raw)) return "это не вопрос — нет полей id, question и других";
  const id = asText(raw.id);
  if (!isText(id)) return "нет id";
  if (!isText(raw.question)) return "нет текста вопроса (question)";
  if (raw.level === undefined) return "нет уровня (level)";
  if (!LEVELS.includes(raw.level as Level)) return `непонятный уровень «${String(raw.level)}» — нужен junior, middle или senior`;
  if (!Array.isArray(raw.options)) {
    return isText(raw.answer)
      ? "это устный вопрос — устные вопросы живут в отдельном файле с kind: speech"
      : "нет списка вариантов (options)";
  }
  if (raw.options.length < 2) return "меньше двух вариантов";

  const options: Option[] = [];
  for (const [index, option] of raw.options.entries()) {
    const text = isRecord(option) ? asText(option.text) : undefined;
    if (!isRecord(option) || !isText(text)) return `у варианта ${index + 1} нет текста (text)`;
    options.push({ text, why: isText(option.why) ? option.why : "", ...(option.correct === true ? { correct: true } : {}) });
  }
  if (!options.some((o) => o.correct)) return "ни у одного варианта нет correct: true";

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
    options,
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
 * `kind: speech` в начале файла делает набор устным: у вопросов вместо вариантов `answer` и `points`.
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

  // Набор целиком либо тестовый, либо устный — смешивать в одном файле нельзя.
  if (doc.kind !== undefined && doc.kind !== "speech" && doc.kind !== "test") {
    throw new Error("Не удалось разобрать набор: kind может быть только speech (устный набор) или test");
  }
  const kind: Kind = doc.kind === "speech" ? "speech" : "test";
  const fileTopic = isText(doc.topic) ? doc.topic.trim() : undefined;
  const fileSubtopic = isText(doc.subtopic) ? doc.subtopic.trim() : undefined;
  const seen = new Set<string>();
  const questions: Question[] = [];
  const skipped: SkippedQuestion[] = [];
  for (const [index, raw] of doc.questions.entries()) {
    const result =
      kind === "speech"
        ? isRecord(raw)
          ? readSpeechQuestion(raw, fileTopic, fileSubtopic)
          : "это не вопрос — нет полей id, question и других"
        : readQuestion(raw, fileTopic, fileSubtopic);
    const rawId = isRecord(raw) ? asText(raw.id) : undefined;
    const label = isText(rawId) ? rawId.trim() : `№${index + 1}`;
    if (typeof result === "string") {
      skipped.push({ label, reason: result });
      continue;
    }
    // Повтор id — берём первый вопрос: к id привязаны заметки.
    if (seen.has(result.id)) {
      skipped.push({ label, reason: "такой id уже был выше в файле" });
      continue;
    }
    seen.add(result.id);
    questions.push(result);
  }
  if (questions.length === 0) {
    const first = skipped[0];
    throw new Error(
      `В наборе нет ни одного вопроса, который удалось прочитать${first ? `. Например, ${first.label}: ${first.reason}` : ""}`,
    );
  }

  return {
    file: {
      title: isText(doc.title) ? doc.title.trim() : fallbackTitle,
      topics: collectTopics(questions),
      questions: kind === "test" ? questions : [],
      speech: kind === "speech" ? questions : [],
    },
    skipped,
  };
}
