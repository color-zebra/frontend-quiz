import { createStore, get, set } from "idb-keyval";
import type { QuestionsFile } from "./types";

// Копия базы на устройстве. Отдельная база IndexedDB: idb-keyval не умеет держать
// несколько хранилищ в одной базе, а заметки уже живут в "frontend-quiz".
const store = createStore("frontend-quiz-bank", "bank");
const KEY = "builtin";

export function readSavedQuestions() {
  return get<QuestionsFile>(KEY, store);
}

export function saveQuestions(file: QuestionsFile) {
  return set(KEY, file, store);
}
