import { createContext, use, useEffect, useRef, useState, type ReactNode } from "react";
import type { SessionAnswer } from "../session/session";
import { createRecordKey, readAllAnswers, writeAnswer } from "./progressStore";
import { applyRecord, getProgressKey, type AnswerRecord, type QuestionProgress } from "./types";

interface ProgressContextValue {
  /** Сводка по вопросу; нет — на вопрос ещё ни разу не отвечали. */
  getProgress: (setId: string, questionId: string) => QuestionProgress | undefined;
  /** Ответ из сессии — сразу в ленту, не дожидаясь конца сессии. */
  recordAnswer: (setId: string, answer: SessionAnswer) => void;
  /** Вопросы исправили в базе — выводим их из ошибок. */
  resetQuestions: (setId: string, questionIds: readonly string[]) => void;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

function buildProgress(records: readonly AnswerRecord[]) {
  const progress = new Map<string, QuestionProgress>();
  for (const record of records) {
    const key = getProgressKey(record.setId, record.questionId);
    progress.set(key, applyRecord(progress.get(key), record));
  }
  return progress;
}

/** Лента ответов на устройстве и сводка по вопросам: ошибки и новые вопросы для фильтров. */
export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<Map<string, QuestionProgress>>(new Map());
  // Записи этой вкладки: если лента дочитается уже после первых ответов, они не потеряются.
  const local = useRef(new Map<string, AnswerRecord>());

  useEffect(() => {
    readAllAnswers().then(
      (saved) => {
        const all = new Map([...saved, ...local.current]);
        setProgress(buildProgress([...all.values()].sort((a, b) => a.at - b.at)));
      },
      // IndexedDB недоступна — ответы считаются до закрытия вкладки.
      () => undefined,
    );
  }, []);

  function add(records: readonly AnswerRecord[]) {
    for (const record of records) {
      const key = createRecordKey(record);
      local.current.set(key, record);
      writeAnswer(key, record).catch(() => undefined);
    }
    setProgress((prev) => {
      const next = new Map(prev);
      for (const record of records) {
        const key = getProgressKey(record.setId, record.questionId);
        next.set(key, applyRecord(next.get(key), record));
      }
      return next;
    });
  }

  function getProgress(setId: string, questionId: string) {
    return progress.get(getProgressKey(setId, questionId));
  }

  function recordAnswer(setId: string, answer: SessionAnswer) {
    add([{ setId, questionId: answer.questionId, at: Date.now(), correct: answer.correct, grade: answer.grade }]);
  }

  function resetQuestions(setId: string, questionIds: readonly string[]) {
    const at = Date.now();
    // Отметка нужна только тем, кто сейчас в ошибках.
    const records = questionIds
      .filter((id) => progress.get(getProgressKey(setId, id))?.mistake)
      .map((questionId): AnswerRecord => ({ setId, questionId, at, reset: true }));
    if (records.length) add(records);
  }

  return <ProgressContext value={{ getProgress, recordAnswer, resetQuestions }}>{children}</ProgressContext>;
}

export function useProgress() {
  const value = use(ProgressContext);
  if (!value) throw new Error("useProgress вызван вне ProgressProvider");
  return value;
}
