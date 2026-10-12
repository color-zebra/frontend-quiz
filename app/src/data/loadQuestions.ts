import { readSavedQuestions, saveQuestions } from "./questionsStore";
import type { QuestionBank, QuestionsFile } from "./types";

// questions.json лежит рядом с приложением: на GitHub Pages его кладёт сборка,
// в режиме разработки отдаёт плагин из vite.config.ts.
const QUESTIONS_URL = `${import.meta.env.BASE_URL}questions.json`;

export function createBank(file: QuestionsFile): QuestionBank {
  return {
    ...file,
    byId: new Map(file.questions.map((q) => [q.id, q])),
    topicById: new Map(file.topics.map((t) => [t.id, t])),
  };
}

function isQuestionsFile(value: unknown): value is QuestionsFile {
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
  if (isQuestionsFile(saved)) return createBank(saved);

  const file = await fetchQuestions();
  // Не удалось сохранить — работаем без копии, в следующий раз база скачается снова.
  await saveQuestions(file).catch(() => undefined);
  return createBank(file);
}

export interface BankDiff {
  added: number;
  changed: number;
  removed: number;
}

/** Сравнение баз по id: новые, изменённые (любое поле) и удалённые вопросы. */
export function getBankDiff(previous: QuestionsFile, next: QuestionsFile): BankDiff {
  const before = new Map(previous.questions.map((q) => [q.id, JSON.stringify(q)]));
  const diff: BankDiff = { added: 0, changed: 0, removed: 0 };
  const nextIds = new Set<string>();
  for (const question of next.questions) {
    nextIds.add(question.id);
    const old = before.get(question.id);
    if (old === undefined) diff.added++;
    else if (old !== JSON.stringify(question)) diff.changed++;
  }
  for (const id of before.keys()) if (!nextIds.has(id)) diff.removed++;
  return diff;
}

/** Скачивает свежую базу, сохраняет её на устройстве и возвращает вместе со сводкой изменений. */
export async function updateBank(current: QuestionBank): Promise<{ bank: QuestionBank; diff: BankDiff }> {
  const file = await fetchQuestions();
  await saveQuestions(file).catch(() => undefined);
  return { bank: createBank(file), diff: getBankDiff(current, file) };
}
