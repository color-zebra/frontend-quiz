import { createStore, del, entries, set } from "idb-keyval";
import type { QuestionsFile } from "../../data/types";

/** Свой набор вопросов на устройстве. */
export interface SetRecord {
  /**
   * Постоянный id: из ссылки или из имени файла. Тот же набор после удаления и повторного добавления
   * получит тот же id и сохранит заметки, а повторная загрузка файла с тем же именем обновит набор.
   */
  id: string;
  /** Ссылка на сырой файл, по ней набор обновляется. Нет у набора, загруженного из файла. */
  url?: string;
  /** Имя файла, если набор загружен с устройства. */
  fileName?: string;
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
  return all.map(([, record]) => record).filter((r) => r && typeof r.id === "string" && !!r.file && (!!r.url || !!r.fileName));
}

export function writeSet(record: SetRecord) {
  return set(record.id, record, store);
}

export function deleteSetRecord(id: string) {
  return del(id, store);
}

/** id набора: короткий хэш FNV-1a от ссылки или от "file:<имя файла>". */
export function getSetId(source: string) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < source.length; i++) {
    hash ^= source.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return `set-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}
