import { downloadFile } from "../../shared/lib/download";
import { isBookmark, type Bookmark } from "../bookmarks/BookmarksProvider";
import { isCourseProgress, type CourseProgress } from "../lessons/lessonsStore";
import { isNote, type Note } from "../notes/types";
import { isAnswerRecord, type AnswerRecord } from "../progress/types";

// Метка формата осталась от прежнего названия и от выгрузки одних заметок: смени её — и старые файлы перестанут
// загружаться. Версия 1 — только заметки, версия 2 — заметки, лента ответов и закладки (их может не быть),
// версия 3 — ещё прогресс уроков. Старое приложение версию не сверяет: копию 3 оно примет, а уроки пропустит.
// Массив notes нужен всегда, даже пустой, — без него старое приложение копию отвергнет.
const FORMAT = "frontend-quiz-notes";
const VERSION = 3;

interface BackupFile {
  format: typeof FORMAT;
  version: number;
  exportedAt: string;
  notes: Note[];
  answers?: AnswerRecord[];
  bookmarks?: Bookmark[];
  lessons?: CourseProgress[];
}

export interface Backup {
  notes: Note[];
  /** null — старый файл, где были только заметки. */
  answers: AnswerRecord[] | null;
  bookmarks: Bookmark[];
  /** null — копия из версии приложения без уроков: свой прогресс уроков не трогаем. */
  lessons: CourseProgress[] | null;
}

/** Резервная копия: заметки, все ответы, закладки и прогресс уроков — одним файлом для другого устройства. */
export function exportBackup(
  notes: readonly Note[],
  answers: readonly AnswerRecord[],
  bookmarks: readonly Bookmark[],
  lessons: readonly CourseProgress[],
) {
  const file: BackupFile = {
    format: FORMAT,
    version: VERSION,
    exportedAt: new Date().toISOString(),
    notes: [...notes],
    answers: [...answers],
    bookmarks: [...bookmarks],
    lessons: [...lessons],
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
    bookmarks: Array.isArray(file.bookmarks) ? file.bookmarks.filter(isBookmark) : [],
    lessons: Array.isArray(file.lessons) ? file.lessons.filter(isCourseProgress) : null,
  };
}
