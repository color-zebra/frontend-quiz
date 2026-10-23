import type { AnswerRecord } from "./types";

const DAY = 24 * 60 * 60 * 1000;

/**
 * Итоги на виду: сколько ответов, сколько верных и сколько дней подряд человек занимается — день считается, если
 * в нём был хоть один ответ; цепочка не рвётся, пока сегодня ещё не отвечал. И то же за последние 7 дней — для
 * карточки «Сегодня» на десктопе.
 */
export function getSummary(records: readonly AnswerRecord[]) {
  const answered = records.filter((r) => r.correct !== undefined);
  const correct = answered.filter((r) => r.correct).length;
  const dayKey = (at: number) => new Date(at).toDateString();
  const days = new Set(records.map((r) => dayKey(r.at)));
  const day = new Date();
  if (!days.has(dayKey(day.getTime()))) day.setDate(day.getDate() - 1);
  let streak = 0;
  while (days.has(dayKey(day.getTime()))) {
    streak++;
    day.setDate(day.getDate() - 1);
  }
  const weekAgo = Date.now() - 7 * DAY;
  const week = answered.filter((r) => r.at >= weekAgo);
  return {
    answers: answered.length,
    accuracy: answered.length ? Math.round((correct / answered.length) * 100) : 0,
    days: streak,
    weekAnswers: week.length,
    weekAccuracy: week.length ? Math.round((week.filter((r) => r.correct).length / week.length) * 100) : 0,
  };
}
