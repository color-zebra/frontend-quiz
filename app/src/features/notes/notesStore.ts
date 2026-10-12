import { createStore, del, entries, set, setMany } from "idb-keyval";
import { isNote, type Note } from "./types";

// Отдельная база IndexedDB под заметки. Ключ записи — note.key.
const store = createStore("frontend-quiz", "notes");

export async function readAllNotes(): Promise<Note[]> {
  const all = await entries<string, unknown>(store);
  return all.map(([, value]) => value).filter(isNote);
}

export function writeNote(note: Note) {
  return set(note.key, note, store);
}

export function writeNotes(notes: readonly Note[]) {
  return setMany(
    notes.map((n) => [n.key, n]),
    store,
  );
}

export function deleteNoteRecord(key: string) {
  return del(key, store);
}
