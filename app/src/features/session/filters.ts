import { LEVELS, type Level, type Question, type QuestionBank } from "../../data/types";
import { readStorageJson, writeStorage } from "../../shared/lib/storage";

export type SessionLength = 10 | 20 | 30 | "infinite";

export const SESSION_LENGTHS: readonly SessionLength[] = [10, 20, 30, "infinite"];

export interface Filters {
  topics: string[];
  /** Выключенные подтемы в виде "topic/subtopic". Храним исключения, чтобы новые подтемы включались сами. */
  excludedSubtopics: string[];
  levels: Level[];
  length: SessionLength;
}

const STORAGE_KEY = "fq.filters.v1";

export function getSubtopicKey(topic: string, subtopic: string) {
  return `${topic}/${subtopic}`;
}

function getDefaultFilters(bank: QuestionBank): Filters {
  return {
    topics: bank.topics.map((t) => t.id),
    excludedSubtopics: [],
    levels: [...LEVELS],
    length: 20,
  };
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}

/** Читает сохранённые фильтры и выбрасывает из них то, чего больше нет в базе. */
export function loadFilters(bank: QuestionBank): Filters {
  const defaults = getDefaultFilters(bank);
  const saved = readStorageJson(STORAGE_KEY) as Partial<Record<keyof Filters, unknown>> | null;
  if (!saved || typeof saved !== "object") return defaults;

  const topics = isStringArray(saved.topics) ? saved.topics.filter((id) => bank.topicById.has(id)) : defaults.topics;
  const excludedSubtopics = isStringArray(saved.excludedSubtopics) ? saved.excludedSubtopics : [];
  const levels = isStringArray(saved.levels)
    ? LEVELS.filter((l) => (saved.levels as string[]).includes(l))
    : defaults.levels;
  const length = SESSION_LENGTHS.includes(saved.length as SessionLength) ? (saved.length as SessionLength) : defaults.length;

  return { topics, excludedSubtopics, levels, length };
}

export function saveFilters(filters: Filters) {
  writeStorage(STORAGE_KEY, JSON.stringify(filters));
}

export function getPool(bank: QuestionBank, filters: Filters): Question[] {
  const topics = new Set(filters.topics);
  const excluded = new Set(filters.excludedSubtopics);
  const levels = new Set(filters.levels);
  return bank.questions.filter(
    (q) => topics.has(q.topic) && levels.has(q.level) && !excluded.has(getSubtopicKey(q.topic, q.subtopic)),
  );
}

export function toggleItem<T>(items: readonly T[], item: T): T[] {
  return items.includes(item) ? items.filter((i) => i !== item) : [...items, item];
}
