import type { QuestionBank } from "../../data/types";
import { readStorageJson, removeStorage, writeStorage } from "../../shared/lib/storage";
import { goToNextQuestion, type Session } from "./session";

/**
 * Незаконченная сессия на устройстве. Android выгружает свёрнутое приложение из памяти, и при возврате оно
 * открывается с главной — по сохранённой сессии на главной предлагаем продолжить. Стирается, когда сессия кончилась.
 */
const STORAGE_KEY = "fq.activeSession";

export interface SavedSession {
  /** База, из которой сессия: основная или свой набор. */
  setId: string;
  session: Session;
  /** Достижения, полученные до начала сессии: в итоге покажем добавившиеся. */
  earnedBefore: string[];
}

export function saveSession(saved: SavedSession) {
  writeStorage(STORAGE_KEY, JSON.stringify(saved));
}

export function clearSavedSession() {
  removeStorage(STORAGE_KEY);
}

const isStrings = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((v) => typeof v === "string");

export function readSavedSession(): SavedSession | null {
  const saved = readStorageJson(STORAGE_KEY) as Partial<SavedSession> | null;
  const session = saved?.session as Partial<Session> | undefined;
  const valid =
    !!saved &&
    typeof saved.setId === "string" &&
    !!session &&
    isStrings(session.queue) &&
    isStrings(session.pool) &&
    typeof session.index === "number" &&
    Array.isArray(session.optionOrder) &&
    Array.isArray(session.answers);
  if (!valid) return null;
  return {
    setId: saved.setId as string,
    session: session as Session,
    earnedBefore: isStrings(saved.earnedBefore) ? saved.earnedBefore : [],
  };
}

/**
 * Сессия, которую можно продолжить с этой базой. Вопросы, удалённые из базы за это время, выбрасываются; если
 * текущий вопрос удалён или изменился число вариантов, сессия продолжается со следующего. null — продолжать нечего.
 */
export function restoreSession(bank: QuestionBank, saved: SavedSession): Session | null {
  const { session } = saved;
  const exists = (id: string) => bank.byId.has(id);
  const current = session.queue[session.index];
  const before = session.queue.slice(0, session.index).filter(exists).length;
  const kept = {
    ...session,
    queue: session.queue.filter(exists),
    pool: session.pool.filter(exists),
    answers: session.answers.filter((a) => exists(a.questionId)),
  };
  if (kept.queue.length === 0 || kept.pool.length === 0) return null;

  const currentKept = exists(current) && bank.byId.get(current)!.options.length === session.optionOrder.length;
  if (currentKept) return { ...kept, index: before };

  // Текущего вопроса нет или он изменился — переходим к следующему, как обычная сессия.
  const from = exists(current) ? before : before - 1;
  if (!session.infinite && from + 1 >= kept.queue.length) return null;
  return goToNextQuestion(bank, { ...kept, index: from });
}
