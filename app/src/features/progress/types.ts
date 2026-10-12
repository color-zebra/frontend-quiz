import type { SpeechGrade } from "../session/session";

/**
 * Запись ленты ответов: ответ на вопрос или отметка «вопрос исправили в базе». Лента — всё, что было, по порядку:
 * из неё считаются ошибки и новые вопросы, а дальше — статистика и ачивки («90 % верных за последние 100»).
 */
export interface AnswerRecord {
  setId: string;
  questionId: string;
  /** Когда, мс с 1970 года. */
  at: number;
  /** Верен ли ответ. Нет у отметки об исправлении. */
  correct?: boolean;
  /** Самооценка устного ответа. */
  grade?: SpeechGrade;
  /** Вопрос исправили в базе: прежняя ошибка могла быть ошибкой самого вопроса и больше не считается. */
  reset?: true;
}

/** Сводка по вопросу, собранная из ленты. */
export interface QuestionProgress {
  /** Сколько раз отвечали. */
  answered: number;
  /** В списке ошибок. */
  mistake: boolean;
  /** Верных ответов подряд. */
  streak: number;
}

/** Сколько верных ответов подряд выводят вопрос из ошибок: один верный мог быть угадан. */
export const CORRECT_TO_CLEAR = 2;

const EMPTY: QuestionProgress = { answered: 0, mistake: false, streak: 0 };

export function getProgressKey(setId: string, questionId: string) {
  return `${setId}:${questionId}`;
}

/** Сводка после ещё одной записи ленты. */
export function applyRecord(progress: QuestionProgress = EMPTY, record: AnswerRecord): QuestionProgress {
  if (record.reset) return { ...progress, mistake: false, streak: 0 };
  if (!record.correct) return { answered: progress.answered + 1, mistake: true, streak: 0 };
  const streak = progress.streak + 1;
  return { answered: progress.answered + 1, mistake: progress.mistake && streak < CORRECT_TO_CLEAR, streak };
}

export function isAnswerRecord(value: unknown): value is AnswerRecord {
  const r = value as AnswerRecord | null;
  return (
    !!r &&
    typeof r.setId === "string" &&
    typeof r.questionId === "string" &&
    typeof r.at === "number" &&
    (typeof r.correct === "boolean" || r.reset === true)
  );
}
