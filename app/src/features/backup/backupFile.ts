import { downloadFile } from "../../shared/lib/download";
import { isNote, type Note } from "../notes/types";
import { isAnswerRecord, type AnswerRecord } from "../progress/types";

// Метка формата осталась от прежнего названия и от выгрузки одних заметок: смени её — и старые файлы перестанут
// загружаться. Версия 1 — только заметки, версия 2 — заметки и лента ответов.
const FORMAT = "frontend-quiz-notes";
const VERSION = 2;

interface BackupFile {
  format: typeof FORMAT;
  version: number;
  exportedAt: string;
  notes: Note[];
  answers?: AnswerRecord[];
}

export interface Backup {
  notes: Note[];
  /** null — старый файл, где были только заметки. */
  answers: AnswerRecord[] | null;
}

/** Резервная копия: заметки и все ответы — одним файлом, его можно перенести на другое устройство. */
export function exportBackup(notes: readonly Note[], answers: readonly AnswerRecord[]) {
  const file: BackupFile = {
    format: FORMAT,
    version: VERSION,
    exportedAt: new Date().toISOString(),
    notes: [...notes],
    answers: [...answers],
  };
  downloadFile(`zubrilka-backup-${file.exportedAt.slice(0, 10)}.json`, JSON.stringify(file), "application/json");
}

/** Разбирает файл копии — и новый, и старый с одними заметками. Бросает ошибку с понятным текстом, если файл не наш. */
export function parseBackupFile(text: string): Backup {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Файл не похож на JSON");
  }
  const file = data as Partial<BackupFile> | null;
  if (!file || file.format !== FORMAT || !Array.isArray(file.notes)) {
    throw new Error("Это не файл резервной копии Zubrilka");
  }
  return {
    notes: file.notes.filter(isNote),
    answers: Array.isArray(file.answers) ? file.answers.filter(isAnswerRecord) : null,
  };
}
