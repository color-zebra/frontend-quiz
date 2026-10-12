import { BUILTIN_SET_ID, LEVELS, type Level, type Question, type QuestionBank } from "../../data/types";
import { readStorageJson, writeStorage } from "../../shared/lib/storage";

export type SessionLength = 10 | 20 | 30 | "infinite";

/** Раздел тренировки: тестовые вопросы или устные. У каждого свои сохранённые фильтры. */
export type TrainingKind = "test" | "speech";

export const SESSION_LENGTHS: readonly SessionLength[] = [10, 20, 30, "infinite"];

export interface Filters {
  topics: string[];
  /** Выключенные подтемы в виде "topic/subtopic". Храним исключения, чтобы новые подтемы включались сами. */
  excludedSubtopics: string[];
  levels: Level[];
  length: SessionLength;
  /** Только в тестовом разделе: примешивать устные вопросы из тех же тем и уровней. */
  withSpeech: boolean;
}

// У тестового раздела основной базы ключ прежний, чтобы сохранённые настройки не сбросились;
// у своих наборов — свой ключ на набор, у устного раздела — свой суффикс.
function getStorageKey(bank: QuestionBank, kind: TrainingKind) {
  const base = bank.setId === BUILTIN_SET_ID ? "fq.filters.v1" : `fq.filters.v1:${bank.setId}`;
  return kind === "speech" ? `${base}:speech` : base;
}

export function getSubtopicKey(topic: string, subtopic: string) {
  return `${topic}/${subtopic}`;
}

function getDefaultFilters(bank: QuestionBank): Filters {
  return {
    topics: bank.topics.map((t) => t.id),
    excludedSubtopics: [],
    levels: [...LEVELS],
    length: 20,
    withSpeech: false,
  };
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}

/** Читает сохранённые фильтры раздела и выбрасывает из них то, чего больше нет в базе. */
export function loadFilters(bank: QuestionBank, kind: TrainingKind): Filters {
  const defaults = getDefaultFilters(bank);
  const saved = readStorageJson(getStorageKey(bank, kind)) as Partial<Record<keyof Filters, unknown>> | null;
  if (!saved || typeof saved !== "object") return defaults;

  const topics = isStringArray(saved.topics) ? saved.topics.filter((id) => bank.topicById.has(id)) : defaults.topics;
  const excludedSubtopics = isStringArray(saved.excludedSubtopics) ? saved.excludedSubtopics : [];
  const levels = isStringArray(saved.levels)
    ? LEVELS.filter((l) => (saved.levels as string[]).includes(l))
    : defaults.levels;
  const length = SESSION_LENGTHS.includes(saved.length as SessionLength) ? (saved.length as SessionLength) : defaults.length;
  const withSpeech = saved.withSpeech === true;

  return { topics, excludedSubtopics, levels, length, withSpeech };
}

export function saveFilters(bank: QuestionBank, kind: TrainingKind, filters: Filters) {
  writeStorage(getStorageKey(bank, kind), JSON.stringify(filters));
}

/** Вопросы раздела: устные — только устные; тестовые — тестовые и, если включена галка, устные. */
export function getSource(bank: QuestionBank, kind: TrainingKind, filters: Filters): Question[] {
  if (kind === "speech") return bank.speech;
  return filters.withSpeech ? [...bank.questions, ...bank.speech] : bank.questions;
}

export function getPool(bank: QuestionBank, kind: TrainingKind, filters: Filters): Question[] {
  const topics = new Set(filters.topics);
  const excluded = new Set(filters.excludedSubtopics);
  const levels = new Set(filters.levels);
  return getSource(bank, kind, filters).filter(
    (q) => topics.has(q.topic) && levels.has(q.level) && !excluded.has(getSubtopicKey(q.topic, q.subtopic)),
  );
}

export function toggleItem<T>(items: readonly T[], item: T): T[] {
  return items.includes(item) ? items.filter((i) => i !== item) : [...items, item];
}
