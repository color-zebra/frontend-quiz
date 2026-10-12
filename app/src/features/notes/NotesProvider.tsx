import { createContext, use, useEffect, useState, type ReactNode } from "react";
import { getTopicTitles } from "../../data/titles";
import type { Question, QuestionBank } from "../../data/types";
import { deleteNoteRecord, readAllNotes, writeNote, writeNotes } from "./notesStore";
import { getNoteKey, type Note } from "./types";

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
  getNote: (setId: string, questionId: string) => Note | undefined;
  saveNote: (bank: QuestionBank, question: Question, text: string) => void;
  deleteNote: (key: string) => void;
  importNotes: (incoming: readonly Note[]) => ImportStats;
}

const NotesContext = createContext<NotesContextValue | null>(null);

export function NotesProvider({ children }: { children: ReactNode }) {
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

  function getNote(setId: string, questionId: string) {
    return notes.get(getNoteKey(setId, questionId));
  }

  function deleteNote(key: string) {
    setNotes((prev) => {
      const next = new Map(prev);
      next.delete(key);
      return next;
    });
    persist(deleteNoteRecord(key));
  }

  function saveNote(bank: QuestionBank, question: Question, text: string) {
    const key = getNoteKey(bank.setId, question.id);
    if (!text.trim()) {
      deleteNote(key);
      return;
    }
    const { topicTitle, subtopicTitle } = getTopicTitles(bank, question);
    const note: Note = {
      key,
      setId: bank.setId,
      questionId: question.id,
      text: text.trim(),
      updatedAt: Date.now(),
      snapshot: {
        question: question.question.trim(),
        topicTitle,
        subtopicTitle,
        level: question.level,
        ...(bank.title ? { setTitle: bank.title } : {}),
        ...(question.type === "speech" ? { speech: true } : {}),
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
