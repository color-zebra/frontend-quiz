import { downloadFile } from "../../shared/lib/download";
import { isNote, type Note } from "./types";

const FORMAT = "frontend-quiz-notes";
const VERSION = 1;

interface NotesFile {
  format: typeof FORMAT;
  version: number;
  exportedAt: string;
  notes: Note[];
}

export function exportNotes(notes: readonly Note[]) {
  const file: NotesFile = { format: FORMAT, version: VERSION, exportedAt: new Date().toISOString(), notes: [...notes] };
  const date = file.exportedAt.slice(0, 10);
  downloadFile(`frontend-quiz-notes-${date}.json`, JSON.stringify(file, null, 2), "application/json");
}

/** Разбирает файл выгрузки. Бросает ошибку с понятным текстом, если это не наш файл. */
export function parseNotesFile(text: string): Note[] {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Файл не похож на JSON");
  }
  const file = data as Partial<NotesFile> | null;
  if (!file || file.format !== FORMAT || !Array.isArray(file.notes)) {
    throw new Error("Это не файл заметок Frontend Quiz");
  }
  return file.notes.filter(isNote);
}
