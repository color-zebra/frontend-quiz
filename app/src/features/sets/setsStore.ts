import { createStore, del, entries, set } from "idb-keyval";
import type { QuestionsFile } from "../../data/types";

/** Свой набор вопросов на устройстве. */
export interface SetRecord {
  /** Постоянный id, выводится из ссылки: тот же файл после удаления и повторного добавления сохранит заметки. */
  id: string;
  /** Ссылка на сырой файл, по ней набор обновляется. */
  url: string;
  title: string;
  addedAt: number;
  updatedAt: number;
  /** Сколько вопросов пропущено при последней загрузке. */
  skipped: number;
  file: QuestionsFile;
}

// Отдельная база IndexedDB: idb-keyval держит одно хранилище на базу.
const store = createStore("frontend-quiz-sets", "sets");

export async function readAllSets(): Promise<SetRecord[]> {
  const all = await entries<string, SetRecord>(store);
  return all.map(([, record]) => record).filter((r) => r && typeof r.id === "string" && !!r.file);
}

export function writeSet(record: SetRecord) {
  return set(record.id, record, store);
}

export function deleteSetRecord(id: string) {
  return del(id, store);
}

/** id набора по ссылке: короткий хэш FNV-1a. */
export function getSetId(url: string) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < url.length; i++) {
    hash ^= url.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return `set-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}
