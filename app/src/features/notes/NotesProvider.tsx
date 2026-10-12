import { createContext, use, useEffect, useState, type ReactNode } from "react";
import type { Question, QuestionBank } from "../../data/types";
import { deleteNoteRecord, readAllNotes, writeNote, writeNotes } from "./notesStore";
import { BUILTIN_SET, getNoteKey, type Note } from "./types";

/** ready — заметки сохраняются; unavailable — IndexedDB не работает, заметки живут до закрытия вкладки. */
export type NotesStatus = "loading" | "ready" | "unavailable";

export interface ImportStats {
  added: number;
  updated: number;
  skipped: number;
}

interface NotesContextValue {
  notes: Map<string, Note>;
  status: NotesStatus;
  getNote: (questionId: string) => Note | undefined;
  saveNote: (question: Question, text: string) => void;
  deleteNote: (key: string) => void;
  importNotes: (incoming: readonly Note[]) => ImportStats;
}

const NotesContext = createContext<NotesContextValue | null>(null);

export function NotesProvider({ bank, children }: { bank: QuestionBank; children: ReactNode }) {
  const [notes, setNotes] = useState<Map<string, Note>>(new Map());
  const [status, setStatus] = useState<NotesStatus>("loading");

  useEffect(() => {
    readAllNotes()
      .then((list) => {
        // Заметки, сохранённые до окончания чтения, свежее прочитанных — не затираем их.
        setNotes((prev) => new Map([...list.map((n) => [n.key, n] as const), ...prev]));
        setStatus("ready");
      })
      .catch(() => setStatus("unavailable"));
  }, []);

  // Состояние обновляем сразу, запись в IndexedDB идёт следом. Если она упала — предупреждаем,
  // но введённое не теряем до закрытия вкладки.
  function persist(operation: Promise<unknown>) {
    operation.catch(() => setStatus("unavailable"));
  }

  function getNote(questionId: string) {
    return notes.get(getNoteKey(BUILTIN_SET, questionId));
  }

  function deleteNote(key: string) {
    setNotes((prev) => {
      const next = new Map(prev);
      next.delete(key);
      return next;
    });
    persist(deleteNoteRecord(key));
  }

  function saveNote(question: Question, text: string) {
    const key = getNoteKey(BUILTIN_SET, question.id);
    if (!text.trim()) {
      deleteNote(key);
      return;
    }
    const topic = bank.topicById.get(question.topic);
    const note: Note = {
      key,
      setId: BUILTIN_SET,
      questionId: question.id,
      text: text.trim(),
      updatedAt: Date.now(),
      snapshot: {
        question: question.question.trim(),
        topicTitle: topic?.title ?? question.topic,
        subtopicTitle: topic?.subtopics.find((s) => s.id === question.subtopic)?.title ?? question.subtopic,
        level: question.level,
      },
    };
    setNotes((prev) => new Map(prev).set(key, note));
    persist(writeNote(note));
  }

  /** Слияние с файлом: побеждает более свежая версия заметки. */
  function importNotes(incoming: readonly Note[]): ImportStats {
    const stats: ImportStats = { added: 0, updated: 0, skipped: 0 };
    const changed: Note[] = [];
    for (const note of incoming) {
      const existing = notes.get(note.key);
      if (!existing) stats.added++;
      else if (note.updatedAt > existing.updatedAt) stats.updated++;
      else {
        stats.skipped++;
        continue;
      }
      changed.push(note);
    }
    if (changed.length > 0) {
      setNotes((prev) => {
        const next = new Map(prev);
        for (const note of changed) next.set(note.key, note);
        return next;
      });
      persist(writeNotes(changed));
    }
    return stats;
  }

  return <NotesContext value={{ notes, status, getNote, saveNote, deleteNote, importNotes }}>{children}</NotesContext>;
}

export function useNotes() {
  const value = use(NotesContext);
  if (!value) throw new Error("useNotes вызван вне NotesProvider");
  return value;
}
