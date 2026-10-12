import { createContext, use, useEffect, useRef, useState, type ReactNode } from "react";
import type { SessionAnswer } from "../session/session";
import { clearAnswers, createRecordKey, readAllAnswers, writeAnswer } from "./progressStore";
import { applyRecord, getProgressKey, type AnswerRecord, type QuestionProgress } from "./types";

interface ProgressContextValue {
  /** Вся лента ответов, от старых к новым: для статистики («последние 100») и будущих ачивок. */
  records: readonly AnswerRecord[];
  /** Сводка по вопросу; нет — на вопрос ещё ни разу не отвечали. */
  getProgress: (setId: string, questionId: string) => QuestionProgress | undefined;
  /** Ответ из сессии — сразу в ленту, не дожидаясь конца сессии. */
  recordAnswer: (setId: string, answer: SessionAnswer) => void;
  /** Вопросы исправили в базе — выводим их из ошибок. */
  resetQuestions: (setId: string, questionIds: readonly string[]) => void;
  /** Стереть всю ленту на устройстве: ошибки, новые вопросы и статистика — с нуля. */
  resetAll: () => void;
  /** Ответы из резервной копии: добавляются только те, которых ещё нет. Возвращает, сколько добавлено. */
  importRecords: (incoming: readonly AnswerRecord[]) => number;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

/** Одна и та же запись из разных копий совпадает по всем полям — так повторная загрузка не задваивает ленту. */
function getSignature(r: AnswerRecord) {
  return [r.setId, r.questionId, r.at, r.correct, r.grade, r.reset].join("|");
}

function buildProgress(records: readonly AnswerRecord[]) {
  const progress = new Map<string, QuestionProgress>();
  for (const record of records) {
    const key = getProgressKey(record.setId, record.questionId);
    progress.set(key, applyRecord(progress.get(key), record));
  }
  return progress;
}

/** Лента ответов на устройстве и сводка по вопросам: ошибки и новые вопросы для фильтров, статистика. */
export function ProgressProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<AnswerRecord[]>([]);
  const [progress, setProgress] = useState<Map<string, QuestionProgress>>(new Map());
  // Записи этой вкладки: если лента дочитается уже после первых ответов, они не потеряются.
  const local = useRef(new Map<string, AnswerRecord>());

  useEffect(() => {
    readAllAnswers().then(
      (saved) => {
        const all = [...new Map([...saved, ...local.current]).values()].sort((a, b) => a.at - b.at);
        setRecords(all);
        setProgress(buildProgress(all));
      },
      // IndexedDB недоступна — ответы считаются до закрытия вкладки.
      () => undefined,
    );
  }, []);

  function add(added: readonly AnswerRecord[]) {
    for (const record of added) {
      const key = createRecordKey(record);
      local.current.set(key, record);
      writeAnswer(key, record).catch(() => undefined);
    }
    setRecords((prev) => [...prev, ...added]);
    setProgress((prev) => {
      const next = new Map(prev);
      for (const record of added) {
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
    const marks = questionIds
      .filter((id) => progress.get(getProgressKey(setId, id))?.mistake)
      .map((questionId): AnswerRecord => ({ setId, questionId, at, reset: true }));
    if (marks.length) add(marks);
  }

  function importRecords(incoming: readonly AnswerRecord[]) {
    const known = new Set(records.map(getSignature));
    const fresh = incoming.filter((record) => {
      const signature = getSignature(record);
      if (known.has(signature)) return false;
      known.add(signature);
      return true;
    });
    for (const record of fresh) {
      const key = createRecordKey(record);
      local.current.set(key, record);
      writeAnswer(key, record).catch(() => undefined);
    }
    const all = [...records, ...fresh].sort((a, b) => a.at - b.at);
    setRecords(all);
    setProgress(buildProgress(all));
    return fresh.length;
  }

  function resetAll() {
    local.current.clear();
    setRecords([]);
    setProgress(new Map());
    clearAnswers().catch(() => undefined);
  }

  const value = { records, getProgress, recordAnswer, resetQuestions, resetAll, importRecords };
  return <ProgressContext value={value}>{children}</ProgressContext>;
}

export function useProgress() {
  const value = use(ProgressContext);
  if (!value) throw new Error("useProgress вызван вне ProgressProvider");
  return value;
}
