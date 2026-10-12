import { UNGROUPED, type Question, type QuestionBank } from "./types";

export function getTopicTitles(bank: QuestionBank, question: Question) {
  const topic = bank.topicById.get(question.topic);
  return {
    topicTitle: topic?.title ?? question.topic,
    subtopicTitle: topic?.subtopics.find((s) => s.id === question.subtopic)?.title ?? question.subtopic,
  };
}

/** «Тема · Подтема»; служебная группа «Все вопросы» у вопросов наборов без подтемы не показывается. */
export function formatTopicLine(topicTitle: string, subtopicTitle: string) {
  return subtopicTitle === UNGROUPED ? topicTitle : `${topicTitle} · ${subtopicTitle}`;
}
