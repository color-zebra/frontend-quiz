import { BUILTIN_SET_ID, type QuestionBank } from "../../data/types";
import { applyRecord, type AnswerRecord, type QuestionProgress } from "../progress/types";
import { ACHIEVEMENTS, type Achievement, type AchievementRule } from "./achievements";

export interface AchievementState {
  achievement: Achievement;
  /** Когда получена впервые; нет — ещё не получена. */
  earnedAt?: number;
  /** Сколько сделано к цели сейчас, от 0 до 1. */
  progress: number;
  /** Короткая подпись прогресса: «37 из 100», «41 % из 80 %». */
  progressLabel: string;
}

const isNight = (at: number) => new Date(at).getHours() < 5;
const isFridayEvening = (at: number) => new Date(at).getDay() === 5 && new Date(at).getHours() >= 18;

/**
 * Прокручивает ленту ответов основной базы по порядку: после каждой записи проверяет правила и запоминает, когда
 * ачивка получена впервые. Так серии и точность засчитываются, даже если потом были ошибки, а полученное раньше
 * появляется задним числом. Сброс статистики стирает ленту — и ачивки вместе с ней.
 */
export function getAchievements(bank: QuestionBank, records: readonly AnswerRecord[]): AchievementState[] {
  const topicOf = new Map(bank.questions.map((q) => [q.id, q.topic]));
  const topicTotals = new Map<string, number>();
  for (const q of bank.questions) topicTotals.set(q.topic, (topicTotals.get(q.topic) ?? 0) + 1);

  const progress = new Map<string, QuestionProgress>();
  const mastered = new Map<string, number>();
  // Последние ответы — верен или нет; хранится столько, сколько нужно самому широкому окну точности.
  const windowSize = Math.max(0, ...ACHIEVEMENTS.map((a) => (a.rule.kind === "accuracy" ? a.rule.window : 0)));
  const window: boolean[] = [];
  const counters = { answers: 0, streak: 0, bestStreak: 0, fixed: 0, gaveUp: 0, night: 0, friday: 0 };
  const earnedAt = new Map<string, number>();
  const isMastered = (p: QuestionProgress | undefined) => !!p && p.answered > 0 && !p.mistake;

  function getValue(rule: AchievementRule): { value: number; target: number } {
    switch (rule.kind) {
      case "topic": {
        const total = topicTotals.get(rule.topic) ?? 0;
        return { value: total ? (mastered.get(rule.topic) ?? 0) / total : 0, target: rule.share };
      }
      case "answers":
        return { value: counters.answers, target: rule.count };
      case "accuracy": {
        if (window.length < rule.window) return { value: 0, target: rule.share };
        return { value: window.slice(-rule.window).filter(Boolean).length / rule.window, target: rule.share };
      }
      case "streak":
        return { value: counters.bestStreak, target: rule.count };
      case "fixed":
        return { value: counters.fixed, target: rule.count };
      case "gaveUp":
        return { value: counters.gaveUp, target: rule.count };
      case "night":
        return { value: counters.night, target: rule.count };
      case "friday":
        return { value: counters.friday, target: rule.count };
    }
  }

  for (const record of records) {
    const topicId = topicOf.get(record.questionId);
    if (record.setId !== BUILTIN_SET_ID || !topicId) continue;

    const before = progress.get(record.questionId);
    const after = applyRecord(before, record);
    progress.set(record.questionId, after);
    if (isMastered(before) !== isMastered(after)) {
      mastered.set(topicId, (mastered.get(topicId) ?? 0) + (isMastered(after) ? 1 : -1));
    }
    if (record.reset) continue;

    counters.answers++;
    if (before?.mistake && !after.mistake) counters.fixed++;
    counters.streak = record.correct ? counters.streak + 1 : 0;
    counters.bestStreak = Math.max(counters.bestStreak, counters.streak);
    if (record.gaveUp) counters.gaveUp++;
    if (isNight(record.at)) counters.night++;
    if (isFridayEvening(record.at)) counters.friday++;
    window.push(!!record.correct);
    if (window.length > windowSize) window.shift();

    for (const achievement of ACHIEVEMENTS) {
      if (earnedAt.has(achievement.id)) continue;
      const { value, target } = getValue(achievement.rule);
      if (value >= target) earnedAt.set(achievement.id, record.at);
    }
  }

  return ACHIEVEMENTS.map((achievement) => {
    const { value, target } = getValue(achievement.rule);
    const rule = achievement.rule;
    // Пока ответов меньше окна точности, полоска показывает путь до него — так же, как подпись.
    const filling = rule.kind === "accuracy" && window.length < rule.window;
    return {
      achievement,
      earnedAt: earnedAt.get(achievement.id),
      progress: Math.min(1, filling ? window.length / rule.window : value / target),
      progressLabel: getProgressLabel(rule, value, window.length),
    };
  });
}

function getProgressLabel(rule: AchievementRule, value: number, answersInWindow: number) {
  switch (rule.kind) {
    case "topic":
      return `${Math.round(value * 100)} % из ${Math.round(rule.share * 100)} %`;
    case "accuracy":
      return answersInWindow < rule.window
        ? `${answersInWindow} из ${rule.window} ответов`
        : `${Math.round(value * 100)} % из ${Math.round(rule.share * 100)} %`;
    default:
      return `${value} из ${rule.count}`;
  }
}
