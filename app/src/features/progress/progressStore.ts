import { createStore, entries, set } from "idb-keyval";
import { isAnswerRecord, type AnswerRecord } from "./types";

// Отдельная база IndexedDB под ленту ответов. Ключ — время записи и случайный хвост: записи только добавляются.
const store = createStore("frontend-quiz-progress", "answers");

/** Вся лента: пары [ключ, запись], от старых к новым. */
export async function readAllAnswers(): Promise<[string, AnswerRecord][]> {
  const all = await entries<string, unknown>(store);
  return all
    .filter((entry): entry is [string, AnswerRecord] => isAnswerRecord(entry[1]))
    .sort(([, a], [, b]) => a.at - b.at);
}

export function writeAnswer(key: string, record: AnswerRecord) {
  return set(key, record, store);
}

export function createRecordKey(record: AnswerRecord) {
  return `${record.at.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
