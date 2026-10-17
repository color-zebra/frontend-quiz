import { load } from "js-yaml";
import {
  CODE_LANGS,
  LEVELS,
  UNGROUPED,
  type CodeLang,
  type Lesson,
  type Level,
  type Option,
  type Question,
  type QuestionsFile,
  type Topic,
} from "../../data/types";
import { plural } from "../../shared/lib/plural";

/** Пропущенный вопрос или урок: как его узнать в файле и почему он не подошёл. */
export interface SkippedQuestion {
  /** «q-12» или «№7», если у вопроса нет id; у урока — «урок req-intro» или «урок №3». */
  label: string;
  reason: string;
}

export interface ParsedSet {
  file: QuestionsFile;
  /** Вопросы и уроки, которые не удалось прочитать или которые повторили id. */
  skipped: SkippedQuestion[];
  /** Замечания к файлу, которые не мешают загрузке, например слишком длинное название подтемы. */
  warnings: string[];
}

/** Как в проверке нашей базы: подтема — чип одной строкой на экране от 360px, даже с трёхзначным числом. */
const SUBTOPIC_TITLE_LIMIT = 36;
const CHAR_FORMS = ["символ", "символа", "символов"] as const;

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

function getLongSubtopicWarnings(topics: readonly Topic[]) {
  return topics.flatMap((topic) =>
    topic.subtopics
      .filter((s) => s.title.length > SUBTOPIC_TITLE_LIMIT)
      .map(
        (s) =>
          `Подтема «${s.title}» — ${s.title.length} ${plural(s.title.length, CHAR_FORMS)}: на телефоне не влезет в одну строку, лучше до ${SUBTOPIC_TITLE_LIMIT}`,
      ),
  );
}

/** Как урок называют в отчёте: в журнале «Что пропущено» он стоит рядом с вопросами. */
function getLessonLabel(raw: unknown, index: number) {
  const id = isRecord(raw) ? asText(raw.id) : undefined;
  return `урок ${isText(id) ? id.trim() : `№${index + 1}`}`;
}

/**
 * Вопросы урока: явный список `questions` в его порядке, иначе тестовые вопросы той же темы и подтемы в порядке
 * файла, иначе ни одного. Тема урока без своей — как у вопроса без своей: тема файла или «Все вопросы».
 */
function getLessonQuestionIds(
  raw: Raw,
  lesson: { id: string; topic?: string; subtopic?: string },
  questions: readonly Question[],
  fileTopic: string | undefined,
  warnings: string[],
) {
  if (Array.isArray(raw.questions)) {
    const known = new Set(questions.map((q) => q.id));
    const ids = [...new Set(raw.questions.map(asText).filter(isText).map((id) => id.trim()))];
    const unknown = ids.filter((id) => !known.has(id));
    if (unknown.length) {
      warnings.push(
        `Урок «${lesson.id}»: ${unknown.length > 1 ? "нет вопросов" : "нет вопроса"} ${unknown.map((id) => `«${id}»`).join(", ")} — в файле такого id нет или вопрос пропущен`,
      );
    }
    return ids.filter((id) => known.has(id));
  }
  if (raw.questions !== undefined) {
    warnings.push(`Урок «${lesson.id}»: questions — это список id вопросов, например [q-1, q-2]; вопросы взяты по подтеме`);
  }
  if (!lesson.subtopic) return [];
  const topic = lesson.topic ?? fileTopic ?? UNGROUPED;
  const ids = questions.filter((q) => q.topic === topic && q.subtopic === lesson.subtopic).map((q) => q.id);
  if (ids.length === 0) {
    warnings.push(
      `Урок «${lesson.id}»: в подтеме «${lesson.subtopic}» темы «${topic}» нет тестовых вопросов — после урока сразу следующий. Проверь topic и subtopic урока`,
    );
  }
  return ids;
}

/** Урок без вопросов: их подбирают, только когда ясно, что урок не пропущен. */
function readLesson(raw: unknown): Omit<Lesson, "questionIds"> | string {
  if (!isRecord(raw)) return "это не урок — нет полей id, title и body";
  const id = asText(raw.id);
  if (!isText(id)) return "нет id";
  const title = asText(raw.title);
  if (!isText(title)) return "нет названия (title)";
  if (!isText(raw.body)) return "нет текста урока (body)";
  return {
    id: id.trim(),
    title: title.trim(),
    ...(isText(raw.topic) ? { topic: raw.topic.trim() } : {}),
    ...(isText(raw.subtopic) ? { subtopic: raw.subtopic.trim() } : {}),
    body: raw.body,
  };
}

/**
 * Уроки режима обучения в порядке файла. Урок без id, названия или текста и урок с повторным id пропускаются
 * с причиной, как вопросы. Старые версии приложения раздел lessons просто не читают — вопросы у них работают.
 */
function readLessons(raw: unknown, questions: readonly Question[], fileTopic: string | undefined, skipped: SkippedQuestion[], warnings: string[]) {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw)) {
    warnings.push("lessons — это список уроков вида «- id: … title: … body: …»; уроки не загружены");
    return [];
  }
  const seen = new Set<string>();
  const lessons: Lesson[] = [];
  for (const [index, item] of raw.entries()) {
    const label = getLessonLabel(item, index);
    const result = readLesson(item);
    if (typeof result === "string") {
      skipped.push({ label, reason: result });
      continue;
    }
    // Повтор id — берём первый урок: к id привязана отметка «прочитан».
    if (seen.has(result.id)) {
      skipped.push({ label, reason: "такой id урока уже был выше в файле" });
      continue;
    }
    seen.add(result.id);
    lessons.push({ ...result, questionIds: getLessonQuestionIds(item as Raw, result, questions, fileTopic, warnings) });
  }
  return lessons;
}

/**
 * Разбирает файл набора. Понимает два вида:
 * - формат набора: `title` и `questions`, тема у каждого вопроса в поле `topic` (необязательно);
 * - файл подтемы из нашей базы: `topic` и `subtopic` в начале файла, у вопросов их нет.
 * `kind: speech` в начале файла делает набор устным: у вопросов вместо вариантов `answer` и `points`.
 * Необязательный раздел `lessons` в тестовом наборе — уроки режима обучения.
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

  const topics = collectTopics(questions);
  const warnings = getLongSubtopicWarnings(topics);
  let lessons: Lesson[] = [];
  if (kind === "test") lessons = readLessons(doc.lessons, questions, fileTopic, skipped, warnings);
  else if (doc.lessons !== undefined) warnings.push("Уроки работают только в тестовых наборах — в устном наборе они не показываются");
  return {
    file: {
      title: isText(doc.title) ? doc.title.trim() : fallbackTitle,
      topics,
      questions: kind === "test" ? questions : [],
      speech: kind === "speech" ? questions : [],
      ...(lessons.length ? { lessons } : {}),
    },
    skipped,
    warnings,
  };
}
