import type { QuestionBank } from "../../data/types";
import type { SpeechGrade } from "../session/session";
import type { AnswerRecord, QuestionProgress } from "./types";

/** Тема: сколько вопросов освоено, в ошибках и ещё не видено. */
export interface TopicStats {
  id: string;
  title: string;
  total: number;
  /** Отвечал, и вопрос не в ошибках. */
  mastered: number;
  /** В ошибках всего — вместе с почти исправленными. */
  mistakes: number;
  /** Из ошибок — «закрепить»: уже отвечены верно один раз. */
  almost: number;
  unseen: number;
}

/** Подтема с вопросами в ошибках — её можно сразу прорешать. */
export interface WeakSubtopic {
  key: string;
  topicTitle: string;
  subtopicTitle: string;
  questionIds: string[];
  /** «Закрепить»: уже отвечены верно один раз — ещё один верный ответ подряд, и уйдут из ошибок. */
  almost: number;
}

export interface BankStats {
  total: number;
  seen: number;
  /** Все ответы на тестовые вопросы: сколько и доля верных. */
  answers: { count: number; accuracy: number };
  /** Последние RECENT_ANSWERS ответов — когда ответов больше, чем столько. */
  recent: { count: number; accuracy: number } | null;
  /** От отстающих к освоенным. */
  topics: TopicStats[];
  weak: WeakSubtopic[];
  /** Устные вопросы по последней самооценке; null — на устные ещё не отвечали. */
  speech: Record<SpeechGrade, number> | null;
}

export const RECENT_ANSWERS = 100;
const WEAK_LIMIT = 5;

function getAccuracy(answers: readonly AnswerRecord[]) {
  return { count: answers.length, accuracy: answers.filter((r) => r.correct).length / Math.max(answers.length, 1) };
}

/** Статистика основной базы или набора по ленте ответов. */
export function getBankStats(
  bank: QuestionBank,
  records: readonly AnswerRecord[],
  getProgress: (questionId: string) => QuestionProgress | undefined,
): BankStats {
  const testIds = new Set(bank.questions.map((q) => q.id));
  const answers = records.filter((r) => r.setId === bank.setId && r.correct !== undefined && testIds.has(r.questionId));
  const isSeen = (id: string) => (getProgress(id)?.answered ?? 0) > 0;

  const topics = bank.topics
    .map((topic): TopicStats => {
      const questions = bank.questions.filter((q) => q.topic === topic.id);
      const mistakes = questions.filter((q) => getProgress(q.id)?.mistake).length;
      const almost = questions.filter((q) => getProgress(q.id)?.mistake && getProgress(q.id)!.streak > 0).length;
      const unseen = questions.filter((q) => !isSeen(q.id)).length;
      const mastered = questions.length - mistakes - unseen;
      return { id: topic.id, title: topic.title, total: questions.length, mastered, mistakes, almost, unseen };
    })
    .filter((t) => t.total > 0)
    // Отстающие сверху: меньше освоено, при равенстве — больше ошибок.
    .sort((a, b) => a.mastered / a.total - b.mastered / b.total || b.mistakes - a.mistakes);

  const bySubtopic = new Map<string, WeakSubtopic>();
  for (const question of bank.questions) {
    const progress = getProgress(question.id);
    if (!progress?.mistake) continue;
    const key = `${question.topic}/${question.subtopic}`;
    const topic = bank.topicById.get(question.topic);
    const weak = bySubtopic.get(key) ?? {
      key,
      topicTitle: topic?.title ?? question.topic,
      subtopicTitle: topic?.subtopics.find((s) => s.id === question.subtopic)?.title ?? question.subtopic,
      questionIds: [],
      almost: 0,
    };
    weak.questionIds.push(question.id);
    if (progress.streak > 0) weak.almost++;
    bySubtopic.set(key, weak);
  }
  const weak = [...bySubtopic.values()]
    .sort((a, b) => b.questionIds.length - a.questionIds.length)
    .slice(0, WEAK_LIMIT);

  // Устные — по последней самооценке каждого вопроса.
  const speechIds = new Set(bank.speech.map((q) => q.id));
  const lastGrade = new Map<string, SpeechGrade>();
  for (const r of records) {
    if (r.setId === bank.setId && r.grade && speechIds.has(r.questionId)) lastGrade.set(r.questionId, r.grade);
  }
  const grades = [...lastGrade.values()];
  const countGrade = (grade: SpeechGrade) => grades.filter((g) => g === grade).length;
  const speech = grades.length
    ? { knew: countGrade("knew"), partly: countGrade("partly"), didnt: countGrade("didnt") }
    : null;

  return {
    total: bank.questions.length,
    seen: bank.questions.filter((q) => isSeen(q.id)).length,
    answers: getAccuracy(answers),
    recent: answers.length > RECENT_ANSWERS ? getAccuracy(answers.slice(-RECENT_ANSWERS)) : null,
    topics,
    weak,
    speech,
  };
}
