import { readSavedQuestions, saveQuestions } from "./questionsStore";
import { BUILTIN_SET_ID, type Question, type QuestionBank, type QuestionsFile } from "./types";

// questions.json лежит рядом с приложением: на GitHub Pages его кладёт сборка,
// в режиме разработки отдаёт плагин из vite.config.ts.
const QUESTIONS_URL = `${import.meta.env.BASE_URL}questions.json`;

export function createBank(file: QuestionsFile, setId: string): QuestionBank {
  const speech = file.speech ?? [];
  return {
    ...file,
    setId,
    speech,
    byId: new Map([...file.questions, ...speech].map((q) => [q.id, q])),
    topicById: new Map(file.topics.map((t) => [t.id, t])),
  };
}

export function isQuestionsFile(value: unknown): value is QuestionsFile {
  const file = value as Partial<QuestionsFile> | null;
  return !!file && Array.isArray(file.topics) && Array.isArray(file.questions);
}

/** Скачивает свежую базу. Метка времени в адресе — чтобы кэш GitHub Pages не отдал старую копию. */
export async function fetchQuestions(): Promise<QuestionsFile> {
  let response: Response;
  try {
    response = await fetch(`${QUESTIONS_URL}?t=${Date.now()}`, { cache: "no-store" });
  } catch {
    throw new Error("Нет связи с сервером");
  }
  if (response.status === 404) {
    throw new Error(
      import.meta.env.DEV
        ? "Нет файла dist/questions.json — выполни pnpm build в корне репозитория"
        : "Файл базы не найден на сервере",
    );
  }
  if (!response.ok) throw new Error(`Сервер ответил ошибкой ${response.status}`);

  const data: unknown = await response.json().catch(() => null);
  if (!isQuestionsFile(data)) throw new Error("Файл базы повреждён");
  return data;
}

/**
 * База при запуске: копия с устройства, если она есть, иначе — скачать и сохранить.
 * В сеть при наличии копии не ходим: свежую базу человек забирает сам кнопкой «Обновить».
 */
export async function loadInitialBank(): Promise<QuestionBank> {
  const saved = await readSavedQuestions().catch(() => undefined);
  if (isQuestionsFile(saved)) return createBank(saved, BUILTIN_SET_ID);

  const file = await fetchQuestions();
  // Не удалось сохранить — работаем без копии, в следующий раз база скачается снова.
  await saveQuestions(file).catch(() => undefined);
  return createBank(file, BUILTIN_SET_ID);
}

export interface BankDiff {
  added: number;
  changed: number;
  removed: number;
  /** Исправленные вопросы: прежние ошибки в них больше не считаются. */
  changedIds: string[];
  /** Уроки режима обучения: у основной базы их нет, и тут всегда нули. */
  lessons: { added: number; changed: number; removed: number };
}

/** Сравнение уроков по id: дописали уроки и нажали «Обновить» — сообщение не должно говорить «не изменился». */
function getLessonsDiff(previous: QuestionsFile, next: QuestionsFile) {
  const before = new Map((previous.lessons ?? []).map((l) => [l.id, JSON.stringify(l)]));
  const diff = { added: 0, changed: 0, removed: 0 };
  const nextIds = new Set<string>();
  for (const lesson of next.lessons ?? []) {
    nextIds.add(lesson.id);
    const old = before.get(lesson.id);
    if (old === undefined) diff.added++;
    else if (old !== JSON.stringify(lesson)) diff.changed++;
  }
  for (const id of before.keys()) if (!nextIds.has(id)) diff.removed++;
  return diff;
}

/** Все вопросы файла — тестовые и устные. */
function getAllQuestions(file: QuestionsFile) {
  return [...file.questions, ...(file.speech ?? [])];
}

/** Содержимое вопроса для сравнения версий. Номер строки в файле — не содержимое: он сдвигается от правок соседей. */
function getContent({ line: _line, ...content }: Question) {
  return JSON.stringify(content);
}

/** Сравнение баз по id: новые, изменённые (любое поле) и удалённые вопросы. */
export function getBankDiff(previous: QuestionsFile, next: QuestionsFile): BankDiff {
  const before = new Map(getAllQuestions(previous).map((q) => [q.id, getContent(q)]));
  const diff: BankDiff = { added: 0, changed: 0, removed: 0, changedIds: [], lessons: getLessonsDiff(previous, next) };
  const nextIds = new Set<string>();
  for (const question of getAllQuestions(next)) {
    nextIds.add(question.id);
    const old = before.get(question.id);
    if (old === undefined) diff.added++;
    else if (old !== getContent(question)) diff.changedIds.push(question.id);
  }
  for (const id of before.keys()) if (!nextIds.has(id)) diff.removed++;
  diff.changed = diff.changedIds.length;
  return diff;
}

/** Скачивает свежую базу, сохраняет её на устройстве и возвращает вместе со сводкой изменений. */
export async function updateBank(current: QuestionBank): Promise<{ bank: QuestionBank; diff: BankDiff }> {
  const file = await fetchQuestions();
  await saveQuestions(file).catch(() => undefined);
  return { bank: createBank(file, BUILTIN_SET_ID), diff: getBankDiff(current, file) };
}
